/**
 * TileMap — 30×30 격자 데이터 + 렌더 + fog + 자원
 *
 * 관련 문서:
 * - GDD §4 (맵·영토), §5 (자원)
 * - IMPL_PLAN §2.1 (데이터 모델), 단계 1·3
 *
 * 책임:
 * - 타일 데이터(2D 배열) 소유·관리
 * - 타일 상태 렌더(Graphics)·격자선 토글
 * - 자원 타일 스폰 + 마커 렌더
 * - 좌표 변환 (tile ↔ pixel)·인접 탐색
 * - 타일 이벤트 발행 (`tile:stateChanged`)
 *
 * 자원 시각화: OWNED 타일에서만 마커 표시 (FOG는 숨김).
 */

import Phaser from 'phaser';
import { MAP_CONFIG, MAP_CENTER, MAP_PIXEL_SIZE, RESOURCE_CONFIG } from '../config';
import { ResourceType, TileState, type Tile } from '../types';

/** 타일 상태별 색상 — IMPL_PLAN 단계 1.4 */
const TILE_COLORS = {
  [TileState.OWNED]: 0x4a7c3a,
  [TileState.EXPLORED]: 0x666666,
  [TileState.FOG]: 0x333333,
} as const;

/** 자원 마커 색상 */
const RESOURCE_COLORS: Record<ResourceType, number> = {
  [ResourceType.WOOD]: 0x8b5a2b,
  [ResourceType.STONE]: 0xbbbbbb,
  [ResourceType.IRON]: 0x778899,
  [ResourceType.GOLD]: 0xffd700,
};

const GRID_LINE_COLOR = 0x000000;
const GRID_LINE_ALPHA = 0.25;

/** 4방향 인접 오프셋 */
const DIR4: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [0, 1],
  [-1, 0],
  [1, 0],
];

