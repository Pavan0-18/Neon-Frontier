import { EnemyType, ENEMY_DEFINITIONS } from '../../data/enemies';
import { TowerType, TargetingStrategy, TOWER_DEFINITIONS, TowerLevelStats } from '../../data/towers';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { GlobalPathSystem, Point } from '../systems/PathSystem';

export interface TowerEntity {
  id: number;
  type: TowerType;
  level: number;
  x: number;
  y: number;
  range: number;
  damage: number;
  attackInterval: number;
  cooldownTimer: number;
  targetingStrategy: TargetingStrategy;
  totalInvested: number;
  stunTimer: number;
  kills: number;
  totalDamageDealt: number;
  currentStats: TowerLevelStats;
  targetEnemyIdx: number;
}

export interface FloatingText {
  active: boolean;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  size: number;
  life: number;
  maxLife: number;
}

export class EntityManager {
  // --- ENEMY DATA (Data-Oriented TypedArrays) ---
  public readonly maxEnemies: number = 12000;
  public enemyActive: Uint8Array;
  public enemyX: Float32Array;
  public enemyY: Float32Array;
  public enemyHealth: Float32Array;
  public enemyMaxHealth: Float32Array;
  public enemyShield: Float32Array;
  public enemyShieldMax: Float32Array;
  public enemySpeed: Float32Array;
  public enemyBaseSpeed: Float32Array;
  public enemyPathDist: Float32Array;
  public enemyType: Uint8Array; // index into ENEMY_TYPE_KEYS
  public enemySlowTimer: Float32Array;
  public enemySlowFactor: Float32Array;
  public enemyRegenRate: Float32Array;
  public enemyRadius: Float32Array;
  public enemyCoreDamage: Uint8Array;
  public enemyBounty: Uint16Array;
  public enemyScore: Uint16Array;
  public enemyIsBoss: Uint8Array;
  public enemyBossAbilityTimer: Float32Array;
  public enemyBossPhaseActive: Uint8Array;

  // Active enemy index list with swap-and-pop O(1) removal
  public activeEnemyIndices: Int32Array;
  public activeEnemyCount: number = 0;
  // Free slots stack
  private freeEnemySlots: Int32Array;
  private freeEnemyCount: number = 0;

  // Type keys mapping
  public readonly enemyTypeKeys: EnemyType[] = [
    'scout', 'drone', 'tank', 'shield', 'regenerator', 'swarm',
    'boss_behemoth', 'boss_warp_lord', 'boss_mothership'
  ];

  // --- PROJECTILES (Data-Oriented TypedArrays) ---
  public readonly maxProjectiles: number = 4000;
  public projActive: Uint8Array;
  public projX: Float32Array;
  public projY: Float32Array;
  public projVx: Float32Array;
  public projVy: Float32Array;
  public projTargetIdx: Int32Array;
  public projDamage: Float32Array;
  public projSpeed: Float32Array;
  public projType: Uint8Array; // 0=pulse, 1=tesla, 2=mortar, 3=cryo, 4=railgun
  public projSplashRadius: Float32Array;
  public projChainCount: Uint8Array;
  public projChainRange: Float32Array;
  public projChainFalloff: Float32Array;
  public projSlowFactor: Float32Array;
  public projSlowDuration: Float32Array;
  public projLifetime: Float32Array;

  public activeProjIndices: Int32Array;
  public activeProjCount: number = 0;
  private freeProjSlots: Int32Array;
  private freeProjCount: number = 0;

  // --- TOWERS ---
  public towers: TowerEntity[] = [];
  private nextTowerId: number = 1;

  // --- PARTICLES & FLOATING TEXT POOLS ---
  public readonly maxParticles: number = 2500;
  public particles: Particle[] = [];
  public activeParticleCount: number = 0;

  public readonly maxFloatingTexts: number = 150;
  public floatingTexts: FloatingText[] = [];

  // Temporary point for path lookups
  private tempPoint: Point = { x: 0, y: 0 };

  // Optimization toggles
  public useObjectPooling: boolean = true;

