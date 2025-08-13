import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import api from '../services/api';

interface State {
  code: string;
  name: string;
  tax_rate: string;
}

interface StateSelectorProps {
  onStateSelect: (stateCode: string) => void;
  selectedState?: string;
  label?: string;
  className?: string;
}

export function StateSelector({ onStateSelect, selectedState, label = "Select your state", className = "" }: StateSelectorProps) {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await api.get('/api/payment/states/');
        setStates(response.data);
      } catch (err) {
        console.error('Failed to fetch states:', err);
        setError('Failed to load states');
      } finally {
        setLoading(false);
      }
    };

    fetchStates();
  }, []);

  const handleStateChange = (value: string) => {
    onStateSelect(value);
  };

  return (
    <div className={className}>
      <Label htmlFor="state-select">{label}</Label>
      <Select 
        value={selectedState} 
        onValueChange={handleStateChange}
        disabled={loading}
      >
        <SelectTrigger id="state-select" className="w-full">
          <SelectValue placeholder={loading ? "Loading states..." : "Select a state"} />
        </SelectTrigger>
        <SelectContent>
          {error ? (
            <SelectItem value="error" disabled>{error}</SelectItem>
          ) : (
            states.map((state) => (
              <SelectItem key={state.code} value={state.code}>
                {state.name} 
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}

export default StateSelector;