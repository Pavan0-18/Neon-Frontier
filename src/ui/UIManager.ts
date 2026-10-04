import { GameEngine, GameSpeed } from '../game/engine/GameEngine';
import { DefenseScene } from '../game/rendering/PhaserGame';
import { TOWER_DEFINITIONS, TowerType, TargetingStrategy } from '../data/towers';
import { GlobalSoundFX } from '../audio/SoundFX';
import { GlobalRNG } from '../game/engine/RNG';
import { GlobalPathSystem } from '../game/systems/PathSystem';

export class UIManager {
  private engine: GameEngine;
  private scene: DefenseScene;

  // DOM Elements - Status Bar
  private coreHealthCard!: HTMLElement;
  private coreHealthFill!: HTMLElement;
  private coreHealthText!: HTMLElement;
  private creditsText!: HTMLElement;
  private waveText!: HTMLElement;
  private scoreText!: HTMLElement;

  // Screen-space Feedback
  private breachVignette!: HTMLElement;
  private baseDangerAlert!: HTMLElement;

  // Desktop Controls
  private btnPause!: HTMLElement;
  private speedBtns: Record<number, HTMLElement> = {};
  private btnAudio!: HTMLElement;
  private btnFullscreen!: HTMLElement;
  private btnPerfLab!: HTMLElement;
  private btnRadarToggle!: HTMLElement;
  private btnMobileMenu!: HTMLElement;

  // Mobile Menu Drawer
  private mobileMenuDrawer!: HTMLElement;
  private mBtnPause!: HTMLElement;
  private mSpeedBtns: Record<number, HTMLElement> = {};
  private mBtnAudio!: HTMLElement;
  private mBtnFullscreen!: HTMLElement;
  private mBtnRadar!: HTMLElement;
  private mBtnPerf!: HTMLElement;

  // Radar Mini-Map
  private radarContainer!: HTMLElement;
  private btnCloseRadar!: HTMLElement;
  private radarCanvas!: HTMLCanvasElement;
  private radarCtx!: CanvasRenderingContext2D;

  // Tactical Actions
  private btnTacticalEmp!: HTMLButtonElement;
  private btnTacticalBombard!: HTMLButtonElement;

  // Wave Actions
  private waveActionContainer!: HTMLElement;
  private btnStartWave!: HTMLElement;
  private waveBtnLabel!: HTMLElement;
  private waveAutoCountdown!: HTMLElement;

  // Interactive Bottom Dock
  private buildDeckWrapper!: HTMLElement;
  private buildDeck!: HTMLElement;
  private btnMoreTowers!: HTMLElement;

  // Context-Aware Inspector
  private contextInspector!: HTMLElement;
  private ciIcon!: HTMLElement;
  private ciName!: HTMLElement;
  private ciTier!: HTMLElement;
  private ciCloseBtn!: HTMLElement;
  private ciDmg!: HTMLElement;
  private ciRange!: HTMLElement;
  private ciRate!: HTMLElement;
  private ciDps!: HTMLElement;
  private ciBtnUpgrade!: HTMLButtonElement;
  private ciUpgradeTitle!: HTMLElement;
  private ciUpgradeCost!: HTMLElement;
  private ciBtnSell!: HTMLButtonElement;
  private ciSellCost!: HTMLElement;
  private ciTargetToggle!: HTMLButtonElement;

  // Mobile Tower Drawer Modal
  private towerDrawerModal!: HTMLElement;
  private drawerBackdrop!: HTMLElement;
  private drawerCloseBtn!: HTMLElement;
  private drawerTowerList!: HTMLElement;

  // Cinematic Intro Modal
  private introModal!: HTMLElement;
  private btnDeployDefense!: HTMLElement;

  // Center Wave & Threat Banner
  private centerBanner!: HTMLElement;
  private bannerTitle!: HTMLElement;
  private bannerSub!: HTMLElement;

  // Debrief Modals
  private gameOverModal!: HTMLElement;
  private goRating!: HTMLElement;
  private goWave!: HTMLElement;
  private goKills!: HTMLElement;
  private goDamage!: HTMLElement;
  private goCredits!: HTMLElement;
  private goMvp!: HTMLElement;
  private goScore!: HTMLElement;
  private btnRestartGame!: HTMLElement;

  private victoryModal!: HTMLElement;
  private vicRating!: HTMLElement;
  private vicKills!: HTMLElement;
  private vicDamage!: HTMLElement;
  private vicCredits!: HTMLElement;
  private vicHealth!: HTMLElement;
  private vicMvp!: HTMLElement;
  private vicScore!: HTMLElement;
  private btnPlayAgain!: HTMLElement;

  // Perf Lab Elements
  private perfLabModal!: HTMLElement;
  private btnClosePerf!: HTMLElement;
  private mFps!: HTMLElement;
  private mFrameTime!: HTMLElement;
  private mP95!: HTMLElement;
  private mP99!: HTMLElement;
  private mF16!: HTMLElement;
  private mF33!: HTMLElement;
  private mSimTime!: HTMLElement;
  private mTargetTime!: HTMLElement;
  private mRenderTime!: HTMLElement;
  private mEnemies!: HTMLElement;
  private mTowers!: HTMLElement;
  private mProjectiles!: HTMLElement;

  private toggleSpatialGrid!: HTMLInputElement;
  private toggleObjectPooling!: HTMLInputElement;
  private toggleViewportCulling!: HTMLInputElement;
  private toggleBatchRender!: HTMLInputElement;

  private inputBenchSeed!: HTMLInputElement;
  private btnRunFormalBenchmark!: HTMLElement;
  private benchStatus!: HTMLElement;
  private benchResultsArea!: HTMLElement;
  private benchOutput!: HTMLElement;
  private btnCopyBench!: HTMLElement;

  // Performance Telemetry & Radar Timers
  private telemetryTimer: number = 0;
  private radarTimer: number = 0;

