export function triggerTelegramNotification(): void {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error("Telegram credentials missing in environment.");
    return;
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: "🔔 Sinyal 1",
    disable_notification: false,
  };

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        console.error(
          `Telegram API Error: ${response.status} - ${response.statusText}`,
        );
      }
    })
    .catch((error: unknown) => {
      console.error("Failed to execute Telegram webhook:", error);
    });
}
