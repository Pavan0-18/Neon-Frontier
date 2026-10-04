export type EnemyType =
  | 'scout'
  | 'drone'
  | 'tank'
  | 'shield'
  | 'regenerator'
  | 'swarm'
  | 'boss_behemoth'
  | 'boss_warp_lord'
  | 'boss_mothership';

export interface EnemyDefinition {
  type: EnemyType;
  name: string;
  baseHealth: number;
  baseSpeed: number; // pixels per second
  bounty: number;    // credits rewarded
  scoreValue: number;
  coreDamage: number;// damage to player energy core if reached
  radius: number;    // collision / visual radius
  color: number;
  colorHex: string;
  hasShield?: boolean;
  shieldMax?: number;
  regenRate?: number; // health per second
  isBoss?: boolean;
  bossAbility?: 'emp' | 'phase_shift' | 'spawn_minions';
  bossAbilityInterval?: number; // seconds
}

export const ENEMY_DEFINITIONS: Record<EnemyType, EnemyDefinition> = {
  scout: {
    type: 'scout',
    name: 'Void Scout',
    baseHealth: 65,
    baseSpeed: 175,
    bounty: 8,
    scoreValue: 40,
    coreDamage: 1,
    radius: 9,
    color: 0x38bdf8,
    colorHex: '#38bdf8'
  },
  drone: {
    type: 'drone',
    name: 'Assault Drone',
    baseHealth: 160,
    baseSpeed: 110,
    bounty: 14,
    scoreValue: 80,
    coreDamage: 1,
    radius: 12,
    color: 0x00f3ff,
    colorHex: '#00f3ff'
  },
  tank: {
    type: 'tank',
    name: 'Titan Dreadnought',
    baseHealth: 900,
    baseSpeed: 55,
    bounty: 45,
    scoreValue: 260,
    coreDamage: 3,
    radius: 18,
    color: 0xf59e0b,
    colorHex: '#f59e0b'
  },
  shield: {
    type: 'shield',
    name: 'Aegis Sentinel',
    baseHealth: 320,
    baseSpeed: 85,
    bounty: 28,
    scoreValue: 160,
    coreDamage: 2,
    radius: 14,
    color: 0x818cf8,
    colorHex: '#818cf8',
    hasShield: true,
    shieldMax: 250
  },
  regenerator: {
    type: 'regenerator',
    name: 'Nano Biomass',
    baseHealth: 450,
    baseSpeed: 95,
    bounty: 32,
    scoreValue: 190,
    coreDamage: 2,
    radius: 13,
    color: 0x10b981,
    colorHex: '#10b981',
    regenRate: 40 // +40 hp/s
  },
  swarm: {
    type: 'swarm',
    name: 'Micron Swarmer',
    baseHealth: 38,
    baseSpeed: 155,
    bounty: 5,
    scoreValue: 20,
    coreDamage: 1,
    radius: 6,
    color: 0xf43f5e,
    colorHex: '#f43f5e'
  },
  // Distinct Boss Encounters:
  boss_behemoth: {
    type: 'boss_behemoth',
    name: 'ORBITAL BEHEMOTH',
    baseHealth: 6500,
    baseSpeed: 42,
    bounty: 500,
    scoreValue: 3500,
    coreDamage: 10,
    radius: 28,
    color: 0xff0055,
    colorHex: '#ff0055',
    isBoss: true,
    bossAbility: 'emp', // Stuns nearby towers briefly
    bossAbilityInterval: 8
  },
  boss_warp_lord: {
    type: 'boss_warp_lord',
    name: 'WARP OVERLORD',
    baseHealth: 11000,
    baseSpeed: 48,
    bounty: 850,
    scoreValue: 6000,
    coreDamage: 15,
    radius: 30,
    color: 0xb026ff,
    colorHex: '#b026ff',
    isBoss: true,
    bossAbility: 'phase_shift', // Takes 75% reduced damage during phase
    bossAbilityInterval: 7
  },
  boss_mothership: {
    type: 'boss_mothership',
    name: 'APEX PRIME LEVIATHAN',
    baseHealth: 24000,
    baseSpeed: 38,
    bounty: 1500,
    scoreValue: 15000,
    coreDamage: 25,
    radius: 34,
    color: 0xffaa00,
    colorHex: '#ffaa00',
    isBoss: true,
    bossAbility: 'spawn_minions', // Releases clusters of swarm escorts
    bossAbilityInterval: 6
  }
};