  // Stats Tracking
  private totalDamageDealt: number = 0;
  private totalCreditsEarned: number = 0;
  private mvpKills: Record<TowerType, number> = {
    pulse: 0,
    tesla: 0,
    mortar: 0,
    cryo: 0,
    railgun: 0,
    laser: 0,
    flak: 0,
    vortex: 0
  };

  private readonly targetingCycle: TargetingStrategy[] = ['first', 'last', 'closest', 'strongest', 'weakest'];

  constructor(engine: GameEngine, scene: DefenseScene) {
    this.engine = engine;
    this.scene = scene;
    this.cacheDOMElements();
    this.initBuildDeck();
    this.initDrawerList();
    this.bindEvents();
    this.bindKeyboardShortcuts();
    this.updateHUD();
  }

  private cacheDOMElements(): void {
    // Status Bar & Health
    this.coreHealthCard = document.getElementById('core-health-card')!;
    this.coreHealthFill = document.getElementById('core-health-fill')!;
    this.coreHealthText = document.getElementById('core-health-text')!;
    this.creditsText = document.getElementById('credits-text')!;
    this.waveText = document.getElementById('wave-text')!;
    this.scoreText = document.getElementById('score-text')!;

    // Screen-space feedback
    this.breachVignette = document.getElementById('breach-vignette')!;
    this.baseDangerAlert = document.getElementById('base-danger-alert')!;

    // Desktop Controls
    this.btnPause = document.getElementById('btn-pause')!;
    this.speedBtns[1] = document.getElementById('btn-speed-1')!;
    this.speedBtns[2] = document.getElementById('btn-speed-2')!;
    this.speedBtns[4] = document.getElementById('btn-speed-4')!;
    this.btnAudio = document.getElementById('btn-audio')!;
    this.btnFullscreen = document.getElementById('btn-fullscreen')!;
    this.btnPerfLab = document.getElementById('btn-perf-lab')!;
    this.btnRadarToggle = document.getElementById('btn-radar-toggle')!;
    this.btnMobileMenu = document.getElementById('btn-mobile-menu')!;

    // Mobile Menu Drawer
    this.mobileMenuDrawer = document.getElementById('mobile-menu-drawer')!;
    this.mBtnPause = document.getElementById('m-btn-pause')!;
    this.mSpeedBtns[1] = document.getElementById('m-btn-speed-1')!;
    this.mSpeedBtns[2] = document.getElementById('m-btn-speed-2')!;
    this.mSpeedBtns[4] = document.getElementById('m-btn-speed-4')!;
    this.mBtnAudio = document.getElementById('m-btn-audio')!;
    this.mBtnFullscreen = document.getElementById('m-btn-fullscreen')!;
    this.mBtnRadar = document.getElementById('m-btn-radar')!;
    this.mBtnPerf = document.getElementById('m-btn-perf')!;

    // Radar Mini-Map
    this.radarContainer = document.getElementById('radar-container')!;
    this.btnCloseRadar = document.getElementById('btn-close-radar')!;
    this.radarCanvas = document.getElementById('radar-canvas') as HTMLCanvasElement;
    if (this.radarCanvas) {
      this.radarCtx = this.radarCanvas.getContext('2d')!;
    }

    // Tactical Actions
    this.btnTacticalEmp = document.getElementById('btn-tactical-emp') as HTMLButtonElement;
    this.btnTacticalBombard = document.getElementById('btn-tactical-bombard') as HTMLButtonElement;

    // Wave Actions
    this.waveActionContainer = document.getElementById('wave-action-container')!;
    this.btnStartWave = document.getElementById('btn-start-wave')!;
    this.waveBtnLabel = document.getElementById('wave-btn-label')!;
    this.waveAutoCountdown = document.getElementById('wave-auto-countdown')!;

    // Bottom Dock & Context-Aware Inspector
    this.buildDeckWrapper = document.getElementById('build-deck-wrapper')!;
    this.buildDeck = document.getElementById('build-deck')!;
    this.btnMoreTowers = document.getElementById('btn-more-towers')!;

    this.contextInspector = document.getElementById('context-inspector')!;
    this.ciIcon = document.getElementById('ci-icon')!;
    this.ciName = document.getElementById('ci-name')!;
    this.ciTier = document.getElementById('ci-tier')!;
    this.ciCloseBtn = document.getElementById('ci-close-btn')!;
    this.ciDmg = document.getElementById('ci-dmg')!;
    this.ciRange = document.getElementById('ci-range')!;
    this.ciRate = document.getElementById('ci-rate')!;
    this.ciDps = document.getElementById('ci-dps')!;
    this.ciBtnUpgrade = document.getElementById('ci-btn-upgrade') as HTMLButtonElement;
    this.ciUpgradeTitle = document.getElementById('ci-upgrade-title')!;
    this.ciUpgradeCost = document.getElementById('ci-upgrade-cost')!;
    this.ciBtnSell = document.getElementById('ci-btn-sell') as HTMLButtonElement;
    this.ciSellCost = document.getElementById('ci-sell-cost')!;
    this.ciTargetToggle = document.getElementById('ci-target-toggle') as HTMLButtonElement;

    // Mobile Tower Drawer Modal
    this.towerDrawerModal = document.getElementById('tower-drawer-modal')!;
    this.drawerBackdrop = document.getElementById('drawer-backdrop')!;
    this.drawerCloseBtn = document.getElementById('drawer-close-btn')!;
    this.drawerTowerList = document.getElementById('drawer-tower-list')!;

    // Cinematic Intro Modal
    this.introModal = document.getElementById('intro-modal')!;
    this.btnDeployDefense = document.getElementById('btn-deploy-defense')!;

    // Center Banner
    this.centerBanner = document.getElementById('center-banner')!;
    this.bannerTitle = document.getElementById('banner-title')!;
    this.bannerSub = document.getElementById('banner-sub')!;

    // Game Over & Victory Debrief
    this.gameOverModal = document.getElementById('game-over-modal')!;
    this.goRating = document.getElementById('go-rating')!;
    this.goWave = document.getElementById('go-wave')!;
    this.goKills = document.getElementById('go-kills')!;
    this.goDamage = document.getElementById('go-damage')!;
    this.goCredits = document.getElementById('go-credits')!;
    this.goMvp = document.getElementById('go-mvp')!;
    this.goScore = document.getElementById('go-score')!;
    this.btnRestartGame = document.getElementById('btn-restart-game')!;

    this.victoryModal = document.getElementById('victory-modal')!;
    this.vicRating = document.getElementById('vic-rating')!;
    this.vicKills = document.getElementById('vic-kills')!;
    this.vicDamage = document.getElementById('vic-damage')!;
    this.vicCredits = document.getElementById('vic-credits')!;
    this.vicHealth = document.getElementById('vic-health')!;
    this.vicMvp = document.getElementById('vic-mvp')!;
    this.vicScore = document.getElementById('vic-score')!;
    this.btnPlayAgain = document.getElementById('btn-play-again')!;

    // Perf Lab
    this.perfLabModal = document.getElementById('perf-lab-modal')!;
    this.btnClosePerf = document.getElementById('btn-close-perf')!;
    this.mFps = document.getElementById('m-fps')!;
    this.mFrameTime = document.getElementById('m-frametime')!;
    this.mP95 = document.getElementById('m-p95')!;
    this.mP99 = document.getElementById('m-p99')!;
    this.mF16 = document.getElementById('m-f16')!;
    this.mF33 = document.getElementById('m-f33')!;
    this.mSimTime = document.getElementById('m-simtime')!;
    this.mTargetTime = document.getElementById('m-targettime')!;
    this.mRenderTime = document.getElementById('m-rendertime')!;
    this.mEnemies = document.getElementById('m-enemies')!;
    this.mTowers = document.getElementById('m-towers')!;
    this.mProjectiles = document.getElementById('m-projectiles')!;

    this.toggleSpatialGrid = document.getElementById('toggle-spatial-grid') as HTMLInputElement;
    this.toggleObjectPooling = document.getElementById('toggle-object-pooling') as HTMLInputElement;
    this.toggleViewportCulling = document.getElementById('toggle-viewport-culling') as HTMLInputElement;
    this.toggleBatchRender = document.getElementById('toggle-batch-render') as HTMLInputElement;

    this.inputBenchSeed = document.getElementById('input-bench-seed') as HTMLInputElement;
    this.btnRunFormalBenchmark = document.getElementById('btn-run-formal-benchmark')!;
    this.benchStatus = document.getElementById('bench-status')!;
    this.benchResultsArea = document.getElementById('bench-results-area')!;
    this.benchOutput = document.getElementById('bench-output')!;
    this.btnCopyBench = document.getElementById('btn-copy-bench')!;
  }

