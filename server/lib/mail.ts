function getMailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || process.env.EMAIL_FROM?.trim();
  return { apiKey, from };
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const config = getMailConfig();

  if (!config.apiKey) {
    return { sent: false, reason: 'RESEND_API_KEY not configured' };
  }
  if (!config.from) {
    return { sent: false, reason: 'RESEND_FROM not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.from,
        to: [options.to],
        subject: options.subject,
        text: options.text,
        html: options.html,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        name?: string;
      };
      const detail = data.message || data.name || JSON.stringify(data);
      return {
        sent: false,
        reason: `Resend ${response.status}: ${detail}`,
      };
    }

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : 'Unknown mail error',
    };
  }
}
