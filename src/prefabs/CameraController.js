export class CameraController {
  constructor(scene) {
    this.scene = scene;
    this.dragStart = { x: 0, y: 0 };
    this.initCamera();
  }

  initCamera() {
    this.scene.input.on("pointerdown", this.onDragStart, this);
    this.scene.input.on("pointermove", this.onDragMove, this);
    this.scene.input.on("pointerup", this.onDragEnd, this);
  }

  onDragStart(pointer) {
    this.isDragging = true;
    this.dragStart.x = pointer.x + this.scene.cameras.main.scrollX;
    this.dragStart.y = pointer.y + this.scene.cameras.main.scrollY;
  }

  onDragMove(pointer) {
    if (!this.isDragging) return;
    this.scene.cameras.main.scrollX = this.dragStart.x - pointer.x;
    this.scene.cameras.main.scrollY = this.dragStart.y - pointer.y;
  }

  onDragEnd() {
    this.isDragging = false;
  }
}
