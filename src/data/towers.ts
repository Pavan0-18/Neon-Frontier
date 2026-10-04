export type TowerType =
  | 'pulse'
  | 'tesla'
  | 'mortar'
  | 'cryo'
  | 'railgun'
  | 'laser'
  | 'flak'
  | 'vortex';

export type TargetingStrategy = 'first' | 'last' | 'closest' | 'strongest' | 'weakest';

export interface TowerLevelStats {
  level: number;
  damage: number;
  range: number;
  attackInterval: number; // in seconds (e.g. 0.5 = 2 shots/sec, for laser it is tick interval 0.1s)
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
  pelletCount?: number;  // For flak shotgun
  pullForce?: number;    // For vortex singularity
  beamRampUp?: number;   // For laser beam continuous ramp
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
    role: 'Rapid Single-Target',
    description: 'Rapid-fire orbital pulse blaster. Highly effective against fast scouts and light drones.',
    baseCost: 95,
    color: 0x00f3ff,
    colorHex: '#00f3ff',
    bulletColor: 0x38bdf8,
    levels: [
      {
        level: 1,
        damage: 38,
        range: 165,
        attackInterval: 0.5,
        upgradeCost: 110,
        sellValue: 66,
        projectileSpeed: 650
      },
      {
        level: 2,
        damage: 72,
        range: 190,
        attackInterval: 0.42,
        upgradeCost: 190,
        sellValue: 143,
        projectileSpeed: 750
      },
      {
        level: 3,
        damage: 135,
        range: 220,
        attackInterval: 0.32,
        upgradeCost: 0,
        sellValue: 276,
        projectileSpeed: 900
      }
    ]
  },
  tesla: {
    id: 'tesla',
    name: 'Arc Tesla',
    role: 'Chain Lightning',
    description: 'High-voltage lightning coil. Jumps across clustered hostile units, dealing diminishing chain damage.',
    baseCost: 165,
    color: 0xb026ff,
    colorHex: '#b026ff',
    bulletColor: 0xc084fc,
    levels: [
      {
        level: 1,
        damage: 58,
        range: 155,
        attackInterval: 0.8,
        upgradeCost: 170,
        sellValue: 115,
        chainCount: 3,
        chainRange: 130,
        chainFalloff: 0.75,
        projectileSpeed: 1100
      },
      {
        level: 2,
        damage: 105,
        range: 180,
        attackInterval: 0.7,
        upgradeCost: 260,
        sellValue: 234,
        chainCount: 5,
        chainRange: 150,
        chainFalloff: 0.8,
        projectileSpeed: 1200
      },
      {
        level: 3,
        damage: 210,
        range: 210,
        attackInterval: 0.6,
        upgradeCost: 0,
        sellValue: 416,
        chainCount: 7,
        chainRange: 175,
        chainFalloff: 0.85,
        projectileSpeed: 1300
      }
    ]
  },
  mortar: {
    id: 'mortar',
    name: 'Plasma Mortar',
    role: 'Explosive Splash',
    description: 'Heavy plasma shell launcher. Delivers massive explosive impact damage across a wide blast radius.',
    baseCost: 210,
    color: 0xffaa00,
    colorHex: '#ffaa00',
    bulletColor: 0xf59e0b,
    levels: [
      {
        level: 1,
        damage: 150,
        range: 220,
        attackInterval: 1.7,
        upgradeCost: 220,
        sellValue: 147,
        splashRadius: 95,
        projectileSpeed: 380
      },
      {
        level: 2,
        damage: 280,
        range: 255,
        attackInterval: 1.5,
        upgradeCost: 340,
        sellValue: 301,
        splashRadius: 120,
        projectileSpeed: 430
      },
      {
        level: 3,
        damage: 520,
        range: 290,
        attackInterval: 1.3,
        upgradeCost: 0,
        sellValue: 539,
        splashRadius: 150,
        projectileSpeed: 480
      }
    ]
  },
  cryo: {
    id: 'cryo',
    name: 'Cryo Beacon',
    role: 'Crowd Deceleration',
    description: 'Sub-zero tachyon emitter. Impairs hostile velocity significantly while inflicting light thermal decay.',
    baseCost: 140,
    color: 0x00ffcc,
    colorHex: '#00ffcc',
    bulletColor: 0x67e8f9,
    levels: [
      {
        level: 1,
        damage: 18,
        range: 175,
        attackInterval: 0.85,
        upgradeCost: 150,
        sellValue: 98,
        slowFactor: 0.52, // 48% slow
        slowDuration: 2.8,
        projectileSpeed: 580
      },
      {
        level: 2,
        damage: 35,
        range: 205,
        attackInterval: 0.75,
        upgradeCost: 230,
        sellValue: 203,
        slowFactor: 0.40, // 60% slow
        slowDuration: 3.5,
        projectileSpeed: 640
      },
      {
        level: 3,
        damage: 70,
        range: 235,
        attackInterval: 0.65,
        upgradeCost: 0,
        sellValue: 364,
        slowFactor: 0.28, // 72% slow
        slowDuration: 4.5,
        projectileSpeed: 720
      }
    ]
  },
  railgun: {
    id: 'railgun',
    name: 'Railgun',
    role: 'Hyper-Velocity Sniper',
    description: 'Kinetic hyper-velocity penetrator. Extreme range and devastating damage against heavy tanks and bosses.',
    baseCost: 260,
    color: 0xff0055,
    colorHex: '#ff0055',
    bulletColor: 0xf43f5e,
    levels: [
      {
        level: 1,
        damage: 420,
        range: 350,
        attackInterval: 2.2,
        upgradeCost: 290,
        sellValue: 182,
        projectileSpeed: 2200
      },
      {
        level: 2,
        damage: 820,
        range: 390,
        attackInterval: 1.9,
        upgradeCost: 440,
        sellValue: 385,
        projectileSpeed: 2500
      },
      {
        level: 3,
        damage: 1550,
        range: 440,
        attackInterval: 1.6,
        upgradeCost: 0,
        sellValue: 693,
        projectileSpeed: 2900
      }
    ]
  },
  laser: {
    id: 'laser',
    name: 'Photon Beam',
    role: 'Thermal Melt Beam',
    description: 'Continuous concentrated thermal laser. Melts through armor and ramps up damage the longer it fires at a target.',
    baseCost: 185,
    color: 0xff2200,
    colorHex: '#ff2200',
    bulletColor: 0xff4422,
    levels: [
      {
        level: 1,
        damage: 14, // per 0.1s tick = 140 DPS base
        range: 190,
        attackInterval: 0.1, // continuous tick
        upgradeCost: 190,
        sellValue: 129,
        beamRampUp: 1.8 // ramps up to 1.8x damage
      },
      {
        level: 2,
        damage: 28, // 280 DPS base
        range: 220,
        attackInterval: 0.1,
        upgradeCost: 310,
        sellValue: 262,
        beamRampUp: 2.4
      },
      {
        level: 3,
        damage: 55, // 550 DPS base
        range: 250,
        attackInterval: 0.1,
        upgradeCost: 0,
        sellValue: 479,
        beamRampUp: 3.2
      }
    ]
  },
  flak: {
    id: 'flak',
    name: 'Orbital Flak',
    role: 'Anti-Swarm Burst',
    description: 'High-caliber cluster disrupter. Blasts a spread of shrapnel pellets, instantly vaporizing swarms and scouts.',
    baseCost: 150,
    color: 0x34d399,
    colorHex: '#34d399',
    bulletColor: 0x10b981,
    levels: [
      {
        level: 1,
        damage: 22,
        range: 150,
        attackInterval: 0.7,
        upgradeCost: 160,
        sellValue: 105,
        pelletCount: 5,
        projectileSpeed: 620
      },
      {
        level: 2,
        damage: 42,
        range: 175,
        attackInterval: 0.6,
        upgradeCost: 250,
        sellValue: 217,
        pelletCount: 7,
        projectileSpeed: 700
      },
      {
        level: 3,
        damage: 80,
        range: 200,
        attackInterval: 0.5,
        upgradeCost: 0,
        sellValue: 392,
        pelletCount: 9,
        projectileSpeed: 800
      }
    ]
  },
  vortex: {
    id: 'vortex',
    name: 'Singularity Well',
    role: 'Gravitational Distortion',
    description: 'Artificial micro-black-hole projector. Pulls hostiles backward along the conduit and crushes dense clusters.',
    baseCost: 240,
    color: 0x7c3aed,
    colorHex: '#7c3aed',
    bulletColor: 0xa855f7,
    levels: [
      {
        level: 1,
        damage: 45,
        range: 180,
        attackInterval: 1.4,
        upgradeCost: 260,
        sellValue: 168,
        pullForce: 45, // pulls back by 45 distance units
        splashRadius: 110,
        projectileSpeed: 420
      },
      {
        level: 2,
        damage: 90,
        range: 210,
        attackInterval: 1.2,
        upgradeCost: 380,
        sellValue: 350,
        pullForce: 75,
        splashRadius: 135,
        projectileSpeed: 480
      },
      {
        level: 3,
        damage: 180,
        range: 240,
        attackInterval: 1.0,
        upgradeCost: 0,
        sellValue: 616,
        pullForce: 120,
        splashRadius: 160,
        projectileSpeed: 550
      }
    ]
  }
};
