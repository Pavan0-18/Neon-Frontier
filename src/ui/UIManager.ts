import { GameEngine, GameSpeed } from '../game/engine/GameEngine';
import { DefenseScene } from '../game/rendering/PhaserGame';
import { TOWER_DEFINITIONS, TowerType, TargetingStrategy } from '../data/towers';
import { GlobalSoundFX } from '../audio/SoundFX';
import { GlobalRNG } from '../game/engine/RNG';

export class UIManager {
  private engine: GameEngine;
  private scene: DefenseScene;

  // DOM Elements
  private coreHealthFill!: HTMLElement;
  private coreHealthText!: HTMLElement;
  private creditsText!: HTMLElement;
  private waveText!: HTMLElement;
  private scoreText!: HTMLElement;
  private seedDisplay!: HTMLElement;

  private btnPause!: HTMLElement;
  private speedBtns: Record<number, HTMLElement> = {};
  private btnAudio!: HTMLElement;
  private btnPerfLab!: HTMLElement;

  private waveActionContainer!: HTMLElement;
  private btnStartWave!: HTMLElement;
  private waveBtnLabel!: HTMLElement;
  private waveAutoCountdown!: HTMLElement;

  private buildDeck!: HTMLElement;
  private towerPanel!: HTMLElement;
  private panelTowerType!: HTMLElement;
  private panelTowerLevel!: HTMLElement;
  private pDmg!: HTMLElement;
  private pRange!: HTMLElement;
  private pRate!: HTMLElement;
  private pDps!: HTMLElement;
  private targetBtns: NodeListOf<HTMLElement> | null = null;
  private btnUpgradeTower!: HTMLButtonElement;
  private upgradeCostText!: HTMLElement;
  private btnSellTower!: HTMLElement;
  private sellValueText!: HTMLElement;
  private panelCloseBtn!: HTMLElement;

  // Modals
  private centerBanner!: HTMLElement;
  private bannerTitle!: HTMLElement;
  private bannerSub!: HTMLElement;

  private gameOverModal!: HTMLElement;
  private goWave!: HTMLElement;
  private goKills!: HTMLElement;
  private goScore!: HTMLElement;
  private btnRestartGame!: HTMLElement;

  private victoryModal!: HTMLElement;
  private vicKills!: HTMLElement;
  private vicScore!: HTMLElement;
  private vicHealth!: HTMLElement;
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

  private telemetryTimer: number = 0;

  constructor(engine: GameEngine, scene: DefenseScene) {
    this.engine = engine;
    this.scene = scene;
    this.cacheDOMElements();
    this.initBuildDeck();
    this.bindEvents();
    this.bindKeyboardShortcuts();
    this.updateHUD();
  }

  private cacheDOMElements(): void {
    this.coreHealthFill = document.getElementById('core-health-fill')!;
    this.coreHealthText = document.getElementById('core-health-text')!;
    this.creditsText = document.getElementById('credits-text')!;
    this.waveText = document.getElementById('wave-text')!;
    this.scoreText = document.getElementById('score-text')!;
    this.seedDisplay = document.getElementById('seed-display')!;

    this.btnPause = document.getElementById('btn-pause')!;
    this.speedBtns[1] = document.getElementById('btn-speed-1')!;
    this.speedBtns[2] = document.getElementById('btn-speed-2')!;
    this.speedBtns[4] = document.getElementById('btn-speed-4')!;
    this.btnAudio = document.getElementById('btn-audio')!;
    this.btnPerfLab = document.getElementById('btn-perf-lab')!;

    this.waveActionContainer = document.getElementById('wave-action-container')!;
    this.btnStartWave = document.getElementById('btn-start-wave')!;
    this.waveBtnLabel = document.getElementById('wave-btn-label')!;
    this.waveAutoCountdown = document.getElementById('wave-auto-countdown')!;

    this.buildDeck = document.getElementById('build-deck')!;
    this.towerPanel = document.getElementById('tower-panel')!;
    this.panelTowerType = document.getElementById('panel-tower-type')!;
    this.panelTowerLevel = document.getElementById('panel-tower-level')!;
    this.pDmg = document.getElementById('p-dmg')!;
    this.pRange = document.getElementById('p-range')!;
    this.pRate = document.getElementById('p-rate')!;
    this.pDps = document.getElementById('p-dps')!;
    this.targetBtns = document.querySelectorAll('.target-btn');
    this.btnUpgradeTower = document.getElementById('btn-upgrade-tower') as HTMLButtonElement;
    this.upgradeCostText = document.getElementById('upgrade-cost-text')!;
    this.btnSellTower = document.getElementById('btn-sell-tower')!;
    this.sellValueText = document.getElementById('sell-value-text')!;
    this.panelCloseBtn = document.getElementById('panel-close-btn')!;

    this.centerBanner = document.getElementById('center-banner')!;
    this.bannerTitle = document.getElementById('banner-title')!;
    this.bannerSub = document.getElementById('banner-sub')!;

    this.gameOverModal = document.getElementById('game-over-modal')!;
    this.goWave = document.getElementById('go-wave')!;
    this.goKills = document.getElementById('go-kills')!;
    this.goScore = document.getElementById('go-score')!;
    this.btnRestartGame = document.getElementById('btn-restart-game')!;

    this.victoryModal = document.getElementById('victory-modal')!;
    this.vicKills = document.getElementById('vic-kills')!;
    this.vicScore = document.getElementById('vic-score')!;
    this.vicHealth = document.getElementById('vic-health')!;
    this.btnPlayAgain = document.getElementById('btn-play-again')!;

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

    this.seedDisplay.textContent = `#${GlobalRNG.getSeed()}`;
  }

