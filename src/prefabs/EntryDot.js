import Phaser from 'phaser';
import { DateTime } from 'luxon';
import Tooltip from './Tooltip';

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
    
    // Ensure correct origins and display size
    this.setOrigin(0.5, 0.5);
    
    // Make sure the sprite displays at the exact size we want
    const dotDiameter = this.radius * 2;
    this.setDisplaySize(dotDiameter, dotDiameter);

    scene.add.existing(this);
    
    // Create inner dot (initially invisible)
    this.innerDot = scene.add.circle(x, y, EntryDot.ACTIVE_RADIUS * 0.75, 0xffffff, 1);
    this.innerDot.setVisible(false);

    // Create gray hover dot (smaller than main dot, initially invisible)
    this.hoverDot = scene.add.circle(x, y, EntryDot.NORMAL_RADIUS * 0.5, 0x888888, 1);
    this.hoverDot.setVisible(false);
    this.hoverDot.setDepth(999);

    // Tooltip instance (shared per EntryDot)
    this.tooltip = scene.tooltipInstance || new Tooltip(scene);
    scene.tooltipInstance = this.tooltip;

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
      const line1 = dt ? dt.toFormat('h:mm a') : 'Invalid date';
      const line2 = dt ? dt.toFormat('cccc, LLLL d') : '';

      const offset = 10;
      let tooltipX, tooltipY, alignRight;
      if (this.x < this.centerX) {
        // Tooltip on left: right-align, position to left of dot
        tooltipX = this.x - this.width / 2 - offset;
        alignRight = true;
      } else {
        // Tooltip on right: left-align, position to right of dot
        tooltipX = this.x + this.width / 2 + offset;
        alignRight = false;
      }
      tooltipY = this.y - this.height / 2;

      this.tooltip.show(line1, line2, tooltipX, tooltipY, alignRight);

      // Show gray hover dot only if not active
      if (this.hoverDot) {
        if (EntryDot.activeDot !== this) {
          this.hoverDot.setPosition(this.x, this.y);
          this.hoverDot.setVisible(true);
        } else {
          this.hoverDot.setVisible(false);
        }
      }
    });

    this.on('pointerout', () => {
      this.tooltip.hide();

      // Hide gray hover dot
      if (this.hoverDot) {
        this.hoverDot.setVisible(false);
      }
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
    
    // Update display size to match the active radius
    const activeDiameter = this.activeRadius * 2;
    this.setDisplaySize(activeDiameter, activeDiameter);
    
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
    
    // Update display size to match the normal radius
    const normalDiameter = EntryDot.NORMAL_RADIUS * 2;
    this.setDisplaySize(normalDiameter, normalDiameter);
  }
  
  // Update the inner dot position when the main dot moves
  updatePosition(x, y) {
    this.x = x;
    this.y = y;
    if (this.innerDot) {
      this.innerDot.setPosition(x, y);
    }
    if (this.hoverDot) {
      this.hoverDot.setPosition(x, y);
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
    
    // Calculate texture size with a slight padding for the line thickness
    const padding = 1;
    const textureSize = (radius * 2) + (padding * 2);
    
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });

    // Use a 1px line with full alpha
    graphics.lineStyle(1, 0xffffff, 1);
    
    // Center the circle in the texture, accounting for the padding
    const centerPoint = radius + padding;
    graphics.strokeCircle(centerPoint, centerPoint, radius);

    // Generate the texture at the exact size needed
    graphics.generateTexture(key, textureSize, textureSize);
    graphics.destroy();

    return key;
  }
}