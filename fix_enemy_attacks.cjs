const fs = require('fs');
const path = require('path');

function processFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const rep of replacements) {
        content = content.replace(rep.search, rep.replace);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

// 1. CollisionSystem.ts
processFile('src/game/systems/CollisionSystem.ts', [
    {
        search: /SoundSystem\.play\('SE-Hurt1'\);\s+top\.hitCooldown = 1\.0; \/\/ 1-second invulnerability protection\s+top\.smallZombieHitCooldown = 1\.0;\s+top\.flashTimer = 0\.15;\s+top\.damageShockTimer = 0\.25;\s+top\.hpLossTimer = 0\.5;\s+top\.visualHp = top\.visualHp !== undefined \? Math\.max\(top\.hp, top\.visualHp\) : top\.hp;/g,
        replace: `SoundSystem.play('SE-Hurt1');
                top.hitCooldown = 1.0; // 1-second invulnerability protection
                top.smallZombieHitCooldown = 1.0;

                top.flashTimer = 0.15;
                top.damageShockTimer = 0.25;
                
                top.spin = Math.max(10, (top.spin ?? 1000) - 500);`
    },
    {
        search: /SoundSystem\.play\('SE-Hurt1'\);\s+top\.hitCooldown = 0\.8; \/\/ 0\.8 seconds protection frame\s+top\.flashTimer = 0\.25;\s+top\.damageShockTimer = 0\.45;\s+top\.hpLossTimer = 0\.5;\s+top\.visualHp = top\.visualHp !== undefined \? Math\.max\(top\.hp, top\.visualHp\) : top\.hp;/g,
        replace: `SoundSystem.play('SE-Hurt1');
                        top.hitCooldown = 0.8; // 0.8 seconds protection frame
                        top.flashTimer = 0.25;
                        top.damageShockTimer = 0.45;
                        
                        top.spin = Math.max(10, (top.spin ?? 1000) - 500);`
    }
]);

// 2. BigZombie.ts
processFile('src/game/zombies/BigZombie.ts', [
    {
        search: /SoundSystem\.play\('SE-Hurt1'\);\s+top\.hitCooldown = 1\.0; \/\/ 1-second invulnerability protection\s+top\.flashTimer = 0\.25;\s+top\.damageShockTimer = 0\.45;/g,
        replace: `SoundSystem.play('SE-Hurt1');
                                top.hitCooldown = 1.0; // 1-second invulnerability protection
                                top.flashTimer = 0.25;
                                top.damageShockTimer = 0.45;
                                top.spin = Math.max(10, (top.spin ?? 1000) - 500);`
    }
]);

// 3. BombZombie.ts
processFile('src/game/zombies/BombZombie.ts', [
    {
        search: /SoundSystem\.play\('SE-Hurt1'\);\s+top\.hitCooldown = 1\.0; \/\/ 1-second invulnerability protection\s+top\.flashTimer = 0\.25;\s+top\.damageShockTimer = 0\.45;/g,
        replace: `SoundSystem.play('SE-Hurt1');
                                top.hitCooldown = 1.0; // 1-second invulnerability protection
                                top.flashTimer = 0.25;
                                top.damageShockTimer = 0.45;
                                top.spin = Math.max(10, (top.spin ?? 1000) - 500);`
    },
    {
        search: /SoundSystem\.play\('SE-Hurt1'\);\s+top\.hitCooldown = 1\.0;\s+top\.flashTimer = 0\.25;\s+top\.damageShockTimer = 0\.45;/g,
        replace: `SoundSystem.play('SE-Hurt1');
                                top.hitCooldown = 1.0;
                                top.flashTimer = 0.25;
                                top.damageShockTimer = 0.45;
                                top.spin = Math.max(10, (top.spin ?? 1000) - 500);`
    }
]);

// 4. BouncingZombie.ts
processFile('src/game/zombies/BouncingZombie.ts', [
    {
        search: /SoundSystem\.play\('SE-Hurt1'\);\s+top\.hitCooldown = 1\.0; \/\/ 1-second invulnerability protection\s+top\.flashTimer = 0\.25;\s+top\.damageShockTimer = 0\.45;/g,
        replace: `SoundSystem.play('SE-Hurt1');
                                top.hitCooldown = 1.0; // 1-second invulnerability protection
                                top.flashTimer = 0.25;
                                top.damageShockTimer = 0.45;
                                top.spin = Math.max(10, (top.spin ?? 1000) - 500);`
    },
    {
        search: /SoundSystem\.play\('SE-Hurt1'\);\s+top\.hitCooldown = 1\.0;\s+top\.flashTimer = 0\.25;\s+top\.damageShockTimer = 0\.45;/g,
        replace: `SoundSystem.play('SE-Hurt1');
                                top.hitCooldown = 1.0;
                                top.flashTimer = 0.25;
                                top.damageShockTimer = 0.45;
                                top.spin = Math.max(10, (top.spin ?? 1000) - 500);`
    }
]);

// 5. BlackZombie.ts
processFile('src/game/zombies/BlackZombie.ts', [
    {
        search: /targetTop\.spin = 10; \/\/ 轉速扣減至最低\s+if \(targetTop\.state === 'dash'\)/g,
        replace: `targetTop.spin = Math.max(10, (targetTop.spin ?? 1000) - 500); // 扣減5格轉速
                    
                    if (targetTop.state === 'dash')`
    },
    {
        search: /targetTop\.hpLossTimer = 0\.5;\s+targetTop\.visualHp = targetTop\.visualHp !== undefined \? Math\.max\(targetTop\.hp, targetTop\.visualHp\) : targetTop\.hp;/g,
        replace: `// hpLossTimer removed since we deduct spin instead`
    }
]);

