import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.AES_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef', 'utf8');

if (KEY.length !== 32) {
  throw new Error('AES_ENCRYPTION_KEY must be 32 characters long');
}

// Field-based encryption: returns separate passwordEnc, iv, authTag strings (base64)
export function encryptCredential(plaintext: string): { passwordEnc: string; iv: string; authTag: string } {
  const ivBuf = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, ivBuf);
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const authTagBuf = cipher.getAuthTag();
  return {
    passwordEnc: ciphertext,
    iv: ivBuf.toString('base64'),
    authTag: authTagBuf.toString('base64'),
  };
}

export function decryptCredential({
  passwordEnc,
  iv,
  authTag,
}: {
  passwordEnc: string;
  iv: string;
  authTag: string;
}): string {
  const ivBuf = Buffer.from(iv, 'base64');
  const authTagBuf = Buffer.from(authTag, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, ivBuf);
  decipher.setAuthTag(authTagBuf);
  let plaintext = decipher.update(passwordEnc, 'base64', 'utf8');
  try {
    plaintext += decipher.final('utf8');
  } catch {
    throw new Error('INTEGRITY_ERROR');
  }
  return plaintext;
}

export function encrypt(plaintext: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return JSON.stringify({
    ciphertext,
    iv: iv.toString('hex'),
    authTag
  });
}

export function decrypt(encryptedData: string) {
  const { ciphertext, iv, authTag } = JSON.parse(encryptedData);
  
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
  plaintext += decipher.final('utf8');
  
  return plaintext;
}
