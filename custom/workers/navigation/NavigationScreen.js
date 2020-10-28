import * as THREE from 'three';
import TextureLoader from '../TextureLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { TGALoader } from 'three/examples/jsm/loaders/TGALoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

THREE.Cache.enabled = true;
const resDirectory = '2k';

const loadHDR = (loadingManager, filename) => {
  let hdr = new RGBELoader(loadingManager).setDataType(THREE.FloatType).load( `/media/3d/envmaps/${resDirectory}/${filename}` );
  hdr.magFilter = THREE.LinearFilter;
  return hdr;
};

const loadEXR = (loadingManager, filename) => {
  return new EXRLoader(loadingManager).load( `/media/3d/envmaps/${resDirectory}/${filename}` );
};

const loadJPG = (loadingManager, filename) => {
  return new TextureLoader(loadingManager, { flipY: false }).load( `/media/3d/envmaps/${resDirectory}/${filename}` );
};

const TEXTURE_DICT = {
  Atia: {
    load: loadingManager => loadHDR(loadingManager, `Atia.hdr`),
  },
  BazQux: {
    load: loadingManager => loadJPG(loadingManager, `BazQux.jpg`),
  },
  Desmond: {
    load: loadingManager => loadJPG(loadingManager, `Desmond.jpg`),
  },
  Eowin: {
    load: loadingManager => loadEXR(loadingManager, `Eowin.exr`),
  },
  Fearn: {
    load: loadingManager => loadEXR(loadingManager, `Fearn.exr`),
  },
  Fennix: {
    load: loadingManager => loadHDR(loadingManager, `Fennix.hdr`),
  },
  FooBar: {
    load: loadingManager => loadJPG(loadingManager, `FooBar.JPG`),
  },
  Jeremy: {
    load: loadingManager => loadHDR(loadingManager, `Jeremy.hdr`),
  },
  Kleorg: {
    load: loadingManager => loadEXR(loadingManager, `Kleorg.exr`),
  },
  Lahin: {
    load: loadingManager => loadEXR(loadingManager, `Lahin.exr`),
  },
  Makalani: {
    load: loadingManager => loadEXR(loadingManager, `Makalani.exr`),
  },
  Mazzy: {
    load: loadingManager => loadHDR(loadingManager, `Mazzy.hdr`),
  },
  Mesekiu: {
    load: loadingManager => loadHDR(loadingManager, `Mesekiu.hdr`),
  },
  Olivia: {
    load: loadingManager => loadHDR(loadingManager, `Olivia.hdr`),
  },
  One: {
    load: loadingManager => loadHDR(loadingManager, `One.hdr`),
  },
  Prizilla: {
    load: loadingManager => loadHDR(loadingManager, `Prizilla.hdr`),
  },
  Puddlemouth: {
    load: loadingManager => loadHDR(loadingManager, `Puddlemouth.hdr`),
  },
  ShenYuan: {
    load: loadingManager => loadHDR(loadingManager, `ShenYuan.hdr`),
  },
  Simon: {
    load: loadingManager => loadHDR(loadingManager, `Simon.hdr`),
  },
  Ty: {
    load: loadingManager => loadHDR(loadingManager, `Ty.hdr`),
  },
  Widget: {
    load: loadingManager => loadJPG(loadingManager, `Widget.jpg`),
  },
  Yukeko: {
    load: loadingManager => loadHDR(loadingManager, `Yukeko.hdr`),
  },
  Zelkie: {
    load: loadingManager => loadHDR(loadingManager, `Zelkie.hdr`),
  },
}

export default class NavigationScreen {
  constructor(sendToMainThread) {
    this.state = null;

    this.sendToMainThread = sendToMainThread.bind(this);
    this.rotatePlace = this.rotatePlace.bind(this);
    this.updateScene = this.updateScene.bind(this);
    this.render = this.render.bind(this);

    this.initScene();
  }
  
