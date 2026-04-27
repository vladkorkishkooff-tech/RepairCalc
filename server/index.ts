import 'dotenv/config'

import { createApp } from './create-app'
import { getServerEnv } from './env'

const app = createApp()
const env = getServerEnv()

app.listen(env.apiPort, () => {
  console.info(`RepairCalc API listening on http://localhost:${env.apiPort}`)
})
