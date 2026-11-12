import './phone.css';
import { AudioManager } from '../../audio/AudioManager';
import { phoneApps, type PhoneApp } from './apps';

export interface PhoneOptions {
  /** Return false to ignore clicks on the phone icon (e.g. while dialogue is up). */
  canOpen: () => boolean;
  onOpen?: () => void;
  onClose?: () => void;
  /** An app was opened from the home screen. */
  onAppOpen?: (appId: string) => void;
  /** The player pressed Back to leave an app. */
  onAppBack?: (appId: string) => void;
  /** Something happened inside an app, e.g. ('inbox', 'email-opened'). */
  onAppEvent?: (appId: string, event: string) => void;
}

/**
 * Finn's phone: an icon in the top-right corner that opens a phone screen with apps.
 * Hidden until `show()` is called. Apps appear only once `unlockApp` is called.
 */
export class Phone {
  private button: HTMLButtonElement;
  private badge: HTMLDivElement;
  private overlay?: HTMLDivElement;
  private screen?: HTMLDivElement;
  private closeBtn?: HTMLButtonElement;
  private unlocked: string[] = [];
  /** Apps unlocked but not opened yet; they get a NEW tag on the home screen. */
  private unseen = new Set<string>();
  /** During a tutorial, only this app can be opened. null = any app. */
  private allowedApp: string | null = null;
  private closable = true;
  private onHome = false;

  constructor(private parent: HTMLElement, private options: PhoneOptions) {
    this.button = document.createElement('button');
    this.button.className = 'phone-button';
    this.button.setAttribute('aria-label', 'Open phone');
    this.button.style.display = 'none';
    this.button.addEventListener('click', () => {
      if (this.options.canOpen()) this.open();
    });

    const screen = document.createElement('div');
    screen.className = 'phone-button-screen';
    this.button.appendChild(screen);

    this.badge = document.createElement('div');
    this.badge.className = 'phone-badge';
    this.badge.textContent = '!';
    this.badge.style.display = 'none';
    this.button.appendChild(this.badge);

    parent.appendChild(this.button);
  }

  /** Make the phone icon appear in the corner. */
  show(): void {
    this.button.style.display = '';
  }

  /** Add an app to the home screen and flag it with a notification. */
  unlockApp(id: string): void {
    if (this.unlocked.includes(id)) return;
    this.unlocked.push(id);
    this.unseen.add(id);
    if (this.isOpen) {
      if (this.onHome) this.showHome();
    } else {
      this.setNotification(true);
    }
  }

  /** During a tutorial, let only this app be opened (others are greyed out). null = any app. */
  setAllowedApp(id: string | null): void {
    this.allowedApp = id;
    if (this.onHome) this.showHome();
  }

  /** Whether the player may close the phone (turned off during the tutorial). */
  setClosable(closable: boolean): void {
    this.closable = closable;
    if (this.closeBtn) this.closeBtn.style.visibility = closable ? '' : 'hidden';
  }

  setNotification(on: boolean): void {
    this.badge.style.display = on ? '' : 'none';
  }

  get isOpen(): boolean {
    return this.overlay !== undefined;
  }

  open(): void {
    if (this.overlay) return;
    AudioManager.playClick();
    this.setNotification(false);

    this.overlay = document.createElement('div');
    this.overlay.className = 'phone-overlay';
    // Clicking the dimmed area around the phone closes it.
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay && this.closable) this.close();
    });

    const device = document.createElement('div');
    device.className = 'phone';

    const notch = document.createElement('div');
    notch.className = 'phone-notch';

    this.screen = document.createElement('div');
    this.screen.className = 'phone-screen';

    this.closeBtn = document.createElement('button');
    this.closeBtn.className = 'phone-close-btn';
    this.closeBtn.textContent = 'Close';
    this.closeBtn.addEventListener('click', () => this.close());

    device.append(notch, this.screen, this.closeBtn);
    this.overlay.appendChild(device);
    this.parent.appendChild(this.overlay);

    this.setClosable(this.closable);
    this.showHome();
    this.options.onOpen?.();
  }

  close(): void {
    if (!this.overlay || !this.closable) return;
    AudioManager.playClick();
    this.overlay.remove();
    this.overlay = undefined;
    this.screen = undefined;
    this.closeBtn = undefined;
    this.onHome = false;
    this.options.onClose?.();
  }

  private showHome(): void {
    if (!this.screen) return;
    this.onHome = true;
    this.screen.replaceChildren();

    const grid = document.createElement('div');
    grid.className = 'phone-home';

    const apps = phoneApps.filter((app) => this.unlocked.includes(app.id));
    if (apps.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'phone-empty';
      empty.textContent = 'No apps yet';
      grid.appendChild(empty);
    }

    for (const app of apps) {
      const tile = document.createElement('button');
      tile.className = 'phone-app-tile';
      tile.disabled = this.allowedApp !== null && this.allowedApp !== app.id;
      tile.addEventListener('click', () => {
        AudioManager.playClick();
        this.unseen.delete(app.id);
        this.showApp(app);
        this.options.onAppOpen?.(app.id);
      });

      const icon = document.createElement('div');
      icon.className = 'phone-app-icon';
      icon.style.backgroundColor = app.color;
      if (app.iconImage) {
        const img = document.createElement('img');
        img.className = 'phone-app-icon-img';
        img.src = app.iconImage;
        img.alt = '';
        icon.appendChild(img);
      } else {
        icon.textContent = app.icon;
      }

      const name = document.createElement('div');
      name.className = 'phone-app-name';
      name.textContent = app.name;

      tile.append(icon, name);
      if (this.unseen.has(app.id)) {
        const tag = document.createElement('div');
        tag.className = 'phone-app-new';
        tag.textContent = 'NEW';
        tile.appendChild(tag);
      }
      grid.appendChild(tile);
    }

    this.screen.appendChild(grid);
  }

  private showApp(app: PhoneApp): void {
    if (!this.screen) return;
    this.onHome = false;
    this.screen.replaceChildren();

    const header = document.createElement('div');
    header.className = 'phone-app-header';

    const back = document.createElement('button');
    back.className = 'phone-back-btn';
    back.textContent = '< Back';
    back.addEventListener('click', () => {
      AudioManager.playClick();
      this.showHome();
      this.options.onAppBack?.(app.id);
    });

    const title = document.createElement('div');
    title.className = 'phone-app-title';
    title.textContent = app.name;

    header.append(back, title);

    const body = document.createElement('div');
    body.className = 'phone-app-body';
    body.appendChild(
      app.render({
        notify: (event) => this.options.onAppEvent?.(app.id, event),
        refresh: () => this.showApp(app),
      })
    );

    this.screen.append(header, body);
  }

  destroy(): void {
    this.overlay?.remove();
    this.button.remove();
  }
}
