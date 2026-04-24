/**
 * WaveSpawner — NIGHT 페이즈마다 몬스터 웨이브 스폰
 *
 * 관련 문서:
 * - GDD §10 (몬스터), §15.3 (사이클별 스폰 수)
 * - IMPL_PLAN §5.3, 단계 5
 *
 * 책임:
 * - `phase:nightStart` 구독 → 사이클 기반 수량 스폰 (burst 간격 준수)
 * - `phase:buildStart` 구독 → 살아남은 몬스터 전부 제거
 * - 활성 몬스터 컬렉션 관리 + `update(time, delta)` 라우팅
 *
 * Phase 1 MVP:
 * - 모든 몬스터 WOLF 고정, 맵 가장자리 랜덤 타일에서 스폰
 * - Object Pool 생략 (§5.5 성능 문제 관측 시 교체)
 */

import Phaser from 'phaser';
import { MAP_CONFIG, MONSTER_CONFIG } from '../config';
import { MonsterType } from '../types';
import { Monster } from '../entities/monster';
import type { TileMap } from './tile-map';
import type { Core } from '../entities/core';
import type { Player } from '../entities/player';
import type { BuildingSystem } from './building-system';

export class WaveSpawner {
  private readonly scene: Phaser.Scene;
  private readonly tileMap: TileMap;
  private readonly player: Player;
  private readonly core: Core;
  private buildings: BuildingSystem | null = null;
  private readonly monsters: Set<Monster> = new Set();
  private readonly scheduledTimers: Phaser.Time.TimerEvent[] = [];

  constructor(scene: Phaser.Scene, tileMap: TileMap, player: Player, core: Core) {
    this.scene = scene;
    this.tileMap = tileMap;
    this.player = player;
    this.core = core;

    scene.events.on('phase:nightStart', (p: { cycle: number }) =>
      this.spawnWave(p.cycle)
    );
    scene.events.on('phase:buildStart', () => this.clearAll());
  }

  /** BuildingSystem은 WaveSpawner 이후 생성되므로 setter 주입 (순환 의존) */
  setBuildingSystem(bs: BuildingSystem): void {
    this.buildings = bs;
  }

  update(time: number, delta: number): void {
    for (const m of this.monsters) {
      if (!m.isAlive()) {
        this.monsters.delete(m);
        continue;
      }
      m.update(time, delta);
    }
  }

  getMonsters(): ReadonlySet<Monster> {
    return this.monsters;
  }

  private spawnWave(cycle: number): void {
    const { byCycle, spawnBurstIntervalMs } = MONSTER_CONFIG.spawn;
    const idx = Math.min(Math.max(cycle - 1, 0), byCycle.length - 1);
    const count = byCycle[idx]!;

    for (let i = 0; i < count; i++) {
      const timer = this.scene.time.delayedCall(
        i * spawnBurstIntervalMs,
        () => this.spawnOne()
      );
      this.scheduledTimers.push(timer);
    }
  }

  private spawnOne(): void {
    const { tileX, tileY } = this.randomEdgeTile();
    const { x, y } = this.tileMap.tileToPixel(tileX, tileY);

    const monster = new Monster(
      this.scene,
      MonsterType.WOLF,
      x,
      y,
      this.player,
      this.core,
      this.tileMap,
      this.buildings
    );
    this.monsters.add(monster);
  }

  private randomEdgeTile(): { tileX: number; tileY: number } {
    const max = MAP_CONFIG.size - 1;
    // 4변 중 하나 선택
    const side = Math.floor(Math.random() * 4);
    const rnd = Math.floor(Math.random() * MAP_CONFIG.size);
    switch (side) {
      case 0:
        return { tileX: rnd, tileY: 0 };
      case 1:
        return { tileX: rnd, tileY: max };
      case 2:
        return { tileX: 0, tileY: rnd };
      default:
        return { tileX: max, tileY: rnd };
    }
  }

  private clearAll(): void {
    for (const t of this.scheduledTimers) t.remove(false);
    this.scheduledTimers.length = 0;
    for (const m of this.monsters) m.destroy();
    this.monsters.clear();
  }
}
