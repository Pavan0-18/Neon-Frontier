import { EntityManager } from '../entities/EntityManager';
import { GlobalPathSystem, Point } from './PathSystem';
import { GlobalSoundFX } from '../../audio/SoundFX';

export interface CombatStatsEvent {
  damageDealt: number;
  creditsEarned: number;
  scoreEarned: number;
  coreDamageTaken: number;
  enemiesKilled: number;
}

export class MovementSystem {
  private readonly entityMgr: EntityManager;
  private tempPoint: Point = { x: 0, y: 0 };

  constructor(entityMgr: EntityManager) {
    this.entityMgr = entityMgr;
  }

  public update(dt: number, statsOut: CombatStatsEvent): void {
    this.updateEnemies(dt, statsOut);
    this.updateProjectiles(dt, statsOut);
    this.updateParticles(dt);
  }

  private updateEnemies(dt: number, statsOut: CombatStatsEvent): void {
    const totalLength = GlobalPathSystem.totalLength;
    const activeCount = this.entityMgr.activeEnemyCount;
    const activeIndices = this.entityMgr.activeEnemyIndices;

    for (let i = activeCount - 1; i >= 0; i--) {
      const slot = activeIndices[i];
      if (this.entityMgr.enemyActive[slot] === 0) continue;

      // Handle Slow Timer
      let speed = this.entityMgr.enemyBaseSpeed[slot];
      if (this.entityMgr.enemySlowTimer[slot] > 0) {
        this.entityMgr.enemySlowTimer[slot] -= dt;
        speed *= this.entityMgr.enemySlowFactor[slot];
      }

      // Handle Regeneration
      const regen = this.entityMgr.enemyRegenRate[slot];
      if (regen > 0) {
        const curHp = this.entityMgr.enemyHealth[slot];
        const maxHp = this.entityMgr.enemyMaxHealth[slot];
        if (curHp < maxHp) {
          this.entityMgr.enemyHealth[slot] = Math.min(maxHp, curHp + regen * dt);
        }
      }

      // Handle Boss Abilities
      if (this.entityMgr.enemyIsBoss[slot] === 1) {
        let timer = this.entityMgr.enemyBossAbilityTimer[slot];
        timer -= dt;
        if (timer <= 0) {
          const typeIdx = this.entityMgr.enemyType[slot];
          const type = this.entityMgr.enemyTypeKeys[typeIdx];

          if (type === 'boss_behemoth') {
            // EMP Stun all towers within 240px
            const bx = this.entityMgr.enemyX[slot];
            const by = this.entityMgr.enemyY[slot];
            for (const t of this.entityMgr.towers) {
              if (Math.hypot(t.x - bx, t.y - by) < 240) {
                t.stunTimer = 2.5;
              }
            }
            this.entityMgr.spawnParticles(bx, by, 0x00f3ff, 25, 2.0);
            this.entityMgr.spawnFloatingText(bx, by - 20, 'EMP BURST!', '#00f3ff');
            GlobalSoundFX.playBossKlaxon();
            timer = 8;
          } else if (type === 'boss_warp_lord') {
            // Phase Shift: 75% defense for 3s
            this.entityMgr.enemyBossPhaseActive[slot] = 1;
            this.entityMgr.spawnParticles(this.entityMgr.enemyX[slot], this.entityMgr.enemyY[slot], 0xb026ff, 20, 1.5);
            this.entityMgr.spawnFloatingText(this.entityMgr.enemyX[slot], this.entityMgr.enemyY[slot] - 20, 'PHASE SHIELD', '#b026ff');
            timer = 7;
          } else if (type === 'boss_mothership') {
            // Spawn swarm cluster around boss
            const bx = this.entityMgr.enemyX[slot];
            const by = this.entityMgr.enemyY[slot];
            const curDist = this.entityMgr.enemyPathDist[slot];
            for (let s = 0; s < 5; s++) {
              this.entityMgr.spawnEnemy('swarm', 1.0, 1.1, Math.max(0, curDist - 25 * (s + 1)));
            }
            this.entityMgr.spawnFloatingText(bx, by - 20, 'SWARM DEPLOYED', '#f43f5e');
            timer = 6;
          }
        }
        this.entityMgr.enemyBossAbilityTimer[slot] = timer;
      }

      // Advance along path
      const newDist = this.entityMgr.enemyPathDist[slot] + speed * dt;
      this.entityMgr.enemyPathDist[slot] = newDist;

      // Check if reached core
      if (newDist >= totalLength) {
        const coreDmg = this.entityMgr.enemyCoreDamage[slot];
        statsOut.coreDamageTaken += coreDmg;
        GlobalSoundFX.playCoreDamaged();
        this.entityMgr.spawnParticles(
          this.entityMgr.enemyX[slot],
          this.entityMgr.enemyY[slot],
          0xff0055,
          20,
          2.0
        );
        this.entityMgr.killEnemy(slot);
        continue;
      }

      // Update position along path
      GlobalPathSystem.getPositionAtDistance(newDist, this.tempPoint);
      this.entityMgr.enemyX[slot] = this.tempPoint.x;
      this.entityMgr.enemyY[slot] = this.tempPoint.y;
    }
  }

