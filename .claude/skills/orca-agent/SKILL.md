---
name: orca-agent
description: Create and configure agent orchestration systems in Orca. Use when building agentic workflows, pipelines, or multi-agent systems.
allowed-tools: Write, Read, Glob, Grep
---

# Orca Agent Orchestration

Create and manage agentic systems within Orca.

## Agent Architecture (Planned)

Orca will support these agent types:

### 1. Task Agents
Single-purpose agents that handle specific tasks:
- Data ingestion
- Content processing
- API integration
- Report generation

### 2. Orchestrator Agents
Coordinate multiple task agents:
- Workflow management
- Task delegation
- Error recovery
- Progress tracking

### 3. Connector Agents
Handle external integrations:
- OAuth authentication
- Data synchronization
- Webhook handling

## Agent Configuration Schema

```typescript
interface AgentConfig {
  id: string;
  name: string;
  type: 'task' | 'orchestrator' | 'connector';
  description: string;

  // Capabilities
  tools: string[];
  skills: string[];

  // Behavior
  maxRetries: number;
  timeout: number;

  // Dependencies
  requires?: string[];
  triggers?: string[];
}
```

## Creating an Agent

### 1. Define Agent Config
Create at `src/agents/configs/$ARGUMENTS.ts`:

```typescript
import { AgentConfig } from '@/types/agents';

export const ${camelCase}Agent: AgentConfig = {
  id: '$ARGUMENTS',
  name: '$ARGUMENTS Agent',
  type: 'task',
  description: 'Handles $ARGUMENTS tasks',
  tools: ['read', 'write', 'api'],
  skills: [],
  maxRetries: 3,
  timeout: 30000,
};
```

### 2. Implement Agent Logic
Create at `src/agents/handlers/$ARGUMENTS.ts`:

```typescript
import { AgentContext, AgentResult } from '@/types/agents';

export async function handle${PascalCase}(
  context: AgentContext
): Promise<AgentResult> {
  try {
    // Agent logic here
    return {
      success: true,
      data: {},
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### 3. Register Agent
Add to `src/agents/registry.ts`

## Workflow Definition

```typescript
interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  agentId: string;
  input: Record<string, unknown>;
  onSuccess?: string; // Next step ID
  onFailure?: string; // Fallback step ID
}
```

## Best Practices

1. **Single Responsibility**: Each agent should do one thing well
2. **Idempotent Operations**: Agents should be safe to retry
3. **Clear Interfaces**: Define input/output contracts
4. **Error Handling**: Always return structured results
5. **Logging**: Log important operations for debugging
6. **Timeouts**: Set reasonable timeouts to prevent hangs
