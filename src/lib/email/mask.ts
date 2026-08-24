/**
 * Email masking utility for customer privacy.
 * Masks email address for display (e.g. loj*****@gmail.com).
 * Preserves the domain and first few characters of the local part.
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') return '';
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0) return trimmed;

  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex); // includes '@'

  if (localPart.length <= 1) {
    return `*${domainPart}`;
  }

  if (localPart.length === 2) {
    return `${localPart[0]}*${domainPart}`;
  }

  if (localPart.length === 3) {
    return `${localPart.slice(0, 1)}**${domainPart}`;
  }

  if (localPart.length <= 5) {
    const visibleChars = Math.min(2, localPart.length - 1);
    const maskedLength = Math.max(3, localPart.length - visibleChars);
    return `${localPart.slice(0, visibleChars)}${'*'.repeat(maskedLength)}${domainPart}`;
  }

  // 6 or more characters: show first 3, mask 5 asterisks
  return `${localPart.slice(0, 3)}*****${domainPart}`;
}
