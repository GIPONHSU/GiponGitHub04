import * as EffectSystem from '../systems/EffectSystem';
import * as CollisionSystem from '../systems/CollisionSystem';
import type { GameEngine } from '../GameEngine';
import { Top, Zombie } from '../types';
import { SoundSystem } from '../systems/SoundSystem';
import { updateBasicZombie } from './BasicZombie';
import { getStandbyRadiusForModel } from '../topMovement';
import { CANVAS_W, CANVAS_H } from '../constants';
import * as GameUtils from '../systems/GameUtils';

export function updateBouncingZombie(engine: GameEngine, z: Zombie, dt: number, zombieTargets: Top[]) {
    if (z.type === 'zombie_bouncing') {
        const big = z as any;
        
        if (big.isDying) {
            if (big.bouncingAttackState !== 'idle' && big.bouncingAttackState !== undefined) {
                big.bouncingAttackState = 'idle';
                (engine as any).purpleBrownSkillCooldown = 3.0 + Math.random() * 3.0;
            }
            // Initialize dyingTimer properly if it was set to 10 earlier
            if (big.dyingTimer > 1.25) {
                big.dyingTimer = 1.25;
            }
            big.dyingTimer -= dt;
            big.vx = 0;
            big.vy = 0;
            
            // Spin only during the first 1 second (dyingTimer > 0.25)
            if (big.dyingTimer > 0.25) {
                big.angle += 15 * dt; // spin fast
            }
            
            // Fire earthquake at exactly 0.25s remaining (only once)
            if (big.dyingTimer <= 0.25 && !big.deathBeamFired) {
                big.deathBeamFired = true;
                const match = big.lastKillerId ? big.lastKillerId.match(/\d+/) : null;
                const idx = match ? parseInt(match[0], 10) : 0;
                
                // Create multi-layered concentric spectacular shockwaves that expand
                // Layer 1
                engine.shockwaves.push({
                    x: big.x,
                    y: big.y,
                    radius: 10,
                    maxRadius: 350,
                    speed: 1025,
                    color: 'rgba(219, 39, 119, 0.95)',
                    thickness: 95,
                    life: 0.4,
                    maxLife: 0.4,
                    isRainbow: true
                });

                // Layer 2
                engine.shockwaves.push({
                    x: big.x,
                    y: big.y,
                    radius: 10,
                    maxRadius: 300,
                    speed: 875,
                    color: 'rgba(236, 72, 153, 0.9)',
                    thickness: 75,
                    life: 0.4,
                    maxLife: 0.4,
                    isRainbow: true
                });

                // Layer 3
                engine.shockwaves.push({
                    x: big.x,
                    y: big.y,
                    radius: 10,
                    maxRadius: 250,
                    speed: 725,
                    color: 'rgba(244, 114, 182, 0.85)',
                    thickness: 55,
                    life: 0.4,
                    maxLife: 0.4,
                    isRainbow: true
                });

                // Shake camera extremely intensely
                engine.screenShakeTimer = 0.5;
                engine.screenShakeIntensity = 12;

                SoundSystem.play('Attack_Punch_024');

                EffectSystem.addParticles(engine, big.x, big.y, '#db2777', 35, 400, 10);
                EffectSystem.addParticles(engine, big.x, big.y, '#831843', 30, 280, 12);
                EffectSystem.addParticles(engine, big.x, big.y, '#fbcfe8', 25, 360, 6);

                // Deal damage to all players within 350px radius
                engine.tops.forEach(top => {
                    if (top.markForDeletion || top.isExploding || top.hp <= 0 || (top.skillActiveTimer !== undefined && top.skillActiveTimer > 0)) return;
                    const dist = Math.hypot(top.x - big.x, top.y - big.y);
                    if (dist <= 350) {
                        if (top.hitCooldown === undefined || top.hitCooldown <= 0) {
                            const isInvulnerable = (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) || (top.breakoutOrbitTimer !== undefined && top.breakoutOrbitTimer > 0);
                            if (!isInvulnerable) {
                                SoundSystem.play('SE-Hurt1');
                                top.hitCooldown = 1.0; // 1-second invulnerability protection
                                top.flashTimer = 0.25;
                                top.damageShockTimer = 0.45;
                                top.spin = Math.max(10, (top.spin ?? 1000) - 300);

                                EffectSystem.addParticles(engine, top.x, top.y, '#ef4444', 35, 450, 10);
                            } else {
                                EffectSystem.addParticles(engine, top.x, top.y, '#fbbf24', 25, 300, 10);
                            }
                        }

                        if (top.isAI) {
                            engine.screenShakeTimer = 0.8;
                        }

                        // Apply extreme knockback
                        const dx = top.x - big.x;
                        const dy = top.y - big.y;
                        const dist2 = Math.hypot(dx, dy) || 1;
                        const nx = dx / dist2;
                        const ny = dy / dist2;
                        const bounceForce = 1500; // heavy kinetic impact rebound

                        top.vx = nx * bounceForce;
                        top.vy = ny * bounceForce;

                        if (top.state === 'dash') {
                            top.state = 'standby';
                            top.dashTimer = 0;
                            const velocityAngle = Math.atan2(ny, nx);
                            top.standbyAngle = velocityAngle + Math.PI / 2;
                            top.standbyCenterX = top.x - Math.cos(top.standbyAngle) * getStandbyRadiusForModel(top, engine as any,  top.standbyAngle);
                            top.standbyCenterY = top.y - Math.sin(top.standbyAngle) * getStandbyRadiusForModel(top, engine as any,  top.standbyAngle);
                        }
                        if (top.state === 'standby') {
                            top.standbyCenterVx = nx * bounceForce;
                            top.standbyCenterVy = ny * bounceForce;
                        }
                    }
                });
            }
            
            if (big.dyingTimer <= 0) {
                big.markForDeletion = true;
                const match = big.lastKillerId ? big.lastKillerId.match(/\d+/) : null;
                const idx = match ? parseInt(match[0], 10) : 0;
                
                EffectSystem.addParticles(engine, big.x, big.y, '#be185d', 45, 400, 12);
                EffectSystem.addParticles(engine, big.x, big.y, '#f472b6', 25, 300, 8);
                
                engine.shockwaves.push({
                    x: big.x, y: big.y, radius: 0, maxRadius: 250,
                    speed: 600, color: '#be185d', thickness: 12,
                    life: 0.4, maxLife: 0.4
                });
            }
            return;
        }

        if (big.bouncingAttackState === undefined) big.bouncingAttackState = 'idle';
        if (big.bouncingAttackTimer === undefined) big.bouncingAttackTimer = 0;
        if (big.bouncingNextAttackTime === undefined) big.bouncingNextAttackTime = 4.0 + Math.random() * 3;

        if (big.bouncingAttackState === 'idle') {
            big.bouncingNextAttackTime -= dt;
            
            let minDist = Infinity;
            let targetTop: Top | null = null;
            zombieTargets.forEach(t => {
                const d = Math.hypot(t.x - big.x, t.y - big.y);
                if (d < minDist) { minDist = d; targetTop = t; }
            });

            if (big.bouncingNextAttackTime <= 0 && targetTop) {
                const globalCooldownActive = (engine as any).purpleBrownSkillCooldown !== undefined && (engine as any).purpleBrownSkillCooldown > 0;
                const anotherIsAttacking = engine.zombies.some(other => {
                    if (other.id === big.id) return false;
                    const isBigAttacking = (other.type === 'zombie_big' || other.type === 'zombie_bomb') && (other as any).bigAttackState !== undefined && (other as any).bigAttackState !== 'idle';
                    const isBouncingAttacking = other.type === 'zombie_bouncing' && (other as any).bouncingAttackState !== undefined && (other as any).bouncingAttackState !== 'idle';
                    return isBigAttacking || isBouncingAttacking;
                });

                if (!anotherIsAttacking && !globalCooldownActive) {
                    big.bouncingAttackState = 'warning';
                    big.bouncingAttackTimer = 1.5;
                    SoundSystem.play('SRW_Lock_01');
                    big.vx = 0;
                    big.vy = 0;

                    // Choose 3 random points inside the capsule arena
                    const targets: { x: number; y: number }[] = [];
                    const cy = engine.activeArenaCenterY ?? 540;
                    for (let i = 0; i < 3; i++) {
                        let tx = 540;
                        let ty = cy;
                        for (let attempt = 0; attempt < 100; attempt++) {
                            const rx = 300 + Math.random() * (CANVAS_W - 600);
                            const ry = cy - 400 + Math.random() * 800;
                            if (GameUtils.isPointInsideCapsule(engine, rx, ry, 60)) {
                                tx = rx;
                                ty = ry;
                                break;
                            }
                        }
                        targets.push({ x: tx, y: ty });
                    }
                    big.bouncingTargets = targets;
                    big.bouncingCurrentTargetIndex = 0;
                } else {
                    big.bouncingNextAttackTime = 0.5 + Math.random() * 0.5;
                    updateBasicZombie(engine, z, dt, zombieTargets);
                }
            } else {
                updateBasicZombie(engine, z, dt, zombieTargets);
            }
        } else if (big.bouncingAttackState === 'warning') {
            big.bouncingAttackTimer -= dt;
            big.vx = 0;
            big.vy = 0;

            if (Math.random() < 0.25) {
                const ang = Math.random() * Math.PI * 2;
                engine.particles.push({
                    x: big.x + Math.cos(ang) * big.radius * (0.5 + Math.random() * 0.5),
                    y: big.y + Math.sin(ang) * big.radius * (0.5 + Math.random() * 0.5),
                    vx: -Math.cos(ang) * 120,
                    vy: -Math.sin(ang) * 120,
                    life: 0.45,
                    maxLife: 0.45,
                    color: '#be185d',
                    size: Math.random() * 5 + 2
                });
            }

            if (big.bouncingAttackTimer <= 0) {
                big.bouncingAttackState = 'bouncing';
                big.bouncingAttackTimer = 0.8; // jump duration
                big.vx = 0;
                big.vy = 0;
                big.bouncingStartX = big.x;
                big.bouncingStartY = big.y;
            }
        } else if (big.bouncingAttackState === 'bouncing') {
            big.bouncingAttackTimer -= dt;
            big.vx = 0;
            big.vy = 0;
            
            const duration = 0.8;
            const progress = Math.min(1.0, 1.0 - (big.bouncingAttackTimer / duration));
            
            const tg = big.bouncingTargets[big.bouncingCurrentTargetIndex];
            
            // Move horizontally
            big.x = big.bouncingStartX + (tg.x - big.bouncingStartX) * progress;
            big.y = big.bouncingStartY + (tg.y - big.bouncingStartY) * progress;
            
            // Fast spin!
            big.angle += 20 * dt;
            
            // Parabola height
            const maxZ = 180;
            big.introZ = 4 * maxZ * progress * (1 - progress);

            if (big.bouncingAttackTimer <= 0) {
                // Landed!
                big.introZ = 0;
                big.x = tg.x;
                big.y = tg.y;
                
                SoundSystem.play('Attack_Punch_024');
                engine.screenShakeTimer = 0.3;
                
                engine.shockwaves.push({
                    x: big.x,
                    y: big.y,
                    radius: 10,
                    maxRadius: 120,
                    speed: 600,
                    color: 'rgba(190, 24, 93, 0.85)',
                    thickness: 30,
                    life: 0.3,
                    maxLife: 0.3
                });

                EffectSystem.addParticles(engine, big.x, big.y, '#be185d', 20, 300, 8);
                EffectSystem.addParticles(engine, big.x, big.y, '#f472b6', 15, 200, 6);

                // Deal damage in 120px radius
                engine.tops.forEach(top => {
                    if (top.markForDeletion || top.isExploding || top.hp <= 0 || (top.skillActiveTimer !== undefined && top.skillActiveTimer > 0)) return;
                    const dist = Math.hypot(top.x - big.x, top.y - big.y);
                    if (dist <= 120) {
                        if (top.hitCooldown === undefined || top.hitCooldown <= 0) {
                            const isInvulnerable = (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) || (top.breakoutOrbitTimer !== undefined && top.breakoutOrbitTimer > 0);
                            if (!isInvulnerable) {
                                SoundSystem.play('SE-Hurt1');
                                top.hitCooldown = 1.0;
                                top.flashTimer = 0.25;
                                top.damageShockTimer = 0.45;
                                top.spin = Math.max(10, (top.spin ?? 1000) - 300);

                                EffectSystem.addParticles(engine, top.x, top.y, '#be185d', 35, 450, 10);
                            }
                        }
                    }
                });

                // Next jump or finish
                big.bouncingCurrentTargetIndex++;
                if (big.bouncingCurrentTargetIndex >= big.bouncingTargets.length) {
                    big.bouncingAttackState = 'idle';
                    big.bouncingNextAttackTime = 5.0 + Math.random() * 3;
                    (engine as any).purpleBrownSkillCooldown = 3.0 + Math.random() * 3.0;
                } else {
                    big.bouncingAttackState = 'bouncing';
                    big.bouncingAttackTimer = 0.8;
                    big.bouncingStartX = big.x;
                    big.bouncingStartY = big.y;
                }
            }
        }

        if (big.bouncingAttackState === 'idle' || big.bouncingAttackState === 'warning') {
            GameUtils.applyLaunchPadAvoidance(engine, z);
            z.x += z.vx * dt;
            z.y += z.vy * dt;
            CollisionSystem.handleWallBounce(engine, z);
        }
    }
}
