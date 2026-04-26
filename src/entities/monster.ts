/**
 * Monster — 밤에 스폰되어 코어/플레이어를 공격하는 적
 *
 * 관련 문서:
 * - GDD §10 (몬스터), §10.4 (타깃팅 3주체 규칙), §15.3 (스탯)
 * - IMPL_PLAN §2.3, 단계 5·6
 *
 * Phase 1 MVP:
 * - 단계 5: 직선 이동만
 * - 단계 6 (현재): 타깃 락킹(player|core) + 근접 공격 + 피격 틴트 플래시
 *
 * 타깃 락킹 (GDD §10.4 단순화):
 * - 최초 update: 살아있는 대상 중 가까운 것으로 고정
 * - 타깃 사망 시에만 재탐색 (매 프레임 탐색 X → 지그재그 방지)
 * - Phase 2+: 영토 경계 진입 시점 고정으로 강화
 */

import Phaser from 'phaser';
import { COMBAT_CONFIG, MONSTER_CONFIG } from '../config';
import {
  AttackPattern,
  MonsterType,
  MovePattern,
  ResourceType,
  type MonsterState,
} from '../types';
import type { Player } from './player';
import type { Core } from './core';
import type { TileMap } from '../systems/tile-map';
import type { BuildingSystem } from '../systems/building-system';

const WOLF_COLOR = 0xff5555;
const WOLF_SLOW_COLOR = 0x88aaff; // 슬로우 적용 시 시각 피드백 (옅은 청색)
const WOLF_SIZE = 14;
const EPS = 0.5;

let nextMonsterId = 1;

type TargetKind = 'player' | 'core';

export class Monster {
  private readonly scene: Phaser.Scene;
  private readonly state: MonsterState;
  private readonly sprite: Phaser.GameObjects.Rectangle;
  private readonly player: Player;
  private readonly core: Core;
  private readonly tileMap: TileMap;
  private readonly buildings: BuildingSystem | null;
  private readonly attackRange: number;
  private target: TargetKind | null = null;
  private destroyed = false;
  /** 현재 적용된 슬로우 배율 (1 = 정상). 동시 다중 슬로우는 가장 강한 것(낮은 factor) 우선. */
  private slowFactor: number = 1;
  private slowExpiresAt: number = 0;
  /** 데미지 플래시 중인지 (슬로우 색상 덮어쓰기 방지) */
  private isFlashing: boolean = false;

  constructor(
    scene: Phaser.Scene,
    type: MonsterType,
    spawnPixelX: number,
    spawnPixelY: number,
    player: Player,
    core: Core,
    tileMap: TileMap,
    buildings: BuildingSystem | null = null
  ) {
    this.scene = scene;
    this.player = player;
    this.core = core;
    this.tileMap = tileMap;
    this.buildings = buildings;

    const cfg = MONSTER_CONFIG[type as MonsterType.WOLF];
    this.attackRange = cfg.attackRange;

    this.state = {
      id: `m${nextMonsterId++}`,
      type,
      pixelX: spawnPixelX,
      pixelY: spawnPixelY,
      hp: cfg.hp,
      maxHp: cfg.hp,
      movePattern: cfg.movePattern as MovePattern,
      attackPattern: cfg.attackPattern as AttackPattern,
      currentTarget: null,
      moveSpeed: cfg.moveSpeed,
      attackPower: cfg.attackPower,
      attackCooldownMs: cfg.attackCooldownMs,
      lastAttackTime: 0,
    };

    this.sprite = scene.add.rectangle(
      spawnPixelX,
      spawnPixelY,
      WOLF_SIZE,
      WOLF_SIZE,
      WOLF_COLOR
    );
    this.sprite.setDepth(8);

    scene.events.emit('monster:spawned', { monster: this.state });
  }

  update(time: number, delta: number): void {
    if (this.destroyed) return;

    // 슬로우 만료 정리 + 시각 갱신
    this.refreshSlow(time);

    // 1) 타깃 선정 / 재선정
    if (!this.isTargetValid()) {
      this.target = this.pickTarget();
    }
    if (!this.target) return; // 살아있는 타깃 없음 (core 파괴 + player 다운)

    const tpos = this.targetPosition();
    const dx = tpos.pixelX - this.state.pixelX;
    const dy = tpos.pixelY - this.state.pixelY;
    const dist = Math.hypot(dx, dy);

    // 2) 공격 거리 내면 공격, 밖이면 이동
    if (dist <= this.attackRange) {
      this.tryAttack(time);
    } else if (dist > EPS) {
      const step = this.state.moveSpeed * this.slowFactor * (delta / 1000);
      const move = Math.min(step, dist);
      const nx = this.state.pixelX + (dx / dist) * move;
      const ny = this.state.pixelY + (dy / dist) * move;

      // 벽·건물 블로킹: 길을 막은 건물 공격 (Phase 1 단순화)
      const nextTile = this.tileMap.pixelToTile(nx, ny);
      const tile = this.tileMap.getTile(nextTile.tileX, nextTile.tileY);
      if (tile && tile.building !== null) {
        this.tryAttackBuilding(time, nextTile.tileX, nextTile.tileY);
        return;
      }

      this.state.pixelX = nx;
      this.state.pixelY = ny;
      this.sprite.setPosition(nx, ny);
    }
  }

