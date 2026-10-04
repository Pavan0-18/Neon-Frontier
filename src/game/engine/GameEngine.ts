import { EntityManager } from '../entities/EntityManager';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { CombatSystem } from '../systems/CombatSystem';
import { MovementSystem, CombatStatsEvent } from '../systems/MovementSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { EconomySystem } from '../systems/EconomySystem';
import { PerformanceMonitor } from '../performance/PerformanceMonitor';
import { GlobalRNG } from './RNG';
import { GlobalPathSystem } from '../systems/PathSystem';
import { TowerType } from '../../data/towers';

export type GameSpeed = 0 | 1 | 2 | 4;

export class GameEngine {
  public readonly entityMgr: EntityManager;
  public readonly spatialGrid: SpatialGrid;
  public readonly combatSystem: CombatSystem;
  public readonly movementSystem: MovementSystem;
  public readonly waveSystem: WaveSystem;
  public readonly economySystem: EconomySystem;
  public readonly perfMonitor: PerformanceMonitor;

  // Fixed timestep accumulator
  public readonly fixedDt: number = 1 / 60; // 60 Hz deterministic simulation
  private accumulator: number = 0;
  private readonly maxSubSteps: number = 5;

  public speed: GameSpeed = 1;
  public isPaused: boolean = false;
  private previousSpeed: GameSpeed = 1;

  // Reusable event object to avoid allocations
  private combatStatsEvent: CombatStatsEvent = {
    damageDealt: 0,
    creditsEarned: 0,
    scoreEarned: 0,
    coreDamageTaken: 0,
    enemiesKilled: 0
  };

  constructor() {
    this.entityMgr = new EntityManager();
    this.spatialGrid = new SpatialGrid(1280, 720, 64);
    this.movementSystem = new MovementSystem(this.entityMgr);
    this.combatSystem = new CombatSystem(this.entityMgr, this.spatialGrid, this.movementSystem);
    this.waveSystem = new WaveSystem(this.entityMgr);
    this.economySystem = new EconomySystem();
    this.perfMonitor = new PerformanceMonitor();

    this.wireCallbacks();
  }

  private wireCallbacks(): void {
    this.waveSystem.onWaveComplete = (_wave, reward) => {
      this.economySystem.addCredits(reward);
      this.economySystem.addScore(reward * 10);
    };

    this.waveSystem.onVictory = () => {
      this.economySystem.isVictory = true;
    };

    this.economySystem.onGameOver = () => {
      this.isPaused = true;
    };
  }

  public setSpeed(newSpeed: GameSpeed): void {
    if (newSpeed === 0) {
      this.isPaused = true;
    } else {
      this.isPaused = false;
      this.speed = newSpeed;
      this.previousSpeed = newSpeed;
    }
  }

  public togglePause(): boolean {
    if (this.isPaused) {
      this.isPaused = false;
      this.speed = this.previousSpeed || 1;
    } else {
      this.previousSpeed = this.speed;
      this.isPaused = true;
      this.speed = 0;
    }
    return this.isPaused;
  }

  /**
   * Main game tick called by Phaser's update loop or requestAnimationFrame.
   * Uses fixed timestep accumulator.
   */
  public update(frameDeltaSeconds: number): void {
    this.perfMonitor.beginFrame();

    if (this.isPaused || this.economySystem.isGameOver || this.economySystem.isVictory) {
      this.perfMonitor.endFrame(
        this.entityMgr.activeEnemyCount,
        this.entityMgr.towers.length,
        this.entityMgr.activeProjCount
      );
      return;
    }

    // Accumulate time scaled by game speed
    // Clamp incoming delta to 100ms to avoid spiral of death on tab unfocus
    const clampedDelta = Math.min(frameDeltaSeconds, 0.1);
    this.accumulator += clampedDelta * this.speed;

    let subSteps = 0;
    while (this.accumulator >= this.fixedDt && subSteps < this.maxSubSteps) {
      this.perfMonitor.beginSim();
      this.stepSimulation(this.fixedDt);
      this.perfMonitor.endSim();

      this.accumulator -= this.fixedDt;
      subSteps++;
    }

    // If accumulated time is still too large, drop it to stay responsive
    if (this.accumulator > this.fixedDt) {
      this.accumulator = 0;
    }

    this.perfMonitor.endFrame(
      this.entityMgr.activeEnemyCount,
      this.entityMgr.towers.length,
      this.entityMgr.activeProjCount
    );
  }