  constructor() {
    // Initialize Enemy TypedArrays
    const eMax = this.maxEnemies;
    this.enemyActive = new Uint8Array(eMax);
    this.enemyX = new Float32Array(eMax);
    this.enemyY = new Float32Array(eMax);
    this.enemyHealth = new Float32Array(eMax);
    this.enemyMaxHealth = new Float32Array(eMax);
    this.enemyShield = new Float32Array(eMax);
    this.enemyShieldMax = new Float32Array(eMax);
    this.enemySpeed = new Float32Array(eMax);
    this.enemyBaseSpeed = new Float32Array(eMax);
    this.enemyPathDist = new Float32Array(eMax);
    this.enemyType = new Uint8Array(eMax);
    this.enemySlowTimer = new Float32Array(eMax);
    this.enemySlowFactor = new Float32Array(eMax);
    this.enemyRegenRate = new Float32Array(eMax);
    this.enemyRadius = new Float32Array(eMax);
    this.enemyCoreDamage = new Uint8Array(eMax);
    this.enemyBounty = new Uint16Array(eMax);
    this.enemyScore = new Uint16Array(eMax);
    this.enemyIsBoss = new Uint8Array(eMax);
    this.enemyBossAbilityTimer = new Float32Array(eMax);
    this.enemyBossPhaseActive = new Uint8Array(eMax);

    this.activeEnemyIndices = new Int32Array(eMax);
    this.freeEnemySlots = new Int32Array(eMax);
    for (let i = 0; i < eMax; i++) {
      this.freeEnemySlots[i] = eMax - 1 - i;
    }
    this.freeEnemyCount = eMax;

    // Initialize Projectile TypedArrays
    const pMax = this.maxProjectiles;
    this.projActive = new Uint8Array(pMax);
    this.projX = new Float32Array(pMax);
    this.projY = new Float32Array(pMax);
    this.projVx = new Float32Array(pMax);
    this.projVy = new Float32Array(pMax);
    this.projTargetIdx = new Int32Array(pMax);
    this.projDamage = new Float32Array(pMax);
    this.projSpeed = new Float32Array(pMax);
    this.projType = new Uint8Array(pMax);
    this.projSplashRadius = new Float32Array(pMax);
    this.projChainCount = new Uint8Array(pMax);
    this.projChainRange = new Float32Array(pMax);
    this.projChainFalloff = new Float32Array(pMax);
    this.projSlowFactor = new Float32Array(pMax);
    this.projSlowDuration = new Float32Array(pMax);
    this.projLifetime = new Float32Array(pMax);

    this.activeProjIndices = new Int32Array(pMax);
    this.freeProjSlots = new Int32Array(pMax);
    for (let i = 0; i < pMax; i++) {
      this.freeProjSlots[i] = pMax - 1 - i;
    }
    this.freeProjCount = pMax;

    // Initialize Particle Pool
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        color: 0xffffff,
        size: 2,
        life: 0,
        maxLife: 1
      });
    }

    // Initialize Floating Text Pool
    for (let i = 0; i < this.maxFloatingTexts; i++) {
      this.floatingTexts.push({
        active: false,
        x: 0,
        y: 0,
        text: '',
        color: '#fff',
        life: 0,
        maxLife: 1
      });
    }
  }

  // --- ENEMY SPAWNING & LIFECYCLE ---

  public spawnEnemy(
    type: EnemyType,
    hpMultiplier: number = 1,
    speedMultiplier: number = 1,
    customStartDist: number = 0
  ): number {
    if (this.freeEnemyCount === 0) {
      return -1; // Capacity reached
    }

    const slot = this.freeEnemySlots[--this.freeEnemyCount];
    const def = ENEMY_DEFINITIONS[type];
    const typeIdx = this.enemyTypeKeys.indexOf(type);

    this.enemyActive[slot] = 1;
    this.enemyPathDist[slot] = customStartDist;
    GlobalPathSystem.getPositionAtDistance(customStartDist, this.tempPoint);
    this.enemyX[slot] = this.tempPoint.x;
    this.enemyY[slot] = this.tempPoint.y;

    const hp = def.baseHealth * hpMultiplier;
    this.enemyHealth[slot] = hp;
    this.enemyMaxHealth[slot] = hp;
    this.enemyShieldMax[slot] = (def.shieldMax || 0) * hpMultiplier;
    this.enemyShield[slot] = this.enemyShieldMax[slot];
    this.enemyBaseSpeed[slot] = def.baseSpeed * speedMultiplier;
    this.enemySpeed[slot] = this.enemyBaseSpeed[slot];
    this.enemyType[slot] = typeIdx >= 0 ? typeIdx : 0;
    this.enemySlowTimer[slot] = 0;
    this.enemySlowFactor[slot] = 1;
    this.enemyRegenRate[slot] = def.regenRate || 0;
    this.enemyRadius[slot] = def.radius;
    this.enemyCoreDamage[slot] = def.coreDamage;
    this.enemyBounty[slot] = def.bounty;
    this.enemyScore[slot] = def.scoreValue;
    this.enemyIsBoss[slot] = def.isBoss ? 1 : 0;
    this.enemyBossAbilityTimer[slot] = def.bossAbilityInterval || 0;
    this.enemyBossPhaseActive[slot] = 0;

    // Add to active indices list
    this.activeEnemyIndices[this.activeEnemyCount++] = slot;

    return slot;
  }

  public killEnemy(slot: number): void {
    if (this.enemyActive[slot] === 0) return;

    this.enemyActive[slot] = 0;
    this.freeEnemySlots[this.freeEnemyCount++] = slot;

    // Swap and pop from activeEnemyIndices
    for (let i = 0; i < this.activeEnemyCount; i++) {
      if (this.activeEnemyIndices[i] === slot) {
        this.activeEnemyIndices[i] = this.activeEnemyIndices[this.activeEnemyCount - 1];
        this.activeEnemyCount--;
        break;
      }
    }
  }

  // --- PROJECTILES ---

  public spawnProjectile(
    typeIdx: number,
    x: number,
    y: number,
    targetEnemyIdx: number,
    targetX: number,
    targetY: number,
    damage: number,
    speed: number,
    splashRadius: number = 0,
    chainCount: number = 0,
    chainRange: number = 0,
    chainFalloff: number = 0,
    slowFactor: number = 1,
    slowDuration: number = 0
  ): number {
    if (this.freeProjCount === 0) return -1;

    const slot = this.freeProjSlots[--this.freeProjCount];
    this.projActive[slot] = 1;
    this.projX[slot] = x;
    this.projY[slot] = y;

    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.hypot(dx, dy) || 1;

    this.projVx[slot] = (dx / dist) * speed;
    this.projVy[slot] = (dy / dist) * speed;
    this.projTargetIdx[slot] = targetEnemyIdx;
    this.projDamage[slot] = damage;
    this.projSpeed[slot] = speed;
    this.projType[slot] = typeIdx;
    this.projSplashRadius[slot] = splashRadius;
    this.projChainCount[slot] = chainCount;
    this.projChainRange[slot] = chainRange;
    this.projChainFalloff[slot] = chainFalloff;
    this.projSlowFactor[slot] = slowFactor;
    this.projSlowDuration[slot] = slowDuration;
    this.projLifetime[slot] = 0;

    this.activeProjIndices[this.activeProjCount++] = slot;
    return slot;
  }

  public killProjectile(slot: number): void {
    if (this.projActive[slot] === 0) return;

    this.projActive[slot] = 0;
    this.freeProjSlots[this.freeProjCount++] = slot;

    for (let i = 0; i < this.activeProjCount; i++) {
      if (this.activeProjIndices[i] === slot) {
        this.activeProjIndices[i] = this.activeProjIndices[this.activeProjCount - 1];
        this.activeProjCount--;
        break;
      }
    }
  }

  // --- TOWERS ---

  public createTower(type: TowerType, x: number, y: number): TowerEntity {
    const def = TOWER_DEFINITIONS[type];
    const stats = def.levels[0];

    const tower: TowerEntity = {
      id: this.nextTowerId++,
      type,
      level: 1,
      x,
      y,
      range: stats.range,
      damage: stats.damage,
      attackInterval: stats.attackInterval,
      cooldownTimer: 0,
      targetingStrategy: 'first',
      totalInvested: def.baseCost,
      stunTimer: 0,
      kills: 0,
      totalDamageDealt: 0,
      currentStats: stats,
      targetEnemyIdx: -1
    };

    this.towers.push(tower);
    return tower;
  }

  public upgradeTower(tower: TowerEntity): boolean {
    const def = TOWER_DEFINITIONS[tower.type];
    if (tower.level >= def.levels.length) {
      return false; // Already max level
    }

    const nextStats = def.levels[tower.level]; // index = current level
    tower.level++;
    tower.totalInvested += tower.currentStats.upgradeCost;
    tower.currentStats = nextStats;
    tower.range = nextStats.range;
    tower.damage = nextStats.damage;
    tower.attackInterval = nextStats.attackInterval;
    return true;
  }

  public removeTower(id: number): TowerEntity | null {
    const idx = this.towers.findIndex(t => t.id === id);
    if (idx !== -1) {
      const removed = this.towers.splice(idx, 1)[0];
      return removed;
    }
    return null;
  }

  // --- PARTICLES ---

  public spawnParticles(x: number, y: number, color: number, count: number = 8, speedScale: number = 1): void {
    let spawned = 0;
    for (let i = 0; i < this.maxParticles && spawned < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const spd = (40 + Math.random() * 120) * speedScale;
        p.vx = Math.cos(angle) * spd;
        p.vy = Math.sin(angle) * spd;
        p.color = color;
        p.size = 2 + Math.random() * 2.5;
        p.life = 0;
        p.maxLife = 0.25 + Math.random() * 0.35;
        spawned++;
      }
    }
  }

  public spawnFloatingText(x: number, y: number, text: string, color: string = '#00f3ff'): void {
    for (let i = 0; i < this.maxFloatingTexts; i++) {
      const ft = this.floatingTexts[i];
      if (!ft.active) {
        ft.active = true;
        ft.x = x;
        ft.y = y;
        ft.text = text;
        ft.color = color;
        ft.life = 0;
        ft.maxLife = 0.8;
        break;
      }
    }
  }

  // --- RESET ARENA / CLEAR ALL ---

  public clearAll(): void {
    // Clear enemies
    this.enemyActive.fill(0);
    this.activeEnemyCount = 0;
    this.freeEnemyCount = this.maxEnemies;
    for (let i = 0; i < this.maxEnemies; i++) {
      this.freeEnemySlots[i] = this.maxEnemies - 1 - i;
    }

    // Clear projectiles
    this.projActive.fill(0);
    this.activeProjCount = 0;
    this.freeProjCount = this.maxProjectiles;
    for (let i = 0; i < this.maxProjectiles; i++) {
      this.freeProjSlots[i] = this.maxProjectiles - 1 - i;
    }

    // Clear towers
    this.towers.length = 0;

    // Clear particles & text
    for (const p of this.particles) p.active = false;
    for (const ft of this.floatingTexts) ft.active = false;
  }
}
