// src/main.js
import Phaser from 'phaser';
import { LoadScene } from './scenes/Load';
import { PlayScene } from './scenes/Play';

document.getElementById('loading').style.display = 'none';

const gameConfig  = {
  parent: "game",
  type: Phaser.AUTO,
  backgroundColor: "#cfcfcf",
  height: 600,
  width: 600,
  physics: {
    default: "arcade",
    arcade: {
      // debug: true,
      gravity: {
        x: 0,
        y: 0,
      },
    },
  },
  scene: [LoadScene, PlayScene],
};

new Phaser.Game(gameConfig);