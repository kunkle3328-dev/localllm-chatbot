
let buffer = "";
let raf: number | null = null;

/**
 * Batches rapid token updates into requestAnimationFrame ticks
 * to prevent UI jank and improve battery life during heavy streaming.
 */
export function appendToken(
  token: string,
  flush: (text: string) => void
) {
  buffer += token;

  if (!raf) {
    raf = requestAnimationFrame(() => {
      if (buffer) {
        flush(buffer);
        buffer = "";
      }
      raf = null;
    });
  }
}