  initScene() {
    this.disposables = [];

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
    this.disposables.push(this.scene);

    let startTime = Date.now();
    this.loadingManager = new THREE.LoadingManager();
    this.loadingManager.addHandler( /\.tga$/i, new TGALoader(this.loadingManager) );
    this.loadingManager.onLoad = () => {
      setTimeout(() => {
        console.log('LOADED!', (Date.now()-startTime)/1000, this.hasReceivedFirstUpdate );
        this.hasReceivedFirstLoad = true;
        if(this.hasReceivedFirstUpdate) {
          this.updateScene(JSON.parse(JSON.stringify(this.state)));
        }
      }, 1000);
    };

    this.camera = new THREE.PerspectiveCamera( 75, 4/3, 0.001, 1000 );
    this.camera.position.z = 25;
    this.shardGroup = new THREE.Group();
    this.scene.add(this.shardGroup);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 1);
    this.scene.add(this.ambientLight);

    new GLTFLoader(this.loadingManager).load('/media/3d/models/glass.glb', gltf => {
      this.shardModels = gltf.scene.children;
    });

    // this.cameraLight = new THREE.PointLight(0xffffff, 1);
    // this.scene.add(this.cameraLight);
    
    this.places = [];
    
    this.hasReceivedFirstUpdate = false;
    this.hasReceivedFirstLoad = false;
    this.frameTimes = [];
  }

  initRenderer(canvas, width, height, dpi) {
    this.destroyRenderer();

    console.log('INIT RENDERER', canvas, width, height, dpi);
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.dpi = dpi;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(this.dpi);
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;

    this.composer = new EffectComposer( this.renderer );

    this.renderScene = new RenderPass( this.scene, this.camera );
    this.composer.addPass( this.renderScene );
    
    this.bloomPass = new UnrealBloomPass( new THREE.Vector2( this.width, this.height ), 0.35, 0.4, 0.35 );
    this.composer.addPass( this.bloomPass );
    
    this.clock = new THREE.Clock(true);
    this.rAF = requestAnimationFrame(this.render);
  }

  destroyRenderer() {
    cancelAnimationFrame(this.rAF);
    if(this.bloomPass){
      this.bloomPass.dispose();
    }
    if(this.renderer){
      this.renderer.dispose();
    }
    this.canvas = null;
    this.width = null;
    this.height = null;
    this.dpi = null;
    this.renderer = null;
    this.renderScene = null;
    this.bloomPass = null;
    this.composer = null;
  }

  rotatePlace() {
    if(this.state) {
      console.log('SELECTING', this.places);
      this.selectedPlaceIndex++;
      if(this.selectedPlaceIndex >= this.state.places.length) {
        this.selectedPlaceIndex = 0;
      }
      this.state.selectedPlace = this.state.places[this.selectedPlaceIndex];
    } else {
      console.log('NO STATE', this);
    }
    this.rotatePlaceTimeout = setTimeout(this.rotatePlace, 5 * 1000);
  }

  updateScene(newState) {
    let oldState = this.state;
    this.state = newState;
    console.log('NEW STATE', this);
    this.hasReceivedFirstUpdate = true;

    if(!this.hasReceivedFirstLoad) {
      return;
    }
    
    newState.places.map(newPlace => {
      let needsAdded = !this.places.some(oldPlace => newPlace._id === oldPlace._id);
      if(needsAdded) {
        console.log('ADDING PLACE', newPlace.assetKey);
        let shardModelBasis = this.shardModels[Math.floor(Math.random()*this.shardModels.length)]
        let envMap = TEXTURE_DICT[newPlace.assetKey].load(this.loadingManager);
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        envMap.encoding = THREE.sRGBEncoding;
        let reflectMaterial = new THREE.MeshBasicMaterial({
          envMap,
          side: THREE.DoubleSide
        });
        let shardModel = new THREE.Group();
        let shardTargets = [];
        shardModelBasis.children.map(child => {
          let shardMesh = child.clone();
          shardMesh.material = reflectMaterial;
          shardMesh.position.set(Math.random()*50 - 25, Math.random()*100 - 50, Math.random()*50 - 25);
          let theta = Math.atan2(shardMesh.position.z, shardMesh.position.x);
          let r = Math.sqrt(shardMesh.position.z*shardMesh.position.z + shardMesh.position.x*shardMesh.position.x) + 25;
          shardMesh.position.set(r*Math.cos(theta), shardMesh.position.y, r*Math.sin(theta));


          shardMesh.quaternion.setFromEuler( new THREE.Euler( Math.random()*2*Math.PI, Math.random()*2*Math.PI, Math.random()*2*Math.PI ), 'XYZ' );
          shardModel.add(shardMesh);
          shardTargets.push({
            targetPosition: shardMesh.position.clone(),
            targetRotation: shardMesh.quaternion.clone(),
            homePosition: child.position.clone(),
            homeRotation: child.quaternion.clone()
          });
        });
        this.shardGroup.add(shardModel);

        this.places.push({
          _id: newPlace._id,
          assetKey: newPlace.assetKey,
          shardModel,
          shardTargets,
          envMap,
          reflectMaterial,
          dispose: () => {
            envMap.dispose();
            reflectMaterial.dispose();
          }
        });
      }
    });
    
    oldState && oldState.places.map(oldPlace => {
      let needsRemoved = !newState.places.some(newPlace => newPlace._id === oldPlace._id);
      if(needsRemoved) {
        console.log('REMOVING PLACE');
        let placeToRemove = this.places.filter(place => place._id === oldPlace._id)[0];
        this.places = this.places.filter(place => place._id !== oldPlace._id);

        this.shardGroup.remove(placeToRemove.shardModel);
        placeToRemove.dispose();
      }
    });
    
  }

  resizeScene(width, height) {
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer && this.renderer.setSize(width, height, false);
    this.composer && this.composer.setSize(width, height);
    this.bloomPass && this.bloomPass.setSize(width, height);
  }

  render() {
    this.sendToMainThread({type:'RENDER'});
    this.rAF = requestAnimationFrame(this.render);
    let timeDelta = this.clock.getDelta();
    let timeElapsed = this.clock.getElapsedTime();
    // console.log('RENDER?', !!this.state, !!this.hasReceivedFirstLoad, !!this.renderer)

    if(!this.state || !this.hasReceivedFirstLoad || !this.renderer) {
      return;
    }
    this.frameTimes.push(timeDelta);

    let {
      state: {
        places: statePlaces,
        myParty,
        selectedPlace,
        isInTransit
      },
      places,
      scene,
      camera,
      composer,
      renderer
    } = this;


    places.map(place => {
      if(selectedPlace && selectedPlace._id === place._id){
        place.shardModel.children.map((child, i) => {
          let shardTarget = place.shardTargets[i];
          child.position.lerp(shardTarget.homePosition, 2*timeDelta)
          child.quaternion.rotateTowards(shardTarget.homeRotation, 2*timeDelta);
        });
      } else {
        place.shardModel.children.map((child, i) => {
          let shardTarget = place.shardTargets[i];
          child.position.lerp(shardTarget.targetPosition, timeDelta)
          child.quaternion.rotateTowards(shardTarget.targetRotation, timeDelta);
        });
      }
    });

    this.shardGroup.rotateY(timeDelta/3);
    // camera.lookAt(0,0,0);

    // renderer.render( scene, camera );
    composer.render( scene, camera );
    // console.log('RENDER!', this.canvas)
  }

  destroy() {
    cancelAnimationFrame(this.rAF);
    clearTimeout(this.rotatePlaceTimeout);
    this.state = null;
    this.canvas = null;
    this.places.map(placeToRemove => {
      this.scene.remove(placeToRemove.group);
      placeToRemove.dispose();
    });
    this.disposables.map(asset => {
      try {
        asset.dispose();
      } catch (e){
        console.error('DISPOSAL ERROR', asset);
        console.error(e);
      }
    });

    if(this.frameTimes.length){
      let avgFrameTime = this.frameTimes.reduce((sum, frameTime) => sum+frameTime, 0) / this.frameTimes.length;
      let fps = 1/avgFrameTime;
      console.log('AVERAGE FPS', fps, this.frameTimes);
    }
  }
}