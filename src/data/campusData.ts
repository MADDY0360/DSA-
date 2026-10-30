import { CampusGraph } from '../dsa/Graph';
import {
  CampusBuilding,
  CampusNodeId,
  CampusRoad,
  CollectibleItem,
  DSAQuizQuestion,
  LeaderboardEntry,
  Mission,
} from '../types/game';

export const WORLD_WIDTH = 2200;
export const WORLD_HEIGHT = 1400;

/**
 * 9 VIT Campus (Vellore Institute of Technology) Landmarks
 * Mapped cleanly onto the 9 required campus graph vertices!
 */
export const CAMPUS_BUILDINGS: CampusBuilding[] = [
  {
    id: 'hostel',
    name: "Men's Hostel (MH Q-Block)",
    shortName: 'MH Hostel',
    description: "Maddy's hostel block in the VIT Men's Hostel zone across the subway.",
    x: 280,
    y: 280,
    width: 215,
    height: 148,
    roofColor: '#C2410C', // Warm terracotta hostel wing
    wallColor: '#FFFBEB',
    accentColor: '#EA580C',
    category: 'residential',
  },
  {
    id: 'canteen',
    name: 'Foodys Canteen (VIT FC)',
    shortName: 'Foodys Canteen',
    description: 'Popular VIT student hangout near the subway exit. Check the counter for Maddy’s VIT ID Card!',
    x: 780,
    y: 250,
    width: 200,
    height: 138,
    roofColor: '#D97706', // Warm amber canopy
    wallColor: '#FEF3C7',
    accentColor: '#F59E0B',
    category: 'recreation',
  },
  {
    id: 'academic',
    name: 'Technology Tower (TT Academic)',
    shortName: 'Tech Tower (TT)',
    description: 'VIT’s iconic academic tower housing lecture halls and faculty cabins for assignment submission.',
    x: 1340,
    y: 280,
    width: 240,
    height: 152,
    roofColor: '#991B1B', // Classic granite & red accent
    wallColor: '#FEE2E2',
    accentColor: '#DC2626',
    category: 'academic',
  },
  {
    id: 'lab',
    name: 'Silver Jubilee Tower (SJT Labs)',
    shortName: 'SJT Lab Block',
    description: 'Computing & DSA programming laboratories at the eastern end of VIT campus.',
    x: 1880,
    y: 310,
    width: 215,
    height: 148,
    roofColor: '#0369A1', // Modern SJT blue glass
    wallColor: '#E0F2FE',
    accentColor: '#0284C7',
    category: 'academic',
  },
  {
    id: 'sports',
    name: 'VIT Outdoor Stadium (Sports)',
    shortName: 'Outdoor Stadium',
    description: 'VIT cricket turf, football ground, and synthetic athletics track.',
    x: 330,
    y: 860,
    width: 245,
    height: 168,
    roofColor: '#15803D',
    wallColor: '#DCFCE7',
    accentColor: '#16A34A',
    category: 'recreation',
  },
  {
    id: 'park',
    name: 'VIT Lake & Hexagon Park',
    shortName: 'VIT Lake Park',
    description: 'Central shaded lawn, VIT Lake lotus deck, and stone benches at the heart of VIT.',
    x: 960,
    y: 720,
    width: 220,
    height: 158,
    roofColor: '#047857',
    wallColor: '#D1FAE5',
    accentColor: '#10B981',
    category: 'recreation',
  },
  {
    id: 'library',
    name: 'Periyar Central Library',
    shortName: 'Periyar Library',
    description: 'VIT’s grand glass-facade Periyar EVR Central Library with multi-floor digital reading halls.',
    x: 1620,
    y: 740,
    width: 230,
    height: 158,
    roofColor: '#1D4ED8', // Iconic Periyar Library blue glass
    wallColor: '#DBEAFE',
    accentColor: '#2563EB',
    category: 'academic',
  },
  {
    id: 'auditorium',
    name: 'Anna Auditorium',
    shortName: 'Anna Auditorium',
    description: 'VIT’s main air-conditioned auditorium for Riviera, Gravitas, and convocations.',
    x: 1020,
    y: 1160,
    width: 235,
    height: 152,
    roofColor: '#6D28D9',
    wallColor: '#EDE9FE',
    accentColor: '#7C3AED',
    category: 'recreation',
  },
  {
    id: 'gate',
    name: 'VIT Main Gate (Katpadi Arch)',
    shortName: 'VIT Main Gate',
    description: 'Iconic VIT Main Entrance Gate on Katpadi–Tiruvalam Road with biometric ID verification.',
    x: 1860,
    y: 1150,
    width: 225,
    height: 152,
    roofColor: '#0F766E',
    wallColor: '#CCFBF1',
    accentColor: '#14B8A6',
    category: 'exit',
  },
];

