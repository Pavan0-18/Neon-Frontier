import { GameEngine, GameSpeed } from '../game/engine/GameEngine';
import { DefenseScene } from '../game/rendering/PhaserGame';
import { TOWER_DEFINITIONS, TowerType, TargetingStrategy } from '../data/towers';
import { GlobalSoundFX } from '../audio/SoundFX';
import { CHALLENGES, ChallengeDef } from '../data/challenges';
import { ProgressionManager, CORE_LEVEL_UNLOCKS } from '../data/progression';

export class UIManager {
  private engine: GameEngine;
  private scene: DefenseScene;

  // 1. Main Menu Screen
  private mainMenuScreen!: HTMLElement;
  private btnMenuChallenge!: HTMLElement;
  private btnMenuTutorial!: HTMLElement;
  private btnMenuArmory!: HTMLElement;
  private btnMenuProfile!: HTMLElement;
  private btnMenuSettings!: HTMLElement;

  // Tutorial Modal
  private tutorialModal!: HTMLElement;
  private btnCloseTutorial!: HTMLElement;
  private btnSkipTutorial!: HTMLElement;
  private btnFinishTutorial!: HTMLElement;
  private btnHudTutorial!: HTMLElement;

  // 2. Challenge / Level Select Screen & Navigation Bar
  private challengeSelectScreen!: HTMLElement;
  private btnChallengeBack!: HTMLElement;
  private levelNavBar!: HTMLElement;
  private btnPrevChallenge!: HTMLButtonElement;
  private btnNextChallenge!: HTMLButtonElement;
  private btnDeployChallenge!: HTMLButtonElement;

  private ccTagline!: HTMLElement;
  private ccTitle!: HTMLElement;
  private ccStars!: HTMLElement;
  private ccDesc!: HTMLElement;
  private ccModifiers!: HTMLElement;
  private ccRewardCredits!: HTMLElement;
  private ccRewardXp!: HTMLElement;
  private ccRewardUnlock!: HTMLElement;
  private ccUnlockItem!: HTMLElement;

  private currentChallengeIndex: number = 0;

  // 3. Tech Armory Modal
  private armoryModal!: HTMLElement;
  private btnCloseArmory!: HTMLElement;
  private armoryTowerList!: HTMLElement;
  private armoryTowerDetail!: HTMLElement;
  private selectedArmoryTower: TowerType = 'pulse';

  // 4. Pilot Profile Modal
  private profileModal!: HTMLElement;
  private btnCloseProfile!: HTMLElement;
  private profCoreLevel!: HTMLElement;
  private profXpText!: HTMLElement;
  private profXpFill!: HTMLElement;
  private profClearedCount!: HTMLElement;
  private profTotalScore!: HTMLElement;
  private profTotalKills!: HTMLElement;
  private profTotalCredits!: HTMLElement;
  private profMilestonesList!: HTMLElement;

  // 5. In-Game Minimalist HUD Elements
  private gameHudHeader!: HTMLElement;
  private btnHudMenu!: HTMLElement;
  private btnHudLevels!: HTMLElement;
  private hudMissionName!: HTMLElement;
  private coreHealthText!: HTMLElement;
  private creditsText!: HTMLElement;
  private waveText!: HTMLElement;

  // Screen-space Feedback
  private breachVignette!: HTMLElement;

  // Tactical Command Drawer & Abilities
  private hudAbilitiesContainer!: HTMLElement;
  private btnCommandToggle!: HTMLElement;
  private commandDrawer!: HTMLElement;
  private btnCloseCmd!: HTMLElement;
  private btnTacticalEmp!: HTMLButtonElement;
  private btnTacticalBombard!: HTMLButtonElement;
  private btnTacticalOvercharge!: HTMLButtonElement;

  // Speed Controls
  private btnSpeedCycle!: HTMLElement;
  private btnPause!: HTMLElement;
  private btnSettingsModal!: HTMLElement;

  // Wave Action
  private waveActionContainer!: HTMLElement;
  private btnStartWave!: HTMLElement;
  private waveBtnLabel!: HTMLElement;
  private waveAutoCountdown!: HTMLElement;

  // Free-Placement Build Tray & Controls
  private hudBuildTriggerContainer!: HTMLElement;
  private btnMainBuild!: HTMLElement;
  private btnBuildLabel!: HTMLElement;
  private buildTrayMenu!: HTMLElement;
  private btnCloseTray!: HTMLElement;
  private buildTrayGrid!: HTMLElement;

  // Context Tower Inspector
  private contextNodeMenu!: HTMLElement;
  private cnmName!: HTMLElement;
  private cnmTier!: HTMLElement;
  private cnmCloseBtn!: HTMLElement;
  private cnmDmg!: HTMLElement;
  private cnmRange!: HTMLElement;
  private cnmRate!: HTMLElement;
  private cnmBtnUpgrade!: HTMLButtonElement;
  private cnmUpgradeTitle!: HTMLElement;
  private cnmUpgradeCost!: HTMLElement;
  private cnmBtnSell!: HTMLButtonElement;
  private cnmSellCost!: HTMLElement;
  private cnmTargetToggle!: HTMLButtonElement;

  // Center Notification Banner
  private centerBanner!: HTMLElement;
  private bannerTitle!: HTMLElement;
  private bannerSub!: HTMLElement;
  private bannerTimer: number | null = null;

  // Debrief Modals
  private victoryModal!: HTMLElement;
  private vicMissionTitle!: HTMLElement;
  private vicRating!: HTMLElement;
  private vicXpGained!: HTMLElement;
  private vicCreditsGained!: HTMLElement;
  private vicUnlockBanner!: HTMLElement;
  private vicUnlockedTechName!: HTMLElement;
  private vicWaves!: HTMLElement;
  private vicKills!: HTMLElement;
  private vicScore!: HTMLElement;
  private btnNextMission!: HTMLElement;
  private btnRetryMission!: HTMLElement;
  private btnReturnMenuVic!: HTMLElement;

  private gameOverModal!: HTMLElement;
  private goRating!: HTMLElement;
  private goWave!: HTMLElement;
  private goKills!: HTMLElement;
  private goScore!: HTMLElement;
  private btnRestartGame!: HTMLElement;
  private btnReturnMenuGo!: HTMLElement;

  // Settings & Dev Benchmarks
  private perfLabModal!: HTMLElement;
  private btnClosePerf!: HTMLElement;
  private btnAudioToggle!: HTMLElement;
  private btnFullscreenToggle!: HTMLElement;
  private btnDevModeToggle!: HTMLElement;
  private devMetricsGrid!: HTMLElement;

  private mFps!: HTMLElement;
  private mFrameTime!: HTMLElement;
  private mP95!: HTMLElement;
  private mEnemies!: HTMLElement;
  private mTowers!: HTMLElement;
  private mProjectiles!: HTMLElement;

  private inputBenchSeed!: HTMLInputElement;
  private btnRunFormalBenchmark!: HTMLElement;
  private benchStatus!: HTMLElement;
  private benchResultsArea!: HTMLElement;
  private benchOutput!: HTMLElement;
  private btnCopyBench!: HTMLElement;

