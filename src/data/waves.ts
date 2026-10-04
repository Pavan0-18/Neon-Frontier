import { EnemyType } from './enemies';

export interface RoundSpawnGroup {
  enemyType: EnemyType;
  count: number;
  interval: number; // spawn delay between units in seconds
  initialDelay: number; // delay before this group begins spawning
  hpMultiplier?: number;
  speedMultiplier?: number;
}

export interface RoundDefinition {
  roundNumber: number;
  modifierTitle?: string;
  modifierDesc?: string;
  groups: RoundSpawnGroup[];
  rewardCredits: number;
  isBossRound?: boolean;
  bossName?: string;
}

export function generateAllRounds(): RoundDefinition[] {
  const rounds: RoundDefinition[] = [];

  for (let r = 1; r <= 50; r++) {
    const groups: RoundSpawnGroup[] = [];
    const hpScale = 1 + (r - 1) * 0.13 + Math.pow(r / 8, 1.7) * 0.12;
    const speedScale = Math.min(1.5, 1 + r * 0.008);

    let isBossRound = false;
    let bossName: string | undefined = undefined;
    let modifierTitle: string | undefined = undefined;
    let modifierDesc: string | undefined = undefined;

    // Boss Rounds
    if (r === 10) {
      isBossRound = true;
      bossName = 'ORBITAL BEHEMOTH';
      modifierTitle = 'BOSS ENCOUNTER: EMP HAZARD';
      modifierDesc = 'Colossal armored dreadnought with EMP pulse capability.';
      groups.push(
        { enemyType: 'drone', count: 14, interval: 0.55, initialDelay: 0, hpMultiplier: hpScale },
        { enemyType: 'boss_behemoth', count: 1, interval: 0, initialDelay: 4, hpMultiplier: hpScale * 1.15 },
        { enemyType: 'scout', count: 12, interval: 0.45, initialDelay: 8, hpMultiplier: hpScale }
      );
    } else if (r === 20) {
      isBossRound = true;
      bossName = 'WARP OVERLORD';
      modifierTitle = 'BOSS ENCOUNTER: PHASE SHIFT';
      modifierDesc = 'Ethereal cosmic entity capable of 75% damage mitigation.';
      groups.push(
        { enemyType: 'shield', count: 10, interval: 0.7, initialDelay: 0, hpMultiplier: hpScale },
        { enemyType: 'phantom', count: 8, interval: 0.6, initialDelay: 3, hpMultiplier: hpScale },
        { enemyType: 'boss_warp_lord', count: 1, interval: 0, initialDelay: 6, hpMultiplier: hpScale * 1.25 },
        { enemyType: 'regenerator', count: 8, interval: 0.8, initialDelay: 10, hpMultiplier: hpScale }
      );
    } else if (r === 30) {
      isBossRound = true;
      bossName = 'APEX PRIME LEVIATHAN';
      modifierTitle = 'BOSS ENCOUNTER: SWARM HIVE';
      modifierDesc = 'Massive carrier vessel deploying continuous stinger escort clusters.';
      groups.push(
        { enemyType: 'tank', count: 8, interval: 0.9, initialDelay: 0, hpMultiplier: hpScale },
        { enemyType: 'boss_mothership', count: 1, interval: 0, initialDelay: 5, hpMultiplier: hpScale * 1.35 },
        { enemyType: 'swarm', count: 35, interval: 0.18, initialDelay: 12, hpMultiplier: hpScale }
      );
    } else if (r === 40) {
      isBossRound = true;
      bossName = 'DUAL EXTINCTION FLEET';
      modifierTitle = 'BOSS ENCOUNTER: TWIN OVERLORDS';
      modifierDesc = 'Simultaneous Behemoth and Warp Overlord incursions.';
      groups.push(
        { enemyType: 'boss_behemoth', count: 1, interval: 0, initialDelay: 0, hpMultiplier: hpScale * 1.4 },
        { enemyType: 'shield', count: 15, interval: 0.5, initialDelay: 2, hpMultiplier: hpScale },
        { enemyType: 'boss_warp_lord', count: 1, interval: 0, initialDelay: 7, hpMultiplier: hpScale * 1.4 },
        { enemyType: 'phantom', count: 12, interval: 0.45, initialDelay: 11, hpMultiplier: hpScale }
      );
    } else if (r === 50) {
      isBossRound = true;
      bossName = 'THE APEX SINGULARITY (FINAL CONFLICT)';
      modifierTitle = 'FINAL EXTINCTION CLIMAX';
      modifierDesc = 'All hostile flagships converge on the colony core.';
      groups.push(
        { enemyType: 'tank', count: 14, interval: 0.7, initialDelay: 0, hpMultiplier: hpScale * 1.5 },
        { enemyType: 'boss_warp_lord', count: 1, interval: 0, initialDelay: 4, hpMultiplier: hpScale * 1.6 },
        { enemyType: 'boss_mothership', count: 1, interval: 0, initialDelay: 9, hpMultiplier: hpScale * 1.8 },
        { enemyType: 'boss_behemoth', count: 2, interval: 4.0, initialDelay: 15, hpMultiplier: hpScale * 1.6 },
        { enemyType: 'swarm', count: 80, interval: 0.12, initialDelay: 20, hpMultiplier: hpScale * 1.4 }
      );
    } else {
      // Standard progressive rounds with escalating difficulty
      if (r <= 4) {
        modifierTitle = 'RECON INVASION';
        modifierDesc = 'Light scouting probes probing perimeter defenses.';
        groups.push({
          enemyType: 'scout',
          count: 8 + r * 3,
          interval: 0.8 - r * 0.05,
          initialDelay: 0,
          hpMultiplier: hpScale,
          speedMultiplier: speedScale
        });
        if (r >= 2) {
          groups.push({
            enemyType: 'drone',
            count: r * 3,
            interval: 0.9,
            initialDelay: 2.5,
            hpMultiplier: hpScale
          });
        }
      } else if (r <= 9) {
        modifierTitle = 'ARMORED FORMATION';
        modifierDesc = 'Hostile drones backed by heavy dreadnought vanguards.';
        groups.push({
          enemyType: 'drone',
          count: 10 + r * 2,
          interval: 0.65,
          initialDelay: 0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'swarm',
          count: 12 + (r - 4) * 4,
          interval: 0.22,
          initialDelay: 2.0,
          hpMultiplier: hpScale
        });
        if (r >= 6) {
          groups.push({
            enemyType: 'tank',
            count: r - 4,
            interval: 1.4,
            initialDelay: 4.5,
            hpMultiplier: hpScale
          });
        }
      } else if (r <= 19) {
        modifierTitle = 'AEGIS SHIELD SURGE';
        modifierDesc = 'Shield generators and cellular regenerators shielding units.';
        groups.push({
          enemyType: 'scout',
          count: 14 + r,
          interval: 0.45,
          initialDelay: 0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'shield',
          count: 4 + Math.floor(r / 3),
          interval: 1.0,
          initialDelay: 2.0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'regenerator',
          count: 3 + Math.floor(r / 4),
          interval: 1.2,
          initialDelay: 4.0,
          hpMultiplier: hpScale
        });
        if (r >= 14) {
          groups.push({
            enemyType: 'phantom',
            count: 3 + (r - 13),
            interval: 0.7,
            initialDelay: 6.5,
            hpMultiplier: hpScale
          });
        }
      } else if (r <= 29) {
        modifierTitle = 'HIGH DENSITY SIEGE';
        modifierDesc = 'Heavy mixed armored vanguard with fast phantom spearheads.';
        groups.push({
          enemyType: 'drone',
          count: 18 + r,
          interval: 0.4,
          initialDelay: 0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'swarm',
          count: 25 + r,
          interval: 0.18,
          initialDelay: 1.8,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'shield',
          count: 7 + Math.floor(r / 4),
          interval: 0.7,
          initialDelay: 4.0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'tank',
          count: 5 + Math.floor(r / 5),
          interval: 1.2,
          initialDelay: 6.0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'phantom',
          count: 6 + Math.floor(r / 5),
          interval: 0.6,
          initialDelay: 8.0,
          hpMultiplier: hpScale
        });
      } else if (r <= 39) {
        modifierTitle = 'ANOMALY STORM TIER';
        modifierDesc = 'Extreme hostile density with dual regenerator columns.';
        groups.push({
          enemyType: 'scout',
          count: 28 + r,
          interval: 0.3,
          initialDelay: 0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'phantom',
          count: 10 + Math.floor(r / 4),
          interval: 0.45,
          initialDelay: 2.0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'regenerator',
          count: 9 + Math.floor(r / 4),
          interval: 0.6,
          initialDelay: 4.0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'shield',
          count: 12 + Math.floor(r / 4),
          interval: 0.5,
          initialDelay: 6.0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'tank',
          count: 8 + Math.floor(r / 4),
          interval: 1.0,
          initialDelay: 8.5,
          hpMultiplier: hpScale
        });
      } else {
        // Climax Tier (41–49)
        modifierTitle = 'ORBITAL EXTINCTION CRUCIBLE';
        modifierDesc = 'Massive non-stop swarm assault pushing defenses to the limit.';
        groups.push({
          enemyType: 'swarm',
          count: 50 + (r - 40) * 6,
          interval: 0.12,
          initialDelay: 0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'phantom',
          count: 14 + (r - 40) * 2,
          interval: 0.35,
          initialDelay: 2.5,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'drone',
          count: 28 + (r - 40) * 2,
          interval: 0.3,
          initialDelay: 5.0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'shield',
          count: 16 + (r - 40),
          interval: 0.45,
          initialDelay: 7.5,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'tank',
          count: 12 + (r - 40),
          interval: 0.75,
          initialDelay: 10.0,
          hpMultiplier: hpScale
        });
        groups.push({
          enemyType: 'regenerator',
          count: 14 + (r - 40),
          interval: 0.55,
          initialDelay: 13.0,
          hpMultiplier: hpScale
        });
      }
    }

    const reward = 120 + r * 30 + (isBossRound ? 350 : 0);

    rounds.push({
      roundNumber: r,
      modifierTitle,
      modifierDesc,
      groups,
      rewardCredits: reward,
      isBossRound,
      bossName
    });
  }

  return rounds;
}

export const ALL_ROUNDS: RoundDefinition[] = generateAllRounds();
// Alias for compatibility
export const ALL_WAVES = ALL_ROUNDS;
export type WaveDefinition = RoundDefinition;
export type WaveSpawnGroup = RoundSpawnGroup;
