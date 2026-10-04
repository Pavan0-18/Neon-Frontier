import { ALL_WAVES, WaveDefinition, WaveSpawnGroup } from '../../data/waves';
import { EntityManager } from '../entities/EntityManager';
import { GlobalSoundFX } from '../../audio/SoundFX';

export interface ActiveWaveSpawner {
  group: WaveSpawnGroup;
  spawnedCount: number;
  timeSinceLastSpawn: number;
  delayRemaining: number;
}

export class WaveSystem {
  public currentWaveIndex: number = 0; // 0-indexed (0 = wave 1)
  public waveInProgress: boolean = false;
  public waveCompleted: boolean = false;
  public autoStartCountdown: number = 15; // seconds until next wave auto-starts
  public isAutoStartActive: boolean = true;
  public totalWaves: number = 50;

  private entityMgr: EntityManager;
  private activeSpawners: ActiveWaveSpawner[] = [];
  public currentWaveDef: WaveDefinition | null = null;

  public onWaveStart?: (wave: number, isBoss: boolean, bossName?: string) => void;
  public onWaveComplete?: (wave: number, reward: number) => void;
  public onVictory?: () => void;

  constructor(entityMgr: EntityManager) {
    this.entityMgr = entityMgr;
    this.totalWaves = ALL_WAVES.length;
  }

  public get currentWaveNumber(): number {
    return this.currentWaveIndex + 1;
  }

  public startNextWave(): boolean {
    if (this.waveInProgress) return false;
    if (this.currentWaveIndex >= this.totalWaves) return false;

    this.currentWaveDef = ALL_WAVES[this.currentWaveIndex];
    this.waveInProgress = true;
    this.waveCompleted = false;
    this.isAutoStartActive = false;
    this.activeSpawners = [];

    // Initialize spawners for this wave
    for (const group of this.currentWaveDef.groups) {
      this.activeSpawners.push({
        group,
        spawnedCount: 0,
        timeSinceLastSpawn: group.interval, // trigger first immediately after initial delay
        delayRemaining: group.initialDelay
      });
    }

    if (this.currentWaveDef.isBossWave) {
      GlobalSoundFX.playBossKlaxon();
    } else {
      GlobalSoundFX.playWaveAlarm();
    }

    if (this.onWaveStart) {
      this.onWaveStart(
        this.currentWaveNumber,
        !!this.currentWaveDef.isBossWave,
        this.currentWaveDef.bossName
      );
    }

    return true;
  }

  public update(dt: number): void {
    if (!this.waveInProgress) {
      // Countdown to next wave
      if (this.isAutoStartActive && this.currentWaveIndex < this.totalWaves) {
        this.autoStartCountdown -= dt;
        if (this.autoStartCountdown <= 0) {
          this.startNextWave();
        }
      }
      return;
    }

    // Process active spawners
    let allSpawnersDone = true;

    for (let i = 0; i < this.activeSpawners.length; i++) {
      const spawner = this.activeSpawners[i];
      if (spawner.spawnedCount >= spawner.group.count) {
        continue;
      }

      allSpawnersDone = false;

      // Handle initial delay
      if (spawner.delayRemaining > 0) {
        spawner.delayRemaining -= dt;
        continue;
      }

      spawner.timeSinceLastSpawn += dt;
      if (spawner.timeSinceLastSpawn >= spawner.group.interval) {
        spawner.timeSinceLastSpawn = 0;
        this.entityMgr.spawnEnemy(
          spawner.group.enemyType,
          spawner.group.hpMultiplier || 1,
          spawner.group.speedMultiplier || 1
        );
        spawner.spawnedCount++;
      }
    }

    // Check if wave is completed (all enemies spawned and all enemies killed/reached core)
    if (allSpawnersDone && this.entityMgr.activeEnemyCount === 0) {
      this.completeWave();
    }
  }

  private completeWave(): void {
    this.waveInProgress = false;
    this.waveCompleted = true;
    const reward = this.currentWaveDef ? this.currentWaveDef.rewardCredits : 100;

    if (this.onWaveComplete) {
      this.onWaveComplete(this.currentWaveNumber, reward);
    }

    this.currentWaveIndex++;

    if (this.currentWaveIndex >= this.totalWaves) {
      // VICTORY!
      GlobalSoundFX.playVictory();
      if (this.onVictory) {
        this.onVictory();
      }
    } else {
      // Prepare countdown for next wave
      this.autoStartCountdown = 12;
      this.isAutoStartActive = true;
    }
  }

  public reset(): void {
    this.currentWaveIndex = 0;
    this.waveInProgress = false;
    this.waveCompleted = false;
    this.autoStartCountdown = 10;
    this.isAutoStartActive = true;
    this.activeSpawners = [];
    this.currentWaveDef = null;
  }
}
