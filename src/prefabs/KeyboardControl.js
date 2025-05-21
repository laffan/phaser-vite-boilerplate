import Phaser from 'phaser';
import { DateTime } from 'luxon';

export default class KeyboardControl {
  constructor(scene, entryDots) {
    this.scene = scene;
    this.entryDots = entryDots;

    // Listen for keyboard events
    this.cursors = scene.input.keyboard.createCursorKeys();

    // Add update listener
    scene.events.on('update', this.update, this);
  }

  // Helper to get dots sorted by minute in timestamp (ignoring hour)
  getDotsSortedByMinute() {
    // Assumes timestamp format: "YYYY-MM-DD--HH:mm"
    return [...this.entryDots].sort((a, b) => {
      const aMinute = DateTime.fromFormat(a.entry.timestamp.split('--')[1], 'HH:mm').minute;
      const bMinute = DateTime.fromFormat(b.entry.timestamp.split('--')[1], 'HH:mm').minute;
      return aMinute - bMinute;
    });
  }

  // Helper to get dots sorted by hour (wrapped twice around 12hr clock), then by minute
  getDotsSortedByHourThenMinute() {
    // Use EntryDot.parseTimestamp for robust parsing
    return [...this.entryDots].sort((a, b) => {
      const aDT = (typeof a.constructor.parseTimestamp === 'function')
        ? a.constructor.parseTimestamp(a.entry.timestamp)
        : DateTime.fromFormat(a.entry.timestamp.split('--')[1], 'HH:mm');
      const bDT = (typeof b.constructor.parseTimestamp === 'function')
        ? b.constructor.parseTimestamp(b.entry.timestamp)
        : DateTime.fromFormat(b.entry.timestamp.split('--')[1], 'HH:mm');

      const aHour = aDT.hour;
      const bHour = bDT.hour;
      const aMinute = aDT.minute;
      const bMinute = bDT.minute;

      // Wrap hours: 0,12,1,13,2,14,...,11,23
      const wrapHour = h => (h % 12) + 12 * Math.floor(h / 12);
      const aWrapped = wrapHour(aHour);
      const bWrapped = wrapHour(bHour);

      if (aWrapped !== bWrapped) return aWrapped - bWrapped;
      return aMinute - bMinute;
    });
  }

  update() {
    if (!this.entryDots || !this.entryDots.length) return;

    // Sort all dots by wrapped hour, then minute
    const sortedDots = this.getDotsSortedByHourThenMinute();

    // Find the currently active dot
    const EntryDot = this.entryDots[0].constructor;
    const activeDot = EntryDot.activeDot;

    // Find the index of the active dot in the sorted list
    let idx = sortedDots.findIndex(dot => dot === activeDot);

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      idx = (idx > 0) ? idx - 1 : sortedDots.length - 1;
      this.selectDot(sortedDots, idx);
    }

    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      idx = (idx + 1) % sortedDots.length;
      this.selectDot(sortedDots, idx);
    }
  }

  selectDot(sortedDots, idx) {
    const dot = sortedDots[idx];
    if (dot) {
      this.scene.events.emit('entry-selected', dot.entry);
    }
  }

  destroy() {
    this.scene.events.off('update', this.update, this);
    super.destroy();
  }
}