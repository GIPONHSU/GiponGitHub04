const fs = require('fs');

const fbxPath = './public/FBX/ANI_GraveRobber_Skill_Atk.fbx';
const buffer = fs.readFileSync(fbxPath);
let str = '';
for(let i=0; i<Math.min(buffer.length, 5000000); i++) {
    const c = buffer[i];
    if (c >= 32 && c <= 126) str += String.fromCharCode(c);
    else str += '\n';
}

const takes = str.split('\n').filter(s => s.length > 3 && (s.includes('AnimStack'))).join('\n');
fs.writeFileSync('temp.txt', takes);
