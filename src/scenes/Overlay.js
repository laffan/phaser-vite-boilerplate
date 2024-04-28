export class Overlay extends Phaser.Scene {
  constructor() {
    super({ key: "Overlay", active: true });
  }

  create() {
    this.button = this.add.text(50, 50, "Waypoint One", {
      fontFamily: "digitalDisco",
      fontSize: "32px",
      fill: "#000000",
    }); // Interactivity, etc.

    this.button.setInteractive().on("pointerdown", () => {

      this.scrollCamera( 300, 300, 500 );

      
    });
  }


  scrollCamera( x, y, speed ) {
    const playScene = this.scene.get("PlayScene");
    playScene.events.emit('scrollCameraEvent', { x, y, speed })
  }
}