  private tryAttackBuilding(time: number, tileX: number, tileY: number): void {
    if (!this.buildings) return;
    const b = this.buildings.getBuildingAt(tileX, tileY);
    if (!b || !b.isAlive()) return;
    if (time - this.state.lastAttackTime < this.state.attackCooldownMs) return;
    this.state.lastAttackTime = time;
    b.takeDamage(this.state.attackPower);
    this.scene.events.emit('combat:damage', {
      target: b.getState().id,
      amount: this.state.attackPower,
      source: this.state.id,
    });
  }

  private isTargetValid(): boolean {
    if (this.target === 'player') return this.player.isAlive();
    if (this.target === 'core') return this.core.isAlive();
    return false;
  }

  private pickTarget(): TargetKind | null {
    const candidates: Array<{ kind: TargetKind; distSq: number }> = [];
    if (this.player.isAlive()) {
      const p = this.player.getPosition();
      candidates.push({
        kind: 'player',
        distSq:
          (p.pixelX - this.state.pixelX) ** 2 +
          (p.pixelY - this.state.pixelY) ** 2,
      });
    }
    if (this.core.isAlive()) {
      const c = this.core.getPosition();
      candidates.push({
        kind: 'core',
        distSq:
          (c.pixelX - this.state.pixelX) ** 2 +
          (c.pixelY - this.state.pixelY) ** 2,
      });
    }
    if (candidates.length === 0) return null;
    candidates.sort((a, b) => a.distSq - b.distSq);
    return candidates[0]!.kind;
  }

  private targetPosition(): { pixelX: number; pixelY: number } {
    return this.target === 'player'
      ? this.player.getPosition()
      : this.core.getPosition();
  }

  private tryAttack(time: number): void {
    if (time - this.state.lastAttackTime < this.state.attackCooldownMs) return;
    this.state.lastAttackTime = time;

    if (this.target === 'player') {
      this.player.takeDamage(this.state.attackPower);
    } else if (this.target === 'core') {
      this.core.takeDamage(this.state.attackPower);
    }

    this.scene.events.emit('combat:damage', {
      target: this.target,
      amount: this.state.attackPower,
      source: this.state.id,
    });
  }

  getState(): Readonly<MonsterState> {
    return this.state;
  }

  getSprite(): Phaser.GameObjects.Rectangle {
    return this.sprite;
  }

  getPosition(): { pixelX: number; pixelY: number } {
    return { pixelX: this.state.pixelX, pixelY: this.state.pixelY };
  }

  isAlive(): boolean {
    return !this.destroyed && this.state.hp > 0;
  }

  takeDamage(amount: number): void {
    if (this.destroyed) return;
    this.state.hp -= amount;

    // 흰 플래시 → 끝나면 슬로우 상태에 맞게 베이스 색상 복원
    this.isFlashing = true;
    this.sprite.setFillStyle(0xffffff);
    this.scene.time.delayedCall(COMBAT_CONFIG.damageFlashMs, () => {
      this.isFlashing = false;
      if (!this.destroyed) this.applyBaseColor();
    });

    if (this.state.hp <= 0) this.destroy();
  }

  /**
   * 슬로우 적용 — 더 강한 슬로우(낮은 factor) 우선, 만료시각은 항상 갱신.
   * Phase 2 step 3에서 도입 (특수 터렛 — 발리스타·회전 가시).
   */
  applySlow(slow: { factor: number; durationMs: number }, currentTime: number): void {
    if (this.destroyed) return;
    const expired = currentTime >= this.slowExpiresAt;
    if (expired || slow.factor < this.slowFactor) {
      this.slowFactor = slow.factor;
    }
    const newExpiry = currentTime + slow.durationMs;
    if (newExpiry > this.slowExpiresAt) {
      this.slowExpiresAt = newExpiry;
    }
    if (!this.isFlashing) this.applyBaseColor();
  }

  private refreshSlow(time: number): void {
    if (this.slowFactor !== 1 && time >= this.slowExpiresAt) {
      this.slowFactor = 1;
      this.slowExpiresAt = 0;
      if (!this.isFlashing) this.applyBaseColor();
    }
  }

  private applyBaseColor(): void {
    const slowed = this.slowFactor < 1;
    this.sprite.setFillStyle(slowed ? WOLF_SLOW_COLOR : WOLF_COLOR);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    const pos = { pixelX: this.state.pixelX, pixelY: this.state.pixelY };
    this.sprite.destroy();

    // 드롭 처리 — Phase 1: 플레이어 인벤토리에 자동 지급 + 플로팅 텍스트
    this.applyDrop(pos);

    this.scene.events.emit('monster:died', {
      monsterId: this.state.id,
      dropLocation: pos,
    });
  }

  private applyDrop(pos: { pixelX: number; pixelY: number }): void {
    const drop = MONSTER_CONFIG[this.state.type as MonsterType.WOLF].drop;
    if (!drop) return;
    const wood = drop.wood ?? 0;
    const stone = drop.stone ?? 0;
    if (wood > 0) this.player.addResource(ResourceType.WOOD, wood);
    if (stone > 0) this.player.addResource(ResourceType.STONE, stone);

    const parts: string[] = [];
    if (wood > 0) parts.push(`+${wood}W`);
    if (stone > 0) parts.push(`+${stone}S`);
    if (parts.length === 0) return;

    const txt = this.scene.add
      .text(pos.pixelX, pos.pixelY, parts.join('  '), {
        fontSize: '12px',
        color: '#ffee66',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(25);
    this.scene.tweens.add({
      targets: txt,
      y: pos.pixelY - 24,
      alpha: 0,
      duration: 800,
      onComplete: () => txt.destroy(),
    });
  }
}
