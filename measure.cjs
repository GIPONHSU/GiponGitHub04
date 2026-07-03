const fs = require('fs');
const buffer = fs.readFileSync('FBX/ANI_MobBoss_All.fbx');
console.log("Boss size:", buffer.byteLength);
const buffer2 = fs.readFileSync('FBX/M_ZombieMan.fbx');
console.log("Standard size:", buffer2.byteLength);
