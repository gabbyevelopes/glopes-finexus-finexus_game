/** Typewriter speed: milliseconds between each character. Lower = faster. */
export const TYPING_SPEED_MS = 30;
/** Extra pause after the end of a sentence (. ! ? or ...), in milliseconds. */
export const SENTENCE_PAUSE_MS = 400;
/** Extra pause after a comma, in milliseconds. */
export const COMMA_PAUSE_MS = 150;

export interface DialogueLine {
  character: string;
  text: string;
  /** Placeholder portrait color. Omit for narrator lines (no portrait shown). */
  portraitColor?: string;
  /**
   * Hide the Next button and leave the line on screen until the game closes it
   * (e.g. a prompt that waits for the player to click something in the world).
   */
  waitForAction?: boolean;
}

export const dialogueLines: DialogueLine[] = [
  {
    character: 'Narrator',
    text: 'Cashtropolis is a city of winners and losers. If you live in the Financial District, money works for you. But if you live here, in the Ledges...well you learn to survive without it. This is where Finn grew up.',
  },
  {
    character: 'Finn',
    text: "People say money doesn't buy happiness. But it buys opportunity... but growing up in the Ledges, opportunities were always in short supply.",
    portraitColor: '#4CAF50',
  },
  { character: 'Narrator', text: 'Click anywhere or use the arrow keys to move Finn forward.' },
  { character: 'Narrator', text: 'Keep walking right to explore the Ledges.' },
];

/**
 * Shows once when the Vaulton billboard first comes fully into view (unless already clicked).
 * No Next button: it stays up until the player clicks the billboard.
 */
export const billboardHintLines: DialogueLine[] = [
  {
    character: 'Narrator',
    text: "That's the Vaulton billboard. Click it to learn more.",
    waitForAction: true,
  },
];

/** Vaulton slogan, shown on the billboard and the info card. */
export const VAULTON_TAGLINE = 'Trust Us With Tomorrow.';

/** Info card that pops up when the player clicks the Vaulton billboard. */
export const VAULTON_CARD_BODY =
  'Vaulton is the leading investment bank in Cashtropolis. We help institutions raise money and make smart financial choices. Vaulton accepts only a few summer interns of high potential. These lucky few are guaranteed a prosperous lifelong career in Cashtropolis ';

/** Plays when Finn picks up his first Neobyte coin. */
export const coinLines: DialogueLine[] = [
  {
    character: 'Narrator',
    text: "Neobytes are the currency used in Cashtropolis. Save them in your phone in the top-right corner of the screen...or spend it, we don't care.",
  },
];

/**
 * Shows right after the coin line. No Next button: it stays up until the player
 * clicks the phone in the top-right corner.
 */
export const phoneHintLines: DialogueLine[] = [
  {
    character: 'Narrator',
    text: 'Click the phone in the top-right corner, then tap Wallet to see your balance.',
    waitForAction: true,
  },
];

// --- Phone tutorial (Wallet -> FinLab -> Inbox) ---

/** After the player leaves Wallet. Waits for them to open FinLab. */
export const finLabPromptLines: DialogueLine[] = [
  {
    character: 'Narrator',
    text: 'Now go back to the homepage and open FinLab, where you can buy clothes and accessories to customize Finn.',
    waitForAction: true,
  },
];

/** Inside FinLab. */
export const finLabInsideLines: DialogueLine[] = [
  {
    character: 'Narrator',
    text: 'This is where you get to style Finn...and by the looks of it he could use some polishing. Some items cost more Neobytes, but for now, you can try out a few free basics.',
  },
];

/** After the player leaves FinLab. Waits for them to open the Inbox. */
export const inboxPromptLines: DialogueLine[] = [
  {
    character: 'Narrator',
    text: 'When you are ready, go back to the homepage and open your Inbox.',
    waitForAction: true,
  },
];

/** Inside the Inbox. Waits for them to open the email. */
export const inboxInsideLines: DialogueLine[] = [
  {
    character: 'Narrator',
    text: 'Looks like you have an email from Vaulton.\n\nClick on the message to open it. No pressure.',
    waitForAction: true,
  },
];

// --- Ending ---

/** After the email is opened. Waits for the player to close the phone. */
export const exitPhonePromptLines: DialogueLine[] = [
  { character: 'Narrator', text: 'Close your phone.', waitForAction: true },
];

/** Once the phone is closed. The last line of Level 0. */
export const endingLines: DialogueLine[] = [
  { character: 'Finn', text: "Looks like it's time to get a suit.", portraitColor: '#4CAF50' },
];

/** Shown on the Level 0 complete screen. */
export const NEXT_LEVEL_TITLE = 'Level 1 - Welcome to Vaulton';

/** Plays after the player closes the Vaulton info card (once only). */
export const billboardLines: DialogueLine[] = [
  {
    character: 'Finn',
    text: "One day... I'll work here. They only take a few interns every summer, but it's my only ticket out of this place.",
    portraitColor: '#4CAF50',
  },
];
