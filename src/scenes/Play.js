import { Scene } from "phaser";
import { DateTime } from "luxon";
import MainCircle from "./../prefabs/MainCircle";
import EntryDot from "./../prefabs/EntryDot";
import Viewer from "./../prefabs/Viewer";
import SecondHand from "./../prefabs/SecondHand";
import isMobile from './../helpers/isMobile';
import KeyboardControl from './../prefabs/KeyboardControl';

export class PlayScene extends Scene {
  constructor() {
    super("PlayScene");
    this.windowSize =
      window.innerHeight < window.innerWidth
        ? window.innerHeight
        : window.innerWidth;
    this.mainCircleSize = this.windowSize / 1.5; // Configurable circle size
    this.sizeRatio = isMobile() ? 1.1: 1.2; // Default size ratio
    
    this.handleResize = this.handleResize.bind(this);
    this.entryDots = [];
    
    // Make this method accessible from console for debugging
    window.setMainCircleSize = this.setMainCircleSize.bind(this);
  }
  
  // Method to explicitly set main circle size and update everything
  setMainCircleSize(size) {
    if (typeof size === 'number' && size > 0) {
      this.mainCircleSize = size;
      console.log(`Setting mainCircleSize to ${size}`);
      this.sizeRatio = this.windowSize / size;
    } else if (typeof size === 'string' && size.includes('/')) {
      // Allow setting as ratio like "1.5" for windowSize/1.5
      const ratio = parseFloat(size);
      if (!isNaN(ratio) && ratio > 0) {
        this.sizeRatio = ratio;
        this.mainCircleSize = this.windowSize / ratio;
        console.log(`Setting mainCircleSize to ${this.mainCircleSize} (windowSize/${ratio})`);
      }
    }
    
    // Recreate all elements with new size
    if (this.scene && this.scene.isActive()) {
      this.createCircle();
      this.drawEntries();
      this.createSecondHand();
      
      // Refresh viewer if exists
      if (this.currentViewer && this.currentViewer.entry) {
        this.showEntry(this.currentViewer.entry);
      }
    }
    
    return this.mainCircleSize;
  }

