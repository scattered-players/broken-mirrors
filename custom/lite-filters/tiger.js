
import Jungle from './jungle';

export default class Tiger {
  constructor({
    audioSource,
    mixerContext,
    mixerOutput
  }) {
    console.log('SETTING UP TIGER');
    if(mixerContext) {
      this.effect = new Jungle(mixerContext);
      this.effect.setPitchOffset(-0.5);
      audioSource.disconnect();
      audioSource.connect(this.effect.input);
      this.effect.output.connect(mixerOutput);
    }
    document.documentElement.classList.add('tiger');
  }

  destroy() {
    document.documentElement.classList.remove('tiger');
    if(this.effect) {
      this.effect.destroy();
      this.effect = null;
    }
  }
};