import Phaser from 'phaser';
import { DialogueBox } from '../ui/DialogueBox';
import { InfoCard } from '../ui/InfoCard';
import { LevelComplete } from '../ui/LevelComplete';
import { Phone } from '../ui/phone/Phone';
import { gameState } from '../state/gameState';
import {
  billboardHintLines,
  billboardLines,
  coinLines,
  dialogueLines,
  finLabInsideLines,
  finLabPromptLines,
  inboxInsideLines,
  inboxPromptLines,
  phoneHintLines,
  endingLines,
  exitPhonePromptLines,
  NEXT_LEVEL_TITLE,
  VAULTON_CARD_BODY,
  VAULTON_TAGLINE,
  type DialogueLine,
} from '../data/dialogueLines';
import { AudioManager } from '../audio/AudioManager';
import { hairColors, skinTones } from '../data/finLabItems';
import { FinnRecolor } from '../game/FinnRecolor';

/**
 * Steps of the phone tutorial after the first coin. During it, only the app for the
 * current step can be opened and the phone can't be closed.
 */
type PhoneTutorialStep = 'wallet' | 'finlab' | 'inbox' | 'email' | 'exit' | 'done';

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
/** Vaulton logo, used on the billboard and the info card. Text "VAULTON" is shown until this file exists. */
const VAULTON_LOGO_PATH = 'assets/vaulton_logo.png';
/** Where the Vaulton billboard stands, in world pixels from the left edge. */
const BILLBOARD_X = 2000;
/** How close (in pixels) Finn must be to the billboard for a click to trigger it. */
const BILLBOARD_TRIGGER_DISTANCE = 200;
/** Where the Neobyte coin floats, in world pixels from the left edge. */
const COIN_X = 2250;
/** How many Neobytes the coin is worth. */
const COIN_VALUE = 100;
/** How close (in pixels) Finn must get to the coin to pick it up. */
const COIN_PICKUP_DISTANCE = 40;
/** The guide arrows hide once Finn is this close (in pixels) to the current goal. */
const GUIDE_ARROW_HIDE_DISTANCE = 60;

export class LedgesScene extends Phaser.Scene {
  private dialogueBox?: DialogueBox;
  private dialogueOpen = false;
  private finn!: Phaser.GameObjects.Sprite;
  private targetX: number | null = null;
  /** True while a click or touch that started a walk is still held down. */
  private pointerHeld = false;
  /** True once the billboard dialogue has played all the way through. The Neobyte coin checks this. */
  billboardDone = false;
  private coin?: Phaser.GameObjects.Arc;
  private phone?: Phone;
  /** True while the narrator is waiting for the player to open the phone. */
  private awaitingPhoneClick = false;
  private phoneTutorial: PhoneTutorialStep | null = null;
  /** Recolors Finn's hair and skin for FinLab. */
  private finnRecolor!: FinnRecolor;
  /** Flashing arrows on the screen edge pointing toward the next goal. */
  private guideArrows!: Phaser.GameObjects.Container;
  private billboard!: Phaser.GameObjects.Rectangle;
  private billboardHintShown = false;
  /** True once the billboard has been clicked, so the card and Finn's line never repeat. */
  private billboardClicked = false;
  /** True while the narrator hint is up, waiting for the player to click the billboard. */
  private awaitingBillboardClick = false;
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
    this.load.image('vaulton_logo', VAULTON_LOGO_PATH);
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
    this.addBillboard(groundY);
    this.addCoin(groundY);

