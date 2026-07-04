const fs = require('fs');
const { JSDOM } = require('jsdom');

const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
global.window = dom.window;
global.document = dom.window.document;
global.self = global.window;
global.Blob = dom.window.Blob;
global.URL = dom.window.URL;

const THREE = require('three');
const { FBXLoader } = require('three/examples/jsm/loaders/FBXLoader.js');
const loader = new FBXLoader();

const chart = [
    {name: 'walk', start: 10, end: 70},
    {name: 'idle', start: 100, end: 212},
    {name: 'small_reward', start: 320, end: 363},
    {name: 'middle_reward', start: 460, end: 677},
    {name: 'middle_reward_failure', start: 780, end: 883},
    {name: 'charge_in', start: 940, end: 982},
    {name: 'charge_loop', start: 1200, end: 1223},
    {name: 'charge_success', start: 1250, end: 1289},
    {name: 'charge_failure', start: 1310, end: 1346},
    {name: 'standby', start: 1726, end: 1765},
    {name: 'ingame', start: 1781, end: 1968},
    {name: 'big_reward_jump', start: 2370, end: 2397},
    {name: 'big_reward', start: 2410, end: 2500},
    {name: 'big_reward_return', start: 2540, end: 2592},
    {name: 'final_reward', start: 2620, end: 2757},
    {name: 'out', start: 2780, end: 2836},
];

const files = ['Gorilla_atk.fbx', 'Gorilla_idle.fbx', 'Gorilla_walk.fbx'];
const fileClips = {};

files.forEach(file => {
    const buffer = fs.readFileSync('./public/FBX/' + file);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const fbx = loader.parse(arrayBuffer, '');
    fileClips[file] = fbx.animations[0];
});

chart.forEach(anim => {
    let bestFile = null;
    let maxMovement = 0;
    
    files.forEach(file => {
        const clip = fileClips[file];
        let movement = 0;
        for (let track of clip.tracks) {
            if (!track.name.includes('position') && !track.name.includes('quaternion')) continue;
            let valSize = track.name.includes('quaternion') ? 4 : 3;
            for(let i=1; i<track.times.length; i++) {
                let time = track.times[i] * 30;
                if (time >= anim.start && time <= anim.end) {
                    let diff = 0;
                    for(let j=0; j<valSize; j++) {
                        diff += Math.abs(track.values[i*valSize+j] - track.values[(i-1)*valSize+j]);
                    }
                    if (diff > 0.001) movement++;
                }
            }
        }
        if (movement > maxMovement) {
            maxMovement = movement;
            bestFile = file;
        }
    });
    console.log(`Animation ${anim.name}: best file is ${bestFile} with ${maxMovement} movements`);
});

