import { Scene } from "phaser";

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

 // Add the sprite and make it interactive
    this.demoImg = this.add.sprite(50, 90, "demo_image").setInteractive({ useHandCursor: true });

    // Set initial properties
    this.demoImg.setOrigin(0);
    this.demoImg.setAlpha(0.1);
    this.demoImg.setScale(0.5);

    this.input.setDraggable(this.demoImg);
    this.input.on('dragstart', function (pointer, gameObject) {
      gameObject.setAlpha(0.5);
    });
    this.input.on('drag', function (pointer, gameObject, dragX, dragY) {
      gameObject.x = dragX;
      gameObject.y = dragY;
    });
    this.input.on('dragend', function (pointer, gameObject) {
      gameObject.setAlpha(0.1);
    });
  }

  update() {}
}