    // Clicking or tapping anywhere walks Finn to that x position.
    // Holding it down keeps him walking toward the pointer as the camera scrolls.
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.movementLocked) return;
      this.pointerHeld = true;
      this.targetX = this.clampX(pointer.worldX);
    });
    const release = () => {
      this.pointerHeld = false;
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);

    // Finn uses recolorable copies of his frames ("finn_idle_live", "finn_step_live") for FinLab.
    this.finnRecolor = new FinnRecolor(this, ['finn_idle', 'finn_step']);
    this.applyAppearance();

    this.anims.create({
      key: 'finn-walk',
      frames: [{ key: 'finn_idle_live' }, { key: 'finn_step_live' }],
      frameRate: WALK_ANIM_FPS,
      repeat: -1,
    });

    // Both frames share the same size, so one scale and a feet anchor keep him steady.
    this.finn = this.add.sprite(this.scale.width / 2, groundY, 'finn_idle_live').setOrigin(0.5, 1);
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

    this.addPhone();
    this.addGuideArrows();
    this.openDialogue(dialogueLines);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.dialogueBox?.destroy();
    });
  }

  update(_time: number, delta: number): void {
    this.updateGuideArrows();
    if (this.movementLocked) return;

    if (!this.billboardHintShown && !this.billboardDone && this.isFullyOnScreen(this.billboard)) {
      this.billboardHintShown = true;
      this.awaitingBillboardClick = true;
      this.openDialogue(billboardHintLines);
      return;
    }

    if (this.coin && this.billboardDone && Math.abs(this.finn.x - COIN_X) <= COIN_PICKUP_DISTANCE) {
      this.collectCoin();
      return;
    }

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

  /** True while anything is on screen that should stop Finn from moving. */
  private get movementLocked(): boolean {
    return this.dialogueOpen || (this.phone?.isOpen ?? false);
  }

  private openDialogue(lines: DialogueLine[], onDone?: () => void): void {
    const parent = this.sys.game.canvas.parentElement;
    if (!parent) return;

    this.closeDialogue();
    this.lockMovement();
    this.dialogueBox = new DialogueBox(parent, lines, () => {
      this.dialogueOpen = false;
      this.dialogueBox = undefined;
      onDone?.();
    });
  }

  /** Remove the dialogue box right away (used for prompts that wait for a click elsewhere). */
  private closeDialogue(): void {
    this.dialogueBox?.destroy();
    this.dialogueBox = undefined;
    this.dialogueOpen = false;
  }

  /** Stop Finn where he is. */
  private stopMovement(): void {
    this.targetX = null;
    this.pointerHeld = false;
    this.stopWalking();
  }

  /** Stop Finn and block player movement (while dialogue or a card is up). */
  private lockMovement(): void {
    this.stopMovement();
    this.dialogueOpen = true;
  }

  /**
   * PLACEHOLDER Vaulton billboard. Clicking it when Finn is close shows the Vaulton
   * info card, then Finn's line. Only works once.
   */
  private addBillboard(groundY: number): void {
    const boardY = groundY - 300;

    // Two posts holding the board up.
    this.add.rectangle(BILLBOARD_X - 90, groundY, 12, 300, 0x2a2a50).setOrigin(0.5, 1);
    this.add.rectangle(BILLBOARD_X + 90, groundY, 12, 300, 0x2a2a50).setOrigin(0.5, 1);

    const board = (this.billboard = this.add
      .rectangle(BILLBOARD_X, boardY, 300, 130, 0x1b1b3a)
      .setStrokeStyle(4, 0x0bdbda)
      .setInteractive({ useHandCursor: true }));

    // Logo if it's been added, otherwise the name as text.
    if (this.textures.exists('vaulton_logo')) {
      const logo = this.add.image(BILLBOARD_X, boardY - 15, 'vaulton_logo');
      logo.setScale(Math.min(260 / logo.width, 70 / logo.height));
    } else {
      this.add
        .text(BILLBOARD_X, boardY - 15, 'VAULTON', {
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '28px',
          color: '#0bdbda',
        })
        .setOrigin(0.5);
    }
    this.add
      .text(BILLBOARD_X, boardY + 38, VAULTON_TAGLINE, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '10px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    board.on(
      'pointerdown',
      (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
        if (this.billboardClicked) return;
        if (this.awaitingBillboardClick) {
          // The narrator hint is up: close it. Any distance is fine, since the player can't move.
          this.awaitingBillboardClick = false;
          this.closeDialogue();
        } else {
          if (this.dialogueOpen) return;
          if (Math.abs(this.finn.x - BILLBOARD_X) > BILLBOARD_TRIGGER_DISTANCE) return; // Too far: click just walks.
        }

        // Don't also treat this click as "walk here".
        event.stopPropagation();
        this.billboardClicked = true;
        board.disableInteractive();
        this.finn.setFlipX(this.finn.x < BILLBOARD_X); // Face the billboard.
        this.showVaultonCard();
      }
    );
  }

  /**
   * PLACEHOLDER Neobyte coin: a floating yellow circle. It looks faded and can't be
   * picked up until the billboard dialogue has played.
   */
  private addCoin(groundY: number): void {
    const coinY = groundY - 70;
    this.coin = this.add.circle(COIN_X, coinY, 16, 0xffd23f).setStrokeStyle(3, 0xb8860b).setAlpha(0.35);
    this.tweens.add({
      targets: this.coin,
      y: coinY - 12,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Finn's phone in the top-right corner. Hidden until the story introduces it (the first coin). */
  private addPhone(): void {
    const parent = this.sys.game.canvas.parentElement;
    if (!parent) return;

    this.phone = new Phone(parent, {
      // Opens when the narrator asks for it, or any time the player is free to move.
      canOpen: () => this.awaitingPhoneClick || !this.dialogueOpen,
      onOpen: () => {
        if (this.awaitingPhoneClick) {
          this.awaitingPhoneClick = false;
          this.closeDialogue();
        }
        this.stopMovement();
      },
      onAppOpen: (appId) => this.onPhoneAppOpen(appId),
      onAppBack: (appId) => this.onPhoneAppBack(appId),
      onAppEvent: (appId, event) => this.onPhoneAppEvent(appId, event),
      onClose: () => this.onPhoneClosed(),
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.phone?.destroy());
  }

  /** Phone tutorial: the player opened an app. */
  private onPhoneAppOpen(appId: string): void {
    if (this.phoneTutorial === 'finlab' && appId === 'finlab') {
      this.openDialogue(finLabInsideLines);
    } else if (this.phoneTutorial === 'inbox' && appId === 'inbox') {
      this.phoneTutorial = 'email';
      this.openDialogue(inboxInsideLines);
    }
  }

  /** Phone tutorial: the player pressed Back to leave an app. */
  private onPhoneAppBack(appId: string): void {
    const phone = this.phone;
    if (!phone) return;

    if (this.phoneTutorial === 'wallet' && appId === 'wallet') {
      // FinLab is introduced now, right when the story needs it.
      this.phoneTutorial = 'finlab';
      phone.unlockApp('finlab');
      phone.setAllowedApp('finlab');
      this.openDialogue(finLabPromptLines);
    } else if (this.phoneTutorial === 'finlab' && appId === 'finlab') {
      this.phoneTutorial = 'inbox';
      phone.unlockApp('inbox');
      phone.setAllowedApp('inbox');
      this.openDialogue(inboxPromptLines);
    } else if (this.phoneTutorial === 'email' && appId === 'inbox') {
      // Left the Inbox without opening the email: ask again.
      this.phoneTutorial = 'inbox';
      this.openDialogue(inboxPromptLines);
    }
  }

  /** Something happened inside a phone app. */
  private onPhoneAppEvent(appId: string, event: string): void {
    if (appId === 'finlab' && event === 'appearance-changed') {
      this.applyAppearance();
    } else if (appId === 'inbox' && event === 'email-opened' && this.phoneTutorial === 'email') {
      // Tutorial finished: the phone can be closed again, which leads into the ending.
      this.phoneTutorial = 'exit';
      this.phone?.setAllowedApp(null);
      this.phone?.setClosable(true);
      this.openDialogue(exitPhonePromptLines);
    }
  }

  /** The phone was closed. After the acceptance email, this ends Level 0. */
  private onPhoneClosed(): void {
    if (this.phoneTutorial !== 'exit') return;
    this.phoneTutorial = 'done';
    this.openDialogue(endingLines, () => this.showLevelComplete());
  }

  private showLevelComplete(): void {
    const parent = this.sys.game.canvas.parentElement;
    if (!parent) return;
    this.lockMovement(); // Level over: Finn stays put.
    new LevelComplete(parent, 'Level 0', NEXT_LEVEL_TITLE, () => {
      // TODO: start Level 1 here once it's built, e.g. this.scene.start('Level1Scene').
      // Until then, Continue restarts the game from the beginning.
      window.location.reload();
    });
  }

  /** Recolor Finn to match the hair and skin chosen in FinLab. */
  private applyAppearance(): void {
    const hair = hairColors.find((c) => c.id === gameState.appearance.hair)?.color ?? null;
    const skin = skinTones.find((c) => c.id === gameState.appearance.skin)?.color ?? null;
    this.finnRecolor.apply(hair, skin);
  }

  /** Three chevrons that flash in sequence, fixed to the screen. */
  private addGuideArrows(): void {
    const chevrons = [0, 1, 2].map((i) =>
      this.add.triangle(i * 22, 0, 0, -16, 16, 0, 0, 16, 0x0bdbda).setAlpha(0.25)
    );
    chevrons.forEach((chevron, i) => {
      this.tweens.add({
        targets: chevron,
        alpha: 1,
        duration: 300,
        delay: i * 150,
        yoyo: true,
        repeat: -1,
        repeatDelay: 300,
      });
    });
    this.guideArrows = this.add
      .container(0, this.scale.height * 0.45, chevrons)
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);
  }

  /** The next place the player should walk to, or null if there isn't one right now. */
  private currentGoalX(): number | null {
    if (!this.billboardClicked && !this.billboardHintShown) return BILLBOARD_X;
    if (this.billboardDone && this.coin) return COIN_X;
    return null;
  }

  private updateGuideArrows(): void {
    const goalX = this.currentGoalX();
    const show =
      goalX !== null && !this.movementLocked && Math.abs(goalX - this.finn.x) > GUIDE_ARROW_HIDE_DISTANCE;
    this.guideArrows.setVisible(show);
    if (!show) return;

    // Right edge pointing right, or left edge pointing left if Finn has gone past the goal.
    const pointRight = goalX > this.finn.x;
    this.guideArrows.setScale(pointRight ? 1 : -1, 1);
    this.guideArrows.x = pointRight ? this.scale.width - 80 : 80;
  }

  private collectCoin(): void {
    this.coin?.destroy();
    this.coin = undefined;
    gameState.neobytes += COIN_VALUE;
    AudioManager.playCoinCollect();

    // The coin is where the story introduces the phone and its Wallet app.
    // The phone tutorial starts: Wallet first, and the phone stays open until it's done.
    this.phoneTutorial = 'wallet';
    this.phone?.show();
    this.phone?.unlockApp('wallet');
    this.phone?.setAllowedApp('wallet');
    this.phone?.setClosable(false);

    this.openDialogue(coinLines, () => {
      this.awaitingPhoneClick = true;
      this.openDialogue(phoneHintLines);
    });
  }

  /** Vaulton info card, followed by Finn's line once it's closed. */
  private showVaultonCard(): void {
    const parent = this.sys.game.canvas.parentElement;
    if (!parent) return;

    this.lockMovement();
    new InfoCard(
      parent,
      {
        title: 'VAULTON',
        logoSrc: this.textures.exists('vaulton_logo') ? VAULTON_LOGO_PATH : undefined,
        tagline: VAULTON_TAGLINE,
        body: VAULTON_CARD_BODY,
      },
      () => {
        this.openDialogue(billboardLines, () => {
          this.billboardDone = true;
          this.coin?.setAlpha(1); // The coin can be collected now.
        });
      }
    );
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

  private isFullyOnScreen(obj: Phaser.GameObjects.Rectangle): boolean {
    const view = this.cameras.main.worldView;
    const bounds = obj.getBounds();
    return bounds.left >= view.left && bounds.right <= view.right;
  }

  private stopWalking(): void {
    this.finn.anims.stop();
    this.finn.setTexture('finn_idle_live');
  }

  private clampX(x: number): number {
    const half = this.finn.displayWidth / 2;
    return Phaser.Math.Clamp(x, half, this.scale.width * WORLD_WIDTH_SCREENS - half);
  }
}