export const BUILDING_MAP: Record<CampusNodeId, CampusBuilding> = CAMPUS_BUILDINGS.reduce(
  (acc, b) => {
    acc[b.id] = b;
    return acc;
  },
  {} as Record<CampusNodeId, CampusBuilding>
);

export const BUILDING_NAMES: Record<CampusNodeId, string> = CAMPUS_BUILDINGS.reduce(
  (acc, b) => {
    acc[b.id] = b.shortName;
    return acc;
  },
  {} as Record<CampusNodeId, string>
);

/**
 * Weighted Roads connecting VIT Campus Buildings (Edges of the VIT Graph)
 * Preserves exact edge weights:
 * MH Hostel -> Foodys Canteen (120m) -> Tech Tower (130m) -> Periyar Library (110m) = 360m
 * while MH Hostel -> VIT Lake Park (240m) -> Periyar Library (170m) = 410m (2 hops via BFS).
 */
export const CAMPUS_ROADS: CampusRoad[] = [
  { from: 'hostel', to: 'canteen', weight: 120, label: 'North Subway Walk' },
  { from: 'hostel', to: 'sports', weight: 180, label: 'MH Stadium Track' },
  { from: 'hostel', to: 'park', weight: 240, label: 'Subway Underpass Path' },
  { from: 'canteen', to: 'academic', weight: 130, label: 'TT Avenue' },
  { from: 'canteen', to: 'park', weight: 140, label: 'Hexagon Walk' },
  { from: 'academic', to: 'lab', weight: 115, label: 'SJT Skywalk Road' },
  { from: 'academic', to: 'park', weight: 135, label: 'TT Lake Promenade' },
  { from: 'academic', to: 'library', weight: 110, label: 'Periyar Knowledge Walk' },
  { from: 'lab', to: 'library', weight: 125, label: 'SJT–Library Lane' },
  { from: 'sports', to: 'park', weight: 150, label: 'South Subway Crossing' },
  { from: 'sports', to: 'auditorium', weight: 190, label: 'Stadium–Audi Road' },
  { from: 'park', to: 'library', weight: 170, label: 'VIT Lake Avenue' },
  { from: 'park', to: 'auditorium', weight: 155, label: 'Riviera Marg' },
  { from: 'library', to: 'gate', weight: 160, label: 'Main Gate Boulevard' },
  { from: 'auditorium', to: 'gate', weight: 145, label: 'Katpadi Exit Road' },
];

export function buildCampusGraph(): CampusGraph {
  const graph = new CampusGraph();
  for (const b of CAMPUS_BUILDINGS) {
    graph.addVertex(b.id);
  }
  for (const r of CAMPUS_ROADS) {
    graph.addUndirectedEdge(r.from, r.to, r.weight, r.label);
  }
  return graph;
}

/**
 * Collectible Items for Maddy stored in the Separate Chaining Hash Table Inventory
 */
export function createInitialItems(): CollectibleItem[] {
  return [
    {
      id: 'item-assignment',
      name: 'Assignment',
      description: "Maddy's Digital Assignment (DA) & DSA Lab Record outside MH Hostel.",
      locationId: 'hostel',
      x: 375,
      y: 365,
      points: 100,
      iconType: 'assignment',
      collected: false,
    },
    {
      id: 'item-id-card',
      name: 'ID Card',
      description: "Maddy's VIT Smart ID Card & Blue Lanyard left at the Foodys counter.",
      locationId: 'canteen',
      x: 840,
      y: 335,
      points: 150,
      iconType: 'id_card',
      collected: false,
    },
    {
      id: 'item-laptop',
      name: 'Laptop',
      description: "Maddy's coding laptop inside Silver Jubilee Tower (SJT) Lab Block.",
      locationId: 'lab',
      x: 1880,
      y: 410,
      points: 200,
      iconType: 'laptop',
      collected: false,
    },
    {
      id: 'item-time-key',
      name: 'Key',
      description:
        'VIT Master Key at the far eastern edge of SJT Lab Block — collecting it grants 15s Pause Time (freezes clock, guards & campus obstacles)!',
      locationId: 'lab',
      x: 2010,
      y: 245,
      points: 175,
      iconType: 'key',
      collected: false,
    },
    {
      id: 'item-key',
      name: 'Gate Key',
      description:
        'Approved VIT Proctor Outing Pass & Gate Key behind Anna Auditorium — also triggers 15s Campus Pause Time!',
      locationId: 'auditorium',
      x: 1020,
      y: 1255,
      points: 175,
      iconType: 'key',
      collected: false,
    },
    {
      id: 'item-chai',
      name: 'Masala Chai',
      description: 'Hot Enzo Chai by VIT Lake (+30 Stamina/HP & +75 Bonus Score for Maddy).',
      locationId: 'park',
      x: 1045,
      y: 645,
      points: 75,
      iconType: 'chai',
      collected: false,
    },
  ];
}

