import { hash, verify } from '@node-rs/argon2';

// Argon2id avec les parametres par defaut recommandes (OWASP)
export const hashPassword = (password: string): Promise<string> =>
  hash(password);

export const verifyPassword = (
  passwordHash: string,
  password: string,
): Promise<boolean> => verify(passwordHash, password).catch(() => false);
