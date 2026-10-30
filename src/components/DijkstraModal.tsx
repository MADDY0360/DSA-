import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  StepForward,
  X,
} from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import {
  BUILDING_MAP,
  BUILDING_NAMES,
  CAMPUS_BUILDINGS,
  CAMPUS_ROADS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../data/campusData';
import { bfsExploreCampus, bfsFewestHopsPath } from '../dsa/BFS';
import { dfsItemSearch } from '../dsa/DFS';
import { runDijkstra } from '../dsa/Dijkstra';
import { CampusGraph } from '../dsa/Graph';
import { CampusNodeId, CollectibleItem } from '../types/game';

interface DijkstraModalProps {
  graph: CampusGraph;
  defaultStart: CampusNodeId;
  defaultEnd: CampusNodeId;
  items: CollectibleItem[];
  onApplyRouteToGame: (path: CampusNodeId[], totalCost: number) => void;
  onClose: () => void;
}

type StudioAlgorithm = 'DIJKSTRA' | 'BFS' | 'DFS';

export const DijkstraModal: React.FC<DijkstraModalProps> = ({
  graph,
  defaultStart,
  defaultEnd,
  items,
  onApplyRouteToGame,
  onClose,
}) => {
  const [algoTab, setAlgoTab] = useState<StudioAlgorithm>('DIJKSTRA');
  const [startNode, setStartNode] = useState<CampusNodeId>(defaultStart);
  const [endNode, setEndNode] = useState<CampusNodeId>(
    defaultStart === defaultEnd ? 'library' : defaultEnd
  );
  const [stepIdx, setStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const dijkstraResult = useMemo(
    () => runDijkstra(graph, startNode, endNode, BUILDING_NAMES),
    [graph, startNode, endNode]
  );

  const bfsResult = useMemo(() => bfsExploreCampus(graph, startNode, 5), [graph, startNode]);
  const bfsPath = useMemo(
    () => bfsFewestHopsPath(graph, startNode, endNode),
    [graph, startNode, endNode]
  );

  const bfsPathCost = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < bfsPath.length - 1; i++) {
      sum += graph.getEdgeWeight(bfsPath[i], bfsPath[i + 1]) || 0;
    }
    return sum;
  }, [graph, bfsPath]);

  const dfsResult = useMemo(() => {
    const itemMap: Record<string, string[]> = {};
    for (const item of items) {
      if (!item.collected) {
        if (!itemMap[item.locationId]) itemMap[item.locationId] = [];
        itemMap[item.locationId].push(item.name);
      }
    }
    return dfsItemSearch(graph, startNode, itemMap);
  }, [graph, startNode, items]);

  // Reset to final step or step 0 when endpoints change
  useEffect(() => {
    setStepIdx(dijkstraResult.steps.length - 1);
    setIsPlaying(false);
  }, [dijkstraResult]);

  // Step-by-step playback timer
  useEffect(() => {
    if (!isPlaying || algoTab !== 'DIJKSTRA') return;
    const timer = window.setInterval(() => {
      setStepIdx((prev) => {
        if (prev >= dijkstraResult.steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        soundEngine.playStepPing(next);
        return next;
      });
    }, 650);
    return () => window.clearInterval(timer);
  }, [isPlaying, algoTab, dijkstraResult.steps.length]);

  const activeStep = dijkstraResult.steps[Math.min(stepIdx, dijkstraResult.steps.length - 1)];
  const isFinished = stepIdx >= dijkstraResult.steps.length - 1;

  const displayedPath =
    algoTab === 'DIJKSTRA'
      ? isFinished
        ? dijkstraResult.path
        : []
      : algoTab === 'BFS'
      ? bfsPath
      : dfsResult.traversalOrder;

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/90 flex items-center justify-center p-3 md:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              VIT Campus Graph & Shortest-Path Visualizer
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              VIT Map (9 Landmarks, 15 Roads) · Compare Dijkstra (Weighted Cost) vs BFS (Fewest Hops) vs DFS (Item Scan)
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Segmented Algorithm Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
              {(['DIJKSTRA', 'BFS', 'DFS'] as StudioAlgorithm[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setAlgoTab(tab);
                    setIsPlaying(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    algoTab === tab
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {tab === 'DIJKSTRA'
                    ? "Dijkstra's Shortest Path"
                    : tab === 'BFS'
                    ? 'BFS (Level & Hops)'
                    : 'DFS (Deep Item Scan)'}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Map Visualizer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main 2-Zone Sandbox Layout (65% Interactive Graph Canvas, 35% Step & Distance Deck) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* LEFT: Interactive Campus Graph Stage */}
          <div className="lg:col-span-7 p-5 bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
            {/* Start & Destination Selectors */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-2 text-slate-300">
                  <span>Start:</span>
                  <select
                    value={startNode}
                    onChange={(e) => setStartNode(e.target.value as CampusNodeId)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium"
                  >
                    {CAMPUS_BUILDINGS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.shortName}
                      </option>
                    ))}
                  </select>
                </label>

                {algoTab !== 'DFS' && (
                  <label className="flex items-center gap-2 text-slate-300">
                    <span>Destination:</span>
                    <select
                      value={endNode}
                      onChange={(e) => setEndNode(e.target.value as CampusNodeId)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium"
                    >
                      {CAMPUS_BUILDINGS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.shortName}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {/* Classic Textbook Example Preset */}
              <button
                onClick={() => {
                  setAlgoTab('DIJKSTRA');
                  setStartNode('hostel');
                  setEndNode('library');
                  setStepIdx(0);
                  setIsPlaying(true);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-amber-300 font-medium cursor-pointer whitespace-nowrap shrink-0"
              >
                Demo: MH Hostel → Periyar Library
              </button>
            </div>

            {/* Interactive SVG Graph Map */}
            <div className="relative w-full aspect-[16/10] bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
              <svg
                viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
                className="w-full h-full"
              >
                {/* VIT Railway / Subway Dividing Line */}
                <line
                  x1={545}
                  y1={30}
                  x2={545}
                  y2={WORLD_HEIGHT - 30}
                  stroke="#475569"
                  strokeWidth={6}
                  strokeDasharray="16 14"
                />
                <text
                  x={530}
                  y={66}
                  textAnchor="end"
                  fill="#94A3B8"
                  fontSize="22"
                  fontFamily="JetBrains Mono, monospace"
                >
                  HOSTEL ZONE
                </text>
                <text
                  x={565}
                  y={66}
                  textAnchor="start"
                  fill="#FBBF24"
                  fontSize="22"
                  fontFamily="JetBrains Mono, monospace"
                >
                  VIT ACADEMIC ZONE
                </text>
                {/* Graph Edges */}
                {CAMPUS_ROADS.map((road) => {
                  const u = BUILDING_MAP[road.from];
                  const v = BUILDING_MAP[road.to];
                  const midX = (u.x + v.x) / 2;
                  const midY = (u.y + v.y) / 2;

                  let isOnFinalPath = false;
                  if (algoTab !== 'DFS') {
                    for (let i = 0; i < displayedPath.length - 1; i++) {
                      const a = displayedPath[i];
                      const b = displayedPath[i + 1];
                      if (
                        (a === road.from && b === road.to) ||
                        (a === road.to && b === road.from)
                      ) {
                        isOnFinalPath = true;
                        break;
                      }
                    }
                  }

                  const isRelaxingNow =
                    algoTab === 'DIJKSTRA' &&
                    activeStep?.relaxedEdge &&
                    ((activeStep.relaxedEdge.from === road.from &&
                      activeStep.relaxedEdge.to === road.to) ||
                      (activeStep.relaxedEdge.from === road.to &&
                        activeStep.relaxedEdge.to === road.from));

                  return (
                    <g key={`${road.from}-${road.to}`}>
                      <line
                        x1={u.x}
                        y1={u.y}
                        x2={v.x}
                        y2={v.y}
                        stroke={
                          isRelaxingNow
                            ? '#38BDF8'
                            : isOnFinalPath
                            ? '#F59E0B'
                            : '#334155'
                        }
                        strokeWidth={isRelaxingNow || isOnFinalPath ? 12 : 6}
                        strokeLinecap="round"
                      />
                      <rect
                        x={midX - 38}
                        y={midY - 18}
                        width={76}
                        height={36}
                        rx={8}
                        fill={isOnFinalPath ? '#F59E0B' : '#0F172A'}
                        stroke={isRelaxingNow ? '#38BDF8' : '#475569'}
                        strokeWidth={2}
                      />
                      <text
                        x={midX}
                        y={midY + 6}
                        textAnchor="middle"
                        fill={isOnFinalPath ? '#0F172A' : '#E2E8F0'}
                        fontSize="22"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="700"
                      >
                        {road.weight}m
                      </text>
                    </g>
                  );
                })}

                {/* Graph Vertices (Campus Buildings) */}
                {CAMPUS_BUILDINGS.map((b) => {
                  const isStart = b.id === startNode;
                  const isEnd = algoTab !== 'DFS' && b.id === endNode;
                  const isVisited =
                    algoTab === 'DIJKSTRA'
                      ? activeStep?.visited.includes(b.id)
                      : true;
                  const isCurrent =
                    algoTab === 'DIJKSTRA' && activeStep?.currentNode === b.id;
                  const onFinalPath = displayedPath.includes(b.id);

                  const distVal =
                    algoTab === 'DIJKSTRA' ? activeStep?.distances[b.id] : undefined;

                  return (
                    <g
                      key={b.id}
                      onClick={() => setEndNode(b.id)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={b.x}
                        cy={b.y}
                        r={isStart || isEnd || isCurrent ? 58 : 48}
                        fill={
                          isStart
                            ? '#10B981'
                            : isEnd
                            ? '#EA580C'
                            : onFinalPath
                            ? '#F59E0B'
                            : isVisited
                            ? '#0284C7'
                            : '#1E293B'
                        }
                        stroke={isCurrent ? '#FDE047' : '#F8FAFC'}
                        strokeWidth={isCurrent ? 7 : 4}
                      />
                      <text
                        x={b.x}
                        y={b.y - 62}
                        textAnchor="middle"
                        fill="#F8FAFC"
                        fontSize="27"
                        fontFamily="Outfit, sans-serif"
                        fontWeight="700"
                      >
                        {b.shortName}
                      </text>
                      <text
                        x={b.x}
                        y={b.y + 8}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="23"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="700"
                      >
                        {algoTab === 'DIJKSTRA'
                          ? distVal === Infinity || distVal === undefined
                            ? '∞'
                            : `${distVal}m`
                          : isStart
                          ? 'START'
                          : isEnd
                          ? 'GOAL'
                          : b.id.slice(0, 3).toUpperCase()}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Step Playback Controls */}
            {algoTab === 'DIJKSTRA' && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setStepIdx(0);
                      setIsPlaying(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Animate Step-by-Step</span>
                  </button>

                  {isPlaying && (
                    <button
                      onClick={() => setIsPlaying(false)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded-lg cursor-pointer"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pause</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setStepIdx((s) => {
                        const next = Math.min(dijkstraResult.steps.length - 1, s + 1);
                        soundEngine.playStepPing(next);
                        return next;
                      });
                    }}
                    disabled={isFinished}
                    className="flex items-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-xs rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <StepForward className="w-3.5 h-3.5" />
                    <span>Step ({stepIdx + 1}/{dijkstraResult.steps.length})</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setStepIdx(dijkstraResult.steps.length - 1);
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>Final Path</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setStepIdx(0);
                    }}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 cursor-pointer"
                    title="Reset to Step 1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    onApplyRouteToGame(dijkstraResult.path, dijkstraResult.totalCost);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Check className="w-4 h-4" />
                  <span>Highlight Route on Campus Map</span>
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: Algorithm Output, Distance Table & Step Trace */}
          <div className="lg:col-span-5 p-5 flex flex-col gap-4 overflow-y-auto">
            {algoTab === 'DIJKSTRA' && (
              <>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400 mb-1">
                    Shortest Route ({BUILDING_NAMES[startNode]} → {BUILDING_NAMES[endNode]})
                  </div>
                  <div className="text-sm font-bold text-amber-400 font-mono">
                    {dijkstraResult.path.map((id) => BUILDING_NAMES[id]).join(' → ')}
                  </div>
                  <div className="text-xs text-slate-300 mt-1.5 tabular-nums">
                    Total Minimum Cost: <strong className="text-white font-mono">{dijkstraResult.totalCost}m</strong> · Hops: {Math.max(0, dijkstraResult.path.length - 1)} roads
                  </div>
                </div>

                <div className="bg-slate-950 border border-sky-500/40 rounded-xl p-4">
                  <div className="text-xs font-mono text-sky-400 mb-1 tabular-nums">
                    Step {activeStep?.stepNumber} of {dijkstraResult.steps.length}
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {activeStep?.explanation}
                  </p>
                </div>

                {/* Live Dijkstra Distance & Predecessor Table */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-800 text-xs font-semibold text-slate-300">
                    Tentative Distance & Parent Table
                  </div>
                  <table className="w-full text-xs font-mono tabular-nums">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800 text-left">
                        <th className="py-2 px-3">Vertex</th>
                        <th className="py-2 px-3">Dist</th>
                        <th className="py-2 px-3">Parent</th>
                        <th className="py-2 px-3">State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CAMPUS_BUILDINGS.map((b) => {
                        const d = activeStep?.distances[b.id];
                        const p = activeStep?.previous[b.id];
                        const vis = activeStep?.visited.includes(b.id);
                        return (
                          <tr
                            key={b.id}
                            className="border-b border-slate-900 last:border-0 text-slate-200"
                          >
                            <td className="py-1.5 px-3 font-sans font-medium">
                              {b.shortName}
                            </td>
                            <td className="py-1.5 px-3 text-amber-300">
                              {d === Infinity || d === undefined ? '∞' : `${d}m`}
                            </td>
                            <td className="py-1.5 px-3 text-slate-400">
                              {p ? BUILDING_NAMES[p] : '—'}
                            </td>
                            <td className="py-1.5 px-3">
                              {vis ? (
                                <span className="text-emerald-400">Visited</span>
                              ) : (
                                <span className="text-slate-500">Unvisited</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {algoTab === 'BFS' && (
              <>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-bold text-white">
                    BFS Level-by-Level Exploration & Fewest Hops
                  </h3>
                  <p className="text-xs text-slate-300">
                    Fewest-Hops Route: <strong className="text-amber-300 font-mono">{bfsPath.map((n) => BUILDING_NAMES[n]).join(' → ')}</strong>
                  </p>
                  <p className="text-xs text-slate-400 tabular-nums">
                    BFS Hops: <strong className="text-white">{Math.max(0, bfsPath.length - 1)} roads ({bfsPathCost}m)</strong> vs. Dijkstra Optimal Cost: <strong className="text-emerald-400">{dijkstraResult.totalCost}m</strong>
                  </p>
                  <button
                    onClick={() => {
                      onApplyRouteToGame(bfsPath, bfsPathCost);
                      onClose();
                    }}
                    className="mt-2 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs rounded-lg cursor-pointer"
                  >
                    Highlight BFS Route on Map
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-semibold text-slate-300">
                    Radial Layers from {BUILDING_NAMES[startNode]}
                  </div>
                  {bfsResult.levels.map((lvl) => (
                    <div key={lvl.level} className="text-xs border-b border-slate-900 pb-2 last:border-0">
                      <span className="font-mono text-sky-400 font-semibold">
                        Level {lvl.level} ({lvl.level} {lvl.level === 1 ? 'hop' : 'hops'}):
                      </span>{' '}
                      <span className="text-slate-200">
                        {lvl.nodes.map((n) => BUILDING_NAMES[n]).join(' · ')}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {algoTab === 'DFS' && (
              <>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-bold text-white">
                    DFS Deep Campus Traversal & Uncollected Item Scanner
                  </h3>
                  <p className="text-xs text-slate-300">
                    Traversal Order:{' '}
                    <span className="font-mono text-violet-300">
                      {dfsResult.traversalOrder.map((n) => BUILDING_NAMES[n]).join(' → ')}
                    </span>
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-300">
                    Uncollected Items Discovered ({dfsResult.foundItems.length})
                  </div>
                  {dfsResult.foundItems.length === 0 ? (
                    <p className="text-xs text-emerald-400">
                      All campus items have been collected!
                    </p>
                  ) : (
                    dfsResult.foundItems.map((fi, i) => (
                      <div
                        key={`${fi.itemName}-${i}`}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-slate-900 last:border-0"
                      >
                        <span className="font-semibold text-amber-300">{fi.itemName}</span>
                        <span className="font-mono text-slate-300">
                          at {BUILDING_NAMES[fi.location]}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
