import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
const COOKIE_NAME = 'session'
const EXPIRES_IN = '8h'

export interface SessionPayload {
  username: string
  role: string
  [key: string]: unknown
}

export async function signToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(EXPIRES_IN)
    .setIssuedAt()
    .sign(secret)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as SessionPayload
  } catch {
    return null
  }
}

export { COOKIE_NAME }
