function getMailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() || process.env.EMAIL_FROM?.trim();
  return { apiKey, from };
}

export function getMailConfigStatus(): {
  hasApiKey: boolean;
  hasFrom: boolean;
  from: string | null;
} {
  const config = getMailConfig();
  return {
    hasApiKey: Boolean(config.apiKey),
    hasFrom: Boolean(config.from),
    from: config.from ?? null,
  };
}

export async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ sent: boolean; reason?: string; resendId?: string }> {
  const config = getMailConfig();
  const configStatus = getMailConfigStatus();

  console.info('[mail] sendMail called', {
    to: options.to,
    subject: options.subject,
    resendConfigured: configStatus.hasApiKey && configStatus.hasFrom,
    hasApiKey: configStatus.hasApiKey,
    hasFrom: configStatus.hasFrom,
    from: configStatus.from,
  });

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

    const data = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!response.ok) {
      const detail = data.message || data.name || JSON.stringify(data);
      console.error('[mail] Resend API error', {
        to: options.to,
        status: response.status,
        detail,
        response: data,
      });
      return {
        sent: false,
        reason: `Resend ${response.status}: ${detail}`,
      };
    }

    console.info('[mail] Resend email accepted', {
      to: options.to,
      subject: options.subject,
      resendId: data.id ?? null,
    });
    return { sent: true, resendId: data.id };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown mail error';
    console.error('[mail] sendMail exception', { to: options.to, reason, error });
    return {
      sent: false,
      reason,
    };
  }
}
