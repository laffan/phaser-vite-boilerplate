import { Scene } from "phaser";
import { CameraController } from "./../prefabs/CameraController";
import { addLazyLayers, checkLayerVisability } from "../helpers/lazyPhaser";

export class PlayScene extends Scene {
  constructor() {
    super("PlayScene");
    this.worldViewLoaded = false;
    // Set of loading images
    this.loading = new Set();
  }

  create() {
    this.cameraController = new CameraController(this);

    if (this.worldViewLoaded) {
      console.log("this.cameras.main.worldView.width");
      console.log(this.cameras.main.worldView.width);

      this.map = this.add.tilemap("demo_JSON"); // Create map

      const background = this.map.addTilesetImage(
        "TS_Background_Tiles",
        "KY_background"
      ); // Add background tileset

      this.map.createLayer("LR_Background", background, 0, 0); // Add BG
      // 🌺  Add layers
      addLazyLayers(this, ["LR_Media"], "demoLevel");
      // 🌺  First visibility check
      checkLayerVisability(this, "demoLevel", this.cameras.main.worldView);
    }
  }

  update() {
    //   // For some reason worldView's size isn't ready when the scene loads.
    if (this.cameras.main.worldView.width > 0 && !this.worldViewLoaded) {
      this.worldViewLoaded = true;
      this.create();
    }

    if (this.cameraController.isDragging) {
      // 🌺  If camera is dragging, update check
      checkLayerVisability(this, "demoLevel", this.cameras.main.worldView);
    }
  }
}
