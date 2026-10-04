import { GlobalSoundFX } from '../../audio/SoundFX';

export class EconomySystem {
  public coreHealth: number = 100;
  public maxCoreHealth: number = 100;
  public credits: number = 750;
  public score: number = 0;
  public totalKills: number = 0;
  public isGameOver: boolean = false;
  public isVictory: boolean = false;

  public onGameOver?: () => void;
  public onStateChange?: () => void;

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.coreHealth = 100;
    this.maxCoreHealth = 100;
    this.credits = 750;
    this.score = 0;
    this.totalKills = 0;
    this.isGameOver = false;
    this.isVictory = false;
    this.notifyChange();
  }

  public addCredits(amount: number): void {
    this.credits += amount;
    this.notifyChange();
  }

  public spendCredits(amount: number): boolean {
    if (this.credits >= amount) {
      this.credits -= amount;
      this.notifyChange();
      return true;
    }
    return false;
  }

  public addScore(amount: number): void {
    this.score += amount;
    this.notifyChange();
  }

  public takeCoreDamage(damage: number): void {
    if (this.isGameOver || this.isVictory) return;

    this.coreHealth = Math.max(0, this.coreHealth - damage);
    this.notifyChange();

    if (this.coreHealth <= 0) {
      this.isGameOver = true;
      GlobalSoundFX.playGameOver();
      if (this.onGameOver) {
        this.onGameOver();
      }
    }
  }

  public recordKills(count: number): void {
    this.totalKills += count;
  }

  private notifyChange(): void {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }
}
