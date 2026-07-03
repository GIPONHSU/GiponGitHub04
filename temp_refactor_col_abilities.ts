import fs from 'fs';

let content = fs.readFileSync('src/game/systems/CollisionSystem.ts', 'utf-8');

content = content.replace(
    /const isSuper = top\.superTimer !== undefined && top\.superTimer > 0;/g,
    'const isSuper = (top.superTimer !== undefined && top.superTimer > 0) || (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0);'
);

content = content.replace(
    /const isSuperA = ta\.superTimer !== undefined && ta\.superTimer > 0;/g,
    'const isSuperA = (ta.superTimer !== undefined && ta.superTimer > 0) || (ta.rainbowSuperTimer !== undefined && ta.rainbowSuperTimer > 0);'
);

content = content.replace(
    /const isSuperB = tb\.superTimer !== undefined && tb\.superTimer > 0;/g,
    'const isSuperB = (tb.superTimer !== undefined && tb.superTimer > 0) || (tb.rainbowSuperTimer !== undefined && tb.rainbowSuperTimer > 0);'
);

content = content.replace(
    /const isSuper = \(top\.superTimer !== undefined && top\.superTimer > 0\) \|\| \(top\.breakoutOrbitTimer !== undefined && top\.breakoutOrbitTimer > 0\);/g,
    'const isSuper = (top.superTimer !== undefined && top.superTimer > 0) || (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) || (top.breakoutOrbitTimer !== undefined && top.breakoutOrbitTimer > 0);'
);

// also check if there are other superTimer checks in CollisionSystem
content = content.replace(
    /const isSpecialCharge = !!\(\(top\.state === 'dash'\) \|\| \(top\.superTimer !== undefined && top\.superTimer > 0\) \|\|/g,
    "const isSpecialCharge = !!((top.state === 'dash') || (top.superTimer !== undefined && top.superTimer > 0) || (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) ||"
);

content = content.replace(
    /const isInterruptingDash = !!\(\(top\.state === 'dash'\) \|\| \(top\.superTimer !== undefined && top\.superTimer > 0\) \|\|/g,
    "const isInterruptingDash = !!((top.state === 'dash') || (top.superTimer !== undefined && top.superTimer > 0) || (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) ||"
);

fs.writeFileSync('src/game/systems/CollisionSystem.ts', content);
console.log('Fixed CollisionSystem.ts abilities');
