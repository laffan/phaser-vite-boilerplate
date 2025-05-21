import Phaser from 'phaser';

export default class SecondHand extends Phaser.GameObjects.Container {
  constructor(scene, x, y, radius, length = 5, color = 0x888888, thickness = 2) {
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
    
    // Clock-like behavior
    this.tickTimer = null;
    this.lastTick = 0;
    
    // Initialize second position to match the real second of the current time
    const now = new Date();
    this.currentSecond = now.getSeconds();
    this.targetSecond = this.currentSecond;
    this.isGliding = false;
    
    // Set initial rotation (12 o'clock is -PI/2)
    this.rotation = (this.currentSecond / 60) * Math.PI * 2 - Math.PI / 2;
    
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
    
    // Handle smooth rotation
    if (this.isGliding) {
      // Animation is handled by the tween, so nothing to do here
      return;
    }
    
    // Check if a second has passed
    const currentTime = Math.floor(time / 1000); // Convert to seconds
    
    if (currentTime > this.lastTick) {
      this.lastTick = currentTime;
      this.tick();
    }
  }
  
  // Move the hand forward by one second (1/60th of a full rotation)
  tick() {
    // Calculate the next second
    this.targetSecond = (this.currentSecond + 1) % 60;
    
    // Start the gliding animation
    this.startGlide();
  }
  
  // Start a smooth glide to the next position
  startGlide() {
    // Instead of directly animating rotation, we'll use a point on a circle
    // This avoids rotation issues when crossing boundaries
    this.isGliding = true;
    
    // Calculate the new position
    const nextAngle = (this.targetSecond / 60) * Math.PI * 2;
    
    // Calculate a point on a circle 
    const pointX = Math.cos(nextAngle - Math.PI/2);
    const pointY = Math.sin(nextAngle - Math.PI/2);
    
    // Create a tween to animate a dummy object
    const dummy = { t: 0 };
    
    this.scene.tweens.add({
      targets: dummy,
      t: 1,
      duration: 300, // 300ms for the gliding motion
      ease: 'Cubic.easeInOut',
      onUpdate: () => {
        // Calculate the current angle using spherical interpolation
        const currentAngle = this.lerpAngle(
          (this.currentSecond / 60) * Math.PI * 2, 
          nextAngle,
          dummy.t
        );
        
        // Set the rotation directly (no intermediate angles stored)
        this.rotation = currentAngle - Math.PI/2;
      },
      onComplete: () => {
        // Update the current second when glide is complete
        this.currentSecond = this.targetSecond;
        this.isGliding = false;
        
        // Emit an event when the second hand reaches its destination
        this.scene.events.emit('second-hand-tick', this);
        
        // Add a delay before next movement (700ms pause)
        this.scene.time.delayedCall(700, () => {
          // Nothing to do here, the next tick will handle movement
        });
      }
    });
  }
  
  // Circular angle interpolation - handles wrapping correctly
  lerpAngle(a, b, t) {
    // Ensure angles are in the range [0, 2π]
    a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    b = ((b % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    
    // Find the shortest path
    let delta = b - a;
    
    // Handle the case where going the other way around the circle is shorter
    if (Math.abs(delta) > Math.PI) {
      if (delta > 0) {
        delta = delta - Math.PI * 2;
      } else {
        delta = delta + Math.PI * 2;
      }
    }
    
    // Linear interpolation with the correct delta
    return a + delta * t;
  }
  
  pauseRotation() {
    if (this.isPaused) return;
    
    this.isPaused = true;
    this.isGliding = false;
    
    // Stop any ongoing tweens on this object
    this.scene.tweens.killTweensOf(this);
    
    // Clear any existing timer
    if (this.pauseTimer) {
      this.pauseTimer.remove();
    }
    
    // Create a new pause timer
    this.pauseTimer = this.scene.time.delayedCall(this.pauseDuration, () => {
      this.isPaused = false;
      this.lastTick = Math.floor(this.scene.time.now / 1000);
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