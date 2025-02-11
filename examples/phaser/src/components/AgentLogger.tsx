import React, { useState, useEffect } from 'react';

interface LogEntry {
  timestamp: number;
  agentName: string;
  message: string;
  type: 'action' | 'movement' | 'error';
}

interface AgentLoggerProps {
  visible: boolean;
  onClose: () => void;
}

const AgentLogger: React.FC<AgentLoggerProps> = ({ visible, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    // Create a function to handle console logs
    const handleLog = (message: string, agentName = '', type: LogEntry['type'] = 'action') => {
      setLogs(prevLogs => [
        {
          timestamp: Date.now(),
          agentName,
          message,
          type,
        },
        ...prevLogs.slice(0, 99), // Keep only last 100 logs
      ]);
    };

    // Override console.log to capture agent-related logs
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      const message = args.join(' ');
      if (message.includes('Agent')) {
        const agentNameMatch = message.match(/Agent ([^is]+) is/);
        const agentName = agentNameMatch ? agentNameMatch[1].trim() : '';
        handleLog(message, agentName);
      }
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  const filteredLogs = logs.filter(log => 
    !filter || 
    log.agentName.toLowerCase().includes(filter.toLowerCase()) ||
    log.message.toLowerCase().includes(filter.toLowerCase())
  );

  if (!visible) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-lg flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-semibold">Agent Activity Log</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Filter logs..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredLogs.map((log, index) => (
          <div
            key={log.timestamp + index}
            className="mb-3 p-2 bg-gray-50 rounded-lg text-sm"
          >
            <div className="flex justify-between text-gray-500 text-xs mb-1">
              <span>{log.agentName}</span>
              <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="text-gray-800">{log.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentLogger;
