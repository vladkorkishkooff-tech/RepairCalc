import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildEstimateSubmission } from '../src/features/repair-calculator/model/build-estimate-submission'
import { calculateEstimate } from '../src/features/repair-calculator/model/calculate-estimate'
import { defaultCalculatorValues } from '../src/features/repair-calculator/model/default-values'
import { createApp } from './create-app'
import * as telegramModule from './telegram'

function createPayload() {
  const estimate = calculateEstimate(defaultCalculatorValues)

  return buildEstimateSubmission(
    {
      ...defaultCalculatorValues,
      contact: {
        name: 'Тестовый клиент',
        phone: '+7 (999) 123-45-67',
      },
    },
    estimate,
  )
}

describe('createApp', () => {
  afterEach(() => {
    delete process.env.TELEGRAM_BOT_TOKEN
    delete process.env.TELEGRAM_TARGET_CHAT_ID
    vi.restoreAllMocks()
  })

  it('returns mock mode when telegram env is missing', async () => {
    const response = await request(createApp()).post('/api/estimate/send').send(createPayload())

    expect(response.status).toBe(200)
    expect(response.body.mode).toBe('mock')
  })

  it('validates payload', async () => {
    const response = await request(createApp()).post('/api/estimate/send').send({})

    expect(response.status).toBe(400)
  })

  it('sends to telegram when env is configured', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'token'
    process.env.TELEGRAM_TARGET_CHAT_ID = '123'

    const telegramSpy = vi
      .spyOn(telegramModule, 'sendTelegramMessage')
      .mockResolvedValue({
        ok: true,
        result: {
          message_id: 42,
          chat: {
            id: 123,
            type: 'private',
            username: 'tester',
            first_name: 'Test',
          },
        },
      })

    const response = await request(createApp()).post('/api/estimate/send').send(createPayload())

    expect(response.status).toBe(200)
    expect(response.body.mode).toBe('telegram')
    expect(response.body.delivery).toEqual(
      expect.objectContaining({
        messageId: 42,
        chatIdEnding: '123',
        chatType: 'private',
        chatUsername: 'tester',
      }),
    )
    expect(telegramSpy).toHaveBeenCalledOnce()
    expect(telegramSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Стиль: Светлый минимал'),
      }),
    )
  })
})
