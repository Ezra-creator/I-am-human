export const MAX_INPUT_CHARS = 8000;
export const MIN_INPUT_CHARS = 40;

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function countChars(text: string): number {
  return text.length;
}