  create() {
    this.entryData = this.cache.json.get("entryData")[0].entries;
    console.log(this.entryData);
    console.log("Create");
    
    // Trigger cooldown flag
    this.triggerCooldown = false;
    
    this.createCircle();
    this.drawEntries();
    this.keyboardControl = new KeyboardControl(this, this.entryDots);
    this.createSecondHand();
    window.addEventListener("resize", this.handleResize);
    
    // Listen for entry selection events
    this.events.on('entry-selected', this.showEntry, this);
    
    // Listen for second hand tick events
    this.events.on('second-hand-tick', this.onSecondHandTick, this);
    
    // Listen for second hand dot check events
    this.events.on('second-hand-dot-check', this.checkSecondHandDotCollision, this);
    
    // Find and show the closest entry to current local time
    this.showClosestEntry();

    let resizeTimeout = null;

    this.scale.on('resize', () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        window.location.reload();
      }, 300); 
    });
  }
  
  // Traditional on-tick method (keeping for compatibility but not using for dot triggering)
  onSecondHandTick(secondHand) {
    // We're now using the checkSecondHandDotCollision method for dot triggering
  }
  
  // New method to check for dot collisions with the second hand
  checkSecondHandDotCollision(secondHand) {
    // Skip if the hand is in cooldown or paused
    if (secondHand.triggerCooldownActive || secondHand.isPaused) return;
    
    // Find the closest entry dot to the second hand
    const closestDot = this.findClosestEntryDot(secondHand);
    
    if (closestDot) {
      // Trigger the entry to be shown
      this.events.emit('entry-selected', closestDot.entry);
      
      // Start cooldown period on the second hand
      secondHand.startTriggerCooldown();
    }
  }
  
  findClosestEntryDot(secondHand) {
    if (!this.entryDots || !this.entryDots.length) return null;
    
    // Get the point where the second hand intersects with the main circle
    const circleIntersection = secondHand.getCircleIntersectionPoint();
    const dotsInRange = [];
    
    // Find all dots that have any collision with the second hand
    for (const dot of this.entryDots) {
      // Calculate distance from the second hand's line to the dot center
      const distanceToLine = this.distanceFromPointToLine(
        dot.x, dot.y,
        circleIntersection.x, circleIntersection.y,
        secondHand.getHandTipPosition().x, secondHand.getHandTipPosition().y
      );
      
      // If the distance is less than the dot's radius, the hand intersects the dot
      if (distanceToLine <= dot.radius) {
        // Calculate distance from the circle intersection point to the dot center
        const distanceToCircleIntersection = Phaser.Math.Distance.Between(
          circleIntersection.x, circleIntersection.y, dot.x, dot.y
        );
        
        dotsInRange.push({
          dot: dot,
          distance: distanceToCircleIntersection
        });
      }
    }
    
    // If no dots are in range, return null
    if (dotsInRange.length === 0) return null;
    
    // If multiple dots are in range, return the closest one to the circle intersection
    if (dotsInRange.length > 1) {
      dotsInRange.sort((a, b) => a.distance - b.distance);
    }
    
    return dotsInRange[0].dot;
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
  
  createSecondHand() {
    if (this.secondHand) {
      this.secondHand.destroy();
    }
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = this.mainCircleSize / 2;
    
    this.secondHand = new SecondHand(
      this,
      centerX,
      centerY,
      radius,
      30 // Longer hand (30px instead of default 5px)
    );
  }

  createCircle() {
    if (this.circle) {
      this.circle.destroy();
    }
    this.windowSize =
      window.innerHeight < window.innerWidth
        ? window.innerHeight
        : window.innerWidth;
    this.mainCircleSize = this.windowSize / this.sizeRatio; // Update size based on window and ratio
    console.log(`Main circle size: ${this.mainCircleSize}`);
    
    this.circle = new MainCircle(
      this,
      window.innerWidth / 2,
      window.innerHeight / 2,
      this.mainCircleSize
    );
  }

  drawEntries() {
    // Store the current active dot's entry before destroying dots
    const currentEntry = EntryDot.activeDot ? EntryDot.activeDot.entry : null;
    
    // Remove existing dots
    if (this.entryDots && this.entryDots.length) {
      this.entryDots.forEach((dot) => dot.destroy());
    }
    this.entryDots = [];

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const radius = this.mainCircleSize / 2;

    this.entryData.forEach((entry) => {
      // Parse timestamp using luxon
      // Example: "2025-05-17--1621"
      const dt = DateTime.fromFormat(entry.timestamp, "yyyy-MM-dd--HHmm");
      if (!dt.isValid) return;

      // Convert 24-hour format to 12-hour format
      const hour12 = dt.hour % 12 || 12; // Convert 0 to 12 for midnight

      // Calculate angle: 0 at top (12:00), clockwise
      // For 12-hour clock: each hour = 30 degrees, each minute = 0.5 degrees
      const hourAngle = hour12 * 30 + dt.minute * 0.5;
      const angle = Phaser.Math.DegToRad(hourAngle - 90); // -90 to start at top

      const dotX = centerX + radius * Math.cos(angle);
      const dotY = centerY + radius * Math.sin(angle);
      // Use default size from EntryDot constants
      const dot = new EntryDot(this, dotX, dotY, entry);
      this.entryDots.push(dot);
      
      // If this entry was active before, reactivate it
      if (currentEntry && entry.filename === currentEntry.filename) {
        EntryDot.setActiveDot(dot);
      }
    });
  }

  handleResize() {
    this.createCircle();
    this.drawEntries();
    this.createSecondHand();
    
    // Also refresh the viewer if one exists
    if (this.currentViewer && this.currentViewer.entry) {
      const entry = this.currentViewer.entry;
      this.showEntry(entry);
    }
  }

  showEntry(entry) {
    // If there's an existing viewer, remove it first
    if (this.currentViewer) {
      this.currentViewer.destroy();
    }
    
    // Create new viewer with the selected entry
    this.currentViewer = new Viewer(
      this, 
      window.innerWidth / 2, 
      window.innerHeight / 2, 
      entry
    );
    
    // Find and activate the corresponding dot
    const matchingDot = this.entryDots.find(dot => dot.entry.filename === entry.filename);
    if (matchingDot) {
      EntryDot.setActiveDot(matchingDot);
    }
    
    // Note: We don't reset the cooldown timer here,
    // since that's handled separately in onSecondHandTick 
    // and through the user click events
  }

  shutdown() {
    window.removeEventListener("resize", this.handleResize);
    this.events.off('entry-selected', this.showEntry, this);
    this.events.off('second-hand-tick', this.onSecondHandTick, this);
    this.events.off('second-hand-dot-check', this.checkSecondHandDotCollision, this);
  }

  destroy() {
    window.removeEventListener("resize", this.handleResize);
    this.events.off('entry-selected', this.showEntry, this);
    this.events.off('second-hand-tick', this.onSecondHandTick, this);
    this.events.off('second-hand-dot-check', this.checkSecondHandDotCollision, this);
  }

  // Find the entry with timestamp closest to current local time
  findClosestEntry() {
    if (!this.entryData || !this.entryData.length) return null;
    
    const now = DateTime.now();
    let closestEntry = this.entryData[0];
    let minDiff = Infinity;
    
    this.entryData.forEach(entry => {
      const dt = EntryDot.parseTimestamp(entry.timestamp);
      if (!dt) return;
      
      // Compare only time of day (hours and minutes), ignoring date
      const entryMinutes = dt.hour * 60 + dt.minute;
      const nowMinutes = now.hour * 60 + now.minute;
      
      // Calculate difference accounting for wraparound at midnight
      let diff = Math.abs(entryMinutes - nowMinutes);
      if (diff > 12 * 60) diff = 24 * 60 - diff; // If difference is more than 12 hours, calculate the other way around
      
      if (diff < minDiff) {
        minDiff = diff;
        closestEntry = entry;
      }
    });
    
    return closestEntry;
  }
  
  // Show the entry closest to current time
  showClosestEntry() {
    const closestEntry = this.findClosestEntry();
    if (closestEntry) {
      this.showEntry(closestEntry);
    }
  }

  update(time, delta) {
    // Update the second hand
    if (this.secondHand) {
      this.secondHand.update(time, delta);
      // Note: Collision detection is now handled in the onSecondHandTick event
    }
  }
}