  private initBuildDeck(): void {
    const types: TowerType[] = ['pulse', 'tesla', 'mortar', 'cryo', 'railgun'];
    this.buildDeck.innerHTML = '';

    types.forEach((type, idx) => {
      const def = TOWER_DEFINITIONS[type];
      const card = document.createElement('div');
      card.className = 'tower-card';
      card.dataset.towerType = type;
      card.innerHTML = `
        <span class="tc-hotkey">[${idx + 1}]</span>
        <div class="tc-icon">
          <svg width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="12" fill="none" stroke="${def.colorHex}" stroke-width="2" />
            <circle cx="14" cy="14" r="6" fill="${def.colorHex}" />
          </svg>
        </div>
        <span class="tc-name">${def.name}</span>
        <span class="tc-cost">$${def.baseCost}</span>
      `;

      card.addEventListener('click', () => {
        GlobalSoundFX.playUIClick();
        if (this.scene.selectedBuildType === type) {
          this.scene.selectedBuildType = null;
        } else {
          this.scene.selectedBuildType = type;
          this.scene.selectedTowerId = null;
          this.towerPanel.classList.add('hidden');
        }
        this.updateBuildCardSelection();
      });

      this.buildDeck.appendChild(card);
    });
  }

  private updateBuildCardSelection(): void {
    const cards = this.buildDeck.querySelectorAll('.tower-card');
    cards.forEach(c => {
      const cardEl = c as HTMLElement;
      const t = cardEl.dataset.towerType as TowerType;
      const def = TOWER_DEFINITIONS[t];

      if (this.scene.selectedBuildType === t) {
        cardEl.classList.add('selected');
      } else {
        cardEl.classList.remove('selected');
      }

      if (this.engine.economySystem.credits < def.baseCost) {
        cardEl.classList.add('disabled');
      } else {
        cardEl.classList.remove('disabled');
      }
    });
  }

