import * as InputSystem from './InputSystem';
import * as EffectSystem from './EffectSystem';
import * as EventSystem from './EventSystem';
import * as CollisionSystem from './CollisionSystem';
import * as SpawnSystem from './SpawnSystem';
import { SoundSystem } from './SoundSystem';
import type { GameEngine } from '../GameEngine';
import { Top, Entity } from '../types';
import { CANVAS_W, CANVAS_H, TOP_RADIUS } from '../constants';

export function applyDamageToZombie(engine: GameEngine, z: import('../types').Zombie, damage: number, sourceTopId: string, killProbabilityMultiplier: number = 1.0) {
    if (z.hp <= 0) return;

    // Initialize hit counts if not present
    if (!z.hitCounts) {
        z.hitCounts = new Map<string, number>();
    }
    
    let currentHits = z.hitCounts.get(sourceTopId) || 0;
    currentHits += 1 * killProbabilityMultiplier;
    z.hitCounts.set(sourceTopId, currentHits);

    let instakill = false;
    
    if (z.type === 'zombie_boss') {
        if (Math.random() < (1/1000) * killProbabilityMultiplier || currentHits >= 2000) {
            instakill = true;
        }
    } else if (z.type === 'zombie_small') {
        if (Math.random() < 0.5 * killProbabilityMultiplier || currentHits >= 4) {
            instakill = true;
        }
    } else if (z.type === 'zombie_big') {
        if (Math.random() < (1/6) * killProbabilityMultiplier || currentHits >= 12) {
            instakill = true;
        }
    } else if (z.type === 'zombie_bomb') {
        if (Math.random() < (1/8) * killProbabilityMultiplier || currentHits >= 16) {
            instakill = true;
        }
    } else if (z.type === 'zombie_bouncing') {
        if (Math.random() < (1/10) * killProbabilityMultiplier || currentHits >= 20) {
            instakill = true;
        }
    } else if (z.type === 'zombie_golden' || z.type === 'zombie_black') {
        if (Math.random() < (1/15) * killProbabilityMultiplier || currentHits >= 30) {
            instakill = true;
        }
    }

    if (instakill) {
        z.hp = 0;
    }
}

const MISSION_CONFIG = {
    zombie_small: [10, 20, 30],
    zombie_big: [3, 6, 9],
    zombie_bomb: [2, 4, 6],
    zombie_bouncing: [2, 4, 6]
};

function addRandomMission(top: Top) {
    const activeTypes = top.missions!.map(m => m.targetType);
    
    const allTypes = ['zombie_small', 'zombie_big', 'zombie_bomb', 'zombie_bouncing'] as const;
    
    // First, try to find types that are not currently active AND haven't reached their max tier
    let availableTypes = allTypes.filter(t => {
        const isNotActive = !activeTypes.includes(t);
        const hasNotReachedMaxTier = top.missionTiers![t] < MISSION_CONFIG[t].length;
        return isNotActive && hasNotReachedMaxTier;
    });

    // If all available non-active types have reached their max tier, 
    // fall back to choosing any non-active type (reusing maxed out ones)
    if (availableTypes.length === 0) {
        availableTypes = allTypes.filter(t => !activeTypes.includes(t));
    }

    if (availableTypes.length === 0) return;
    
    const chosenType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    
    let tier = top.missionTiers![chosenType];
    if (tier >= MISSION_CONFIG[chosenType].length) {
        tier = MISSION_CONFIG[chosenType].length - 1;
    }
    
    const targetCount = MISSION_CONFIG[chosenType][tier];
    
    top.missions!.push({
        targetType: chosenType,
        targetCount,
        currentCount: 0,
        completed: false
    });
}

export function initializeTopMissions(top: Top) {
    if (!top.missionTiers) {
        top.missionTiers = { zombie_small: 0, zombie_big: 0, zombie_bomb: 0, zombie_bouncing: 0 };
    }
    if (!top.missions) {
        top.missions = [];
    }
    while (top.missions.length < 3) {
        const oldLen = top.missions.length;
        addRandomMission(top);
        if (top.missions.length === oldLen) break;
    }
}

