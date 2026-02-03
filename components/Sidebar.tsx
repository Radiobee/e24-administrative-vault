import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, Database, ShieldCheck, Zap, Bot, Cloud, Layers, Book, Hexagon } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navItems = [
    { view: ViewState.DASHBOARD, label: 'E24 Lattice Control', icon: LayoutDashboard },
    { view: ViewState.INGESTION, label: 'Golay Ingestion', icon: Layers },
    { view: ViewState.BFO_ENGINE, label: 'BFO Engine', icon: Database },
    { view: ViewState.DRIVE_SCANNER, label: 'Drive Scanner', icon: Cloud },
    { view: ViewState.VAULT, label: 'Leech Vault', icon: Hexagon },
    { view: ViewState.STRIKE_CONSOLE, label: 'Strike Console', icon: Zap },
    { view: ViewState.CO_FIDUCIARY, label: 'E24 Architect (AI)', icon: Bot },
  ];

  return (
    <div className="w-64 h-screen bg-e24-lattice/30 border-r border-e24-border flex flex-col shrink-0 backdrop-blur-md relative z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="p-6 border-b border-e24-border bg-e24-void/50">
        <h1 className="text-xl font-bold font-mono tracking-tighter text-white flex items-center gap-2">
          <Hexagon className="text-e24-node" size={24} />
          <span><span className="text-e24-node">E24</span> Admin Vault</span>
        </h1>
        <p className="text-[10px] text-e24-flux/70 mt-1 uppercase tracking-[0.2em] font-medium pl-8">Unified Fiduciary OS</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ease-out group relative overflow-hidden ${
              currentView === item.view
                ? 'text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] border border-e24-node/40'
                : 'text-gray-400 hover:text-white border border-transparent hover:bg-white/5'
            }`}
          >
            {/* Active Background "Gel" */}
            {currentView === item.view && (
                <div className="absolute inset-0 bg-e24-node/20 backdrop-blur-sm -z-10 animate-genie"></div>
            )}
            
            {/* Active Indicator Bar */}
            {currentView === item.view && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-e24-node shadow-[0_0_10px_#a855f7]"></div>
            )}

            <item.icon size={18} className={`transition-transform duration-300 ${currentView === item.view ? 'text-e24-node scale-110' : 'text-gray-500 group-hover:text-white group-hover:scale-105 group-hover:rotate-6'}`} />
            <span className="relative z-10">{item.label}</span>
          </button>
        ))}

        <div className="pt-4 mt-4 border-t border-e24-border/50">
             <button
                onClick={() => setView(ViewState.DOCUMENTATION)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 group border border-transparent ${
                currentView === ViewState.DOCUMENTATION
                    ? 'bg-e24-node/10 text-e24-node border-e24-node/20'
                    : 'text-gray-500 hover:bg-e24-border/30 hover:text-white hover:border-e24-border'
                }`}
            >
                <Book size={18} className="group-hover:text-e24-flux transition-colors" />
                Lattice Manifest
            </button>
        </div>
      </nav>

      <div className="p-4 border-t border-e24-border bg-e24-void/30">
        <div className="flex flex-col gap-2 text-xs font-mono bg-black/40 p-3 rounded border border-e24-border/50">
          <div className="flex items-center gap-2 text-e24-success">
             <div className="relative">
                 <div className="w-2 h-2 rounded-full bg-e24-success"></div>
                 <div className="absolute inset-0 w-2 h-2 rounded-full bg-e24-success animate-ping opacity-75"></div>
             </div>
             CRYSTAL STABLE
          </div>
          <span className="text-[10px] text-gray-500 border-t border-gray-800 pt-1 mt-1 block">
             CORE FROZEN (v1.0.0)
          </span>
        </div>
      </div>
    </div>
  );
};