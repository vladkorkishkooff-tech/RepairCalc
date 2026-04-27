import express from 'express'

import { estimateSubmissionSchema } from '../src/shared/contracts/estimate'
import { buildEstimateMessage } from './message'
import { getServerEnv } from './env'
import { sendTelegramMessage } from './telegram'

export function createApp() {
  const app = express()

  app.use(express.json({ limit: '256kb' }))

  app.get('/api/health', (_request, response) => {
    response.json({
      ok: true,
      service: 'repaircalc-api',
    })
  })

  app.post('/api/estimate/send', async (request, response) => {
    const parsed = estimateSubmissionSchema.safeParse(request.body)

    if (!parsed.success) {
      response.status(400).json({
        ok: false,
        message: 'Проверьте данные формы и попробуйте снова.',
        issues: parsed.error.flatten(),
      })
      return
    }

    const env = getServerEnv()
    const message = buildEstimateMessage(parsed.data)

    if (!env.isTelegramConfigured) {
      console.info('[repaircalc:mock-telegram]\n' + message)
      response.json({
        ok: true,
        mode: 'mock',
        message: 'Telegram env не заданы. Заявка записана в mock-лог.',
      })
      return
    }

    try {
      const telegramResponse = await sendTelegramMessage({
        token: env.telegramBotToken,
        chatId: env.telegramTargetChatId,
        text: message,
      })
      const deliveredChat = telegramResponse.result?.chat
      const deliveredChatId = deliveredChat?.id

      response.json({
        ok: true,
        mode: 'telegram',
        message: 'Смета отправлена в Telegram.',
        delivery: {
          messageId: telegramResponse.result?.message_id,
          chatIdEnding:
            deliveredChatId === undefined ? undefined : String(deliveredChatId).slice(-4),
          chatType: deliveredChat?.type,
          chatUsername: deliveredChat?.username,
          chatTitle: deliveredChat?.title,
          chatFirstName: deliveredChat?.first_name,
        },
      })
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown telegram error'

      response.status(502).json({
        ok: false,
        message: 'Не удалось отправить смету в Telegram.',
        reason,
      })
    }
  })

  return app
}