export function handleZombieKillForMissions(engine: GameEngine, topId: string, zombieType: string) {
    const top = engine.tops.find(t => t.id === topId);
    if (!top || !top.missions || top.hp <= 0) return;
    
    let freshlyCompleted = 0;
    
    const topIdxMatch = top.id.match(/\d+/);
    const topIdx = topIdxMatch ? parseInt(topIdxMatch[0], 10) : 0;
    const padding = 8;
    const barW = 460;
    const CANVAS_W = 1920;
    const CANVAS_H = 1080;
    
    let drawX = padding;
    let drawY = padding;
    if (topIdx === 0) { drawX = padding; drawY = CANVAS_H - 130 - padding; }
    else if (topIdx === 1) { drawX = CANVAS_W - barW - padding; drawY = CANVAS_H - 130 - padding; }
    else if (topIdx === 2) { drawX = padding; drawY = padding + 10; }
    else if (topIdx === 3) { drawX = CANVAS_W - barW - padding; drawY = padding + 10; }

    for (let i = 0; i < top.missions.length; i++) {
        const mission = top.missions[i];
        if (!mission.completed && mission.targetType === zombieType) {
            mission.currentCount++;
            if (mission.currentCount >= mission.targetCount) {
                mission.currentCount = mission.targetCount;
                mission.completed = true;
                mission.textTimer = 1.5; // Start with text display
                mission.glowTimer = 2.0; // Glow timer will start after textTimer
                freshlyCompleted++;
            }
        }
    }
    
    if (freshlyCompleted > 0) {
        SoundSystem.play('pickupCoin_1');
    }
}

export function tickMissions(engine: GameEngine, top: Top, dt: number) {
    if (!top.missions) return;
    
    let needsReplacement = false;
    for (let i = 0; i < top.missions.length; i++) {
        const mission = top.missions[i];
        if (mission.completed) {
            if (mission.textTimer !== undefined && mission.textTimer > 0) {
                mission.textTimer -= dt;
                if (mission.textTimer <= 0) {
                    mission.textTimer = 0;
                    
                    // Spawn 1 ticket sprouting from the mission UI with total amount 10
                    const padding = 8;
                    const barW = 460;
                    const CANVAS_W = 1920;
                    const CANVAS_H = 1080;
                    
                    const topIdxMatch = top.id.match(/\d+/);
                    const topIdx = topIdxMatch ? parseInt(topIdxMatch[0], 10) : 0;
                    
                    let drawX = padding;
                    let drawY = padding;
                    if (topIdx === 0) { drawX = padding; drawY = CANVAS_H - 130 - padding; }
                    else if (topIdx === 1) { drawX = CANVAS_W - barW - padding; drawY = CANVAS_H - 130 - padding; }
                    else if (topIdx === 2) { drawX = padding; drawY = padding + 10; }
                    else if (topIdx === 3) { drawX = CANVAS_W - barW - padding; drawY = padding + 10; }

                    const slotW = 140;
                    const slotGap = 10;
                    let sX = drawX + 10 + i * (slotW + slotGap) + slotW / 2;
                    let sY = drawY + 80 + 45 / 2;
                    
                    if (topIdx === 2 || topIdx === 3) {
                        const centerX = drawX + barW / 2;
                        const centerY = drawY + 140 / 2 - 10; // barH is 140
                        sX = centerX - (sX - centerX);
                        sY = centerY - (sY - centerY);
                    }

                    const startXWorld = (sX - CANVAS_W / 2) / engine.camera.zoom + engine.camera.x;
                    const startYWorld = (sY - CANVAS_H / 2) / engine.camera.zoom + engine.camera.y;

                    const angle = Math.random() * Math.PI * 2;
                    const speed = 300 + Math.random() * 400;
                    engine.items.push({
                        id: `ticket_mission_${top.id}_${Date.now()}_${Math.random()}`,
                        type: 'item_ticket',
                        x: startXWorld,
                        y: startYWorld,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        z: 0,
                        vz: 400 + Math.random() * 300,
                        radius: 15,
                        mass: 1,
                        markForDeletion: false,
                        amount: 10,
                        targetPlayerId: top.id,
                        hoverTimer: 0.8 + Math.random() * 0.4
                    });
                }
            } else if (mission.glowTimer !== undefined && mission.glowTimer > 0) {
                mission.glowTimer -= dt;
                if (mission.glowTimer <= 0) {
                    mission.glowTimer = 0;
                    needsReplacement = true;
                }
            }
        }
    }
    
    if (needsReplacement) {
        for (let i = top.missions.length - 1; i >= 0; i--) {
            if (top.missions[i].completed) {
                const type = top.missions[i].targetType;
                top.missionTiers![type]++;
                top.missions.splice(i, 1);
            }
        }
        
        while (top.missions.length < 3) {
            const oldLen = top.missions.length;
            addRandomMission(top);
            if (top.missions.length === oldLen) break;
        }
    }
}