  private telemetryTimer: number = 0;
  private readonly targetingCycle: TargetingStrategy[] = ['first', 'last', 'closest', 'strongest', 'weakest'];

  constructor(engine: GameEngine, scene: DefenseScene) {
    this.engine = engine;
    this.scene = scene;
    this.scene.uiManager = this;
    this.cacheDOMElements();
    this.bindEvents();
    this.bindKeyboardShortcuts();
    this.renderBuildTray();
    this.initMainMenu();
    this.checkFirstTimeTutorial();
  }

  private cacheDOMElements(): void {
    // 1. Main Menu
    this.mainMenuScreen = document.getElementById('main-menu-screen')!;
    this.btnMenuChallenge = document.getElementById('btn-menu-challenge')!;
    this.btnMenuTutorial = document.getElementById('btn-menu-tutorial')!;
    this.btnMenuArmory = document.getElementById('btn-menu-armory')!;
    this.btnMenuProfile = document.getElementById('btn-menu-profile')!;
    this.btnMenuSettings = document.getElementById('btn-menu-settings')!;

    // Tutorial Modal
    this.tutorialModal = document.getElementById('tutorial-modal')!;
    this.btnCloseTutorial = document.getElementById('btn-close-tutorial')!;
    this.btnSkipTutorial = document.getElementById('btn-skip-tutorial')!;
    this.btnFinishTutorial = document.getElementById('btn-finish-tutorial')!;

    // 2. Challenge Select & Level Nav Bar
    this.challengeSelectScreen = document.getElementById('challenge-select-screen')!;
    this.btnChallengeBack = document.getElementById('btn-challenge-back')!;
    this.levelNavBar = document.getElementById('level-nav-bar')!;
    this.btnPrevChallenge = document.getElementById('btn-prev-challenge') as HTMLButtonElement;
    this.btnNextChallenge = document.getElementById('btn-next-challenge') as HTMLButtonElement;
    this.btnDeployChallenge = document.getElementById('btn-deploy-challenge') as HTMLButtonElement;

    this.ccTagline = document.getElementById('cc-tagline')!;
    this.ccTitle = document.getElementById('cc-title')!;
    this.ccStars = document.getElementById('cc-stars')!;
    this.ccDesc = document.getElementById('cc-desc')!;
    this.ccModifiers = document.getElementById('cc-modifiers')!;
    this.ccRewardCredits = document.getElementById('cc-reward-credits')!;
    this.ccRewardXp = document.getElementById('cc-reward-xp')!;
    this.ccRewardUnlock = document.getElementById('cc-reward-unlock')!;
    this.ccUnlockItem = document.getElementById('cc-unlock-item')!;

    // 3. Armory Modal
    this.armoryModal = document.getElementById('armory-modal')!;
    this.btnCloseArmory = document.getElementById('btn-close-armory')!;
    this.armoryTowerList = document.getElementById('armory-tower-list')!;
    this.armoryTowerDetail = document.getElementById('armory-tower-detail')!;

    // 4. Profile Modal
    this.profileModal = document.getElementById('profile-modal')!;
    this.btnCloseProfile = document.getElementById('btn-close-profile')!;
    this.profCoreLevel = document.getElementById('prof-core-level')!;
    this.profXpText = document.getElementById('prof-xp-text')!;
    this.profXpFill = document.getElementById('prof-xp-fill')!;
    this.profClearedCount = document.getElementById('prof-cleared-count')!;
    this.profTotalScore = document.getElementById('prof-total-score')!;
    this.profTotalKills = document.getElementById('prof-total-kills')!;
    this.profTotalCredits = document.getElementById('prof-total-credits')!;
    this.profMilestonesList = document.getElementById('prof-milestones-list')!;

    // 5. In-Game HUD
    this.gameHudHeader = document.getElementById('game-hud-header')!;
    this.btnHudMenu = document.getElementById('btn-hud-menu')!;
    this.btnHudLevels = document.getElementById('btn-hud-levels')!;
    this.btnHudTutorial = document.getElementById('btn-hud-tutorial')!;
    this.hudMissionName = document.getElementById('hud-mission-name')!;
    this.coreHealthText = document.getElementById('core-health-text')!;
    this.creditsText = document.getElementById('credits-text')!;
    this.waveText = document.getElementById('wave-text')!;
    this.breachVignette = document.getElementById('breach-vignette')!;

    // Tactical Command Drawer & Abilities
    this.hudAbilitiesContainer = document.getElementById('hud-abilities-container')!;
    this.btnCommandToggle = document.getElementById('btn-command-toggle')!;
    this.commandDrawer = document.getElementById('command-drawer')!;
    this.btnCloseCmd = document.getElementById('btn-close-cmd')!;
    this.btnTacticalEmp = document.getElementById('btn-tactical-emp') as HTMLButtonElement;
    this.btnTacticalBombard = document.getElementById('btn-tactical-bombard') as HTMLButtonElement;
    this.btnTacticalOvercharge = document.getElementById('btn-tactical-overcharge') as HTMLButtonElement;

    // Speed Controls
    this.btnSpeedCycle = document.getElementById('btn-speed-cycle')!;
    this.btnPause = document.getElementById('btn-pause')!;
    this.btnSettingsModal = document.getElementById('btn-settings-modal')!;

    // Wave Actions
    this.waveActionContainer = document.getElementById('wave-action-container')!;
    this.btnStartWave = document.getElementById('btn-start-wave')!;
    this.waveBtnLabel = document.getElementById('wave-btn-label')!;
    this.waveAutoCountdown = document.getElementById('wave-auto-countdown')!;

    // Free-Placement Build Tray & Buttons
    this.hudBuildTriggerContainer = document.getElementById('hud-build-trigger-container')!;
    this.btnMainBuild = document.getElementById('btn-main-build')!;
    this.btnBuildLabel = document.getElementById('btn-build-label')!;
    this.buildTrayMenu = document.getElementById('build-tray-menu')!;
    this.btnCloseTray = document.getElementById('btn-close-tray')!;
    this.buildTrayGrid = document.getElementById('build-tray-grid')!;

    // Inspector
    this.contextNodeMenu = document.getElementById('context-node-menu')!;
    this.cnmName = document.getElementById('cnm-name')!;
    this.cnmTier = document.getElementById('cnm-tier')!;
    this.cnmCloseBtn = document.getElementById('cnm-close-btn')!;
    this.cnmDmg = document.getElementById('cnm-dmg')!;
    this.cnmRange = document.getElementById('cnm-range')!;
    this.cnmRate = document.getElementById('cnm-rate')!;
    this.cnmBtnUpgrade = document.getElementById('cnm-btn-upgrade') as HTMLButtonElement;
    this.cnmUpgradeTitle = document.getElementById('cnm-upgrade-title')!;
    this.cnmUpgradeCost = document.getElementById('cnm-upgrade-cost')!;
    this.cnmBtnSell = document.getElementById('cnm-btn-sell') as HTMLButtonElement;
    this.cnmSellCost = document.getElementById('cnm-sell-cost')!;
    this.cnmTargetToggle = document.getElementById('cnm-target-toggle') as HTMLButtonElement;

    // Center Notification
    this.centerBanner = document.getElementById('center-banner')!;
    this.bannerTitle = document.getElementById('banner-title')!;
    this.bannerSub = document.getElementById('banner-sub')!;

    // Debriefs
    this.victoryModal = document.getElementById('victory-modal')!;
    this.vicMissionTitle = document.getElementById('vic-mission-title')!;
    this.vicRating = document.getElementById('vic-rating')!;
    this.vicXpGained = document.getElementById('vic-xp-gained')!;
    this.vicCreditsGained = document.getElementById('vic-credits-gained')!;
    this.vicUnlockBanner = document.getElementById('vic-unlock-banner')!;
    this.vicUnlockedTechName = document.getElementById('vic-unlocked-tech-name')!;
    this.vicWaves = document.getElementById('vic-waves')!;
    this.vicKills = document.getElementById('vic-kills')!;
    this.vicScore = document.getElementById('vic-score')!;
    this.btnNextMission = document.getElementById('btn-next-mission')!;
    this.btnRetryMission = document.getElementById('btn-retry-mission')!;
    this.btnReturnMenuVic = document.getElementById('btn-return-menu-vic')!;

    this.gameOverModal = document.getElementById('game-over-modal')!;
    this.goRating = document.getElementById('go-rating')!;
    this.goWave = document.getElementById('go-wave')!;
    this.goKills = document.getElementById('go-kills')!;
    this.goScore = document.getElementById('go-score')!;
    this.btnRestartGame = document.getElementById('btn-restart-game')!;
    this.btnReturnMenuGo = document.getElementById('btn-return-menu-go')!;

    // Settings & Dev Metrics
    this.perfLabModal = document.getElementById('perf-lab-modal')!;
    this.btnClosePerf = document.getElementById('btn-close-perf')!;
    this.btnAudioToggle = document.getElementById('btn-audio-toggle')!;
    this.btnFullscreenToggle = document.getElementById('btn-fullscreen-toggle')!;
    this.btnDevModeToggle = document.getElementById('btn-dev-mode-toggle')!;
    this.devMetricsGrid = document.getElementById('dev-metrics-grid')!;

    this.mFps = document.getElementById('m-fps')!;
    this.mFrameTime = document.getElementById('m-frametime')!;
    this.mP95 = document.getElementById('m-p95')!;
    this.mEnemies = document.getElementById('m-enemies')!;
    this.mTowers = document.getElementById('m-towers')!;
    this.mProjectiles = document.getElementById('m-projectiles')!;

    this.inputBenchSeed = document.getElementById('input-bench-seed') as HTMLInputElement;
    this.btnRunFormalBenchmark = document.getElementById('btn-run-formal-benchmark')!;
    this.benchStatus = document.getElementById('bench-status')!;
    this.benchResultsArea = document.getElementById('bench-results-area')!;
    this.benchOutput = document.getElementById('bench-output')!;
    this.btnCopyBench = document.getElementById('btn-copy-bench')!;
  }

