import fs from 'fs';

let content = fs.readFileSync('src/game/GameEngine.ts', 'utf-8');

// Replace all occurrences of `top.superTimer !== undefined && top.superTimer > 0`
// EXCEPT inside the `if (top.superTimer !== undefined && top.superTimer > 0) {` ticking blocks we just added.
// It's safer to just replace them carefully.

const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    // Skip ticking lines
    if (lines[i].includes('top.superTimer = Math.max')) continue;
    if (lines[i].trim() === 'if (top.superTimer !== undefined && top.superTimer > 0) {') continue;

    // Replace
    lines[i] = lines[i].replace(
        /top\.superTimer !== undefined && top\.superTimer > 0/g,
        '((top.superTimer !== undefined && top.superTimer > 0) || (top.rainbowSuperTimer !== undefined && top.rainbowSuperTimer > 0))'
    );
}

fs.writeFileSync('src/game/GameEngine.ts', lines.join('\n'));
console.log('Fixed GameEngine.ts abilities');
