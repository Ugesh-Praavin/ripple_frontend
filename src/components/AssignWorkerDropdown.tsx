import React, { useState } from 'react';

type AssignWorkerDropdownProps = {
  reportId: string;
  onAssign: (reportId: string, workerName: string) => Promise<void>;
  loading?: boolean;
};

const MOCK_WORKERS = ['Worker A', 'Worker B', 'Worker C'];

export default function AssignWorkerDropdown({
  reportId,
  onAssign,
  loading = false,
}: AssignWorkerDropdownProps) {
  const [selectedWorker, setSelectedWorker] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleAssign = async () => {
    if (!selectedWorker) return;
    await onAssign(reportId, selectedWorker);
    setSelectedWorker('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <select
          value={selectedWorker}
          onChange={(e) => setSelectedWorker(e.target.value)}
          disabled={loading}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
        >
          <option value="">Select Worker</option>
          {MOCK_WORKERS.map((worker) => (
            <option key={worker} value={worker}>
              {worker}
            </option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={loading || !selectedWorker}
          className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Assigning...' : 'Assign'}
        </button>
      </div>
    </div>
  );
}

