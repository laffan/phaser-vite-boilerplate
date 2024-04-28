import { Scene } from "phaser";
import { CameraController } from "./../prefabs/CameraController";
import { addLazyLayers, checkLayerVisability } from "../helpers/lazyLoadLayer";

export class PlayScene extends Scene {
  constructor() {
    super("PlayScene");
    this.worldViewLoaded = false;
    this.cameraController = false;
  }

  create() {
    console.log("Create");
    this.cameraController = new CameraController(this);

    // Set up event to trigger camera scrolling from other scenes
    this.events.on('scrollCameraEvent', this.scrollCameraHandler, this );

    // Create map for tiles 
    this.map = this.add.tilemap("demo_JSON"); // Create map

    // Add Background tiles
    const background = this.map.addTilesetImage(
      "TS_Background_Tiles",
      "KY_background"
    ); 

    this.map.createLayer("LR_Background", background, 0, 0); // Add BG

    // 🌺  1. Add lazy layers
    addLazyLayers(this, ["LR_Media"], "demoLevel");

  }

  scrollCameraHandler( options ){
      const { x, y, speed } = options;
      this.cameraController.scrollCamera(x, y, speed);
  }

  update() {
    // 🌺  2. Initialize first Layer check after camera loads
    if (this.cameras.main.worldView.width > 0 && !this.worldViewLoaded) {
      this.worldViewLoaded = true;
      checkLayerVisability(this, "demoLevel", this.cameras.main.worldView);
    }

    // 🌺  3. Subsequent layer checks when camea moves.
    if (this.cameraController.isMoving) {
      checkLayerVisability(this, "demoLevel", this.cameras.main.worldView);
    }
  }
}
