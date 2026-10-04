export type EnemyType =
  | 'scout'
  | 'drone'
  | 'tank'
  | 'shield'
  | 'regenerator'
  | 'swarm'
  | 'phantom'
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
    baseHealth: 70,
    baseSpeed: 180,
    bounty: 9,
    scoreValue: 45,
    coreDamage: 1,
    radius: 9,
    color: 0x38bdf8,
    colorHex: '#38bdf8'
  },
  drone: {
    type: 'drone',
    name: 'Assault Drone',
    baseHealth: 175,
    baseSpeed: 115,
    bounty: 16,
    scoreValue: 85,
    coreDamage: 1,
    radius: 12,
    color: 0x00f3ff,
    colorHex: '#00f3ff'
  },
  tank: {
    type: 'tank',
    name: 'Titan Dreadnought',
    baseHealth: 1050,
    baseSpeed: 58,
    bounty: 50,
    scoreValue: 280,
    coreDamage: 3,
    radius: 18,
    color: 0xf59e0b,
    colorHex: '#f59e0b'
  },
  shield: {
    type: 'shield',
    name: 'Aegis Sentinel',
    baseHealth: 360,
    baseSpeed: 90,
    bounty: 30,
    scoreValue: 170,
    coreDamage: 2,
    radius: 14,
    color: 0x818cf8,
    colorHex: '#818cf8',
    hasShield: true,
    shieldMax: 280
  },
  regenerator: {
    type: 'regenerator',
    name: 'Nano Biomass',
    baseHealth: 480,
    baseSpeed: 98,
    bounty: 35,
    scoreValue: 200,
    coreDamage: 2,
    radius: 13,
    color: 0x10b981,
    colorHex: '#10b981',
    regenRate: 45 // +45 hp/s
  },
  swarm: {
    type: 'swarm',
    name: 'Micron Swarmer',
    baseHealth: 42,
    baseSpeed: 160,
    bounty: 6,
    scoreValue: 25,
    coreDamage: 1,
    radius: 6,
    color: 0xf43f5e,
    colorHex: '#f43f5e'
  },
  phantom: {
    type: 'phantom',
    name: 'Phantom Speeder',
    baseHealth: 220,
    baseSpeed: 195,
    bounty: 38,
    scoreValue: 240,
    coreDamage: 2,
    radius: 11,
    color: 0xe879f9,
    colorHex: '#e879f9',
    hasShield: true,
    shieldMax: 180
  },
  // Distinct Boss Encounters:
  boss_behemoth: {
    type: 'boss_behemoth',
    name: 'ORBITAL BEHEMOTH',
    baseHealth: 7500,
    baseSpeed: 44,
    bounty: 550,
    scoreValue: 4000,
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
    baseHealth: 12500,
    baseSpeed: 50,
    bounty: 900,
    scoreValue: 7000,
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
    baseHealth: 28000,
    baseSpeed: 40,
    bounty: 1800,
    scoreValue: 18000,
    coreDamage: 25,
    radius: 34,
    color: 0xffaa00,
    colorHex: '#ffaa00',
    isBoss: true,
    bossAbility: 'spawn_minions', // Releases clusters of swarm escorts
    bossAbilityInterval: 6
  }
};
