import {
  CanvasTexture,
  WebGLRenderer,
  WebGLRenderTarget,
  OrthographicCamera,
  RGBFormat,
  BufferGeometry,
  BufferAttribute,
  Mesh,
  Scene,
  RawShaderMaterial,
  Vector2,
  MeshLambertMaterial,
  NearestFilter
} from 'three';

import FaceGuesser from './facemesh';
import Painter from './facepaint';

import vertexShader from '../glsl/shaderbooth-vertex.glsl';
import fragShaderPrefix from '../glsl/prefix.glsl';

export default {
  start: async ( { canvas, localInputVideo, shader } ) => {
    console.log('SHADER?', shader);
    let disposables = [];

    let renderer = new WebGLRenderer({ canvas});
    disposables.push(renderer);
    let scene = new Scene();
    disposables.push(scene);

    // three.js for .render() wants a camera, even if we're not using it :(
    let dummyCamera = new OrthographicCamera();
    let geometry = new BufferGeometry();
    disposables.push(geometry);

    // Triangle expressed in clip space coordinates
    const vertices = new Float32Array([
      -1.0, 4.0,
      -1.0, -1.0,
      4.0, -1.0,
    ]);
    geometry.setAttribute('position', new BufferAttribute(vertices, 2));
    let resolution = new Vector2();
    renderer.getDrawingBufferSize(resolution);

    let target1 = new WebGLRenderTarget(resolution.x, resolution.y, {
      format: RGBFormat,
      stencilBuffer: false,
      depthBuffer: true,
      minFilter: NearestFilter,
      magFilter: NearestFilter
    });
    disposables.push(target1);

    let target2 = new WebGLRenderTarget(resolution.x, resolution.y, {
      format: RGBFormat,
      stencilBuffer: false,
      depthBuffer: true,
      minFilter: NearestFilter,
      magFilter: NearestFilter
    });
    disposables.push(target2);

    let prevTarget = target1;
    let currentTarget = target2;

    let hasFace = false;
    let faceCenter = [0.5, 0.5];
    let painter = new Painter();
    let faceGuesser = new FaceGuesser(localInputVideo);
    let startTime = Date.now();
    let [webcam, { videoWidth, videoHeight }] = await faceGuesser.init(painter);
    console.log(`FaceGuesser init time: ${(Date.now() - startTime) / 1000}sec`);
    let scaledVideoResolution = new Vector2().fromArray(resolution.x / resolution.y > videoWidth / videoHeight
      ? [videoWidth * (resolution.y / videoHeight), resolution.y]
      : [resolution.x, videoHeight * (resolution.x / videoWidth)]);
    let material = new RawShaderMaterial({
      // fragmentShader: fragShaderPrefix + godRaysShader,
      fragmentShader: fragShaderPrefix + shader,
      vertexShader,
      uniforms: {
        camTex: { value: webcam },
        maskTex: { value: painter.texture },
        previousTex: { value: prevTarget.texture },
        videoResolution: { value: new Vector2(videoWidth, videoHeight) },
        time: { value: 0 },
        scaledVideoResolution: { value: scaledVideoResolution },
        resolution: { value: resolution },
        faceCenter: { 
          value: [
            2 * (1.0 - faceCenter[0] / videoWidth) - 1.0,
            2 * (1.0 - faceCenter[1] / videoHeight) - 1.0
          ]
        },
        leftEye: {
          value: [
            2 * (1.0 - painter.leftEye[0] / videoWidth) - 1.0,
            2 * (1.0 - painter.leftEye[1] / videoHeight) - 1.0
          ]
        },
        rightEye: {
          value: [
            2 * (1.0 - painter.rightEye[0] / videoWidth) - 1.0,
            2 * (1.0 - painter.rightEye[1] / videoHeight) - 1.0
          ]
        }
      },
    });
    disposables.push(material);

    // TODO: handle the resize -> update uResolution uniform and target.setSize()
    function onResize() {
      renderer.getDrawingBufferSize(resolution);
      target1.setSize(resolution.x, resolution.y);
      target2.setSize(resolution.x, resolution.y);
      material.uniforms.scaledVideoResolution.value = resolution.x / resolution.y > videoWidth / videoHeight
        ? [videoWidth * (resolution.y / videoHeight), resolution.y]
        : [resolution.x, videoHeight * (resolution.x / videoWidth)];
      
    }
    window.addEventListener('resize', onResize);

    let triangle = new Mesh(geometry, material);
    // Our triangle will be always on screen, so avoid frustum culling checking
    triangle.frustumCulled = false;
    scene.add(triangle);

    let rAF = requestAnimationFrame(render);

    function render() {
      let keyPoints = faceGuesser.getKeyPoints();
      if (keyPoints) {
        hasFace = true;
        faceCenter = keyPoints.noseTip[0];
        painter.paintFace(keyPoints);
      }
      material.uniforms.time.value = Date.now() % 10000;
      material.uniforms.faceCenter.value = [
        2 * (1.0 - faceCenter[0] / videoWidth) - 1.0,
        2 * (1.0 - faceCenter[1] / videoHeight) - 1.0
      ];
      material.uniforms.leftEye.value = [
        2 * (1.0 - painter.leftEye[0] / videoWidth) - 1.0,
        2 * (1.0 - painter.leftEye[1] / videoHeight) - 1.0
      ];
      material.uniforms.rightEye.value = [
        2 * (1.0 - painter.rightEye[0] / videoWidth) - 1.0,
        2 * (1.0 - painter.rightEye[1] / videoHeight) - 1.0
      ];

      renderer.setRenderTarget(null);
      renderer.render(scene, dummyCamera);
      renderer.setRenderTarget(currentTarget);
      renderer.render(scene, dummyCamera);

      let tmp = currentTarget;
      currentTarget = prevTarget;
      prevTarget = tmp;
      material.uniforms.previousTex.value = prevTarget.texture;

      rAF = requestAnimationFrame(render);
    }

    return () => {
      cancelAnimationFrame(rAF);
      window.removeEventListener('resize', onResize);
      disposables.map(item => {
        try {
          item.dispose()
        } catch(e){
          console.error('NOT DISPOSABE', item);
        }
      });
      painter.destroy();
      faceGuesser.destroy();
    };
  }
}