export function handleZombieDeath(engine: GameEngine, z: import('../types').Zombie, killerId: string): boolean {
    if ((z as any).isDying) {
        return false;
    }

    if (z.type !== 'zombie_boss') {
        handleZombieKillForMissions(engine, killerId, z.type);
    }
    
    if (z.type === 'zombie_small' || z.type === 'zombie_big' || z.type === 'zombie_bomb' || z.type === 'zombie_bouncing' || z.type === 'zombie_golden' || z.type === 'zombie_black') {
        (z as any).isDying = true;
        (z as any).dyingTimer = z.type === 'zombie_small' ? 0.3 : 1.25;
        (z as any).lastKillerId = killerId;
        z.hp = 0;
        if (z.type === 'zombie_small') {
            SoundSystem.play('Attack_Slash_020');
        }
        return false;
    }
    return true;
}

export function isPointInsideCapsule(engine: GameEngine, x: number, y: number, r: number = 0): boolean {
    const R = 480 - r;
    const centerY = engine.activeArenaCenterY ?? 540;
    return (x < 540 ? Math.hypot(x - 540, y - centerY) <= R : 
            x > 1380 ? Math.hypot(x - 1380, y - centerY) <= R : 
            y >= centerY - R && y <= centerY + R);
}

export function isClashActive(engine: GameEngine) {
    const isBossStruggle = engine.zombies ? engine.zombies.some(z => (z.type === 'zombie_boss' || z.type === 'zombie_black') && (z as any).bossAttackState === 'struggle_clash') : false;
    const isTopStruggle = engine.tops ? engine.tops.some(t => t.coopState !== undefined) : false;
    return isBossStruggle || isTopStruggle;
}

export function isPlayerFreeOrStandby(engine: GameEngine, top: Top): boolean {
    if (!top || top.markForDeletion || top.hp <= 0 || top.isExploding) {
        return false;
    }
    if (top.launchPadState !== undefined) {
        return false;
    }
    if (top.coopState !== undefined) {
        return false;
    }
    if (engine.zombieSiegeActive && engine.siegeTargetPlayerId === top.id) {
        return false;
    }
    return true;
}

export function updateTutorialTimestamps(engine: GameEngine, top: Top) {
    if (top.isAI) return;

    if (!(top as any).tutorialTimes) {
        (top as any).tutorialTimes = {};
    }
    const times = (top as any).tutorialTimes;

    // 1. game_start_spin
    const isSpinTutActive = top.spinTutorialTimer !== undefined && top.spinTutorialTimer > 0;
    if (isSpinTutActive) {
        if (times.game_start_spin === undefined) {
            times.game_start_spin = Date.now();
        }
    } else {
        times.game_start_spin = undefined;
    }

    // 2. launch_pad
    const isLaunchPadActive = !top.isExploding && top.launchPadState === 'prep_spinning';
    if (isLaunchPadActive) {
        if (times.launch_pad === undefined) {
            times.launch_pad = Date.now();
        }
    } else {
        times.launch_pad = undefined;
    }

    // 3. zombie_siege
    const isZombieSiegeActive = engine.zombieSiegeActive && engine.siegeStatus === 'clinging' && engine.siegeTargetPlayerId === top.id;
    if (isZombieSiegeActive) {
        if (times.zombie_siege === undefined) {
            times.zombie_siege = Date.now();
        }
    } else {
        times.zombie_siege = undefined;
    }

    // 4. boss_struggle
    const isBossStruggleActive = engine.zombies ? engine.zombies.some(
        z => (z.type === 'zombie_boss' || z.type === 'zombie_black') && 
             (z as any).bossAttackState === 'struggle_clash' && 
             (z as any).bossWarningTargetId === top.id
    ) : false;
    if (isBossStruggleActive) {
        if (times.boss_struggle === undefined) {
            times.boss_struggle = Date.now();
        }
    } else {
        times.boss_struggle = undefined;
    }

    // 5. active_coop_overlay
    const isCoopOverlayActive = top.coopState !== undefined && 
        (top.coopState.phase === 'standoff' || top.coopState.phase === 'retreat_rotate');
    if (isCoopOverlayActive) {
        if (times.active_coop_overlay === undefined) {
            times.active_coop_overlay = Date.now();
        }
    } else {
        times.active_coop_overlay = undefined;
    }
}

