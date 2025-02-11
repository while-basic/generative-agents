import { Agent } from "generative-agents";

interface Interaction {
  id: string;
  initiatorId: string;
  targetId: string;
  type: 'conversation' | 'observation' | 'rumor';
  content: string;
  timestamp: number;
}

interface Memory {
  agentId: string;
  content: string;
  timestamp: number;
  source: string;
  type: 'direct' | 'observed' | 'rumor';
  reliability: number; // 0-1, how reliable the information is
}

class InteractionService {
  private interactions: Interaction[] = [];
  private memories: Map<string, Memory[]> = new Map();
  private proximityThreshold = 100; // pixels distance for interaction

  constructor() {
    this.interactions = [];
    this.memories = new Map();
  }

  private async generateConversation(initiator: Agent, target: Agent): Promise<string> {
    const context = `
      ${initiator.name}'s background: ${initiator.personality.background}
      ${initiator.name}'s current goal: ${initiator.personality.currentGoal}
      ${target.name}'s background: ${target.personality.background}
      ${target.name}'s current goal: ${target.personality.currentGoal}
    `;

    const message = `You are having a conversation with ${target.name}. Generate a very brief, natural conversation (1-2 sentences each) considering both of your backgrounds and goals. Keep it concise and casual.`;

    try {
      const response = await initiator.engine.reply(message, initiator, context);
      return response || "Failed to generate conversation";
    } catch (error) {
      console.error("Error generating conversation:", error);
      return "Failed to generate conversation";
    }
  }

  private async generateRumor(agent: Agent, knownFacts: Memory[]): Promise<string> {
    const relevantFacts = knownFacts
      .filter(m => m.timestamp > Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      .map(m => m.content)
      .join("\n");

    const context = `
      Your personality traits: ${agent.personality.innateTendency.join(", ")}
      Recent events and information you know about:
      ${relevantFacts}
    `;

    const message = "Share a brief, interesting rumor or piece of gossip (1-2 sentences) based on what you know.";

    try {
      const response = await agent.engine.reply(message, agent, context);
      return response || "Failed to generate rumor";
    } catch (error) {
      console.error("Error generating rumor:", error);
      return "Failed to generate rumor";
    }
  }

  public async createInteraction(initiator: Agent, target: Agent, type: 'conversation' | 'observation' | 'rumor'): Promise<Interaction | null> {
    let content = '';
    
    switch (type) {
      case 'conversation':
        content = await this.generateConversation(initiator, target);
        break;
      case 'rumor':
        const knownFacts = this.memories.get(initiator.id) || [];
        content = await this.generateRumor(initiator, knownFacts);
        break;
      case 'observation':
        content = `${initiator.name} observed ${target.name} ${target.personality.currentGoal || 'doing something'}`;
        break;
    }

    const interaction: Interaction = {
      id: Math.random().toString(36).slice(2, 9),
      initiatorId: initiator.id,
      targetId: target.id,
      type,
      content,
      timestamp: Date.now()
    };

    this.interactions.push(interaction);
    this.recordMemory(initiator.id, content, 'direct', target.id);
    this.recordMemory(target.id, content, type === 'rumor' ? 'rumor' : 'direct', initiator.id);

    // Notify both agents of the interaction
    await initiator.observe(content);
    await target.observe(content);

    return interaction;
  }

  public recordMemory(agentId: string, content: string, type: Memory['type'], source: string) {
    const memory: Memory = {
      agentId,
      content,
      timestamp: Date.now(),
      source,
      type,
      reliability: type === 'direct' ? 1 : type === 'observed' ? 0.8 : 0.5
    };

    if (!this.memories.has(agentId)) {
      this.memories.set(agentId, []);
    }
    this.memories.get(agentId)?.push(memory);
  }

  public getAgentMemories(agentId: string): Memory[] {
    return this.memories.get(agentId) || [];
  }

  public getRecentInteractions(limit = 10): Interaction[] {
    return this.interactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  public canInteract(agent1: { x: number; y: number }, agent2: { x: number; y: number }): boolean {
    const distance = Math.sqrt(
      Math.pow(agent1.x - agent2.x, 2) + Math.pow(agent1.y - agent2.y, 2)
    );
    return distance <= this.proximityThreshold;
  }
}

export const interactionService = new InteractionService();
