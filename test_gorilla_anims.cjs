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

['Gorilla_atk.fbx', 'Gorilla_idle.fbx', 'Gorilla_walk.fbx'].forEach(file => {
    try {
        const buffer = fs.readFileSync('./FBX/' + file);
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        const fbx = loader.parse(arrayBuffer, '');
        const clip = fbx.animations[0];
        if (clip) {
            let minTime = Infinity;
            let maxTime = -Infinity;
            for (const t of clip.tracks) {
                if (t.times.length > 0) {
                    minTime = Math.min(minTime, t.times[0]);
                    maxTime = Math.max(maxTime, t.times[t.times.length - 1]);
                }
            }
            console.log(`${file} duration: ${clip.duration}, frame range: ${Math.round(minTime * 30)} - ${Math.round(maxTime * 30)}`);
        } else {
            console.log(`${file} has no animations`);
        }
    } catch(e) {
        console.log(`Failed to read ${file}`, e.message);
    }
});
