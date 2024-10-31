import * as PIXI from 'pixi.js';
import * as PixiLiv2D from 'pixi-live2d-display-lipsyncpatch'
PixiLiv2D.Live2DModel.registerTicker(PIXI.Ticker)

export class Live2DClient {
  modelURL: string
  model: PixiLiv2D.Live2DModel<PixiLiv2D.InternalModel> | undefined;
  app: PIXI.Application | undefined;
  audiQueue: string[] = [];
  isPlaying: boolean = false;

  constructor() {
    this.modelURL = './Haru/Haru.model3.json'
  }

  async initLive2D() {
    const app = new PIXI.Application({
      view: document.getElementById('live2d') as HTMLCanvasElement,
      autoStart: true,
      resizeTo: window
    });

    this.model = await PixiLiv2D.Live2DModel.from('./Haru/Haru.model3.json')
    this.model.rotation = Math.PI;
    this.model.skew.x = Math.PI;
    this.model.scale.set(0.65);
    this.model.anchor.set(0.5, 0.5);
    this.model.position.set(window.innerWidth / 2, 1400);
    app.stage.addChild(this.model  as unknown as PIXI.DisplayObject);
    let background = new PIXI.Graphics();
    background.beginFill(0xFFA500); // Orange color
    background.drawRect(0, 0, app.screen.width, app.screen.height);
    background.endFill();
    app.stage.addChildAt(background as unknown as PIXI.DisplayObject, 0); // Add the background first
    this.app = app;
    (window as any).app = app
    this.app.render()
  }

  async handleSpeak(link: string) {
    var volume = 1; // [Optional arg, can be null or empty] [0.0 - 1.0]
    var expression = 4; // [Optional arg, can be null or empty] [index|name of expression]
    var resetExpression = true; // [Optional arg, can be null or empty] [true|false] [default: true] [if true, expression will be reset to default after animation is over]
    var crossOrigin = "anonymous";
    await this.model?.speak(
      link,
      {
        volume: volume,
        expression:expression,
        resetExpression:resetExpression,
        crossOrigin: crossOrigin,
        onFinish: () => {
          this.model?.stopSpeaking()
          const timeout = setTimeout(() => {
            this.playQueue()
            clearTimeout(timeout)
          }, 0)
        }
    })
  }

  addToQueue(link: string) {
    this.audiQueue.push(link);
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.playQueue()
      // const delay = setTimeout(() => {
      //   this.playQueue()
      //   clearTimeout(delay)
      // }, 500)
    }
  }

  playQueue() {
    if (this.audiQueue.length > 0) {
      this.handleSpeak(this.audiQueue.shift() as string);
    } else {
      this.isPlaying = false;
    }
  }
}