import Phaser from 'phaser';

export default class SecondHand extends Phaser.GameObjects.Container {
  // Controls how many seconds it takes to complete one full circle
  static REVOLUTION_DURATION = 60;
  constructor(scene, x, y, radius, length = 5, color = 0x888888, thickness = 2, revolutionDuration = SecondHand.REVOLUTION_DURATION) {
    super(scene, x, y);
    
    this.radius = radius;
    this.isPaused = false;
    this.pauseTimer = null;
    this.pauseDuration = 5000; // 5 seconds in milliseconds
    this.defaultLength = length;
    this.currentLength = length;
    this.color = color;
    this.thickness = thickness;
    this.inCooldown = false;
    
    // Revolution duration in seconds
    this.revolutionDuration = revolutionDuration;
    
    // Track time for smooth movement
    this.startTime = scene.time.now;
    this.lastRotationTime = 0;
    
    // Last triggered angle for cooldown mechanism
    this.lastTriggeredAngle = null;
    this.triggerCooldownDuration = 3000; // 3 seconds cooldown between triggering dots
    this.triggerCooldownActive = false;
    this.triggerCooldownTimer = null;
    
    // Set initial rotation (12 o'clock is -PI/2)
    this.rotation = -Math.PI / 2;
    
    // Create the second hand line
    this.hand = scene.add.graphics();
    this.redrawHand();
    
    // Add the graphics object to the container
    this.add(this.hand);
    
    // Add the container to the scene
    scene.add.existing(this);
  }
  
  update(time, delta) {
    if (this.isPaused) return;
    
    // Calculate how much time has passed since the start
    // Total milliseconds elapsed
    const elapsed = time - this.startTime;
    
    // Convert to seconds and apply modulo to repeat every revolutionDuration seconds
    const progressSeconds = (elapsed / 1000) % this.revolutionDuration;
    
    // Calculate the rotation progress (0 to 1 for a full revolution)
    const progressRatio = progressSeconds / this.revolutionDuration;
    
    // Calculate the angle (2π radians for a full circle)
    const angle = progressRatio * Math.PI * 2;
    
    // Set the rotation with -Math.PI/2 offset to start at 12 o'clock
    this.rotation = angle - Math.PI / 2;
    
    // Handle dot triggering
    this.checkDotTrigger(angle);
    
    // If the hand completes a full second movement, emit the tick event
    // This assumes we want 60 ticks per revolution regardless of duration
    const secondIndex = Math.floor(progressRatio * 60);
    const lastSecondIndex = Math.floor((this.lastRotationTime / 1000 % this.revolutionDuration) / this.revolutionDuration * 60);
    
    if (secondIndex !== lastSecondIndex) {
      // Emit the tick event for components that depend on it
      this.scene.events.emit('second-hand-tick', this);
    }
    
    // Store the current time for next comparison
    this.lastRotationTime = elapsed;
  }
  
  // Set the revolution duration in seconds
  setRevolutionDuration(seconds) {
    // Save current progress position before changing the duration
    const elapsed = this.scene.time.now - this.startTime;
    const oldProgressRatio = (elapsed / 1000 % this.revolutionDuration) / this.revolutionDuration;
    
    // Update the duration
    this.revolutionDuration = seconds;
    
    // Adjust the start time to maintain the current position with the new duration
    const newElapsedSeconds = oldProgressRatio * this.revolutionDuration;
    this.startTime = this.scene.time.now - (newElapsedSeconds * 1000);
  }
  
  pauseRotation() {
    if (this.isPaused) return;
    
    this.isPaused = true;
    
    // Store the current elapsed time when paused
    const currentElapsed = this.scene.time.now - this.startTime;
    
    // Clear any existing timer
    if (this.pauseTimer) {
      this.pauseTimer.remove();
    }
    
    // Create a new pause timer
    this.pauseTimer = this.scene.time.delayedCall(this.pauseDuration, () => {
      // When resuming, adjust the start time to maintain proper position
      this.startTime = this.scene.time.now - currentElapsed;
      this.isPaused = false;
    });
  }
  
