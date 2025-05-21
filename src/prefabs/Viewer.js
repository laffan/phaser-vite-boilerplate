import Phaser from 'phaser';

export default class Viewer extends Phaser.GameObjects.Sprite {
  // Top-level controls for mask blur and scale
  static MASK_BLUR = '3px';
  static MASK_SCALE = 0.98;

  constructor(scene, x, y, entry) {
    super(scene, x, y, '__MISSING');
    this.entry = entry;
    this.setAlpha(0);
    this.setOrigin(0.5);
    this.scene = scene;

    scene.add.existing(this);

    // Use the mainCircleSize from the scene if available
    const circleDiameter = scene.mainCircleSize || (Math.min(window.innerHeight, window.innerWidth) / 1.5);
    this.targetDiameter = circleDiameter - 40;

    const key = `entry-img-${Phaser.Utils.String.UUID()}`;
    const imagePath = `entries/img/${entry.filename}.jpg`;

    scene.load.image(key, imagePath);
    scene.load.once(`filecomplete-image-${key}`, () => {
      this.setTexture(key);
      this.scaleToFit(this.targetDiameter);

      const maskDiameter = Math.max(this.displayWidth, this.displayHeight);
      this.applyBlurredMask(
        scene,
        maskDiameter,
        Viewer.MASK_BLUR,
        Viewer.MASK_SCALE
      );

      scene.tweens.add({
        targets: this,
        alpha: 1,
        duration: 500,
        ease: 'Power2'
      });
    });

    scene.load.start();
    
    // Add method to handle resize
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  // Method to scale the image to fit within a circular container
  scaleToFit(targetDiameter) {
    const scaleFactor = Math.min(
      targetDiameter / this.width,
      targetDiameter / this.height
    );
    this.setScale(scaleFactor);
  }

  // Handle resize events
  handleResize() {
    // Calculate new target diameter based on updated circle size
    const circleDiameter = this.scene.mainCircleSize || (Math.min(window.innerHeight, window.innerWidth) / 1.5);
    this.targetDiameter = circleDiameter - 40;

    // Center the image
    this.x = this.scene.cameras.main.centerX;
    this.y = this.scene.cameras.main.centerY;

    // Update image scale
    this.scaleToFit(this.targetDiameter);

    // Update mask if it exists
    if (this.maskImage && this.maskKey) {
      const maskDiameter = Math.max(this.displayWidth, this.displayHeight);
      // Update mask position
      this.maskImage.setPosition(this.x, this.y);
      // Update mask size
      const scaledDiameter = maskDiameter * Viewer.MASK_SCALE;
      this.maskImage.setDisplaySize(scaledDiameter, scaledDiameter);
    }
  }

  // Method to create a blurred circular mask and apply it
  applyBlurredMask(scene, maskDiameter, blur = Viewer.MASK_BLUR, scale = Viewer.MASK_SCALE) {
    const blurRadius = parseInt(blur); // e.g. 3 for '3px'
    const extra = blurRadius * 2; // Add padding for blur on all sides
    const scaledDiameter = maskDiameter * scale;
    const canvasSize = scaledDiameter + extra * 2;
    const maskKey = `blurred-mask-${Phaser.Utils.String.UUID()}`;
    const maskCanvas = scene.textures.createCanvas(maskKey, canvasSize, canvasSize);
    const ctx = maskCanvas.getContext();

    ctx.save();
    ctx.filter = `blur(${blur})`;
    ctx.beginPath();
    ctx.arc(canvasSize / 2, canvasSize / 2, scaledDiameter / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();

    maskCanvas.refresh();

    const maskImage = scene.add.image(this.x, this.y, maskKey)
      .setDisplaySize(scaledDiameter, scaledDiameter)
      .setVisible(false);

    // Store the mask image for later updates
    this.maskImage = maskImage;
    this.maskKey = maskKey;
    this.scaledMaskDiameter = scaledDiameter;

    const mask = scene.add.bitmapMask(maskImage);
    this.setMask(mask);
  }

  // Clean up event listener when destroyed
  destroy(fromScene) {
    window.removeEventListener('resize', this.handleResize);
    super.destroy(fromScene);
  }
}