  private updateProjectiles(dt: number, statsOut: CombatStatsEvent): void {
    const activeCount = this.entityMgr.activeProjCount;
    const activeIndices = this.entityMgr.activeProjIndices;

    for (let i = activeCount - 1; i >= 0; i--) {
      const slot = activeIndices[i];
      if (this.entityMgr.projActive[slot] === 0) continue;

      this.entityMgr.projLifetime[slot] += dt;
      if (this.entityMgr.projLifetime[slot] > 3.0) {
        this.entityMgr.killProjectile(slot);
        continue;
      }

      let px = this.entityMgr.projX[slot];
      let py = this.entityMgr.projY[slot];
      const targetIdx = this.entityMgr.projTargetIdx[slot];
      const speed = this.entityMgr.projSpeed[slot] || 700;
      const step = speed * dt;
      const projType = this.entityMgr.projType[slot];
      let hasHit = false;

      // Homing behavior for direct weapons (pulse, tesla, cryo, railgun, flak)
      if (targetIdx >= 0 && this.entityMgr.enemyActive[targetIdx] === 1) {
        const ex = this.entityMgr.enemyX[targetIdx];
        const ey = this.entityMgr.enemyY[targetIdx];
        const dx = ex - px;
        const dy = ey - py;
        const dist = Math.hypot(dx, dy) || 1;
        const hitRadius = this.entityMgr.enemyRadius[targetIdx] + 8;

        if (dist <= step + hitRadius) {
          // Direct hit guaranteed!
          this.entityMgr.projX[slot] = ex;
          this.entityMgr.projY[slot] = ey;
          hasHit = true;
          this.applyHitDamage(slot, targetIdx, statsOut);
        } else {
          // Home in directly towards the moving enemy
          const dirX = dx / dist;
          const dirY = dy / dist;
          this.entityMgr.projVx[slot] = dirX * speed;
          this.entityMgr.projVy[slot] = dirY * speed;
          this.entityMgr.projX[slot] = px + dirX * step;
          this.entityMgr.projY[slot] = py + dirY * step;
        }
      } else {
        // If original target died in transit, check nearby enemies or advance linear
        px += this.entityMgr.projVx[slot] * dt;
        py += this.entityMgr.projVy[slot] * dt;
        this.entityMgr.projX[slot] = px;
        this.entityMgr.projY[slot] = py;

        // Proximity check with any active enemy
        const eCount = this.entityMgr.activeEnemyCount;
        const eIndices = this.entityMgr.activeEnemyIndices;
        for (let j = 0; j < eCount; j++) {
          const eslot = eIndices[j];
          if (this.entityMgr.enemyActive[eslot] === 1) {
            const ex = this.entityMgr.enemyX[eslot];
            const ey = this.entityMgr.enemyY[eslot];
            const r = this.entityMgr.enemyRadius[eslot] + 10;
            if (Math.hypot(px - ex, py - ey) <= r) {
              hasHit = true;
              this.applyHitDamage(slot, eslot, statsOut);
              break;
            }
          }
        }
      }

      if (hasHit) {
        this.entityMgr.killProjectile(slot);
      }
    }
  }

