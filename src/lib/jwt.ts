import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_sr_rentals_key_2026_long_and_secure_string';
const key = new TextEncoder().encode(JWT_SECRET);

export async function signToken(payload: { id: string; email: string; role: string }) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as { id: string; email: string; role: string };
  } catch (error) {
    return null;
  }
}
