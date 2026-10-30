import React from 'react';
import { CheckCircle2, Clock, Compass, X } from 'lucide-react';
import { BUILDING_NAMES } from '../data/campusData';
import { CampusNodeId, Mission } from '../types/game';

interface MissionModalProps {
  completedMissions: Mission[];
  queuedMissions: Mission[];
  currentLegDistance: number;
  onHighlightDestination: (dest: CampusNodeId) => void;
  onClose: () => void;
}

export const MissionModal: React.FC<MissionModalProps> = ({
  completedMissions,
  queuedMissions,
  currentLegDistance,
  onHighlightDestination,
  onClose,
}) => {
  const frontMission = queuedMissions[0];

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/85 flex items-center justify-center p-4 md:p-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Mission Queue (FIFO Data Structure)</h2>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              {completedMissions.length} Dequeued (Completed) · {queuedMissions.length} Remaining in Queue · O(1) Enqueue & Dequeue
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Mission Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Queue Visual Strip */}
        <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-mono tabular-nums">
          <span className="text-slate-400 shrink-0">QUEUE HEAD →</span>
          {queuedMissions.length === 0 ? (
            <span className="text-emerald-400">Queue is Empty (All 6 Missions Dequeued!)</span>
          ) : (
            queuedMissions.map((m, idx) => (
              <React.Fragment key={m.id}>
                <span
                  className={
                    idx === 0
                      ? 'text-amber-300 font-semibold whitespace-nowrap'
                      : 'text-slate-400 whitespace-nowrap'
                  }
                >
                  [M{m.id}: {BUILDING_NAMES[m.targetLocation]}]
                </span>
                {idx < queuedMissions.length - 1 && (
                  <span className="text-slate-600">←</span>
                )}
              </React.Fragment>
            ))
          )}
          <span className="text-slate-500 shrink-0">← TAIL</span>
        </div>

        {/* Mission List */}
        <div className="p-6 overflow-y-auto space-y-4">
          {frontMission && (
            <div className="bg-slate-950 border border-amber-500/60 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-mono text-amber-400">
                  ACTIVE FRONT OF QUEUE · +{frontMission.rewardPoints} PTS
                </span>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  Walked on current leg: {Math.round(currentLegDistance)}m / Optimal ~{frontMission.optimalDistance}m
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-1">{frontMission.title}</h3>
              <p className="text-sm text-slate-300 mb-3">{frontMission.instruction}</p>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400">
                  DSA Hook: <strong className="text-slate-200">{frontMission.dsaConceptUsed}</strong>
                </span>
                <button
                  onClick={() => {
                    onHighlightDestination(frontMission.targetLocation);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Calculate Dijkstra Route to {BUILDING_NAMES[frontMission.targetLocation]}</span>
                </button>
              </div>
            </div>
          )}

          {/* Upcoming in Queue */}
          {queuedMissions.slice(1).length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-slate-400">Waiting in FIFO Queue</h4>
              {queuedMissions.slice(1).map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{m.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Target: {BUILDING_NAMES[m.targetLocation]} · {m.dsaConceptUsed}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                    +{m.rewardPoints} pts
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Completed (Dequeued) */}
          {completedMissions.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-semibold text-emerald-400">Dequeued & Completed</h4>
              {completedMissions.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-950/40 border border-slate-800/80 rounded-xl px-4 py-3 flex items-center justify-between gap-4 opacity-80"
                >
                  <div className="flex items-center gap-2.5 text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="line-through">{m.title}</span>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 tabular-nums whitespace-nowrap shrink-0">
                    Earned +{m.rewardPoints} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
