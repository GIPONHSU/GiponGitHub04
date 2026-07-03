import fs from 'fs';

let content = fs.readFileSync('src/game/GameEngine.ts', 'utf-8');

content = content.replace(
    /if \(top\.superTimer !== undefined && top\.superTimer > 0\) \{\n(\s*)top\.superTimer = Math\.max\(0, top\.superTimer - dt\);\n\s*\}/g,
    `if (top.superTimer !== undefined && top.superTimer > 0) {\n$1top.superTimer = Math.max(0, top.superTimer - dt);\n$1}\n$1if (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0) {\n$1$1top.rainbowSuperTimer = Math.max(0, top.rainbowSuperTimer - dt);\n$1}`
);

fs.writeFileSync('src/game/GameEngine.ts', content);
console.log('Fixed GameEngine.ts');
