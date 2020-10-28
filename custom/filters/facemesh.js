import * as facemesh from "@tensorflow-models/facemesh";
import * as THREE from 'three';

let model = null;

export default class FaceGuesser {
  static async loadModel() {
    if (model === null){
      let startTime = Date.now();
      model = await facemesh.load({ maxFaces: 1 });
      console.log(`Loaded: ${ (Date.now() - startTime) / 1000}s`)
    } else {
      console.log('Loaded facemesh model from memory');
    }

    return model;
  }

  constructor(video) {
    this.model = null;
    this.dirty = false;
    this.keypoints = null;
    this.video = video;
    this.webcam = null;

    this.predictionLoop = this.predictionLoop.bind(this);
  }

  async init(painter) {
    let model = await FaceGuesser.loadModel();
    this.model = model;
  
    // this.video.addEventListener("canplay",() => this.video.play(), false);
  
    console.log("metadata loaded");
    this.webcam = new THREE.VideoTexture(this.video);
    this.webcam.flipY = false;
    this.webcam.minFilter = THREE.NearestFilter;
    this.webcam.magFilter = THREE.NearestFilter;
    this.webcam.format = THREE.RGBFormat;

    const { videoWidth, videoHeight } = this.video;

    var w = videoWidth;
    var h = videoHeight;
    this.video.height = h;
    this.video.width = w;
    painter.canvas.height = h;
    painter.canvas.width = w;

    this.rAF = window.requestAnimationFrame(this.predictionLoop);

    return [this.webcam, {
      videoWidth,
      videoHeight
    }];
  }

  destroy() {
    cancelAnimationFrame(this.rAF);
    this.video = null;
    this.model = null;
    if(this.webcam) {
      this.webcam.dispose();
      this.webcam = null;
    }
  }

  async predictionLoop() {
    if (!this.model || !this.video) {
      this.rAF = window.requestAnimationFrame(this.predictionLoop);
      return null;
    }

    // Pass in a video stream (or an image, canvas, or 3D tensor) to obtain an
    // array of detected faces from the MediaPipe graph.
    const predictions = await this.model.estimateFaces(this.video);
    if (predictions.length > 0) {
      for (let i = 0; i < predictions.length; i++) {
        this.keypoints = predictions[i].annotations;
        this.dirty = true;
      }
    }
    this.rAF = window.requestAnimationFrame(this.predictionLoop);
  }

  getKeyPoints() {
    if (this.dirty) {
      this.dirty = false;
      return this.keypoints;
    } else {
      return false;
    }
  }
};