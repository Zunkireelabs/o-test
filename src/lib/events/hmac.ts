import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Verify HMAC signature for event ingestion
 *
 * Signature format: HMAC-SHA256(secret, `${timestamp}.${rawBody}`)
 *
 * @param rawBody - Raw request body string
 * @param timestamp - Unix timestamp from x-orca-timestamp header
 * @param signature - Signature from x-orca-signature header
 * @param secret - Tenant HMAC secret
 * @returns boolean indicating if signature is valid
 */
export function verifySignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  try {
    const signedPayload = `${timestamp}.${rawBody}`
    const expectedSignature = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex')

    // Convert to buffers for timing-safe comparison
    const sigBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')

    // Ensure buffers are same length before comparison
    if (sigBuffer.length !== expectedBuffer.length) {
      return false
    }

    return timingSafeEqual(sigBuffer, expectedBuffer)
  } catch {
    return false
  }
}

/**
 * Generate HMAC signature for testing/client use
 *
 * @param rawBody - Raw request body string
 * @param timestamp - Unix timestamp
 * @param secret - Tenant HMAC secret
 * @returns Hex-encoded signature
 */
export function generateSignature(
  rawBody: string,
  timestamp: string,
  secret: string
): string {
  const signedPayload = `${timestamp}.${rawBody}`
  return createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex')
}