  private initBuildDeck(): void {
    const types: TowerType[] = ['pulse', 'tesla', 'mortar', 'cryo', 'railgun', 'laser', 'flak', 'vortex'];
    this.buildDeck.innerHTML = '';

    types.forEach((type, idx) => {
      const def = TOWER_DEFINITIONS[type];
      const card = document.createElement('div');
      card.className = 'tower-card';
      card.dataset.towerType = type;
      card.title = `${def.name} - ${def.role} (Key: ${idx + 1})`;
      card.innerHTML = `
        <div class="tc-top-row">
          <span class="tc-hotkey">[${idx + 1}]</span>
          <span class="tc-icon-char">${def.iconChar || '◈'}</span>
        </div>
        <span class="tc-name">${def.name}</span>
        <span class="tc-cost">$${def.baseCost}</span>
        <div class="tc-lock-overlay hidden" id="lock-${type}">
          <span>🔒</span>
          <small>R${def.unlockWave}</small>
        </div>
      `;

      card.addEventListener('click', () => {
        const curRound = this.engine.waveSystem.currentWaveNumber;
        if (curRound < def.unlockWave) {
          GlobalSoundFX.playUIClick();
          this.showBanner('DEFENSE SCHEMATIC LOCKED', `${def.name.toUpperCase()} unlocks at Round ${def.unlockWave}.`);
          return;
        }

        GlobalSoundFX.playUIClick();
        if (this.scene.selectedBuildType === type) {
          this.scene.selectedBuildType = null;
        } else {
          this.scene.selectedBuildType = type;
          this.scene.selectedTowerId = null;
          this.updateTowerInspectPanel(null);
        }
        this.updateBuildCardSelection();
      });

      this.buildDeck.appendChild(card);
    });
  }

  private initDrawerList(): void {
    const types: TowerType[] = ['pulse', 'tesla', 'mortar', 'cryo', 'railgun', 'laser', 'flak', 'vortex'];
    this.drawerTowerList.innerHTML = '';

    types.forEach((type, idx) => {
      const def = TOWER_DEFINITIONS[type];
      const item = document.createElement('div');
      item.className = 'drawer-tower-item';
      item.dataset.towerType = type;
      item.innerHTML = `
        <div class="dti-left">
          <span class="dti-icon">${def.iconChar || '◈'}</span>
          <div>
            <div class="dti-name">[${idx + 1}] ${def.name}</div>
            <div class="dti-role">${def.role} · ${def.description}</div>
          </div>
        </div>
        <div class="dti-right">
          <span class="dti-cost">$${def.baseCost}</span>
          <span class="dti-unlock" id="dti-lock-${type}">Round ${def.unlockWave}</span>
        </div>
      `;

      item.addEventListener('click', () => {
        const curRound = this.engine.waveSystem.currentWaveNumber;
        if (curRound < def.unlockWave) {
          GlobalSoundFX.playUIClick();
          this.showBanner('LOCKED SCHEMATIC', `${def.name} unlocks at Round ${def.unlockWave}.`);
          return;
        }

        this.scene.selectedBuildType = type;
        this.scene.selectedTowerId = null;
        this.updateTowerInspectPanel(null);
        this.towerDrawerModal.classList.add('hidden');
        this.updateBuildCardSelection();
        GlobalSoundFX.playUIClick();
      });

      this.drawerTowerList.appendChild(item);
    });
  }

