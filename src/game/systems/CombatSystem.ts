import { EntityManager, TowerEntity } from '../entities/EntityManager';
import { SpatialGrid } from '../spatial/SpatialGrid';
import { GlobalSoundFX } from '../../audio/SoundFX';
import { MovementSystem, CombatStatsEvent } from './MovementSystem';

export class CombatSystem {
  public useSpatialGrid: boolean = true;
  private readonly entityMgr: EntityManager;
  private readonly spatialGrid: SpatialGrid;
  private readonly movementSystem: MovementSystem;

  // Reusable candidate buffer
  private candidateIndices: Int32Array = new Int32Array(4096);
  private candidateCount: number = 0;

  constructor(entityMgr: EntityManager, spatialGrid: SpatialGrid, movementSystem: MovementSystem) {
    this.entityMgr = entityMgr;
    this.spatialGrid = spatialGrid;
    this.movementSystem = movementSystem;
  }

  public update(dt: number, statsOut: CombatStatsEvent): void {
    if (this.entityMgr.overchargeTimer > 0) {
      this.entityMgr.overchargeTimer -= dt;
    }

    const isOvercharged = this.entityMgr.overchargeTimer > 0;
    const towers = this.entityMgr.towers;
    const towerCount = towers.length;

    for (let i = 0; i < towerCount; i++) {
      const tower = towers[i];

      // Handle EMP / Boss stun
      if (tower.stunTimer > 0) {
        tower.stunTimer -= dt;
        continue;
      }

      const activeInterval = isOvercharged ? tower.attackInterval * 0.6 : tower.attackInterval;

      // Special continuous thermal beam logic for Photon Laser
      if (tower.type === 'laser') {
        let target = tower.laserTargetIdx;
        let valid = false;
        if (target >= 0 && this.entityMgr.enemyActive[target] === 1) {
          const dx = this.entityMgr.enemyX[target] - tower.x;
          const dy = this.entityMgr.enemyY[target] - tower.y;
          if (dx * dx + dy * dy <= tower.range * tower.range) {
            valid = true;
          }
        }
        if (!valid) {
          target = this.findTarget(tower);
          tower.laserTargetIdx = target;
          tower.laserLockDuration = 0;
        }

        tower.targetEnemyIdx = target;

        if (target !== -1) {
          tower.laserLockDuration += dt;
          if (tower.cooldownTimer > 0) {
            tower.cooldownTimer -= dt;
          }
          if (tower.cooldownTimer <= 0) {
            const ramp = Math.min(tower.currentStats.beamRampUp || 2.5, 1 + tower.laserLockDuration * 0.4);
            const dmg = (tower.damage * (isOvercharged ? 1.35 : 1)) * ramp;
            this.movementSystem.damageSingleEnemy(target, dmg, statsOut);
            if (this.entityMgr.enemyActive[target] === 0 || this.entityMgr.enemyHealth[target] <= 0) {
              tower.laserTargetIdx = -1;
              tower.laserLockDuration = 0;
            }
            tower.cooldownTimer = activeInterval;
          }
        } else {
          tower.laserLockDuration = 0;
        }
        continue;
      }

      // Decrement attack cooldown
      if (tower.cooldownTimer > 0) {
        tower.cooldownTimer -= dt;
      }

      if (tower.cooldownTimer <= 0) {
        // Find best target according to strategy
        const targetIdx = this.findTarget(tower);
        tower.targetEnemyIdx = targetIdx;

        if (targetIdx !== -1) {
          this.fireTower(tower, targetIdx);
          tower.cooldownTimer = activeInterval;
        }
      }
    }
  }

