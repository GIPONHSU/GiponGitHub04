import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { TGALoader } from "three/examples/jsm/loaders/TGALoader.js";

interface ModelData {
  model: THREE.Group;
  mixer: THREE.AnimationMixer;
  walkAction: THREE.AnimationAction;
  deadAction: THREE.AnimationAction;
  attackAction: THREE.AnimationAction;
  jumpEAction?: THREE.AnimationAction;
  headBone?: THREE.Object3D;
  extraActions?: Record<string, THREE.AnimationAction>;
}

class Zombie3DRenderer {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;

  models: {
    man?: ModelData;
    girl?: ModelData;
    bombman?: ModelData;
    mummy?: ModelData;
    dog?: ModelData;
    football?: ModelData;
    golden?: ModelData;
    gorilla?: ModelData;
    monkey?: ModelData;
    box?: any;
  } = {};

  get isLoaded() {
    return (
      !!this.models.man &&
      !!this.models.girl &&
      !!this.models.bombman &&
      !!this.models.mummy &&
      !!this.models.dog &&
      !!this.models.football &&
      !!this.models.golden &&
      !!this.models.gorilla &&
      !!this.models.monkey &&
      !!this.models.box
    );
  }

  size = 1024;

  constructor() {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(this.size, this.size);
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();

    const d = 100;
    this.camera = new THREE.OrthographicCamera(-d, d, d, -d, 1, 1000);
    this.camera.position.set(0, 300, 0);
    this.camera.up.set(0, 0, -1);
    this.camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(100, 200, 100);
    this.scene.add(dirLight);

    this.loadModels();
  }

