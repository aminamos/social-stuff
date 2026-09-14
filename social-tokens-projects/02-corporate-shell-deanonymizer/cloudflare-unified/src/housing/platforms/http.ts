/**
 * Small HTTP helpers shared by every platform client.
 *
 * City portals rate-limit (429) and flake (503, as NYC HPD does intermittently),
 * so transient failures are retried with backoff rather than aborting a crawl
 * and waiting for the next 15-minute tick.
 */

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

const TRANSIENT = new Set([408, 425, 429, 500, 502, 503, 504]);

export function isTransient(err: unknown): boolean {
  return err instanceof HttpError && TRANSIENT.has(err.status);
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = 4,
  baseDelayMs = 500,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || i === attempts - 1) break;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** i));
    }
  }
  throw lastErr;
}
