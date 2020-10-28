
void main() {

  vec3 cam = getCam(uv);

  vec2 offset = vec2(noise(vec3(uv * 5., time * 0.1)),
                     noise(vec3(uv * 5. + vec2(0.3), time * 0.1))) *
                pixel * 3.;
  offset += vec2(0., -pixel.y * 2.);
  offset *= rand(uv.x + uv.y + time);
  vec3 prev = getPrevious(uv + offset);

  float face = getFace(uv);
  float eye = getEye(uv);
  float mouth = getMouth(uv);

  vec2 ed = 6. * pixel;
  float edge = dot((getCam(uv) * 4. - getCam(uv + vec2(ed.x, 0)) -
                    getCam(uv + vec2(-ed.x, 0)) - getCam(uv + vec2(0., ed.y)) -
                    getCam(uv + vec2(0, -ed.y)))
                       .rgb,
                   vec3(0.333));

  cam = vec3(0.5, .6, 1.0) * dot(cam, vec3(0.333));

  vec3 color = cam;

  color = (edge + 0.1) * cam * 30.;

  if (eye < 0.8) {
    color = prev * 0.95 + edge * 0.5 + cam * 0.05;
  }

  if( eye >= 0.8) {
    color /= color;
  }

  if (face > 0.3 && eye < 0.8) {
    color = mix(color, cam, 0.5);
  }

  float scale = 10.;
  float dif = length(uv - leftEye) * scale;
  dif = min(dif, length(uv - rightEye) * scale);
  dif = min(dif, 1.0);
  // dif *= dif;
  // dif *= dif;
  vec3 adjustment = vec3(dif);
  adjustment.b *= adjustment.b;
  color /= adjustment;

  gl_FragColor = vec4(color, 1);
}
