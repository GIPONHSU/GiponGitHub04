const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src/game/zombies');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));

files.forEach(f => {
    const fullPath = path.join(dir, f);
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(/.*engine\.spawnTicket.*\n?/g, '');
    fs.writeFileSync(fullPath, content);
});
console.log("Done");
