import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Passwords are kept as scrypt hashes: "scrypt$N$r$p$salt$hash", base64url.
 * The parameters ride along in the string, so they can be raised later
 * without breaking the passwords already stored. No "server-only" here: the
 * seed script runs this outside Next.js.
 */

const N = 16_384;
const R = 8;
const P = 1;
const KEY_LENGTH = 32;

const derive = (password: string, salt: Buffer, n: number, r: number, p: number): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16);
  const key = await derive(password, salt, N, R, P);
  return ["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join("$");
};

/** True when the password matches the stored hash; false for a hash it cannot read. */
export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !n || !r || !p || !salt || !hash) {
    return false;
  }
  const expected = Buffer.from(hash, "base64url");
  const key = await derive(password, Buffer.from(salt, "base64url"), Number(n), Number(r), Number(p));
  return key.length === expected.length && timingSafeEqual(key, expected);
};

/** Compared against when the username is unknown, so a wrong name takes as long as a wrong password. */
export const DUMMY_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