  loadModels() {
    const fbxLoader = new FBXLoader();
    const tgaLoader = new TGALoader();
    const texLoader = new THREE.TextureLoader();

    // Load Man
    fbxLoader.load("/FBX/M_ZombieMan.fbx", (object) => {
      tgaLoader.load("/Textures/T_ZombieMan_D.tga", (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        let headBone: THREE.Object3D | undefined;
        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              map: texture,
              emissive: 0xffffff,
              emissiveMap: texture,
              emissiveIntensity: 0.2,
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
          if (child.name.includes("Head") && !child.name.includes("Nub")) {
            headBone = child;
          }
        });

        object.visible = false;
        object.scale.set(1.2, 1.2, 1.2);

        this.scene.add(object);

        if (object.animations && object.animations.length > 0) {
          const baseClip = object.animations[0];
          const fps = 30;
          const walkClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Walk",
            10,
            55,
            fps,
          );
          const deadClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Dead",
            185,
            205,
            fps,
          );
          const attackClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Attack_E",
            255,
            265,
            fps,
          );

          const mixer = new THREE.AnimationMixer(object);
          const walkAction = mixer.clipAction(walkClip);
          const deadAction = mixer.clipAction(deadClip);
          const attackAction = mixer.clipAction(attackClip);

          walkAction.play();
          walkAction.setEffectiveWeight(1);
          deadAction.play();
          deadAction.setEffectiveWeight(0);
          attackAction.play();
          attackAction.setEffectiveWeight(0);

          this.models.man = {
            model: object,
            mixer,
            walkAction,
            deadAction,
            attackAction,
            headBone,
          };
        }
      });
    });

    // Load Girl
    fbxLoader.load("/FBX/M_ZombieGirl.fbx", (object) => {
      texLoader.load("/Textures/T_ZombieGirl_Diffuse.png", (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        let headBone: THREE.Object3D | undefined;
        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              map: texture,
              emissive: 0xffffff,
              emissiveMap: texture,
              emissiveIntensity: 0.2,
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
          if (child.name.includes("Head") && !child.name.includes("Nub")) {
            headBone = child;
          }
        });

        object.visible = false;
        object.scale.set(1.2, 1.2, 1.2);

        this.scene.add(object);

        if (object.animations && object.animations.length > 0) {
          const baseClip = object.animations[0];
          const fps = 30;
          const walkClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Walk",
            90,
            130,
            fps,
          );
          const deadClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Dead",
            140,
            161,
            fps,
          );
          const attackClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Attack_E",
            215,
            225,
            fps,
          );

          const mixer = new THREE.AnimationMixer(object);
          const walkAction = mixer.clipAction(walkClip);
          const deadAction = mixer.clipAction(deadClip);
          const attackAction = mixer.clipAction(attackClip);

          walkAction.play();
          walkAction.setEffectiveWeight(1);
          deadAction.play();
          deadAction.setEffectiveWeight(0);
          attackAction.play();
          attackAction.setEffectiveWeight(0);

          this.models.girl = {
            model: object,
            mixer,
            walkAction,
            deadAction,
            attackAction,
            headBone,
          };
        }
      });
    });

    // Load Bombman
    fbxLoader.load("/FBX/BombMan_Skin.fbx", (object) => {
      texLoader.load("/Textures/T_Bombman_Diffuse.png", (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        let headBone: THREE.Object3D | undefined;
        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              map: texture,
              emissive: 0xffffff,
              emissiveMap: texture,
              emissiveIntensity: 0.2,
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
          if (child.name.includes("Head") && !child.name.includes("Nub")) {
            headBone = child;
          }
        });

        object.visible = false;
        object.scale.set(0.48, 0.48, 0.48); // Reduce size by 20%
        this.scene.add(object);

        if (object.animations && object.animations.length > 0) {
          const baseClip = object.animations[0];
          const fps = 30;
          const walkClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Walk",
            10,
            30,
            fps,
          );
          const deadClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Dead02",
            50,
            90,
            fps,
          );
          const attackClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Hurt01",
            100,
            198,
            fps,
          );

          const mixer = new THREE.AnimationMixer(object);
          const walkAction = mixer.clipAction(walkClip);
          const deadAction = mixer.clipAction(deadClip);
          const attackAction = mixer.clipAction(attackClip);

          walkAction.play();
          walkAction.setEffectiveWeight(1);
          deadAction.play();
          deadAction.setEffectiveWeight(0);
          attackAction.play();
          attackAction.setEffectiveWeight(0);

          this.models.bombman = {
            model: object,
            mixer,
            walkAction,
            deadAction,
            attackAction,
            headBone,
          };
        }
      });
    });

    // Load Mummy
    fbxLoader.load("/FBX/Mummy_Ani.fbx", (object) => {
      texLoader.load("/Textures/T_Mummy_Diffuse.png", (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        let headBone: THREE.Object3D | undefined;
        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              map: texture,
              emissive: 0xffffff,
              emissiveMap: texture,
              emissiveIntensity: 0.2,
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
          if (child.name.includes("Head") && !child.name.includes("Nub")) {
            headBone = child;
          }
        });

        object.visible = false;
        object.scale.set(0.36, 0.36, 0.36); // Keep it large in WebGL for high resolution -> increased by 20%
        this.scene.add(object);

        if (object.animations && object.animations.length > 0) {
          const baseClip = object.animations[0];
          const fps = 30;

          const walkClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Walk",
            10,
            124,
            fps,
          );
          const flySClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Fly_S",
            1265,
            1330,
            fps,
          );
          const deadClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Dead",
            779,
            859,
            fps,
          );

          const mixer = new THREE.AnimationMixer(object);
          const walkAction = mixer.clipAction(walkClip);
          const attackAction = mixer.clipAction(flySClip);
          const deadAction = mixer.clipAction(deadClip);

          walkAction.play();
          walkAction.setEffectiveWeight(1);
          deadAction.play();
          deadAction.setEffectiveWeight(0);
          attackAction.play();
          attackAction.setEffectiveWeight(0);

          this.models.mummy = {
            model: object,
            mixer,
            walkAction,
            deadAction,
            attackAction,
            headBone,
          };
        }
      });
    });

    // Load Dog
    fbxLoader.load("/FBX/M_ZombieDog.fbx", (object) => {
      texLoader.load("/Textures/T_ZombieDog_diffuse_A.jpg", (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        let headBone: THREE.Object3D | undefined;
        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => {
                if ("map" in mat) {
                  (mat as any).map = texture;
                  (mat as any).emissiveMap = texture;
                  (mat as any).emissive = new THREE.Color(0xffffff);
                  (mat as any).emissiveIntensity = 0.7;
                  mat.needsUpdate = true;
                } else {
                  mesh.material = new THREE.MeshStandardMaterial({
                    map: texture,
                    emissiveMap: texture,
                    emissive: 0xffffff,
                    emissiveIntensity: 0.7,
                  });
                }
              });
            } else {
              if ("map" in mesh.material) {
                (mesh.material as any).map = texture;
                (mesh.material as any).emissiveMap = texture;
                (mesh.material as any).emissive = new THREE.Color(0xffffff);
                (mesh.material as any).emissiveIntensity = 0.7;
                mesh.material.needsUpdate = true;
              } else {
                mesh.material = new THREE.MeshStandardMaterial({
                  map: texture,
                  emissiveMap: texture,
                  emissive: 0xffffff,
                  emissiveIntensity: 0.7,
                });
              }
            }
            child.castShadow = true;
            child.receiveShadow = true;
          }
          if (child.name.includes("Head") && !child.name.includes("Nub")) {
            headBone = child;
          }
        });

        object.visible = false;
        object.scale.set(1.2, 1.2, 1.2); // Setting dog scale to be somewhat large or standard
        this.scene.add(object);

        if (object.animations && object.animations.length > 0) {
          const baseClip = object.animations[0];
          const fps = 30;

          const walkClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Walk",
            10,
            22,
            fps,
          );
          const deadClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Dead",
            30,
            48,
            fps,
          );
          const attackClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Attack_S",
            75,
            100,
            fps,
          );

          const mixer = new THREE.AnimationMixer(object);
          const walkAction = mixer.clipAction(walkClip);
          const deadAction = mixer.clipAction(deadClip);
          const attackAction = mixer.clipAction(attackClip);

          walkAction.play();
          walkAction.setEffectiveWeight(1);
          deadAction.play();
          deadAction.setEffectiveWeight(0);
          attackAction.play();
          attackAction.setEffectiveWeight(0);

          this.models.dog = {
            model: object,
            mixer,
            walkAction,
            deadAction,
            attackAction,
            headBone,
          };
        }
      });
    });

    // Load Football Player
    fbxLoader.load("/FBX/FootballPlayer_Skin.fbx", (object) => {
      texLoader.load("/Textures/T_Football_player_D.png", (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        let headBone: THREE.Object3D | undefined;
        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => {
                if ("map" in mat) {
                  (mat as any).map = texture;
                  if ("emissive" in mat) {
                    (mat as any).emissive.setHex(0xffffff);
                    (mat as any).emissiveMap = texture;
                    (mat as any).emissiveIntensity = 0.7;
                  }
                  mat.needsUpdate = true;
                } else {
                  mesh.material = new THREE.MeshStandardMaterial({
                    map: texture,
                    emissive: 0xffffff,
                    emissiveMap: texture,
                    emissiveIntensity: 0.7
                  });
                }
              });
            } else {
              if (mesh.material && "map" in mesh.material) {
                (mesh.material as any).map = texture;
                if ("emissive" in mesh.material) {
                  (mesh.material as any).emissive.setHex(0xffffff);
                  (mesh.material as any).emissiveMap = texture;
                  (mesh.material as any).emissiveIntensity = 0.7;
                }
                mesh.material.needsUpdate = true;
              } else {
                mesh.material = new THREE.MeshStandardMaterial({
                  map: texture,
                  emissive: 0xffffff,
                  emissiveMap: texture,
                  emissiveIntensity: 0.7
                });
              }
            }
            child.castShadow = true;
            child.receiveShadow = true;
          }
          if (child.name.includes("Head") && !child.name.includes("Nub")) {
            headBone = child;
          }
        });

        object.visible = false;
        object.scale.set(0.3, 0.3, 0.3); // Scaled down by 75% from 1.2
        this.scene.add(object);

        if (object.animations && object.animations.length > 0) {
          const baseClip = object.animations[0];
          const fps = 30;

          const walkClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Walk",
            220,
            280,
            fps,
          );
          const deadClip = THREE.AnimationUtils.subclip(
            baseClip,
            "Dead",
            407,
            425,
            fps,
          );
          const attackClip = THREE.AnimationUtils.subclip(
            baseClip,
            "HeadAttack",
            380,
            405,
            fps,
          );

          const mixer = new THREE.AnimationMixer(object);
          const walkAction = mixer.clipAction(walkClip);
          const deadAction = mixer.clipAction(deadClip);
          const attackAction = mixer.clipAction(attackClip);

          walkAction.play();
          walkAction.setEffectiveWeight(1);
          deadAction.play();
          deadAction.setEffectiveWeight(0);
          attackAction.play();
          attackAction.setEffectiveWeight(0);

          this.models.football = {
            model: object,
            mixer,
            walkAction,
            deadAction,
            attackAction,
            headBone,
          };
        }
      });
    });

    // Load Mob Boss (Golden Zombie)
    fbxLoader.load("/FBX/ANI_MobBoss_All.fbx", (object) => {
      texLoader.load("/Textures/T_MobBoss.jpg", (texBoss) => {
        texBoss.colorSpace = THREE.SRGBColorSpace;
        texBoss.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        texLoader.load("/Textures/T_MobBoss_Car.jpg", (texCar) => {
          texCar.colorSpace = THREE.SRGBColorSpace;
          texCar.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
          
          let headBone: THREE.Object3D | undefined;
          object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              let tex = mesh.name.includes('Car') ? texCar : texBoss;
              mesh.material = new THREE.MeshStandardMaterial({
                map: tex,
                emissive: 0xffffff,
                emissiveMap: tex,
                emissiveIntensity: 0.2,
              });
              child.castShadow = true;
              child.receiveShadow = true;
            }
            if (child.name.includes("Head") && !child.name.includes("Nub")) {
              headBone = child;
            }
          });

          object.visible = false;
          object.scale.set(0.1875, 0.1875, 0.1875); // Shrink by another 25%
          this.scene.add(object);

          if (object.animations && object.animations.length > 0) {
            const baseClip = object.animations[0];
            const fps = 30;

            const walkClip = THREE.AnimationUtils.subclip(
              baseClip,
              "Walk",
              10,
              100,
              fps,
            );
            const deadClip = THREE.AnimationUtils.subclip(
              baseClip,
              "Dead",
              110,
              140,
              fps,
            );
            const attackClip = THREE.AnimationUtils.subclip(
              baseClip,
              "Hurt",
              170,
              204,
              fps,
            );

            const mixer = new THREE.AnimationMixer(object);
            const walkAction = mixer.clipAction(walkClip);
            const deadAction = mixer.clipAction(deadClip);
            const attackAction = mixer.clipAction(attackClip);

            walkAction.play();
            walkAction.setEffectiveWeight(1);
            deadAction.play();
            deadAction.setEffectiveWeight(0);
            attackAction.play();
            attackAction.setEffectiveWeight(0);

            this.models.golden = {
              model: object,
              mixer,
              walkAction,
              deadAction,
              attackAction,
              headBone,
            };
          }
        });
      });
    });

    // Load Gorilla
    Promise.all([
      new Promise<THREE.Group>((res, rej) => fbxLoader.load('/FBX/Gorilla_walk.fbx', res, undefined, rej)),
      new Promise<THREE.Group>((res, rej) => fbxLoader.load('/FBX/Gorilla_idle.fbx', res, undefined, rej)),
      new Promise<THREE.Group>((res, rej) => fbxLoader.load('/FBX/Gorilla_atk.fbx', res, undefined, rej))
    ]).then(([walkFbx, idleFbx, atkFbx]) => {
      texLoader.load('/Textures/ApeX_Titan_Diffuse.png', (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        const object = walkFbx;
        let headBone: THREE.Object3D | undefined;
        object.traverse((child: any) => {
          if (child.isMesh) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if ('map' in mat) { 
                  mat.map = texture; 
                  mat.emissive = new THREE.Color(0xffffff);
                  mat.emissiveMap = texture;
                  mat.emissiveIntensity = 0.7;
                  mat.needsUpdate = true; 
                }
                else { 
                  const newMat = new THREE.MeshStandardMaterial({map: texture}); 
                  newMat.emissive = new THREE.Color(0xffffff);
                  newMat.emissiveMap = texture;
                  newMat.emissiveIntensity = 0.7;
                  child.material = newMat; 
                }
              });
            } else {
              if (child.material && 'map' in child.material) { 
                child.material.map = texture; 
                child.material.emissive = new THREE.Color(0xffffff);
                child.material.emissiveMap = texture;
                child.material.emissiveIntensity = 0.7;
                child.material.needsUpdate = true; 
              }
              else { 
                const newMat = new THREE.MeshStandardMaterial({map: texture}); 
                newMat.emissive = new THREE.Color(0xffffff);
                newMat.emissiveMap = texture;
                newMat.emissiveIntensity = 0.7;
                child.material = newMat; 
              }
            }
            child.castShadow = true;
            child.receiveShadow = true;
          }
          if (child.name.includes("Head") && !child.name.includes("Nub")) {
            headBone = child;
          }
        });
        object.visible = false;
        object.scale.set(0.1, 0.1, 0.1); // Scaling it down appropriately for Boss by 50%
        this.scene.add(object);

        const fps = 30;
        const walkClip = THREE.AnimationUtils.subclip(walkFbx.animations[0], 'walk', 10.0, 70.0, fps);
        const idleClip = THREE.AnimationUtils.subclip(idleFbx.animations[0], 'idle', 100.0, 212.0, fps);
        const attackClip = THREE.AnimationUtils.subclip(atkFbx.animations[0], 'attack', 320.0, 363.0, fps); // dummy attackAction
        const middleRewardFailureClip = THREE.AnimationUtils.subclip(atkFbx.animations[0], 'middle_reward_failure', 780.0, 883.0, fps);

        const mixer = new THREE.AnimationMixer(object);
        const walkAction = mixer.clipAction(walkClip);
        const deadAction = mixer.clipAction(idleClip);
        const attackAction = mixer.clipAction(attackClip);
        
        const extraActions = {
          idle: mixer.clipAction(idleClip),
          middle_reward_failure: mixer.clipAction(middleRewardFailureClip)
        };

        walkAction.play(); walkAction.setEffectiveWeight(1);
        deadAction.play(); deadAction.setEffectiveWeight(0);
        attackAction.play(); attackAction.setEffectiveWeight(0);
        extraActions.idle.play(); extraActions.idle.setEffectiveWeight(0);
        extraActions.middle_reward_failure.play(); extraActions.middle_reward_failure.setEffectiveWeight(0);

        this.models.gorilla = {
          model: object,
          mixer,
          walkAction,
          deadAction,
          attackAction,
          headBone,
          extraActions
        };
      });
    }).catch(e => console.error("Failed to load Gorilla", e));

    // Load Monkey (Black Zombie)
    fbxLoader.load("/FBX/Monkey.fbx", (object) => {
      texLoader.load("/Textures/monkey_G.jpg", (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        let headBone: THREE.Object3D | undefined;
        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              map: texture,
              emissive: 0xffffff,
              emissiveMap: texture,
              emissiveIntensity: 0.2,
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
          if (child.name.includes("Head") && !child.name.includes("Nub")) {
            headBone = child;
          }
        });

        object.visible = false;
        object.scale.set(0.375, 0.375, 0.375); // Shrink by 75% from 1.5
        this.scene.add(object);

        if (object.animations && object.animations.length > 0) {
          const mixer = new THREE.AnimationMixer(object);

          let walkClip = object.animations.find(a => a.name === "walk") || object.animations[0];
          let deadClip = object.animations.find(a => a.name === "dead") || object.animations[0];
          let intimidateClip = object.animations.find(a => a.name === "intimidate") || object.animations[0];
          let attackClip = object.animations.find(a => a.name === "jump_in") || object.animations[0]; // dummy

          const walkAction = mixer.clipAction(walkClip);
          const deadAction = mixer.clipAction(deadClip);
          const attackAction = mixer.clipAction(attackClip);
          
          const extraActions = {
            intimidate: mixer.clipAction(intimidateClip)
          };

          walkAction.play();
          walkAction.setEffectiveWeight(1);
          deadAction.play();
          deadAction.setEffectiveWeight(0);
          attackAction.play();
          attackAction.setEffectiveWeight(0);
          extraActions.intimidate.play();
          extraActions.intimidate.setEffectiveWeight(0);

          this.models.monkey = {
            model: object,
            mixer,
            walkAction,
            deadAction,
            attackAction,
            headBone,
            extraActions
          };
        }
      });
    });

    // Load Box
    fbxLoader.load("/FBX/box.fbx", (object) => {
      texLoader.load("/Textures/T_AirdropBox_2D_View.jpg", (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.material = new THREE.MeshStandardMaterial({
              map: texture,
              emissive: 0xffffff,
              emissiveMap: texture,
              emissiveIntensity: 0.5, // Brighter 3D representation in this scene
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        object.visible = false;
        object.scale.set(1.0, 1.0, 1.0);
        this.scene.add(object);

        this.models.box = {
          model: object,
        } as any;
      });
    });
  }

  getFrame(
    isDead: boolean,
    isAttacking: boolean,
    animTime: number,
    attackTime: number,
    modelType:
      | "man"
      | "girl"
      | "bombman"
      | "mummy"
      | "dog"
      | "football"
      | "golden"
      | "gorilla"
      | "monkey"
      | "box" = "man",
    actionName?: string
  ): HTMLCanvasElement | null {
    if (!this.isLoaded) return null;

    // Hide all models
    if (this.models.man) this.models.man.model.visible = false;
    if (this.models.girl) this.models.girl.model.visible = false;
    if (this.models.bombman) this.models.bombman.model.visible = false;
    if (this.models.mummy) this.models.mummy.model.visible = false;
    if (this.models.dog) this.models.dog.model.visible = false;
    if (this.models.football) this.models.football.model.visible = false;
    if (this.models.golden) this.models.golden.model.visible = false;
    if (this.models.gorilla) this.models.gorilla.model.visible = false;
    if (this.models.monkey) this.models.monkey.model.visible = false;
    if (this.models.box) this.models.box.model.visible = false;

    if (modelType === "box") {
      const boxData = this.models.box;
      if (!boxData) return null;
      boxData.model.visible = true;
      // Static box rotated 90 degrees upwards on X axis, no self-rotation
      boxData.model.rotation.x = -Math.PI / 2;
      boxData.model.rotation.y = 0;
      boxData.model.rotation.z = 0;
      boxData.model.updateMatrixWorld(true);

      this.renderer.render(this.scene, this.camera);
      return this.renderer.domElement;
    }

    const data = this.models[modelType as keyof typeof this.models] as ModelData;
    if (!data) return null;

    // Show and setup active model
    data.model.visible = true;

    // Reset all weights
    data.walkAction.setEffectiveWeight(0);
    data.deadAction.setEffectiveWeight(0);
    data.attackAction.setEffectiveWeight(0);
    if (data.jumpEAction) data.jumpEAction.setEffectiveWeight(0);
    if (data.extraActions) {
      Object.values(data.extraActions).forEach(a => a.setEffectiveWeight(0));
    }

    if (isDead) {
      data.deadAction.setEffectiveWeight(1);
      data.deadAction.time = Math.min(
        animTime,
        data.deadAction.getClip().duration,
      );
    } else if (isAttacking) {
      if (actionName && data.extraActions && data.extraActions[actionName]) {
        const act = data.extraActions[actionName];
        act.setEffectiveWeight(1);
        if (actionName === 'intimidate') {
          act.time = animTime % act.getClip().duration;
        } else {
          act.time = Math.min(attackTime, act.getClip().duration);
        }
      } else {
        data.attackAction.setEffectiveWeight(1);
        if (modelType === "football") {
          data.attackAction.time = attackTime % data.attackAction.getClip().duration;
        } else {
          data.attackAction.time = Math.min(
            attackTime,
            data.attackAction.getClip().duration,
          );
        }
      }
    } else {
      if (actionName && data.extraActions && data.extraActions[actionName]) {
        const act = data.extraActions[actionName];
        act.setEffectiveWeight(1);
        act.time = animTime % act.getClip().duration;
      } else {
        data.walkAction.setEffectiveWeight(1);
        data.walkAction.time = animTime % data.walkAction.getClip().duration;
      }
    }

    data.mixer.update(0);

    // We want the 2D sprite to face UP (-Y) when un-rotated, because the green zombie sprite faces UP.
    // In our 3D camera, UP on the screen is -Z.
    // FBX models usually face +Z by default.
    // So we rotate the model by Math.PI.
    data.model.rotation.y = Math.PI;
    data.model.updateMatrixWorld(true);

    let originalHeadQuat: THREE.Quaternion | undefined;
    if (data.headBone) {
      originalHeadQuat = data.headBone.quaternion.clone();

      const qWorld = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        (Math.PI * 45) / 180,
      );
      const parentQuat = new THREE.Quaternion();
      if (data.headBone.parent) {
        data.headBone.parent.getWorldQuaternion(parentQuat);
      }
      const qLocal = parentQuat
        .clone()
        .invert()
        .multiply(qWorld)
        .multiply(parentQuat);
      data.headBone.quaternion.premultiply(qLocal);

      data.headBone.updateMatrixWorld(true);
    }

    this.renderer.render(this.scene, this.camera);

    if (data.headBone && originalHeadQuat) {
      data.headBone.quaternion.copy(originalHeadQuat);
    }

    return this.renderer.domElement;
  }
}

export const zombie3D = new Zombie3DRenderer();
