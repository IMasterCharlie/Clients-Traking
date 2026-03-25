import { SignJWT, jwtVerify } from 'jose';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret_at_least_32_chars_long');
const JWT_REFRESH_SECRET = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_at_least_32_chars_long');

export async function signToken(
  payload: any,
  secretType: 'access' | 'refresh' = 'access',
  expiresIn: string = '15m'
) {
  const secret = secretType === 'access' ? JWT_SECRET : JWT_REFRESH_SECRET;
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifyToken(token: string, secretType: 'access' | 'refresh' = 'access') {
  const secret = secretType === 'access' ? JWT_SECRET : JWT_REFRESH_SECRET;
  try {
    const { payload } = await jwtVerify(token, secret);
    // Normalize userId to a 24-char hex string.
    // jose may deserialize a MongoDB ObjectId stored in JWT as a BSON binary buffer object.
    if (payload.userId != null) {
      const uid = payload.userId as any;
      if (typeof uid === 'object' && uid.buffer) {
        // BSON Binary: { buffer: { '0': 105, '1': 191, ... } } — convert to hex
        const bytes = Object.values(uid.buffer) as number[];
        (payload as any).userId = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        (payload as any).userId = String(uid);
      }
    }
    return { payload, error: null };
  } catch (error: any) {
    return { payload: null, error: error.code || 'INVALID_TOKEN' };
  }
}

export async function hashToken(token: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
