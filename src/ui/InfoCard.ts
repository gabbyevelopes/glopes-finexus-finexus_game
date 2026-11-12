import './infoCard.css';
import { AudioManager } from '../audio/AudioManager';

export interface InfoCardContent {
  /** Shown as the heading if the logo image is missing or hasn't been added yet. */
  title: string;
  /** Optional logo image path. Falls back to the text title if it can't load. */
  logoSrc?: string;
  tagline?: string;
  body: string;
}

/** A pop-up panel that explains something in the world (not someone talking). */
export class InfoCard {
  private overlay: HTMLDivElement;

  constructor(parent: HTMLElement, content: InfoCardContent, onClose?: () => void) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'info-card-overlay';

    const card = document.createElement('div');
    card.className = 'info-card';

    const title = document.createElement('div');
    title.className = 'info-card-title';
    title.textContent = content.title;

    if (content.logoSrc) {
      const logo = document.createElement('img');
      logo.className = 'info-card-logo';
      logo.alt = content.title;
      logo.src = content.logoSrc;
      // Show the text title only if the logo can't be loaded.
      title.style.display = 'none';
      logo.addEventListener('error', () => {
        logo.remove();
        title.style.display = '';
      });
      card.appendChild(logo);
    }
    card.appendChild(title);

    if (content.tagline) {
      const tagline = document.createElement('div');
      tagline.className = 'info-card-tagline';
      tagline.textContent = content.tagline;
      card.appendChild(tagline);
    }

    const body = document.createElement('p');
    body.className = 'info-card-body';
    body.textContent = content.body;
    card.appendChild(body);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'info-card-close-btn';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => {
      AudioManager.playClick();
      this.destroy();
      onClose?.();
    });
    card.appendChild(closeBtn);

    this.overlay.appendChild(card);
    parent.appendChild(this.overlay);
  }

  destroy(): void {
    this.overlay.remove();
  }
}
