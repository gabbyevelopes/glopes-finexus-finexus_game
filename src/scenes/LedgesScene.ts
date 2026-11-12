import Phaser from 'phaser';
import { DialogueBox } from '../ui/DialogueBox';
import { dialogueLines, type DialogueLine } from '../data/dialogueLines';
import { AudioManager } from '../audio/AudioManager';

/** Finn's walking speed, in pixels per second. */
const WALK_SPEED = 180;
/** Walk animation speed, in frames per second. */
const WALK_ANIM_FPS = 8;
/** Middle part of the screen (fraction of its width) Finn can walk in before the camera scrolls. */
const CAMERA_DEADZONE_FRACTION = 0.6;
/** Finn's height as a fraction of the screen height. */
const FINN_HEIGHT_FRACTION = 0.25;
/** How many screens wide the world is. */
const WORLD_WIDTH_SCREENS = 3;
/** Ground line, as a fraction of the screen height from the top. */
const GROUND_Y_FRACTION = 0.8;

export class LedgesScene extends Phaser.Scene {
  private dialogueBox?: DialogueBox;
  private dialogueOpen = false;
  private finn!: Phaser.GameObjects.Sprite;
  private targetX: number | null = null;
  /** True while a click or touch that started a walk is still held down. */
  private pointerHeld = false;
  private keys!: {
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super('LedgesScene');
  }

  preload(): void {
    this.load.image('finn_idle', 'assets/finn_idle.png');
    this.load.image('finn_step', 'assets/finn_step.png');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#5A5A9C');
    AudioManager.playMusic('ledges');

    const worldWidth = this.scale.width * WORLD_WIDTH_SCREENS;
    const groundY = this.scale.height * GROUND_Y_FRACTION;

    this.add
      .rectangle(0, groundY, worldWidth, this.scale.height - groundY, 0x3e3e70)
      .setOrigin(0, 0);
    this.addPlaceholderScenery(worldWidth, groundY);

    // Clicking or tapping anywhere walks Finn to that x position.
    // Holding it down keeps him walking toward the pointer as the camera scrolls.
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.dialogueOpen) return;
      this.pointerHeld = true;
      this.targetX = this.clampX(pointer.worldX);
    });
    const release = () => {
      this.pointerHeld = false;
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    this.anims.create({
      key: 'finn-walk',
      frames: [{ key: 'finn_idle' }, { key: 'finn_step' }],
      frameRate: WALK_ANIM_FPS,
      repeat: -1,
    });

    // Both frames share the same size, so one scale and a feet anchor keep him steady.
    this.finn = this.add.sprite(this.scale.width / 2, groundY, 'finn_idle').setOrigin(0.5, 1);
    this.finn.setScale((this.scale.height * FINN_HEIGHT_FRACTION) / this.finn.height);

    this.cameras.main.setBounds(0, 0, worldWidth, this.scale.height);
    // No lag: once Finn reaches the dead zone edge, the camera moves exactly with him.
    this.cameras.main.startFollow(this.finn, true, 1, 1);
    this.cameras.main.setDeadzone(this.scale.width * CAMERA_DEADZONE_FRACTION, this.scale.height);

    const keyboard = this.input.keyboard!;
    this.keys = {
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.openDialogue(dialogueLines);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.dialogueBox?.destroy();
    });
  }

  update(_time: number, delta: number): void {
    if (this.dialogueOpen) return;

    const keyDir =
      (this.keys.right.isDown || this.keys.d.isDown ? 1 : 0) -
      (this.keys.left.isDown || this.keys.a.isDown ? 1 : 0);

    let dir = 0;
    if (keyDir !== 0) {
      // Keyboard input cancels any click-to-move in progress.
      this.targetX = null;
      this.pointerHeld = false;
      dir = keyDir;
    } else {
      if (this.pointerHeld) {
        // Re-read the pointer each frame, since the camera may have scrolled under it.
        const pointer = this.input.activePointer;
        pointer.updateWorldPoint(this.cameras.main);
        this.targetX = this.clampX(pointer.worldX);
      }
      if (this.targetX !== null) dir = Math.sign(this.targetX - this.finn.x);
    }

    if (dir === 0) {
      this.stopWalking();
      return;
    }

    let nextX = this.finn.x + dir * WALK_SPEED * (delta / 1000);
    if (this.targetX !== null && (nextX - this.targetX) * dir >= 0) {
      nextX = this.targetX;
      this.targetX = null;
    }
    nextX = this.clampX(nextX);

    if (nextX === this.finn.x) {
      // Blocked at the edge of the world.
      this.stopWalking();
      return;
    }

    this.finn.x = nextX;
    // The art faces left, so flip when walking right.
    this.finn.setFlipX(dir > 0);
    if (!this.finn.anims.isPlaying) this.finn.play('finn-walk');
    if (this.targetX === null && keyDir === 0) this.stopWalking();
  }

  private openDialogue(lines: DialogueLine[]): void {
    const parent = this.sys.game.canvas.parentElement;
    if (!parent) return;

    this.targetX = null;
    this.pointerHeld = false;
    this.stopWalking();
    this.dialogueOpen = true;
    this.dialogueBox = new DialogueBox(parent, lines, () => {
      this.dialogueOpen = false;
      this.dialogueBox = undefined;
    });
  }

  /**
   * TEMPORARY: simple shapes so you can see the world scroll as Finn walks.
   * Delete this function (and its call in create) once the real Ledges background is in.
   */
  private addPlaceholderScenery(worldWidth: number, groundY: number): void {
    // Ground markings every 100px.
    for (let x = 0; x < worldWidth; x += 100) {
      this.add.rectangle(x, groundY + 30, 50, 6, 0x5a5a9c).setOrigin(0, 0.5);
    }
    // A street lamp every 400px.
    for (let x = 200; x < worldWidth; x += 400) {
      this.add.rectangle(x, groundY, 8, 220, 0x2a2a50).setOrigin(0.5, 1);
      this.add.rectangle(x, groundY - 220, 40, 10, 0x2a2a50);
      this.add.circle(x - 14, groundY - 210, 7, 0xffe08a);
    }
  }

  private stopWalking(): void {
    this.finn.anims.stop();
    this.finn.setTexture('finn_idle');
  }

  private clampX(x: number): number {
    const half = this.finn.displayWidth / 2;
    return Phaser.Math.Clamp(x, half, this.scale.width * WORLD_WIDTH_SCREENS - half);
  }
}
