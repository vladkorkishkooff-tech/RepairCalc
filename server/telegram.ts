import { execFile as execFileCallback } from 'node:child_process'
import https from 'node:https'
import { promisify } from 'node:util'

type TelegramPayload = {
  token: string
  chatId: string
  text: string
}

type TelegramApiResponse = {
  ok: boolean
  description?: string
  result?: {
    message_id?: number
    chat?: {
      id?: number
      type?: string
      username?: string
      title?: string
      first_name?: string
      last_name?: string
    }
  }
}

const execFile = promisify(execFileCallback)

async function sendTelegramViaHttps({
  token,
  chatId,
  text,
}: TelegramPayload) {
  const body = JSON.stringify({
    chat_id: chatId,
    text,
  })

  return new Promise<TelegramApiResponse>((resolve, reject) => {
    const request = https.request(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (result) => {
        const chunks: Buffer[] = []

        result.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        })

        result.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8')

          try {
            const parsed = JSON.parse(raw) as TelegramApiResponse

            if (result.statusCode && result.statusCode >= 400) {
              reject(
                new Error(
                  `Telegram request failed: ${result.statusCode} ${parsed.description ?? raw}`,
                ),
              )
              return
            }

            resolve(parsed)
          } catch {
            reject(new Error(`Telegram returned invalid JSON: ${raw}`))
          }
        })
      },
    )

    request.on('error', (error) => {
      reject(error)
    })

    request.setTimeout(12_000, () => {
      request.destroy(new Error('Telegram HTTPS request timed out'))
    })

    request.write(body)
    request.end()
  })
}

async function sendTelegramViaPowerShell({
  token,
  chatId,
  text,
}: TelegramPayload) {
  const script = [
    "$url = 'https://api.telegram.org/bot' + $env:REPAIRCALC_TELEGRAM_TOKEN + '/sendMessage'",
    "$payload = @{ chat_id = $env:REPAIRCALC_TELEGRAM_CHAT_ID; text = $env:REPAIRCALC_TELEGRAM_TEXT } | ConvertTo-Json",
    '$resp = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json" -Body $payload',
    '$resp | ConvertTo-Json -Depth 6',
  ].join('; ')

  const { stdout } = await execFile(
    'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
    ['-NoProfile', '-Command', script],
    {
      env: {
        ...process.env,
        REPAIRCALC_TELEGRAM_TOKEN: token,
        REPAIRCALC_TELEGRAM_CHAT_ID: chatId,
        REPAIRCALC_TELEGRAM_TEXT: text,
      },
      windowsHide: true,
    },
  )

  return JSON.parse(stdout) as TelegramApiResponse
}

export async function sendTelegramMessage({
  token,
  chatId,
  text,
}: TelegramPayload) {
  let response: TelegramApiResponse

  try {
    response = await sendTelegramViaHttps({
      token,
      chatId,
      text,
    })
  } catch (error) {
    if (process.platform !== 'win32') {
      throw error
    }

    response = await sendTelegramViaPowerShell({
      token,
      chatId,
      text,
    })
  }

  if (!response.ok) {
    throw new Error(response.description ?? 'Telegram API returned ok=false')
  }

  return response
}
