import './dialogueBox.css';
import { TYPING_SPEED_MS, type DialogueLine } from '../data/dialogueLines';
import { AudioManager } from '../audio/AudioManager';

export class DialogueBox {
  private container: HTMLDivElement;
  private portraitEl: HTMLDivElement;
  private nameEl: HTMLDivElement;
  private textEl: HTMLDivElement;
  private nextBtn: HTMLButtonElement;
  private lines: DialogueLine[];
  private index = 0;
  private onComplete?: () => void;
  private typingTimer?: number;
  private charIndex = 0;

  constructor(parent: HTMLElement, lines: DialogueLine[], onComplete?: () => void) {
    this.lines = lines;
    this.onComplete = onComplete;

    this.container = document.createElement('div');
    this.container.className = 'dialogue-box';

    this.portraitEl = document.createElement('div');
    this.portraitEl.className = 'dialogue-portrait';

    const textWrap = document.createElement('div');
    textWrap.className = 'dialogue-text-wrap';

    this.nameEl = document.createElement('div');
    this.nameEl.className = 'dialogue-name';

    this.textEl = document.createElement('div');
    this.textEl.className = 'dialogue-text';

    textWrap.appendChild(this.nameEl);
    textWrap.appendChild(this.textEl);

    this.nextBtn = document.createElement('button');
    this.nextBtn.className = 'dialogue-next-btn';
    this.nextBtn.textContent = 'Next';
    this.nextBtn.addEventListener('click', () => this.onNext());

    this.container.appendChild(this.portraitEl);
    this.container.appendChild(textWrap);
    this.container.appendChild(this.nextBtn);

    parent.appendChild(this.container);

    this.render();
  }

  private render(): void {
    const line = this.lines[this.index];
    this.nameEl.textContent = line.character;
    this.textEl.textContent = '';

    if (line.portraitColor) {
      this.portraitEl.style.display = '';
      this.portraitEl.style.backgroundColor = line.portraitColor;
    } else {
      this.portraitEl.style.display = 'none';
    }

    // Keep Next disabled until the first character appears, so a fast
    // double-click can't skip a line before it has started typing.
    this.nextBtn.disabled = true;
    this.charIndex = 0;
    this.stopTyping();
    this.typingTimer = window.setInterval(() => this.typeNextChar(), TYPING_SPEED_MS);
  }

  private typeNextChar(): void {
    const text = this.lines[this.index].text;
    this.charIndex++;
    this.textEl.textContent = text.slice(0, this.charIndex);
    AudioManager.playTypeBlip();
    this.nextBtn.disabled = false;
    if (this.charIndex >= text.length) {
      this.stopTyping();
    }
  }

  private get isTyping(): boolean {
    return this.typingTimer !== undefined;
  }

  private stopTyping(): void {
    if (this.typingTimer !== undefined) {
      window.clearInterval(this.typingTimer);
      this.typingTimer = undefined;
    }
  }

  private onNext(): void {
    AudioManager.playClick();
    if (this.isTyping) {
      this.stopTyping();
      this.textEl.textContent = this.lines[this.index].text;
      return;
    }
    this.advance();
  }

  private advance(): void {
    this.index++;
    if (this.index >= this.lines.length) {
      this.destroy();
      this.onComplete?.();
      return;
    }
    this.render();
  }

  destroy(): void {
    this.stopTyping();
    this.container.remove();
  }
}
