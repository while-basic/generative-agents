export interface AgentDetails {
  id: string;
  name: string;
  age: number;
  currentLocation: string;
  visualRange: number;
  attention: number;
  retention: number;
  background: string;
  currentGoal: string;
  lifestyle: string;
  innateTendencies: string[];
  learnedTendencies: string[];
  values: string[];
  emoji?: string;
}

export interface AgentState extends AgentDetails {
  isEditing: boolean;
}
