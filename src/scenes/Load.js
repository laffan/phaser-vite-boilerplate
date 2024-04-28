import { Scene } from "phaser";
import { loadFonts } from "../helpers/loadFonts";

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

    // 🌺 Load raw Tiled JSON in to game 
    this.load.json({
      key: "demoLevel",
      url: JSONFilename,
    });

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
      this.scene.launch("Overlay");
    }
  }
}
