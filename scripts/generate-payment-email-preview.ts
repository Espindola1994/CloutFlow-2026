import fs from 'node:fs';
import path from 'node:path';
import { renderCloutFlowEmail } from '../src/services/email/design-system/render';

const root = process.cwd();
const publicEmail = path.join(root, 'public', 'email');

const result = renderCloutFlowEmail({
  category: 'transactional',
  network: 'instagram',
  preheader: 'Payment confirmed — your CloutFlow order is being prepared.',
  eyebrow: 'Payment confirmed',
  title: "We've received your order",
  bodyText: 'Thank you for choosing CloutFlow. Your payment has been approved and your order is being prepared for delivery.',
  order: {
    publicId: 'CF-7936WJ8ZGK',
    network: 'instagram',
    service: 'Followers',
    quantity: 2000,
    target: 'guilhermeterraaa',
    status: 'Payment confirmed',
  },
  supportReplyNotice: true,
});

function mimeFor(file: string) {
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
  if (file.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

let html = result.html;

// Embed every new /email asset so local preview never shows broken icons/heroes/waves.
html = html.replace(/https:\/\/cloutflow\.co\/email\/([^"' )>]+)/g, (full, file) => {
  const local = path.join(publicEmail, file);
  if (!fs.existsSync(local)) return full;
  const encoded = fs.readFileSync(local).toString('base64');
  return `data:${mimeFor(local)};base64,${encoded}`;
});

const output = path.join(root, 'payment-email-preview-final.html');
fs.writeFileSync(output, html, 'utf8');
console.log(`Preview created: ${output}`);
