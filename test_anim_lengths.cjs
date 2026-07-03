const fs = require('fs');
const { JSDOM } = require('jsdom');
const dom = new JSDOM(`<!DOCTYPE html><body></body>`);
global.window = dom.window;
global.document = dom.window.document;
global.self = global.window;
const THREE = require('three');
const { FBXLoader } = require('three/examples/jsm/loaders/FBXLoader.js');
const loader = new FBXLoader();
['Gorilla_atk.fbx', 'Gorilla_idle.fbx', 'Gorilla_walk.fbx'].forEach(file => {
    try {
        const buffer = fs.readFileSync('./FBX/' + file);
        const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
        const fbx = loader.parse(arrayBuffer, '');
        console.log(file, "has clips:");
        fbx.animations.forEach(anim => console.log(" -", anim.name, "duration:", anim.duration, "frames at 30fps:", anim.duration * 30));
    } catch(e) { console.error(e); }
});