export function getLatestActiveTutorial(engine: GameEngine, top: Top): string | null {
    if (top.isAI) return null;
    
    updateTutorialTimestamps(engine, top);
    
    const times = (top as any).tutorialTimes;
    if (!times) return null;

    let latestType: string | null = null;
    let maxTime = -1;

    const types = ['game_start_spin', 'launch_pad', 'zombie_siege', 'boss_struggle', 'active_coop_overlay'];
    for (const type of types) {
        const time = times[type];
        if (time !== undefined && time > maxTime) {
            maxTime = time;
            latestType = type;
        }
    }

    return latestType;
}

export function clampToCapsule(engine: GameEngine, x: number, y: number, r: number): { x: number, y: number } {
    const R = 480 - r;
    const doorOpen = ['waiting_to_move', 'moving_down'].includes(engine.oneMinuteTransitionState);

    if (!doorOpen) {
        const centerY = engine.activeArenaCenterY ?? 540;
        if (x < 540) {
            const d = Math.hypot(x - 540, y - centerY);
            if (d > R) {
                return { x: 540 + ((x - 540) / (d || 1)) * R, y: centerY + ((y - centerY) / (d || 1)) * R };
            }
        } else if (x > 1380) {
            const d = Math.hypot(x - 1380, y - centerY);
            if (d > R) {
                return { x: 1380 + ((x - 1380) / (d || 1)) * R, y: centerY + ((y - centerY) / (d || 1)) * R };
            }
        } else {
            const minY = centerY - R;
            const maxY = centerY + R;
            if (y < minY) return { x, y: minY };
            if (y > maxY) return { x, y: maxY };
        }
    } else {
        const topCenterY = 540;
        const botCenterY = 1620;
        if (y < 1080) {
            if (x < 540) {
                const d = Math.hypot(x - 540, y - topCenterY);
                if (d > R) return { x: 540 + ((x - 540) / (d || 1)) * R, y: topCenterY + ((y - topCenterY) / (d || 1)) * R };
            } else if (x > 1380) {
                const d = Math.hypot(x - 1380, y - topCenterY);
                if (d > R) return { x: 1380 + ((x - 1380) / (d || 1)) * R, y: topCenterY + ((y - topCenterY) / (d || 1)) * R };
            } else {
                const minY = topCenterY - R;
                const maxY = topCenterY + R; // 1020
                if (y < minY) return { x, y: minY };
                if (y > maxY) {
                    if (x < 840 + r || x > 1080 - r) return { x, y: maxY };
                    else {
                        // in corridor, x is good, y is safely in gap so far
                        let nx = Math.max(840 + r, Math.min(1080 - r, x));
                        return { x: nx, y };
                    }
                }
            }
        } else {
            if (x < 540) {
                const d = Math.hypot(x - 540, y - botCenterY);
                if (d > R) return { x: 540 + ((x - 540) / (d || 1)) * R, y: botCenterY + ((y - botCenterY) / (d || 1)) * R };
            } else if (x > 1380) {
                const d = Math.hypot(x - 1380, y - botCenterY);
                if (d > R) return { x: 1380 + ((x - 1380) / (d || 1)) * R, y: botCenterY + ((y - botCenterY) / (d || 1)) * R };
            } else {
                const minY = botCenterY - R; // 1140
                const maxY = botCenterY + R;
                if (y > maxY) return { x, y: maxY };
                if (y < minY) {
                    if (x < 840 + r || x > 1080 - r) return { x, y: minY };
                    else {
                        let nx = Math.max(840 + r, Math.min(1080 - r, x));
                        return { x: nx, y };
                    }
                }
            }
        }
    }
    return { x, y };
}

