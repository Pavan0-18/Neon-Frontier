import { TowerType } from './towers';
import { CHALLENGES, getChallengeById } from './challenges';

export interface CompletedChallengeRecord {
  stars: number;
  highScore: number;
  completedAt: number;
  wavesCleared: number;
}

export interface PlayerProfile {
  coreLevel: number;
  coreXp: number;
  nextLevelXp: number;
  totalScore: number;
  totalKills: number;
  totalCreditsEarned: number;
  completedChallenges: Record<string, CompletedChallengeRecord>;
  unlockedTowers: TowerType[];
  selectedChallengeId: string;
}

const STORAGE_KEY = 'neon_frontier_player_profile_v1';

export const CORE_LEVEL_UNLOCKS: Record<number, { tower: TowerType; title: string; desc: string }> = {
  1: { tower: 'pulse', title: 'PULSE CANNON', desc: 'Fast-firing plasma blaster' },
  2: { tower: 'tesla', title: 'TESLA COIL', desc: 'Chain lightning that zaps multiple enemies' },
  4: { tower: 'mortar', title: 'MORTAR CANNON', desc: 'Long-range cannon with area explosion damage' },
  6: { tower: 'cryo', title: 'CRYO FREEZE EMITTER', desc: 'Freezes and slows down enemies' },
  8: { tower: 'railgun', title: 'KINETIC RAILGUN', desc: 'High-speed sniper shot that pierces heavy armor' },
  10: { tower: 'laser', title: 'PHOTON LASER', desc: 'Continuous laser beam that melts targets' },
  14: { tower: 'flak', title: 'FLAK CANNON', desc: 'Shotgun blast effective against swarms' },
  18: { tower: 'vortex', title: 'VORTEX BLACK HOLE', desc: 'Black hole that pulls enemies backward' }
};

export function getXpForLevel(level: number): number {
  return Math.floor(150 * Math.pow(level, 1.45));
}

export class ProgressionManager {
  private static profile: PlayerProfile | null = null;

  public static getProfile(): PlayerProfile {
    if (!this.profile) {
      this.profile = this.load();
    }
    return this.profile;
  }

  public static load(): PlayerProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
        const coreLevel = parsed.coreLevel || 1;
        const coreXp = parsed.coreXp || 0;
        const nextLevelXp = getXpForLevel(coreLevel);

        const profile: PlayerProfile = {
          coreLevel,
          coreXp,
          nextLevelXp,
          totalScore: parsed.totalScore || 0,
          totalKills: parsed.totalKills || 0,
          totalCreditsEarned: parsed.totalCreditsEarned || 0,
          completedChallenges: parsed.completedChallenges || {},
          unlockedTowers: parsed.unlockedTowers || ['pulse', 'tesla'],
          selectedChallengeId: parsed.selectedChallengeId || 'first_contact'
        };

        // Ensure level-based unlocks are synced
        this.syncUnlockedTowers(profile);
        return profile;
      }
    } catch {
      // Ignore parse errors and fallback to fresh profile
    }

    const defaultProfile: PlayerProfile = {
      coreLevel: 1,
      coreXp: 0,
      nextLevelXp: getXpForLevel(1),
      totalScore: 0,
      totalKills: 0,
      totalCreditsEarned: 0,
      completedChallenges: {},
      unlockedTowers: ['pulse', 'tesla'],
      selectedChallengeId: 'first_contact'
    };

    return defaultProfile;
  }

  public static save(): void {
    if (!this.profile) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch {
      // Storage quota exceeded or disabled
    }
  }

  private static syncUnlockedTowers(profile: PlayerProfile): void {
    const list = new Set(profile.unlockedTowers);
    // Base starter towers
    list.add('pulse');
    list.add('tesla');

    // Add towers unlocked by core level
    for (let lvl = 1; lvl <= profile.coreLevel; lvl++) {
      if (CORE_LEVEL_UNLOCKS[lvl]) {
        list.add(CORE_LEVEL_UNLOCKS[lvl].tower);
      }
    }

    // Add towers unlocked by completed challenges
    for (const c of CHALLENGES) {
      if (profile.completedChallenges[c.id] && c.unlockedTower) {
        list.add(c.unlockedTower);
      }
    }

    profile.unlockedTowers = Array.from(list);
  }

  public static selectChallenge(challengeId: string): void {
    const profile = this.getProfile();
    profile.selectedChallengeId = challengeId;
    this.save();
  }

  public static isChallengeUnlocked(challengeId: string): boolean {
    const c = getChallengeById(challengeId);
    if (!c.unlockReqId) return true; // First challenge is always unlocked
    const profile = this.getProfile();
    return !!profile.completedChallenges[c.unlockReqId];
  }

  public static isTowerUnlocked(type: TowerType): boolean {
    const profile = this.getProfile();
    return profile.unlockedTowers.includes(type);
  }

  public static addXp(amount: number): { leveledUp: boolean; newLevel: number; unlockedTowers: TowerType[] } {
    const profile = this.getProfile();
    profile.coreXp += amount;

    let leveledUp = false;
    const newlyUnlocked: TowerType[] = [];

    while (profile.coreXp >= profile.nextLevelXp) {
      profile.coreXp -= profile.nextLevelXp;
      profile.coreLevel++;
      profile.nextLevelXp = getXpForLevel(profile.coreLevel);
      leveledUp = true;

      if (CORE_LEVEL_UNLOCKS[profile.coreLevel]) {
        const t = CORE_LEVEL_UNLOCKS[profile.coreLevel].tower;
        if (!profile.unlockedTowers.includes(t)) {
          profile.unlockedTowers.push(t);
          newlyUnlocked.push(t);
        }
      }
    }

    this.syncUnlockedTowers(profile);
    this.save();

    return {
      leveledUp,
      newLevel: profile.coreLevel,
      unlockedTowers: newlyUnlocked
    };
  }

  public static recordChallengeComplete(
    challengeId: string,
    score: number,
    kills: number,
    credits: number,
    wavesCleared: number
  ): { xpGained: number; creditsBonus: number; unlockedTowers: TowerType[]; isFirstClear: boolean } {
    const profile = this.getProfile();
    const c = getChallengeById(challengeId);
    const isFirstClear = !profile.completedChallenges[challengeId];

    // Compute star rating
    let stars = 3;
    if (wavesCleared >= c.totalWaves) {
      stars = 5;
    } else if (wavesCleared >= Math.floor(c.totalWaves * 0.75)) {
      stars = 4;
    }

    const prevRecord = profile.completedChallenges[challengeId];
    profile.completedChallenges[challengeId] = {
      stars: Math.max(stars, prevRecord?.stars || 0),
      highScore: Math.max(score, prevRecord?.highScore || 0),
      completedAt: Date.now(),
      wavesCleared: Math.max(wavesCleared, prevRecord?.wavesCleared || 0)
    };

    profile.totalScore += score;
    profile.totalKills += kills;
    profile.totalCreditsEarned += credits;

    // First clear bonus
    const xpGained = c.rewardXp + Math.floor(score * 0.05);
    const creditsBonus = c.rewardCredits;

    const xpResult = this.addXp(xpGained);

    // If challenge rewards a tower schematic directly
    if (c.unlockedTower && !profile.unlockedTowers.includes(c.unlockedTower)) {
      profile.unlockedTowers.push(c.unlockedTower);
      if (!xpResult.unlockedTowers.includes(c.unlockedTower)) {
        xpResult.unlockedTowers.push(c.unlockedTower);
      }
    }

    this.save();

    return {
      xpGained,
      creditsBonus,
      unlockedTowers: xpResult.unlockedTowers,
      isFirstClear
    };
  }
}
