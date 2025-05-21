import { Scene } from "phaser";
import { DateTime } from "luxon";
import MainCircle from "./../prefabs/MainCircle";
import EntryDot from "./../prefabs/EntryDot";
import Viewer from "./../prefabs/Viewer";

export class PlayScene extends Scene {
  constructor() {
    super("PlayScene");
    this.windowSize =
      window.innerHeight < window.innerWidth
        ? window.innerHeight
        : window.innerWidth;
    this.handleResize = this.handleResize.bind(this);
    this.entryDots = [];
  }

  create() {
    this.entryData = this.cache.json.get("entryData")[0].entries;
    console.log(this.entryData);
    console.log("Create");
    this.createCircle();
    this.drawEntries();
    window.addEventListener("resize", this.handleResize);
    
    // Listen for entry selection events
    this.events.on('entry-selected', this.showEntry, this);
    
    // Find and show the closest entry to current local time
    this.showClosestEntry();
  }

  createCircle() {
    if (this.circle) {
      this.circle.destroy();
    }
    this.windowSize =
      window.innerHeight < window.innerWidth
        ? window.innerHeight
        : window.innerWidth;
    this.circle = new MainCircle(
      this,
      window.innerWidth / 2,
      window.innerHeight / 2,
      this.windowSize / 1.5
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
    const radius = this.windowSize / 1.5 / 2;

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
      const dot = new EntryDot(this, dotX, dotY, entry, 20);
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
  }

  shutdown() {
    window.removeEventListener("resize", this.handleResize);
    this.events.off('entry-selected', this.showEntry, this);
  }

  destroy() {
    window.removeEventListener("resize", this.handleResize);
    this.events.off('entry-selected', this.showEntry, this);
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

  update() {}
}
