const MIN_WORDS = 700;
const MAX_WORDS = 900;
const OVERLAP_WORDS = 90;

export function normalizeMemoryText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function chunkText(value: string) {
  const normalized = normalizeMemoryText(value);
  const words = normalized.split(" ").filter(Boolean);

  if (words.length <= MAX_WORDS) {
    return [normalized];
  }

  const chunks: string[] = [];
  let index = 0;

  while (index < words.length) {
    const remaining = words.length - index;
    const size = remaining < MAX_WORDS + MIN_WORDS / 2 ? remaining : MAX_WORDS;
    chunks.push(words.slice(index, index + size).join(" "));

    if (index + size >= words.length) {
      break;
    }

    index += Math.max(size - OVERLAP_WORDS, MIN_WORDS);
  }

  return chunks;
}