  // ==========================================
  // NAVIGATION & SCREEN FLOW
  // ==========================================
  public initMainMenu(): void {
    this.mainMenuScreen.classList.remove('hidden');
    this.challengeSelectScreen.classList.add('hidden');
    this.gameHudHeader.classList.add('hidden');
    this.waveActionContainer.classList.add('hidden');
    this.hudAbilitiesContainer.classList.add('hidden');
    this.hudBuildTriggerContainer.classList.add('hidden');
    this.commandDrawer.classList.add('hidden');
    this.btnCommandToggle.classList.remove('active');
    this.buildTrayMenu.classList.add('hidden');
    this.engine.isPaused = true;
  }

  public openChallengeSelect(): void {
    this.mainMenuScreen.classList.add('hidden');
    this.challengeSelectScreen.classList.remove('hidden');
    const profile = ProgressionManager.getProfile();
    const savedIdx = CHALLENGES.findIndex(c => c.id === profile.selectedChallengeId);
    this.currentChallengeIndex = savedIdx >= 0 ? savedIdx : 0;
    this.renderLevelNavBar();
    this.renderChallengeCard(this.currentChallengeIndex);
    GlobalSoundFX.playUIClick();
  }

  public renderLevelNavBar(): void {
    this.levelNavBar.innerHTML = '';
    const profile = ProgressionManager.getProfile();

    CHALLENGES.forEach((c, idx) => {
      const btn = document.createElement('button');
      const isUnlocked = ProgressionManager.isChallengeUnlocked(c.id);
      const isCurrent = idx === this.currentChallengeIndex;
      const record = profile.completedChallenges[c.id];

      btn.className = `btn-level-pill ${isCurrent ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
      btn.innerHTML = `
        <span>Level ${c.levelNumber}</span>
        ${record ? `<span class="pill-star">★</span>` : !isUnlocked ? '🔒' : ''}
      `;

      btn.addEventListener('click', () => {
        this.currentChallengeIndex = idx;
        this.renderLevelNavBar();
        this.renderChallengeCard(idx);
        GlobalSoundFX.playUIClick();
      });

      this.levelNavBar.appendChild(btn);
    });
  }

  public renderChallengeCard(idx: number): void {
    const c = CHALLENGES[idx];
    const isUnlocked = ProgressionManager.isChallengeUnlocked(c.id);

    this.ccTagline.textContent = c.tagline;
    this.ccTitle.textContent = c.title;
    this.ccStars.textContent = '★'.repeat(c.stars) + '☆'.repeat(5 - c.stars);
    this.ccDesc.textContent = c.description;

    this.ccModifiers.innerHTML = '';
    c.modifierBadges.forEach(b => {
      const badge = document.createElement('div');
      badge.className = 'mod-badge';
      badge.innerHTML = `<span>${b.label}:</span> <strong>${b.value}</strong>`;
      this.ccModifiers.appendChild(badge);
    });

    this.ccRewardCredits.textContent = `+$${c.rewardCredits.toLocaleString()}`;
    this.ccRewardXp.textContent = `+${c.rewardXp.toLocaleString()} XP`;

    if (c.unlockedTowerName) {
      this.ccUnlockItem.classList.remove('hidden');
      this.ccRewardUnlock.textContent = c.unlockedTowerName;
    } else {
      this.ccUnlockItem.classList.add('hidden');
    }

    if (isUnlocked) {
      this.btnDeployChallenge.disabled = false;
      this.btnDeployChallenge.textContent = `Start Mission (${c.totalWaves} Waves)`;
    } else {
      this.btnDeployChallenge.disabled = true;
      const reqChallenge = CHALLENGES.find(ch => ch.id === c.unlockReqId);
      this.btnDeployChallenge.textContent = `Locked (Clear ${reqChallenge?.title || 'Previous'})`;
    }

    this.btnPrevChallenge.disabled = idx === 0;
    this.btnNextChallenge.disabled = idx === CHALLENGES.length - 1;

    // Update active state in Level Nav Bar
    const pillButtons = this.levelNavBar.querySelectorAll('.btn-level-pill');
    pillButtons.forEach((b, pIdx) => {
      b.classList.toggle('active', pIdx === idx);
    });
  }

  public launchChallenge(challenge: ChallengeDef): void {
    ProgressionManager.selectChallenge(challenge.id);
    this.engine.startChallenge(challenge);

    this.mainMenuScreen.classList.add('hidden');
    this.challengeSelectScreen.classList.add('hidden');
    this.gameHudHeader.classList.remove('hidden');
    this.hudMissionName.textContent = challenge.title;

    this.hudAbilitiesContainer.classList.remove('hidden');
    this.hudBuildTriggerContainer.classList.remove('hidden');
    this.waveActionContainer.classList.remove('hidden');

    this.scene.cancelPlacement();
    this.buildTrayMenu.classList.add('hidden');
    this.btnMainBuild.classList.remove('active');
    if (this.btnBuildLabel) this.btnBuildLabel.textContent = 'Build Tower';

    this.closeAllMenus();
    this.updateHUD();

    this.showBanner(challenge.title, challenge.storyQuote);
    GlobalSoundFX.playUIClick();
  }

  public openArmory(): void {
    const profile = ProgressionManager.getProfile();
    this.armoryTowerList.innerHTML = '';

    const towerTypes: TowerType[] = ['pulse', 'tesla', 'mortar', 'cryo', 'railgun', 'laser', 'flak', 'vortex'];

    towerTypes.forEach(t => {
      const def = TOWER_DEFINITIONS[t];
      const unlocked = profile.unlockedTowers.includes(t);
      const btn = document.createElement('button');
      btn.className = `armory-item-btn ${t === this.selectedArmoryTower ? 'active' : ''}`;
      btn.innerHTML = `<span>${def.name}</span> <small>${unlocked ? `$${def.baseCost}` : '🔒'}</small>`;
      btn.addEventListener('click', () => {
        this.selectedArmoryTower = t;
        this.openArmory();
        GlobalSoundFX.playUIClick();
      });
      this.armoryTowerList.appendChild(btn);
    });

    const currentDef = TOWER_DEFINITIONS[this.selectedArmoryTower];
    const isUnlocked = profile.unlockedTowers.includes(this.selectedArmoryTower);

    this.armoryTowerDetail.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <h3 style="font-size:15px; margin:0;">${currentDef.name}</h3>
        <span style="font-size:11px; padding:2px 6px; border-radius:3px; background:${isUnlocked ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color:${isUnlocked ? 'var(--accent-green)' : 'var(--accent-red)'};">${isUnlocked ? 'Available' : 'Locked'}</span>
      </div>
      <div style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">${currentDef.role}</div>
      <p style="font-size:12px; line-height:1.4; color:var(--text-muted); margin-bottom:14px;">${currentDef.description}</p>
      <div style="font-size:12px; display:flex; gap:16px;">
        <div>Damage: <strong>${currentDef.levels[0].damage}</strong></div>
        <div>Range: <strong>${currentDef.levels[0].range}</strong></div>
        <div>Cost: <strong style="color:var(--accent-gold);">$${currentDef.baseCost}</strong></div>
      </div>
    `;

    this.armoryModal.classList.remove('hidden');
    GlobalSoundFX.playUIClick();
  }

  public openProfile(): void {
    const profile = ProgressionManager.getProfile();
    this.profCoreLevel.textContent = `${profile.coreLevel}`;
    this.profXpText.textContent = `${profile.coreXp} / ${profile.nextLevelXp} XP`;
    const pct = Math.min(100, Math.max(0, (profile.coreXp / profile.nextLevelXp) * 100));
    this.profXpFill.style.width = `${pct}%`;

    const completedCount = Object.keys(profile.completedChallenges).length;
    this.profClearedCount.textContent = `${completedCount} / 7`;
    this.profTotalScore.textContent = profile.totalScore.toLocaleString();
    this.profTotalKills.textContent = profile.totalKills.toLocaleString();
    this.profTotalCredits.textContent = `$${profile.totalCreditsEarned.toLocaleString()}`;

    this.profMilestonesList.innerHTML = '';
    Object.entries(CORE_LEVEL_UNLOCKS).forEach(([lvlStr, u]) => {
      const lvl = parseInt(lvlStr, 10);
      const isReached = profile.coreLevel >= lvl;
      const row = document.createElement('div');
      row.className = 'milestone-item';
      row.style.opacity = isReached ? '1' : '0.4';
      row.innerHTML = `<span>Lv ${lvl}: <strong>${u.title}</strong></span> <small>${isReached ? '✓ Unlocked' : 'Locked'}</small>`;
      this.profMilestonesList.appendChild(row);
    });

    this.profileModal.classList.remove('hidden');
    GlobalSoundFX.playUIClick();
  }

  // ==========================================
  // TUTORIAL & HOW TO PLAY
  // ==========================================
  public checkFirstTimeTutorial(): void {
    try {
      if (!localStorage.getItem('neon_frontier_tutorial_seen')) {
        this.openTutorial();
      }
    } catch {}
  }

  public openTutorial(): void {
    this.closeAllMenus();
    this.tutorialModal?.classList.remove('hidden');
    GlobalSoundFX.playUIClick();
  }

  public skipTutorial(): void {
    try {
      localStorage.setItem('neon_frontier_tutorial_seen', 'true');
    } catch {}
    this.tutorialModal?.classList.add('hidden');
    GlobalSoundFX.playUIClick();
  }

  public finishTutorial(): void {
    try {
      localStorage.setItem('neon_frontier_tutorial_seen', 'true');
    } catch {}
    this.tutorialModal?.classList.add('hidden');
    GlobalSoundFX.playUIClick();
  }

  // ==========================================
  // FREE-PLACEMENT BUILD TRAY
  // ==========================================
  public renderBuildTray(): void {
    this.buildTrayGrid.innerHTML = '';
    const towerTypes: TowerType[] = ['pulse', 'tesla', 'mortar', 'cryo', 'railgun', 'laser', 'flak', 'vortex'];
    const profile = ProgressionManager.getProfile();

    towerTypes.forEach((type, idx) => {
      const def = TOWER_DEFINITIONS[type];
      const isUnlocked = profile.unlockedTowers.includes(type);
      const canAfford = this.engine.economySystem.credits >= def.baseCost;

      const card = document.createElement('button');
      card.className = `btn-tray-card ${!isUnlocked ? 'locked' : ''} ${!canAfford && isUnlocked ? 'disabled' : ''}`;
      card.dataset.towerType = type;

      card.innerHTML = `
        <div class="tray-card-left">
          <span class="tray-hotkey">[${idx + 1}]</span>
          <span class="tray-name">${def.name}</span>
        </div>
        <strong class="tray-cost">${isUnlocked ? `$${def.baseCost}` : '🔒'}</strong>
      `;

      card.addEventListener('click', () => {
        if (!isUnlocked || !canAfford) return;
        this.selectTowerForPlacement(type);
      });

      this.buildTrayGrid.appendChild(card);
    });
  }

  public selectTowerForPlacement(type: TowerType): void {
    const def = TOWER_DEFINITIONS[type];
    const profile = ProgressionManager.getProfile();
    if (!profile.unlockedTowers.includes(type)) {
      this.showBanner('Locked', `${def.name} is locked.`);
      return;
    }
    if (this.engine.economySystem.credits < def.baseCost) {
      this.showBanner('Not Enough Money', `${def.name} costs $${def.baseCost}.`);
      return;
    }

    this.closeContextNodeMenu();
    this.scene.selectedBuildType = type;
    this.buildTrayMenu.classList.add('hidden');
    this.btnMainBuild.classList.add('active');
    if (this.btnBuildLabel) this.btnBuildLabel.textContent = `Place ${def.name}`;
    this.showBanner(`Placing ${def.name}`, 'Click anywhere on grid (Right-click or ESC to cancel)');
    GlobalSoundFX.playUIClick();
  }

  public onPlacementStateChange(): void {
    if (this.scene.selectedBuildType === null) {
      this.btnMainBuild.classList.remove('active');
      if (this.btnBuildLabel) this.btnBuildLabel.textContent = 'Build Tower';
    }
  }

  // ==========================================
  // EVENT BINDINGS
  // ==========================================
  private bindEvents(): void {
    // 1. Menu Nav
    this.btnMenuChallenge?.addEventListener('click', () => this.openChallengeSelect());
    this.btnMenuTutorial?.addEventListener('click', () => this.openTutorial());
    this.btnMenuArmory?.addEventListener('click', () => this.openArmory());
    this.btnMenuProfile?.addEventListener('click', () => this.openProfile());
    this.btnMenuSettings?.addEventListener('click', () => this.togglePerfLab());

    // Tutorial Modal Actions
    this.btnHudTutorial?.addEventListener('click', () => this.openTutorial());
    this.btnCloseTutorial?.addEventListener('click', () => this.skipTutorial());
    this.btnSkipTutorial?.addEventListener('click', () => this.skipTutorial());
    this.btnFinishTutorial?.addEventListener('click', () => this.finishTutorial());

    // 2. Carousel & Level Nav
    this.btnChallengeBack?.addEventListener('click', () => this.initMainMenu());
    this.btnPrevChallenge?.addEventListener('click', () => {
      if (this.currentChallengeIndex > 0) {
        this.currentChallengeIndex--;
        this.renderChallengeCard(this.currentChallengeIndex);
        GlobalSoundFX.playUIClick();
      }
    });

    this.btnNextChallenge?.addEventListener('click', () => {
      if (this.currentChallengeIndex < CHALLENGES.length - 1) {
        this.currentChallengeIndex++;
        this.renderChallengeCard(this.currentChallengeIndex);
        GlobalSoundFX.playUIClick();
      }
    });

    this.btnDeployChallenge?.addEventListener('click', () => {
      const c = CHALLENGES[this.currentChallengeIndex];
      if (ProgressionManager.isChallengeUnlocked(c.id)) {
        this.launchChallenge(c);
      }
    });

    // 3. Modals Close
    this.btnCloseArmory?.addEventListener('click', () => {
      this.armoryModal.classList.add('hidden');
      GlobalSoundFX.playUIClick();
    });

    this.btnCloseProfile?.addEventListener('click', () => {
      this.profileModal.classList.add('hidden');
      GlobalSoundFX.playUIClick();
    });

    this.btnHudMenu?.addEventListener('click', () => {
      this.closeAllMenus();
      this.initMainMenu();
      GlobalSoundFX.playUIClick();
    });

    this.btnHudLevels?.addEventListener('click', () => {
      this.closeAllMenus();
      this.openChallengeSelect();
    });

    // Speed Controls: Single Cycler & Pause Toggle
    this.btnSpeedCycle?.addEventListener('click', () => {
      const cur = this.engine.speed;
      let next: GameSpeed = 1;
      if (cur === 1) next = 2;
      else if (cur === 2) next = 4;
      else next = 1;

      this.engine.setSpeed(next);
      this.btnPause.classList.remove('active');
      this.btnPause.textContent = '⏸';
      this.btnSpeedCycle.textContent = `${next}×`;
      GlobalSoundFX.playUIClick();
    });

    this.btnPause?.addEventListener('click', () => {
      const isPaused = this.engine.togglePause();
      this.btnPause.classList.toggle('active', isPaused);
      this.btnPause.textContent = isPaused ? '▶' : '⏸';
      GlobalSoundFX.playUIClick();
    });

    // Tactical Command Drawer Toggle
    this.btnCommandToggle?.addEventListener('click', () => {
      this.commandDrawer.classList.toggle('hidden');
      this.btnCommandToggle.classList.toggle('active', !this.commandDrawer.classList.contains('hidden'));
      GlobalSoundFX.playUIClick();
    });

    this.btnCloseCmd?.addEventListener('click', () => {
      this.commandDrawer.classList.add('hidden');
      this.btnCommandToggle.classList.remove('active');
      GlobalSoundFX.playUIClick();
    });

    // Abilities Buttons
    this.btnTacticalEmp?.addEventListener('click', () => this.triggerTacticalEMP());
    this.btnTacticalBombard?.addEventListener('click', () => this.triggerTacticalBombardment());
    this.btnTacticalOvercharge?.addEventListener('click', () => this.triggerTacticalOvercharge());

    // Settings Modal
    this.btnSettingsModal?.addEventListener('click', () => this.togglePerfLab());
    this.btnClosePerf?.addEventListener('click', () => this.perfLabModal.classList.add('hidden'));

    this.btnAudioToggle?.addEventListener('click', () => {
      const muted = GlobalSoundFX.toggleMute();
      this.btnAudioToggle.textContent = muted ? 'Sound: Off' : 'Sound: On';
      GlobalSoundFX.playUIClick();
    });

    this.btnFullscreenToggle?.addEventListener('click', () => {
      this.scene.toggleFullscreen();
      GlobalSoundFX.playUIClick();
    });

    this.btnDevModeToggle?.addEventListener('click', () => {
      this.devMetricsGrid.classList.toggle('hidden');
      GlobalSoundFX.playUIClick();
    });

    // Wave Launch Action
    this.btnStartWave?.addEventListener('click', () => {
      this.engine.waveSystem.startNextWave();
      GlobalSoundFX.playUIClick();
    });

    // Primary Floating Build Button (Toggles Free Build Tray)
    this.btnMainBuild?.addEventListener('click', () => {
      if (this.scene.selectedBuildType !== null) {
        this.scene.cancelPlacement();
        return;
      }
      this.renderBuildTray();
      this.buildTrayMenu.classList.toggle('hidden');
      this.btnMainBuild.classList.toggle('active', !this.buildTrayMenu.classList.contains('hidden'));
      GlobalSoundFX.playUIClick();
    });

    this.btnCloseTray?.addEventListener('click', () => {
      this.buildTrayMenu.classList.add('hidden');
      this.btnMainBuild.classList.remove('active');
      GlobalSoundFX.playUIClick();
    });

    // Map Tower Selection Callbacks
    this.scene.onTowerSelected = (towerId: number | null, screenPos?: { x: number; y: number }) => {
      if (towerId !== null && screenPos) {
        this.openContextNodeMenu(towerId, screenPos);
      } else {
        this.closeContextNodeMenu();
      }
    };

    this.scene.onTowerPlaced = () => {
      GlobalSoundFX.playBuild();
      this.onPlacementStateChange();
    };

    // Close Context Inspector
    this.cnmCloseBtn?.addEventListener('click', () => {
      this.closeContextNodeMenu();
      this.scene.selectedTowerId = null;
    });

    // Inspector Action Buttons
    this.cnmBtnUpgrade?.addEventListener('click', () => {
      if (this.scene.selectedTowerId !== null) {
        const t = this.engine.entityMgr.towers.find(tow => tow.id === this.scene.selectedTowerId);
        if (t) {
          const def = TOWER_DEFINITIONS[t.type];
          if (t.level >= def.levels.length) {
            this.showBanner('Max Level', `${def.name} is already max level.`);
            return;
          }
          if (this.engine.economySystem.spendCredits(t.currentStats.upgradeCost)) {
            this.engine.entityMgr.upgradeTower(t);
            GlobalSoundFX.playUpgrade();
            this.showBanner('Upgraded', `${def.name} upgraded to Level ${t.level}!`);
            const screenPos = this.scene.getScreenCoords(t.x, t.y);
            this.openContextNodeMenu(t.id, screenPos);
            this.updateHUD();
          } else {
            GlobalSoundFX.playError();
            this.showBanner('Not Enough Money', `Need $${t.currentStats.upgradeCost} to upgrade.`);
          }
        }
      }
    });

    this.cnmBtnSell?.addEventListener('click', () => {
      if (this.scene.selectedTowerId !== null) {
        const t = this.engine.entityMgr.towers.find(tow => tow.id === this.scene.selectedTowerId);
        if (t) {
          this.engine.economySystem.addCredits(t.currentStats.sellValue);
          this.engine.entityMgr.removeTower(t);
          GlobalSoundFX.playSell();
          this.showBanner('Tower Sold', `+$${t.currentStats.sellValue} refunded.`);
          this.closeContextNodeMenu();
          this.scene.selectedTowerId = null;
          this.updateHUD();
        }
      }
    });

    this.cnmTargetToggle?.addEventListener('click', () => {
      if (this.scene.selectedTowerId !== null) {
        const t = this.engine.entityMgr.towers.find(tow => tow.id === this.scene.selectedTowerId);
        if (t) {
          const curIdx = this.targetingCycle.indexOf(t.targetingStrategy);
          const nextIdx = (curIdx + 1) % this.targetingCycle.length;
          t.targetingStrategy = this.targetingCycle[nextIdx];
          this.cnmTargetToggle.textContent = `Target: ${t.targetingStrategy.charAt(0).toUpperCase() + t.targetingStrategy.slice(1)} ▾`;
          GlobalSoundFX.playUIClick();
        }
      }
    });

    // Debrief Buttons
    this.btnNextMission?.addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
      if (this.currentChallengeIndex < CHALLENGES.length - 1) {
        this.currentChallengeIndex++;
      }
      this.openChallengeSelect();
    });

    this.btnRetryMission?.addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
      this.engine.restartGame();
    });

    this.btnReturnMenuVic?.addEventListener('click', () => {
      this.victoryModal.classList.add('hidden');
      this.openChallengeSelect();
    });

    this.btnRestartGame?.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      this.engine.restartGame();
    });

    this.btnReturnMenuGo?.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      this.openChallengeSelect();
    });

    // Engine Core Events
    this.engine.economySystem.onCoreDamage = () => {
      this.flashBreachVignette();
      this.scene.triggerCoreBreachVFX();
      GlobalSoundFX.playCoreDamaged();
    };

    this.engine.economySystem.onGameOver = () => {
      GlobalSoundFX.playGameOver();
      this.showGameOver();
    };

    this.engine.waveSystem.onWaveStart = waveNum => {
      GlobalSoundFX.playWaveAlarm();
      this.showBanner(`Wave ${waveNum}`, 'Hostile incursion detected');
    };

    this.engine.waveSystem.onWaveComplete = (waveNum, reward) => {
      GlobalSoundFX.playWaveAlarm();
      this.showBanner(`Wave ${waveNum} Cleared`, `Reward: +$${reward}`);
    };

    this.engine.waveSystem.onVictory = () => {
      GlobalSoundFX.playVictory();
      this.showVictory();
    };

    // Stress Test Preset Buttons
    document.getElementById('btn-bench-normal')?.addEventListener('click', () => this.engine.runStressTest('NORMAL'));
    document.getElementById('btn-bench-heavy')?.addEventListener('click', () => this.engine.runStressTest('HEAVY'));
    document
      .getElementById('btn-bench-assignment')
      ?.addEventListener('click', () => this.engine.runStressTest('ASSIGNMENT'));
    document.getElementById('btn-bench-extreme')?.addEventListener('click', () => this.engine.runStressTest('EXTREME'));

    this.btnRunFormalBenchmark?.addEventListener('click', () => this.runFormalBenchmark());
    this.btnCopyBench?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.benchOutput.textContent || '').catch(() => {});
      this.btnCopyBench.textContent = 'Copied!';
      setTimeout(() => {
        this.btnCopyBench.textContent = 'Copy to Clipboard';
      }, 1500);
    });
  }

  private runFormalBenchmark(): void {
    const seed = parseInt(this.inputBenchSeed.value, 10) || 74921;
    this.benchStatus.textContent = 'Executing 600-Frame Benchmark...';
    this.btnRunFormalBenchmark.setAttribute('disabled', 'true');

    setTimeout(() => {
      const summary = this.engine.runFormalBenchmark(seed);
      this.benchStatus.textContent = 'Benchmark Finished (600 Frames Complete)';
      this.btnRunFormalBenchmark.removeAttribute('disabled');
      this.benchResultsArea.classList.remove('hidden');

      this.benchOutput.textContent = [
        `========================================`,
        `  NEON FRONTIER 600-FRAME DETERMINISTIC BENCHMARK`,
        `========================================`,
        `Seed:                  ${summary.seed}`,
        `Total Frames:          ${summary.totalFrames}`,
        `Enemies Simulated:     ${summary.enemiesCount}`,
        `Towers Simulated:      ${summary.towersCount}`,
        `Projectiles:           ${summary.projectilesCount}`,
        `Average FPS:           ${summary.averageFps.toFixed(1)}`,
        `Average Frame Time:    ${summary.averageFrameTimeMs.toFixed(2)} ms`,
        `95th Percentile Time:  ${summary.p95FrameTimeMs.toFixed(2)} ms`,
        `Memory Baseline:       ${summary.memoryUsageMb.toFixed(1)} MB`,
        `GC Events / Stalls:    ${summary.gcPressureEvents}`,
        `Deterministic Hash:    ${summary.stateChecksum}`,
        `========================================`
      ].join('\n');

      this.benchResultsArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  // ==========================================
  // CONTEXTUAL TOWER INSPECTOR
  // ==========================================
  public openContextNodeMenu(towerId: number, screenPos?: { x: number; y: number }): void {
    const t = this.engine.entityMgr.towers.find(tow => tow.id === towerId);
    if (!t) {
      this.closeContextNodeMenu();
      return;
    }

    const def = TOWER_DEFINITIONS[t.type];
    const stats = t.currentStats;
    const isMax = t.level >= def.levels.length;

    this.cnmName.textContent = def.name;
    this.cnmTier.textContent = `Level ${t.level} / 3`;

    if (!isMax) {
      const nextStats = def.levels[t.level];
      this.cnmDmg.textContent = `${stats.damage} → ${nextStats.damage}`;
    } else {
      this.cnmDmg.textContent = `${stats.damage}`;
    }
    this.cnmRange.textContent = `${stats.range}`;
    this.cnmRate.textContent = `${(1 / stats.attackInterval).toFixed(1)}/s`;

    if (isMax) {
      this.cnmBtnUpgrade.disabled = true;
      this.cnmUpgradeTitle.textContent = 'Max Level';
      this.cnmUpgradeCost.textContent = '';
    } else {
      this.cnmBtnUpgrade.disabled = this.engine.economySystem.credits < stats.upgradeCost;
      this.cnmUpgradeTitle.textContent = `Upgrade to Lv ${t.level + 1} [U]`;
      this.cnmUpgradeCost.textContent = `$${stats.upgradeCost}`;
    }

    this.cnmSellCost.textContent = `+$${stats.sellValue}`;
    this.cnmTargetToggle.textContent = `Target: ${t.targetingStrategy.charAt(0).toUpperCase() + t.targetingStrategy.slice(1)} ▾`;

    if (screenPos) {
      const menuWidth = 250;
      const menuHeight = 220;
      let targetX = screenPos.x;
      // Position above tower by default, or flip below if near the top
      let targetY = screenPos.y - 125;
      if (screenPos.y < 185) {
        targetY = screenPos.y + 125;
      }

      targetX = Math.max(menuWidth / 2 + 15, Math.min(window.innerWidth - menuWidth / 2 - 15, targetX));
      targetY = Math.max(menuHeight / 2 + 45, Math.min(window.innerHeight - menuHeight / 2 - 15, targetY));

      this.contextNodeMenu.style.left = `${targetX}px`;
      this.contextNodeMenu.style.top = `${targetY}px`;
    }

    this.contextNodeMenu.classList.remove('hidden');
    GlobalSoundFX.playUIClick();
  }

  public closeContextNodeMenu(): void {
    this.contextNodeMenu.classList.add('hidden');
  }

  public closeAllMenus(): void {
    this.closeContextNodeMenu();
    this.tutorialModal?.classList.add('hidden');
    this.armoryModal?.classList.add('hidden');
    this.profileModal?.classList.add('hidden');
    this.perfLabModal?.classList.add('hidden');
    this.commandDrawer?.classList.add('hidden');
    this.btnCommandToggle?.classList.remove('active');
    this.buildTrayMenu?.classList.add('hidden');
    this.btnMainBuild?.classList.remove('active');
    if (this.btnBuildLabel) this.btnBuildLabel.textContent = 'Build Tower';
  }

  // ==========================================
  // KEYBOARD SHORTCUTS
  // ==========================================
  private bindKeyboardShortcuts(): void {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Hotkeys 1-8 for quick free placement
      if (['1', '2', '3', '4', '5', '6', '7', '8'].includes(e.key)) {
        const types: TowerType[] = ['pulse', 'tesla', 'mortar', 'cryo', 'railgun', 'laser', 'flak', 'vortex'];
        const idx = parseInt(e.key, 10) - 1;
        const type = types[idx];
        if (type) {
          this.selectTowerForPlacement(type);
        }
      }

      // Space / P for pause
      if (e.code === 'Space' || e.key.toLowerCase() === 'p') {
        const isPaused = this.engine.togglePause();
        this.btnPause.classList.toggle('active', isPaused);
        this.btnPause.textContent = isPaused ? '▶' : '⏸';
        GlobalSoundFX.playUIClick();
      }

      // F for Fullscreen
      if (e.key.toLowerCase() === 'f' && e.key !== 'F3') {
        this.scene.toggleFullscreen();
        GlobalSoundFX.playUIClick();
      }

      // B for Build Tray
      if (e.key.toLowerCase() === 'b') {
        if (this.scene.selectedBuildType !== null) {
          this.scene.cancelPlacement();
        } else {
          this.renderBuildTray();
          this.buildTrayMenu.classList.toggle('hidden');
          this.btnMainBuild.classList.toggle('active', !this.buildTrayMenu.classList.contains('hidden'));
        }
        GlobalSoundFX.playUIClick();
      }

      // Q for EMP Blast
      if (e.key.toLowerCase() === 'q') this.triggerTacticalEMP();
      // E for Air Strike
      if (e.key.toLowerCase() === 'e') this.triggerTacticalBombardment();
      // R for Supercharge
      if (e.key.toLowerCase() === 'r') this.triggerTacticalOvercharge();

      // U for Upgrade
      if (e.key.toLowerCase() === 'u') {
        if (this.scene.selectedTowerId !== null) {
          const t = this.engine.entityMgr.towers.find(tow => tow.id === this.scene.selectedTowerId);
          if (t) {
            const def = TOWER_DEFINITIONS[t.type];
            if (t.level >= def.levels.length) {
              this.showBanner('Max Level', `${def.name} is already max level.`);
              return;
            }
            if (this.engine.economySystem.spendCredits(t.currentStats.upgradeCost)) {
              this.engine.entityMgr.upgradeTower(t);
              GlobalSoundFX.playUpgrade();
              this.showBanner('Upgraded', `${def.name} upgraded to Level ${t.level}!`);
              const screenPos = this.scene.getScreenCoords(t.x, t.y);
              this.openContextNodeMenu(t.id, screenPos);
              this.updateHUD();
            } else {
              GlobalSoundFX.playError();
              this.showBanner('Not Enough Money', `Need $${t.currentStats.upgradeCost} to upgrade.`);
            }
          }
        }
      }

      // X for Sell
      if (e.key.toLowerCase() === 'x') {
        if (this.scene.selectedTowerId !== null) {
          const t = this.engine.entityMgr.towers.find(tow => tow.id === this.scene.selectedTowerId);
          if (t) {
            this.engine.economySystem.addCredits(t.currentStats.sellValue);
            this.engine.entityMgr.removeTower(t);
            GlobalSoundFX.playSell();
            this.showBanner('Tower Sold', `+$${t.currentStats.sellValue} refunded.`);
            this.closeContextNodeMenu();
            this.scene.selectedTowerId = null;
            this.updateHUD();
          }
        }
      }

      // T for Target Cycling
      if (e.key.toLowerCase() === 't') {
        if (this.scene.selectedTowerId !== null) {
          const t = this.engine.entityMgr.towers.find(tow => tow.id === this.scene.selectedTowerId);
          if (t) {
            const curIdx = this.targetingCycle.indexOf(t.targetingStrategy);
            const nextIdx = (curIdx + 1) % this.targetingCycle.length;
            t.targetingStrategy = this.targetingCycle[nextIdx];
            this.cnmTargetToggle.textContent = `Target: ${t.targetingStrategy.charAt(0).toUpperCase() + t.targetingStrategy.slice(1)} ▾`;
            GlobalSoundFX.playUIClick();
          }
        }
      }

      if (e.key === 'Escape') this.closeAllMenus();
      if (e.key === 'F3') {
        e.preventDefault();
        this.togglePerfLab();
      }
    });
  }

  // ==========================================
  // SPECIAL ABILITIES
  // ==========================================
  public triggerTacticalEMP(): void {
    if (this.engine.economySystem.spendCredits(200)) {
      const hits = this.engine.entityMgr.triggerOrbitalEMP();
      GlobalSoundFX.playBossKlaxon();
      this.showBanner('EMP Blast', `${hits} enemies stunned!`);
      this.updateHUD();
    } else {
      this.showBanner('Not Enough Money', 'EMP Blast costs $200.');
    }
  }

  public triggerTacticalBombardment(): void {
    if (this.engine.economySystem.spendCredits(300)) {
      this.engine.entityMgr.triggerOrbitalBombardment(640, 360, 220, 1500);
      GlobalSoundFX.playMortarExplosion();
      this.showBanner('Air Strike', `1,500 damage dealt.`);
      this.updateHUD();
    } else {
      this.showBanner('Not Enough Money', 'Air Strike costs $300.');
    }
  }

  public triggerTacticalOvercharge(): void {
    if (this.engine.economySystem.spendCredits(250)) {
      this.engine.entityMgr.triggerOrbitalOvercharge(8);
      GlobalSoundFX.playUpgrade();
      this.showBanner('Supercharge Active', '+50% attack speed for 8s!');
      this.updateHUD();
    } else {
      this.showBanner('Not Enough Money', 'Supercharge costs $250.');
    }
  }

  public togglePerfLab(): void {
    const isHidden = this.perfLabModal.classList.contains('hidden');
    if (isHidden) {
      // Dismiss conflicting overlays so Settings & Dev tools has complete focus
      this.victoryModal.classList.add('hidden');
      this.gameOverModal.classList.add('hidden');
      this.closeContextNodeMenu();
      this.perfLabModal.classList.remove('hidden');
    } else {
      this.perfLabModal.classList.add('hidden');
    }
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

    this.coreHealthText.textContent = `${Math.ceil(eco.coreHealth)}`;
    this.creditsText.textContent = `${eco.credits}`;
    this.waveText.textContent = `${wave.currentWaveNumber} / ${wave.totalWaves}`;

    if (this.btnTacticalEmp) this.btnTacticalEmp.disabled = eco.credits < 200;
    if (this.btnTacticalBombard) this.btnTacticalBombard.disabled = eco.credits < 300;
    if (this.btnTacticalOvercharge) this.btnTacticalOvercharge.disabled = eco.credits < 250;

    if (wave.waveInProgress) {
      this.waveActionContainer.classList.add('hidden');
    } else {
      this.waveActionContainer.classList.remove('hidden');
      this.waveBtnLabel.textContent = `Start Wave ${wave.currentWaveNumber}`;
      if (wave.isAutoStartActive) {
        this.waveAutoCountdown.textContent = `Starting in ${Math.ceil(wave.autoStartCountdown)}s`;
      } else {
        this.waveAutoCountdown.textContent = 'Click to start';
      }
    }

    if (
      this.contextNodeMenu &&
      !this.contextNodeMenu.classList.contains('hidden') &&
      this.scene.selectedTowerId !== null
    ) {
      const t = this.engine.entityMgr.towers.find(tow => tow.id === this.scene.selectedTowerId);
      if (t) {
        const isMax = t.level >= TOWER_DEFINITIONS[t.type].levels.length;
        if (!isMax) {
          this.cnmBtnUpgrade.disabled = eco.credits < t.currentStats.upgradeCost;
        }
      }
    }

    if (this.buildTrayMenu && !this.buildTrayMenu.classList.contains('hidden')) {
      const cards = this.buildTrayGrid.querySelectorAll('.btn-tray-card');
      const profile = ProgressionManager.getProfile();
      cards.forEach(cardEl => {
        const tType = (cardEl as HTMLElement).dataset.towerType as TowerType;
        if (tType && TOWER_DEFINITIONS[tType]) {
          const def = TOWER_DEFINITIONS[tType];
          const isUnlocked = profile.unlockedTowers.includes(tType);
          const canAfford = eco.credits >= def.baseCost;
          cardEl.classList.toggle('locked', !isUnlocked);
          cardEl.classList.toggle('disabled', !canAfford && isUnlocked);
        }
      });
    }
  }

  public showBanner(title: string, sub: string): void {
    this.bannerTitle.textContent = title;
    this.bannerSub.textContent = sub;
    this.centerBanner.classList.remove('hidden');
    this.centerBanner.classList.add('visible');

    if (this.bannerTimer !== null) {
      window.clearTimeout(this.bannerTimer);
    }
    this.bannerTimer = window.setTimeout(() => {
      this.centerBanner.classList.remove('visible');
      this.centerBanner.classList.add('hidden');
      this.bannerTimer = null;
    }, 1600);
  }

  public showGameOver(): void {
    // If running benchmark or Settings / Dev Tools modal is active, suppress game over modal
    if (this.engine.isBenchmarking || !this.perfLabModal.classList.contains('hidden')) {
      return;
    }

    const curRound = this.engine.waveSystem.currentWaveNumber;
    const kills = this.engine.economySystem.totalKills;
    const score = this.engine.economySystem.score;

    this.goRating.textContent = '★☆☆☆☆';
    this.goWave.textContent = `${curRound} / ${this.engine.waveSystem.totalWaves}`;
    this.goKills.textContent = `${kills}`;
    this.goScore.textContent = score.toLocaleString();

    this.gameOverModal.classList.remove('hidden');
  }

  public showVictory(): void {
    // If running benchmark or Settings / Dev Tools modal is active, suppress victory modal
    if (this.engine.isBenchmarking || !this.perfLabModal.classList.contains('hidden')) {
      return;
    }

    const kills = this.engine.economySystem.totalKills;
    const score = this.engine.economySystem.score;
    const credits = this.engine.economySystem.credits;
    const challenge = this.engine.currentChallenge;

    const result = ProgressionManager.recordChallengeComplete(
      challenge.id,
      score,
      kills,
      credits,
      challenge.totalWaves
    );

    this.vicMissionTitle.textContent = `${challenge.title} Complete!`;
    this.vicRating.textContent = '★★★★★';
    this.vicXpGained.textContent = `+${result.xpGained.toLocaleString()} XP`;
    this.vicCreditsGained.textContent = `+$${result.creditsBonus.toLocaleString()}`;

    if (result.unlockedTowers.length > 0) {
      this.vicUnlockBanner.classList.remove('hidden');
      const techNames = result.unlockedTowers.map(t => TOWER_DEFINITIONS[t].name).join(', ');
      this.vicUnlockedTechName.textContent = techNames;
    } else {
      this.vicUnlockBanner.classList.add('hidden');
    }

    this.vicWaves.textContent = `${challenge.totalWaves} / ${challenge.totalWaves}`;
    this.vicKills.textContent = `${kills}`;
    this.vicScore.textContent = score.toLocaleString();

    this.victoryModal.classList.remove('hidden');
  }

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
        this.mEnemies.textContent = `${snap.activeEnemies}`;
        this.mTowers.textContent = `${snap.activeTowers}`;
        this.mProjectiles.textContent = `${snap.activeProjectiles}`;
      }
    }
  }
}
