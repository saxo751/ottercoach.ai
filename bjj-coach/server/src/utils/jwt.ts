import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'change-me';
const EXPIRY = '30d';

export interface JWTPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRY });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}
