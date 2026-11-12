import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { LedgesScene } from './scenes/LedgesScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 800,
  height: 600,
  backgroundColor: '#000000',
  pixelArt: true,
  scene: [LedgesScene, BootScene],
};

// Phaser draws text onto the canvas, so the retro font must be loaded first.
document.fonts.load('16px "Press Start 2P"').finally(() => new Phaser.Game(config));
