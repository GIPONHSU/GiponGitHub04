const fs = require('fs');
let content = fs.readFileSync('src/game/systems/EffectSystem.ts', 'utf8');

const regex = /other\.visualHp = other\.visualHp !== undefined \? Math\.max\(other\.hp, other\.visualHp\) : other\.hp;\s*addParticles\(engine, proj\.x, proj\.y, proj\.color, 8, 120, 3\);\s*addParticles\(engine, proj\.x, proj\.y, '#ffffff', 4, 140, 2\);\s*if \(proj\.isMachineGun\) {\s*proj\.life = 0;\s*engine\.shockwaves\.push\({\s*x: proj\.x, y: proj\.y, radius: 0, maxRadius: 30, speed: 200,\s*color: proj\.color, thickness: 3, life: 0\.15, maxLife: 0\.15\s*}\);\s*}/m;

const replacement = `other.visualHp = other.visualHp !== undefined ? Math.max(other.hp, other.visualHp) : other.hp;
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
                        }`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/game/systems/EffectSystem.ts', content);
console.log('regex replaced');
