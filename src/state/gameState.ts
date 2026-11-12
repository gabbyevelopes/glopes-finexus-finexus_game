/** Things the player has earned, shared by the scene and the phone apps. */
export const gameState = {
  neobytes: 0,
  /** Finn's look, chosen in FinLab (ids from finLabItems.ts). */
  appearance: { hair: 'teal-blue', skin: 'peach' },
  /** Emails the player has opened. */
  readEmails: new Set<string>(),
};
