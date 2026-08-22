export * from './types';
export * from './resend.transport';
export * from './disabled.transport';

import { EmailTransport } from './types';
import { ResendEmailTransport } from './resend.transport';
import { DisabledEmailTransport } from './disabled.transport';

export function getMarketingEmailTransport(): EmailTransport {
  // We keep marketing emails completely disabled until the business explicitly activates it.
  const isEnabled = process.env.LIFECYCLE_EMAILS_ENABLED === 'true';
  
  if (!isEnabled) {
    return new DisabledEmailTransport('BLOCKED_SEND_DISABLED');
  }

  return new ResendEmailTransport();
}

export function getTransactionalEmailTransport(): EmailTransport {
  // Transactional emails (order confirmation, etc) use the primary provider
  return new ResendEmailTransport();
}

