import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'internbridge-jwt-secret-key-development-2026';

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getAuthUser(req) {
  try {
    // Next.js App Router provides cookies directly on Request object
    const token = req.cookies.get('token')?.value;
    if (!token) return null;
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}
