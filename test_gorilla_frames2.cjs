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
        const buffer = fs.readFileSync('./public/FBX/' + file);
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        const fbx = loader.parse(arrayBuffer, '');
        const clip = fbx.animations[0];
        if (clip) {
            let timeSet = new Set();
            for (const t of clip.tracks) {
                if (t.times.length > 0) {
                    t.times.forEach(time => timeSet.add(Math.round(time * 30)));
                }
            }
            const frames = Array.from(timeSet).sort((a,b) => a-b);
            console.log(`\n${file} frame ranges:`);
            let rangeStart = frames[0];
            let lastFrame = frames[0];
            for (let i=1; i<frames.length; i++) {
                if (frames[i] > lastFrame + 1) {
                    console.log(`  ${rangeStart} - ${lastFrame}`);
                    rangeStart = frames[i];
                }
                lastFrame = frames[i];
            }
            console.log(`  ${rangeStart} - ${lastFrame}`);
        }
    } catch(e) {
        console.log(`Failed to read ${file}`, e.message);
    }
});
