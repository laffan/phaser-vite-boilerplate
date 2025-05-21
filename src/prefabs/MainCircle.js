import Phaser from 'phaser';

export default class MainCircle extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, size, color = 0xffffff) {
    const key = MainCircle.createCircleTexture(scene, size, color);
    super(scene, x, y, key);
    this.setDisplaySize(size, size);
    scene.add.existing(this);
  }

  static createCircleTexture(scene, size, color) {
    const key = `mainCircle-${color}-${size}-${Phaser.Math.RND.uuid()}`;
    const graphics = scene.add.graphics();
    graphics.lineStyle(1, color, 1);

    // Dashed circle parameters
    const radius = (size - 1) / 2;
    const centerX = size / 2;
    const centerY = size / 2;
    const dashPx = 5;
    const gapPx = 8;
    const dashLength = dashPx / radius; // radians per dash
    const gapLength = gapPx / radius;   // radians per gap

    for (let angle = 0; angle < Math.PI * 2; angle += dashLength + gapLength) {
      const startAngle = angle;
      const endAngle = Math.min(angle + dashLength, Math.PI * 2);

      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);

      graphics.lineBetween(x1, y1, x2, y2);
    }

    graphics.generateTexture(key, size, size);
    graphics.destroy();
    return key;
  }
}
