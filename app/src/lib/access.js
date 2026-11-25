/* Pre-launch access.
   The public sees only the coming-soon page. The full site sits behind PREVIEW_PATH
   and a 6-digit passcode. Unlocking lasts for the browser tab only (sessionStorage),
   so every new visit asks for the passcode again.

   Only the SHA-256 of the passcode is shipped. This keeps casual visitors out; it is
   not real security (anyone determined can read the bundle). To change the passcode:
     printf '123456' | sha256sum   → paste the hash below. */
export const PREVIEW_PATH = '/preview';
export const CODE_LENGTH = 6;
const CODE_HASH = '762182e2765c38d2c2806da1abebca8dbfd5b1d6b6bb910f664f1de2c29ba0f4';
const KEY = 'k4l-preview';

export function isUnlocked() {
  try { return sessionStorage.getItem(KEY) === CODE_HASH; } catch { return false; }
}

export function lock() {
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Resolves true and remembers the unlock for this tab when the code is right. */
export async function tryUnlock(code) {
  const ok = (await sha256(code)) === CODE_HASH;
  if (ok) { try { sessionStorage.setItem(KEY, CODE_HASH); } catch { /* ignore */ } }
  return ok;
}
