import * as GameUtils from '../systems/GameUtils';
import * as EffectSystem from '../systems/EffectSystem';
import * as CollisionSystem from '../systems/CollisionSystem';
import { SoundSystem } from '../systems/SoundSystem';
import { getStandbyRadiusForModel } from '../topMovement';
import type { GameEngine } from '../GameEngine';
import { Zombie } from '../types';

function endBlackZombieSkill(black: Zombie, targetTop?: any) {
    (black as any).skillUseCount = ((black as any).skillUseCount || 0) + 1;
    
    if ((black as any).skillUseCount >= 3) {
        black.bossAttackState = 'leaving';
    } else {
        black.bossAttackState = 'idle';
        black.bossNextAttackTime = 6.0;
    }
    black.bossWarningTargetId = undefined;
    black.struggleJitterX = undefined;
    black.struggleJitterY = undefined;
    (black as any).struggleAnchorX = undefined;
    (black as any).struggleAnchorY = undefined;
    (black as any).struggleClashAngle = undefined;
    
    if (targetTop) {
        targetTop.struggleJitterX = undefined;
        targetTop.struggleJitterY = undefined;
        (targetTop as any).struggleAnchorX = undefined;
        (targetTop as any).struggleAnchorY = undefined;
        targetTop.struggleMashCount = undefined;
        targetTop.struggleMashRequired = undefined;
    }
}

