import { verifyUnsubscribeToken } from '@/services/lifecycle/unsubscribe.service';
import UnsubscribeClient from './UnsubscribeClient';

export default async function UnsubscribePage({ searchParams }: { searchParams: { email?: string; token?: string } }) {
  const { email, token } = await searchParams;

  const initialValid = Boolean(email && token && verifyUnsubscribeToken(email, token));

  return <UnsubscribeClient email={email || ''} token={token || ''} initialValid={initialValid} />;
}
