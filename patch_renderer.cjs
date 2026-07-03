const fs = require('fs');
const content = fs.readFileSync('src/game/renderers/EffectRenderer.ts', 'utf8');

const target = `            if (proj.isMachineGun) {
                // High-energy glowing capsule/pill shape for machine gun bullets
                const length = 16;
                const width = proj.radius * 2;
                
                ctx.shadowColor = proj.color;
                ctx.shadowBlur = 8;
                
                const grad = ctx.createLinearGradient(-length, 0, length/2, 0);
                grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
                grad.addColorStop(0.2, proj.color);
                grad.addColorStop(0.8, '#ffffff'); // bright core towards front
                grad.addColorStop(1, '#ffffff');`;

const replacement = `            if (proj.isMachineGun) {
                // High-energy glowing capsule/pill shape for machine gun bullets
                const length = 48;
                const width = proj.radius * 2.5;
                
                ctx.shadowColor = proj.color;
                ctx.shadowBlur = 12;
                
                const grad = ctx.createLinearGradient(-length, 0, length/2, 0);
                grad.addColorStop(0, 'rgba(253, 186, 116, 0)');
                grad.addColorStop(0.3, '#fdba74'); // light orange
                grad.addColorStop(0.7, '#facc15'); // yellow
                grad.addColorStop(1, '#ffffff'); // bright core towards front`;

fs.writeFileSync('src/game/renderers/EffectRenderer.ts', content.replace(target, replacement));
console.log('patched renderer');
