const fs = require('fs');
const buffer = fs.readFileSync('public/FBX/ANI_MobBoss_All.fbx');
console.log("Boss size:", buffer.byteLength);
const buffer2 = fs.readFileSync('public/FBX/M_ZombieMan.fbx');
console.log("Standard size:", buffer2.byteLength);
