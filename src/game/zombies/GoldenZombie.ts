import * as EffectSystem from '../systems/EffectSystem';
import * as CollisionSystem from '../systems/CollisionSystem';
import * as GameUtils from '../systems/GameUtils';
import type { GameEngine } from '../GameEngine';
import { Top, Zombie } from '../types';

export function updateGoldenZombie(engine: GameEngine, z: Zombie, dt: number, zombieTargets: Top[]) {
    if (z.type === 'zombie_golden') {
        const golden = z as any;
        
        if (golden.isDying) {
            golden.dyingTimer -= dt;
            golden.vx = 0;
            golden.vy = 0;
            
            if (golden.dyingTimer > 0.25) {
                golden.angle += 15 * dt; // spin fast
            }
            
            if (golden.dyingTimer <= 0.25 && !golden.deathBeamFired) {
                golden.deathBeamFired = true;
                
                engine.screenShakeTimer = 0.5;
                engine.screenShakeIntensity = 10;

                // Explosion shockwaves
                engine.shockwaves.push({
                    x: golden.x,
                    y: golden.y,
                    radius: 10,
                    maxRadius: 250,
                    speed: 800,
                    color: 'rgba(250, 204, 21, 0.95)',
                    thickness: 60,
                    life: 0.4,
                    maxLife: 0.4,
                    isRainbow: true
                });

                engine.shockwaves.push({
                    x: golden.x,
                    y: golden.y,
                    radius: 10,
                    maxRadius: 200,
                    speed: 600,
                    color: 'rgba(234, 179, 8, 0.9)',
                    thickness: 40,
                    life: 0.5,
                    maxLife: 0.5
                });
                
                // Kill all orbiting zombies
                engine.zombies.forEach(oz => {
                    if (oz.orbitTargetId === golden.id && !oz.markForDeletion) {
                        oz.hp = 0; // Trigger their death naturally
                    }
                });
            }
            
            if (golden.dyingTimer <= 0) {
                golden.markForDeletion = true;
                const match = golden.lastKillerId ? golden.lastKillerId.match(/\d+/) : null;
                const idx = match ? parseInt(match[0], 10) : 0;
                
                EffectSystem.addParticles(engine, golden.x, golden.y, '#facc15', 35, 300, 10);
                EffectSystem.addParticles(engine, golden.x, golden.y, '#ca8a04', 15, 200, 6);
                
                engine.shockwaves.push({
                    x: golden.x, y: golden.y, radius: 0, maxRadius: 200,
                    speed: 600, color: '#facc15', thickness: 12,
                    life: 0.4, maxLife: 0.4
                });
            }
            return;
        }

        // Handle physical knockback exactly like BasicZombie
        if (golden.bounceTimer !== undefined && golden.bounceTimer > 0) {
            golden.bounceTimer -= dt;
            if (golden.hitByDash && golden.knockbackSpeedStart !== undefined && golden.maxBounceTimer) {
                const ratio = Math.max(0, Math.min(1, golden.bounceTimer / golden.maxBounceTimer));
                const targetSpeed = golden.knockbackSpeedStart * Math.pow(ratio, 2.0);
                const currentSpeed = Math.hypot(golden.vx, golden.vy);
                if (currentSpeed > 0.1) {
                    golden.vx = (golden.vx / currentSpeed) * targetSpeed;
                    golden.vy = (golden.vy / currentSpeed) * targetSpeed;
                }
            } else {
                golden.vx *= 0.96;
                golden.vy *= 0.96;
            }
            
            const speed = Math.hypot(golden.vx, golden.vy);
            const spinDir = (golden.vx + golden.vy >= 0) ? 1 : -1;
            golden.angle += spinDir * (speed / 15) * Math.PI * dt;

            // Slight spiral deflection
            const spiralAngle = spinDir * 2.5 * dt;
            const cosS = Math.cos(spiralAngle);
            const sinS = Math.sin(spiralAngle);
            const newVx = golden.vx * cosS - golden.vy * sinS;
            const newVy = golden.vx * sinS + golden.vy * cosS;
            golden.vx = newVx;
            golden.vy = newVy;

            if (golden.bounceTimer <= 0) {
                golden.bounceTimer = 0;
                golden.hitByDash = false;
            }
        } else {
            // Move randomly around the arena (Golden Zombie never targets players)
            if (golden.wanderTimer === undefined || golden.wanderTimer <= 0) {
                golden.wanderTimer = 1.0 + Math.random() * 2.0;
                golden.wanderAngle = Math.random() * Math.PI * 2;
            }
            golden.wanderTimer -= dt;
            
            const spd = 60 * (golden.speedMultiplier ?? 1.0); 
            golden.vx = Math.cos(golden.wanderAngle) * spd;
            golden.vy = Math.sin(golden.wanderAngle) * spd;
            
            const targetAngle = golden.wanderAngle + Math.PI/2;
            let diff = targetAngle - golden.angle;
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            golden.angle += Math.sign(diff) * Math.min(Math.abs(diff), 2.0 * dt);
        }

        GameUtils.applyLaunchPadAvoidance(engine, golden);
        golden.x += golden.vx * dt;
        golden.y += golden.vy * dt;
        CollisionSystem.handleWallBounce(engine, golden);
    }
}
