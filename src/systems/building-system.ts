/**
 * BuildingSystem — 건물·벽·터렛·생산건물 배치·파괴·업데이트
 *
 * 관련 문서:
 * - GDD §6 (건물), §10.4 (타깃팅)
 * - docs/ECONOMY_CONFIG_FINAL.md (maxCount, 생산 틱)
 * - IMPL_PLAN §7.2, 단계 7
 *
 * 책임:
 * - placeBuilding: 영토·중복·비용·maxCount 검증 → 차감·인스턴스 생성·tile.building 세팅
 * - 매 프레임 update: 터렛 + 생산건물 update 라우팅
 * - 타입별 개수 추적 (LUMBER_MILL, QUARRY의 maxCount=1 enforce)
 * - `building:destroyed` 구독 → 인덱스·타입 카운트·tile.building 정리
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
import { ProductionBuilding } from '../entities/production-building';
import { AoeTurret } from '../entities/aoe-turret';
import { MagicOrb } from '../entities/magic-orb';
import { RotatingSpikeTurret } from '../entities/rotating-spike-turret';
import type { TileMap } from './tile-map';
import type { Player } from '../entities/player';
import type { WaveSpawner } from './wave-spawner';
import type { PhaseManager } from './phase-manager';

/** 매 프레임 update 라우팅 대상 — 모든 공격형 터렛 (단일/AoE/멀티/빔) */
type CombatTurret = Turret | AoeTurret | MagicOrb | RotatingSpikeTurret;

export interface PlacementCheck {
  ok: boolean;
  reason?: 'not_owned' | 'occupied' | 'insufficient' | 'max_reached';
}

export class BuildingSystem {
  private readonly scene: Phaser.Scene;
  private readonly tileMap: TileMap;
  private readonly player: Player;
  private readonly waves: WaveSpawner;
  private readonly phase: PhaseManager;
  private readonly buildings: Map<string, Building> = new Map();
  private readonly combatTurrets: Set<CombatTurret> = new Set();
  private readonly productionBuildings: Set<ProductionBuilding> = new Set();
  private readonly typeCounts: Map<BuildingType, number> = new Map();

  constructor(
    scene: Phaser.Scene,
    tileMap: TileMap,
    player: Player,
    waves: WaveSpawner,
    phase: PhaseManager
  ) {
    this.scene = scene;
    this.tileMap = tileMap;
    this.player = player;
    this.waves = waves;
    this.phase = phase;

    scene.events.on(
      'building:destroyed',
      (p: { buildingId: string }) => this.handleDestroyed(p.buildingId)
    );
  }

  update(time: number, delta: number): void {
    for (const t of this.combatTurrets) {
      if (t.isAlive()) t.update(time, delta);
    }
    for (const pb of this.productionBuildings) {
      if (pb.isAlive()) pb.update(time, delta);
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

  /** 배치 가능 여부만 확인 (비용·maxCount 포함). UI 미리보기 용도 */
  check(type: BuildingType, tileX: number, tileY: number): PlacementCheck {
    const tile = this.tileMap.getTile(tileX, tileY);
    if (!tile || tile.state !== TileState.OWNED) {
      return { ok: false, reason: 'not_owned' };
    }
    if (tile.building !== null) {
      return { ok: false, reason: 'occupied' };
    }
    if (this.hasReachedMax(type)) {
      return { ok: false, reason: 'max_reached' };
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
        this.player.trySpend(BUILDING_CONFIG[type].cost);
      }
      return false;
    }

    const paid = this.player.trySpend(BUILDING_CONFIG[type].cost);
    if (!paid) return false;

    const { x, y } = this.tileMap.tileToPixel(tileX, tileY);
    const building = this.createBuilding(type, tileX, tileY, x, y);

    const id = building.getState().id;
    this.buildings.set(id, building);
    if (
      building instanceof Turret ||
      building instanceof AoeTurret ||
      building instanceof MagicOrb ||
      building instanceof RotatingSpikeTurret
    ) {
      this.combatTurrets.add(building);
    }
    if (building instanceof ProductionBuilding) this.productionBuildings.add(building);

    this.typeCounts.set(type, (this.typeCounts.get(type) ?? 0) + 1);

    const tile = this.tileMap.getTile(tileX, tileY)!;
    tile.building = type;

    this.scene.events.emit('building:built', { building: building.getState() });
    return true;
  }

  private createBuilding(
    type: BuildingType,
    tileX: number,
    tileY: number,
    x: number,
    y: number
  ): Building {
    switch (type) {
      case BuildingType.BASIC_TURRET:
      case BuildingType.MACHINE_GUN_TURRET:
        return new Turret(this.scene, this.waves, tileX, tileY, x, y, type);
      case BuildingType.STONE_BALLISTA:
        return new AoeTurret(this.scene, this.waves, tileX, tileY, x, y);
      case BuildingType.MAGIC_ORB:
        return new MagicOrb(this.scene, this.waves, tileX, tileY, x, y);
      case BuildingType.ROTATING_SPIKE_TURRET:
        return new RotatingSpikeTurret(this.scene, this.waves, tileX, tileY, x, y);
      case BuildingType.LUMBER_MILL:
      case BuildingType.QUARRY:
      case BuildingType.FORGE:
      case BuildingType.FACTORY:
        return new ProductionBuilding(
          this.scene,
          type,
          tileX,
          tileY,
          x,
          y,
          this.player,
          this.phase.getState().type
        );
      default:
        return new Building(this.scene, type, tileX, tileY, x, y);
    }
  }

  /** 해당 타입이 maxCount 도달했는지 (BuildMenu 회색 처리용) */
  isMaxed(type: BuildingType): boolean {
    return this.hasReachedMax(type);
  }

  private hasReachedMax(type: BuildingType): boolean {
    const spec = BUILDING_CONFIG[type];
    const maxCount = (spec as { maxCount?: number }).maxCount;
    if (maxCount === undefined) return false;
    return (this.typeCounts.get(type) ?? 0) >= maxCount;
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
    const type = b.getState().type;
    this.typeCounts.set(type, Math.max(0, (this.typeCounts.get(type) ?? 0) - 1));
    this.buildings.delete(buildingId);
    if (
      b instanceof Turret ||
      b instanceof AoeTurret ||
      b instanceof MagicOrb ||
      b instanceof RotatingSpikeTurret
    ) {
      this.combatTurrets.delete(b);
    }
    if (b instanceof ProductionBuilding) this.productionBuildings.delete(b);
  }
}
