export type TowerType = 'pulse' | 'tesla' | 'mortar' | 'cryo' | 'railgun';

export type TargetingStrategy = 'first' | 'last' | 'closest' | 'strongest' | 'weakest';

export interface TowerLevelStats {
  level: number;
  damage: number;
  range: number;
  attackInterval: number; // in seconds (e.g. 0.5 = 2 shots/sec)
  upgradeCost: number; // cost to advance to NEXT level (0 if max)
  sellValue: number;
  // Special attributes
  splashRadius?: number; // For mortar
  chainCount?: number;   // For tesla
  chainRange?: number;   // For tesla
  chainFalloff?: number; // For tesla (e.g. 0.7 = 70% damage on next bounce)
  slowFactor?: number;   // For cryo (e.g. 0.5 = 50% speed)
  slowDuration?: number; // For cryo (in seconds)
  projectileSpeed?: number;
}

export interface TowerDefinition {
  id: TowerType;
  name: string;
  role: string;
  description: string;
  baseCost: number;
  color: number;
  colorHex: string;
  bulletColor: number;
  levels: TowerLevelStats[];
}

export const TOWER_DEFINITIONS: Record<TowerType, TowerDefinition> = {
  pulse: {
    id: 'pulse',
    name: 'Pulse Cannon',
    role: 'Balanced Single-Target',
    description: 'Rapid-fire orbital pulse blaster. Reliable against fast scouts and light drones.',
    baseCost: 100,
    color: 0x00f3ff,
    colorHex: '#00f3ff',
    bulletColor: 0x38bdf8,
    levels: [
      {
        level: 1,
        damage: 35,
        range: 160,
        attackInterval: 0.55,
        upgradeCost: 120,
        sellValue: 70,
        projectileSpeed: 600
      },
      {
        level: 2,
        damage: 65,
        range: 185,
        attackInterval: 0.45,
        upgradeCost: 200,
        sellValue: 154,
        projectileSpeed: 700
      },
      {
        level: 3,
        damage: 120,
        range: 215,
        attackInterval: 0.35,
        upgradeCost: 0,
        sellValue: 294,
        projectileSpeed: 850
      }
    ]
  },
  tesla: {
    id: 'tesla',
    name: 'Arc Tesla',
    role: 'Chain Damage',
    description: 'High-voltage lightning coil. Jumps across clustered swarms, dealing diminishing chain damage.',
    baseCost: 175,
    color: 0xb026ff,
    colorHex: '#b026ff',
    bulletColor: 0xc084fc,
    levels: [
      {
        level: 1,
        damage: 55,
        range: 150,
        attackInterval: 0.85,
        upgradeCost: 180,
        sellValue: 122,
        chainCount: 3,
        chainRange: 120,
        chainFalloff: 0.75,
        projectileSpeed: 1000
      },
      {
        level: 2,
        damage: 100,
        range: 175,
        attackInterval: 0.75,
        upgradeCost: 280,
        sellValue: 248,
        chainCount: 4,
        chainRange: 140,
        chainFalloff: 0.8,
        projectileSpeed: 1100
      },
      {
        level: 3,
        damage: 190,
        range: 205,
        attackInterval: 0.65,
        upgradeCost: 0,
        sellValue: 444,
        chainCount: 6,
        chainRange: 160,
        chainFalloff: 0.85,
        projectileSpeed: 1200
      }
    ]
  },
  mortar: {
    id: 'mortar',
    name: 'Plasma Mortar',
    role: 'Area Splash Damage',
    description: 'Heavy plasma shell launcher. Delivers massive explosive impact damage across a wide blast radius.',
    baseCost: 220,
    color: 0xffaa00,
    colorHex: '#ffaa00',
    bulletColor: 0xf59e0b,
    levels: [
      {
        level: 1,
        damage: 140,
        range: 220,
        attackInterval: 1.8,
        upgradeCost: 240,
        sellValue: 154,
        splashRadius: 90,
        projectileSpeed: 380
      },
      {
        level: 2,
        damage: 260,
        range: 250,
        attackInterval: 1.6,
        upgradeCost: 360,
        sellValue: 322,
        splashRadius: 115,
        projectileSpeed: 420
      },
      {
        level: 3,
        damage: 480,
        range: 280,
        attackInterval: 1.4,
        upgradeCost: 0,
        sellValue: 574,
        splashRadius: 140,
        projectileSpeed: 460
      }
    ]
  },
  cryo: {
    id: 'cryo',
    name: 'Cryo Beacon',
    role: 'Crowd Control & Slow',
    description: 'Sub-zero tachyon emitter. Dramatically impairs hostile velocity while inflicting light thermal decay.',
    baseCost: 150,
    color: 0x00ffcc,
    colorHex: '#00ffcc',
    bulletColor: 0x67e8f9,
    levels: [
      {
        level: 1,
        damage: 15,
        range: 170,
        attackInterval: 0.9,
        upgradeCost: 160,
        sellValue: 105,
        slowFactor: 0.55, // 45% slow
        slowDuration: 2.5,
        projectileSpeed: 550
      },
      {
        level: 2,
        damage: 30,
        range: 195,
        attackInterval: 0.8,
        upgradeCost: 240,
        sellValue: 217,
        slowFactor: 0.42, // 58% slow
        slowDuration: 3.2,
        projectileSpeed: 600
      },
      {
        level: 3,
        damage: 60,
        range: 225,
        attackInterval: 0.7,
        upgradeCost: 0,
        sellValue: 385,
        slowFactor: 0.3, // 70% slow
        slowDuration: 4.0,
        projectileSpeed: 700
      }
    ]
  },
  railgun: {
    id: 'railgun',
    name: 'Railgun',
    role: 'Precision Heavy Strike',
    description: 'Kinetic hyper-velocity penetrator. Extreme range and devastating damage against heavy tanks and bosses.',
    baseCost: 280,
    color: 0xff0055,
    colorHex: '#ff0055',
    bulletColor: 0xf43f5e,
    levels: [
      {
        level: 1,
        damage: 380,
        range: 340,
        attackInterval: 2.4,
        upgradeCost: 320,
        sellValue: 196,
        projectileSpeed: 1800
      },
      {
        level: 2,
        damage: 720,
        range: 380,
        attackInterval: 2.1,
        upgradeCost: 480,
        sellValue: 420,
        projectileSpeed: 2100
      },
      {
        level: 3,
        damage: 1350,
        range: 420,
        attackInterval: 1.8,
        upgradeCost: 0,
        sellValue: 756,
        projectileSpeed: 2500
      }
    ]
  }
};
