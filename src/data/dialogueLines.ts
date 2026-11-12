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
];
