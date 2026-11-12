import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#000000');

    this.add
      .text(this.scale.width / 2, this.scale.height / 2, 'Cashtropolis', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }
}
