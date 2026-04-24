/**
 * BuildingSystem — 건물·벽·터렛 배치·파괴·업데이트
 *
 * 관련 문서:
 * - GDD §6 (건물), §10.4 (타깃팅)
 * - IMPL_PLAN §7.2, 단계 7
 *
 * 책임:
 * - placeBuilding: 배치 조건 검증 + 자원 차감 + 인스턴스 생성 + tile.building 세팅
 * - 매 프레임 update: 터렛들 update 라우팅
 * - `building:destroyed` 구독 → 인덱스·tile.building 정리
 */

import Phaser from 'phaser';
import { BUILDING_CONFIG } from '../config';
import {
  BuildingType,
  TileState,
  type ResourceType,
} from '../types';
import { Building } from '../entities/building';
import { Turret } from '../entities/turret';
import type { TileMap } from './tile-map';
import type { Player } from '../entities/player';
import type { WaveSpawner } from './wave-spawner';

export interface PlacementCheck {
  ok: boolean;
  reason?: 'not_owned' | 'occupied' | 'insufficient';
}

export class BuildingSystem {
  private readonly scene: Phaser.Scene;
  private readonly tileMap: TileMap;
  private readonly player: Player;
  private readonly waves: WaveSpawner;
  private readonly buildings: Map<string, Building> = new Map();
  private readonly turrets: Set<Turret> = new Set();

  constructor(
    scene: Phaser.Scene,
    tileMap: TileMap,
    player: Player,
    waves: WaveSpawner
  ) {
    this.scene = scene;
    this.tileMap = tileMap;
    this.player = player;
    this.waves = waves;

    scene.events.on(
      'building:destroyed',
      (p: { buildingId: string }) => this.handleDestroyed(p.buildingId)
    );
  }

  update(time: number, delta: number): void {
    for (const t of this.turrets) {
      if (t.isAlive()) t.update(time, delta);
    }
  }

  /** 해당 타일의 건물 인스턴스 반환 (없으면 null) */
  getBuildingAt(tileX: number, tileY: number): Building | null {
    for (const b of this.buildings.values()) {
      const pos = b.getTilePosition();
      if (pos.tileX === tileX && pos.tileY === tileY) return b;
    }
    return null;
  }

  /** 배치 가능 여부만 확인 (비용 체크 포함). UI 미리보기 용도 */
  check(type: BuildingType, tileX: number, tileY: number): PlacementCheck {
    const tile = this.tileMap.getTile(tileX, tileY);
    if (!tile || tile.state !== TileState.OWNED) {
      return { ok: false, reason: 'not_owned' };
    }
    if (tile.building !== null) {
      return { ok: false, reason: 'occupied' };
    }
    if (!this.canAfford(type)) {
      return { ok: false, reason: 'insufficient' };
    }
    return { ok: true };
  }

  placeBuilding(
    type: BuildingType,
    tileX: number,
    tileY: number
  ): boolean {
    const chk = this.check(type, tileX, tileY);
    if (!chk.ok) {
      if (chk.reason === 'insufficient') {
        // trySpend가 resource:insufficient 이벤트 발행할 수 있게 여기서도 호출
        this.player.trySpend(BUILDING_CONFIG[type].cost);
      }
      return false;
    }

    const paid = this.player.trySpend(BUILDING_CONFIG[type].cost);
    if (!paid) return false;

    const { x, y } = this.tileMap.tileToPixel(tileX, tileY);
    const building =
      type === BuildingType.BASIC_TURRET
        ? new Turret(this.scene, this.waves, tileX, tileY, x, y)
        : new Building(this.scene, type, tileX, tileY, x, y);

    const id = building.getState().id;
    this.buildings.set(id, building);
    if (building instanceof Turret) this.turrets.add(building);

    const tile = this.tileMap.getTile(tileX, tileY)!;
    tile.building = type;

    this.scene.events.emit('building:built', { building: building.getState() });
    return true;
  }

  private canAfford(type: BuildingType): boolean {
    const cost = BUILDING_CONFIG[type].cost as Partial<Record<ResourceType, number>>;
    const inv = this.player.getState().inventory;
    for (const [k, v] of Object.entries(cost)) {
      if (v !== undefined && inv[k as ResourceType] < v) return false;
    }
    return true;
  }

  private handleDestroyed(buildingId: string): void {
    const b = this.buildings.get(buildingId);
    if (!b) return;
    const { tileX, tileY } = b.getTilePosition();
    const tile = this.tileMap.getTile(tileX, tileY);
    if (tile) tile.building = null;
    this.buildings.delete(buildingId);
    if (b instanceof Turret) this.turrets.delete(b);
  }
}
