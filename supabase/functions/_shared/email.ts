// Transactional email. Sends through the Brevo transactional API when BREVO_API_KEY is set; otherwise it only logs,
// so the rest of the flow keeps working before an email provider is connected.

export interface Brand {
  product: string;
  siteUrl: string;
  supportEmail: string;
}

export interface Email {
  to: string;
  subject: string;
  heading: string;
  paragraphs: string[];
  details?: [string, string][];
  button?: { label: string; url: string };
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderEmail(brand: Brand, e: Email): string {
  const rows = (e.details ?? [])
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#6b6862;width:40%">${esc(k)}</td><td style="padding:6px 0;color:#1a1814;font-weight:500">${esc(v)}</td></tr>`)
    .join("");
  const paras = e.paragraphs.map((p) => `<p style="margin:0 0 14px;line-height:1.6">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  const button = e.button
    ? `<p style="margin:22px 0 6px"><a href="${esc(e.button.url)}" style="display:inline-block;background:#1a1814;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:600">${esc(e.button.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f4f2ee;font-family:Inter,Segoe UI,Arial,sans-serif;color:#1a1814;font-size:15px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e1db;border-radius:12px">
<tr><td style="padding:22px 28px;border-bottom:1px solid #eeebe6;font-weight:700;font-size:16px">${brand.siteUrl ? `<img src="${esc(brand.siteUrl)}/email-logo.png" width="28" height="28" alt="" style="display:inline-block;vertical-align:middle;border:0;border-radius:6px;margin-right:10px">` : ""}<span style="vertical-align:middle">${esc(brand.product)}</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:21px;letter-spacing:-0.01em">${esc(e.heading)}</h1>
${paras}
${rows ? `<table role="presentation" width="100%" style="border-top:1px solid #eeebe6;margin-top:8px;font-size:14px">${rows}</table>` : ""}
${button}
</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #eeebe6;color:#8a867f;font-size:12px;line-height:1.6">
Questions? Reply to this email or write to ${esc(brand.supportEmail || "our support team")}.<br>${esc(brand.product)} · ${esc(brand.siteUrl)}
</td></tr></table></td></tr></table></body></html>`;
}

export async function sendEmail(brand: Brand, e: Email): Promise<{ sent: boolean; reason?: string }> {
  const key = Deno.env.get("BREVO_API_KEY");
  const from = Deno.env.get("EMAIL_FROM"); // "ClipXo <billing@yourdomain.com>" or just the address
  if (!key || !from) {
    console.log(`[email skipped: no BREVO_API_KEY/EMAIL_FROM] to=${e.to} subject=${e.subject}`);
    return { sent: false, reason: "email provider not configured" };
  }
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  const sender = m ? { name: m[1] || brand.product, email: m[2] } : { name: brand.product, email: from.trim() };
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender,
      to: [{ email: e.to }],
      subject: e.subject,
      htmlContent: renderEmail(brand, e),
      ...(brand.supportEmail ? { replyTo: { email: brand.supportEmail } } : {}),
    }),
  });
  if (!res.ok) {
    console.error(`[email failed] ${res.status} ${await res.text()}`);
    return { sent: false, reason: `provider returned ${res.status}` };
  }
  return { sent: true };
}

export const pkr = (n: number) => `Rs. ${n.toLocaleString("en-PK")}`;

export const karachiDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "numeric", month: "long", year: "numeric" });
