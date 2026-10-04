import { EnemyType } from './enemies';

export interface WaveSpawnGroup {
  enemyType: EnemyType;
  count: number;
  interval: number; // spawn delay between units in seconds
  initialDelay: number; // delay before this group begins spawning
  hpMultiplier?: number;
  speedMultiplier?: number;
}

export interface WaveDefinition {
  waveNumber: number;
  groups: WaveSpawnGroup[];
  rewardCredits: number;
  isBossWave?: boolean;
  bossName?: string;
}

export function generateAllWaves(): WaveDefinition[] {
  const waves: WaveDefinition[] = [];

  for (let w = 1; w <= 50; w++) {
    const groups: WaveSpawnGroup[] = [];
    const hpScale = 1 + (w - 1) * 0.12 + Math.pow(w / 10, 1.6) * 0.15;
    const speedScale = Math.min(1.4, 1 + w * 0.006);

    let isBossWave = false;
    let bossName = undefined;

    // Special Boss Waves
    if (w === 10) {
      isBossWave = true;
      bossName = 'ORBITAL BEHEMOTH';
      groups.push(
        { enemyType: 'drone', count: 12, interval: 0.6, initialDelay: 0, hpMultiplier: hpScale },
        { enemyType: 'boss_behemoth', count: 1, interval: 0, initialDelay: 5, hpMultiplier: hpScale * 1.1 },
        { enemyType: 'scout', count: 10, interval: 0.5, initialDelay: 9, hpMultiplier: hpScale }
      );
    } else if (w === 20) {
      isBossWave = true;
      bossName = 'WARP OVERLORD';
      groups.push(
        { enemyType: 'shield', count: 8, interval: 0.8, initialDelay: 0, hpMultiplier: hpScale },
        { enemyType: 'boss_warp_lord', count: 1, interval: 0, initialDelay: 6, hpMultiplier: hpScale * 1.2 },
        { enemyType: 'regenerator', count: 6, interval: 0.9, initialDelay: 10, hpMultiplier: hpScale }
      );
    } else if (w === 30) {
      isBossWave = true;
      bossName = 'APEX PRIME LEVIATHAN';
      groups.push(
        { enemyType: 'tank', count: 6, interval: 1.0, initialDelay: 0, hpMultiplier: hpScale },
        { enemyType: 'boss_mothership', count: 1, interval: 0, initialDelay: 5, hpMultiplier: hpScale * 1.3 },
        { enemyType: 'swarm', count: 25, interval: 0.2, initialDelay: 12, hpMultiplier: hpScale }
      );
    } else if (w === 40) {
      isBossWave = true;
      bossName = 'DUAL EXTINCTION FLEET';
      groups.push(
        { enemyType: 'boss_behemoth', count: 1, interval: 0, initialDelay: 0, hpMultiplier: hpScale * 1.4 },
        { enemyType: 'shield', count: 12, interval: 0.6, initialDelay: 3, hpMultiplier: hpScale },
        { enemyType: 'boss_warp_lord', count: 1, interval: 0, initialDelay: 8, hpMultiplier: hpScale * 1.4 },
        { enemyType: 'regenerator', count: 10, interval: 0.7, initialDelay: 12, hpMultiplier: hpScale }
      );
    } else if (w === 50) {
      isBossWave = true;
      bossName = 'THE APEX SINGULARITY (FINAL CONFLICT)';
      groups.push(
        { enemyType: 'tank', count: 12, interval: 0.8, initialDelay: 0, hpMultiplier: hpScale * 1.5 },
        { enemyType: 'boss_warp_lord', count: 1, interval: 0, initialDelay: 4, hpMultiplier: hpScale * 1.6 },
        { enemyType: 'boss_mothership', count: 1, interval: 0, initialDelay: 10, hpMultiplier: hpScale * 1.8 },
        { enemyType: 'boss_behemoth', count: 2, interval: 4.0, initialDelay: 16, hpMultiplier: hpScale * 1.6 },
        { enemyType: 'swarm', count: 60, interval: 0.15, initialDelay: 22, hpMultiplier: hpScale * 1.3 }
      );
    } else {
      // Standard progressive waves
      if (w <= 4) {
        // Early scouts & drones
        groups.push({
          enemyType: 'scout',
          count: 6 + w * 3,
          interval: 0.85 - w * 0.05,
          initialDelay: 0,
          hpMultiplier: hpScale,
          speedMultiplier: speedScale
        });
        if (w >= 3) {
          groups.push({
            enemyType: 'drone',
            count: w * 2,
            interval: 1.0,
            initialDelay: 3.0,
            hpMultiplier: hpScale
          });
        }
      } else if (w <= 9) {
        // Drones + introduction of tanks and swarms
        groups.push({
          enemyType: 'drone',
          count: 8 + w * 2,
          interval: 0.7,
          initialDelay: 0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'swarm',
          count: 10 + (w - 4) * 4,
          interval: 0.25,
          initialDelay: 2.5,
          hpMultiplier: hpScale
        });
        if (w >= 7) {
          groups.push({
            enemyType: 'tank',
            count: w - 5,
            interval: 1.6,
            initialDelay: 5.0,
            hpMultiplier: hpScale
          });
        }
      } else if (w <= 19) {
        // Shield units and regenerators added
        groups.push({
          enemyType: 'scout',
          count: 12 + w,
          interval: 0.5,
          initialDelay: 0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'shield',
          count: 3 + Math.floor(w / 3),
          interval: 1.2,
          initialDelay: 2.5,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'regenerator',
          count: 2 + Math.floor(w / 4),
          interval: 1.4,
          initialDelay: 5.0,
          hpMultiplier: hpScale
        });
        if (w % 3 === 0) {
          groups.push({
            enemyType: 'tank',
            count: 2 + Math.floor(w / 4),
            interval: 1.8,
            initialDelay: 8.0,
            hpMultiplier: hpScale
          });
        }
      } else if (w <= 29) {
        // Dense mixed waves
        groups.push({
          enemyType: 'drone',
          count: 15 + w,
          interval: 0.45,
          initialDelay: 0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'swarm',
          count: 20 + w,
          interval: 0.2,
          initialDelay: 2.0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'shield',
          count: 6 + Math.floor(w / 5),
          interval: 0.8,
          initialDelay: 4.5,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'tank',
          count: 4 + Math.floor(w / 6),
          interval: 1.4,
          initialDelay: 7.0,
          hpMultiplier: hpScale
        });
      } else if (w <= 39) {
        // High threat tier
        groups.push({
          enemyType: 'scout',
          count: 25 + w,
          interval: 0.35,
          initialDelay: 0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'regenerator',
          count: 8 + Math.floor(w / 4),
          interval: 0.7,
          initialDelay: 3.0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'shield',
          count: 10 + Math.floor(w / 4),
          interval: 0.6,
          initialDelay: 5.5,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'tank',
          count: 7 + Math.floor(w / 5),
          interval: 1.1,
          initialDelay: 8.0,
          hpMultiplier: hpScale
        });
      } else {
        // Climax tier (41 - 49)
        groups.push({
          enemyType: 'swarm',
          count: 40 + (w - 40) * 5,
          interval: 0.15,
          initialDelay: 0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'drone',
          count: 25 + (w - 40) * 2,
          interval: 0.35,
          initialDelay: 3.0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'shield',
          count: 14 + (w - 40),
          interval: 0.5,
          initialDelay: 6.0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'tank',
          count: 10 + (w - 40),
          interval: 0.8,
          initialDelay: 9.0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'regenerator',
          count: 12 + (w - 40),
          interval: 0.6,
          initialDelay: 12.0,
          hpMultiplier: hpScale
        });
      }
    }

    const reward = 100 + w * 25 + (isBossWave ? 250 : 0);

    waves.push({
      waveNumber: w,
      groups,
      rewardCredits: reward,
      isBossWave,
      bossName
    });
  }

  return waves;
}

export const ALL_WAVES: WaveDefinition[] = generateAllWaves();