/**
 * 6 Sequential VIT Missions for Maddy loaded into the FIFO Mission Queue
 */
export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 1,
    title: 'Mission 1: Go to Foodys Canteen',
    instruction:
      'Guide Maddy to grab his Digital Assignment outside MH Hostel, cross the VIT Subway, and reach Foodys Canteen.',
    targetLocation: 'canteen',
    rewardPoints: 150,
    optimalDistance: 120,
    dsaConceptUsed: 'Queue (Front Mission) & VIT Graph Edge Traversal',
  },
  {
    id: 2,
    title: 'Mission 2: Collect Maddy’s VIT ID Card',
    instruction:
      'Pick up Maddy’s glowing VIT ID Card outside Foodys Canteen (walk over it or press Space) to store it in the Hash Table.',
    targetLocation: 'canteen',
    collectItemTarget: 'ID Card',
    rewardPoints: 150,
    optimalDistance: 40,
    dsaConceptUsed: 'Hash Table Insertion — O(1) Bucket Mapping',
  },
  {
    id: 3,
    title: 'Mission 3: Go to Technology Tower (TT)',
    instruction:
      'Walk east along TT Avenue from Foodys Canteen to reach Technology Tower (TT Academic Block).',
    targetLocation: 'academic',
    rewardPoints: 175,
    optimalDistance: 130,
    dsaConceptUsed: 'Graph Shortest Neighbor Edge',
  },
  {
    id: 4,
    title: 'Mission 4: Submit DA & Pass Quiz Checkpoint (0/1 Pt)',
    instruction:
      'At Technology Tower (TT) with ID Card & Assignment, press Space on the DA Desk and pass the 3-question DSA Quiz to earn your 1/1 Completion Point & Save Checkpoint!',
    targetLocation: 'academic',
    requiredItem: 'Assignment',
    rewardPoints: 250,
    optimalDistance: 100,
    dsaConceptUsed: 'Hash Table O(1) Lookup + DSA Viva Quiz Checkpoint',
  },
  {
    id: 5,
    title: 'Mission 5: Shortest Route to Periyar Library',
    instruction:
      'Checkpoint Saved! Press M to visualize Dijkstra’s shortest route on the VIT Map, then guide Maddy to Periyar Central Library!',
    targetLocation: 'library',
    requiresDijkstra: true,
    rewardPoints: 250,
    optimalDistance: 110,
    dsaConceptUsed: "Dijkstra's Shortest Path Algorithm — O((V + E) log V)",
  },
  {
    id: 6,
    title: 'Mission 6: Cross Finish Line at VIT Main Gate',
    instruction:
      'With your 1/1 Assignment Point verified and VIT ID Card ready, sprint across the Checkered Finish Line at VIT Main Gate to win!',
    targetLocation: 'gate',
    requiredItem: 'ID Card',
    rewardPoints: 300,
    optimalDistance: 160,
    dsaConceptUsed: 'Queue Completion & Max-Heap Leaderboard Insertion',
  },
];

/**
 * Seed VIT Leaderboard entries stored in our Priority Queue (Max-Heap)
 */
export const SEED_LEADERBOARD: LeaderboardEntry[] = [
  {
    id: 'seed-1',
    playerName: 'Maddy (VIT CSE)',
    score: 1520,
    completionTimeSec: 74,
    missionsCompleted: 6,
    routeEfficiency: 98,
    dateLabel: 'VIT Record',
  },
  {
    id: 'seed-2',
    playerName: 'Ananya (VIT SCOPE)',
    score: 1410,
    completionTimeSec: 86,
    missionsCompleted: 6,
    routeEfficiency: 94,
    dateLabel: 'Oct 2026',
  },
  {
    id: 'seed-3',
    playerName: 'Rohan (VIT SENSE)',
    score: 1310,
    completionTimeSec: 95,
    missionsCompleted: 6,
    routeEfficiency: 90,
    dateLabel: 'Oct 2026',
  },
  {
    id: 'seed-4',
    playerName: 'Priya (VIT SCORE)',
    score: 1190,
    completionTimeSec: 112,
    missionsCompleted: 6,
    routeEfficiency: 85,
    dateLabel: 'Oct 2026',
  },
  {
    id: 'seed-5',
    playerName: 'Karthik (VIT SELECT)',
    score: 1060,
    completionTimeSec: 129,
    missionsCompleted: 6,
    routeEfficiency: 80,
    dateLabel: 'Oct 2026',
  },
];

