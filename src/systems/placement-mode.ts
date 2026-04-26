/**
 * PlacementMode — 건물 배치 미리보기 + 좌클릭 배치 / 우클릭·ESC 취소
 *
 * 관련 문서:
 * - IMPL_PLAN §7.4 배치 모드
 *
 * 흐름:
 * 1. BuildMenu 카드 클릭 → `enter(type)` — 반투명 고스트 렌더 시작
 * 2. 마우스 이동 → 커서 아래 타일에 고스트 이동 (유효 녹색 / 무효 빨강)
 * 3. 좌클릭:
 *    - 유효 → BuildingSystem.placeBuilding → 자원 부족 시 UI 피드백 후 모드 유지
 * 4. 우클릭 or ESC → exit()
 * 5. BUILD 페이즈 종료 시 자동 exit
 */

import Phaser from 'phaser';
import { GAME_CONFIG, MAP_CONFIG } from '../config';
import { BuildingType } from '../types';
import { BUILDING_COLORS } from '../entities/building';
import type { TileMap } from './tile-map';
import type { BuildingSystem } from './building-system';

export class PlacementMode {
  private readonly scene: Phaser.Scene;
  private readonly tileMap: TileMap;
  private readonly buildings: BuildingSystem;
  private readonly ghost: Phaser.GameObjects.Rectangle;
  private activeType: BuildingType | null = null;

  constructor(scene: Phaser.Scene, tileMap: TileMap, buildings: BuildingSystem) {
    this.scene = scene;
    this.tileMap = tileMap;
    this.buildings = buildings;

    const size = Math.floor(MAP_CONFIG.tileSize * 0.85);
    this.ghost = scene.add.rectangle(0, 0, size, size, 0xffffff, 0.45);
    this.ghost.setStrokeStyle(2, 0xffffff, 0.8);
    this.ghost.setDepth(15);
    this.ghost.setVisible(false);

    scene.input.on('pointermove', (p: Phaser.Input.Pointer) =>
      this.handleMove(p)
    );
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) =>
      this.handleClick(p)
    );

    const esc = scene.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC
    );
    esc?.on('down', () => this.exit());

    // NIGHT 진입 시만 배치 모드 자동 취소. DAY·BUILD 둘 다 건설 허용 (재설계).
    scene.events.on('phase:nightStart', () => this.exit());
  }

  enter(type: BuildingType): void {
    this.activeType = type;
    this.ghost.setFillStyle(BUILDING_COLORS[type], 0.5);
    this.ghost.setVisible(true);
  }

  exit(): void {
    this.activeType = null;
    this.ghost.setVisible(false);
  }

  isActive(): boolean {
    return this.activeType !== null;
  }

  getActiveType(): BuildingType | null {
    return this.activeType;
  }

  private handleMove(p: Phaser.Input.Pointer): void {
    if (!this.activeType) return;
    const { tileX, tileY } = this.tileMap.pixelToTile(p.worldX, p.worldY);
    const tile = this.tileMap.getTile(tileX, tileY);
    if (!tile) {
      this.ghost.setVisible(false);
      return;
    }
    this.ghost.setVisible(true);
    const { x, y } = this.tileMap.tileToPixel(tileX, tileY);
    this.ghost.setPosition(x, y);

    const chk = this.buildings.check(this.activeType, tileX, tileY);
    this.ghost.setStrokeStyle(2, chk.ok ? 0x44ff44 : 0xff4444, 0.9);
  }

  private handleClick(p: Phaser.Input.Pointer): void {
    if (!this.activeType) return;
    // UI 상단/하단 영역 클릭은 메뉴·버튼이 처리하므로 무시
    if (p.y < GAME_CONFIG.ui.topZoneHeight) return;
    if (p.y > this.scene.game.canvas.height - GAME_CONFIG.ui.bottomZoneHeight) return;

    // 우클릭이면 취소
    if (p.rightButtonDown()) {
      this.exit();
      return;
    }

    const { tileX, tileY } = this.tileMap.pixelToTile(p.worldX, p.worldY);
    const placed = this.buildings.placeBuilding(this.activeType, tileX, tileY);
    if (placed) {
      // Phase 1: 연속 배치 가능 (계속 모드 유지). 추후 UX 피드백 받아 수정.
    }
  }
}
