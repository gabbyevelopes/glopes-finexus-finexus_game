/**
 * Central place for all game sounds. Every function is a placeholder for now:
 * fill in the bodies when real sound files are ready, and every call site in
 * the game will start playing them automatically.
 */
export const AudioManager = {
  /** A single character appears while dialogue is typing out. */
  playTypeBlip(): void {
    // TODO: play type blip sound
  },

  /** The player clicks a button, e.g. "Next" in the dialogue box. */
  playClick(): void {
    // TODO: play click sound
  },

  /** The player collects a Neobyte. */
  playCoinCollect(): void {
    // TODO: play coin collect sound
  },

  /** Background music for an area. `track` names which song to play. */
  playMusic(track: string): void {
    // TODO: start background music for `track`
    void track;
  },
};
