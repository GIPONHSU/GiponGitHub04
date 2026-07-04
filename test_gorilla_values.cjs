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
    
    // Find a track that has varied values
    for (let track of clip.tracks) {
        if (track.name.includes('position') || track.name.includes('quaternion')) {
            let changes = [];
            let valSize = track.name.includes('quaternion') ? 4 : 3;
            for(let i=1; i<track.times.length; i++) {
                let changed = false;
                for(let j=0; j<valSize; j++) {
                    if (Math.abs(track.values[i*valSize+j] - track.values[(i-1)*valSize+j]) > 0.001) {
                        changed = true; break;
                    }
                }
                if (changed) {
                    changes.push(Math.round(track.times[i]*30));
                }
            }
            if (changes.length > 50) { // arbitrary, enough to show movement
                let minFrame = Math.min(...changes);
                let maxFrame = Math.max(...changes);
                console.log(`${file} track ${track.name} moves from frame ${minFrame} to ${maxFrame}`);
                return;
            }
        }
    }
}
['Gorilla_atk.fbx', 'Gorilla_idle.fbx', 'Gorilla_walk.fbx'].forEach(checkMovement);
