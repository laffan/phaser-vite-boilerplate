import Phaser from 'phaser';

export default class Tooltip {
  constructor(scene) {
    this.scene = scene;

    this.line1 = scene.add.text(0, 0, '', {
      fontFamily: 'Courier',
      fontSize: '30px',
      color: '#ffffff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 8, y: 4 }
    }).setDepth(1000).setVisible(false).setScale(0.5);

    this.line2 = scene.add.text(0, 0, '', {
      fontFamily: 'Courier',
      fontSize: '30px',
      color: '#888888',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 8, y: 4 }
    }).setDepth(1000).setVisible(false).setScale(0.5);
  }

  show(line1, line2, x, y, alignRight = false, alignBottom = false) {
    this.line1.setText(line1);
    this.line2.setText(line2);

    // Handle horizontal alignment
    let originX = alignRight ? 1 : 0;
    // Handle vertical alignment
    let originY = alignBottom ? 1 : 0;
    
    // Set origin for both text objects
    this.line1.setOrigin(originX, originY);
    this.line2.setOrigin(originX, originY);

    // Position line1
    this.line1.setPosition(x, y);
    
    // Position line2 relative to line1 (either below or above)
    if (alignBottom) {
      // When tooltip is above the dot, line2 goes above line1
      this.line2.setPosition(x, y - this.line1.height * 0.5);
    } else {
      // When tooltip is below the dot, line2 goes below line1
      this.line2.setPosition(x, y + this.line1.height * 0.5);
    }

    this.line1.setVisible(true);
    this.line2.setVisible(true);
  }

  hide() {
    this.line1.setVisible(false);
    this.line2.setVisible(false);
  }
}