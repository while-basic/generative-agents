import React, { useState, useEffect } from 'react';
import { AgentDetails } from '../types/Agent';
import { Edit2, Save, X, AlertCircle } from 'lucide-react';

interface AgentEditorProps {
  agent: AgentDetails;
  onSave: (updatedAgent: AgentDetails) => void;
  onCancel: () => void;
  isEditing: boolean;
  onEditToggle: () => void;
}

const AgentEditor: React.FC<AgentEditorProps> = ({
  agent,
  onSave,
  onCancel,
  isEditing,
  onEditToggle,
}) => {
  const [editedAgent, setEditedAgent] = useState<AgentDetails>(agent);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setEditedAgent(agent);
    setHasChanges(false);
    setValidationErrors({});
  }, [agent, isEditing]);

  const validateField = (field: keyof AgentDetails, value: string | number | string[] | undefined): string => {
    if (value === undefined) {
      return `${field} is required`;
    }

    switch (field) {
      case 'id':
      case 'name':
      case 'currentLocation':
      case 'background':
      case 'currentGoal':
      case 'lifestyle':
      case 'emoji':
        return typeof value === 'string' && value.trim() === '' ? `${field} is required` : '';
      case 'age':
        return typeof value === 'number' && (value < 0 || !Number.isInteger(value)) 
          ? 'Age must be a positive integer' 
          : '';
      case 'visualRange':
      case 'attention':
      case 'retention':
        return typeof value === 'number' && (value < 0 || value > 10) 
          ? 'Value must be between 0 and 10' 
          : '';
      case 'innateTendencies':
      case 'learnedTendencies':
      case 'values':
        return Array.isArray(value) && value.length === 0 
          ? `At least one ${field} is required` 
          : '';
      default:
        return '';
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof AgentDetails
  ) => {
    const value = e.target.value;
    let newValue: string | number = value;

    // Convert to number for numeric fields
    if (field === 'age' || field === 'visualRange' || field === 'attention' || field === 'retention') {
      newValue = value === '' ? 0 : Number(value);
    }

    const error = validateField(field, newValue);
    
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));

    setEditedAgent(prev => ({
      ...prev,
      [field]: newValue
    }));
    setHasChanges(true);
  };

  const handleArrayInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof AgentDetails
  ) => {
    const value = e.target.value.split(',').map((item) => item.trim()).filter(Boolean);
    const error = validateField(field, value);

    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));

    setEditedAgent(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Validate all fields
    const errors: Record<string, string> = {};
    (Object.keys(editedAgent) as Array<keyof AgentDetails>).forEach((key) => {
      const error = validateField(key, editedAgent[key]);
      if (error) {
        errors[key] = error;
      }
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    onSave(editedAgent);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setEditedAgent(agent);
    setHasChanges(false);
    setValidationErrors({});
    onCancel();
  };

  if (!isEditing) {
    return (
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {agent.emoji} {agent.name}
          </h2>
          <button
            onClick={onEditToggle}
            className="text-gray-500 hover:text-gray-700"
          >
            <Edit2 size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">ID</p>
            <p>{agent.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Age</p>
            <p>{agent.age}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Current Location</p>
            <p>{agent.currentLocation}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Visual Range</p>
              <p>{agent.visualRange}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Attention</p>
              <p>{agent.attention}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Retention</p>
              <p>{agent.retention}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Background</p>
            <p className="whitespace-pre-wrap">{agent.background}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Current Goal</p>
            <p>{agent.currentGoal}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Lifestyle</p>
            <p>{agent.lifestyle}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Innate Tendencies</p>
            <p>{agent.innateTendencies.join(', ')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Learned Tendencies</p>
            <p>{agent.learnedTendencies.join(', ')}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Values</p>
            <p>{agent.values.join(', ')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Edit Agent Details</h2>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className={`text-green-500 hover:text-green-700 ${
              !hasChanges || Object.keys(validationErrors).length > 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
            disabled={!hasChanges || Object.keys(validationErrors).length > 0}
          >
            <Save size={18} />
          </button>
          <button
            onClick={handleCancel}
            className="text-red-500 hover:text-red-700"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Show validation errors summary if any */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertCircle size={16} />
            <span className="font-medium">Please fix the following errors:</span>
          </div>
          <ul className="list-disc list-inside text-sm text-red-600">
            {Object.entries(validationErrors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-500">Emoji</label>
            <input
              type="text"
              value={editedAgent.emoji}
              onChange={(e) => handleInputChange(e, 'emoji')}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500">ID</label>
            <input
              type="text"
              value={editedAgent.id}
              onChange={(e) => handleInputChange(e, 'id')}
              className="w-full border rounded p-2"
            />
            {validationErrors.id && (
              <p className="text-sm text-red-600">{validationErrors.id}</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-500">Name</label>
          <input
            type="text"
            value={editedAgent.name}
            onChange={(e) => handleInputChange(e, 'name')}
            className="w-full border rounded p-2"
          />
          {validationErrors.name && (
            <p className="text-sm text-red-600">{validationErrors.name}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-500">Age</label>
            <input
              type="number"
              value={editedAgent.age}
              onChange={(e) => handleInputChange(e, 'age')}
              className="w-full border rounded p-2"
            />
            {validationErrors.age && (
              <p className="text-sm text-red-600">{validationErrors.age}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-500">Current Location</label>
            <input
              type="text"
              value={editedAgent.currentLocation}
              onChange={(e) => handleInputChange(e, 'currentLocation')}
              className="w-full border rounded p-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-500">Visual Range</label>
            <input
              type="number"
              value={editedAgent.visualRange}
              onChange={(e) => handleInputChange(e, 'visualRange')}
              className="w-full border rounded p-2"
            />
            {validationErrors.visualRange && (
              <p className="text-sm text-red-600">{validationErrors.visualRange}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-500">Attention</label>
            <input
              type="number"
              value={editedAgent.attention}
              onChange={(e) => handleInputChange(e, 'attention')}
              className="w-full border rounded p-2"
            />
            {validationErrors.attention && (
              <p className="text-sm text-red-600">{validationErrors.attention}</p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-500">Retention</label>
            <input
              type="number"
              value={editedAgent.retention}
              onChange={(e) => handleInputChange(e, 'retention')}
              className="w-full border rounded p-2"
            />
            {validationErrors.retention && (
              <p className="text-sm text-red-600">{validationErrors.retention}</p>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-500">Background</label>
          <textarea
            value={editedAgent.background}
            onChange={(e) => handleInputChange(e, 'background')}
            className="w-full border rounded p-2 h-24"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500">Current Goal</label>
          <input
            type="text"
            value={editedAgent.currentGoal}
            onChange={(e) => handleInputChange(e, 'currentGoal')}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500">Lifestyle</label>
          <input
            type="text"
            value={editedAgent.lifestyle}
            onChange={(e) => handleInputChange(e, 'lifestyle')}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500">
            Innate Tendencies (comma-separated)
          </label>
          <input
            type="text"
            value={editedAgent.innateTendencies.join(', ')}
            onChange={(e) => handleArrayInputChange(e, 'innateTendencies')}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500">
            Learned Tendencies (comma-separated)
          </label>
          <input
            type="text"
            value={editedAgent.learnedTendencies.join(', ')}
            onChange={(e) => handleArrayInputChange(e, 'learnedTendencies')}
            className="w-full border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-500">
            Values (comma-separated)
          </label>
          <input
            type="text"
            value={editedAgent.values.join(', ')}
            onChange={(e) => handleArrayInputChange(e, 'values')}
            className="w-full border rounded p-2"
          />
        </div>
      </div>
    </div>
  );
};

export default AgentEditor;
