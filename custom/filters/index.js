import Seriously from './seriously.js';
import shaderbooth from './shaderbooth';
import starterShader from '../glsl/starter.glsl';
import glowEyesShader from '../glsl/gloweyes.glsl';

export default  {
  none: async ( { canvas, localInputVideo } ) => {
    let seriously = new Seriously();
    let camera = seriously.source(localInputVideo);
    let target = seriously.target(canvas);
    target.source = camera;
    seriously.go()

    return () => {
      seriously.stop();
      seriously.destroy();
      camera = null;
      target = null;
      seriously = null;
    }
  },
  booth: async ( { canvas, localInputVideo } ) => await shaderbooth.start({ canvas, localInputVideo, shader: starterShader }),
  woomera: async ( { canvas, localInputVideo } ) => await shaderbooth.start({ canvas, localInputVideo, shader: glowEyesShader }),
};