import { AgentDetails } from '../types/Agent';

const STORAGE_KEY = 'generative_agents';

export const agentService = {
  getAllAgents(): Record<string, AgentDetails> {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  },

  getAgent(id: string): AgentDetails | null {
    const agents = this.getAllAgents();
    return agents[id] || null;
  },

  saveAgent(agent: AgentDetails): void {
    const agents = this.getAllAgents();
    agents[agent.id] = agent;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  },

  deleteAgent(id: string): void {
    const agents = this.getAllAgents();
    delete agents[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  },

  // Initialize with default agent if none exists
  initializeDefaultAgent(defaultAgent: AgentDetails): void {
    const agents = this.getAllAgents();
    if (!agents[defaultAgent.id]) {
      this.saveAgent(defaultAgent);
    }
  }
};
