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

function checkMovement(file) {
    const buffer = fs.readFileSync('./public/FBX/' + file);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    const fbx = loader.parse(arrayBuffer, '');
    const clip = fbx.animations[0];
    if (!clip) return;
    
    // Find all ranges of movement
    let movingFrames = new Set();
    for (let track of clip.tracks) {
        if (track.name.includes('position') || track.name.includes('quaternion')) {
            let valSize = track.name.includes('quaternion') ? 4 : 3;
            for(let i=1; i<track.times.length; i++) {
                let changed = false;
                for(let j=0; j<valSize; j++) {
                    if (Math.abs(track.values[i*valSize+j] - track.values[(i-1)*valSize+j]) > 0.001) {
                        changed = true; break;
                    }
                }
                if (changed) {
                    movingFrames.add(Math.round(track.times[i]*30));
                }
            }
        }
    }
    const frames = Array.from(movingFrames).sort((a,b) => a-b);
    let rangeStart = frames[0];
    let lastFrame = frames[0];
    let ranges = [];
    for (let i=1; i<frames.length; i++) {
        if (frames[i] > lastFrame + 2) {
            ranges.push(`${rangeStart}-${lastFrame}`);
            rangeStart = frames[i];
        }
        lastFrame = frames[i];
    }
    ranges.push(`${rangeStart}-${lastFrame}`);
    console.log(`${file} moving ranges: ${ranges.join(', ')}`);
}
['Gorilla_atk.fbx', 'Gorilla_idle.fbx', 'Gorilla_walk.fbx'].forEach(checkMovement);