  /**
   * Finds target according to tower's targeting strategy.
   * Can use SpatialGrid (O(1) localized cells) or Brute Force (O(N) all enemies).
   */
  public findTarget(tower: TowerEntity): number {
    const range = tower.range;
    const tx = tower.x;
    const ty = tower.y;
    const rangeSq = range * range;

    this.candidateCount = 0;

    if (this.useSpatialGrid) {
      // Query spatial grid
      const query = this.spatialGrid.queryRadius(tx, ty, range);
      const buf = query.buffer;
      const count = query.count;

      for (let i = 0; i < count; i++) {
        const slot = buf[i];
        if (this.entityMgr.enemyActive[slot] === 1) {
          const dx = this.entityMgr.enemyX[slot] - tx;
          const dy = this.entityMgr.enemyY[slot] - ty;
          if (dx * dx + dy * dy <= rangeSq) {
            if (this.candidateCount < this.candidateIndices.length) {
              this.candidateIndices[this.candidateCount++] = slot;
            }
          }
        }
      }
    } else {
      // Brute-force baseline: iterate ALL active enemies
      const activeCount = this.entityMgr.activeEnemyCount;
      const activeIndices = this.entityMgr.activeEnemyIndices;

      for (let i = 0; i < activeCount; i++) {
        const slot = activeIndices[i];
        const dx = this.entityMgr.enemyX[slot] - tx;
        const dy = this.entityMgr.enemyY[slot] - ty;
        if (dx * dx + dy * dy <= rangeSq) {
          if (this.candidateCount < this.candidateIndices.length) {
            this.candidateIndices[this.candidateCount++] = slot;
          }
        }
      }
    }

    if (this.candidateCount === 0) {
      return -1;
    }

    // Evaluate candidates by strategy
    let bestSlot = this.candidateIndices[0];
    const strategy = tower.targetingStrategy;

    if (strategy === 'first') {
      let maxDist = this.entityMgr.enemyPathDist[bestSlot];
      for (let i = 1; i < this.candidateCount; i++) {
        const slot = this.candidateIndices[i];
        const dist = this.entityMgr.enemyPathDist[slot];
        if (dist > maxDist) {
          maxDist = dist;
          bestSlot = slot;
        }
      }
    } else if (strategy === 'last') {
      let minDist = this.entityMgr.enemyPathDist[bestSlot];
      for (let i = 1; i < this.candidateCount; i++) {
        const slot = this.candidateIndices[i];
        const dist = this.entityMgr.enemyPathDist[slot];
        if (dist < minDist) {
          minDist = dist;
          bestSlot = slot;
        }
      }
    } else if (strategy === 'closest') {
      let minDistSq = Math.hypot(this.entityMgr.enemyX[bestSlot] - tx, this.entityMgr.enemyY[bestSlot] - ty);
      for (let i = 1; i < this.candidateCount; i++) {
        const slot = this.candidateIndices[i];
        const dSq = Math.hypot(this.entityMgr.enemyX[slot] - tx, this.entityMgr.enemyY[slot] - ty);
        if (dSq < minDistSq) {
          minDistSq = dSq;
          bestSlot = slot;
        }
      }
    } else if (strategy === 'strongest') {
      let maxHp = this.entityMgr.enemyHealth[bestSlot];
      for (let i = 1; i < this.candidateCount; i++) {
        const slot = this.candidateIndices[i];
        const hp = this.entityMgr.enemyHealth[slot];
        if (hp > maxHp) {
          maxHp = hp;
          bestSlot = slot;
        }
      }
    } else if (strategy === 'weakest') {
      let minHp = this.entityMgr.enemyHealth[bestSlot];
      for (let i = 1; i < this.candidateCount; i++) {
        const slot = this.candidateIndices[i];
        const hp = this.entityMgr.enemyHealth[slot];
        if (hp < minHp) {
          minHp = hp;
          bestSlot = slot;
        }
      }
    }

    return bestSlot;
  }

  private fireTower(tower: TowerEntity, targetIdx: number): void {
    const targetX = this.entityMgr.enemyX[targetIdx];
    const targetY = this.entityMgr.enemyY[targetIdx];
    const stats = tower.currentStats;

    switch (tower.type) {
      case 'pulse': {
        this.entityMgr.spawnProjectile(
          0, // pulse
          tower.x,
          tower.y,
          targetIdx,
          targetX,
          targetY,
          tower.damage,
          stats.projectileSpeed || 650
        );
        GlobalSoundFX.playPulseShoot();
        break;
      }
      case 'tesla': {
        this.entityMgr.spawnProjectile(
          1, // tesla
          tower.x,
          tower.y,
          targetIdx,
          targetX,
          targetY,
          tower.damage,
          stats.projectileSpeed || 1100,
          0,
          stats.chainCount || 3,
          stats.chainRange || 130,
          stats.chainFalloff || 0.75
        );
        GlobalSoundFX.playTeslaZap();
        break;
      }
      case 'mortar': {
        this.entityMgr.spawnProjectile(
          2, // mortar
          tower.x,
          tower.y,
          targetIdx,
          targetX,
          targetY,
          tower.damage,
          stats.projectileSpeed || 400,
          stats.splashRadius || 100
        );
        GlobalSoundFX.playMortarLaunch();
        break;
      }
      case 'cryo': {
        this.entityMgr.spawnProjectile(
          3, // cryo
          tower.x,
          tower.y,
          targetIdx,
          targetX,
          targetY,
          tower.damage,
          stats.projectileSpeed || 600,
          0,
          0,
          0,
          0,
          stats.slowFactor || 0.5,
          stats.slowDuration || 3.0
        );
        GlobalSoundFX.playCryoBeam();
        break;
      }
      case 'railgun': {
        this.entityMgr.spawnProjectile(
          4, // railgun
          tower.x,
          tower.y,
          targetIdx,
          targetX,
          targetY,
          tower.damage,
          stats.projectileSpeed || 2200
        );
        GlobalSoundFX.playRailgun();
        break;
      }
      case 'flak': {
        // Multi-pellet spread
        const pellets = stats.pelletCount || 5;
        const baseAngle = Math.atan2(targetY - tower.y, targetX - tower.x);
        const spreadTotal = 0.35; // radians spread
        const spd = stats.projectileSpeed || 650;

        for (let p = 0; p < pellets; p++) {
          const offsetAngle = baseAngle - spreadTotal / 2 + (p / (pellets - 1)) * spreadTotal;
          const tx = tower.x + Math.cos(offsetAngle) * 200;
          const ty = tower.y + Math.sin(offsetAngle) * 200;

          this.entityMgr.spawnProjectile(
            5, // flak
            tower.x,
            tower.y,
            targetIdx,
            tx,
            ty,
            tower.damage,
            spd
          );
        }
        GlobalSoundFX.playPulseShoot();
        break;
      }
      case 'vortex': {
        this.entityMgr.spawnProjectile(
          6, // vortex
          tower.x,
          tower.y,
          targetIdx,
          targetX,
          targetY,
          tower.damage,
          stats.projectileSpeed || 420,
          stats.splashRadius || 110,
          0,
          0,
          0,
          0.3,
          2.0,
          stats.pullForce || 50
        );
        GlobalSoundFX.playMortarLaunch();
        break;
      }
    }

    // Muzzle effect
    this.entityMgr.spawnParticles(tower.x, tower.y, tower.currentStats.level > 1 ? 0x00f3ff : 0xffffff, 4, 0.6);
  }
}
