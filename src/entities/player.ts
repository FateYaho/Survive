/**
 * Player — 플레이어 캐릭터
 *
 * 관련 문서:
 * - GDD §3 (플레이어 캐릭터)
 * - IMPL_PLAN §2.2, 단계 2 (티켓 2.1~2.6)
 *
 * 책임:
 * - 위치·HP·인벤토리 상태 소유 (PlayerState)
 * - WASD/화살표 입력 → 이동 (대각선 정규화)
 * - 맵 경계 clamp
 * - 타일 경계 넘을 때만 `player:moved`·`tile:entered` 이벤트 발행
 *
 * 단계 2 범위: 이동·경계·이벤트만. 전투·다운은 단계 6.
 */

import Phaser from 'phaser';
import {
  COMBAT_CONFIG,
  MAP_CENTER,
  MAP_PIXEL_SIZE,
  PLAYER_CONFIG,
  RESOURCE_CONFIG,
} from '../config';
import {
  createEmptyInventory,
  ResourceType,
  type PlayerState,
} from '../types';
import type { TileMap } from '../systems/tile-map';

type WasdKeys = {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
};

export class Player {
  private readonly scene: Phaser.Scene;
  private readonly tileMap: TileMap;
  private readonly sprite: Phaser.GameObjects.Rectangle;
  private readonly state: PlayerState;

  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly wasd: WasdKeys;

  private lastTileX: number;
  private lastTileY: number;

