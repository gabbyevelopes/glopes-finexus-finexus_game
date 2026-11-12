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

// Shrink or grow the whole game (canvas and dialogue box together) to fit the window.
function fitToWindow(game: Phaser.Game): void {
  const app = document.getElementById('app')!;
  const scale = Math.min(window.innerWidth / 800, window.innerHeight / 600);
  app.style.transform = `scale(${scale})`;
  // Tell Phaser the canvas moved, so clicks still land in the right place.
  game.scale.refresh();
}

// Phaser draws text onto the canvas, so the fonts must be loaded first:
// Press Start 2P for game text, VT323 for the Vaulton tagline.
Promise.allSettled([document.fonts.load('16px "Press Start 2P"'), document.fonts.load('16px "VT323"')]).finally(() => {
  const game = new Phaser.Game(config);
  game.events.once(Phaser.Core.Events.READY, () => fitToWindow(game));
  window.addEventListener('resize', () => fitToWindow(game));
});