export function clampTopWithinArena(engine: GameEngine, top: Top) {
    if (engine.oneMinuteTransitionState === 'moving_down' || engine.oneMinuteTransitionState === 'exploding') return;
    const cl = clampToCapsule(engine, top.x, top.y, top.radius || TOP_RADIUS);
    top.x = cl.x;
    top.y = cl.y;
}

export function findLaunchPadNearestTargetDir(engine: GameEngine, top: Top) {
    let nearestTarget: any = null;
    let minDist = Infinity;

    if (engine.gameMode === 'campaign') {
        engine.zombies.forEach(z => {
            if (z.markForDeletion || z.hp <= 0 || (z as any).isSiegeZombie) return;
            const d = Math.hypot(z.x - top.x, z.y - top.y);
            if (d < minDist) {
                minDist = d;
                nearestTarget = z;
            }
        });
    } else {
        engine.tops.forEach(other => {
            if (other.id === top.id || other.markForDeletion || other.isExploding || other.hp <= 0) return;
            const d = Math.hypot(other.x - top.x, other.y - top.y);
            if (d < minDist) {
                minDist = d;
                nearestTarget = other;
            }
        });
    }

    if (!nearestTarget) {
        engine.tops.forEach(other => {
            if (other.id === top.id || other.markForDeletion || other.isExploding || other.hp <= 0) return;
            const d = Math.hypot(other.x - top.x, other.y - top.y);
            if (d < minDist) {
                minDist = d;
                nearestTarget = other;
            }
        });
        engine.zombies.forEach(z => {
            if (z.markForDeletion || z.hp <= 0 || (z as any).isSiegeZombie) return;
            const d = Math.hypot(z.x - top.x, z.y - top.y);
            if (d < minDist) {
                minDist = d;
                nearestTarget = z;
            }
        });
    }

    if (nearestTarget) {
        const dx = nearestTarget.x - top.x;
        const dy = nearestTarget.y - top.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.1) {
            return { x: dx / dist, y: dy / dist };
        }
    }

    const dx = 960 - top.x;
    const dy = 540 - top.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0.1) {
        return { x: dx / dist, y: dy / dist };
    }
    return { x: 1, y: 0 };
}

