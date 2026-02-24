import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(__dirname, '../.env') })

import { EventProcessor } from './processor'
import { initializeRegistry } from './registry'

const POLL_INTERVAL_MS = 1000

async function main(): Promise<void> {
  console.log('========================================')
  console.log('  Orca Phase 2 Background Worker')
  console.log('  (with Retry Framework)')
  console.log('========================================')
  console.log('')

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Worker] Missing required environment variables:')
    console.error('  - SUPABASE_URL')
    console.error('  - SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  console.log('[Worker] Environment loaded')
  console.log(`[Worker] Supabase URL: ${process.env.SUPABASE_URL}`)
  console.log('')

  initializeRegistry()
  console.log('')

  const processor = new EventProcessor()

  console.log('[Worker] Starting event processing loop...')
  console.log(`[Worker] Poll interval: ${POLL_INTERVAL_MS}ms`)
  console.log('')

  while (true) {
    try {
      await processor.run()
    } catch (error) {
      console.error('[Worker] Error in processing cycle:', error)
    }

    await sleep(POLL_INTERVAL_MS)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(error => {
  console.error('[Worker] Fatal error:', error)
  process.exit(1)
})
