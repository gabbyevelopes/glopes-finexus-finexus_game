/** A color option in FinLab, applied to Finn by recoloring his existing sprite. */
export interface FinLabColor {
  id: string;
  name: string;
  /** Hex color, or null to keep Finn's original art colors. */
  color: string | null;
  /** Cost in Neobytes. 0 = free. */
  price: number;
  /** Finn's look as originally drawn. Marked "Default" in FinLab. */
  isDefault?: boolean;
}

/** Shown on the swatch for the default options, which keep the art as drawn. */
export const ORIGINAL_HAIR_SWATCH = '#4a86a8';
export const ORIGINAL_SKIN_SWATCH = '#f3c6ac';

export const hairColors: FinLabColor[] = [
  // Free
  { id: 'teal-blue', name: 'Teal Blue', color: null, price: 0, isDefault: true },
  { id: 'black', name: 'Black', color: '#2b2b33', price: 0 },
  { id: 'blonde', name: 'Blonde', color: '#e3bc55', price: 0 },
  // Cost more Neobytes than Finn has right now
  { id: 'neon-purple', name: 'Neon Purple', color: '#a64dff', price: 250 },
  { id: 'neon-pink', name: 'Neon Pink', color: '#ff4fb0', price: 300 },
  { id: 'neon-green', name: 'Neon Green', color: '#39ff6a', price: 400 },
];

/** Skin tones are always free. */
export const skinTones: FinLabColor[] = [
  { id: 'peach', name: 'Peach', color: null, price: 0, isDefault: true },
  { id: 'light', name: 'Light', color: '#f7dccb', price: 0 },
  { id: 'medium', name: 'Medium', color: '#d9a27f', price: 0 },
  { id: 'tan', name: 'Tan', color: '#b97a56', price: 0 },
  { id: 'brown', name: 'Brown', color: '#8d5a3b', price: 0 },
  { id: 'deep', name: 'Deep', color: '#5c3a26', price: 0 },
];