export function dealLaunchPadSweepDamage(engine: GameEngine, top: Top, dt: number) {
    if (!(top as any).launchPadDamageCooldowns) {
        (top as any).launchPadDamageCooldowns = new Map<string, number>();
    }
    
    for (const [id, cd] of (top as any).launchPadDamageCooldowns.entries()) {
        if (cd > 0) {
            (top as any).launchPadDamageCooldowns.set(id, cd - dt);
        } else {
            (top as any).launchPadDamageCooldowns.delete(id);
        }
    }

    const isDashing = top.launchPadState === 'dashing';
    const range = top.radius + 30;
    
    const matchIdx = top.id.match(/\d+/);
    const playerIdx = matchIdx ? parseInt(matchIdx[0], 10) : 0;

    engine.zombies.forEach(z => {
        if (z.markForDeletion || z.hp <= 0 || (z as any).isSiegeZombie) return;
        const isBoss = z.type === 'zombie_boss';
        if (isBoss && top.launchPadBossDamaged) return;

        const zRadius = isBoss ? 70 : ((z.type === 'zombie_big' || z.type === 'zombie_bomb') ? 38 : 18);
        const dist = Math.hypot(z.x - top.x, z.y - top.y);
        if (dist <= range + zRadius) {
            const cd = (top as any).launchPadDamageCooldowns.get(z.id) ?? 0;
            if (cd <= 0) {
                const damage = 1;
                applyDamageToZombie(engine, z, damage, top.id);
                (top as any).launchPadDamageCooldowns.set(z.id, 0.15);
                
                // Per user request, collision no longer decreases player's top HP during the rainbow launch process!
                if (isBoss) {
                    top.launchPadBossDamaged = true;
                }

                z.flashTimer = 0.15;
                EffectSystem.addParticles(engine, z.x, z.y, '#eab308', 4, 150, 4);
                EffectSystem.addParticles(engine, z.x, z.y, top.color, 4, 180, 3);
                
                z.bounceTimer = isBoss ? 0.4 : 0.6;
                z.maxBounceTimer = isBoss ? 0.4 : 0.6;
                z.hitByDash = true;
                
                const dx = z.x - top.x;
                const dy = z.y - top.y;
                const dHypot = Math.hypot(dx, dy) || 1;
                const kbSpeed = isDashing ? 1600 : 800;
                z.knockbackSpeedStart = kbSpeed;
                z.vx = (dx / dHypot) * kbSpeed;
                z.vy = (dy / dHypot) * kbSpeed;

                if (isBoss) {
                    const boss = z as any;
                    if (boss.bossAttackState === 'dash' || boss.bossAttackState === 'warning') {
                        boss.bossAttackState = 'idle';
                        boss.bossNextAttackTime = 3.0;
                    }
                }

                if (z.hp <= 0) {
                    if (!handleZombieDeath(engine, z, top.id)) return;
                    SoundSystem.play('Attack_Slash_020');
                    z.markForDeletion = true;
                    const points = z.type === 'zombie_boss' ? 500 : ((z.type === 'zombie_big' || z.type === 'zombie_bomb') ? 50 : 10);
                    engine.addScore(playerIdx, points);
                    top.kills = (top.kills ?? 0) + 1;

                    engine.shockwaves.push({
                        x: z.x,
                        y: z.y,
                        radius: 0,
                        maxRadius: z.type === 'zombie_boss' ? 450 : 150,
                        speed: 600,
                        color: top.color,
                        thickness: 8,
                        life: 0.3,
                        maxLife: 0.3
                    });

                    // 彈射衝鋒擊殺非魔王敵人產生相同的放射狀星星爆點特效
                    if (!top.isAI && z.type !== 'zombie_boss') {
                        const launchContactX = z.x;
                        const launchContactY = z.y;
                        
                        // 1. Add central star-shaped burst
                        engine.particles.push({
                            x: launchContactX,
                            y: launchContactY,
                            vx: 0,
                            vy: 0,
                            life: 0.30,
                            maxLife: 0.30,
                            color: '#f97316',
                            size: 112.5, // reduced by 25%
                            isBossStarExplosion: true,
                            angle: Math.random() * Math.PI * 2,
                            rotationSpeed: (Math.random() - 0.5) * 3 * 1.5
                        });

                        // 2. Add radiating orange-yellow star sparks
                        const sparkCount = 12;
                        for (let i = 0; i < sparkCount; i++) {
                            const baseAng = (i / sparkCount) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
                            const sparkSpeed = (180 + Math.random() * 240) * 1.5;
                            const colors = ['#f97316', '#facc15', '#ea580c', '#eab308'];
                            const chosenColor = colors[Math.floor(Math.random() * colors.length)];
                            
                            engine.particles.push({
                                x: launchContactX,
                                y: launchContactY,
                                vx: Math.cos(baseAng) * sparkSpeed,
                                vy: Math.sin(baseAng) * sparkSpeed,
                                life: (0.4 + Math.random() * 0.2) / 1.5,
                                maxLife: 0.6 / 1.5,
                                color: chosenColor,
                                size: (18 + Math.random() * 12) * 0.75, // reduced by 25%
                                isStarSpark: true,
                                angle: Math.random() * Math.PI * 2,
                                rotationSpeed: (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 6) * 1.5
                            });
                        }
                    }
                }
            }
        }
    });

    engine.tops.forEach(other => {
        if (other.id === top.id || other.markForDeletion || other.isExploding || other.hp <= 0) return;
        const dist = Math.hypot(other.x - top.x, other.y - top.y);
        if (dist <= range + other.radius) {
            const cd = (top as any).launchPadDamageCooldowns.get(other.id) ?? 0;
            if (cd <= 0) {
                const isOtherInvulnerable = (other.rainbowSuperTimer !== undefined && other.rainbowSuperTimer > 0) || (other.breakoutOrbitTimer !== undefined && other.breakoutOrbitTimer > 0);
                if (!isOtherInvulnerable) {
                    const damage = 4;
                    other.hp = Math.max(0, other.hp - damage);
                    other.flashTimer = 0.15;
                    other.damageShockTimer = 0.2;
                }
                (top as any).launchPadDamageCooldowns.set(other.id, 0.3);
                
                // Per user request, collision no longer decreases player's top HP during the rainbow launch process!

                EffectSystem.addParticles(engine, other.x, other.y, '#ffffff', 5, 200, 3);
                EffectSystem.addParticles(engine, other.x, other.y, other.color, 4, 150, 2);

                const dx = other.x - top.x;
                const dy = other.y - top.y;
                const dHypot = Math.hypot(dx, dy) || 1;
                const kbSpeed = isDashing ? 2000 : 1200;
                other.vx = (dx / dHypot) * kbSpeed;
                other.vy = (dy / dHypot) * kbSpeed;
                
                other.state = 'standby';
                engine.screenShakeTimer = Math.max(engine.screenShakeTimer, isDashing ? 0.4 : 0.2);

                if (other.hp <= 0) {
                    other.isExploding = true;
                    other.explosionTimer = 1.2;
                    engine.addScore(playerIdx, 150);
                    top.kills = (top.kills ?? 0) + 1;
                    
                    engine.shockwaves.push({
                        x: other.x,
                        y: other.y,
                        radius: 10,
                        maxRadius: 280,
                        speed: 850,
                        color: other.color,
                        thickness: 10,
                        life: 0.4,
                        maxLife: 0.4
                    });
                }
            }
        }
    });
}

