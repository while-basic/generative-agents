import React, { useRef, useState } from "react";
import PhaserGame from "./phaserGame";
import { Agent, AgentEngine, buildSpatialWorld } from "generative-agents";

import { agentsData } from "./data/agents";
import AgentDisplay from "./AgentDisplay";
import { locations } from "./data/world";
import AgentChat from "./AgentChat";
import NotificationModal from "./NotificationModal";
import Header from "./Header";
import { AgentDetails } from "./types/Agent";
import AgentLogger from "./components/AgentLogger";

interface Props {
  openaiKey: string;
}

function Game(props: Props) {
  const { openaiKey } = props;
  const [showNotification, setShowNotification] = useState(true);
  const [showLogger, setShowLogger] = useState(false);

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  const engine = useRef(new AgentEngine(openaiKey)).current;

  const world = buildSpatialWorld(locations);

  const agents: Agent[] = useRef(
    agentsData.map(
      (agent) =>
        new Agent(
          engine,
          agent.id,
          agent.name,
          agent.age,
          { ...agent },
          undefined,
          world,
          agent.startLocation
        )
    )
  ).current;

  // Convert agent data to AgentDetails format
  const agentDetailsMap = useRef(
    agentsData.reduce((acc, agent) => {
      acc[agent.id] = {
        id: agent.id,
        name: agent.name,
        age: agent.age,
        currentLocation: agent.startLocation,
        visualRange: 8,
        attention: 8,
        retention: 8,
        background: agent.background,
        currentGoal: agent.currentGoal,
        lifestyle: agent.lifestyle,
        innateTendencies: agent.innateTendency,
        learnedTendencies: agent.learnedTendency,
        values: agent.values,
        emoji: getAgentEmoji(agent.id) // Function to get appropriate emoji for each agent
      };
      return acc;
    }, {} as Record<string, AgentDetails>)
  ).current;

  // Helper function to get appropriate emoji for each agent
  function getAgentEmoji(agentId: string): string {
    const emojiMap: Record<string, string> = {
      thomas_miller: "👨‍🍳",
      susan_miller: "👩‍🍳",
      lucy_miller: "🥙",
      michael_miller: "🎮",
      james_johnson: "☕",
      linda_johnson: "🎨"
    };
    return emojiMap[agentId] || "👤";
  }

  const [selectedAgentIndex, setSelectedAgentIndex] = useState(0);
  const [showChat, setShowChat] = useState(false);

  const nextAgent = () => {
    setSelectedAgentIndex((prevIndex) => (prevIndex + 1) % agents.length);
  };

  const prevAgent = () => {
    setSelectedAgentIndex(
      (prevIndex) => (prevIndex - 1 + agents.length) % agents.length
    );
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <Header />
        <div className='mt-8 mb-6'>
          <AgentDisplay agent={agents[selectedAgentIndex]} />
        </div>
        
        {showNotification && (
          <NotificationModal
            message='OpenAI APIs can be momentarily slow or out of service. Please be patient and try again later. We are using cached plans for all agents.'
            onClose={handleCloseNotification}
          />
        )}
        
        {showChat && (
          <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center'>
            <AgentChat
              agent={agents[selectedAgentIndex]}
              initialAgentDetails={agentDetailsMap[agents[selectedAgentIndex].id]}
              closeChat={() => setShowChat(false)}
            />
          </div>
        )}

        <AgentLogger visible={showLogger} onClose={() => setShowLogger(false)} />
        
        <div className='flex items-center justify-between mb-6 flex-wrap gap-4'>
          <div className='flex space-x-4'>
            <button
              onClick={prevAgent}
              className='bg-black text-white font-bold py-2.5 px-5 rounded-lg hover:bg-gray-800 transition duration-300'
            >
              &lt; Previous
            </button>
            <button
              onClick={nextAgent}
              className='bg-black text-white font-bold py-2.5 px-5 rounded-lg hover:bg-gray-800 transition duration-300'
            >
              Next &gt;
            </button>
          </div>
          <div className='flex space-x-4'>
            <button
              onClick={() => setShowLogger(prev => !prev)}
              className='bg-[#f8d7af] text-[#5F472B] font-medium rounded-lg py-2.5 px-5 hover:bg-[#f9dcb7] transition duration-300'
            >
              {showLogger ? 'Hide Activity Log' : 'Show Activity Log'}
            </button>
            <button
              onClick={() => setShowChat((prev) => !prev)}
              className='bg-[#f8d7af] text-[#5F472B] font-medium rounded-lg py-2.5 px-5 hover:bg-[#f9dcb7] transition duration-300'
            >
              Chat with Agent
            </button>
          </div>
        </div>
        
        <div className='rounded-lg overflow-hidden shadow-lg'>
          <PhaserGame agents={agents} />
        </div>
      </div>
    </div>
  );
}

export default Game;
