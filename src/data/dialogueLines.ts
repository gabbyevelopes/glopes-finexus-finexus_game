/** Typewriter speed: milliseconds between each character. Lower = faster. */
export const TYPING_SPEED_MS = 30;

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
  { character: 'Narrator', text: 'Click to move Finn forward.' },
];
