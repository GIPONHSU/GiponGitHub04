const fs = require('fs');
const content = fs.readFileSync('src/game/systems/GameUtils.ts', 'utf8');

const target = `if (z.type === 'zombie_small' || z.type === 'zombie_big' || z.type === 'zombie_bomb' || z.type === 'zombie_bouncing' || z.type === 'zombie_golden' || z.type === 'zombie_black') {`;

const replacement = `    // If the dying zombie was in a struggle clash, free the top!
    if ((z.type === 'zombie_boss' || z.type === 'zombie_black') && (z as any).bossAttackState === 'struggle_clash') {
        const targetTop = engine.tops.find(t => t.id === (z as any).bossWarningTargetId);
        if (targetTop) {
            targetTop.struggleJitterX = undefined;
            targetTop.struggleJitterY = undefined;
            (targetTop as any).struggleAnchorX = undefined;
            (targetTop as any).struggleAnchorY = undefined;
            targetTop.struggleMashCount = undefined;
            targetTop.struggleMashRequired = undefined;
        }
    }

    if (z.type === 'zombie_small' || z.type === 'zombie_big' || z.type === 'zombie_bomb' || z.type === 'zombie_bouncing' || z.type === 'zombie_golden' || z.type === 'zombie_black') {`;

fs.writeFileSync('src/game/systems/GameUtils.ts', content.replace(target, replacement));
console.log('patched');
