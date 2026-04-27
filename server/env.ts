type ServerEnv = {
  apiPort: number
  telegramBotToken: string
  telegramTargetChatId: string
  isTelegramConfigured: boolean
}

export function getServerEnv(): ServerEnv {
  const apiPort = Number(process.env.API_PORT ?? 8787)
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN ?? ''
  const telegramTargetChatId = process.env.TELEGRAM_TARGET_CHAT_ID ?? ''

  return {
    apiPort: Number.isNaN(apiPort) ? 8787 : apiPort,
    telegramBotToken,
    telegramTargetChatId,
    isTelegramConfigured: Boolean(
      telegramBotToken.trim() && telegramTargetChatId.trim(),
    ),
  }
}
