import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SoundSystem } from '../../game/systems/SoundSystem';

// For now, we manually list the known FBX files. 
// If more are added, they can be added to this list.
const FBX_FILES = [
  'M_ZombieMan.fbx',
  'M_ZombieGirl.fbx',
  'ChampionChef_Skin.fbx',
  'BombMan_Skin.fbx',
  'Mummy_Ani.fbx',
  'FootballPlayer_Skin.fbx',
  'M_ZombieDog.fbx',
  'GraveRobber_Skin.fbx',
  'ANI_GraveRobber_Skill_Atk.fbx',
  'Monkey.fbx',
  'ANI_MobBoss_All.fbx',
  'Gorilla',
  'box.fbx'
];

interface FBXPreviewScreenProps {
  onBack: () => void;
}

export default function FBXPreviewScreen({ onBack }: FBXPreviewScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [animations, setAnimations] = useState<string[]>([]);
  const [currentAnimIndex, setCurrentAnimIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());
  const reqRef = useRef<number>(0);
  const modelRef = useRef<THREE.Group | null>(null);
  const animsRef = useRef<THREE.AnimationClip[]>([]);
  const actionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Init Three.js
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(0, 150, 300);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 50, 0);
    controls.update();
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 200, 100);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(500, 50, 0x444444, 0x222222);
    scene.add(gridHelper);

    const animate = () => {
      reqRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(reqRef.current);
      if (rendererRef.current && rendererRef.current.domElement.parentNode) {
        rendererRef.current.domElement.parentNode.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMsg(null);
    setAnimations([]);
    setCurrentAnimIndex(-1);

    const loader = new FBXLoader();

    if (selectedFile === 'Gorilla') {
        Promise.all([
            new Promise<THREE.Group>((res, rej) => loader.load('/FBX/Gorilla_walk.fbx', res, undefined, rej)),
            new Promise<THREE.Group>((res, rej) => loader.load('/FBX/Gorilla_idle.fbx', res, undefined, rej)),
            new Promise<THREE.Group>((res, rej) => loader.load('/FBX/Gorilla_atk.fbx', res, undefined, rej))
        ]).then(([walkFbx, idleFbx, atkFbx]) => {
            setIsLoading(false);
            if (modelRef.current && sceneRef.current) {
                sceneRef.current.remove(modelRef.current);
            }
            const object = walkFbx;
            object.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Apply texture
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load('/Textures/ApeX_Titan_Diffuse.png', (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                object.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        const mesh = child as THREE.Mesh;
                        if (Array.isArray(mesh.material)) {
                            mesh.material.forEach(mat => {
                                if ('map' in mat) { (mat as any).map = texture; mat.needsUpdate = true; } 
                                else { mesh.material = new THREE.MeshStandardMaterial({map: texture}); }
                            });
                        } else {
                            if (mesh.material && 'map' in mesh.material) { (mesh.material as any).map = texture; mesh.material.needsUpdate = true; } 
                            else { mesh.material = new THREE.MeshStandardMaterial({map: texture}); }
                        }
                    }
                });
            });

            if (sceneRef.current) {
                sceneRef.current.add(object);
            }
            modelRef.current = object;
            
            const walkClip = walkFbx.animations[0];
            const idleClip = idleFbx.animations[0];
            const atkClip = atkFbx.animations[0];
            const fps = 30;

            const animationsToUse = [
                THREE.AnimationUtils.subclip(walkClip, 'walk', 10.0, 70.0, fps),
                THREE.AnimationUtils.subclip(idleClip, 'idle', 100.0, 212.0, fps),
                THREE.AnimationUtils.subclip(atkClip, 'small_reward', 320.0, 363.0, fps),
                THREE.AnimationUtils.subclip(atkClip, 'middle_reward', 460.0, 677.0, fps),
                THREE.AnimationUtils.subclip(atkClip, 'middle_reward_failure', 780.0, 883.0, fps),
                THREE.AnimationUtils.subclip(atkClip, 'charge_in', 940.0, 982.0, fps),
                THREE.AnimationUtils.subclip(atkClip, 'charge_loop', 1200.0, 1223.0, fps),
                THREE.AnimationUtils.subclip(atkClip, 'charge_success', 1250.0, 1289.0, fps),
                THREE.AnimationUtils.subclip(atkClip, 'charge_failure', 1310.0, 1346.0, fps),
                THREE.AnimationUtils.subclip(atkClip, 'standby', 1726.0, 1765.0, fps),
                THREE.AnimationUtils.subclip(atkClip, 'ingame', 1781.0, 1968.0, fps),
                THREE.AnimationUtils.subclip(atkClip, 'big_reward_jump', 2370.0, 2397.0, fps),
                THREE.AnimationUtils.subclip(atkClip, 'big_reward', 2410.0, 2500.0, fps),
                THREE.AnimationUtils.subclip(atkClip, 'big_reward_return', 2540.0, 2592.0, fps),
                THREE.AnimationUtils.subclip(atkClip, 'final_reward', 2620.0, 2757.0, fps),
                THREE.AnimationUtils.subclip(atkClip, 'out', 2780.0, 2836.0, fps),
            ];

            animsRef.current = animationsToUse;
            setAnimations(animationsToUse.map(a => a.name || 'Unnamed Animation'));
            mixerRef.current = new THREE.AnimationMixer(object);
            setCurrentAnimIndex(0);
        }).catch(err => {
            setIsLoading(false);
            setErrorMsg(`Failed to load Gorilla files`);
            console.error(err);
        });
        return;
    }

    let fileToLoad = selectedFile;

    loader.load(
      `/FBX/${fileToLoad}`,
      (object) => {
        setIsLoading(false);
        if (modelRef.current && sceneRef.current) {
          sceneRef.current.remove(modelRef.current);
        }

        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Apply texture specifically for M_ZombieMan.fbx
        if (selectedFile === 'M_ZombieMan.fbx') {
          const tgaLoader = new TGALoader();
          tgaLoader.load('/Textures/T_ZombieMan_D.tga', (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            object.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(mat => {
                    if ('map' in mat) {
                      (mat as any).map = texture;
                      mat.needsUpdate = true;
                    } else {
                      mesh.material = new THREE.MeshStandardMaterial({
                        map: texture,
                      });
                    }
                  });
                } else {
                  if (mesh.material && 'map' in mesh.material) {
                    (mesh.material as any).map = texture;
                    mesh.material.needsUpdate = true;
                  } else {
                    mesh.material = new THREE.MeshStandardMaterial({
                      map: texture,
                    });
                  }
                }
              }
            });
          });
        }

        // Apply texture specifically for ChampionChef_Skin.fbx
        if (selectedFile === 'ChampionChef_Skin.fbx') {
          const tgaLoader = new TGALoader();
          tgaLoader.load('/Textures/T_Champion_Chef_D.tga', (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            object.traverse((child) => {
              if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
                (child as THREE.SkinnedMesh).normalizeSkinWeights();
              }
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(mat => {
                    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhongMaterial || mat instanceof THREE.MeshBasicMaterial) {
                      mat.map = texture;
                      mat.needsUpdate = true;
                    }
                  });
                } else {
                  if (mesh.material instanceof THREE.MeshStandardMaterial || mesh.material instanceof THREE.MeshPhongMaterial || mesh.material instanceof THREE.MeshBasicMaterial) {
                    mesh.material.map = texture;
                    mesh.material.needsUpdate = true;
                  }
                }
              }
            });
          });
        }

        // Apply texture specifically for BombMan_Skin.fbx
        if (selectedFile === 'BombMan_Skin.fbx') {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load('/Textures/T_Bombman_Diffuse.png', (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            object.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(mat => {
                    if ('map' in mat) {
                      (mat as any).map = texture;
                      mat.needsUpdate = true;
                    } else {
                      mesh.material = new THREE.MeshStandardMaterial({
                        map: texture,
                      });
                    }
                  });
                } else {
                  if (mesh.material && 'map' in mesh.material) {
                    (mesh.material as any).map = texture;
                    mesh.material.needsUpdate = true;
                  } else {
                    mesh.material = new THREE.MeshStandardMaterial({
                      map: texture,
                    });
                  }
                }
              }
            });
          });
        }

        // Apply texture specifically for Mummy_Ani.fbx
        if (selectedFile === 'Mummy_Ani.fbx') {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load('/Textures/T_Mummy_Diffuse.png', (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            object.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(mat => {
                    if ('map' in mat) {
                      (mat as any).map = texture;
                      mat.needsUpdate = true;
                    } else {
                      mesh.material = new THREE.MeshStandardMaterial({
                        map: texture,
                      });
                    }
                  });
                } else {
                  if (mesh.material && 'map' in mesh.material) {
                    (mesh.material as any).map = texture;
                    mesh.material.needsUpdate = true;
                  } else {
                    mesh.material = new THREE.MeshStandardMaterial({
                      map: texture,
                    });
                  }
                }
              }
            });
          });
        }

        // Apply texture specifically for FootballPlayer_Skin.fbx
        if (selectedFile === 'FootballPlayer_Skin.fbx') {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load('/Textures/T_Football_player_D.png', (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            object.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(mat => {
                    if ('map' in mat) {
                      (mat as any).map = texture;
                      if ("emissive" in mat) {
                        (mat as any).emissive.setHex(0xffffff);
                        (mat as any).emissiveMap = texture;
                        (mat as any).emissiveIntensity = 0.5;
                      }
                      mat.needsUpdate = true;
                    } else {
                      mesh.material = new THREE.MeshStandardMaterial({
                        map: texture,
                        emissive: 0xffffff,
                        emissiveMap: texture,
                        emissiveIntensity: 0.5
                      });
                    }
                  });
                } else {
                  if (mesh.material && 'map' in mesh.material) {
                    (mesh.material as any).map = texture;
                    if ("emissive" in mesh.material) {
                      (mesh.material as any).emissive.setHex(0xffffff);
                      (mesh.material as any).emissiveMap = texture;
                      (mesh.material as any).emissiveIntensity = 0.5;
                    }
                    mesh.material.needsUpdate = true;
                  } else {
                    mesh.material = new THREE.MeshStandardMaterial({
                      map: texture,
                      emissive: 0xffffff,
                      emissiveMap: texture,
                      emissiveIntensity: 0.5
                    });
                  }
                }
              }
            });
          });
        }

        // Apply texture specifically for M_ZombieDog.fbx
        if (selectedFile === 'M_ZombieDog.fbx') {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load('/Textures/T_ZombieDog_diffuse_A.jpg', (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            object.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(mat => {
                    if ('map' in mat) {
                      (mat as any).map = texture;
                      (mat as any).emissiveMap = texture;
                      (mat as any).emissive = new THREE.Color(0xffffff);
                      (mat as any).emissiveIntensity = 0.5;
                      mat.needsUpdate = true;
                    } else {
                      mesh.material = new THREE.MeshStandardMaterial({
                        map: texture,
                        emissiveMap: texture,
                        emissive: 0xffffff,
                        emissiveIntensity: 0.5,
                      });
                    }
                  });
                } else {
                  if (mesh.material && 'map' in mesh.material) {
                    (mesh.material as any).map = texture;
                    (mesh.material as any).emissiveMap = texture;
                    (mesh.material as any).emissive = new THREE.Color(0xffffff);
                    (mesh.material as any).emissiveIntensity = 0.5;
                    mesh.material.needsUpdate = true;
                  } else {
                    mesh.material = new THREE.MeshStandardMaterial({
                      map: texture,
                      emissiveMap: texture,
                      emissive: 0xffffff,
                      emissiveIntensity: 0.5,
                    });
                  }
                }
              }
            });
          });
        }

        // Apply texture specifically for M_ZombieGirl.fbx
        if (selectedFile === 'M_ZombieGirl.fbx') {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load('/Textures/T_ZombieGirl_Diffuse.png', (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            object.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(mat => {
                    if ('map' in mat) {
                      (mat as any).map = texture;
                      mat.needsUpdate = true;
                    } else {
                      mesh.material = new THREE.MeshStandardMaterial({
                        map: texture,
                      });
                    }
                  });
                } else {
                  if (mesh.material && 'map' in mesh.material) {
                    (mesh.material as any).map = texture;
                    mesh.material.needsUpdate = true;
                  } else {
                    mesh.material = new THREE.MeshStandardMaterial({
                      map: texture,
                    });
                  }
                }
              }
            });
          });
        }

        // Apply texture specifically for GraveRobber files
        if (selectedFile === 'GraveRobber_Skin.fbx' || selectedFile === 'ANI_GraveRobber_Skill_Atk.fbx') {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load('/Textures/T_GraveRobber_D.png', (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            object.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(mat => {
                    if ('map' in mat) {
                      (mat as any).map = texture;
                      mat.needsUpdate = true;
                    } else {
                      mesh.material = new THREE.MeshStandardMaterial({
                        map: texture,
                      });
                    }
                  });
                } else {
                  if (mesh.material && 'map' in mesh.material) {
                    (mesh.material as any).map = texture;
                    mesh.material.needsUpdate = true;
                  } else {
                    mesh.material = new THREE.MeshStandardMaterial({
                      map: texture,
                    });
                  }
                }
              }
            });
          });
        }

        // Apply texture specifically for Monkey.fbx
        if (selectedFile === 'Monkey.fbx') {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load('/Textures/monkey_G.jpg', (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            object.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(mat => {
                    if ('map' in mat) {
                      (mat as any).map = texture;
                      mat.needsUpdate = true;
                    } else {
                      mesh.material = new THREE.MeshStandardMaterial({
                        map: texture,
                      });
                    }
                  });
                } else {
                  if (mesh.material && 'map' in mesh.material) {
                    (mesh.material as any).map = texture;
                    mesh.material.needsUpdate = true;
                  } else {
                    mesh.material = new THREE.MeshStandardMaterial({
                      map: texture,
                    });
                  }
                }
              }
            });
          });
        }

        // Apply texture specifically for ANI_MobBoss_All.fbx
        if (selectedFile === 'ANI_MobBoss_All.fbx') {
          const textureLoader = new THREE.TextureLoader();
          const texBoss = textureLoader.load('/Textures/T_MobBoss.jpg');
          texBoss.colorSpace = THREE.SRGBColorSpace;
          const texCar = textureLoader.load('/Textures/T_MobBoss_Car.jpg');
          texCar.colorSpace = THREE.SRGBColorSpace;
          
          object.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              let tex = mesh.name.includes('Car') ? texCar : texBoss;
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                  if ('map' in mat) {
                    (mat as any).map = tex;
                    mat.needsUpdate = true;
                  } else {
                    mesh.material = new THREE.MeshStandardMaterial({
                      map: tex,
                    });
                  }
                });
              } else {
                if (mesh.material && 'map' in mesh.material) {
                  (mesh.material as any).map = tex;
                  mesh.material.needsUpdate = true;
                } else {
                  mesh.material = new THREE.MeshStandardMaterial({
                    map: tex,
                  });
                }
              }
            }
          });
        }

        // Apply texture specifically for box.fbx
        if (selectedFile === 'box.fbx') {
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load('/Textures/T_AirdropBox_2D_View.jpg', (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            object.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                if (Array.isArray(mesh.material)) {
                  mesh.material.forEach(mat => {
                    if ('map' in mat) {
                      (mat as any).map = texture;
                      mat.needsUpdate = true;
                    } else {
                      mesh.material = new THREE.MeshStandardMaterial({
                        map: texture,
                      });
                    }
                  });
                } else {
                  if (mesh.material && 'map' in mesh.material) {
                    (mesh.material as any).map = texture;
                    mesh.material.needsUpdate = true;
                  } else {
                    mesh.material = new THREE.MeshStandardMaterial({
                      map: texture,
                    });
                  }
                }
              }
            });
          });
        }
        
        // Center and scale a bit if needed
        object.position.set(0, 0, 0);
        if (selectedFile === 'FootballPlayer_Skin.fbx') {
          object.scale.set(0.3, 0.3, 0.3); // Scale down by 75%
        }
        
        modelRef.current = object;
        sceneRef.current?.add(object);

        if (object.animations && object.animations.length > 0) {
          let animationsToUse = object.animations;

          // Splice animation clips for M_ZombieMan.fbx based on frame ranges
          if (selectedFile === 'M_ZombieMan.fbx') {
            const baseClip = object.animations[0];
            const fps = 30; // Assuming 30 fps
            animationsToUse = [
              THREE.AnimationUtils.subclip(baseClip, 'Walk', 10, 55, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump_S', 70, 85, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump_L', 85, 100, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump_E', 100, 115, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump', 70, 115, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Dead', 185, 205, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Attack_S', 230, 255, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Attack_E', 255, 265, fps),
            ];
          } else if (selectedFile === 'M_ZombieGirl.fbx') {
            const baseClip = object.animations[0];
            const fps = 30; // Assuming 30 fps
            animationsToUse = [
              THREE.AnimationUtils.subclip(baseClip, 'Walk', 90, 130, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump_S', 10, 25, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump_L', 25, 40, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump_E', 40, 60, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump', 10, 60, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Dead', 140, 161, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Attack_S', 190, 215, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Attack_E', 215, 225, fps),
            ];
          } else if (selectedFile === 'ChampionChef_Skin.fbx') {
            const baseClip = object.animations[0];
            const fps = 30; // Assuming 30 fps
            animationsToUse = [
              THREE.AnimationUtils.subclip(baseClip, 'Walk', 10, 30, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump', 40, 85, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hit_H', 100, 125, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Dead02', 140, 190, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hit_L', 200, 215, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump_S', 40, 55, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump_L', 55, 70, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump_E', 70, 85, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hurt', 100, 125, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Dead', 140, 165, fps),
              THREE.AnimationUtils.subclip(baseClip, 'AwakeAnnouncement', 100, 130, fps),
            ];
          } else if (selectedFile === 'BombMan_Skin.fbx') {
            const baseClip = object.animations[0];
            const fps = 30; // Assuming 30 fps
            animationsToUse = [
              THREE.AnimationUtils.subclip(baseClip, 'Walk', 10, 30, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Dead02', 50, 90, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hurt01', 100, 198, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Dead01', 225, 250, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hurt02', 270, 285, fps),
              THREE.AnimationUtils.subclip(baseClip, 'ShortHurt', 272, 285, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Fall', 206, 209, fps),
              THREE.AnimationUtils.subclip(baseClip, 'AwakeAnnouncement', 100, 191, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Attack', 50, 90, fps),
              THREE.AnimationUtils.subclip(baseClip, 'ShortHurt_S', 272, 278, fps),
              THREE.AnimationUtils.subclip(baseClip, 'ShortHurt_E', 278, 285, fps),
            ];
          } else if (selectedFile === 'Mummy_Ani.fbx') {
            const baseClip = object.animations[0];
            const fps = 30; // Assuming 30 fps
            animationsToUse = [
              THREE.AnimationUtils.subclip(baseClip, 'Walk', 10, 124, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hit_H', 150, 195, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Dead', 779, 859, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Walk02', 433, 513, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Idle02', 535, 593, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Idle01', 615, 665, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Awake', 675, 775, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Skill', 865, 935, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Angry', 987, 1069, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Debut', 987, 1085, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Skill02', 872, 960, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Awake02', 707, 775, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Dead02', 785, 859, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump_S', 1160, 1200, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump_E', 1200, 1265, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Fly_S', 1265, 1330, fps),
              THREE.AnimationUtils.subclip(baseClip, 'FlyThrow', 1331, 1410, fps),
              THREE.AnimationUtils.subclip(baseClip, 'FlyAtk', 1420, 1490, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Fly_L', 1500, 1575, fps),
              THREE.AnimationUtils.subclip(baseClip, 'FlyAway', 1600, 1635, fps),
              THREE.AnimationUtils.subclip(baseClip, 'FlyDead', 1650, 1722, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Explode', 1730, 1800, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Skill03', 1830, 1945, fps),
              THREE.AnimationUtils.subclip(baseClip, 'FlyAngry', 1960, 2030, fps),
            ];
          } else if (selectedFile === 'FootballPlayer_Skin.fbx') {
            const baseClip = object.animations[0];
            const fps = 30; // Assuming 30 fps
            animationsToUse = [
              THREE.AnimationUtils.subclip(baseClip, 'Walk', 220, 280, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Run', 110, 120, fps),
              THREE.AnimationUtils.subclip(baseClip, 'TouchDown', 150, 180, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hit_L', 430, 445, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hit_H', 300, 331, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hit_RD', 194, 195, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hit_LU', 202, 203, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hit_LD', 198, 199, fps),
              THREE.AnimationUtils.subclip(baseClip, 'HeadAttack', 380, 405, fps),
              THREE.AnimationUtils.subclip(baseClip, 'HandAttack', 360, 380, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Dead', 407, 425, fps),
              THREE.AnimationUtils.subclip(baseClip, 'AwakeAnnouncement', 300, 330, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Attack_S', 350, 360, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Attack_L', 360, 360, fps),
              THREE.AnimationUtils.subclip(baseClip, 'ShortHurt', 435, 445, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hurt', 300, 331, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hit_RU', 190, 191, fps),
              THREE.AnimationUtils.subclip(baseClip, 'ShortHurt_E', 440, 445, fps),
              THREE.AnimationUtils.subclip(baseClip, 'ShortHurt_S', 433, 440, fps),
            ];
          } else if (selectedFile === 'M_ZombieDog.fbx') {
            const baseClip = object.animations[0];
            const fps = 30; // Assuming 30 fps
            animationsToUse = [
              THREE.AnimationUtils.subclip(baseClip, 'Walk', 10, 22, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Dead', 30, 48, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Attack_S', 75, 100, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Attack_E', 100, 110, fps),
            ];
          } else if (selectedFile === 'GraveRobber_Skin.fbx') {
            const baseClip = object.animations[0];
            const fps = 30; // Assuming 30 fps
            animationsToUse = [
              THREE.AnimationUtils.subclip(baseClip, 'Walk', 60.0, 150.0, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hit_H', 180.0, 204.0, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Dead', 210.0, 280.0, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump_S', 300.0, 315.0, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump_L', 315.0, 330.0, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Jump_E', 330.0, 345.0, fps),
            ];
          } else if (selectedFile === 'Monkey.fbx') {
            const fps = 30; // Assuming 30 fps
            // The FBX exporter baked the full timeline length into every take.
            // We need to subclip each take to remove the T-pose segments.
            const getClip = (index: number) => object.animations[index] || object.animations[0];
            animationsToUse = [
              THREE.AnimationUtils.subclip(getClip(0), 'walk', 10.0, 30.0, fps),
              THREE.AnimationUtils.subclip(getClip(1), 'dead', 80.0, 125.0, fps),
              THREE.AnimationUtils.subclip(getClip(2), 'intimidate', 140.0, 170.0, fps),
              THREE.AnimationUtils.subclip(getClip(3), 'jump_in', 180.0, 250.0, fps),
              THREE.AnimationUtils.subclip(getClip(4), 'fly_out', 300.0, 370.0, fps),
            ];
          } else if (selectedFile === 'ANI_GraveRobber_Skill_Atk.fbx') {
            const baseClip = object.animations[0];
            const fps = 30; // Assuming 30 fps
            animationsToUse = [
              THREE.AnimationUtils.subclip(baseClip, 'Skill_Atk', 928, 977, fps),
            ];
          } else if (selectedFile === 'ANI_MobBoss_All.fbx') {
            const baseClip = object.animations[0];
            const fps = 30; // Assuming 30 fps
            animationsToUse = [
              THREE.AnimationUtils.subclip(baseClip, 'Walk', 10.0, 100.0, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hit_L', 210.0, 225.0, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hit_H', 170.0, 204.0, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Dead', 110.0, 140.0, fps),
              THREE.AnimationUtils.subclip(baseClip, 'AwakeAnnouncement', 170.0, 204.0, fps),
              THREE.AnimationUtils.subclip(baseClip, 'Hurt', 170.0, 204.0, fps),
            ];
          }

          animsRef.current = animationsToUse;
          setAnimations(animationsToUse.map(a => a.name || 'Unnamed Animation'));
          mixerRef.current = new THREE.AnimationMixer(object);
          setCurrentAnimIndex(0);
        } else {
          animsRef.current = [];
          mixerRef.current = null;
        }
      },
      (xhr) => {
        // console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
        setIsLoading(false);
        setErrorMsg(`Failed to load ${selectedFile}`);
        console.error(error);
      }
    );
  }, [selectedFile]);

  useEffect(() => {
    if (currentAnimIndex >= 0 && animsRef.current.length > currentAnimIndex && mixerRef.current) {
      if (actionRef.current) {
        actionRef.current.stop();
      }
      const clip = animsRef.current[currentAnimIndex];
      const action = mixerRef.current.clipAction(clip);
      action.play();
      actionRef.current = action;
    } else {
      if (actionRef.current) {
        actionRef.current.stop();
        actionRef.current = null;
      }
    }
  }, [currentAnimIndex]);

  return (
    <div className="w-full h-full bg-slate-900 text-white flex">
      {/* Sidebar */}
      <div className="w-[333px] bg-slate-950 border-r border-slate-800 p-4 flex flex-col z-10 shadow-xl relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-cyan-400">FBX Preview</h2>
          <button 
            onClick={() => {
              SoundSystem.play('Sse_03');
              onBack();
            }}
            className="text-slate-400 hover:text-white transition-colors"
            title="Press T to return"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Model List</h3>
          <div className="space-y-2">
            {FBX_FILES.map(file => (
              <button
                key={file}
                onClick={() => {
                  SoundSystem.play('Sse_03');
                  setSelectedFile(file);
                }}
                className={`w-full text-left px-3 py-2 rounded text-base transition-colors ${
                  selectedFile === file 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {file}
              </button>
            ))}
            {FBX_FILES.length === 0 && (
              <p className="text-base text-slate-500 italic">No FBX files found</p>
            )}
          </div>
        </div>

        {animations.length > 0 && (
          <div className="flex-1 overflow-y-auto pr-1">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Animations ({animations.length})</h3>
            <div className="space-y-1">
              {animations.map((anim, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    SoundSystem.play('Sse_03');
                    setCurrentAnimIndex(idx);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm truncate transition-colors ${
                    currentAnimIndex === idx
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                  title={anim}
                >
                  {anim}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="w-full h-full outline-none" />
        
        {/* Overlays */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
              <p className="text-cyan-400 font-medium tracking-widest text-base animate-pulse">LOADING MODEL...</p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-20">
            <div className="bg-red-950/80 border border-red-500/50 p-6 rounded-lg text-center max-w-md">
              <p className="text-red-400 font-medium mb-2 text-base">{errorMsg}</p>
              <button 
                onClick={() => setErrorMsg(null)}
                className="px-4 py-2 bg-red-900/50 text-red-200 rounded text-base hover:bg-red-800/50 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {!selectedFile && !isLoading && !errorMsg && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <p className="text-slate-500 text-base tracking-widest uppercase">Select a model from the list</p>
          </div>
        )}

        {/* Controls Hint */}
        {selectedFile && !isLoading && (
          <div className="absolute bottom-4 right-4 pointer-events-none z-10">
            <div className="bg-slate-950/80 backdrop-blur border border-slate-800 p-3 rounded text-sm text-slate-400 flex flex-col gap-1">
              <div className="flex justify-between gap-4">
                <span>Left Click</span>
                <span className="text-slate-300">Rotate</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Right Click</span>
                <span className="text-slate-300">Pan</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Scroll</span>
                <span className="text-slate-300">Zoom</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
