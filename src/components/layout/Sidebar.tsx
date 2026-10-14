import React from 'react';
import {
  Activity, History, PiggyBank, Settings,
  Ticket, Radio, Globe, GraduationCap,
  ChevronLeft, ChevronRight, Network
} from 'lucide-react';
import { View } from '../../types';

interface SidebarProps {
  view: View;
  setView: (view: View) => void;
  isAuthReady: boolean;
  user: any;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  view, setView, isAuthReady, user, isCollapsed, setIsCollapsed
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
    <div className={`bg-[#0D0F12] border-r border-white/5 flex flex-col h-screen sticky top-0 shrink-0 z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-20 lg:w-64'}`}>
      <div className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Activity className="w-6 h-6 text-black" />
          </div>
          {!isCollapsed && (
            <div className="hidden lg:block">
              <h1 className="text-xl font-black tracking-tighter uppercase">PredictMaster</h1>
              <p className="text-xs text-white/40 font-bold tracking-widest uppercase">Expert AI 2026</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            title={isCollapsed ? item.label : ''}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${
              view === item.id
                ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20'
                : 'text-white/40 hover:bg-white/5 hover:text-white'
            } ${isCollapsed ? 'justify-center' : ''}`}
          >
            <item.icon className={`w-6 h-6 shrink-0 ${view === item.id ? 'text-black' : 'group-hover:scale-110 transition-transform'}`} />
            {!isCollapsed && <span className="hidden lg:block font-black uppercase tracking-widest text-xs">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        {isAuthReady && user && (
          <div className={`flex items-center gap-3 p-2 rounded-2xl bg-white/5 ${isCollapsed ? 'justify-center' : ''}`}>
            <img
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
              alt="Profile"
              className="w-10 h-10 rounded-xl border border-white/10"
            />
            {!isCollapsed && (
              <div className="hidden lg:block overflow-hidden">
                <p className="text-xs font-black truncate uppercase">{user.displayName}</p>
                <p className="text-[10px] text-white/40 truncate font-bold">Connecté</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
