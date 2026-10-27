import crypto from 'node:crypto';
import fs from 'node:fs';
import type { DatabaseSync } from 'node:sqlite';

const ALGORITHM = 'aes-256-gcm';
const DEFAULT_SALT = 'clickstorm_offline_vault_salt_2026';

export function getDerivedMasterKey(customSecret?: string): string {
  if (process.env.CLICKSTORM_DB_KEY) {
    return process.env.CLICKSTORM_DB_KEY;
  }
  const machineSeed = customSecret || process.env.COMPUTERNAME || process.env.HOSTNAME || 'CLICKSTORM_DEFAULT_MACHINE';
  return crypto.pbkdf2Sync(machineSeed, DEFAULT_SALT, 10000, 32, 'sha256').toString('hex');
}

export function applyDatabaseEncryptionPragma(db: DatabaseSync, key?: string): void {
  const secretKey = key || getDerivedMasterKey();
  try {
    db.exec(`PRAGMA key = '${secretKey}';`);
    db.exec(`PRAGMA cipher_compatibility = 4;`);
  } catch {
    // Se o driver em execução for SQLite padrão sem SQLCipher, a pragma é ignorada com segurança
  }
}

export function encryptDatabaseSnapshot(sourcePath: string, destPath: string, key?: string): void {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Arquivo de banco de dados não encontrado: ${sourcePath}`);
  }
  const keyBuffer = crypto.scryptSync(key || getDerivedMasterKey(), DEFAULT_SALT, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  const input = fs.readFileSync(sourcePath);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Formato: [IV: 16 bytes][AuthTag: 16 bytes][Dados criptografados]
  const output = Buffer.concat([iv, authTag, encrypted]);
  fs.writeFileSync(destPath, output);
}

export function decryptDatabaseSnapshot(sourcePath: string, destPath: string, key?: string): void {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Arquivo criptografado não encontrado: ${sourcePath}`);
  }
  const fileData = fs.readFileSync(sourcePath);
  if (fileData.length < 32) {
    throw new Error('Arquivo de snapshot inválido ou corrompido');
  }

  const iv = fileData.subarray(0, 16);
  const authTag = fileData.subarray(16, 32);
  const encryptedData = fileData.subarray(32);

  const keyBuffer = crypto.scryptSync(key || getDerivedMasterKey(), DEFAULT_SALT, 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  fs.writeFileSync(destPath, decrypted);
}
