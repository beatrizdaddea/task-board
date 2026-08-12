import type { JwtPayload } from '@/features/auth/types/authTypes'

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, encodedPayload] = token.split('.')

    if (!encodedPayload) {
      return null
    }

    const normalizedPayload = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=')

    return JSON.parse(atob(normalizedPayload)) as JwtPayload
  } catch {
    return null
  }
}

export function getTokenExpiration(token: string): number | null {
  const expiration = decodeJwtPayload(token)?.exp
  return typeof expiration === 'number' ? expiration * 1_000 : null
}

export function isAccessTokenValid(token: string | null): token is string {
  if (!token) {
    return false
  }

  const expiration = getTokenExpiration(token)
  return expiration !== null && expiration > Date.now()
}