export interface CyclistHazard {
  id: string;
  from: CampusNodeId;
  to: CampusNodeId;
  progress: number;
  direction: 1 | -1;
  speed: number;
  color: string;
  pedalPhase: number;
}

export interface VitShuttleHazard {
  id: string;
  from: CampusNodeId;
  to: CampusNodeId;
  progress: number;
  direction: 1 | -1;
  baseSpeed: number;
  state: 'CRUISE' | 'HONK_WINDUP' | 'SURGE';
  stateTimer: number;
  color: string;
}

export interface RedTagGuard {
  id: string;
  name: string;
  waypoints: Array<{ x: number; y: number }>;
  targetWpIndex: number;
  x: number;
  y: number;
  facingAngle: number;
  state: 'CHASE_NO_ID' | 'PATROL' | 'WINDUP' | 'LUNGE' | 'COOLDOWN';
  stateTimer: number;
  lungeDirX: number;
  lungeDirY: number;
  unlockAtMissionIndex: number;
  isNoIdChaser?: boolean;
  chaseSpeed?: number;
}

export interface SprinklerHazard {
  id: string;
  x: number;
  y: number;
  radius: number;
  angle: number;
  state: 'IDLE' | 'TELEGRAPH' | 'SPRAY';
  timer: number;
}

export interface ExpressTrainState {
  state: 'CLEAR' | 'WARNING' | 'PASSING';
  timer: number;
  y: number;
  direction: 1 | -1;
}

