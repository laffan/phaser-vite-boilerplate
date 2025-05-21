import Phaser from 'phaser';

export default class Tooltip {
  constructor(scene) {
    this.scene = scene;

    this.line1 = scene.add.text(0, 0, '', {
      fontFamily: 'Courier',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 8, y: 4 }
    }).setDepth(1000).setVisible(false).setScale(0.5);

    this.line2 = scene.add.text(0, 0, '', {
      fontFamily: 'Courier',
      fontSize: '24px',
      color: '#888888',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 8, y: 4 }
    }).setDepth(1000).setVisible(false).setScale(0.5);
  }

  show(line1, line2, x, y, alignRight = false) {
    this.line1.setText(line1);
    this.line2.setText(line2);

    if (alignRight) {
      this.line1.setOrigin(1, 0);
      this.line2.setOrigin(1, 0);
    } else {
      this.line1.setOrigin(0, 0);
      this.line2.setOrigin(0, 0);
    }

    this.line1.setPosition(x, y);
    this.line2.setPosition(x, y + this.line1.height * 0.5);

    this.line1.setVisible(true);
    this.line2.setVisible(true);
  }

  hide() {
    this.line1.setVisible(false);
    this.line2.setVisible(false);
  }
}