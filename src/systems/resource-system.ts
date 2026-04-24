/**
 * ResourceSystem — 자원 채집 + 영토 확장
 *
 * 관련 문서:
 * - GDD §5 (자원), §4.5 (확장)
 * - IMPL_PLAN 단계 3
 *
 * 책임:
 * - F 키 홀드 → 타일 채집 타이머
 * - 마우스 클릭 → 인접 OWNED 타일에서 FOG 해금
 * - 이벤트 발행: `resource:collected`, `resource:insufficient`, `tile:unlocked`
 */

import Phaser from 'phaser';
import { RESOURCE_CONFIG } from '../config';
import { PhaseType, ResourceType, TileState, type Tile } from '../types';
import type { TileMap } from './tile-map';
import type { Player } from '../entities/player';

export class ResourceSystem {
  private readonly scene: Phaser.Scene;
  private readonly tileMap: TileMap;
  private readonly player: Player;
  private readonly fKey: Phaser.Input.Keyboard.Key;

  private collectingTile: Tile | null = null;
  private collectTimerMs: number = 0;
  private currentPhase: PhaseType = PhaseType.DAY;

  constructor(scene: Phaser.Scene, tileMap: TileMap, player: Player) {
    this.scene = scene;
    this.tileMap = tileMap;
    this.player = player;
    this.fKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // 이동으로 타일 경계 넘으면 채집 취소 (IMPL_PLAN §3.4)
    scene.events.on('tile:entered', () => this.cancelCollection());

    // 페이즈 추적: DAY에만 채집·확장 허용
    scene.events.on('phase:dayStart', () => (this.currentPhase = PhaseType.DAY));
    scene.events.on('phase:nightStart', () => {
      this.currentPhase = PhaseType.NIGHT;
      this.cancelCollection();
    });
    scene.events.on('phase:buildStart', () => {
      this.currentPhase = PhaseType.BUILD;
      this.cancelCollection();
    });

    scene.input.on(
      'pointerdown',
      (pointer: Phaser.Input.Pointer) => this.handleClick(pointer)
    );
  }

  update(_time: number, delta: number): void {
    if (this.currentPhase !== PhaseType.DAY) {
      this.cancelCollection();
      return;
    }
    if (!this.fKey.isDown) {
      this.cancelCollection();
      return;
    }

    if (!this.collectingTile) {
      const { tileX, tileY } = this.player.getTilePosition();
      const target = this.tileMap.findCollectibleNear(tileX, tileY);
      if (!target) return;
      this.collectingTile = target;
      this.collectTimerMs = 0;
    }

    // 타깃 여전히 유효한지 (플레이어가 멀어지거나 고갈 가능)
    const tile = this.collectingTile;
    if (!tile.resource || tile.resourceAmount <= 0) {
      this.cancelCollection();
      return;
    }
    const { tileX: px, tileY: py } = this.player.getTilePosition();
    const dx = Math.abs(tile.tileX - px);
    const dy = Math.abs(tile.tileY - py);
    if (dx + dy > 1) {
      this.cancelCollection();
      return;
    }

    this.collectTimerMs += delta;
    const needed = RESOURCE_CONFIG.collectTimeMs[tile.resource];
    if (this.collectTimerMs >= needed) {
      const amount = RESOURCE_CONFIG.collectAmount[tile.resource];
      const taken = this.tileMap.decrementResource(tile, amount);
      if (taken > 0) this.player.addResource(tile.resource ?? tile.resource!, taken);
      this.collectTimerMs = 0;
      // 고갈되면 타일 리셋 (resource가 null이 됨) → 다음 update에서 cancelCollection
    }
  }

  private cancelCollection(): void {
    if (this.collectingTile || this.collectTimerMs > 0) {
      this.collectingTile = null;
      this.collectTimerMs = 0;
    }
  }

  /** 채집 진행률 0~1 (UI 피드백용) */
  getCollectionProgress(): { tile: Tile; progress: number } | null {
    if (!this.collectingTile || !this.collectingTile.resource) return null;
    const needed =
      RESOURCE_CONFIG.collectTimeMs[this.collectingTile.resource];
    return {
      tile: this.collectingTile,
      progress: Math.min(1, this.collectTimerMs / needed),
    };
  }

  /** 클릭 → 확장 시도 (DAY 페이즈만). UI 영역 클릭은 스킵. */
  private handleClick(pointer: Phaser.Input.Pointer): void {
    if (this.currentPhase !== PhaseType.DAY) return;
    // 상단 UI zone (PhaseTimer/DevSkipButton) / 하단 UI zone (ReadyButton)
    if (pointer.y < 48) return;
    const { tileX, tileY } = this.tileMap.pixelToTile(
      pointer.worldX,
      pointer.worldY
    );
    const tile = this.tileMap.getTile(tileX, tileY);
    if (!tile) return;

    // 이미 내 영토
    if (tile.state === TileState.OWNED) return;

    // 인접 4방향에 OWNED 있어야 함 (대각선 불가)
    if (!this.tileMap.hasOwnedAdjacent(tileX, tileY)) return;

    const cost: Partial<Record<ResourceType, number>> = {
      [ResourceType.WOOD]: RESOURCE_CONFIG.expansionCost.WOOD,
      [ResourceType.STONE]: RESOURCE_CONFIG.expansionCost.STONE,
    };
    const paid = this.player.trySpend(cost);
    if (!paid) return;

    this.tileMap.setTileState(tileX, tileY, TileState.OWNED);
    this.scene.events.emit('tile:unlocked', { tileX, tileY, cost });
  }
}