export interface FloatingTextPopup {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface DashAfterimage {
  x: number;
  y: number;
  angle: number;
  alpha: number;
}

export interface CampusLevelConfig {
  level: 1 | 2 | 3;
  name: string;
  subtitle: string;
  hazardSpeedMultiplier: number;
  ambientMode: 'MORNING' | 'AFTERNOON' | 'DUSK';
  idCardLocation: CampusNodeId;
}

export const CAMPUS_LEVELS: CampusLevelConfig[] = [
  {
    level: 1,
    name: 'Level 1: 8 AM Lecture Rush',
    subtitle: 'Security chases Maddy until he grabs his VIT ID Card at Foodys!',
    hazardSpeedMultiplier: 1.0,
    ambientMode: 'MORNING',
    idCardLocation: 'canteen',
  },
  {
    level: 2,
    name: 'Level 2: Gravitas Tech-Fest',
    subtitle: '2 Security Guards chase Maddy! Recover ID at VIT Lake & Laptop at SJT!',
    hazardSpeedMultiplier: 1.22,
    ambientMode: 'AFTERNOON',
    idCardLocation: 'park',
  },
  {
    level: 3,
    name: 'Level 3: Hostel Curfew Escape',
    subtitle: 'Dusk Curfew! Outrun Elite Security to Stadium for ID, grab Gate Key at Anna Audi!',
    hazardSpeedMultiplier: 1.4,
    ambientMode: 'DUSK',
    idCardLocation: 'sports',
  },
];

export function createItemsForLevel(level: 1 | 2 | 3): CollectibleItem[] {
  const base = createInitialItems();
  if (level === 2) {
    // Move ID Card to VIT Lake Park for Level 2
    const idItem = base.find((i) => i.name === 'ID Card')!;
    idItem.locationId = 'park';
    idItem.x = 960;
    idItem.y = 815;
    idItem.description = "Maddy's VIT ID Card dropped near VIT Lake Boat Club during Gravitas!";

    // Keep Time-Freeze Key at a distant south-west detour in Level 2 (since Mission 3 visits SJT)
    const timeKey = base.find((i) => i.name === 'Key')!;
    timeKey.locationId = 'sports';
    timeKey.x = 215;
    timeKey.y = 990;
    timeKey.description =
      'VIT Master Key at the far south-west corner of Outdoor Stadium — grants 15s Pause Time!';
  } else if (level === 3) {
    // Move ID Card to Outdoor Stadium for Level 3 (Time Key stays far east at SJT x:2010!)
    const idItem = base.find((i) => i.name === 'ID Card')!;
    idItem.locationId = 'sports';
    idItem.x = 330;
    idItem.y = 955;
    idItem.description = "Maddy's VIT ID Card left at Outdoor Stadium practice turf!";
  }
  return base;
}

export function getMissionsForLevel(level: 1 | 2 | 3): Mission[] {
  if (level === 1) return INITIAL_MISSIONS;

  if (level === 2) {
    return [
      {
        id: 1,
        title: 'Mission 1: Outrun Security to VIT Lake Park',
        instruction:
          'Two VIT Security Guards are chasing Maddy for having no ID! Grab Assignment outside Hostel & dash to VIT Lake Park!',
        targetLocation: 'park',
        rewardPoints: 175,
        optimalDistance: 240,
        dsaConceptUsed: 'Queue (Front) & Real-Time Guard Pursuit Evasion',
      },
      {
        id: 2,
        title: 'Mission 2: Recover VIT ID Card at VIT Lake',
        instruction:
          'Pick up Maddy’s glowing ID Card by VIT Lake to insert into Hash Table O(1) and call off the Security Guard chase!',
        targetLocation: 'park',
        collectItemTarget: 'ID Card',
        rewardPoints: 200,
        optimalDistance: 50,
        dsaConceptUsed: 'Hash Table O(1) Set — Stops Security Chase!',
      },
      {
        id: 3,
        title: 'Mission 3: Collect Laptop from SJT Lab Block',
        instruction:
          'Head north-east to Silver Jubilee Tower (SJT) and pick up Maddy’s coding Laptop.',
        targetLocation: 'lab',
        collectItemTarget: 'Laptop',
        rewardPoints: 225,
        optimalDistance: 250,
        dsaConceptUsed: 'Hash Table Bucket Chaining',
      },
      {
        id: 4,
        title: 'Mission 4: Submit DA & Pass Quiz Checkpoint (0/1 Pt)',
        instruction:
          'Go to Technology Tower (TT) with ID Card, Assignment & Laptop, press Space, and pass the DSA Quiz to lock your Checkpoint & earn 1/1 Completion Point!',
        targetLocation: 'academic',
        requiredItem: 'Laptop',
        rewardPoints: 275,
        optimalDistance: 115,
        dsaConceptUsed: 'Hash Table O(1) Multi-Key + Viva Quiz Checkpoint',
      },
      {
        id: 5,
        title: 'Mission 5: Shortest Route to Periyar Library',
        instruction:
          'Press M to calculate Dijkstra’s shortest path and reach Periyar Central Library.',
        targetLocation: 'library',
        requiresDijkstra: true,
        rewardPoints: 275,
        optimalDistance: 110,
        dsaConceptUsed: "Dijkstra's Shortest Path Algorithm",
      },
      {
        id: 6,
        title: 'Mission 6: Cross Finish Line at VIT Main Gate',
        instruction:
          'Navigate past Gravitas Shuttles & Red-Tag Wardens and cross the Checkered Finish Line at VIT Main Gate!',
        targetLocation: 'gate',
        requiredItem: 'ID Card',
        rewardPoints: 350,
        optimalDistance: 160,
        dsaConceptUsed: 'Queue Dequeue & Max-Heap Ranking',
      },
    ];
  }

  // Level 3: Dusk Curfew Escape
  return [
    {
      id: 1,
      title: 'Mission 1: Sprint to Outdoor Stadium (Curfew Alert!)',
      instruction:
        'Elite Curfew Security is chasing Maddy! Grab Assignment outside MH Hostel and run south to Outdoor Stadium!',
      targetLocation: 'sports',
      rewardPoints: 200,
      optimalDistance: 180,
      dsaConceptUsed: 'Queue (Front) & High-Speed Pursuit',
    },
    {
      id: 2,
      title: 'Mission 2: Grab VIT ID Card to Stop Security Chase',
      instruction:
        'Collect Maddy’s VIT ID Card at Outdoor Stadium to pass O(1) Hash Table ID verification and halt the chase!',
      targetLocation: 'sports',
      collectItemTarget: 'ID Card',
      rewardPoints: 225,
      optimalDistance: 50,
      dsaConceptUsed: 'Hash Table O(1) ID Verification',
    },
    {
      id: 3,
      title: 'Mission 3: Collect Proctor Gate Key at Anna Auditorium',
      instruction:
        'Cross South Subway or Stadium–Audi Road to Anna Auditorium and pick up the Proctor Gate Key.',
      targetLocation: 'auditorium',
      collectItemTarget: 'Gate Key',
      rewardPoints: 250,
      optimalDistance: 190,
      dsaConceptUsed: 'Graph Traversal & Hash Table Insert',
    },
    {
      id: 4,
      title: 'Mission 4: Submit Night-Lab DA & Quiz Checkpoint (0/1 Pt)',
      instruction:
        'Travel north to Technology Tower (TT), press Space with Assignment & ID Card, and pass the Curfew Viva Quiz to save your Checkpoint & earn 1/1 Point!',
      targetLocation: 'academic',
      requiredItem: 'Assignment',
      rewardPoints: 300,
      optimalDistance: 290,
      dsaConceptUsed: 'Hash Table O(1) Lookup + Curfew Viva Quiz Checkpoint',
    },
    {
      id: 5,
      title: 'Mission 5: Optimal Curfew Route to Periyar Library',
      instruction:
        'Open Map [M] to find the lowest-cost Dijkstra path to Periyar Central Library.',
      targetLocation: 'library',
      requiresDijkstra: true,
      rewardPoints: 300,
      optimalDistance: 110,
      dsaConceptUsed: "Dijkstra's Algorithm — O((V + E) log V)",
    },
    {
      id: 6,
      title: 'Mission 6: Cross Curfew Finish Line at VIT Main Gate',
      instruction:
        'With ID Card, 1/1 DA Point & Gate Key verified, cross the Checkered Finish Line at VIT Main Gate to win Level 3!',
      targetLocation: 'gate',
      requiredItem: 'Gate Key',
      rewardPoints: 400,
      optimalDistance: 160,
      dsaConceptUsed: 'Full DSA Mastery & Max-Heap Champion',
    },
  ];
}

// Safe subway Y-centers where roads cross the Katpadi Railway Track (x = 545)
export const SUBWAY_CROSSING_YS: number[] = [
  280 + (250 - 280) * ((545 - 280) / (780 - 280)),
  280 + (720 - 280) * ((545 - 280) / (960 - 280)),
  860 + (720 - 860) * ((545 - 330) / (960 - 330)),
  860 + (1160 - 860) * ((545 - 330) / (1020 - 330)),
];

export function createInitialCyclists(): CyclistHazard[] {
  return [
    { id: 'cyc-1', from: 'hostel', to: 'canteen', progress: 0.62, direction: -1, speed: 0.34, color: '#EF4444', pedalPhase: 0 },
    { id: 'cyc-2', from: 'canteen', to: 'park', progress: 0.35, direction: 1, speed: 0.38, color: '#F97316', pedalPhase: 1.4 },
    { id: 'cyc-3', from: 'academic', to: 'library', progress: 0.5, direction: 1, speed: 0.42, color: '#EAB308', pedalPhase: 2.6 },
    { id: 'cyc-4', from: 'hostel', to: 'sports', progress: 0.4, direction: 1, speed: 0.33, color: '#EC4899', pedalPhase: 0.8 },
    { id: 'cyc-5', from: 'academic', to: 'lab', progress: 0.7, direction: -1, speed: 0.39, color: '#8B5CF6', pedalPhase: 3.1 },
  ];
}

export function createInitialShuttles(): VitShuttleHazard[] {
  return [
    {
      id: 'shuttle-1',
      from: 'canteen',
      to: 'academic',
      progress: 0.2,
      direction: 1,
      baseSpeed: 0.28,
      state: 'CRUISE',
      stateTimer: 0,
      color: '#0EA5E9',
    },
    {
      id: 'shuttle-2',
      from: 'park',
      to: 'library',
      progress: 0.75,
      direction: -1,
      baseSpeed: 0.26,
      state: 'CRUISE',
      stateTimer: 0,
      color: '#10B981',
    },
    {
      id: 'shuttle-3',
      from: 'library',
      to: 'gate',
      progress: 0.3,
      direction: 1,
      baseSpeed: 0.31,
      state: 'CRUISE',
      stateTimer: 0,
      color: '#F59E0B',
    },
    {
      id: 'shuttle-4',
      from: 'auditorium',
      to: 'gate',
      progress: 0.65,
      direction: -1,
      baseSpeed: 0.29,
      state: 'CRUISE',
      stateTimer: 0,
      color: '#06B6D4',
    },
  ];
}

export function createGuardsForLevel(level: 1 | 2 | 3): RedTagGuard[] {
  const chaserSpeed = level === 1 ? 158 : level === 2 ? 176 : 194;
  const guards: RedTagGuard[] = [
    // Primary No-ID Security Guard who actively runs after Maddy until he collects his VIT ID Card!
    {
      id: 'guard-chaser-1',
      name: 'VIT ID Security Chaser',
      waypoints: [
        { x: 480, y: 270 },
        { x: 690, y: 265 },
        { x: 690, y: 460 },
        { x: 470, y: 460 },
      ],
      targetWpIndex: 1,
      x: 475,
      y: 250,
      facingAngle: Math.PI,
      state: 'CHASE_NO_ID',
      stateTimer: 0,
      lungeDirX: -1,
      lungeDirY: 0,
      unlockAtMissionIndex: 0,
      isNoIdChaser: true,
      chaseSpeed: chaserSpeed,
    },
    {
      id: 'guard-tt',
      name: 'Red-Tag Patrol (TT)',
      waypoints: [
        { x: 1080, y: 265 },
        { x: 1210, y: 410 },
        { x: 1440, y: 405 },
        { x: 1240, y: 245 },
      ],
      targetWpIndex: 1,
      x: 1080,
      y: 265,
      facingAngle: 0,
      state: 'PATROL',
      stateTimer: 0,
      lungeDirX: 1,
      lungeDirY: 0,
      unlockAtMissionIndex: 0,
    },
    {
      id: 'guard-lib',
      name: 'Red-Tag Warden (Periyar)',
      waypoints: [
        { x: 1450, y: 540 },
        { x: 1740, y: 560 },
        { x: 1750, y: 880 },
        { x: 1460, y: 860 },
      ],
      targetWpIndex: 1,
      x: 1450,
      y: 540,
      facingAngle: 0,
      state: 'PATROL',
      stateTimer: 0,
      lungeDirX: 1,
      lungeDirY: 0,
      unlockAtMissionIndex: level === 1 ? 2 : 0,
    },
    {
      id: 'guard-gate',
      name: 'Chief Red-Tag (Gate 1)',
      waypoints: [
        { x: 1660, y: 980 },
        { x: 1920, y: 980 },
        { x: 1710, y: 1160 },
      ],
      targetWpIndex: 1,
      x: 1660,
      y: 980,
      facingAngle: 0,
      state: 'PATROL',
      stateTimer: 0,
      lungeDirX: 1,
      lungeDirY: 0,
      unlockAtMissionIndex: level === 1 ? 4 : 1,
    },
  ];

  // Levels 2 & 3 add a second flanking Security Chaser until Maddy gets his VIT ID Card!
  if (level >= 2) {
    guards.push({
      id: 'guard-chaser-2',
      name: 'VIT Squad Chaser',
      waypoints: [
        { x: 520, y: 680 },
        { x: 820, y: 690 },
        { x: 820, y: 860 },
      ],
      targetWpIndex: 1,
      x: 520,
      y: 660,
      facingAngle: -Math.PI / 2,
      state: 'CHASE_NO_ID',
      stateTimer: 0,
      lungeDirX: 0,
      lungeDirY: -1,
      unlockAtMissionIndex: 0,
      isNoIdChaser: true,
      chaseSpeed: chaserSpeed - 12,
    });
  }

  return guards;
}

export function createInitialSprinklers(): SprinklerHazard[] {
  return [
    { id: 'spr-1', x: 875, y: 495, radius: 78, angle: 0, state: 'IDLE', timer: 1.8 },
    { id: 'spr-2', x: 1485, y: 515, radius: 82, angle: 1.2, state: 'TELEGRAPH', timer: 0.9 },
    { id: 'spr-3', x: 1390, y: 955, radius: 80, angle: 2.1, state: 'SPRAY', timer: 2.4 },
  ];
}

export function createInitialTrain(): ExpressTrainState {
  return {
    state: 'CLEAR',
    timer: 4.0,
    y: -360,
    direction: 1,
  };
}

/**
 * 3-Question Faculty Viva / Assignment Submission DSA Quiz per VIT Level
 */
export const ASSIGNMENT_QUIZ_BY_LEVEL: Record<1 | 2 | 3, DSAQuizQuestion[]> = {
  1: [
    {
      id: 'l1-q1',
      conceptTag: 'Hash Table · O(1) Lookup',
      question:
        'When Maddy submits his Digital Assignment at Technology Tower, which data structure verifies his "ID Card" and "Assignment" in O(1) average time?',
      options: [
        'Hash Table with Separate Chaining',
        'Singly Linked List linear scan',
        'Bubble Sort array pass',
        'Unweighted Binary Tree',
      ],
      correctIndex: 0,
      explanation:
        'HashTable computes h = (h * 31 + charCode) % 8 to jump directly to the item bucket in O(1) average time!',
    },
    {
      id: 'l1-q2',
      conceptTag: 'Graph & Dijkstra',
      question:
        'In the VIT Campus map, each building is a Vertex and each paved road with distance in meters (e.g., 120m) is represented as:',
      options: [
        'A LIFO Stack frame',
        'A Weighted Edge in an Adjacency List Graph',
        'A Hash collision bucket',
        'A Leaf node in a Heap',
      ],
      correctIndex: 1,
      explanation:
        'Campus buildings are Graph vertices (V = 9) connected by undirected weighted edges (E = 15) stored in an Adjacency List.',
    },
    {
      id: 'l1-q3',
      conceptTag: 'Stack · LIFO Undo',
      question:
        'When Maddy presses [Z] to rewind to his most recent campus checkpoint, which data structure and operation power the Undo feature?',
      options: [
        'Queue — dequeue() from front',
        'Stack — pop() the most recently pushed checkpoint (LIFO)',
        'BFS — level-order hop',
        'Quick Sort — pivot partition',
      ],
      correctIndex: 1,
      explanation:
        'A Stack follows Last-In, First-Out (LIFO), so pop() always restores Maddy’s latest movement snapshot in O(1) time!',
    },
  ],
  2: [
    {
      id: 'l2-q1',
      conceptTag: 'Queue · FIFO Missions',
      question:
        'Maddy’s VIT missions must be completed strictly in sequential arrival order (Mission 1 → Mission 2 → ...). Which data structure enforces this?',
      options: [
        'Queue — First-In, First-Out (enqueue & dequeue)',
        'Stack — Last-In, First-Out',
        'Max-Heap — highest priority first',
        'DFS Recursion Stack',
      ],
      correctIndex: 0,
      explanation:
        'A FIFO Queue ensures the front-most mission must be dequeued before advancing to the next campus task.',
    },
    {
      id: 'l2-q2',
      conceptTag: 'Dijkstra vs BFS',
      question:
        'Why does Dijkstra choose Hostel → Foodys → TT → Library (360m, 3 hops) instead of Hostel → Lake Park → Library (410m, 2 hops)?',
      options: [
        'Dijkstra minimizes total edge weight (360m < 410m), while BFS minimizes hop count',
        'Dijkstra explores randomly',
        'BFS only works on disconnected graphs',
        'Dijkstra ignores road distances',
      ],
      correctIndex: 0,
      explanation:
        'BFS finds the fewest edges (2 hops = 410m), whereas Dijkstra relaxes cumulative weights to guarantee minimum distance (360m)!',
    },
    {
      id: 'l2-q3',
      conceptTag: 'Separate Chaining',
      question:
        'If "ID Card" and "Key" hash to the same bucket index in Maddy’s 8-bucket Inventory Hash Table, how is the collision handled?',
      options: [
        'The older item is overwritten and lost',
        'Separate Chaining stores both key-value pairs in that bucket’s chain',
        'The game restarts the Hash Table',
        'Binary Search is run on the string',
      ],
      correctIndex: 1,
      explanation:
        'Separate Chaining maintains a small list/chain inside each bucket so multiple colliding keys coexist safely.',
    },
  ],
  3: [
    {
      id: 'l3-q1',
      conceptTag: 'Priority Queue · Max-Heap',
      question:
        'On the VIT Leaderboard, which data structure keeps the highest-scoring student at index 0 and extracts the #1 rank in O(log n) time?',
      options: [
        'Binary Max-Heap (Priority Queue)',
        'FIFO Queue',
        'Adjacency Matrix',
        'Linear Search Array',
      ],
      correctIndex: 0,
      explanation:
        'A Binary Max-Heap maintains parent >= children, giving O(1) peek at #1 and O(log n) insertion/extraction.',
    },
    {
      id: 'l3-q2',
      conceptTag: 'DFS · Campus Item Scan',
      question:
        'When Maddy clicks "DFS Item Scan" to locate uncollected keys and items across VIT, how does Depth-First Search traverse the graph?',
      options: [
        'Explores deep along each campus branch before backtracking — O(V + E)',
        'Only checks 1-hop neighbors and stops',
        'Sorts buildings alphabetically',
        'Requires negative edge weights',
      ],
      correctIndex: 0,
      explanation:
        'DFS plunges as deep as possible down unvisited neighbor paths before backtracking, visiting every reachable building in O(V + E).',
    },
    {
      id: 'l3-q3',
      conceptTag: 'Sorting · Merge Sort',
      question:
        'Which Divide-and-Conquer sorting algorithm used in the Leaderboard guarantees O(n log n) time complexity even in the worst case?',
      options: [
        'Bubble Sort — O(n²)',
        'Merge Sort — O(n log n)',
        'Selection Sort — O(n²)',
        'Bogo Sort',
      ],
      correctIndex: 1,
      explanation:
        'Merge Sort recursively splits the leaderboard in half and merges sorted halves in O(n log n) worst-case time!',
    },
  ],
};


