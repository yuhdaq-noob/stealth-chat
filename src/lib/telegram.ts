export async function triggerTelegramNotification(): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error("Telegram credentials missing in environment.");
    return false;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: "🔔 Sinyal 1",
    disable_notification: false,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    const result = (await response.json().catch(() => null)) as {
      ok?: boolean;
    } | null;

    if (!response.ok || result?.ok !== true) {
      console.error(
        `Telegram API Error: ${response.status} - ${response.statusText}`,
      );
      return false;
    }

    return true;
  } catch (error: unknown) {
    console.error("Failed to execute Telegram notification:", error);
    return false;
  }
}
