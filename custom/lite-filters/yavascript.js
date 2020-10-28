
import config from 'config';

window.fizzbuzz = async function() {
  fetch(`${ config.SERVICE_HOST }/shows/cue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: "YAVASCRIPT",
      cssClass: "yavascript-two",
      duration: 10000
    }),
    credentials: 'include'
  });
};

export default class Yavascript {
  constructor() {
    console.log('SETTING UP YAVASCRIPT');
    document.documentElement.classList.add('yavascript-one');
  }

  destroy() {
    document.documentElement.classList.remove('yavascript-one');
    if(this.effect) {
      this.effect.destroy();
      this.effect = null;
    }
  }
};