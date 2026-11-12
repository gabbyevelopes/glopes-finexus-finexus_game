import './levelComplete.css';
import { AudioManager } from '../audio/AudioManager';

/** End-of-level screen with a button that moves on to the next level. */
export class LevelComplete {
  private overlay: HTMLDivElement;

  constructor(parent: HTMLElement, levelName: string, nextLevelTitle: string, onContinue: () => void) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'level-complete-overlay';

    const panel = document.createElement('div');
    panel.className = 'level-complete';

    const title = document.createElement('div');
    title.className = 'level-complete-title';
    title.textContent = `${levelName} Complete`;

    const unlocked = document.createElement('div');
    unlocked.className = 'level-complete-unlocked';
    unlocked.textContent = 'Unlocked';

    const next = document.createElement('div');
    next.className = 'level-complete-next';
    next.textContent = nextLevelTitle;

    const continueBtn = document.createElement('button');
    continueBtn.className = 'level-complete-btn';
    continueBtn.textContent = 'Continue';
    continueBtn.addEventListener('click', () => {
      AudioManager.playClick();
      this.destroy();
      onContinue();
    });

    panel.append(title, unlocked, next, continueBtn);
    this.overlay.appendChild(panel);
    parent.appendChild(this.overlay);
  }

  destroy(): void {
    this.overlay.remove();
  }
}
