import fs from 'fs';

const files = {
    'src/game/GameEngine.ts': [
        {
            old: /const isInvulnerable = \(top\.rainbowSuperTimer !== undefined && top\.rainbowSuperTimer > 0\) \|\| \(top\.breakoutOrbitTimer !== undefined && top\.breakoutOrbitTimer > 0\)\$5;/g,
            new: 'const isInvulnerable = (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) || (top.breakoutOrbitTimer !== undefined && top.breakoutOrbitTimer > 0);'
        },
        {
            old: /const isInvulnerable = \(top\.rainbowSuperTimer !== undefined && top\.rainbowSuperTimer > 0\) \|\| \(top\.breakoutOrbitTimer !== undefined && top\.breakoutOrbitTimer > 0\) \|\| top\.hp <= 0\$5;/g,
            new: 'const isInvulnerable = (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) || (top.breakoutOrbitTimer !== undefined && top.breakoutOrbitTimer > 0) || top.hp <= 0;'
        }
    ],
    'src/game/systems/CollisionSystem.ts': [
        {
            old: /const isInvulnerable = \(topOther\.rainbowSuperTimer !== undefined && topOther\.rainbowSuperTimer > 0\) \|\| \(topOther\.breakoutOrbitTimer !== undefined && topOther\.breakoutOrbitTimer > 0\)\$5;/g,
            new: 'const isInvulnerable = (topOther.rainbowSuperTimer !== undefined && topOther.rainbowSuperTimer > 0) || (topOther.breakoutOrbitTimer !== undefined && topOther.breakoutOrbitTimer > 0) || (topOther as any).hp <= 0;'
        },
        {
            old: /const isInvulnerable = \(top\.rainbowSuperTimer !== undefined && top\.rainbowSuperTimer > 0\) \|\| \(top\.breakoutOrbitTimer !== undefined && top\.breakoutOrbitTimer > 0\)\$5;/g,
            new: 'const isInvulnerable = (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) || (top.breakoutOrbitTimer !== undefined && top.breakoutOrbitTimer > 0);'
        }
    ],
    'src/game/systems/GameUtils.ts': [
        {
            old: /const isOtherInvulnerable = \(other\.rainbowSuperTimer !== undefined && other\.rainbowSuperTimer > 0\) \|\| \(other\.breakoutOrbitTimer !== undefined && other\.breakoutOrbitTimer > 0\)\$4;/g,
            new: 'const isOtherInvulnerable = (other.rainbowSuperTimer !== undefined && other.rainbowSuperTimer > 0) || (other.breakoutOrbitTimer !== undefined && other.breakoutOrbitTimer > 0);'
        }
    ],
    'src/game/zombies/BigZombie.ts': [
        {
            old: /const isInvulnerable = \(top\.rainbowSuperTimer !== undefined && top\.rainbowSuperTimer > 0\) \|\| \(top\.breakoutOrbitTimer !== undefined && top\.breakoutOrbitTimer > 0\)\$5;/g,
            new: 'const isInvulnerable = (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) || (top.breakoutOrbitTimer !== undefined && top.breakoutOrbitTimer > 0);'
        }
    ],
    'src/game/zombies/BombZombie.ts': [
        {
            old: /const isInvulnerable = \(top\.rainbowSuperTimer !== undefined && top\.rainbowSuperTimer > 0\) \|\| \(top\.breakoutOrbitTimer !== undefined && top\.breakoutOrbitTimer > 0\)\$5;/g,
            new: 'const isInvulnerable = (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) || (top.breakoutOrbitTimer !== undefined && top.breakoutOrbitTimer > 0);'
        }
    ],
    'src/game/zombies/BossZombie.ts': [
        {
            old: /const isInvulnerable = \(top\.rainbowSuperTimer !== undefined && top\.rainbowSuperTimer > 0\) \|\| \(top\.breakoutOrbitTimer !== undefined && top\.breakoutOrbitTimer > 0\)\$5;/g,
            new: 'const isInvulnerable = (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) || (top.breakoutOrbitTimer !== undefined && top.breakoutOrbitTimer > 0);'
        }
    ],
    'src/game/zombies/BouncingZombie.ts': [
        {
            old: /const isInvulnerable = \(top\.rainbowSuperTimer !== undefined && top\.rainbowSuperTimer > 0\) \|\| \(top\.breakoutOrbitTimer !== undefined && top\.breakoutOrbitTimer > 0\)\$5;/g,
            new: 'const isInvulnerable = (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) || (top.breakoutOrbitTimer !== undefined && top.breakoutOrbitTimer > 0);'
        }
    ]
};

for (const [file, replacements] of Object.entries(files)) {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf-8');
        for (const { old, new: repl } of replacements) {
            content = content.replace(old, repl);
        }
        fs.writeFileSync(file, content);
        console.log('Fixed ' + file);
    }
}
