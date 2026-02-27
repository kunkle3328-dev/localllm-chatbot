
import React from 'react';
import { MemoryEntry } from '../../types';
import { TrashIcon, PlusIcon } from '../../components/Icons';

interface MemoryPanelProps {
  memories: MemoryEntry[];
  onPin: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({ memories, onPin, onDelete, onClose }) => {
  return (
    <div className="flex flex-col h-full bg-[#0d0d14] p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <h2 className="text-sm font-black text-white uppercase tracking-tight italic">Cognitive Memory Vault</h2>
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Learned Identity Data</span>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-white text-xl font-bold">×</button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
        {memories.length === 0 ? (
          <div className="py-10 text-center text-slate-600 italic text-[10px] font-bold">
            No active cognitive nodes found. Engine is currently cold.
          </div>
        ) : (
          memories.map((m) => (
            <div key={m.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                  m.type === 'preference' ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'
                }`}>
                  {m.type}
                </span>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onPin(m.id)} 
                    className={`transition-colors ${m.isPinned ? 'text-indigo-400' : 'text-slate-600 hover:text-indigo-400'}`}
                  >
                    <span className="text-xs">📌</span>
                  </button>
                  <button 
                    onClick={() => onDelete(m.id)} 
                    className="text-slate-600 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] font-medium leading-relaxed text-slate-300">
                {m.text}
              </p>
              <div className="text-[7px] font-black text-slate-600 uppercase tracking-tighter">
                Recorded {new Date(m.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="p-3 bg-indigo-600/5 rounded-xl border border-indigo-500/10">
          <p className="text-[10px] font-bold text-slate-400 italic leading-relaxed">
            NeuralPulse memories are stored locally in your SQLite vault. No data leaves this device.
          </p>
        </div>
      </div>
    </div>
  );
};
