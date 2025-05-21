import Phaser from 'phaser';

export default class MainCircle extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, size, color = 0xffffff) {
    const key = MainCircle.createCircleTexture(scene, size, color);
    super(scene, x, y, key);
    this.setDisplaySize(size, size);
    scene.add.existing(this);
  }

  static createCircleTexture(scene, size, color) {
    // Create a texture at the exact size we need
    const key = `mainCircle-${color}-${size}-${Phaser.Math.RND.uuid()}`;
    
    // Add a little padding for the line
    const padding = 1;
    const effectiveSize = size + padding * 2;
    const graphics = scene.add.graphics();
    
    // Use a clean 1px line
    graphics.lineStyle(1, color, 1);

    // Dashed circle parameters
    const radius = size / 2;
    const centerX = effectiveSize / 2;
    const centerY = effectiveSize / 2;
    const dashPx = 8;
    const gapPx = 10;
    const dashLength = dashPx / radius; // radians per dash
    const gapLength = gapPx / radius;   // radians per gap

    // Draw each dash segment with precise pixel alignment
    for (let angle = 0; angle < Math.PI * 2; angle += dashLength + gapLength) {
      const startAngle = angle;
      const endAngle = Math.min(angle + dashLength, Math.PI * 2);

      // Calculate coordinates precisely
      let x1 = centerX + radius * Math.cos(startAngle);
      let y1 = centerY + radius * Math.sin(startAngle);
      let x2 = centerX + radius * Math.cos(endAngle);
      let y2 = centerY + radius * Math.sin(endAngle);
      
      // Draw the line segment
      graphics.beginPath();
      graphics.moveTo(x1, y1);
      graphics.lineTo(x2, y2);
      graphics.strokePath();
    }

    // Generate the texture
    graphics.generateTexture(key, effectiveSize, effectiveSize);
    graphics.destroy();
    return key;
  }
}
