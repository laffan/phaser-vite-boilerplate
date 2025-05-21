import Phaser from 'phaser';
import { DateTime } from 'luxon';

export default class EntryDot extends Phaser.GameObjects.Sprite {
  static activeDot = null; // Static property to track the currently active dot
  static NORMAL_RADIUS = 10; // Size when inactive
  static ACTIVE_RADIUS = 20; // Size when active
  
  constructor(scene, x, y, entry, radius = EntryDot.ACTIVE_RADIUS, centerX = window.innerWidth / 2) {
    // Create both textures - normal and active
    const normalKey = EntryDot.drawDot(scene, EntryDot.NORMAL_RADIUS);
    const activeKey = EntryDot.drawDot(scene, EntryDot.ACTIVE_RADIUS);

    // Start with the normal texture
    super(scene, x, y, normalKey);

    this.entry = entry;
    this.centerX = centerX;
    this.activeKey = activeKey;
    this.normalKey = normalKey;
    this.radius = EntryDot.NORMAL_RADIUS; // Start with normal radius
    this.activeRadius = EntryDot.ACTIVE_RADIUS;
    this.setOrigin(0.5, 0.5);

    scene.add.existing(this);
    
    // Create inner dot (initially invisible)
    this.innerDot = scene.add.circle(x, y, EntryDot.ACTIVE_RADIUS * 0.75, 0xffffff, 1);
    this.innerDot.setVisible(false);

    // Tooltip text object (hidden by default)
    this.tooltip = scene.add.text(0, 0, '', {
      font: '16px Arial',
      fill: '#fff',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 8, y: 4 }
    }).setDepth(1000).setVisible(false);

    // Enable input and handle click
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => {
      console.log(this.entry);
      // Emit event to show this entry in the viewer
      this.scene.events.emit('entry-selected', this.entry);
      
      // Set this as the active dot
      EntryDot.setActiveDot(this);
      
      // Pause the second hand if it exists
      if (this.scene.secondHand) {
        this.scene.secondHand.pauseRotation();
      }
    });

    this.on('pointerover', (pointer) => {
      const dt = EntryDot.parseTimestamp(this.entry.timestamp);
      const formatted = dt
        ? `${dt.toFormat('h:mm a')}\n${dt.toFormat('cccc, LLLL d')}`
        : 'Invalid date';

      this.tooltip.setText(formatted);

      // Decide tooltip side based on dot position
      const offset = 10;
      if (this.x < this.centerX) {
        // Left side: show tooltip to the left
        this.tooltip.setPosition(this.x - this.width / 2 - this.tooltip.width - offset, this.y - this.height / 2);
      } else {
        // Right side: show tooltip to the right
        this.tooltip.setPosition(this.x + this.width / 2 + offset, this.y - this.height / 2);
      }
      this.tooltip.setVisible(true);
    });

    this.on('pointerout', () => {
      this.tooltip.setVisible(false);
    });
  }

  static parseTimestamp(timestamp) {
    // Example: "2025-05-17--1621"
    const match = timestamp.match(/^(\d{4}-\d{2}-\d{2})--(\d{2})(\d{2})$/);
    if (!match) return null;
    const [ , date, hour, minute ] = match;
    return DateTime.fromFormat(`${date} ${hour}${minute}`, 'yyyy-MM-dd HHmm');
  }

  // Method to show the inner dot and switch to active texture
  showInnerDot() {
    if (this.innerDot) {
      this.innerDot.setVisible(true);
    }
    
    // Switch to active texture
    this.setTexture(this.activeKey);
    this.radius = this.activeRadius; // Update the collision radius
    
    // Add a small visual effect
    this.scene.tweens.add({
      targets: this,
      alpha: 0.8,
      yoyo: true,
      duration: 100,
      ease: 'Power2'
    });
  }
  
  // Method to hide the inner dot and switch to normal texture
  hideInnerDot() {
    if (this.innerDot) {
      this.innerDot.setVisible(false);
    }
    
    // Switch to normal texture
    this.setTexture(this.normalKey);
    this.radius = EntryDot.NORMAL_RADIUS; // Update the collision radius
  }
  
  // Update the inner dot position when the main dot moves
  updatePosition(x, y) {
    this.x = x;
    this.y = y;
    if (this.innerDot) {
      this.innerDot.setPosition(x, y);
    }
  }
  
  // Static method to set the active dot
  static setActiveDot(dot) {
    // Hide inner dot on previous active dot
    if (EntryDot.activeDot && EntryDot.activeDot !== dot) {
      EntryDot.activeDot.hideInnerDot();
    }
    
    // Set new active dot and show its inner dot
    EntryDot.activeDot = dot;
    if (dot) {
      dot.showInnerDot();
    }
  }
  
  static drawDot(scene, radius) {
    const key = `entry-dot-${Phaser.Math.RND.uuid()}`;
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

    graphics.lineStyle(1, 0xffffff, 1); // Outline only, width 3
    graphics.strokeCircle(radius, radius, radius);

    graphics.generateTexture(key, radius * 2, radius * 2);
    graphics.destroy();

    return key;
  }
}