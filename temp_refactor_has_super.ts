import fs from 'fs';

let content = fs.readFileSync('src/game/systems/EventSystem.ts', 'utf-8');
content = content.replace(
    /const hasSuperPlayer = engine\.tops\.some\(t => t\.superTimer !== undefined && t\.superTimer > 0\);/g,
    'const hasSuperPlayer = engine.tops.some(t => (t.superTimer !== undefined && t.superTimer > 0) || (t.rainbowSuperTimer !== undefined && t.rainbowSuperTimer > 0));'
);
fs.writeFileSync('src/game/systems/EventSystem.ts', content);

content = fs.readFileSync('src/game/systems/SpawnSystem.ts', 'utf-8');
content = content.replace(
    /const hasSuperPlayer = engine\.tops\.some\(t => t\.superTimer !== undefined && t\.superTimer > 0\);/g,
    'const hasSuperPlayer = engine.tops.some(t => (t.superTimer !== undefined && t.superTimer > 0) || (t.rainbowSuperTimer !== undefined && t.rainbowSuperTimer > 0));'
);
fs.writeFileSync('src/game/systems/SpawnSystem.ts', content);

console.log('Fixed hasSuperPlayer');
