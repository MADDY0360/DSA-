import React, { useState } from 'react';
import { ArrowRight, Award, Play, RotateCcw, Trophy } from 'lucide-react';
import { ActiveScreen } from '../types/game';
import { formatTimeMMSS } from './HUD';

interface PauseModalProps {
  currentLevel: 1 | 2 | 3;
  undoCount: number;
  isMuted: boolean;
  onResume: () => void;
  onSelectLevel: (lvl: 1 | 2 | 3) => void;
  onUndo: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onOpenScreen: (screen: ActiveScreen) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  currentLevel,
  undoCount,
  isMuted,
  onResume,
  onSelectLevel,
  onUndo,
  onRestart,
  onToggleMute,
  onOpenScreen,
}) => {
  return (
    <div className="fixed inset-0 z-30 bg-slate-950/85 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-white">Game Paused (Level {currentLevel})</h2>
          <p className="text-xs text-slate-400 mt-1">
            VIT Campus simulation and mission timer are paused.
          </p>
        </div>

        {/* Quick Level Selector */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
          <div className="text-xs font-semibold text-slate-300 mb-2">
            Switch VIT Campus Level
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { lvl: 1 as const, label: 'Lv 1: Morning' },
              { lvl: 2 as const, label: 'Lv 2: Tech-Fest' },
              { lvl: 3 as const, label: 'Lv 3: Curfew' },
            ].map((item) => (
              <button
                key={item.lvl}
                onClick={() => onSelectLevel(item.lvl)}
                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  currentLevel === item.lvl
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Resume Campus Escape (Esc)</span>
          </button>

          <button
            onClick={() => {
              onUndo();
              onResume();
            }}
            disabled={undoCount === 0}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-slate-200 font-medium text-xs rounded-lg transition-colors cursor-pointer tabular-nums"
          >
            Undo Last Checkpoint via Stack ({undoCount} available)
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onOpenScreen('HOW_TO_PLAY')}
              className="py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              How to Play
            </button>
            <button
              onClick={() => onOpenScreen('DSA_CONCEPTS')}
              className="py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              DSA & Viva Guide
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onToggleMute}
              className="py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              {isMuted ? 'Sound: Off' : 'Sound: On'}
            </button>
            <button
              onClick={onRestart}
              className="py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-amber-300 font-medium text-xs rounded-lg transition-colors cursor-pointer"
            >
              Restart Level {currentLevel}
            </button>
          </div>

          <button
            onClick={() => onOpenScreen('GOOGLE_DRIVE')}
            className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-sky-300 font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            Share Game Link &amp; Google Drive Sync
          </button>

          <button
            onClick={() => onOpenScreen('TITLE')}
            className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Return to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};

interface EndScreenModalProps {
  currentLevel: 1 | 2 | 3;
  isVictory: boolean;
  score: number;
  elapsedSec: number;
  missionsCompleted: number;
  routeEfficiency: number;
  itemsCollectedCount: number;
  hasSubmittedScore: boolean;
  onSubmitToLeaderboard: (playerName: string) => void;
  onNextLevel: () => void;
  onPlayAgain: () => void;
  onOpenLeaderboard: () => void;
}

export const EndScreenModal: React.FC<EndScreenModalProps> = ({
  currentLevel,
  isVictory,
  score,
  elapsedSec,
  missionsCompleted,
  routeEfficiency,
  itemsCollectedCount,
  hasSubmittedScore,
  onSubmitToLeaderboard,
  onNextLevel,
  onPlayAgain,
  onOpenLeaderboard,
}) => {
  const [studentName, setStudentName] = useState(`Maddy (VIT Lv${currentLevel})`);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = studentName.trim() || `Maddy (VIT Lv${currentLevel})`;
    onSubmitToLeaderboard(cleaned);
  };

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/90 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-7 shadow-2xl text-slate-100 space-y-6">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-3 rounded-xl ${
              isVictory ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
            }`}
          >
            <Award className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isVictory
                ? `Level ${currentLevel} Complete!`
                : `Maddy Was Stopped on Level ${currentLevel}!`}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isVictory
                ? currentLevel < 3
                  ? `Maddy escaped Level ${currentLevel}! Ready for higher hazards on Level ${currentLevel + 1}?`
                  : 'Legendary! Maddy conquered all 3 VIT Campus Levels including Dusk Curfew Escape!'
                : 'Security patrols, VIT Shuttles, or the Katpadi Express drained Maddy’s stamina! Use Shift to Dash through hazards and grab Chai at Foodys!'}
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 tabular-nums">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-slate-400">Final Score</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
              {score} pts
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-slate-400">Completion Time</div>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {formatTimeMMSS(elapsedSec)}
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-slate-400">Route Efficiency</div>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              {routeEfficiency}%
            </div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-slate-400">Missions · Items</div>
            <div className="text-lg font-bold font-mono text-sky-400 mt-0.5">
              {missionsCompleted}/6 · {itemsCollectedCount}/5
            </div>
          </div>
        </div>

        {/* Save into Binary Max-Heap Leaderboard */}
        {!hasSubmittedScore ? (
          <form onSubmit={handleSave} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Insert Score into Binary Max-Heap Leaderboard — O(log n)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your name & roll"
                maxLength={32}
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                Save Score
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-emerald-950/40 border border-emerald-700/50 rounded-xl px-4 py-3 text-xs text-emerald-300">
            Score inserted into Max-Heap Priority Queue! Open Leaderboard to test Merge Sort & Quick Sort.
          </div>
        )}

        {/* Next Level Progression CTA */}
        {isVictory && currentLevel < 3 && (
          <button
            onClick={onNextLevel}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Advance to Level {currentLevel + 1}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {/* Secondary Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onOpenLeaderboard}
            className="flex-1 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Replay Level {currentLevel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
