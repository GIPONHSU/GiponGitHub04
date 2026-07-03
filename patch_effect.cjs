const fs = require('fs');
let content = fs.readFileSync('src/game/systems/EffectSystem.ts', 'utf8');

// 1. Change radius
content = content.replace(`radius: 3, // Smaller particles
                            color: '#facc15', // yellow bullet`, `radius: 6, // Doubled radius
                            color: '#facc15', // yellow bullet`);

// 2. Collision with Zombies
content = content.replace(`                z.flashTimer = 0.15;
                addParticles(engine, z.x, z.y, proj.color, 8, 120, 3);
                addParticles(engine, z.x, z.y, '#ffffff', 4, 140, 2);
                
                if (proj.isMachineGun) {
                    proj.life = 0;
                    engine.shockwaves.push({
                        x: proj.x, y: proj.y, radius: 0, maxRadius: 30, speed: 200,
                        color: proj.color, thickness: 3, life: 0.15, maxLife: 0.15
                    });
                }`, `                z.flashTimer = 0.15;
                if (!proj.isMachineGun) {
                    addParticles(engine, z.x, z.y, proj.color, 8, 120, 3);
                    addParticles(engine, z.x, z.y, '#ffffff', 4, 140, 2);
                }
                
                if (proj.isMachineGun) {
                    proj.life = 0;
                    engine.shockwaves.push({
                        x: proj.x, y: proj.y, radius: 10, maxRadius: 100, speed: 500,
                        color: 'rgba(253, 186, 116, 0.9)', thickness: 12, life: 0.3, maxLife: 0.3
                    });
                }`);

// 3. Collision with Tops
content = content.replace(`                        other.visualHp = other.visualHp !== undefined ? Math.max(other.hp, other.visualHp) : other.hp;
                        addParticles(engine, proj.x, proj.y, proj.color, 8, 120, 3);
                        addParticles(engine, proj.x, proj.y, '#ffffff', 4, 140, 2);
                        
                        if (proj.isMachineGun) {
                            proj.life = 0;
                            engine.shockwaves.push({
                                x: proj.x, y: proj.y, radius: 0, maxRadius: 30, speed: 200,
                                color: proj.color, thickness: 3, life: 0.15, maxLife: 0.15
                            });
                        }`, `                        other.visualHp = other.visualHp !== undefined ? Math.max(other.hp, other.visualHp) : other.hp;
                        if (!proj.isMachineGun) {
                            addParticles(engine, proj.x, proj.y, proj.color, 8, 120, 3);
                            addParticles(engine, proj.x, proj.y, '#ffffff', 4, 140, 2);
                        }
                        
                        if (proj.isMachineGun) {
                            proj.life = 0;
                            engine.shockwaves.push({
                                x: proj.x, y: proj.y, radius: 10, maxRadius: 100, speed: 500,
                                color: 'rgba(253, 186, 116, 0.9)', thickness: 12, life: 0.3, maxLife: 0.3
                            });
                        }`);

// 4. Collision with Obstacles
content = content.replace(`                    if (o.type === 'obstacle_barrel') {
                        if (o.durability === undefined) o.durability = 1;
                        o.durability -= proj.damage;
                        o.flashTimer = 0.15;
                        addParticles(engine, proj.x, proj.y, proj.color, 8, 100, 3);`, `                    if (o.type === 'obstacle_barrel') {
                        if (o.durability === undefined) o.durability = 1;
                        o.durability -= proj.damage;
                        o.flashTimer = 0.15;
                        if (!proj.isMachineGun) {
                            addParticles(engine, proj.x, proj.y, proj.color, 8, 100, 3);
                        }`);

content = content.replace(`                    } else {
                        // hit crate
                        addParticles(engine, proj.x, proj.y, proj.color, 6, 100, 2);
                    }
                    
                    if (proj.isMachineGun) {
                        proj.life = 0;
                        engine.shockwaves.push({
                            x: proj.x, y: proj.y, radius: 0, maxRadius: 30, speed: 200,
                            color: proj.color, thickness: 3, life: 0.15, maxLife: 0.15
                        });
                    }`, `                    } else {
                        // hit crate
                        if (!proj.isMachineGun) {
                            addParticles(engine, proj.x, proj.y, proj.color, 6, 100, 2);
                        }
                    }
                    
                    if (proj.isMachineGun) {
                        proj.life = 0;
                        engine.shockwaves.push({
                            x: proj.x, y: proj.y, radius: 10, maxRadius: 100, speed: 500,
                            color: 'rgba(253, 186, 116, 0.9)', thickness: 12, life: 0.3, maxLife: 0.3
                        });
                    }`);

fs.writeFileSync('src/game/systems/EffectSystem.ts', content);
console.log('patched effects');