  // Check if we should trigger a dot based on the current position
  checkDotTrigger(currentAngle) {
    // Only skip if we're in cooldown or paused
    if (this.triggerCooldownActive || this.isPaused) return;
    
    // Normalize angles to be between 0 and 2π
    currentAngle = ((currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    
    // Track the current angle for debugging or future use
    this.lastTriggeredAngle = currentAngle;
    
    // Emit event to check for dot collisions on every frame
    // Play.js will handle the actual collision detection
    this.scene.events.emit('second-hand-dot-check', this);
  }
  
  // Start a cooldown period after triggering a dot
  startTriggerCooldown() {
    if (this.triggerCooldownActive) return;
    
    this.triggerCooldownActive = true;
    
    // Make the second hand semi-transparent during cooldown
    this.setAlpha(0.3);
    
    // Shorten the second hand to 1/3 of normal length
    const normalLength = this.defaultLength;
    this.setHandLength(normalLength / 3, true);
    
    // Clear any existing cooldown timer
    if (this.triggerCooldownTimer) {
      this.triggerCooldownTimer.remove();
    }
    
    // Create a timer to end the cooldown
    this.triggerCooldownTimer = this.scene.time.delayedCall(this.triggerCooldownDuration, () => {
      this.triggerCooldownActive = false;
      
      // Restore full opacity and length
      this.setAlpha(1);
      this.setHandLength(normalLength, true);
    });
  }
  
  // Get current position of the tip of the second hand (the outermost point)
  getHandTipPosition() {
    const totalLength = this.radius + this.currentLength;
    const x = this.x + Math.sin(this.rotation) * totalLength;
    const y = this.y - Math.cos(this.rotation) * totalLength;
    return { x, y };
  }
  
  // Get the point where the second hand intersects with the main circle
  getCircleIntersectionPoint() {
    const x = this.x + Math.sin(this.rotation) * this.radius;
    const y = this.y - Math.cos(this.rotation) * this.radius;
    return { x, y };
  }
  
  // Check if the hand is overlapping with a given point
  isOverlappingPoint(x, y, pointRadius = 10) {
    const circleIntersection = this.getCircleIntersectionPoint();
    const handTip = this.getHandTipPosition();
    
    // Calculate the distance from the point to the hand's line
    const distanceToLine = this.distanceFromPointToLine(
      x, y,
      circleIntersection.x, circleIntersection.y,
      handTip.x, handTip.y
    );
    
    return distanceToLine <= pointRadius;
  }
  
  // Redraw the hand with the current length
  redrawHand() {
    this.hand.clear();
    
    // Use original thickness but ensure it's crisp
    this.hand.lineStyle(this.thickness, this.color, 1);
    
    // Calculate exact line coordinates
    const startY = -this.radius;
    const endY = -(this.radius + this.currentLength);
    
    // Draw using path for better precision
    this.hand.beginPath();
    this.hand.moveTo(0, startY);
    this.hand.lineTo(0, endY);
    this.hand.strokePath();
    
    // Add a small circle at the end of the line for better visibility
    this.hand.fillStyle(this.color, 1);
    this.hand.fillCircle(0, endY, this.thickness / 2);
  }
  
  // Set the hand length with optional animation
  setHandLength(length, animate = false) {
    if (animate) {
      // Animate the hand length change
      this.scene.tweens.add({
        targets: this,
        currentLength: length,
        duration: 200,
        ease: 'Power2',
        onUpdate: () => {
          this.redrawHand();
        }
      });
    } else {
      this.currentLength = length;
      this.redrawHand();
    }
  }
  
  // Update the radius and redraw the hand to match the main circle's size
  setRadius(newRadius) {
    this.radius = newRadius;
    this.redrawHand();
  }

  // Helper function to calculate distance from a point to a line segment
  distanceFromPointToLine(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }
}