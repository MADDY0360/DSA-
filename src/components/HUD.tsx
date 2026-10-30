import React from 'react';
import {
  BookOpen,
  Compass,
  ListChecks,
  Music,
  Package,
  Pause,
  Radar,
  RotateCcw,
  Route,
  Search,
  Share2,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { BUILDING_NAMES } from '../data/campusData';
import { ActiveScreen, CampusNodeId, Mission } from '../types/game';

interface HUDProps {
  currentLevel: 1 | 2 | 3;
  hasIdCard: boolean;
  assignmentSubmitted: boolean;
  keyPauseRemaining: number;
  dashReady: boolean;
  health: number;
  score: number;
  elapsedSec: number;
  currentLocation: CampusNodeId | null;
  currentMission: Mission | undefined;
  completedCount: number;
  totalMissions: number;
  undoCount: number;
  inventoryCount: number;
  highlightedPath: CampusNodeId[];
  highlightedPathCost: number | null;
  activeAlgorithmLog: string;
  showGraphWeights: boolean;
  bfsActive: boolean;
  isMuted: boolean;
  isMusicOn: boolean;
  miniMapRef: React.RefObject<HTMLCanvasElement | null>;
  onSelectLevel: (lvl: 1 | 2 | 3) => void;
  onDash: () => void;
  onUndo: () => void;
  onRunBFSNearby: () => void;
  onRunDFSScan: () => void;
  onToggleWeights: () => void;
  onClearOverlay: () => void;
  onOpenScreen: (screen: ActiveScreen) => void;
  onToggleMute: () => void;
  onToggleMusic: () => void;
}

export function formatTimeMMSS(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const HUD: React.FC<HUDProps> = ({
  currentLevel,
  hasIdCard,
  assignmentSubmitted,
  keyPauseRemaining,
  dashReady,
  health,
  score,
  elapsedSec,
  currentLocation,
  currentMission,
  completedCount,
  totalMissions,
  undoCount,
  inventoryCount,
  highlightedPath,
  highlightedPathCost,
  activeAlgorithmLog,
  showGraphWeights,
  bfsActive,
  isMuted,
  isMusicOn,
  miniMapRef,
  onSelectLevel,
  onDash,
  onUndo,
  onRunBFSNearby,
  onRunDFSScan,
  onToggleWeights,
  onClearOverlay,
  onOpenScreen,
  onToggleMute,
  onToggleMusic,
}) => {
  const healthStatus =
    health >= 70 ? 'READY' : health >= 35 ? 'TIRED' : 'LOW HP';

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3.5 md:p-5">
      {/* TOP PERIMETER BAR */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: Maddy Status + Security ID Chase State + Key 30s Pause Bar */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 shadow-lg pointer-events-auto min-w-[295px]">
          <div className="flex items-center justify-between gap-4 text-xs text-slate-300 tabular-nums mb-1.5">
            <span className="font-semibold text-white">
              <span className="text-sky-400">Maddy</span>
              <span className="mx-1.5 text-slate-600" aria-hidden="true">·</span>
              <span>{currentLocation ? BUILDING_NAMES[currentLocation] : 'VIT Avenue'}</span>
            </span>
            <span>
              Score <strong className="text-amber-400 font-mono">{score}</strong> ·{' '}
              <span className={keyPauseRemaining > 0 ? 'text-sky-400 font-semibold' : ''}>
                {formatTimeMMSS(elapsedSec)}
                {keyPauseRemaining > 0 ? ' [PAUSED]' : ''}
              </span>
            </span>
          </div>

          {/* Non-Hue-Only Health Bar */}
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="flex-1 h-2 bg-slate-800 rounded-sm overflow-hidden">
              <div
                className={`h-full transition-transform duration-150 origin-left ${
                  health >= 70
                    ? 'bg-emerald-500'
                    : health >= 35
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
                style={{ transform: `scaleX(${Math.max(0, Math.min(1, health / 100))})` }}
              />
            </div>
            <span className="text-[11px] font-mono text-slate-300 tabular-nums whitespace-nowrap shrink-0">
              HP {Math.round(health)}/100 · {healthStatus}
            </span>
          </div>

          {/* Live Security ID Status Line */}
          <div className="text-[11px] font-mono flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
            {keyPauseRemaining > 0 ? (
              <span className="text-sky-300 font-semibold tabular-nums">
                KEY PAUSE ACTIVE · {keyPauseRemaining.toFixed(1)}s Left
              </span>
            ) : hasIdCard ? (
              <span className="text-emerald-400 font-semibold">
                VIT ID VERIFIED · Security Chase Off
              </span>
            ) : (
              <span className="text-red-400 font-semibold">
                ALERT: NO ID CARD · Security Guard Chasing!
              </span>
            )}
            <span className={dashReady ? 'text-sky-400' : 'text-slate-500'}>
              {dashReady ? 'Dash [Shift] READY' : 'Dash Recharging'}
            </span>
          </div>

          {/* Assignment Completion Point (0/1 -> 1/1) & Checkpoint Status */}
          <div className="text-[11px] font-mono flex items-center justify-between gap-2 pt-1 mt-1 border-t border-slate-800/80 tabular-nums">
            {assignmentSubmitted ? (
              <span className="text-emerald-400 font-semibold">
                DA Point: 1/1 ✓ · Main Gate Finish Unlocked!
              </span>
            ) : (
              <span className="text-amber-300 font-medium">
                DA Point: 0/1 · Submit at TT before Main Gate Finish
              </span>
            )}
          </div>

          {/* 15-Second Key Time-Freeze Progress Meter */}
          {keyPauseRemaining > 0 && (
            <div className="mt-1.5 pt-1.5 border-t border-sky-900/60">
              <div className="flex items-center justify-between text-[10px] font-mono text-sky-300 tabular-nums mb-1">
                <span>KEY 15s TIME-FREEZE (Guards &amp; Clock Paused)</span>
                <span>{Math.ceil(keyPauseRemaining)}s / 15s</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-sm overflow-hidden">
                <div
                  className={`h-full origin-left transition-transform duration-100 ${
                    keyPauseRemaining <= 4 ? 'bg-amber-400' : 'bg-sky-400'
                  }`}
                  style={{
                    transform: `scaleX(${Math.max(0, Math.min(1, keyPauseRemaining / 15))})`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Top-Center: Active Queue Mission & Shortest Path Readout */}
        <div className="hidden lg:flex flex-col items-center gap-1.5 max-w-xl pointer-events-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-center shadow-lg">
            <div className="text-[11px] text-amber-400 font-medium tabular-nums mb-0.5">
              Level {currentLevel} · Mission Queue ({completedCount}/{totalMissions}) · Target:{' '}
              {currentMission ? BUILDING_NAMES[currentMission.targetLocation] : 'Complete'}
            </div>
            <div className="text-xs md:text-sm font-semibold text-slate-100">
              {currentMission ? currentMission.title : 'All Missions Complete!'}
            </div>
            {currentMission && (
              <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                {currentMission.instruction}
              </div>
            )}
          </div>

          {highlightedPath.length >= 2 && (
            <div className="bg-slate-950 border border-amber-500/60 rounded-lg px-3 py-1 flex items-center gap-2 text-[11px] text-amber-200 font-mono tabular-nums shadow">
              <Route className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate max-w-md">
                {highlightedPath.map((id) => BUILDING_NAMES[id]).join(' → ')}
                {highlightedPathCost !== null ? ` · ${highlightedPathCost}m` : ''}
              </span>
              <button
                onClick={onClearOverlay}
                className="ml-1 text-slate-400 hover:text-white underline cursor-pointer whitespace-nowrap shrink-0"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Top-Right: Level Switcher + Audio + Pause */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Interactive Level Selector (1, 2, 3) */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            {([1, 2, 3] as Array<1 | 2 | 3>).map((lvl) => (
              <button
                key={lvl}
                onClick={() => onSelectLevel(lvl)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  currentLevel === lvl
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
                title={`Switch to VIT Level ${lvl}`}
              >
                Lv {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={() => onOpenScreen('GOOGLE_DRIVE')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-sky-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Share Playable Game Link & Sync with Google Drive"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Share &amp; Drive</span>
          </button>

          <button
            onClick={() => onOpenScreen('LEADERBOARD')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Leaderboard (Max-Heap & Sorting)"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Leaderboard</span>
          </button>

          <button
            onClick={onToggleMusic}
            className={`p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg transition-colors cursor-pointer ${
              isMusicOn && !isMuted ? 'text-sky-400' : 'text-slate-500'
            }`}
            title={isMusicOn ? 'Background Synth Music: On' : 'Background Synth Music: Off'}
            aria-label="Toggle background music"
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMute}
            className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-slate-200 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Unmute all audio' : 'Mute all audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-amber-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={() => onOpenScreen('PAUSED')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </button>
        </div>
      </div>

      {/* BOTTOM PERIMETER BAR */}
      <div className="flex items-end justify-between gap-3">
        {/* Bottom-Left: Dash + DSA Action Deck */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-300 max-w-2xl truncate">
            DSA Engine: <span className="text-amber-300">{activeAlgorithmLog}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={onDash}
              disabled={!dashReady}
              className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-900 disabled:text-slate-500 text-slate-950 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Dodge Dash with i-frames (Shortcut: Shift)"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Dash [Shift]</span>
            </button>

            <button
              onClick={onUndo}
              disabled={undoCount === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 disabled:opacity-45 border border-slate-800 rounded-lg text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
              title="Pop most recent movement from LIFO Stack (Shortcut: Z)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>Undo [Z] ({undoCount})</span>
            </button>

            <button
              onClick={() => onOpenScreen('MAP_DIJKSTRA')}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Open VIT Campus Graph & Step-by-Step Dijkstra Shortest Path (Shortcut: M)"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Dijkstra Map [M]</span>
            </button>

            <button
              onClick={onRunBFSNearby}
              className={`flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                bfsActive
                  ? 'bg-sky-600 text-white border-sky-500'
                  : 'bg-slate-950 hover:bg-slate-900 text-slate-100 border-slate-800'
              }`}
            >
              <Radar className="w-3.5 h-3.5 text-sky-400" />
              <span>BFS Nearby</span>
            </button>

            <button
              onClick={onRunDFSScan}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-violet-400" />
              <span>DFS Item Scan</span>
            </button>

            <button
              onClick={onToggleWeights}
              className={`px-3 py-2 border rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showGraphWeights
                  ? 'bg-slate-800 text-amber-300 border-amber-500/50'
                  : 'bg-slate-950 hover:bg-slate-900 text-slate-300 border-slate-800'
              }`}
            >
              Road Costs
            </button>

            <button
              onClick={() => onOpenScreen('MISSIONS')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
            >
              <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
              <span>Missions [Q] ({completedCount}/{totalMissions})</span>
            </button>

            <button
              onClick={() => onOpenScreen('INVENTORY')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Inventory [I] ({inventoryCount})</span>
            </button>

            <button
              onClick={() => onOpenScreen('DSA_CONCEPTS')}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-medium text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>DSA & Viva Docs</span>
            </button>
          </div>
        </div>

        {/* Bottom-Right: Live 60fps VIT Campus Mini-Map */}
        <div
          onClick={() => onOpenScreen('MAP_DIJKSTRA')}
          className="hidden sm:flex flex-col bg-slate-950 border border-slate-800 rounded-xl p-2 shadow-lg pointer-events-auto cursor-pointer hover:border-slate-600 transition-colors"
          title="Click to open full VIT Campus Graph & Dijkstra Visualizer"
        >
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 px-0.5">
            <span>VIT Campus Map</span>
            <span className="font-mono text-amber-400">Click [M]</span>
          </div>
          <canvas
            ref={miniMapRef}
            width={176}
            height={112}
            className="rounded-lg border border-slate-800 block"
          />
        </div>
      </div>
    </div>
  );
};
