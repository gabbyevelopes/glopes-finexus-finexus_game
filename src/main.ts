import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { LedgesScene } from './scenes/LedgesScene';

/** The game is always this tall; everything (Finn, dialogue, phone) is sized for it. */
const GAME_HEIGHT = 600;
/** Narrowest view (classic 4:3) and widest view (a bit wider than 16:9 phones held sideways). */
const MIN_GAME_WIDTH = 800;
const MAX_GAME_WIDTH = 1200;

/**
 * Wider screens see more of the street instead of black bars at the sides. The width is
 * picked once when the game starts, to match the window's shape.
 */
const GAME_WIDTH = Phaser.Math.Clamp(
  Math.round((GAME_HEIGHT * window.innerWidth) / window.innerHeight),
  MIN_GAME_WIDTH,
  MAX_GAME_WIDTH
);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#000000',
  pixelArt: true,
  scene: [LedgesScene, BootScene],
};

// Shrink or grow the whole game (canvas and dialogue box together) to fit the window.
function fitToWindow(game: Phaser.Game): void {
  const app = document.getElementById('app')!;
  const scale = Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT);
  app.style.transform = `scale(${scale})`;
  // Tell Phaser the canvas moved, so clicks still land in the right place.
  game.scale.refresh();
}

// The HTML overlays (dialogue box, phone) live in #app, so it matches the game's size.
const app = document.getElementById('app')!;
app.style.width = `${GAME_WIDTH}px`;
app.style.height = `${GAME_HEIGHT}px`;

// Phaser draws text onto the canvas, so the fonts must be loaded first:
// Press Start 2P for game text, VT323 for the Vaulton tagline.
Promise.allSettled([document.fonts.load('16px "Press Start 2P"'), document.fonts.load('16px "VT323"')]).finally(() => {
  const game = new Phaser.Game(config);
  game.events.once(Phaser.Core.Events.READY, () => fitToWindow(game));
  window.addEventListener('resize', () => fitToWindow(game));
});
