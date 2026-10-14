import React from 'react';
import {
  Search, LogIn, LogOut, Loader2,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  Minimize2, Activity, Radio, Globe, Ticket, History, PiggyBank, GraduationCap, Settings, Network
} from 'lucide-react';
import { Sport, View } from '../../types';

interface HeaderProps {
  sport: Sport;
  setSport: (sport: Sport) => void;
  homeQuery: string;
  setHomeQuery: (query: string) => void;
  awayQuery: string;
  setAwayQuery: (query: string) => void;
  isAnalyzing: boolean;
  handleAnalyze: () => void;
  user: any;
  handleLogin: () => void;
  handleLogout: () => void;
  view: View;
  setView: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({
  sport, setSport, homeQuery, setHomeQuery, awayQuery, setAwayQuery,
  isAnalyzing, handleAnalyze, user, handleLogin, handleLogout,
  view, setView
}) => {
  const menuItems = [
    { id: 'analyze', icon: Activity, label: 'Analyse' },
    { id: 'live', icon: Radio, label: 'Live' },
    { id: 'explorer', icon: Globe, label: 'Explorer' },
    { id: 'coupon', icon: Ticket, label: 'Coupon' },
    { id: 'history', icon: History, label: 'Historique' },
    { id: 'bankroll', icon: PiggyBank, label: 'Bankroll' },
    { id: 'course', icon: GraduationCap, label: 'Formation' },
    { id: 'firecrawl', icon: Network, label: 'Firecrawl' },
    { id: 'settings', icon: Settings, label: 'Réglages' },
  ];

  return (
    <div className="bg-[#16191E]/80 backdrop-blur-xl border-b border-white/5 p-2 sticky top-0 z-40">
      <div className="max-w-[98%] mx-auto flex flex-col md:flex-row gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <Activity className="w-5 h-5 text-black" />
          </div>

          <div className="flex bg-black/40 p-0.5 rounded-xl border border-white/5">
            <button
              onClick={() => setSport('football')}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${sport === 'football' ? 'bg-orange-500 text-black' : 'text-white/40 hover:text-white'}`}
            >
              Foot
            </button>
            <button
              onClick={() => setSport('basketball')}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${sport === 'basketball' ? 'bg-orange-500 text-black' : 'text-white/40 hover:text-white'}`}
            >
              Basket
            </button>
          </div>

          <div className="h-6 w-px bg-white/10 mx-1 hidden lg:block" />

          {/* Horizontal Menu */}
          <nav className="hidden xl:flex items-center gap-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id as View)}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all group ${
                  view === item.id
                    ? 'bg-orange-500/10 text-orange-500'
                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className={`w-3.5 h-3.5 ${view === item.id ? 'text-orange-500' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center gap-2 w-full max-w-xl mx-2">
          <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/5 rounded-xl p-1 focus-within:border-orange-500/50 transition-all">
            <input
              type="text"
              placeholder="Domicile..."
              value={homeQuery}
              onChange={(e) => setHomeQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold w-full px-2 placeholder:text-white/20"
            />
            <div className="w-px h-4 bg-white/10" />
            <input
              type="text"
              placeholder="Extérieur..."
              value={awayQuery}
              onChange={(e) => setAwayQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs font-bold w-full px-2 placeholder:text-white/20"
            />
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !homeQuery || !awayQuery}
              className="bg-orange-500 text-black p-2 rounded-lg hover:bg-orange-400 disabled:opacity-50 transition-all"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/5"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/10 hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-wider border border-white/5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:block">Quitter</span>
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-orange-500 text-black hover:bg-orange-400 transition-all text-[10px] font-black uppercase tracking-wider shadow-lg shadow-orange-500/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu (below header on small screens) */}
      <nav className="xl:hidden flex items-center justify-between gap-1 mt-2 overflow-x-auto pb-1 no-scrollbar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              view === item.id
                ? 'bg-orange-500 text-black'
                : 'text-white/40 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
