import { Scene } from "phaser";
import { loadFonts } from "../helpers/loadFonts";
import { loadLazyJSON, addLazyLayers } from "../helpers/lazyPhaser";

export class LoadScene extends Scene {
  constructor() {
    super("LoadScene");
    this.fontsLoaded = false;
    this.assetsLoaded = false;
  }

  preload() {
    const { centerX, centerY } = this.cameras.main;
    const { width, height } = this.game.config;
    this.loadingBar = this.add.graphics();

    this.load.on("progress", (value) => {
      this.loadingBar.clear(); // reset fill/line style
      this.loadingBar.fillStyle(0xffffff, 1); // (color, alpha)
      this.loadingBar.fillRect(0, centerY, value, 5); // (x, y, w, h)
    });

    loadFonts(
      [
        { name: "digitalDisco", url: "./fonts/DigitalDisco.ttf" },
        { name: "digitalDiscoThin", url: "./fonts/DigitalDisco-Thin.ttf" },
      ],
      this
    );

    const JSONFilename = "demo.json";

    // Parse tiled JSON normally
    this.load.tilemapTiledJSON("demo_JSON", JSONFilename);

    // 🌺 Save Tiled JSON to registry
    loadLazyJSON(this, "demoLevel", JSONFilename);

    // Add background tiles
    this.load.image("KY_background", "assets/media/background-test.jpg");
  
    this.load.on("complete", () => {
      this.assetsLoaded = true;
    });

    this.events.once(`fontsLoaded_${this.scene.key}`, () => {
      this.fontsLoaded = true;
    });

    this.cameras.main.setBounds(0, 0, width, height);
  }

  update() {
    if (this.assetsLoaded && this.fontsLoaded) {
      this.loadingBar.destroy();
      this.scene.start("PlayScene");
    }
  }
}