  private applyHitDamage(projSlot: number, enemySlot: number, statsOut: CombatStatsEvent): void {
    const rawDamage = this.entityMgr.projDamage[projSlot];
    const projType = this.entityMgr.projType[projSlot];

    // Mortar: Area Splash
    if (projType === 2 && this.entityMgr.projSplashRadius[projSlot] > 0) {
      const splashR = this.entityMgr.projSplashRadius[projSlot];
      const splashRSq = splashR * splashR;
      const hitX = this.entityMgr.enemyX[enemySlot];
      const hitY = this.entityMgr.enemyY[enemySlot];

      const eCount = this.entityMgr.activeEnemyCount;
      const eIndices = this.entityMgr.activeEnemyIndices;

      for (let j = 0; j < eCount; j++) {
        const eslot = eIndices[j];
        const dx = this.entityMgr.enemyX[eslot] - hitX;
        const dy = this.entityMgr.enemyY[eslot] - hitY;
        const distSq = dx * dx + dy * dy;
        if (distSq <= splashRSq) {
          const falloff = 1 - Math.sqrt(distSq) / splashR;
          const dmg = rawDamage * Math.max(0.35, falloff);
          this.damageSingleEnemy(eslot, dmg, statsOut);
        }
      }

      GlobalSoundFX.playMortarExplosion();
      this.entityMgr.spawnParticles(hitX, hitY, 0xffaa00, 16, 1.8);
      return;
    }

    // Tesla: Chain Lightning
    if (projType === 1 && this.entityMgr.projChainCount[projSlot] > 0) {
      let currentTarget = enemySlot;
      let chainDmg = rawDamage;
      const chains = this.entityMgr.projChainCount[projSlot];
      const chainRange = this.entityMgr.projChainRange[projSlot];
      const chainFalloff = this.entityMgr.projChainFalloff[projSlot];

      const visited = new Set<number>();
      visited.add(currentTarget);
      this.damageSingleEnemy(currentTarget, chainDmg, statsOut);

      for (let c = 1; c < chains; c++) {
        chainDmg *= chainFalloff;
        const cx = this.entityMgr.enemyX[currentTarget];
        const cy = this.entityMgr.enemyY[currentTarget];
        let nextTarget = -1;
        let closestDist = chainRange;

        const eCount = this.entityMgr.activeEnemyCount;
        const eIndices = this.entityMgr.activeEnemyIndices;
        for (let j = 0; j < eCount; j++) {
          const candidate = eIndices[j];
          if (!visited.has(candidate) && this.entityMgr.enemyActive[candidate] === 1) {
            const d = Math.hypot(this.entityMgr.enemyX[candidate] - cx, this.entityMgr.enemyY[candidate] - cy);
            if (d < closestDist) {
              closestDist = d;
              nextTarget = candidate;
            }
          }
        }

        if (nextTarget !== -1) {
          visited.add(nextTarget);
          this.damageSingleEnemy(nextTarget, chainDmg, statsOut);
          // Visual lightning particle spark between nodes
          this.entityMgr.spawnParticles(
            (cx + this.entityMgr.enemyX[nextTarget]) * 0.5,
            (cy + this.entityMgr.enemyY[nextTarget]) * 0.5,
            0xb026ff,
            4,
            0.8
          );
          currentTarget = nextTarget;
        } else {
          break;
        }
      }
      return;
    }

    // Cryo: Apply Slow
    if (projType === 3) {
      this.entityMgr.enemySlowTimer[enemySlot] = this.entityMgr.projSlowDuration[projSlot];
      this.entityMgr.enemySlowFactor[enemySlot] = this.entityMgr.projSlowFactor[projSlot];
      this.entityMgr.spawnParticles(
        this.entityMgr.enemyX[enemySlot],
        this.entityMgr.enemyY[enemySlot],
        0x00ffcc,
        6,
        0.8
      );
    }

    // Flak Pellet Hit (Type 5)
    if (projType === 5) {
      this.damageSingleEnemy(enemySlot, rawDamage, statsOut);
      this.entityMgr.spawnParticles(this.entityMgr.enemyX[enemySlot], this.entityMgr.enemyY[enemySlot], 0x34d399, 5, 0.9);
      GlobalSoundFX.playHit();
      return;
    }

    // Vortex Singularity Hit (Type 6)
    if (projType === 6) {
      const splashR = this.entityMgr.projSplashRadius[projSlot] || 110;
      const pull = this.entityMgr.projPullForce[projSlot] || 60;
      const hitX = this.entityMgr.enemyX[enemySlot];
      const hitY = this.entityMgr.enemyY[enemySlot];
      const splashRSq = splashR * splashR;

      const eCount = this.entityMgr.activeEnemyCount;
      const eIndices = this.entityMgr.activeEnemyIndices;

      for (let j = 0; j < eCount; j++) {
        const eslot = eIndices[j];
        const dx = this.entityMgr.enemyX[eslot] - hitX;
        const dy = this.entityMgr.enemyY[eslot] - hitY;
        if (dx * dx + dy * dy <= splashRSq) {
          // Pull enemy backward along the path!
          this.entityMgr.enemyPathDist[eslot] = Math.max(0, this.entityMgr.enemyPathDist[eslot] - pull);
          this.entityMgr.enemySlowTimer[eslot] = 2.5;
          this.entityMgr.enemySlowFactor[eslot] = 0.4;
          this.damageSingleEnemy(eslot, rawDamage, statsOut);
        }
      }

      GlobalSoundFX.playMortarExplosion();
      this.entityMgr.spawnParticles(hitX, hitY, 0x7c3aed, 24, 2.0);
      return;
    }

    // Standard Hit
    this.damageSingleEnemy(enemySlot, rawDamage, statsOut);
    GlobalSoundFX.playHit();
  }