export function updateBlackZombie(engine: GameEngine, black: Zombie, dt: number, zombieTargets: { id: string; x: number; y: number }[]) {
    const bz = black as any;
    if (bz.isDying) {
        bz.dyingTimer -= dt;
        bz.vx = 0;
        bz.vy = 0;
        
        // Spin only during the first part (dyingTimer > 0.25)
        if (bz.dyingTimer > 0.25) {
            black.angle += 15 * dt; // spin fast
        }
        
        if (bz.dyingTimer <= 0.25 && !bz.deathBeamFired) {
            bz.deathBeamFired = true;
            
            engine.screenShakeTimer = 0.5;
            engine.screenShakeIntensity = 10;
            
            // Explosion shockwaves
            engine.shockwaves.push({
                x: black.x,
                y: black.y,
                radius: 10,
                maxRadius: 280,
                speed: 850,
                color: 'rgba(55, 65, 81, 0.95)',
                thickness: 70,
                life: 0.4,
                maxLife: 0.4,
                isRainbow: true
            });
            
            engine.shockwaves.push({
                x: black.x,
                y: black.y,
                radius: 10,
                maxRadius: 220,
                speed: 650,
                color: 'rgba(17, 24, 39, 0.9)',
                thickness: 50,
                life: 0.4,
                maxLife: 0.4,
                isRainbow: true
            });

            SoundSystem.play('Attack_Punch_024');
            
            EffectSystem.addParticles(engine, black.x, black.y, '#374151', 35, 400, 10);
            EffectSystem.addParticles(engine, black.x, black.y, '#111827', 30, 280, 12);
            EffectSystem.addParticles(engine, black.x, black.y, '#ef4444', 20, 320, 6); // red energy highlights
        }
        
        if (bz.dyingTimer <= 0) {
            black.markForDeletion = true;
            const match = bz.lastKillerId ? bz.lastKillerId.match(/\d+/) : null;
            const idx = match ? parseInt(match[0], 10) : 0;
            
            EffectSystem.addParticles(engine, black.x, black.y, '#374151', 35, 300, 10);
            EffectSystem.addParticles(engine, black.x, black.y, '#111827', 15, 200, 6);
            
            engine.shockwaves.push({
                x: black.x, y: black.y, radius: 0, maxRadius: 200,
                speed: 600, color: '#374151', thickness: 12,
                life: 0.4, maxLife: 0.4
            });
        }
        return;
    }

    // Intro logic (same as boss intro fallback or just simple walk in)
    if (black.introState === 'walking_in' || black.introState === 'jumping') {
        const dx = (black.introWalkTargetX ?? 960) - black.x;
        const dy = (black.introWalkTargetY ?? 540) - black.y;
        const dist = Math.hypot(dx, dy);
        
        if (black.introState === 'walking_in') {
            const speed = 150;
            if (dist > 5) {
                black.vx = (dx / dist) * speed;
                black.vy = (dy / dist) * speed;
                black.angle = Math.atan2(dy, dx) + Math.PI/2;
            } else {
                black.introState = 'jumping';
                black.introTimer = 0.5; // Half second jump
                SoundSystem.play('jump');
            }
        } else if (black.introState === 'jumping') {
            black.introTimer = (black.introTimer ?? 0) - dt;
            const progress = 1.0 - Math.max(0, (black.introTimer ?? 0) / 0.5);
            
            const startX = black.introWalkTargetX ?? 960;
            const startY = black.introWalkTargetY ?? 540;
            const endX = black.introJumpTargetX ?? 960;
            const endY = black.introJumpTargetY ?? 540;
            
            black.x = startX + (endX - startX) * progress;
            black.y = startY + (endY - startY) * progress;
            
            // Parabola for Z
            black.introZ = Math.sin(progress * Math.PI) * 150;
            
            if (progress >= 1.0) {
                black.introState = 'done';
                black.introZ = 0;
                // Landing impact
                engine.shockwaves.push({
                    x: black.x, y: black.y,
                    radius: 10, maxRadius: 150,
                    speed: 400, color: '#facc15',
                    thickness: 8, life: 0.4, maxLife: 0.4
                });
                SoundSystem.play('SE-Explo1');
                engine.screenShakeTimer = 0.3;
            }
        }
        if (black.introState === 'walking_in') {
            black.x += black.vx * dt;
            black.y += black.vy * dt;
        }
        return; // Don't do attack logic while in intro
    }

    if (black.bounceTimer !== undefined && black.bounceTimer > 0) {
        black.bounceTimer -= dt;
        
        if (black.hitByDash && black.knockbackSpeedStart !== undefined && black.maxBounceTimer) {
            const ratio = Math.max(0, Math.min(1, black.bounceTimer / black.maxBounceTimer));
            const targetSpeed = black.knockbackSpeedStart * Math.pow(ratio, 2.0);
            const currentSpeed = Math.hypot(black.vx, black.vy);
            if (currentSpeed > 0.1) {
                black.vx = (black.vx / currentSpeed) * targetSpeed;
                black.vy = (black.vy / currentSpeed) * targetSpeed;
            }
        } else {
            black.vx *= 0.90;
            black.vy *= 0.90;
        }

        // Fast spin! Scale with speed
        const speed = Math.hypot(black.vx, black.vy);
        const spinDir = (black.vx + black.vy >= 0) ? 1 : -1;
        black.angle += spinDir * (speed / 10) * Math.PI * dt; // Faster spin for black zombie bounce!

        if (black.bounceTimer <= 0) {
            black.bounceTimer = 0;
            black.hitByDash = false;
        }

        // Apply movement and skip other behaviors
        GameUtils.applyLaunchPadAvoidance(engine, black);
        black.x += black.vx * dt;
        black.y += black.vy * dt;
        CollisionSystem.handleWallBounce(engine, black);
        return;
    }

    if (black.hitCooldown !== undefined && black.hitCooldown > 0) {
        black.hitCooldown -= dt;
    }

    if (black.bossAttackState === undefined) black.bossAttackState = 'idle';
    if (black.bossNextAttackTime === undefined) black.bossNextAttackTime = 3.0;

    if (black.bossAttackState === 'idle') {
        black.bossNextAttackTime -= dt;
        if (black.bossNextAttackTime <= 0) {
            // Find target for struggle
            const validTargets = engine.tops.filter(t => GameUtils.isPlayerFreeOrStandby(engine, t));
            if (validTargets.length > 0) {
                const target = validTargets[Math.floor(Math.random() * validTargets.length)];
                black.bossWarningTargetId = target.id;
                black.bossSelectedAttack = 'struggle';
                black.bossAttackState = 'warning';
                black.bossAttackTimer = 1.5;
                (black as any).weakCornerIndex = Math.floor(Math.random() * 8);
                SoundSystem.play('SRW_Lock_01');
                black.vx = 0;
                black.vy = 0;
            } else {
                black.bossNextAttackTime = 1.0;
            }
        }
    }

    if (black.bossAttackState === 'warning') {
        black.bossAttackTimer = (black.bossAttackTimer ?? 0) - dt;
        black.vx = 0;
        black.vy = 0;

        const targetTop = engine.tops.find(t => t.id === black.bossWarningTargetId);
        if (targetTop) {
            black.bossWarningTargetX = targetTop.x;
            black.bossWarningTargetY = targetTop.y;
        }

        if (Math.random() < 0.4) {
            const ang = Math.random() * Math.PI * 2;
            engine.particles.push({
                x: black.x + Math.cos(ang) * 40,
                y: black.y + Math.sin(ang) * 40,
                vx: -Math.cos(ang) * 50,
                vy: -Math.sin(ang) * 50,
                life: 0.4,
                maxLife: 0.4,
                color: '#f97316',
                size: Math.random() * 5 + 3
            });
        }

        const dx = (black.bossWarningTargetX ?? black.x) - black.x;
        const dy = (black.bossWarningTargetY ?? black.y) - black.y;
        black.angle = Math.atan2(dy, dx) + Math.PI/2;

        if ((black.bossAttackTimer ?? 0) <= 0) {
            if (targetTop && GameUtils.isPlayerFreeOrStandby(engine, targetTop)) {
                black.bossAttackState = 'struggle_charge';
                black.bossAttackTimer = 5.0;
                engine.screenShakeTimer = 0.5;
            } else {
                black.bossAttackState = 'idle';
                black.bossNextAttackTime = 1.0;
            }
        }
    } else if (black.bossAttackState === 'struggle_charge') {
        black.bossAttackTimer = (black.bossAttackTimer ?? 0) - dt;
        const chargeSpeed = 900;
        const targetAngle = black.angle - Math.PI/2;
        black.vx = Math.cos(targetAngle) * chargeSpeed;
        black.vy = Math.sin(targetAngle) * chargeSpeed;

        if (Math.random() < 0.6) {
            engine.particles.push({
                x: black.x + (Math.random() - 0.5) * 50,
                y: black.y + (Math.random() - 0.5) * 50,
                vx: -black.vx * 0.1,
                vy: -black.vy * 0.1,
                life: 0.5,
                maxLife: 0.5,
                color: '#1f2937',
                size: Math.random() * 8 + 4
            });
        }

        if ((black.bossAttackTimer ?? 0) <= 0) {
            black.bossAttackState = 'idle';
            black.bossNextAttackTime = 1.5;
            black.vx = 0;
            black.vy = 0;
        }
    } else if (black.bossAttackState === 'struggle_clash') {
        black.bossAttackTimer = (black.bossAttackTimer ?? 0) - dt;
        black.vx = 0;
        black.vy = 0;
        
        const targetTop = engine.tops.find(t => t.id === black.bossWarningTargetId);
        if (targetTop && !targetTop.markForDeletion && targetTop.hp > 0) {
            // Push-and-pull displacement: Continuously shift the positions back-and-forth along the clash angle!
            let clashAngle = (black as any).struggleClashAngle;
            if (clashAngle === undefined) {
                const bdx = (targetTop as any).struggleAnchorX !== undefined ? (targetTop as any).struggleAnchorX - (black as any).struggleAnchorX : targetTop.x - black.x;
                const bdy = (targetTop as any).struggleAnchorY !== undefined ? (targetTop as any).struggleAnchorY - (black as any).struggleAnchorY : targetTop.y - black.y;
                clashAngle = Math.atan2(bdy, bdx);
                (black as any).struggleClashAngle = clashAngle;
            }

            const elapsed = 3.0 - (black.bossAttackTimer ?? 0);
            const currentMash = targetTop.struggleMashCount ?? 0;
            const requiredMash = targetTop.struggleMashRequired ?? 8;
            const playerProgress = Math.min(1.0, currentMash / requiredMash);
            const timeProgress = Math.min(1.0, elapsed / 3.0);

            // Drift depends on mashing progress relative to elapsed time (player mashing pushes zombie back, delay lets zombie push player forward)
            const drift = (timeProgress - playerProgress) * 70; // Range: -70 to +70

            // Fast chaotic back-and-forth oscillation (sway) to give visual organic wrestling feel
            const sway = Math.sin(elapsed * 12.0) * 16 + Math.cos(elapsed * 23.4) * 6;
            const pushOffset = drift + sway;

            const dx_offset = Math.cos(clashAngle) * pushOffset;
            const dy_offset = Math.sin(clashAngle) * pushOffset;

            if ((black as any).struggleAnchorX !== undefined) {
                black.x = (black as any).struggleAnchorX + dx_offset;
                black.y = (black as any).struggleAnchorY + dy_offset;
            }
            if ((targetTop as any).struggleAnchorX !== undefined) {
                const targetDist = black.radius + targetTop.radius - 5;
                targetTop.x = black.x + Math.cos(clashAngle) * targetDist;
                targetTop.y = black.y + Math.sin(clashAngle) * targetDist;
            }
            
            black.vx = 0; black.vy = 0;
            targetTop.vx = 0; targetTop.vy = 0;
            
            const dx = targetTop.x - black.x;
            const dy = targetTop.y - black.y;
            const dist = Math.hypot(dx, dy) || 1;
            
            // Jitter vibrate offsets (角色圖像激烈抖動) - increased scale to 35 for dramatic continuous shake
            const vibeScale = 35;
            const vibeX = (Math.random() - 0.5) * vibeScale;
            const vibeY = (Math.random() - 0.5) * vibeScale;
            black.struggleJitterX = vibeX;
            black.struggleJitterY = vibeY;
            
            targetTop.struggleJitterX = -vibeX;
            targetTop.struggleJitterY = -vibeY;
            
            // Face each other
            black.angle = Math.atan2(dy, dx) + Math.PI/2;
            targetTop.angle += 15 * dt; // spin player fast
            
            // Friction sparks spray intensely at contact point (兩方接觸點有激烈摩擦火化持續噴發)
            const contactX = black.x + (dx / dist) * black.radius;
            const contactY = black.y + (dy / dist) * black.radius;
            for (let k = 0; k < 3; k++) {
                const angleOffset = (Math.random() - 0.5) * Math.PI * 0.7;
                const sparkAngle = Math.atan2(dy, dx) + Math.PI/2 + angleOffset;
                const spd = 150 + Math.random() * 350;
                engine.particles.push({
                    x: contactX + (Math.random() - 0.5) * 10,
                    y: contactY + (Math.random() - 0.5) * 10,
                    vx: Math.cos(sparkAngle) * spd,
                    vy: Math.sin(sparkAngle) * spd,
                    life: 0.2 + Math.random() * 0.3,
                    maxLife: 0.5,
                    color: k % 3 === 0 ? '#fbbf24' : (k % 3 === 1 ? '#ea580c' : '#ffffff'),
                    size: Math.random() * 6 + 3,
                    isSpark: true
                });
            }
            
            // If player is AI, automatically struggle
            if (targetTop.isAI) {
                if (targetTop.aiMashTimer === undefined) targetTop.aiMashTimer = 0;
                targetTop.aiMashTimer += dt;
                if (targetTop.aiMashTimer >= 0.15) {
                    targetTop.aiMashTimer = 0;
                    targetTop.struggleMashCount = (targetTop.struggleMashCount ?? 0) + 1;
                }
            }
            
            // Check outcomes: End early if player mashes enough, or wait for timer
            const currentCount = targetTop.struggleMashCount ?? 0;
            const currentRequired = targetTop.struggleMashRequired ?? 8;
            
            if (currentCount >= currentRequired || (black.bossAttackTimer ?? 0) <= 0) {
                const count = currentCount;
                const required = currentRequired;
                
                if (count >= required) {
                    // SUCCESS OUTCOME: Push zombie back!
                    const rdx = black.x - targetTop.x;
                    const rdy = black.y - targetTop.y;
                    const rdist = Math.hypot(rdx, rdy) || 1;
                    const nx = rdx / rdist;
                    const ny = rdy / rdist;
                    
                    black.vx = nx * 1600;
                    black.vy = ny * 1600;
                    black.bounceTimer = 0.9;
                    black.maxBounceTimer = 0.9;
                    black.hitByDash = true;
                    black.knockbackSpeedStart = 1600;
                    SoundSystem.play('SE-Explo1');
                    black.flashTimer = 0.5;
                    
                    // Player top is released into beautiful orbital standby spin alignment (rapid spin-around whip)
                    targetTop.state = 'standby';
                    targetTop.spin = 1000;
                    if (targetTop.smoothSpin !== undefined) targetTop.smoothSpin = 1000;
                    targetTop.standbyAngle = Math.random() * Math.PI * 2;
                    targetTop.standbyCenterX = targetTop.x;
                    targetTop.standbyCenterY = targetTop.y;
                    targetTop.breakoutOrbitTimer = 1.0;
                    targetTop.struggleTriumphTimer = 1.0;
                    
                    engine.shockwaves.push({
                        x: targetTop.x,
                        y: targetTop.y,
                        radius: 10,
                        maxRadius: 350,
                        speed: 900,
                        color: '#38bdf8',
                        thickness: 25,
                        life: 0.5,
                        maxLife: 0.5
                    });
                    EffectSystem.addParticles(engine, contactX, contactY, '#38bdf8', 40, 500, 10);
                    EffectSystem.addParticles(engine, contactX, contactY, '#fbbf24', 25, 400, 8);
                    EffectSystem.addParticles(engine, contactX, contactY, '#ffffff', 20, 300, 6);
                    engine.screenShakeTimer = 1.2;
                    engine.screenShakeIntensity = 12;
                } else {
                    // FAILURE OUTCOME: Player is severely beaten back & loses hp!
                    const rdx = targetTop.x - black.x;
                    const rdy = targetTop.y - black.y;
                    const rdist = Math.hypot(rdx, rdy) || 1;
                    const nx = rdx / rdist;
                    const ny = rdy / rdist;
                    
                    targetTop.vx = nx * 1200;
                    targetTop.vy = ny * 1200;
                    targetTop.standbyCenterVx = nx * 1200;
                    targetTop.standbyCenterVy = ny * 1200;
                    // Fling high up in the air
                    targetTop.zPos = 1;
                    targetTop.zVel = 1200;
                    
                    targetTop.spin = Math.max(10, (targetTop.spin ?? 1000) - 300); // 扣減3格轉速
                    
                    if (targetTop.state === 'dash') {
                        targetTop.state = 'standby';
                        targetTop.dashTimer = 0;
                        const velocityAngle = Math.atan2(ny, nx);
                        targetTop.standbyAngle = velocityAngle + Math.PI / 2;
                        targetTop.standbyCenterX = targetTop.x - Math.cos(targetTop.standbyAngle) * getStandbyRadiusForModel(targetTop, engine, targetTop.standbyAngle);
                        targetTop.standbyCenterY = targetTop.y - Math.sin(targetTop.standbyAngle) * getStandbyRadiusForModel(targetTop, engine, targetTop.standbyAngle);
                    }
                    
                    SoundSystem.play('SE-Hurt1');
                    targetTop.flashTimer = 0.35;
                    targetTop.damageShockTimer = 0.6;
                    // hpLossTimer removed since we deduct spin instead
                    
                    engine.shockwaves.push({
                        x: targetTop.x,
                        y: targetTop.y,
                        radius: 10,
                        maxRadius: 250,
                        speed: 700,
                        color: '#ef4444',
                        thickness: 18,
                        life: 0.5,
                        maxLife: 0.5
                    });
                    EffectSystem.addParticles(engine, targetTop.x, targetTop.y, '#ef4444', 35, 450, 10);
                    EffectSystem.addParticles(engine, targetTop.x, targetTop.y, '#ea580c', 20, 350, 8);
                    engine.screenShakeTimer = 1.3;
                    engine.screenShakeIntensity = 15;
                }
                
                // Reset states
                endBlackZombieSkill(black, targetTop);
            }
        } else {
            // Target lost
            black.bossAttackState = 'idle';
            black.bossNextAttackTime = 1.5;
            black.vx = 0; black.vy = 0;
            black.struggleJitterX = undefined;
            black.struggleJitterY = undefined;
            (black as any).struggleAnchorX = undefined;
            (black as any).struggleAnchorY = undefined;
            (black as any).struggleClashAngle = undefined;
        }
    } else if (black.bossAttackState === 'idle') {
        // Move slowly towards nearest top
        let minDist = Infinity;
        let targetX = 960;
        let targetY = engine.activeArenaCenterY ?? 540;

        engine.tops.forEach(t => {
            if (GameUtils.isPlayerFreeOrStandby(engine, t)) {
                const dist = Math.hypot(t.x - black.x, t.y - black.y);
                if (dist < minDist) {
                    minDist = dist;
                    targetX = t.x;
                    targetY = t.y;
                }
            }
        });

        const dx = targetX - black.x;
        const dy = targetY - black.y;
        if (minDist > 10) {
            const angle = Math.atan2(dy, dx);
            const walkSpeed = 60 * (black.speedMultiplier || 1.0);
            black.vx = Math.cos(angle) * walkSpeed;
            black.vy = Math.sin(angle) * walkSpeed;
            black.angle = angle + Math.PI/2;
        } else {
            black.vx = 0;
            black.vy = 0;
        }
    } else if (black.bossAttackState === 'leaving') {
        const targetX = 960;
        const targetY = -200;
        const dx = targetX - black.x;
        const dy = targetY - black.y;
        const angle = Math.atan2(dy, dx);
        const walkSpeed = 150 * (black.speedMultiplier || 1.0);
        black.vx = Math.cos(angle) * walkSpeed;
        black.vy = Math.sin(angle) * walkSpeed;
        black.angle = angle + Math.PI/2;

        if (black.y < -100) {
            black.markForDeletion = true;
        }
    } else if (black.bossAttackState === 'leave_jump') {
        const bz = black as any;
        bz.leaveJumpTimer = (bz.leaveJumpTimer ?? 0) - dt;
        const progress = 1.0 - Math.max(0, (bz.leaveJumpTimer ?? 0) / 0.5);
        
        const startX = bz.leaveJumpStartX ?? 960;
        const startY = bz.leaveJumpStartY ?? 540;
        const endX = bz.leaveJumpEndX ?? 960;
        const endY = bz.leaveJumpEndY ?? -200;
        
        black.x = startX + (endX - startX) * progress;
        black.y = startY + (endY - startY) * progress;
        
        // Parabola for Z
        bz.introZ = Math.sin(progress * Math.PI) * 150;
        
        if (progress >= 1.0) {
            black.markForDeletion = true;
        }
    }

    // Apply movement
    GameUtils.applyLaunchPadAvoidance(engine, black);
    if (black.bossAttackState !== 'leave_jump') {
        black.x += black.vx * dt;
        black.y += black.vy * dt;
    }
    
    if (black.bossAttackState === 'leaving') {
        const clamped = GameUtils.clampToCapsule(engine, black.x, black.y, black.radius || 30);
        if (clamped.x !== black.x || clamped.y !== black.y) {
            black.bossAttackState = 'leave_jump';
            const bz = black as any;
            bz.leaveJumpTimer = 0.5;
            bz.leaveJumpStartX = black.x;
            bz.leaveJumpStartY = black.y;
            // Target outside of bounds for jump landing
            bz.leaveJumpEndX = black.x + Math.cos(black.angle - Math.PI/2) * 200;
            bz.leaveJumpEndY = black.y + Math.sin(black.angle - Math.PI/2) * 200;
            SoundSystem.play('jump');
        }
    } else if (black.bossAttackState !== 'leave_jump') {
        const oldX = black.x;
        const oldY = black.y;
        const bounced = CollisionSystem.handleWallBounce(engine, black);
        const clamped = GameUtils.clampToCapsule(engine, oldX, oldY, black.radius || 30);
        
        if (black.bossAttackState === 'struggle_charge' && (bounced || clamped.x !== oldX || clamped.y !== oldY)) {
            endBlackZombieSkill(black, engine.tops.find(t => t.id === black.bossWarningTargetId));
        }
    }
}
