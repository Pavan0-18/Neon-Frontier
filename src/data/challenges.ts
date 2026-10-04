import { TowerType } from './towers';

export interface ChallengeModifier {
  enemyCountMult?: number;
  enemySpeedMult?: number;
  enemyHpMult?: number;
  towerRateMult?: number;
  towerDamageMult?: number;
  startCredits?: number;
  bountyMult?: number;
  coreHealth?: number;
  noCoreRegen?: boolean;
  singularityRifts?: boolean;
}

export interface ModifierBadge {
  label: string;
  value: string;
  isPositive: boolean;
}

export interface ChallengeDef {
  id: string;
  levelNumber: number;
  title: string;
  tagline: string;
  stars: number;
  totalWaves: number;
  description: string;
  storyQuote: string;
  modifiers: ChallengeModifier;
  modifierBadges: ModifierBadge[];
  rewardCredits: number;
  rewardXp: number;
  unlockReqId?: string;
  unlockedTower?: TowerType;
  unlockedTowerName?: string;
  badgeColor?: string;
}

export const CHALLENGES: ChallengeDef[] = [
  {
    id: 'first_contact',
    levelNumber: 1,
    title: 'Level 1: First Contact',
    tagline: 'Alien Recon Fleet',
    stars: 1,
    totalWaves: 10,
    description: 'Build your initial defense towers anywhere on the grid and stop the incoming alien scout fleet.',
    storyQuote: '"Sensors detect approaching alien ships. Place defense towers to protect the base!"',
    modifiers: {
      startCredits: 850,
      coreHealth: 100
    },
    modifierBadges: [
      { label: 'STARTING MONEY', value: '$850', isPositive: true },
      { label: 'TOTAL WAVES', value: '10 Waves', isPositive: true }
    ],
    rewardCredits: 500,
    rewardXp: 350,
    badgeColor: '#00f3ff'
  },
  {
    id: 'swarm_protocol',
    levelNumber: 2,
    title: 'Level 2: Swarm Invasion',
    tagline: 'High-Speed Enemy Swarm',
    stars: 2,
    totalWaves: 15,
    description: 'A massive swarm of fast, lightweight enemies is approaching! Rapid-fire towers are recommended.',
    storyQuote: '"Radar is flooded with dozens of small fast drones. Fast-shooting towers needed!"',
    modifiers: {
      enemyCountMult: 1.8,
      enemyHpMult: 0.75,
      startCredits: 900,
      bountyMult: 1.2
    },
    modifierBadges: [
      { label: 'ENEMY COUNT', value: '+80% (More Enemies)', isPositive: false },
      { label: 'ENEMY HEALTH', value: '-25% (Easier to Kill)', isPositive: true },
      { label: 'KILL REWARD', value: '+20% Extra Money', isPositive: true }
    ],
    rewardCredits: 900,
    rewardXp: 700,
    unlockReqId: 'first_contact',
    unlockedTower: 'mortar',
    unlockedTowerName: 'Mortar Cannon',
    badgeColor: '#10b981'
  },
  {
    id: 'blackout',
    levelNumber: 3,
    title: 'Level 3: Fast Attack',
    tagline: 'Fast Enemies & High Rewards',
    stars: 3,
    totalWaves: 20,
    description: 'Enemies move 25% faster, but defeat them to earn 60% more money per kill!',
    storyQuote: '"Enemies are accelerating! Place freeze towers to slow them down."',
    modifiers: {
      enemySpeedMult: 1.25,
      startCredits: 1000,
      bountyMult: 1.6,
      noCoreRegen: true
    },
    modifierBadges: [
      { label: 'ENEMY SPEED', value: '+25% Faster', isPositive: false },
      { label: 'KILL REWARD', value: '+60% Extra Money', isPositive: true },
      { label: 'STARTING MONEY', value: '$1,000', isPositive: true }
    ],
    rewardCredits: 1400,
    rewardXp: 1200,
    unlockReqId: 'swarm_protocol',
    unlockedTower: 'cryo',
    unlockedTowerName: 'Cryo Freeze Emitter',
    badgeColor: '#f59e0b'
  },
  {
    id: 'overdrive_matrix',
    levelNumber: 4,
    title: 'Level 4: Overdrive Power',
    tagline: 'Rapid Fire Boost',
    stars: 3,
    totalWaves: 25,
    description: 'All your defense towers attack 45% faster! Enemies have extra health to balance.',
    storyQuote: '"Base generators are overloaded! Your towers fire at supercharged speed."',
    modifiers: {
      towerRateMult: 1.45,
      enemyHpMult: 1.3,
      startCredits: 1100
    },
    modifierBadges: [
      { label: 'TOWER ATTACK SPEED', value: '+45% Faster', isPositive: true },
      { label: 'ENEMY HEALTH', value: '+30% Tougher', isPositive: false }
    ],
    rewardCredits: 2000,
    rewardXp: 1800,
    unlockReqId: 'blackout',
    unlockedTower: 'railgun',
    unlockedTowerName: 'Kinetic Railgun',
    badgeColor: '#3b82f6'
  },
  {
    id: 'fragile_core',
    levelNumber: 5,
    title: 'Level 5: Hardcore Survival',
    tagline: 'Fragile Base (25 Health)',
    stars: 4,
    totalWaves: 30,
    description: 'Your base has only 25 health! Any enemy leak is dangerous, but tower damage is boosted by 20%.',
    storyQuote: '"Base armor is low! Keep your defense tight and stop every single enemy."',
    modifiers: {
      coreHealth: 25,
      startCredits: 1400,
      bountyMult: 1.8,
      towerDamageMult: 1.2
    },
    modifierBadges: [
      { label: 'BASE HEALTH', value: '25 HP (Fragile)', isPositive: false },
      { label: 'TOWER DAMAGE', value: '+20% Stronger', isPositive: true },
      { label: 'KILL REWARD', value: '+80% Extra Money', isPositive: true }
    ],
    rewardCredits: 3000,
    rewardXp: 2800,
    unlockReqId: 'overdrive_matrix',
    unlockedTower: 'laser',
    unlockedTowerName: 'Photon Laser',
    badgeColor: '#ef4444'
  },
  {
    id: 'singularity_crisis',
    levelNumber: 6,
    title: 'Level 6: Titan Boss Assault',
    tagline: 'Giant Boss Battles',
    stars: 4,
    totalWaves: 40,
    description:
      'Colossal boss enemies are entering the battlefield! Towers deal 30% more damage and kills pay double.',
    storyQuote: '"Colossal dreadnought bosses detected! Use railguns and vortex cannons."',
    modifiers: {
      startCredits: 1600,
      enemySpeedMult: 1.15,
      enemyHpMult: 1.35,
      towerDamageMult: 1.3,
      bountyMult: 2.0
    },
    modifierBadges: [
      { label: 'BOSS ENCOUNTERS', value: 'Frequent Titans', isPositive: false },
      { label: 'TOWER DAMAGE', value: '+30% Stronger', isPositive: true },
      { label: 'KILL REWARD', value: 'Double Money (2x)', isPositive: true }
    ],
    rewardCredits: 4500,
    rewardXp: 4200,
    unlockReqId: 'fragile_core',
    unlockedTower: 'vortex',
    unlockedTowerName: 'Vortex Black Hole',
    badgeColor: '#8b5cf6'
  },
  {
    id: 'last_orbit',
    levelNumber: 7,
    title: 'Level 7: Last Orbit',
    tagline: 'The Ultimate 50-Wave Challenge',
    stars: 5,
    totalWaves: 50,
    description: 'The ultimate 50-wave battle for the galaxy! Face every enemy type and prove your strategy.',
    storyQuote: '"This is the final battle for the colony. Hold the line for 50 waves!"',
    modifiers: {
      startCredits: 1000,
      coreHealth: 100
    },
    modifierBadges: [
      { label: 'TOTAL WAVES', value: '50 Waves', isPositive: true },
      { label: 'ALL ENEMY TYPES', value: 'All 10 Types', isPositive: false },
      { label: 'MAX RATING', value: '5 Stars ★★★★★', isPositive: true }
    ],
    rewardCredits: 10000,
    rewardXp: 10000,
    unlockReqId: 'singularity_crisis',
    badgeColor: '#f43f5e'
  }
];

export function getChallengeById(id: string): ChallengeDef {
  return CHALLENGES.find(c => c.id === id) || CHALLENGES[0];
}

export function getChallengeByLevel(level: number): ChallengeDef {
  return CHALLENGES.find(c => c.levelNumber === level) || CHALLENGES[0];
}
