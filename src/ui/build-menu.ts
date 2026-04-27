/**
 * BuildMenu — DAY + BUILD 페이즈 건물 선택 메뉴
 *
 * 관련 문서:
 * - docs/ECONOMY_CONFIG_FINAL.md (2026-04-25 재설계: DAY 중에도 건설 허용)
 * - IMPL_PLAN §7.4
 *
 * 배치: 화면 하단 (ReadyButton 위쪽). 카드 4장 (벽 / 터렛 / 제재소 / 채석장).
 * 구현 주의: setInteractive hit-test 이슈로 씬 레벨 pointerdown + 좌표 수동 판정.
 * 생산 건물(maxCount=1)은 이미 건설됐으면 카드 회색 처리.
 */

import Phaser from 'phaser';
import { BUILDING_CONFIG, GAME_CONFIG, RESOURCE_ICONS } from '../config';
import { BuildingType, ResourceType } from '../types';
import { BUILDING_COLORS } from '../entities/building';
import type { PlacementMode } from '../systems/placement-mode';
import type { BuildingSystem } from '../systems/building-system';

interface Card {
  type: BuildingType;
  bg: Phaser.GameObjects.Rectangle;
  rect: { left: number; right: number; top: number; bottom: number };
}

// Phase 2 step 3: 카드 10개 한 줄 배치 위해 폭 축소 (130 → 110, gap 10 → 6)
// 총 폭 = 10*110 + 9*6 = 1154 (캔버스 1280 ≤ OK)
const CARD_W = 110;
const CARD_H = 72;
const CARD_GAP = 6;
const BOTTOM_MARGIN = 110;

const LABELS: Record<BuildingType, string> = {
  [BuildingType.WALL]: '벽',
  [BuildingType.BASIC_TURRET]: '터렛',
  [BuildingType.LUMBER_MILL]: '제재소',
  [BuildingType.QUARRY]: '채석장',
  [BuildingType.FORGE]: '대장간',
  [BuildingType.FACTORY]: '공장',
  [BuildingType.STONE_BALLISTA]: '발리스타',
  [BuildingType.MACHINE_GUN_TURRET]: '기관총',
  [BuildingType.MAGIC_ORB]: '마법구슬',
  [BuildingType.ROTATING_SPIKE_TURRET]: '회전가시',
};

const ORDER: BuildingType[] = [
  BuildingType.WALL,
  BuildingType.BASIC_TURRET,
  BuildingType.MACHINE_GUN_TURRET,
  BuildingType.STONE_BALLISTA,
  BuildingType.MAGIC_ORB,
  BuildingType.ROTATING_SPIKE_TURRET,
  BuildingType.LUMBER_MILL,
  BuildingType.QUARRY,
  BuildingType.FORGE,
  BuildingType.FACTORY,
];

export class BuildMenu {
  private readonly cards: Card[] = [];
  private readonly buildings: BuildingSystem;
  private visible = false;

  constructor(
    scene: Phaser.Scene,
    placement: PlacementMode,
    buildings: BuildingSystem
  ) {
    this.buildings = buildings;
    const totalW = ORDER.length * CARD_W + (ORDER.length - 1) * CARD_GAP;
    const startX = GAME_CONFIG.canvas.width / 2 - totalW / 2 + CARD_W / 2;
    const cy = GAME_CONFIG.canvas.height - BOTTOM_MARGIN;

    for (let i = 0; i < ORDER.length; i++) {
      const type = ORDER[i]!;
      const cx = startX + i * (CARD_W + CARD_GAP);

      const bg = scene.add
        .rectangle(cx, cy, CARD_W, CARD_H, 0x222222, 0.9)
        .setScrollFactor(0)
        .setDepth(1000)
        .setStrokeStyle(2, 0x555555)
        .setVisible(false);

      const preview = scene.add
        .rectangle(cx, cy - 18, 20, 20, BUILDING_COLORS[type])
        .setScrollFactor(0)
        .setDepth(1001)
        .setVisible(false);

      const name = scene.add
        .text(cx, cy + 2, LABELS[type], {
          fontSize: '13px',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1001)
        .setVisible(false);

      const cost = BUILDING_CONFIG[type].cost as Partial<Record<ResourceType, number>>;
      const costStr = (Object.entries(cost) as [ResourceType, number][])
        .filter(([, v]) => v > 0)
        .map(([t, v]) => `${RESOURCE_ICONS[t]} ${v}`)
        .join('  ');
      const costText = scene.add
        .text(cx, cy + 22, costStr, {
          fontSize: '11px',
          color: '#cccccc',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(1001)
        .setVisible(false);

      const card: Card = {
        type,
        bg,
        rect: {
          left: cx - CARD_W / 2,
          right: cx + CARD_W / 2,
          top: cy - CARD_H / 2,
          bottom: cy + CARD_H / 2,
        },
      };
      this.cards.push(card);

      const parts = [bg, preview, name, costText];
      const show = () => parts.forEach((x) => x.setVisible(true));
      const hide = () => parts.forEach((x) => x.setVisible(false));
      scene.events.on('phase:dayStart', show);
      scene.events.on('phase:buildStart', show);
      scene.events.on('phase:nightStart', hide);
    }

    // 재설계: DAY + BUILD 둘 다 표시
    scene.events.on('phase:dayStart', () => (this.visible = true));
    scene.events.on('phase:buildStart', () => (this.visible = true));
    scene.events.on('phase:nightStart', () => (this.visible = false));

    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.visible) return;
      for (const c of this.cards) {
        const hovering = this.contains(c, p);
        const isActive = placement.getActiveType() === c.type;
        const maxed = this.isMaxed(c.type);
        c.bg.setStrokeStyle(
          2,
          isActive ? 0xffff44 : maxed ? 0x333333 : hovering ? 0x44aaff : 0x555555
        );
        c.bg.setFillStyle(maxed ? 0x111111 : 0x222222, 0.9);
      }
    });

    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.visible) return;
      for (const c of this.cards) {
        if (!this.contains(c, p)) continue;
        if (this.isMaxed(c.type)) return; // 이미 맥스 — 클릭 무시
        placement.enter(c.type);
        return;
      }
    });
  }

  private isMaxed(type: BuildingType): boolean {
    return this.buildings.isMaxed(type);
  }

  private contains(c: Card, p: Phaser.Input.Pointer): boolean {
    return (
      p.x >= c.rect.left &&
      p.x <= c.rect.right &&
      p.y >= c.rect.top &&
      p.y <= c.rect.bottom
    );
  }
}
