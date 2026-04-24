/**
 * BuildMenu — BUILD 페이즈 전용 건물 선택 메뉴
 *
 * 관련 문서:
 * - IMPL_PLAN §7.4
 *
 * 배치: 화면 하단 (ReadyButton 위쪽). 4장 카드.
 * 구현 주의: setInteractive hit-test 이슈로 씬 레벨 pointerdown + 좌표 수동 판정.
 */

import Phaser from 'phaser';
import { BUILDING_CONFIG, GAME_CONFIG } from '../config';
import { BuildingType, ResourceType } from '../types';
import { BUILDING_COLORS } from '../entities/building';
import type { PlacementMode } from '../systems/placement-mode';

interface Card {
  type: BuildingType;
  label: string;
  bg: Phaser.GameObjects.Rectangle;
  border: Phaser.GameObjects.Rectangle;
  rect: { left: number; right: number; top: number; bottom: number };
}

const CARD_W = 130;
const CARD_H = 72;
const CARD_GAP = 10;
const BOTTOM_MARGIN = 110;

const LABELS: Record<BuildingType, string> = {
  [BuildingType.RESEARCH_LAB]: '연구실',
  [BuildingType.SPIRIT_FOREST]: '정령의 숲',
  [BuildingType.WALL]: '벽',
  [BuildingType.BASIC_TURRET]: '터렛',
};

const ORDER: BuildingType[] = [
  BuildingType.WALL,
  BuildingType.BASIC_TURRET,
  BuildingType.RESEARCH_LAB,
  BuildingType.SPIRIT_FOREST,
];

export class BuildMenu {
  private readonly cards: Card[] = [];
  private visible = false;

  constructor(scene: Phaser.Scene, placement: PlacementMode) {
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

      // 건물 색상 미리보기 (작은 사각형)
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
      const costStr = [
        cost[ResourceType.WOOD] ? `W ${cost[ResourceType.WOOD]}` : null,
        cost[ResourceType.STONE] ? `S ${cost[ResourceType.STONE]}` : null,
      ]
        .filter(Boolean)
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
        label: LABELS[type],
        bg,
        border: bg,
        rect: {
          left: cx - CARD_W / 2,
          right: cx + CARD_W / 2,
          top: cy - CARD_H / 2,
          bottom: cy + CARD_H / 2,
        },
      };
      this.cards.push(card);

      // 카드 children (preview, name, costText) 공개/숨김 관리
      const parts = [bg, preview, name, costText];
      scene.events.on('phase:buildStart', () =>
        parts.forEach((x) => x.setVisible(true))
      );
      scene.events.on('phase:dayStart', () =>
        parts.forEach((x) => x.setVisible(false))
      );
      scene.events.on('phase:nightStart', () =>
        parts.forEach((x) => x.setVisible(false))
      );
    }

    scene.events.on('phase:buildStart', () => (this.visible = true));
    scene.events.on('phase:dayStart', () => (this.visible = false));
    scene.events.on('phase:nightStart', () => (this.visible = false));

    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.visible) return;
      for (const c of this.cards) {
        const hovering = this.contains(c, p);
        const isActive = placement.getActiveType() === c.type;
        c.bg.setStrokeStyle(
          2,
          isActive ? 0xffff44 : hovering ? 0x44aaff : 0x555555
        );
      }
    });

    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!this.visible) return;
      for (const c of this.cards) {
        if (this.contains(c, p)) {
          placement.enter(c.type);
          return;
        }
      }
    });
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
