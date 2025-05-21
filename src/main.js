// src/main.js
import Phaser from 'phaser';
import isMobile from './helpers/isMobile';
import { LoadScene } from './scenes/Load';
import { Overlay } from './scenes/Overlay';
import { PlayScene } from './scenes/Play';

const gameParent = "game";

// Remove "loading" string
document.getElementById('loading').style.display = 'none';


const gameConfig = {
  parent: gameParent,
  type: Phaser.AUTO,
  backgroundColor: "#cfcfcf",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  scene: [LoadScene, PlayScene, Overlay],
};

new Phaser.Game(gameConfig);