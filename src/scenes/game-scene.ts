/**
 * GameScene — 메인 게임
 *
 * 단계 진행:
 * - ✅ 단계 0: Hello World 스텁
 * - ✅ 단계 1: TileMap 30×30 렌더링 + fog + 디버그
 * - ✅ 단계 2: Player 엔티티 + WASD 이동
 * - ✅ 단계 3: ResourceSystem + 채집/확장
 * - ✅ 단계 4: PhaseManager + 낮/밤/빌드
 * - ✅ 단계 5: WaveSpawner + Monster (이동)
 * - ✅ 단계 6: CombatSystem + HP + 다운/부활 + 코어 피격
 * - ✅ 단계 7: BuildingSystem + Turret + BuildMenu
 * - ✅ 단계 8: 사이클 승패 + 통계 + GameOverScene (현재)
 *
 * 관련 문서: IMPL_PLAN §1.1 (Scene 내 상태 관리), 단계 1·8
 */

import Phaser from 'phaser';
import { GAME_CONFIG, MAP_PIXEL_SIZE } from '../config';
import {
  TileMap,
  ResourceSystem,
  PhaseManager,
  WaveSpawner,
  CombatSystem,
  BuildingSystem,
  PlacementMode,
} from '../systems';
import { Player, Core } from '../entities';
import {
  ResourceBar,
  PhaseTimer,
  ReadyButton,
  DevSkipButton,
  HpBar,
  BuildMenu,
} from '../ui';

export class GameScene extends Phaser.Scene {
  private tileMap!: TileMap;
  private player!: Player;
  private core!: Core;
  private resources!: ResourceSystem;
  private phase!: PhaseManager;
  private phaseTimer!: PhaseTimer;
  private waves!: WaveSpawner;
  private combat!: CombatSystem;
  private buildings!: BuildingSystem;
  // UI는 생성 시 씬 이벤트만 구독해 수명 동안 유지.

  private debugText?: Phaser.GameObjects.Text;
  private stats = {
    buildingsBuilt: 0,
    monstersKilled: 0,
    cyclesCleared: 0,
  };
  private gameEnded = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // restart 시 상태 초기화
    this.stats = { buildingsBuilt: 0, monstersKilled: 0, cyclesCleared: 0 };
    this.gameEnded = false;

    this.tileMap = new TileMap(this);
    this.tileMap.render();

    this.core = new Core(this, this.tileMap);
    this.player = new Player(this, this.tileMap);
    this.resources = new ResourceSystem(this, this.tileMap, this.player);
    this.phase = new PhaseManager(this);
    this.waves = new WaveSpawner(this, this.tileMap, this.player, this.core);
    this.combat = new CombatSystem(this, this.player, this.waves);
    this.buildings = new BuildingSystem(
      this,
      this.tileMap,
      this.player,
      this.waves,
      this.phase
    );
    this.waves.setBuildingSystem(this.buildings);
    const placement = new PlacementMode(this, this.tileMap, this.buildings);
    this.resources.setPlacementMode(placement);

    new ResourceBar(this, () => this.player.getState().inventory);
    new HpBar(this, this.player, this.core);
    this.phaseTimer = new PhaseTimer(this, this.phase);
    new ReadyButton(this);
    new DevSkipButton(this, this.phase);
    new BuildMenu(this, placement, this.buildings);

    this.setupCamera();
    this.setupDebug();
    this.setupStatsAndEndgame();

    this.phase.start();
  }

  private setupStatsAndEndgame(): void {
    this.events.on('building:built', () => {
      this.stats.buildingsBuilt++;
    });
    this.events.on('monster:died', () => {
      this.stats.monstersKilled++;
    });
    // NIGHT 종료 시 cyclesCleared 증가 (사이클 N NIGHT 버텨내면 N cycle 완료)
    this.events.on('phase:nightEnd', () => {
      this.stats.cyclesCleared++;
    });

    this.events.on('game:won', (p: { cyclesCleared: number }) => {
      if (this.gameEnded) return;
      this.gameEnded = true;
      this.scene.start('GameOverScene', {
        won: true,
        cycle: p.cyclesCleared,
        stats: { ...this.stats },
      });
    });
    this.events.on('game:lost', (p: { cycle: number }) => {
      if (this.gameEnded) return;
      this.gameEnded = true;
      this.scene.start('GameOverScene', {
        won: false,
        cycle: p.cycle,
        stats: { ...this.stats },
      });
    });
  }

  /** 카메라: 맵 전체(960×960) 경계, 플레이어 follow */
  private setupCamera(): void {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_PIXEL_SIZE, MAP_PIXEL_SIZE);
    // TODO: 단계 3+ 줌 재튜닝 (현재 1.0은 30×30 전체 가시)
    cam.setZoom(1);
    cam.startFollow(this.player.getSprite(), true, 0.1, 0.1);
  }

  /** 디버그: F1 격자선 토글 + 상단 HUD (플레이어·채집 진행률) */
  private setupDebug(): void {
    const f1 = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.F1);
    f1?.on('down', () => this.tileMap.toggleGrid());

    this.debugText = this.add
      .text(8, 8, '', {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 6, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(1000);

    if (GAME_CONFIG.debug.eventLog) {
      this.events.on('tile:stateChanged', (payload: unknown) => {
        console.log('[event] tile:stateChanged', payload);
      });
      this.events.on('resource:collected', (payload: unknown) => {
        console.log('[event] resource:collected', payload);
      });
      this.events.on('tile:unlocked', (payload: unknown) => {
        console.log('[event] tile:unlocked', payload);
      });
    }

    // 페이즈 전환은 기본 로그 (디버그 플래그와 무관)
    this.events.on('phase:dayStart', (p: { cycle: number }) =>
      console.log(`[phase] DAY ${p.cycle} start`)
    );
    this.events.on('phase:nightStart', (p: { cycle: number }) =>
      console.log(`[phase] NIGHT ${p.cycle} start`)
    );
    this.events.on('phase:buildStart', (p: { cycle: number }) =>
      console.log(`[phase] BUILD ${p.cycle} start`)
    );
  }

  update(time: number, delta: number): void {
    this.phase?.update(time, delta);
    this.player?.update(time, delta);
    this.resources?.update(time, delta);
    this.waves?.update(time, delta);
    this.combat?.update(time, delta);
    this.buildings?.update(time, delta);
    this.phaseTimer?.update();
    this.updateDebugHud();
  }

  private updateDebugHud(): void {
    if (!this.debugText) return;
    const progress = this.resources?.getCollectionProgress();
    const { tileX, tileY } = this.player.getTilePosition();
    const monsterCount = this.waves?.getMonsters().size ?? 0;
    const base = `player (${tileX}, ${tileY})   monsters: ${monsterCount}   [F1: grid] [F: collect] [click: expand]`;
    if (progress) {
      const pct = Math.floor(progress.progress * 100);
      this.debugText.setText(
        `${base}\ncollecting ${progress.tile.resource} ${pct}%`
      );
    } else {
      this.debugText.setText(base);
    }
  }

  /**
   * Scene 종료 시 cleanup — IMPL_PLAN §1.7·§8.5 성능 가이드
   * 이벤트 리스너·타이머·입력·GameObjects 정리 (메모리 누수 방지, 재시작 시 중복 방지)
   */
  shutdown(): void {
    this.events.removeAllListeners();
    this.time.removeAllEvents();
    this.input.removeAllListeners();
    this.input.keyboard?.removeAllKeys();
    this.children.removeAll(true);
  }
}
