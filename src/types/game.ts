/**
 * Core Game & DSA Types for Campus Escape
 */

export type CampusNodeId =
  | 'hostel'
  | 'canteen'
  | 'library'
  | 'academic'
  | 'lab'
  | 'auditorium'
  | 'sports'
  | 'park'
  | 'gate';

export type ActiveScreen =
  | 'TITLE'
  | 'PLAYING'
  | 'ASSIGNMENT_QUIZ'
  | 'HOW_TO_PLAY'
  | 'MAP_DIJKSTRA'
  | 'MISSIONS'
  | 'INVENTORY'
  | 'DSA_CONCEPTS'
  | 'PAUSED'
  | 'VICTORY'
  | 'GAME_OVER'
  | 'LEADERBOARD'
  | 'GOOGLE_DRIVE';

export interface CloudSavePayload {
  version: 1;
  savedAt: string;
  currentLevel: 1 | 2 | 3;
  score: number;
  health: number;
  elapsedSec: number;
  assignmentSubmitted: boolean;
  leaderboardEntries: LeaderboardEntry[];
}

export interface DSAQuizQuestion {
  id: string;
  conceptTag: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CampusBuilding {
  id: CampusNodeId;
  name: string;
  shortName: string;
  description: string;
  x: number; // Center X in 2D world coordinates (2400 x 1500)
  y: number; // Center Y in 2D world coordinates
  width: number;
  height: number;
  roofColor: string;
  wallColor: string;
  accentColor: string;
  category: 'residential' | 'academic' | 'recreation' | 'exit';
}

export interface CampusRoad {
  from: CampusNodeId;
  to: CampusNodeId;
  weight: number; // Distance/cost in meters (used in Graph & Dijkstra)
  label?: string;
}

export interface CollectibleItem {
  id: string;
  name: string;
  description: string;
  locationId: CampusNodeId;
  x: number;
  y: number;
  points: number;
  iconType: 'id_card' | 'assignment' | 'laptop' | 'key' | 'chai';
  collected: boolean;
}

export interface Mission {
  id: number;
  title: string;
  instruction: string;
  targetLocation: CampusNodeId;
  requiredItem?: string; // Checked via Hash Table O(1) lookup
  collectItemTarget?: string; // Item ID to pick up
  requiresDijkstra?: boolean; // Encourages/triggers shortest route check
  rewardPoints: number;
  optimalDistance: number;
  dsaConceptUsed: string;
}

export interface MovementSnapshot {
  x: number;
  y: number;
  locationId: CampusNodeId | null;
  timestamp: number;
  label: string;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  completionTimeSec: number;
  missionsCompleted: number;
  routeEfficiency: number;
  dateLabel: string;
}

export interface DijkstraStep {
  stepNumber: number;
  currentNode: CampusNodeId;
  visited: CampusNodeId[];
  distances: Record<CampusNodeId, number>;
  previous: Record<CampusNodeId, CampusNodeId | null>;
  relaxedEdge?: {
    from: CampusNodeId;
    to: CampusNodeId;
    weight: number;
    newDist: number;
  };
  explanation: string;
}

export interface DijkstraResult {
  startNode: CampusNodeId;
  endNode: CampusNodeId;
  path: CampusNodeId[];
  totalCost: number;
  distances: Record<CampusNodeId, number>;
  previous: Record<CampusNodeId, CampusNodeId | null>;
  steps: DijkstraStep[];
}

export interface BFSLevelResult {
  startNode: CampusNodeId;
  levels: Array<{
    level: number;
    nodes: CampusNodeId[];
  }>;
  traversalOrder: CampusNodeId[];
  parentMap: Record<string, CampusNodeId | null>;
}

export interface DFSSearchResult {
  startNode: CampusNodeId;
  traversalOrder: CampusNodeId[];
  discoverySteps: Array<{
    node: CampusNodeId;
    action: 'visit' | 'backtrack';
    foundItem?: string;
  }>;
  foundItems: Array<{
    itemName: string;
    location: CampusNodeId;
  }>;
}