  constructor(
    scene: Phaser.Scene,
    tileMap: TileMap,
    startTileX: number = MAP_CENTER.tileX,
    startTileY: number = MAP_CENTER.tileY
  ) {
    this.scene = scene;
    this.tileMap = tileMap;

    const { x: startX, y: startY } = tileMap.tileToPixel(startTileX, startTileY);

    const inventory = createEmptyInventory();
    for (const [k, v] of Object.entries(RESOURCE_CONFIG.startingInventory)) {
      if (v !== undefined) inventory[k as ResourceType] = v;
    }

    this.state = {
      pixelX: startX,
      pixelY: startY,
      hp: PLAYER_CONFIG.initialHp,
      maxHp: PLAYER_CONFIG.maxHp,
      inventory,
      isDown: false,
      downTimer: 0,
      facing: 'down',
    };

    this.sprite = scene.add.rectangle(
      startX,
      startY,
      PLAYER_CONFIG.sprite.width,
      PLAYER_CONFIG.sprite.height,
      PLAYER_CONFIG.sprite.initialColor
    );
    this.sprite.setDepth(10);

    const keyboard = scene.input.keyboard!;
    this.cursors = keyboard.createCursorKeys();
    this.wasd = {
      W: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.lastTileX = startTileX;
    this.lastTileY = startTileY;

    // 스폰 시점 주변 공개 (초기 5×5 OWNED 너머의 EXPLORED 영역 드러냄)
    this.tileMap.revealAround(
      startTileX,
      startTileY,
      PLAYER_CONFIG.visionRadiusTiles
    );
  }

  update(_time: number, delta: number): void {
    if (this.state.isDown) return;

    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

    if (vx === 0 && vy === 0) return;

    // 대각선 정규화 (직선과 같은 속도)
    const mag = Math.hypot(vx, vy);
    vx /= mag;
    vy /= mag;

    const dist = PLAYER_CONFIG.moveSpeed * (delta / 1000);
    let nextX = this.state.pixelX + vx * dist;
    let nextY = this.state.pixelY + vy * dist;

    // 맵 경계 clamp (스프라이트 반쪽만큼 여백)
    const halfW = PLAYER_CONFIG.sprite.width / 2;
    const halfH = PLAYER_CONFIG.sprite.height / 2;
    nextX = Phaser.Math.Clamp(nextX, halfW, MAP_PIXEL_SIZE - halfW);
    nextY = Phaser.Math.Clamp(nextY, halfH, MAP_PIXEL_SIZE - halfH);

    this.state.pixelX = nextX;
    this.state.pixelY = nextY;
    this.sprite.setPosition(nextX, nextY);

    // facing (최대 축 기준)
    if (Math.abs(vx) >= Math.abs(vy)) {
      this.state.facing = vx < 0 ? 'left' : 'right';
    } else {
      this.state.facing = vy < 0 ? 'up' : 'down';
    }

    // 타일 경계 넘을 때만 이벤트 발행 + 시야 반경 업데이트
    const { tileX, tileY } = this.tileMap.pixelToTile(nextX, nextY);
    if (tileX !== this.lastTileX || tileY !== this.lastTileY) {
      this.lastTileX = tileX;
      this.lastTileY = tileY;
      this.tileMap.revealAround(tileX, tileY, PLAYER_CONFIG.visionRadiusTiles);
      this.scene.events.emit('tile:entered', { tileX, tileY });
      this.scene.events.emit('player:moved', {
        pixelX: nextX,
        pixelY: nextY,
      });
    }
  }

  getSprite(): Phaser.GameObjects.Rectangle {
    return this.sprite;
  }

  getState(): Readonly<PlayerState> {
    return this.state;
  }

  getTilePosition(): { tileX: number; tileY: number } {
    return { tileX: this.lastTileX, tileY: this.lastTileY };
  }

  getPosition(): { pixelX: number; pixelY: number } {
    return { pixelX: this.state.pixelX, pixelY: this.state.pixelY };
  }

  isAlive(): boolean {
    return !this.state.isDown;
  }

  /** 피격 처리 — GDD §3.3 v1.1 다운+부활 (C안) */
  takeDamage(amount: number): void {
    if (this.state.isDown) return;
    this.state.hp = Math.max(0, this.state.hp - amount);

    // 빨간 틴트 플래시
    this.sprite.setFillStyle(0xff4444);
    this.scene.time.delayedCall(COMBAT_CONFIG.damageFlashMs, () => {
      if (!this.state.isDown) {
        this.sprite.setFillStyle(PLAYER_CONFIG.sprite.initialColor);
      }
    });

    this.scene.events.emit('player:damaged', {
      amount,
      remainingHp: this.state.hp,
    });

    if (this.state.hp <= 0) this.enterDown();
  }

  private enterDown(): void {
    this.state.isDown = true;
    this.state.downTimer = PLAYER_CONFIG.downTimerSeconds;
    this.sprite.setFillStyle(0x666666); // 회색 (다운 상태)
    this.scene.events.emit('player:downed', {
      timerSeconds: this.state.downTimer,
    });

    this.scene.time.delayedCall(
      PLAYER_CONFIG.downTimerSeconds * 1000,
      () => this.revive()
    );
  }

  private revive(): void {
    this.state.isDown = false;
    this.state.downTimer = 0;
    this.state.hp = this.state.maxHp;
    this.sprite.setFillStyle(PLAYER_CONFIG.sprite.initialColor);
    this.scene.events.emit('player:revived', {});
  }

  /** 자원 추가 (채집 완료 시). `resource:collected` 이벤트 발행 */
  addResource(type: ResourceType, amount: number): void {
    if (amount <= 0) return;
    this.state.inventory[type] += amount;
    this.scene.events.emit('resource:collected', { type, amount });
  }

  /**
   * 비용 지불 시도. 부족하면 false + `resource:insufficient` 이벤트.
   * 충분하면 차감 후 true + `resource:spent` 이벤트.
   */
  trySpend(cost: Partial<Record<ResourceType, number>>): boolean {
    for (const [k, v] of Object.entries(cost)) {
      if (v === undefined) continue;
      const have = this.state.inventory[k as ResourceType];
      if (have < v) {
        this.scene.events.emit('resource:insufficient', {
          type: k as ResourceType,
          required: v,
          have,
        });
        return false;
      }
    }
    for (const [k, v] of Object.entries(cost)) {
      if (v !== undefined) this.state.inventory[k as ResourceType] -= v;
    }
    this.scene.events.emit('resource:spent', { cost });
    return true;
  }
}
