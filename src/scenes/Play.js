import { Scene, GameObjects } from "phaser";

export class PlayScene extends Scene {
  constructor() {
    super("PlayScene");
  }

  preload() {}

  create() {
    this.add.text(50, 50, "Phaser 3.7", {
      fontFamily: "digitalDisco",
      fontSize: "32px",
      fill: "#ffffff",
    });

    this.demoImg = this.add.sprite(
        50,
        90,
        "demo_image"
      );
      this.demoImg.setOrigin(0);
      this.demoImg.setAlpha(0.1);
      this.demoImg.setScale(0.5);

  }

  update() {}
}
