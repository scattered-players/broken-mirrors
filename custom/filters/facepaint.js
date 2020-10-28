import hull from "hull.js";
import {
  CanvasTexture,
  NearestFilter
} from 'three';

export default class Painter {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.className = 'hmm';
    // document.body.appendChild(this.canvas)

    this.texture = new CanvasTexture(this.canvas);
    this.texture.flipY = false;
    this.texture.minFilter = NearestFilter;
    this.texture.magFilter = NearestFilter;

    this.ctx = this.canvas.getContext("2d");
    this.ctx.translate(this.canvas.width, 0);
    this.ctx.scale(-1, 1);

    this.leftEye = [0.5, 0.5];
    this.rightEye = [0.5, 0.5];
  }

  destroy() {
    this.texture.dispose();
    this.canvas = null;
    this.ctx = null;
  }

  averagePoints(points) {
    let x = 0;
    let y = 0;
    for (let i = 0; i < points.length; i++) {
      x += points[i][0];
      y += points[i][1];
    }
    x /= points.length;
    y /= points.length;
    return [x, y];
  }

  drawShape(points) {
    this.ctx.beginPath();

    for (let i = 0; i < points.length; i++) {
      const x = points[i][0];
      const y = points[i][1];

      if (i == 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.fill();
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.texture.needsUpdate = true;
  }

  paintFace(annotations) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.lineCap = "round";

    let silhouette = annotations["silhouette"];
    let convexsilhouette = hull(silhouette, 1000);
    this.ctx.fillStyle = `#008`;
    this.ctx.strokeStyle = `#004`;
    this.ctx.lineWidth = 2;
    this.drawShape(convexsilhouette);
    this.ctx.lineWidth = 0;
    this.ctx.strokeStyle = "rgba(1, 1, 1, 0)";

    let leftEyebrow = [
      ...annotations["leftEyebrowLower"],
      ...annotations["leftEyebrowUpper"]
    ];

    let rightEyebrow = [
      ...annotations["rightEyebrowLower"],
      ...annotations["rightEyebrowUpper"]
    ];

    this.ctx.fillStyle = `#048`;
    this.drawShape(hull(leftEyebrow, 20));
    this.drawShape(hull(rightEyebrow, 20));

    let leftEye2 = [
      ...annotations["leftEyeLower2"],
      ...annotations["leftEyeUpper2"]
    ];

    let rightEye2 = [
      ...annotations["rightEyeLower2"],
      ...annotations["rightEyeUpper2"]
    ];
    this.ctx.fillStyle = `#088`;
    this.drawShape(hull(leftEye2, 1000));
    this.drawShape(hull(rightEye2, 1000));

    let leftEye1 = [
      ...annotations["leftEyeLower1"],
      ...annotations["leftEyeUpper1"]
    ];

    let rightEye1 = [
      ...annotations["rightEyeLower1"],
      ...annotations["rightEyeUpper1"]
    ];
    this.ctx.fillStyle = `#0C8`;
    this.drawShape(hull(leftEye1, 1000));
    this.drawShape(hull(rightEye1, 1000));

    let leftEye0 = [
      ...annotations["leftEyeLower0"],
      ...annotations["leftEyeUpper0"]
    ];

    let rightEye0 = [
      ...annotations["rightEyeLower0"],
      ...annotations["rightEyeUpper0"]
    ];
    this.ctx.fillStyle = `#0f8`;
    this.drawShape(hull(leftEye0, 1000));
    this.drawShape(hull(rightEye0, 1000));

    this.leftEye = this.averagePoints(leftEye0);
    this.rightEye = this.averagePoints(rightEye0);

    let outerMouth = [
      ...annotations["lipsUpperOuter"],
      ...annotations["lipsLowerOuter"]
    ];
    this.ctx.fillStyle = `#808`;
    let outerMouthHull = hull(outerMouth, 1000);
    this.drawShape(outerMouthHull);

    let innerMouth = [
      ...annotations["lipsUpperInner"],
      ...annotations["lipsLowerInner"]
    ];
    this.ctx.fillStyle = `#F08`;
    let innerMouthHull = hull(innerMouth, 1000);
    this.drawShape(innerMouthHull);

    let nosePath = [
      ...annotations["noseBottom"],
      ...annotations["noseTip"],
      ...annotations["noseLeftCorner"],
      ...annotations["midwayBetweenEyes"],
      ...annotations["noseRightCorner"]
    ];
    let convexNosePath = hull(nosePath, 1000);
    this.ctx.fillStyle = `#00F`;
    this.ctx.strokeStyle = `#00C`;
    this.ctx.lineWidth = 2;
    this.drawShape(convexNosePath);

    this.texture.needsUpdate = true;

    return this.ctx;
  }
}