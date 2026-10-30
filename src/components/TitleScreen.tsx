import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ActiveScreen } from '../types/game';

interface TitleScreenProps {
  onStartGame: () => void;
  onNavigate: (screen: ActiveScreen) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onNavigate,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 md:p-10">
      {/* Top Perimeter Action Row */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-300 tabular-nums">
          <span>VIT Campus Map</span>
          <span className="mx-2 text-slate-600" aria-hidden="true">·</span>
          <span>Player: Maddy</span>
          <span className="mx-2 text-slate-600" aria-hidden="true">·</span>
          <span>9 Live DSA Implementations</span>
        </div>

        <button
          onClick={onToggleMute}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-950/90 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          <span>{isMuted ? 'Sound Off' : 'Sound On'}</span>
        </button>
      </div>

      {/* Center-Left Hero Lockup leaving ~40% of live panning campus open */}
      <div className="max-w-xl bg-slate-950/92 border border-slate-800 rounded-2xl p-7 md:p-9 shadow-2xl pointer-events-auto">
        {/* Bespoke Inline SVG Title Lockup */}
        <div className="mb-4">
          <svg
            viewBox="0 0 460 76"
            className="w-full max-w-md h-auto"
            role="img"
            aria-label="Campus Escape – VIT Edition starring Maddy"
          >
            {/* Mini Graph Emblem */}
            <g transform="translate(6, 10)">
              <line x1="12" y1="42" x2="34" y2="14" stroke="#F59E0B" strokeWidth="3" />
              <line x1="34" y1="14" x2="58" y2="38" stroke="#38BDF8" strokeWidth="3" />
              <line x1="12" y1="42" x2="58" y2="38" stroke="#64748B" strokeWidth="2" strokeDasharray="4 3" />
              <circle cx="12" cy="42" r="7" fill="#EA580C" stroke="#FFFBEB" strokeWidth="2" />
              <circle cx="34" cy="14" r="7" fill="#F59E0B" stroke="#FFFBEB" strokeWidth="2" />
              <circle cx="58" cy="38" r="7" fill="#0EA5E9" stroke="#FFFBEB" strokeWidth="2" />
            </g>
            <text
              x="82"
              y="40"
              fill="#F8FAFC"
              fontFamily="Outfit, sans-serif"
              fontWeight="700"
              fontSize="36"
              letterSpacing="-0.5"
            >
              Campus Escape · VIT
            </text>
            <text
              x="84"
              y="62"
              fill="#FBBF24"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="600"
              fontSize="14.5"
              letterSpacing="0.2"
            >
              Starring Maddy · A DSA-Based VIT Adventure
            </text>
          </svg>
        </div>

        <p className="text-sm md:text-base text-slate-300 leading-relaxed mb-6">
          Guide <strong className="text-white">Maddy</strong> across the interactive 2D <strong className="text-amber-300">VIT Campus</strong> — from MH Hostel through the VIT Subway, Foodys, Technology Tower (TT), SJT, and Periyar Library to VIT Main Gate using real DSA algorithms.
        </p>

        {/* Primary CTA + Secondary Screens */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={onStartGame}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-md"
          >
            Start Game (Enter)
          </button>

          <button
            onClick={() => onNavigate('HOW_TO_PLAY')}
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 font-medium text-sm rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            How to Play
          </button>

          <button
            onClick={() => onNavigate('MAP_DIJKSTRA')}
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 font-medium text-sm rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Dijkstra Visualizer
          </button>
        </div>

        {/* Clean Text Links for Review & Viva Screens */}
        <div className="pt-4 border-t border-slate-800/90 flex flex-wrap items-center gap-6 text-xs font-medium text-slate-300">
          <button
            onClick={() => onNavigate('DSA_CONCEPTS')}
            className="hover:text-amber-400 underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            DSA Concepts, Code & Viva Q&A
          </button>
          <button
            onClick={() => onNavigate('LEADERBOARD')}
            className="hover:text-amber-400 underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Leaderboard (Heap & Sorting)
          </button>
          <button
            onClick={() => onNavigate('GOOGLE_DRIVE')}
            className="text-sky-400 hover:text-sky-300 underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Share Link &amp; Google Drive Sync
          </button>
        </div>
      </div>

      {/* Single Flat Control-Hint Line */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-lg px-4 py-2.5 self-start text-xs text-slate-300 font-mono tabular-nums pointer-events-auto">
        WASD / Arrows Move · Space Interact · Z Undo (Stack) · M Map & Dijkstra · I Inventory · Esc Pause
      </div>
    </div>
  );
};
