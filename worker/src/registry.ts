import type { Agent } from './types'
import { CrmLeadAgent } from './agents/crm/lead-agent'
import { CrmConnectorAgent } from './agents/crm/connector-agent'
import { EmailBroadcastAgent } from './agents/email/email-agent'

const agents: Agent[] = []

export function registerAgent(agent: Agent): void {
  agents.push(agent)
  console.log(`[Registry] Registered agent: ${agent.name}`)
}

export function getAgentsForEvent(eventType: string): Agent[] {
  console.log(`[Registry] Looking for agents for event: ${eventType}`)
  console.log(`[Registry] Total agents registered: ${agents.length}`)
  const matched = agents.filter(agent => agent.subscribe().includes(eventType))
  console.log(`[Registry] Matched agents: ${matched.map(a => a.name).join(', ') || 'NONE'}`)
  return matched
}

export function initializeRegistry(): void {
  console.log('[Registry] Initializing agent registry...')
  registerAgent(new CrmLeadAgent())
  registerAgent(new CrmConnectorAgent())
  registerAgent(new EmailBroadcastAgent())
  console.log(`[Registry] ${agents.length} agent(s) registered`)
}
