import { gameState } from '../../state/gameState';
import {
  hairColors,
  ORIGINAL_HAIR_SWATCH,
  ORIGINAL_SKIN_SWATCH,
  skinTones,
  type FinLabColor,
} from '../../data/finLabItems';
import { emails } from '../../data/emails';

export interface PhoneAppContext {
  /** Tell the game something happened inside the app (e.g. 'equip-changed', 'email-opened'). */
  notify(event: string): void;
  /** Redraw this app's screen (after its data changed). */
  refresh(): void;
}

export interface PhoneApp {
  id: string;
  name: string;
  /** Short text shown on the app tile (placeholder until there's icon art). */
  icon: string;
  /** Tile color. */
  color: string;
  /** Builds the app's screen each time it's opened or refreshed. */
  render(ctx: PhoneAppContext): HTMLElement;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Every app the phone can have. Apps stay hidden until the story unlocks them
 * with `phone.unlockApp(id)`. To add one: add it here, then unlock it in the scene
 * at the right plot moment.
 */
export const phoneApps: PhoneApp[] = [
  {
    id: 'wallet',
    name: 'Wallet',
    icon: '$',
    color: '#ffd23f',
    render() {
      const wallet = el('div', 'phone-wallet');
      wallet.append(
        el('div', 'phone-wallet-label', 'Balance'),
        el('div', 'phone-wallet-amount', String(gameState.neobytes)),
        el('div', 'phone-wallet-unit', 'Neobytes')
      );
      return wallet;
    },
  },
  {
    id: 'finlab',
    name: 'FinLab',
    icon: 'FL',
    color: '#ff7ab6',
    render(ctx) {
      const lab = el('div', 'phone-finlab');
      lab.appendChild(el('div', 'phone-finlab-balance', `You have ${gameState.neobytes} NB`));
      lab.append(
        colorPicker('Hair', hairColors, ORIGINAL_HAIR_SWATCH, 'hair', ctx),
        colorPicker('Skin', skinTones, ORIGINAL_SKIN_SWATCH, 'skin', ctx)
      );
      return lab;
    },
  },
  {
    id: 'inbox',
    name: 'Inbox',
    icon: '@',
    color: '#7ad0ff',
    render(ctx) {
      const inbox = el('div', 'phone-inbox');
      for (const email of emails) {
        const row = el('button', 'phone-inbox-row');
        if (!gameState.readEmails.has(email.id)) row.appendChild(el('div', 'phone-inbox-unread'));
        const text = el('div', 'phone-inbox-text');
        text.append(el('div', 'phone-inbox-from', email.from), el('div', 'phone-inbox-subject', email.subject));
        row.appendChild(text);
        row.addEventListener('click', () => {
          gameState.readEmails.add(email.id);
          inbox.replaceChildren(emailView(email.from, email.subject, email.body, () => ctx.refresh()));
          ctx.notify('email-opened');
        });
        inbox.appendChild(row);
      }
      return inbox;
    },
  },
];

/** A labeled row of color swatches; tapping one recolors Finn. */
function colorPicker(
  label: string,
  options: FinLabColor[],
  originalSwatch: string,
  part: 'hair' | 'skin',
  ctx: PhoneAppContext
): HTMLElement {
  const section = el('div', 'phone-finlab-section');
  const selected = options.find((o) => o.id === gameState.appearance[part]);
  const selectedName = selected ? `${selected.name}${selected.isDefault ? ' (Default)' : ''}` : '';
  section.appendChild(el('div', 'phone-finlab-label', `${label}: ${selectedName}`));

  const swatches = el('div', 'phone-finlab-swatches');
  for (const option of options) {
    const swatch = el('button', 'phone-finlab-swatch');
    swatch.style.backgroundColor = option.color ?? originalSwatch;
    swatch.title = option.price
      ? `${option.name} (${option.price} NB)`
      : `${option.name}${option.isDefault ? ' (Default)' : ''}`;
    if (option.id === gameState.appearance[part]) swatch.classList.add('is-selected');
    if (option.isDefault) swatch.appendChild(el('span', 'phone-finlab-default-tag', 'DEF'));

    if (option.price > 0) {
      // Buying isn't built yet: priced colors stay locked for now.
      swatch.disabled = true;
      swatch.appendChild(el('span', 'phone-finlab-price-tag', String(option.price)));
    } else {
      swatch.addEventListener('click', () => {
        gameState.appearance[part] = option.id;
        ctx.notify('appearance-changed');
        ctx.refresh();
      });
    }
    swatches.appendChild(swatch);
  }

  section.appendChild(swatches);
  return section;
}

function emailView(from: string, subject: string, body: string, onBack: () => void): HTMLElement {
  const view = el('div', 'phone-email');
  const back = el('button', 'phone-email-back', '< All mail');
  back.addEventListener('click', onBack);
  view.append(
    back,
    el('div', 'phone-email-from', `From: ${from}`),
    el('div', 'phone-email-subject', subject),
    el('p', 'phone-email-body', body)
  );
  return view;
}