export function getTopScale(engine: GameEngine, top: any): number {
    return 1.0;
}



export function getRandomCapsuleBoundaryPoint(engine: GameEngine) {
    const centerY = 540;
    const leftCenterX = 540;
    const rightCenterX = 1380;
    const radius = 480;

    const r = Math.random();
    if (r < 0.25) {
        // Top straight line
        const x = leftCenterX + Math.random() * (rightCenterX - leftCenterX);
        return { x, y: centerY - radius };
    } else if (r < 0.50) {
        // Bottom straight line
        const x = leftCenterX + Math.random() * (rightCenterX - leftCenterX);
        return { x, y: centerY + radius };
    } else if (r < 0.75) {
        // Left arc (angle between Math.PI/2 and 3*Math.PI/2)
        const angle = Math.PI / 2 + Math.random() * Math.PI;
        const x = leftCenterX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        return { x, y };
    } else {
        // Right arc (angle between -Math.PI/2 and Math.PI/2)
        const angle = -Math.PI / 2 + Math.random() * Math.PI;
        const x = rightCenterX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        return { x, y };
    }
}

export function getNearestEnemy(engine: GameEngine, top: Top): Entity | null {
    let nearest = null;
    let md = Infinity;
    const targets = [...engine.zombies, ...engine.tops.filter(t => t.id !== top.id)];
    targets.forEach(t => {
        const d = Math.hypot(t.x-top.x, t.y-top.y);
        if (d < md) { md = d; nearest = t; }
    });
    return nearest;
}

export function applyLaunchPadAvoidance(engine: GameEngine, z: import('../types').Zombie) {
    if (z.bounceTimer !== undefined && z.bounceTimer > 0) return;
    if (z.introState && z.introState !== 'done') return;
    
    if (z.type === 'zombie_boss' && z.bossAttackState === 'earthquake_leap') return;
    if (z.type === 'zombie_big' && z.bigAttackState === 'earthquake_leap') return;
    if (z.type === 'zombie_bouncing' && z.bouncingAttackState === 'bouncing') return;

    engine.activeLaunchPads.forEach(pad => {
        const padRadius = pad.isMultiplayer ? 120 : 48;
        const avoidRadius = padRadius + z.radius + 20;
        const dx = z.x - pad.x;
        const dy = z.y - pad.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < avoidRadius && dist > 0) {
            const overlap = avoidRadius - dist;
            const force = (overlap / avoidRadius) * 200;
            z.vx += (dx / dist) * force;
            z.vy += (dy / dist) * force;
        }
    });
}

