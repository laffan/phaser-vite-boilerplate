// src/main.js
import Phaser from 'phaser';
import isMobile from './helpers/isMobile';
import { LoadScene } from './scenes/Load';
import { Overlay } from './scenes/Overlay';
import { PlayScene } from './scenes/Play';

const gameParent = "game";

// Remove "loading" string
document.getElementById('loading').style.display = 'none';
// Check to see fif on a mobile browser
const onMobile = isMobile();
// Add border radius if you are not
document.getElementById(gameParent).style.borderRadius = onMobile ? "0" : "20px";


const gameConfig = {
  parent: gameParent,
  type: Phaser.AUTO,
  backgroundColor: "#cfcfcf",
  width: onMobile ? window.innerWidth : 600,
  height: onMobile ? window.innerHeight : 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: {
        x: 0,
        y: 0,
      },
    },
  },
  scene: [LoadScene, PlayScene, Overlay],
};

new Phaser.Game(gameConfig);