export class TileMap {
  private readonly scene: Phaser.Scene;
  private readonly tiles: Tile[][];
  private fillGraphics!: Phaser.GameObjects.Graphics;
  private resourceGraphics!: Phaser.GameObjects.Graphics;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private gridVisible: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.tiles = [];
    this.generateMap();
    this.spawnResources();
  }

  private generateMap(): void {
    const { size, initialRevealSize } = MAP_CONFIG;
    const half = Math.floor(initialRevealSize / 2);
    const { tileX: cx, tileY: cy } = MAP_CENTER;

    for (let y = 0; y < size; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < size; x++) {
        const inReveal =
          x >= cx - half && x <= cx + half && y >= cy - half && y <= cy + half;
        row.push({
          tileX: x,
          tileY: y,
          state: inReveal ? TileState.OWNED : TileState.FOG,
          resource: null,
          resourceAmount: 0,
          building: null,
        });
      }
      this.tiles.push(row);
    }
  }

  /**
   * 자원 타일 스폰 — IMPL_PLAN §3.2
   * 중앙 5×5(OWNED) 제외, 밀도(15%) 기준·최소 간격 2칸
   * Phase 1: WOOD/STONE 1:1
   */
  private spawnResources(): void {
    const { size } = MAP_CONFIG;
    const candidates: Tile[] = [];
    for (const row of this.tiles) {
      for (const tile of row) {
        if (tile.state !== TileState.OWNED) candidates.push(tile);
      }
    }

    // Fisher-Yates shuffle
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j]!, candidates[i]!];
    }

    const target = Math.floor(size * size * RESOURCE_CONFIG.spawnDensity);
    const minGap = RESOURCE_CONFIG.minSpawnGapTiles;
    const minGapSq = minGap * minGap;
    const picked: Tile[] = [];

    for (const tile of candidates) {
      if (picked.length >= target) break;
      const tooClose = picked.some((p) => {
        const dx = p.tileX - tile.tileX;
        const dy = p.tileY - tile.tileY;
        return dx * dx + dy * dy < minGapSq;
      });
      if (tooClose) continue;
      picked.push(tile);
    }

    for (let i = 0; i < picked.length; i++) {
      const tile = picked[i]!;
      tile.resource =
        i % 2 === 0 ? ResourceType.WOOD : ResourceType.STONE;
      tile.resourceAmount = RESOURCE_CONFIG.initialResourcePerTile;
    }
  }

  render(): void {
    this.fillGraphics = this.scene.add.graphics();
    this.resourceGraphics = this.scene.add.graphics().setDepth(1);
    this.gridGraphics = this.scene.add.graphics().setDepth(2);
    this.redrawFills();
    this.redrawResourceMarkers();
    this.redrawGrid();
  }

  private redrawFills(): void {
    const { tileSize } = MAP_CONFIG;
    this.fillGraphics.clear();

    for (const row of this.tiles) {
      for (const tile of row) {
        this.fillGraphics.fillStyle(TILE_COLORS[tile.state], 1);
        this.fillGraphics.fillRect(
          tile.tileX * tileSize,
          tile.tileY * tileSize,
          tileSize,
          tileSize
        );
      }
    }
  }

  /** OWNED 타일의 자원만 마커(원)로 표시. FOG는 숨김 */
  private redrawResourceMarkers(): void {
    const { tileSize } = MAP_CONFIG;
    const r = Math.floor(tileSize * 0.28);
    this.resourceGraphics.clear();

    for (const row of this.tiles) {
      for (const tile of row) {
        if (tile.state !== TileState.OWNED) continue;
        if (!tile.resource || tile.resourceAmount <= 0) continue;
        const cx = tile.tileX * tileSize + tileSize / 2;
        const cy = tile.tileY * tileSize + tileSize / 2;
        this.resourceGraphics.fillStyle(RESOURCE_COLORS[tile.resource], 1);
        this.resourceGraphics.fillCircle(cx, cy, r);
      }
    }
  }

  private redrawGrid(): void {
    this.gridGraphics.clear();
    if (!this.gridVisible) return;

    const { size, tileSize } = MAP_CONFIG;
    this.gridGraphics.lineStyle(1, GRID_LINE_COLOR, GRID_LINE_ALPHA);

    for (let i = 0; i <= size; i++) {
      const p = i * tileSize;
      this.gridGraphics.lineBetween(p, 0, p, MAP_PIXEL_SIZE);
      this.gridGraphics.lineBetween(0, p, MAP_PIXEL_SIZE, p);
    }
  }

  toggleGrid(): void {
    this.gridVisible = !this.gridVisible;
    this.redrawGrid();
  }

  getTile(tileX: number, tileY: number): Tile | null {
    if (
      tileX < 0 ||
      tileY < 0 ||
      tileX >= MAP_CONFIG.size ||
      tileY >= MAP_CONFIG.size
    ) {
      return null;
    }
    return this.tiles[tileY]![tileX]!;
  }

  /** 4방향 인접 중 OWNED 존재 여부 — 확장 조건 체크용 */
  hasOwnedAdjacent(tileX: number, tileY: number): boolean {
    for (const [dx, dy] of DIR4) {
      const t = this.getTile(tileX + dx, tileY + dy);
      if (t && t.state === TileState.OWNED) return true;
    }
    return false;
  }

  /**
   * 채집 가능 타일 탐색 — 플레이어 위치 + 4방향
   * OWNED + 자원 남아있음 조건
   */
  findCollectibleNear(tileX: number, tileY: number): Tile | null {
    const offsets: ReadonlyArray<readonly [number, number]> = [
      [0, 0],
      ...DIR4,
    ];
    for (const [dx, dy] of offsets) {
      const t = this.getTile(tileX + dx, tileY + dy);
      if (
        t &&
        t.state === TileState.OWNED &&
        t.resource &&
        t.resourceAmount > 0
      ) {
        return t;
      }
    }
    return null;
  }

  /** 상태 변경 + 이벤트 발행 + 리드로우 */
  setTileState(tileX: number, tileY: number, state: TileState): void {
    const tile = this.getTile(tileX, tileY);
    if (!tile || tile.state === state) return;

    const oldState = tile.state;
    tile.state = state;

    const { tileSize } = MAP_CONFIG;
    this.fillGraphics.fillStyle(TILE_COLORS[state], 1);
    this.fillGraphics.fillRect(
      tileX * tileSize,
      tileY * tileSize,
      tileSize,
      tileSize
    );
    // OWNED 진입/이탈 시 자원 마커 다시 그림
    this.redrawResourceMarkers();

    this.scene.events.emit('tile:stateChanged', {
      tileX,
      tileY,
      oldState,
      newState: state,
    });
  }

  /**
   * 자원 채집량 감소. 0 이하로 떨어지면 resource null 전환.
   * 반환: 실제 감소된 양
   */
  decrementResource(tile: Tile, amount: number): number {
    if (!tile.resource || tile.resourceAmount <= 0) return 0;
    const taken = Math.min(amount, tile.resourceAmount);
    tile.resourceAmount -= taken;
    if (tile.resourceAmount <= 0) {
      tile.resource = null;
      tile.resourceAmount = 0;
    }
    this.redrawResourceMarkers();
    return taken;
  }

  tileToPixel(tileX: number, tileY: number): { x: number; y: number } {
    const { tileSize } = MAP_CONFIG;
    return {
      x: tileX * tileSize + tileSize / 2,
      y: tileY * tileSize + tileSize / 2,
    };
  }

  pixelToTile(x: number, y: number): { tileX: number; tileY: number } {
    const { tileSize } = MAP_CONFIG;
    return {
      tileX: Math.floor(x / tileSize),
      tileY: Math.floor(y / tileSize),
    };
  }
}
