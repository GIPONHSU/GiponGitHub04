const THREE = require('three');
const fs = require('fs');

global.window = {};
global.document = {
  createElementNS: (ns, name) => {
    return {
        width: 0, height: 0,
        getContext: () => ({ drawImage: () => {}, getImageData: () => ({ data: [] }) }),
        src: ''
    };
  },
  createElement: (name) => { return global.document.createElementNS('', name); }
};

const { FBXLoader } = require('three/examples/jsm/loaders/FBXLoader.js');

const loader = new FBXLoader();
const buffer = fs.readFileSync('public/FBX/Monkey.fbx');
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

try {
  const object = loader.parse(arrayBuffer, '');
  console.log("Animations count:", object.animations.length);
  object.animations.forEach(anim => {
      console.log("Name:", anim.name, "Duration:", anim.duration);
  });
} catch (e) {
  console.error(e);
}