  /**
   * Single deterministic simulation tick.
   */
  private stepSimulation(dt: number): void {
    // 1. Clear & rebuild Spatial Grid
    this.spatialGrid.clear();
    const activeCount = this.entityMgr.activeEnemyCount;
    const activeIndices = this.entityMgr.activeEnemyIndices;

    for (let i = 0; i < activeCount; i++) {
      const slot = activeIndices[i];
      if (this.entityMgr.enemyActive[slot] === 1) {
        this.spatialGrid.insert(slot, this.entityMgr.enemyX[slot], this.entityMgr.enemyY[slot]);
      }
    }

    // Reset combat stats event for this tick
    this.combatStatsEvent.damageDealt = 0;
    this.combatStatsEvent.creditsEarned = 0;
    this.combatStatsEvent.scoreEarned = 0;
    this.combatStatsEvent.coreDamageTaken = 0;
    this.combatStatsEvent.enemiesKilled = 0;

    // 2. Tower Targeting & Combat System
    this.perfMonitor.beginTargeting();
    this.combatSystem.update(dt, this.combatStatsEvent);
    this.perfMonitor.endTargeting();

    // 3. Movement, Projectile collisions, and Status Effects
    this.movementSystem.update(dt, this.combatStatsEvent);

    // Apply combat stats to economy
    if (this.combatStatsEvent.creditsEarned > 0) {
      this.economySystem.addCredits(this.combatStatsEvent.creditsEarned);
    }
    if (this.combatStatsEvent.scoreEarned > 0) {
      this.economySystem.addScore(this.combatStatsEvent.scoreEarned);
    }
    if (this.combatStatsEvent.enemiesKilled > 0) {
      this.economySystem.recordKills(this.combatStatsEvent.enemiesKilled);
    }
    if (this.combatStatsEvent.coreDamageTaken > 0) {
      this.economySystem.takeCoreDamage(this.combatStatsEvent.coreDamageTaken);
    }

    // 4. Wave progression
    this.waveSystem.update(dt);
  }

  // --- STRESS TESTING & BENCHMARK INJECTION ---

  public injectEnemies(count: number): void {
    const totalLength = GlobalPathSystem.totalLength;
    const types = this.entityMgr.enemyTypeKeys;

    for (let i = 0; i < count; i++) {
      const type = GlobalRNG.choice(types);
      const customDist = GlobalRNG.nextFloat(0, totalLength * 0.9);
      this.entityMgr.spawnEnemy(type, 1.0, 1.0, customDist);
    }
  }

  public injectTowers(count: number): void {
    const types: TowerType[] = ['pulse', 'tesla', 'mortar', 'cryo', 'railgun'];
    for (let i = 0; i < count; i++) {
      const type = GlobalRNG.choice(types);
      // Place around the corridor
      const x = GlobalRNG.nextFloat(100, 1180);
      const y = GlobalRNG.nextFloat(80, 640);
      if (!GlobalPathSystem.isNearPath(x, y, 28)) {
        const t = this.entityMgr.createTower(type, x, y);
        // Randomly upgrade some
        const levelUps = GlobalRNG.nextInt(0, 2);
        for (let u = 0; u < levelUps; u++) {
          this.entityMgr.upgradeTower(t);
        }
      }
    }
  }

  public injectProjectiles(count: number): void {
    const activeCount = this.entityMgr.activeEnemyCount;
    if (activeCount === 0) return;

    for (let i = 0; i < count; i++) {
      const targetSlot = this.entityMgr.activeEnemyIndices[GlobalRNG.nextInt(0, activeCount - 1)];
      const startX = GlobalRNG.nextFloat(100, 1180);
      const startY = GlobalRNG.nextFloat(80, 640);
      const typeIdx = GlobalRNG.nextInt(0, 4);

      this.entityMgr.spawnProjectile(
        typeIdx,
        startX,
        startY,
        targetSlot,
        this.entityMgr.enemyX[targetSlot],
        this.entityMgr.enemyY[targetSlot],
        50,
        600
      );
    }
  }

  public applyBenchmarkPreset(preset: 'NORMAL' | 'HEAVY' | 'ASSIGNMENT' | 'EXTREME', seed: number = 74921): void {
    GlobalRNG.reset(seed);
    this.entityMgr.clearAll();

    switch (preset) {
      case 'NORMAL':
        this.injectTowers(10);
        this.injectEnemies(100);
        this.injectProjectiles(50);
        break;
      case 'HEAVY':
        this.injectTowers(50);
        this.injectEnemies(1000);
        this.injectProjectiles(250);
        break;
      case 'ASSIGNMENT':
        // Exactly 5,000 enemies, 100 towers, 1,000 projectiles
        this.injectTowers(100);
        this.injectEnemies(5000);
        this.injectProjectiles(1000);
        break;
      case 'EXTREME':
        // 10,000 enemies, 200 towers, 2,000 projectiles
        this.injectTowers(200);
        this.injectEnemies(10000);
        this.injectProjectiles(2000);
        break;
    }
  }

  public restartGame(): void {
    this.entityMgr.clearAll();
    this.waveSystem.reset();
    this.economySystem.reset();
    this.setSpeed(1);
    this.isPaused = false;
  }
}