  private updateBuildCardSelection(): void {
    const curRound = this.engine.waveSystem.currentWaveNumber;
    const cards = this.buildDeck.querySelectorAll('.tower-card');

    cards.forEach(c => {
      const cardEl = c as HTMLElement;
      const t = cardEl.dataset.towerType as TowerType;
      const def = TOWER_DEFINITIONS[t];
      const isLocked = (curRound < def.unlockWave);
      const lockOverlay = cardEl.querySelector('.tc-lock-overlay');

      if (isLocked) {
        cardEl.classList.add('locked');
        lockOverlay?.classList.remove('hidden');
      } else {
        cardEl.classList.remove('locked');
        lockOverlay?.classList.add('hidden');
      }

      if (this.scene.selectedBuildType === t) {
        cardEl.classList.add('selected');
      } else {
        cardEl.classList.remove('selected');
      }

      if (!isLocked && this.engine.economySystem.credits < def.baseCost) {
        cardEl.classList.add('disabled');
      } else {
        cardEl.classList.remove('disabled');
      }
    });

    // Update Drawer items
    const drawerItems = this.drawerTowerList.querySelectorAll('.drawer-tower-item');
    drawerItems.forEach(di => {
      const itemEl = di as HTMLElement;
      const t = itemEl.dataset.towerType as TowerType;
      const def = TOWER_DEFINITIONS[t];
      const isLocked = (curRound < def.unlockWave);

      if (isLocked) {
        itemEl.classList.add('locked');
      } else {
        itemEl.classList.remove('locked');
      }

      if (this.scene.selectedBuildType === t) {
        itemEl.classList.add('selected');
      } else {
        itemEl.classList.remove('selected');
      }
    });
  }

