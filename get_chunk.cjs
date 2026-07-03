const fs = require('fs');
const content = fs.readFileSync('src/game/systems/EffectSystem.ts', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(410, 430).join('\n'));
