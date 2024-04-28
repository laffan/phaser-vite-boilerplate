export class CameraController {
  constructor(scene) {
    this.scene = scene;
    this.lastScrollX = scene.cameras.main.scrollX;
    this.lastScrollY = scene.cameras.main.scrollY;

    this.isMoving = false;
    this.dragStart = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.isDragging = false;
    this.friction = 0.99; // 1.0 = continuous scrolling
    this.movementThreshold = 0.01; // 1.0 = continuous scrolling
    this.initCamera();
  }

  lerp(start, end, t) {
    return start * (1 - t) + end * t;
  }

  initCamera() {
    this.scene.input.on("pointerdown", this.onDragStart, this);
    this.scene.input.on("pointermove", this.onDragMove, this);
    this.scene.input.on("pointerup", this.onDragEnd, this);
    this.scene.events.on("update", this.update, this);
  }

  onDragStart(pointer) {
    this.isDragging = true;
    this.dragStart.x = pointer.x + this.scene.cameras.main.scrollX;
    this.dragStart.y = pointer.y + this.scene.cameras.main.scrollY;
    this.velocity.x = 0;
    this.velocity.y = 0;
  }

  onDragMove(pointer) {
    if (!this.isDragging) return;
    const newX = this.dragStart.x - pointer.x;
    const newY = this.dragStart.y - pointer.y;
    this.velocity.x = newX - this.scene.cameras.main.scrollX;
    this.velocity.y = newY - this.scene.cameras.main.scrollY;
    this.scene.cameras.main.scrollX = newX;
    this.scene.cameras.main.scrollY = newY;
    this.updateMovementStatus();
  }

  onDragEnd() {
    this.isDragging = false;
  }

  easeDragging() {
    if (!this.isDragging) {
      // Apply friction to slow down the inertia over time
      this.velocity.x *= this.friction;
      this.velocity.y *= this.friction;

      // Update the camera scroll based on the velocity
      if (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1) {
        this.scene.cameras.main.scrollX += this.velocity.x;
        this.scene.cameras.main.scrollY += this.velocity.y;
      } else {
        this.velocity.x = 0;
        this.velocity.y = 0;
      }
    }
  }

  updateMovementStatus() {
    let currentX = this.scene.cameras.main.scrollX;
    let currentY = this.scene.cameras.main.scrollY;

    // Check if the camera has moved
    if (currentX !== this.lastScrollX || currentY !== this.lastScrollY) {
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }

    // Update last positions for the next frame
    this.lastScrollX = currentX;
    this.lastScrollY = currentY;
  }

  scrollCamera(x, y, speed) {
    let startX = this.scene.cameras.main.scrollX;
    let startY = this.scene.cameras.main.scrollY;
    let distance = Phaser.Math.Distance.Between(startX, startY, x, y);
    let duration = distance / speed;

    let startTime = Date.now();
    let endTime = startTime + duration * 1000; // Convert seconds to milliseconds

    // Cancel any existing scroll in progress (if needed)
    if (this.scrollTween) {
      this.scrollTween.remove();
    }

    this.scrollTween = this.scene.time.addEvent({
      delay: 20, // ms, can be adjusted for smoother updates
      callback: () => {
        let now = Date.now();
        let t = Math.min(1, (now - startTime) / (endTime - startTime));

        let easeFunction = Phaser.Math.Easing.Cubic.InOut;
        let easedT = easeFunction(t);

        let newX = this.lerp(startX, x, easedT);
        let newY = this.lerp(startY, y, easedT);
        this.scene.cameras.main.setScroll(newX, newY);
        // this.updateMovementStatus();

        // Stop the tween if it has reached its end time
        if (now >= endTime) {
          // this.updateMovementStatus();
          console.log("SCROLLED");
          this.scrollTween.remove();
          this.scene.cameras.main.setScroll(x, y); // Ensure it lands exactly on the target
        }
      },
      loop: true,
    });
  }

  update() {
    this.easeDragging();
    this.updateMovementStatus();
  }
}