  private bindEvents(): void {
    // Intro Modal Dismiss
    this.btnDeployDefense?.addEventListener('click', () => {
      this.introModal.classList.add('hidden');
      GlobalSoundFX.playUIClick();
    });

    // Speed Controls (Desktop)
    this.btnPause.addEventListener('click', () => {
      const isPaused = this.engine.togglePause();
      this.btnPause.classList.toggle('active', isPaused);
      this.mBtnPause?.classList.toggle('active', isPaused);
      GlobalSoundFX.playUIClick();
    });

    [1, 2, 4].forEach(s => {
      this.speedBtns[s]?.addEventListener('click', () => {
        this.engine.setSpeed(s as GameSpeed);
        this.btnPause.classList.remove('active');
        this.mBtnPause?.classList.remove('active');
        [1, 2, 4].forEach(k => {
          this.speedBtns[k]?.classList.remove('active');
          this.mSpeedBtns[k]?.classList.remove('active');
        });
        this.speedBtns[s]?.classList.add('active');
        this.mSpeedBtns[s]?.classList.add('active');
        GlobalSoundFX.playUIClick();
      });
    });

    // Speed Controls (Mobile Drawer)
    this.mBtnPause?.addEventListener('click', () => {
      const isPaused = this.engine.togglePause();
      this.btnPause.classList.toggle('active', isPaused);
      this.mBtnPause.classList.toggle('active', isPaused);
      GlobalSoundFX.playUIClick();
    });

    [1, 2, 4].forEach(s => {
      this.mSpeedBtns[s]?.addEventListener('click', () => {
        this.engine.setSpeed(s as GameSpeed);
        this.btnPause.classList.remove('active');
        this.mBtnPause?.classList.remove('active');
        [1, 2, 4].forEach(k => {
          this.speedBtns[k]?.classList.remove('active');
          this.mSpeedBtns[k]?.classList.remove('active');
        });
        this.speedBtns[s]?.classList.add('active');
        this.mSpeedBtns[s]?.classList.add('active');
        GlobalSoundFX.playUIClick();
      });
    });

    // Audio Toggle
    const handleAudioToggle = () => {
      const muted = GlobalSoundFX.toggleMute();
      const icon = muted ? '🔇' : '🔊';
      if (this.btnAudio) this.btnAudio.textContent = icon;
      if (this.mBtnAudio) this.mBtnAudio.textContent = `${icon} SOUND`;
      GlobalSoundFX.playUIClick();
    };
    this.btnAudio?.addEventListener('click', handleAudioToggle);
    this.mBtnAudio?.addEventListener('click', handleAudioToggle);

    // Fullscreen Toggle
    const handleFullscreen = () => {
      this.scene.toggleFullscreen();
      GlobalSoundFX.playUIClick();
    };
    this.btnFullscreen?.addEventListener('click', handleFullscreen);
    this.mBtnFullscreen?.addEventListener('click', handleFullscreen);

    // Radar Toggle
    const handleRadarToggle = () => {
      this.radarContainer.classList.toggle('hidden');
      GlobalSoundFX.playUIClick();
    };
    this.btnRadarToggle?.addEventListener('click', handleRadarToggle);
    this.mBtnRadar?.addEventListener('click', handleRadarToggle);
    this.btnCloseRadar?.addEventListener('click', () => {
      this.radarContainer.classList.add('hidden');
      GlobalSoundFX.playUIClick();
    });

    // Mobile Hamburger Menu Toggle
    this.btnMobileMenu?.addEventListener('click', () => {
      this.mobileMenuDrawer.classList.toggle('hidden');
      GlobalSoundFX.playUIClick();
    });

    // Mobile All Towers Drawer Toggle
    this.btnMoreTowers?.addEventListener('click', () => {
      this.towerDrawerModal.classList.remove('hidden');
      GlobalSoundFX.playUIClick();
    });
    this.drawerCloseBtn?.addEventListener('click', () => {
      this.towerDrawerModal.classList.add('hidden');
      GlobalSoundFX.playUIClick();
    });
    this.drawerBackdrop?.addEventListener('click', () => {
      this.towerDrawerModal.classList.add('hidden');
    });

    // Tactical Actions
    this.btnTacticalEmp?.addEventListener('click', () => {
      this.triggerTacticalEMP();
    });

    this.btnTacticalBombard?.addEventListener('click', () => {
      this.triggerTacticalBombardment();
    });

    // Wave Launch Action
    this.btnStartWave?.addEventListener('click', () => {
      this.engine.waveSystem.startNextWave();
      GlobalSoundFX.playUIClick();
    });

    // Tower Selection Callback from Scene
    this.scene.onTowerSelected = (towerId: number | null) => {
      this.updateTowerInspectPanel(towerId);
    };

    this.scene.onTowerPlaced = (type: TowerType) => {
      GlobalSoundFX.playBuild();
      this.updateBuildCardSelection();
      // Track towers
      this.totalCreditsEarned += 0;
      this.mvpKills[type] = this.mvpKills[type] || 0;
    };

    // Close Context Inspector (Deselect)
    this.ciCloseBtn?.addEventListener('click', () => {
      this.scene.selectedTowerId = null;
      this.updateTowerInspectPanel(null);
      GlobalSoundFX.playUIClick();
    });

    // Upgrade Tower Button
    this.ciBtnUpgrade?.addEventListener('click', () => {
      if (this.scene.selectedTowerId !== null) {
        const t = this.engine.entityMgr.towers.find(tow => tow.id === this.scene.selectedTowerId);
        if (t && t.currentStats.upgradeCost > 0) {
          if (this.engine.economySystem.spendCredits(t.currentStats.upgradeCost)) {
            this.engine.entityMgr.upgradeTower(t);
            GlobalSoundFX.playUpgrade();
            this.updateTowerInspectPanel(t.id);
          }
        }
      }
    });

    // Sell Tower Button
    this.ciBtnSell?.addEventListener('click', () => {
      if (this.scene.selectedTowerId !== null) {
        const t = this.engine.entityMgr.towers.find(tow => tow.id === this.scene.selectedTowerId);
        if (t) {
          this.engine.economySystem.addCredits(t.currentStats.sellValue);
          this.engine.entityMgr.removeTower(t.id);
          GlobalSoundFX.playSell();
          this.scene.selectedTowerId = null;
          this.updateTowerInspectPanel(null);
        }
      }
    });

    // Target Strategy Toggle Button (Cycles strategies)
    this.ciTargetToggle?.addEventListener('click', () => {
      if (this.scene.selectedTowerId !== null) {
        const t = this.engine.entityMgr.towers.find(tow => tow.id === this.scene.selectedTowerId);
        if (t) {
          const curIdx = this.targetingCycle.indexOf(t.targetingStrategy);
          const nextIdx = (curIdx + 1) % this.targetingCycle.length;
          t.targetingStrategy = this.targetingCycle[nextIdx];
          this.ciTargetToggle.textContent = `${t.targetingStrategy.toUpperCase()} ▾`;
          GlobalSoundFX.playUIClick();
        }
      }
    });

    // Core Damage Flash Feedback
    this.engine.economySystem.onCoreDamage = () => {
      this.flashBreachVignette();
      this.scene.triggerCoreBreachVFX();
      GlobalSoundFX.playBossKlaxon();
    };

    // Engine Economy Callbacks
    this.engine.economySystem.onStateChange = () => {
      this.updateHUD();
    };

    this.engine.economySystem.onGameOver = () => {
      this.showGameOver();
    };

    this.engine.waveSystem.onWaveStart = (w, isBoss, bossName) => {
      const def = this.engine.waveSystem.currentWaveDef;
      if (isBoss) {
        this.showBanner(`ROUND ${w}: CRITICAL TITAN ALERT`, `⚠ WARNING: ${bossName || 'BOSS BEHEMOTH'} APPROACHING ⚠`);
        GlobalSoundFX.playBossKlaxon();
      } else {
        const title = def?.modifierTitle ? `ROUND ${w}: ${def.modifierTitle}` : `ROUND ${w} INBOUND`;
        const desc = def?.modifierDesc || 'Defend the orbital energy conduit.';
        this.showBanner(title, desc);
      }
      this.updateHUD();
      this.updateBuildCardSelection();
    };

    this.engine.waveSystem.onWaveComplete = (completedWave) => {
      // Check if any tower unlocks at next round
      const nextRound = completedWave + 1;
      const newlyUnlocked = (Object.keys(TOWER_DEFINITIONS) as TowerType[]).find(
        k => TOWER_DEFINITIONS[k].unlockWave === nextRound
      );
      if (newlyUnlocked) {
        const def = TOWER_DEFINITIONS[newlyUnlocked];
        this.showBanner(`NEW TECH UNLOCKED: ${def.name.toUpperCase()}`, `${def.role} schematic now online!`);
        GlobalSoundFX.playUpgrade();
      }
      this.updateBuildCardSelection();
    };

    this.engine.waveSystem.onVictory = () => {
      this.showVictory();
    };

    // Restart Actions
    this.btnRestartGame?.addEventListener('click', () => {
      this.restartGame();
    });

    this.btnPlayAgain?.addEventListener('click', () => {
      this.restartGame();
    });

    // Perf Lab Toggles
    const handlePerfToggle = () => {
      this.togglePerfLab();
    };
    this.btnPerfLab?.addEventListener('click', handlePerfToggle);
    this.mBtnPerf?.addEventListener('click', handlePerfToggle);
    this.btnClosePerf?.addEventListener('click', () => {
      this.perfLabModal.classList.add('hidden');
    });

    // Optimization Toggles
    this.toggleSpatialGrid?.addEventListener('change', () => {
      this.engine.combatSystem.useSpatialGrid = this.toggleSpatialGrid.checked;
    });

    this.toggleObjectPooling?.addEventListener('change', () => {
      this.engine.entityMgr.useObjectPooling = this.toggleObjectPooling.checked;
    });

    this.toggleViewportCulling?.addEventListener('change', () => {
      this.scene.useViewportCulling = this.toggleViewportCulling.checked;
    });

    this.toggleBatchRender?.addEventListener('change', () => {
      this.scene.useBatchRender = this.toggleBatchRender.checked;
    });

    // Benchmark Presets
    document.getElementById('btn-bench-normal')?.addEventListener('click', () => this.engine.applyBenchmarkPreset('NORMAL'));
    document.getElementById('btn-bench-heavy')?.addEventListener('click', () => this.engine.applyBenchmarkPreset('HEAVY'));
    document.getElementById('btn-bench-assignment')?.addEventListener('click', () => this.engine.applyBenchmarkPreset('ASSIGNMENT'));
    document.getElementById('btn-bench-extreme')?.addEventListener('click', () => this.engine.applyBenchmarkPreset('EXTREME'));

    // Manual Spawners
    document.getElementById('spawn-e-100')?.addEventListener('click', () => this.engine.injectEnemies(100));
    document.getElementById('spawn-e-1000')?.addEventListener('click', () => this.engine.injectEnemies(1000));
    document.getElementById('spawn-e-5000')?.addEventListener('click', () => this.engine.injectEnemies(5000));
    document.getElementById('spawn-t-50')?.addEventListener('click', () => this.engine.injectTowers(50));
    document.getElementById('spawn-p-500')?.addEventListener('click', () => this.engine.injectProjectiles(500));
    document.getElementById('btn-reset-arena')?.addEventListener('click', () => this.engine.entityMgr.clearAll());

    // Formal Benchmark Runner
    this.btnRunFormalBenchmark?.addEventListener('click', () => {
      const seed = parseInt(this.inputBenchSeed.value, 10) || 74921;
      this.benchStatus.textContent = 'Running 600-frame benchmark... Please wait.';
      this.engine.perfMonitor.startBenchmark('ASSIGNMENT_STRESS', seed, 600, result => {
        this.benchStatus.textContent = `Completed in ${(result.durationMs / 1000).toFixed(2)}s!`;
        this.benchResultsArea.classList.remove('hidden');
        this.benchOutput.textContent =
          `| Metric | Measured Value |\n` +
          `|---|---:|\n` +
          `| Preset | ${result.presetName} |\n` +
          `| Seed | ${result.seed} |\n` +
          `| Enemies | ${result.enemies} |\n` +
          `| Towers | ${result.towers} |\n` +
          `| Projectiles | ${result.projectiles} |\n` +
          `| Average FPS | ${result.avgFps} FPS |\n` +
          `| Average Frame Time | ${result.avgFrameTime} ms |\n` +
          `| P95 Frame Time | ${result.p95FrameTime} ms |\n` +
          `| P99 Frame Time | ${result.p99FrameTime} ms |\n` +
          `| Frames >16.6ms | ${result.pctOver16ms}% |\n` +
          `| Frames >33.3ms (Target <5%) | ${result.pctOver33ms}% |\n` +
          `| Simulation Time | ${result.avgSimTime} ms |\n` +
          `| Targeting Time | ${result.avgTargetingTime} ms |\n` +
          `| Rendering Time | ${result.avgRenderTime} ms |\n\n` +
          `Markdown Table Row:\n` +
          result.markdownSummary;
      });
    });

    this.btnCopyBench?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.benchOutput.textContent || '');
      this.btnCopyBench.textContent = 'Copied!';
      setTimeout(() => (this.btnCopyBench.textContent = 'Copy to Clipboard'), 2000);
    });
  }

  private bindKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Hotkeys 1-8 for towers
      if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(e.key)) {
        const types: TowerType[] = ['pulse', 'tesla', 'mortar', 'cryo', 'railgun', 'laser', 'flak', 'vortex'];
        const idx = parseInt(e.key, 10) - 1;
        const type = types[idx];
        if (type) {
          const curRound = this.engine.waveSystem.currentWaveNumber;
          const def = TOWER_DEFINITIONS[type];
          if (curRound < def.unlockWave) {
            this.showBanner('LOCKED SCHEMATIC', `${def.name} unlocks at Round ${def.unlockWave}.`);
            return;
          }
          this.scene.selectedBuildType = (this.scene.selectedBuildType === type) ? null : type;
          this.scene.selectedTowerId = null;
          this.updateTowerInspectPanel(null);
          this.updateBuildCardSelection();
          GlobalSoundFX.playUIClick();
        }
      }

      // Space / P for pause or intro modal dismiss
      if (e.code === 'Space' || e.key.toLowerCase() === 'p') {
        if (!this.introModal.classList.contains('hidden')) {
          this.introModal.classList.add('hidden');
          GlobalSoundFX.playUIClick();
          return;
        }
        const isPaused = this.engine.togglePause();
        this.btnPause.classList.toggle('active', isPaused);
        this.mBtnPause?.classList.toggle('active', isPaused);
        GlobalSoundFX.playUIClick();
      }

      // F for Fullscreen
      if (e.key.toLowerCase() === 'f' && e.key !== 'F3') {
        this.scene.toggleFullscreen();
        GlobalSoundFX.playUIClick();
      }

      // Q for Orbital EMP
      if (e.key.toLowerCase() === 'q') {
        this.triggerTacticalEMP();
      }

      // E for Orbital Bombardment
      if (e.key.toLowerCase() === 'e') {
        this.triggerTacticalBombardment();
      }

      // Esc for Deselect
      if (e.key === 'Escape') {
        this.scene.selectedTowerId = null;
        this.scene.selectedBuildType = null;
        this.updateTowerInspectPanel(null);
        this.towerDrawerModal.classList.add('hidden');
        this.mobileMenuDrawer.classList.add('hidden');
        this.perfLabModal.classList.add('hidden');
        this.updateBuildCardSelection();
      }

      // F3 for Perf Lab
      if (e.key === 'F3') {
        e.preventDefault();
        this.togglePerfLab();
      }
    });
  }

  public triggerTacticalEMP(): void {
    if (this.engine.economySystem.spendCredits(200)) {
      const hits = this.engine.entityMgr.triggerOrbitalEMP();
      GlobalSoundFX.playBossKlaxon();
      this.showBanner('ORBITAL EMP DISCHARGED', `${hits} hostiles paralyzed & shields neutralized!`);
      this.updateHUD();
    } else {
      this.showBanner('INSUFFICIENT CREDITS', 'Orbital EMP requires $200 credits.');
    }
  }

  public triggerTacticalBombardment(): void {
    if (this.engine.economySystem.spendCredits(300)) {
      this.engine.entityMgr.triggerOrbitalBombardment(640, 360, 220, 1500);
      GlobalSoundFX.playMortarExplosion();
      this.showBanner('ORBITAL BOMBARDMENT FIRED', `Atmospheric kinetic strike hit sector.`);
      this.updateHUD();
    } else {
      this.showBanner('INSUFFICIENT CREDITS', 'Bombardment strike requires $300 credits.');
    }
  }

  public togglePerfLab(): void {
    this.perfLabModal.classList.toggle('hidden');
    GlobalSoundFX.playUIClick();
  }

  private flashBreachVignette(): void {
    if (this.breachVignette) {
      this.breachVignette.classList.add('active');
      setTimeout(() => {
        this.breachVignette.classList.remove('active');
      }, 250);
    }
  }

  public updateHUD(): void {
    const eco = this.engine.economySystem;
    const wave = this.engine.waveSystem;

    // Health
    const hpPct = Math.max(0, eco.coreHealth / eco.maxCoreHealth) * 100;
    this.coreHealthFill.style.width = `${hpPct}%`;
    this.coreHealthText.textContent = `${Math.ceil(eco.coreHealth)} / ${eco.maxCoreHealth}`;

    // Critical Energy Warning
    if (eco.coreHealth <= 25) {
      this.coreHealthCard.classList.add('critical-energy');
    } else {
      this.coreHealthCard.classList.remove('critical-energy');
    }

    // Credits & Score
    this.creditsText.textContent = `$${eco.credits}`;
    this.scoreText.textContent = eco.score.toLocaleString();

    // Round
    this.waveText.textContent = `${wave.currentWaveNumber} / ${wave.totalWaves}`;

    // Tactical buttons state
    if (this.btnTacticalEmp) this.btnTacticalEmp.disabled = (eco.credits < 200);
    if (this.btnTacticalBombard) this.btnTacticalBombard.disabled = (eco.credits < 300);

    // Wave Action Button State
    if (wave.waveInProgress) {
      this.waveActionContainer.classList.add('hidden');
    } else {
      this.waveActionContainer.classList.remove('hidden');
      this.waveBtnLabel.textContent = `ENGAGE ROUND ${wave.currentWaveNumber}`;
      if (wave.isAutoStartActive) {
        this.waveAutoCountdown.textContent = `Auto-launch in ${Math.ceil(wave.autoStartCountdown)}s...`;
      } else {
        this.waveAutoCountdown.textContent = 'Awaiting launch command';
      }
    }

    this.updateBuildCardSelection();
  }

  public updateTowerInspectPanel(towerId: number | null): void {
    if (towerId === null) {
      this.contextInspector.classList.add('hidden');
      this.buildDeckWrapper.classList.remove('hidden');
      return;
    }

    const t = this.engine.entityMgr.towers.find(tow => tow.id === towerId);
    if (!t) {
      this.contextInspector.classList.add('hidden');
      this.buildDeckWrapper.classList.remove('hidden');
      return;
    }

    const def = TOWER_DEFINITIONS[t.type];
    const stats = t.currentStats;
    const isMax = (t.level >= def.levels.length);
    const nextStats = isMax ? stats : def.levels[t.level];

    // Morph dock into Context Inspector
    this.buildDeckWrapper.classList.add('hidden');
    this.contextInspector.classList.remove('hidden');

    this.ciIcon.textContent = def.iconChar || '◈';
    this.ciName.textContent = def.name.toUpperCase();
    this.ciTier.textContent = `MK ${t.level} DEFENSE // ${def.role.toUpperCase()}`;

    // Comparison Stats
    const curRate = Math.round((1 / stats.attackInterval) * 10) / 10;
    const nextRate = Math.round((1 / nextStats.attackInterval) * 10) / 10;
    const curDps = Math.round(stats.damage * curRate * 10) / 10;
    const nextDps = Math.round(nextStats.damage * nextRate * 10) / 10;

    if (isMax) {
      this.ciDmg.textContent = `${stats.damage} (MAX)`;
      this.ciRange.textContent = `${stats.range}`;
      this.ciRate.textContent = `${curRate}/s`;
      this.ciDps.textContent = `${curDps}`;
      this.ciBtnUpgrade.disabled = true;
      this.ciUpgradeTitle.textContent = `MAX LEVEL`;
      this.ciUpgradeCost.textContent = `---`;
    } else {
      this.ciDmg.textContent = `${stats.damage} → ${nextStats.damage}`;
      this.ciRange.textContent = `${stats.range} → ${nextStats.range}`;
      this.ciRate.textContent = `${curRate}/s → ${nextRate}/s`;
      this.ciDps.textContent = `${curDps} → ${nextDps}`;
      this.ciBtnUpgrade.disabled = (this.engine.economySystem.credits < stats.upgradeCost);
      this.ciUpgradeTitle.textContent = `UPGRADE MK ${t.level + 1}`;
      this.ciUpgradeCost.textContent = `$${stats.upgradeCost}`;
    }

    // Sell value
    this.ciSellCost.textContent = `+$${stats.sellValue}`;

    // Target strategy button
    this.ciTargetToggle.textContent = `${t.targetingStrategy.toUpperCase()} ▾`;
  }

  public showBanner(title: string, sub: string): void {
    this.bannerTitle.textContent = title;
    this.bannerSub.textContent = sub;
    this.centerBanner.classList.remove('hidden');
    setTimeout(() => {
      this.centerBanner.classList.add('hidden');
    }, 3200);
  }

  public showGameOver(): void {
    const curRound = this.engine.waveSystem.currentWaveNumber;
    const kills = this.engine.economySystem.totalKills;
    const score = this.engine.economySystem.score;

    this.goRating.className = 'rating-badge rating-c';
    this.goRating.textContent = 'C';
    this.goWave.textContent = `${curRound} / 50`;
    this.goKills.textContent = `${kills}`;
    this.goDamage.textContent = `${Math.round(this.totalDamageDealt).toLocaleString()}`;
    this.goCredits.textContent = `$${Math.round(this.totalCreditsEarned).toLocaleString()}`;
    this.goMvp.textContent = this.getMvpTowerDescription();
    this.goScore.textContent = score.toLocaleString();

    this.gameOverModal.classList.remove('hidden');
  }

  public showVictory(): void {
    const kills = this.engine.economySystem.totalKills;
    const score = this.engine.economySystem.score;
    const hpPct = Math.round((this.engine.economySystem.coreHealth / this.engine.economySystem.maxCoreHealth) * 100);

    let rating = 'A';
    let ratingClass = 'rating-a';
    if (hpPct >= 90) {
      rating = 'S+';
      ratingClass = 'rating-s';
    } else if (hpPct >= 75) {
      rating = 'A';
      ratingClass = 'rating-a';
    } else if (hpPct >= 50) {
      rating = 'B';
      ratingClass = 'rating-b';
    } else {
      rating = 'C';
      ratingClass = 'rating-c';
    }

    this.vicRating.className = `rating-badge ${ratingClass}`;
    this.vicRating.textContent = rating;
    this.vicKills.textContent = `${kills}`;
    this.vicDamage.textContent = `${Math.round(this.totalDamageDealt).toLocaleString()}`;
    this.vicCredits.textContent = `$${Math.round(this.totalCreditsEarned).toLocaleString()}`;
    this.vicHealth.textContent = `${hpPct}%`;
    this.vicMvp.textContent = this.getMvpTowerDescription();
    this.vicScore.textContent = score.toLocaleString();

    this.victoryModal.classList.remove('hidden');
  }

  private getMvpTowerDescription(): string {
    const towers = this.engine.entityMgr.towers;
    if (towers.length === 0) return 'Pulse Cannon';
    const counts: Record<string, number> = {};
    towers.forEach(t => {
      counts[t.type] = (counts[t.type] || 0) + 1;
    });
    let bestType = towers[0].type;
    let maxCount = 0;
    for (const type in counts) {
      if (counts[type] > maxCount) {
        maxCount = counts[type];
        bestType = type as TowerType;
      }
    }
    const def = TOWER_DEFINITIONS[bestType];
    return `${def.name} (${maxCount} deployed)`;
  }

  public restartGame(): void {
    this.gameOverModal.classList.add('hidden');
    this.victoryModal.classList.add('hidden');
    this.updateTowerInspectPanel(null);
    this.scene.selectedTowerId = null;
    this.scene.selectedBuildType = null;
    this.totalDamageDealt = 0;
    this.totalCreditsEarned = 0;
    this.engine.restartGame();
    this.updateHUD();
  }

  // Periodic Telemetry & Mini-Map Update
  public tickTelemetry(dt: number): void {
    this.telemetryTimer += dt;
    this.radarTimer += dt;

    // Check Base Threat Alert
    if (this.scene.isBaseInDanger) {
      this.baseDangerAlert.classList.remove('hidden');
    } else {
      this.baseDangerAlert.classList.add('hidden');
    }

    // Mini-map radar redraw every ~100ms
    if (this.radarTimer >= 0.1 && !this.radarContainer.classList.contains('hidden')) {
      this.radarTimer = 0;
      this.renderRadar();
    }

    if (this.telemetryTimer >= 0.15) {
      this.telemetryTimer = 0;
      this.updateHUD();

      if (!this.perfLabModal.classList.contains('hidden')) {
        const snap = this.engine.perfMonitor.getSnapshot(
          this.engine.entityMgr.activeEnemyCount,
          this.engine.entityMgr.towers.length,
          this.engine.entityMgr.activeProjCount,
          this.engine.entityMgr.particles.filter(p => p.active).length
        );

        this.mFps.textContent = snap.fps.toFixed(1);
        this.mFrameTime.textContent = `${snap.frameTime} ms`;
        this.mP95.textContent = `${snap.p95FrameTime} ms`;
        this.mP99.textContent = `${snap.p99FrameTime} ms`;
        this.mF16.textContent = `${snap.framesOver16msPct}%`;
        this.mF33.textContent = `${snap.framesOver33msPct}%`;
        this.mSimTime.textContent = `${snap.simTime} ms`;
        this.mTargetTime.textContent = `${snap.targetingTime} ms`;
        this.mRenderTime.textContent = `${snap.renderTime} ms`;
        this.mEnemies.textContent = `${snap.activeEnemies}`;
        this.mTowers.textContent = `${snap.activeTowers}`;
        this.mProjectiles.textContent = `${snap.activeProjectiles}`;
      }
    }
  }

  private renderRadar(): void {
    if (!this.radarCtx || !this.radarCanvas) return;
    const ctx = this.radarCtx;
    const rw = this.radarCanvas.width;
    const rh = this.radarCanvas.height;
    const sx = rw / 1280;
    const sy = rh / 720;

    ctx.fillStyle = '#03060f';
    ctx.fillRect(0, 0, rw, rh);

    // Draw Conduit Path
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const wps = GlobalPathSystem.waypoints;
    ctx.moveTo(wps[0].x * sx, wps[0].y * sy);
    for (let i = 1; i < wps.length; i++) {
      ctx.lineTo(wps[i].x * sx, wps[i].y * sy);
    }
    ctx.stroke();

    // Draw Energy Core Base
    const core = GlobalPathSystem.corePosition;
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(core.x * sx, core.y * sy, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw Placed Towers
    ctx.fillStyle = '#00f3ff';
    for (const t of this.engine.entityMgr.towers) {
      ctx.beginPath();
      ctx.arc(t.x * sx, t.y * sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Active Enemies
    const em = this.engine.entityMgr;
    const eCount = em.activeEnemyCount;
    const eIndices = em.activeEnemyIndices;
    ctx.fillStyle = '#ff0055';
    for (let i = 0; i < eCount; i++) {
      const slot = eIndices[i];
      if (em.enemyActive[slot] === 1) {
        ctx.beginPath();
        const r = em.enemyIsBoss[slot] === 1 ? 3.5 : 1.5;
        ctx.arc(em.enemyX[slot] * sx, em.enemyY[slot] * sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
