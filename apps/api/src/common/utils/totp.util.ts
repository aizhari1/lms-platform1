import * as crypto from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Minimal TOTP (RFC 6238) implementation used for Two-Factor
 * Authentication. Deliberately dependency-free (uses Node's built-in
 * `crypto`) rather than pulling in `speakeasy`/`otplib`, since this is
 * the only place in the codebase that would need them.
 */
export class TotpUtil {
  static generateSecret(length = 20): string {
    return this.base32Encode(crypto.randomBytes(length));
  }

  static getOtpAuthUrl(secret: string, accountEmail: string, issuer = 'SIRAJ LMS'): string {
    const label = encodeURIComponent(`${issuer}:${accountEmail}`);
    return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  }

  /** Verifies a 6-digit code, allowing ±1 time-step (±30s) for clock drift. */
  static verify(secret: string, token: string): boolean {
    const cleanToken = token.replace(/\s/g, '');
    if (!/^\d{6}$/.test(cleanToken)) return false;

    const counter = Math.floor(Date.now() / 1000 / 30);
    for (const offset of [-1, 0, 1]) {
      if (this.generateCode(secret, counter + offset) === cleanToken) return true;
    }
    return false;
  }

  static generateCode(secret: string, counter: number): string {
    const key = this.base32Decode(secret);
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter));

    const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0xf;
    const binCode =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return (binCode % 1_000_000).toString().padStart(6, '0');
  }

  static generateBackupCodes(count = 8): string[] {
    return Array.from({ length: count }, () =>
      crypto.randomBytes(5).toString('hex').toUpperCase(),
    );
  }

  private static base32Encode(buffer: Buffer): string {
    let bits = 0;
    let value = 0;
    let output = '';
    for (const byte of buffer) {
      value = (value << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) {
      output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }
    return output;
  }

  private static base32Decode(input: string): Buffer {
    const clean = input.toUpperCase().replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];
    for (const char of clean) {
      const idx = BASE32_ALPHABET.indexOf(char);
      if (idx === -1) continue;
      value = (value << 5) | idx;
      bits += 5;
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    return Buffer.from(bytes);
  }
}