  private bindEvents(): void {
    // Speed Controls
    this.btnPause.addEventListener('click', () => {
      const isPaused = this.engine.togglePause();
      this.btnPause.classList.toggle('active', isPaused);
      GlobalSoundFX.playUIClick();
    });

    [1, 2, 4].forEach(s => {
      this.speedBtns[s].addEventListener('click', () => {
        this.engine.setSpeed(s as GameSpeed);
        this.btnPause.classList.remove('active');
        [1, 2, 4].forEach(k => this.speedBtns[k].classList.remove('active'));
        this.speedBtns[s].classList.add('active');
        GlobalSoundFX.playUIClick();
      });
    });

    // Audio Toggle
    this.btnAudio.addEventListener('click', () => {
      const muted = GlobalSoundFX.toggleMute();
      this.btnAudio.textContent = muted ? '🔇' : '🔊';
      GlobalSoundFX.playUIClick();
    });

    // Wave Actions
    this.btnStartWave.addEventListener('click', () => {
      this.engine.waveSystem.startNextWave();
      GlobalSoundFX.playUIClick();
    });

    // Tower Selection Callback from Scene
    this.scene.onTowerSelected = (towerId: number | null) => {
      this.updateTowerInspectPanel(towerId);
    };

    this.scene.onTowerPlaced = () => {
      GlobalSoundFX.playBuild();
      this.updateBuildCardSelection();
    };

    // Close Inspect Panel
    this.panelCloseBtn.addEventListener('click', () => {
      this.scene.selectedTowerId = null;
      this.towerPanel.classList.add('hidden');
      GlobalSoundFX.playUIClick();
    });

    // Upgrade Tower Button
    this.btnUpgradeTower.addEventListener('click', () => {
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
    this.btnSellTower.addEventListener('click', () => {
      if (this.scene.selectedTowerId !== null) {
        const t = this.engine.entityMgr.towers.find(tow => tow.id === this.scene.selectedTowerId);
        if (t) {
          this.engine.economySystem.addCredits(t.currentStats.sellValue);
          this.engine.entityMgr.removeTower(t.id);
          GlobalSoundFX.playSell();
          this.scene.selectedTowerId = null;
          this.towerPanel.classList.add('hidden');
        }
      }
    });

    // Targeting Mode Selection
    if (this.targetBtns) {
      this.targetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.scene.selectedTowerId !== null) {
            const t = this.engine.entityMgr.towers.find(tow => tow.id === this.scene.selectedTowerId);
            if (t) {
              const mode = btn.dataset.mode as TargetingStrategy;
              t.targetingStrategy = mode;
              this.targetBtns!.forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              GlobalSoundFX.playUIClick();
            }
          }
        });
      });
    }

    // Engine Callbacks
    this.engine.economySystem.onStateChange = () => {
      this.updateHUD();
    };

    this.engine.economySystem.onGameOver = () => {
      this.showGameOver();
    };

    this.engine.waveSystem.onWaveStart = (w, isBoss, bossName) => {
      if (isBoss) {
        this.showBanner('CRITICAL THREAT DETECTED', `${bossName || 'BOSS UNIT'} APPROACHING`);
      } else {
        this.showBanner(`WAVE ${w} INBOUND`, 'DEFEND THE ENERGY CONDUIT');
      }
      this.updateHUD();
    };

    this.engine.waveSystem.onVictory = () => {
      this.showVictory();
    };

    // Restart Actions
    this.btnRestartGame.addEventListener('click', () => {
      this.restartGame();
    });

    this.btnPlayAgain.addEventListener('click', () => {
      this.restartGame();
    });

    // Perf Lab Toggle
    this.btnPerfLab.addEventListener('click', () => {
      this.togglePerfLab();
    });

    this.btnClosePerf.addEventListener('click', () => {
      this.perfLabModal.classList.add('hidden');
    });

    // Optimization Toggles
    this.toggleSpatialGrid.addEventListener('change', () => {
      this.engine.combatSystem.useSpatialGrid = this.toggleSpatialGrid.checked;
    });

    this.toggleObjectPooling.addEventListener('change', () => {
      this.engine.entityMgr.useObjectPooling = this.toggleObjectPooling.checked;
    });

    this.toggleViewportCulling.addEventListener('change', () => {
      this.scene.useViewportCulling = this.toggleViewportCulling.checked;
    });

    this.toggleBatchRender.addEventListener('change', () => {
      this.scene.useBatchRender = this.toggleBatchRender.checked;
    });

    // Benchmark Presets
    document.getElementById('btn-bench-normal')?.addEventListener('click', () => {
      this.engine.applyBenchmarkPreset('NORMAL');
    });
    document.getElementById('btn-bench-heavy')?.addEventListener('click', () => {
      this.engine.applyBenchmarkPreset('HEAVY');
    });
    document.getElementById('btn-bench-assignment')?.addEventListener('click', () => {
      this.engine.applyBenchmarkPreset('ASSIGNMENT');
    });
    document.getElementById('btn-bench-extreme')?.addEventListener('click', () => {
      this.engine.applyBenchmarkPreset('EXTREME');
    });

    // Manual Spawners
    document.getElementById('spawn-e-100')?.addEventListener('click', () => this.engine.injectEnemies(100));
    document.getElementById('spawn-e-1000')?.addEventListener('click', () => this.engine.injectEnemies(1000));
    document.getElementById('spawn-e-5000')?.addEventListener('click', () => this.engine.injectEnemies(5000));
    document.getElementById('spawn-t-50')?.addEventListener('click', () => this.engine.injectTowers(50));
    document.getElementById('spawn-p-500')?.addEventListener('click', () => this.engine.injectProjectiles(500));
    document.getElementById('btn-reset-arena')?.addEventListener('click', () => this.engine.entityMgr.clearAll());

    // Formal Benchmark Runner
    this.btnRunFormalBenchmark.addEventListener('click', () => {
      const seed = parseInt(this.inputBenchSeed.value, 10) || 74921;
      this.benchStatus.textContent = 'Running 600-frame benchmark... Please wait.';
      this.engine.perfMonitor.startBenchmark(
        'ASSIGNMENT_STRESS',
        seed,
        600,
        result => {
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
        }
      );
    });

    this.btnCopyBench.addEventListener('click', () => {
      navigator.clipboard.writeText(this.benchOutput.textContent || '');
      this.btnCopyBench.textContent = 'Copied!';
      setTimeout(() => (this.btnCopyBench.textContent = 'Copy to Clipboard'), 2000);
    });
  }

  private bindKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Hotkeys 1-5 for towers
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const types: TowerType[] = ['pulse', 'tesla', 'mortar', 'cryo', 'railgun'];
        const idx = parseInt(e.key, 10) - 1;
        const type = types[idx];
        if (type) {
          this.scene.selectedBuildType = (this.scene.selectedBuildType === type) ? null : type;
          this.scene.selectedTowerId = null;
          this.towerPanel.classList.add('hidden');
          this.updateBuildCardSelection();
          GlobalSoundFX.playUIClick();
        }
      }

      // Space / P for pause
      if (e.code === 'Space' || e.key.toLowerCase() === 'p') {
        const isPaused = this.engine.togglePause();
        this.btnPause.classList.toggle('active', isPaused);
        GlobalSoundFX.playUIClick();
      }

      // F3 for Perf Lab
      if (e.key === 'F3') {
        e.preventDefault();
        this.togglePerfLab();
      }
    });
  }

  public togglePerfLab(): void {
    this.perfLabModal.classList.toggle('hidden');
    GlobalSoundFX.playUIClick();
  }

  public updateHUD(): void {
    const eco = this.engine.economySystem;
    const wave = this.engine.waveSystem;

    // Health
    const hpPct = Math.max(0, eco.coreHealth / eco.maxCoreHealth) * 100;
    this.coreHealthFill.style.width = `${hpPct}%`;
    this.coreHealthText.textContent = `${Math.ceil(eco.coreHealth)} / ${eco.maxCoreHealth}`;

    // Credits & Score
    this.creditsText.textContent = `$${eco.credits}`;
    this.scoreText.textContent = eco.score.toLocaleString();

    // Wave
    this.waveText.textContent = `${wave.currentWaveNumber} / ${wave.totalWaves}`;

    // Wave Action Button State
    if (wave.waveInProgress) {
      this.waveActionContainer.classList.add('hidden');
    } else {
      this.waveActionContainer.classList.remove('hidden');
      this.waveBtnLabel.textContent = `INITIATE WAVE ${wave.currentWaveNumber}`;
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
      this.towerPanel.classList.add('hidden');
      return;
    }

    const t = this.engine.entityMgr.towers.find(tow => tow.id === towerId);
    if (!t) {
      this.towerPanel.classList.add('hidden');
      return;
    }

    const def = TOWER_DEFINITIONS[t.type];
    const stats = t.currentStats;

    this.towerPanel.classList.remove('hidden');
    this.panelTowerType.textContent = def.name.toUpperCase();
    this.panelTowerLevel.textContent = `MK ${t.level}`;
    this.pDmg.textContent = `${stats.damage}`;
    this.pRange.textContent = `${stats.range}`;
    const rate = Math.round((1 / stats.attackInterval) * 10) / 10;
    this.pRate.textContent = `${rate}/s`;
    this.pDps.textContent = `${Math.round(stats.damage * rate * 10) / 10}`;

    // Targeting buttons active state
    if (this.targetBtns) {
      this.targetBtns.forEach(btn => {
        if (btn.dataset.mode === t.targetingStrategy) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    // Upgrade Button
    if (t.level < def.levels.length) {
      const nextLevelStats = def.levels[t.level];
      this.btnUpgradeTower.disabled = (this.engine.economySystem.credits < stats.upgradeCost);
      this.btnUpgradeTower.querySelector('.action-name')!.textContent = `UPGRADE TO MK ${t.level + 1}`;
      this.upgradeCostText.textContent = `$${stats.upgradeCost}`;
    } else {
      this.btnUpgradeTower.disabled = true;
      this.btnUpgradeTower.querySelector('.action-name')!.textContent = `MAX LEVEL`;
      this.upgradeCostText.textContent = `---`;
    }

    // Sell Button
    this.sellValueText.textContent = `+$${stats.sellValue}`;
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
    this.goWave.textContent = `${this.engine.waveSystem.currentWaveNumber} / 50`;
    this.goKills.textContent = `${this.engine.economySystem.totalKills}`;
    this.goScore.textContent = `${this.engine.economySystem.score.toLocaleString()}`;
    this.gameOverModal.classList.remove('hidden');
  }

  public showVictory(): void {
    this.vicKills.textContent = `${this.engine.economySystem.totalKills}`;
    this.vicScore.textContent = `${this.engine.economySystem.score.toLocaleString()}`;
    this.vicHealth.textContent = `${Math.round((this.engine.economySystem.coreHealth / this.engine.economySystem.maxCoreHealth) * 100)}%`;
    this.victoryModal.classList.remove('hidden');
  }

  public restartGame(): void {
    this.gameOverModal.classList.add('hidden');
    this.victoryModal.classList.add('hidden');
    this.towerPanel.classList.add('hidden');
    this.scene.selectedTowerId = null;
    this.scene.selectedBuildType = null;
    this.engine.restartGame();
    this.updateHUD();
  }

  // Periodic Telemetry Update (every ~150ms to keep DOM overhead near 0)
  public tickTelemetry(dt: number): void {
    this.telemetryTimer += dt;
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
}
