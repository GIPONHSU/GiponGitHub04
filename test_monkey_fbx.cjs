import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import fs from "fs";
import { JSDOM } from "jsdom";

const { window } = new JSDOM();
global.window = window;
global.document = window.document;

const loader = new FBXLoader();
const fbxData = fs.readFileSync("./public/FBX/Monkey.fbx");
const buffer = new Uint8Array(fbxData).buffer;

try {
  const fbx = loader.parse(buffer, "");
  console.log("Animations:", fbx.animations.length);
  fbx.animations.forEach((anim, i) => {
    console.log(`Anim ${i}: ${anim.name}, duration: ${anim.duration}`);
    console.log(`Tracks: ${anim.tracks.length}`);
  });
} catch (e) {
  console.error("Error parsing FBX", e);
}
