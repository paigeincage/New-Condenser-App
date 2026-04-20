// Ported from the-condenser/src/services/communication.ts

export function sendEmail(to: string, subject: string, body: string): void {
  window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function sendText(phone: string, body: string): void {
  const digits = phone.replace(/\D/g, '');
  window.open(`sms:${digits}?&body=${encodeURIComponent(body)}`);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadAsFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function printContent(content: string): void {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(
    `<pre style="font-family:monospace;font-size:12px;padding:24px;white-space:pre-wrap">${content.replace(/</g, '&lt;')}</pre>`,
  );
  w.document.close();
  w.print();
}

export async function nativeShare(title: string, text: string): Promise<boolean> {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title, text });
    return true;
  } catch {
    return false;
  }
}
