import Animation from "./animation.js";

function parseFrames(consecutiveFrames) {
  // return a single number frame
  if (+consecutiveFrames === consecutiveFrames) {
    return consecutiveFrames;
  }

  let sequence = [];
  let frames = consecutiveFrames.split("..");

  // coerce string to number
  let start = +frames[0];
  let end = +frames[1];
  let i = start;

  // ascending frame order
  if (start < end) {
    for (; i <= end; i++) {
      sequence.push(i);
    }
  }
  // descending order
  else {
    for (; i >= end; i--) {
      sequence.push(i);
    }
  }

  return sequence;
}

class SpriteSheet {
  constructor({
    image,
    frameWidth,
    frameHeight,
    frameMargin,
    animations
  } = {}) {
    this.animations = {};

    this.image = image;

    this.frame = {
      width: frameWidth,
      height: frameHeight,
      margin: frameMargin
    };

    this._f = (image.width / frameWidth) | 0;

    this.createAnimations(animations);
  }

  createAnimations(animations) {
    let sequence, name;

    for (name in animations) {
      let { frames, frameRate, loop } = animations[name];

      // array that holds the order of the animation
      sequence = [];

      // add new frames to the end of the array
      [].concat(frames).map(frame => {
        sequence = sequence.concat(parseFrames(frame));
      });

      this.animations[name] = Animation({
        spriteSheet: this,
        frames: sequence,
        frameRate,
        loop,
        noInterrupt: false
      });
    }
  }
}

export default function spriteSheetFactory(properties) {
  return new SpriteSheet(properties);
}
spriteSheetFactory.prototype = SpriteSheet.prototype;
spriteSheetFactory.class = SpriteSheet;
