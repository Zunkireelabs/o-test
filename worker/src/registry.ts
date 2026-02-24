import type { Agent } from './types'
import { CrmLeadAgent } from './agents/crm/lead-agent'
import { EmailBroadcastAgent } from './agents/email/email-agent'

const agents: Agent[] = []

export function registerAgent(agent: Agent): void {
  agents.push(agent)
  console.log(`[Registry] Registered agent: ${agent.name}`)
}

export function getAgentsForEvent(eventType: string): Agent[] {
  return agents.filter(agent => agent.subscribe().includes(eventType))
}

export function initializeRegistry(): void {
  console.log('[Registry] Initializing agent registry...')
  registerAgent(new CrmLeadAgent())
  registerAgent(new EmailBroadcastAgent())
  console.log(`[Registry] ${agents.length} agent(s) registered`)
}
