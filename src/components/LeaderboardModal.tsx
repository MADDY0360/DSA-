import React, { useMemo, useState } from 'react';
import { Trophy, X } from 'lucide-react';
import { LeaderboardMaxHeap } from '../dsa/MaxHeap';
import {
  mergeSortLeaderboard,
  quickSortLeaderboard,
  SortField,
} from '../dsa/Sorting';
import { LeaderboardEntry } from '../types/game';
import { formatTimeMMSS } from './HUD';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  onClose,
}) => {
  const [sortMode, setSortMode] = useState<SortField>('score_desc');
  const [algorithm, setAlgorithm] = useState<'HEAP' | 'MERGE' | 'QUICK'>('MERGE');

  const maxHeap = useMemo(() => new LeaderboardMaxHeap(entries), [entries]);
  const topPriorityChampion = maxHeap.peekMax();
  const heapArray = maxHeap.getHeapArraySnapshot();

  const displayData = useMemo(() => {
    if (algorithm === 'HEAP') {
      return {
        rows: maxHeap.extractAllRanked(),
        meta: `Binary Max-Heap extractMax() × ${entries.length} · O(n log n) total · Root O(1) peek`,
      };
    }
    const res =
      algorithm === 'MERGE'
        ? mergeSortLeaderboard(entries, sortMode)
        : quickSortLeaderboard(entries, sortMode);
    return {
      rows: res.sorted,
      meta: `${res.algorithmName} (${res.timeComplexity}) · ${res.comparisons} key comparisons · ${res.operations} ${
        algorithm === 'MERGE' ? 'merge writes' : 'in-place swaps'
      }`,
    };
  }, [entries, sortMode, algorithm, maxHeap]);

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/85 flex items-center justify-center p-4 md:p-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-xl font-bold text-white">
                Campus Escape Leaderboard (Max-Heap & Sorting)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                Top Root Student: {topPriorityChampion?.playerName} ({topPriorityChampion?.score} pts)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Leaderboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Sorting & Heap Controls */}
        <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setAlgorithm('MERGE')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                algorithm === 'MERGE'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Merge Sort
            </button>
            <button
              onClick={() => setAlgorithm('QUICK')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                algorithm === 'QUICK'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Quick Sort
            </button>
            <button
              onClick={() => {
                setAlgorithm('HEAP');
                setSortMode('score_desc');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                algorithm === 'HEAP'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Max-Heap Priority Queue
            </button>
          </div>

          {algorithm !== 'HEAP' && (
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
              <button
                onClick={() => setSortMode('score_desc')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  sortMode === 'score_desc'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sort by Score (High → Low)
              </button>
              <button
                onClick={() => setSortMode('time_asc')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  sortMode === 'time_asc'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sort by Time (Fastest First)
              </button>
            </div>
          )}
        </div>

        {/* Live Telemetry Line */}
        <div className="px-6 py-2 bg-slate-900/80 border-b border-slate-800 text-xs font-mono text-amber-300 tabular-nums">
          {displayData.meta}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 text-left">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Route Efficiency</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {displayData.rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-900 last:border-0 hover:bg-slate-900/50"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-slate-300">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {row.playerName}
                    </td>
                    <td className="py-3 px-4 font-mono text-amber-400 font-semibold">
                      {row.score} pts
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {formatTimeMMSS(row.completionTimeSec)}
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-400">
                      {row.routeEfficiency}%
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">
                      {row.dateLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Binary Heap Array Representation */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-300 mb-2">
              Internal Binary Max-Heap Array (Parent i → Children 2i+1, 2i+2)
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-mono tabular-nums">
              {heapArray.map((node, i) => (
                <div
                  key={node.id}
                  className={`px-3 py-1.5 rounded border ${
                    i === 0
                      ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  [{i}] {node.playerName.split(' ')[0]}: {node.score}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