  public damageSingleEnemy(slot: number, damage: number, statsOut: CombatStatsEvent): void {
    if (this.entityMgr.enemyActive[slot] === 0) return;

    let finalDamage = damage;

    // Boss Phase Shift damage reduction
    if (this.entityMgr.enemyBossPhaseActive[slot] === 1) {
      finalDamage *= 0.25;
    }

    // Shield absorption
    const currentShield = this.entityMgr.enemyShield[slot];
    if (currentShield > 0) {
      if (currentShield >= finalDamage) {
        this.entityMgr.enemyShield[slot] -= finalDamage;
        statsOut.damageDealt += finalDamage;
        return;
      } else {
        finalDamage -= currentShield;
        statsOut.damageDealt += currentShield;
        this.entityMgr.enemyShield[slot] = 0;
      }
    }

    const curHp = this.entityMgr.enemyHealth[slot];
    statsOut.damageDealt += Math.min(curHp, finalDamage);
    const newHp = curHp - finalDamage;
    this.entityMgr.enemyHealth[slot] = newHp;

    if (newHp <= 0) {
      // Enemy killed
      const bounty = this.entityMgr.enemyBounty[slot];
      const score = this.entityMgr.enemyScore[slot];
      statsOut.creditsEarned += bounty;
      statsOut.scoreEarned += score;
      statsOut.enemiesKilled++;

      const ex = this.entityMgr.enemyX[slot];
      const ey = this.entityMgr.enemyY[slot];

      this.entityMgr.spawnParticles(ex, ey, 0x00f3ff, 12, 1.2);
      this.entityMgr.spawnFloatingText(ex, ey - 10, `+$${bounty}`, '#00ff88');
      GlobalSoundFX.playEnemyKilled();

      this.entityMgr.killEnemy(slot);
    }
  }

  private updateParticles(dt: number): void {
    // Update Particles
    for (let i = 0; i < this.entityMgr.particles.length; i++) {
      const p = this.entityMgr.particles[i];
      if (p.active) {
        p.life += dt;
        if (p.life >= p.maxLife) {
          p.active = false;
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.96;
          p.vy *= 0.96;
        }
      }
    }

    // Update Floating Texts
    for (let i = 0; i < this.entityMgr.floatingTexts.length; i++) {
      const ft = this.entityMgr.floatingTexts[i];
      if (ft.active) {
        ft.life += dt;
        if (ft.life >= ft.maxLife) {
          ft.active = false;
        } else {
          ft.y -= 25 * dt; // Float upwards
        }
      }
    }
  }
}
