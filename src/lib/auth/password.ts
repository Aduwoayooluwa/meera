import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;

function toBase64Url(buffer: Buffer) {
  return buffer.toString("base64url");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

  return `scrypt$${toBase64Url(salt)}$${toBase64Url(key)}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, saltValue, keyValue] = storedHash.split("$");

  if (algorithm !== "scrypt" || !saltValue || !keyValue) {
    return false;
  }

  const salt = Buffer.from(saltValue, "base64url");
  const storedKey = Buffer.from(keyValue, "base64url");
  const key = (await scryptAsync(password, salt, storedKey.length)) as Buffer;

  return timingSafeEqual(storedKey, key);
}
