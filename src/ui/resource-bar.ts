/**
 * ResourceBar — 상단 좌측 고정 인벤토리 HUD
 *
 * 관련 문서:
 * - IMPL_PLAN §3.6
 *
 * 책임:
 * - `resource:collected` 구독 → 숫자 갱신 + 짧은 강조 tween
 * - `resource:insufficient` 구독 → 해당 자원 빨간 플래시
 * - 채집 진행률은 단순 텍스트 suffix로 표시 (Phase 1 MVP 단순 UI)
 */

import Phaser from 'phaser';
import { RESOURCE_ICONS } from '../config';
import { ResourceType, type Inventory } from '../types';

const LABEL_COLOR = '#ffffff';
const FLASH_COLOR = '#ff5555';

export class ResourceBar {
  private readonly scene: Phaser.Scene;
  private readonly getInventory: () => Inventory;
  private readonly texts: Partial<Record<ResourceType, Phaser.GameObjects.Text>> = {};

  constructor(scene: Phaser.Scene, getInventory: () => Inventory) {
    this.scene = scene;
    this.getInventory = getInventory;

    const shown: ResourceType[] = [
      ResourceType.WOOD,
      ResourceType.STONE,
      ResourceType.IRON,
      ResourceType.GOLD,
    ];
    const y = 36;
    let x = 8;
    for (const type of shown) {
      const txt = scene.add
        .text(x, y, this.format(type), {
          fontSize: '16px',
          color: LABEL_COLOR,
          backgroundColor: '#000000aa',
          padding: { x: 6, y: 4 },
        })
        .setScrollFactor(0)
        .setDepth(1000);
      this.texts[type] = txt;
      x += txt.width + 8;
    }

    scene.events.on('resource:collected', () => this.refreshAll());
    scene.events.on('resource:spent', () => this.refreshAll());
    scene.events.on('tile:unlocked', () => this.refreshAll());
    scene.events.on(
      'resource:insufficient',
      (p: { type: ResourceType }) => this.flash(p.type)
    );
  }

  private format(type: ResourceType): string {
    const amt = this.getInventory()[type];
    return `${RESOURCE_ICONS[type]} ${amt}`;
  }

  private refreshAll(): void {
    for (const type of Object.keys(this.texts) as ResourceType[]) {
      this.texts[type]?.setText(this.format(type));
    }
  }

  private flash(type: ResourceType): void {
    const t = this.texts[type];
    if (!t) return;
    t.setColor(FLASH_COLOR);
    this.scene.time.delayedCall(300, () => t.setColor(LABEL_COLOR));
  }
}
