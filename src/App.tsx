/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { AssignmentQuizModal } from './components/AssignmentQuizModal';
import { DijkstraModal } from './components/DijkstraModal';
import { DSAConceptsModal } from './components/DSAConceptsModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { HUD } from './components/HUD';
import { InventoryModal } from './components/InventoryModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MissionModal } from './components/MissionModal';
import { EndScreenModal, PauseModal } from './components/PauseAndVictoryModals';
import { TitleScreen } from './components/TitleScreen';
import {
  ASSIGNMENT_QUIZ_BY_LEVEL,
  BUILDING_MAP,
  BUILDING_NAMES,
  buildCampusGraph,
  CAMPUS_BUILDINGS,
  CAMPUS_LEVELS,
  createGuardsForLevel,
  createInitialCyclists,
  createInitialShuttles,
  createInitialSprinklers,
  createInitialTrain,
  createItemsForLevel,
  DashAfterimage,
  FloatingTextPopup,
  getMissionsForLevel,
  SEED_LEADERBOARD,
  SUBWAY_CROSSING_YS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './data/campusData';
import { bfsExploreCampus } from './dsa/BFS';
import { dfsItemSearch } from './dsa/DFS';
import { runDijkstra } from './dsa/Dijkstra';
import { HashTable } from './dsa/HashTable';
import { LeaderboardMaxHeap } from './dsa/MaxHeap';
import { Queue } from './dsa/Queue';
import { Stack } from './dsa/Stack';
import {
  Particle,
  renderCampusScene,
  renderMiniMap,
  RenderSimulationState,
} from './game/CampusRenderer';
import {
  ActiveScreen,
  CampusNodeId,
  CloudSavePayload,
  CollectibleItem,
  LeaderboardEntry,
  Mission,
  MovementSnapshot,
} from './types/game';

const LEADERBOARD_STORAGE_KEY = 'campus_escape_vit_maddy_leaderboard_v1';

function loadInitialLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to seed entries
  }
  return SEED_LEADERBOARD;
}

function getNearestBuilding(x: number, y: number): CampusNodeId {
  let bestId: CampusNodeId = 'hostel';
  let bestDist = Infinity;
  for (const b of CAMPUS_BUILDINGS) {
    const d = Math.hypot(x - b.x, y - b.y);
    if (d < bestDist) {
      bestDist = d;
      bestId = b.id;
    }
  }
  return bestId;
}

function getInsideBuilding(x: number, y: number): CampusNodeId | null {
  for (const b of CAMPUS_BUILDINGS) {
    const pad = 26;
    if (
      Math.abs(x - b.x) <= b.width / 2 + pad &&
      Math.abs(y - b.y) <= b.height / 2 + pad
    ) {
      return b.id;
    }
  }
  return null;
}

function isInsideSafeSubway(x: number, y: number): boolean {
  if (Math.abs(x - 545) > 34) return false;
  return SUBWAY_CROSSING_YS.some((sy) => Math.abs(y - sy) <= 28);
}

export default function App() {
  const [screen, setScreen] = useState<ActiveScreen>('PLAYING');
  const returnScreenRef = useRef<'TITLE' | 'PLAYING'>('PLAYING');
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1);
  const currentLevelRef = useRef<1 | 2 | 3>(1);
  currentLevelRef.current = currentLevel;

  // Core DSA Engine Instances
  const campusGraph = useMemo(() => buildCampusGraph(), []);
  const movementStackRef = useRef<Stack<MovementSnapshot>>(new Stack<MovementSnapshot>(40));
  const missionQueueRef = useRef<Queue<Mission>>(new Queue<Mission>());
  const inventoryHashRef = useRef<HashTable<CollectibleItem>>(new HashTable<CollectibleItem>(8));

  // React UI Mirror States
  const [health, setHealth] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [currentLocation, setCurrentLocation] = useState<CampusNodeId | null>('hostel');
  const [completedMissions, setCompletedMissions] = useState<Mission[]>([]);
  const [queuedMissions, setQueuedMissions] = useState<Mission[]>(() => getMissionsForLevel(1));
  const [undoCount, setUndoCount] = useState<number>(0);
  const [inventoryVersion, setInventoryVersion] = useState<number>(0);
  const [itemsState, setItemsState] = useState<CollectibleItem[]>(() => createItemsForLevel(1));
  const [highlightedPath, setHighlightedPath] = useState<CampusNodeId[]>([]);
  const [highlightedPathCost, setHighlightedPathCost] = useState<number | null>(null);
  const [showGraphWeights, setShowGraphWeights] = useState<boolean>(false);
  const [bfsLevelsState, setBfsLevelsState] = useState<Record<string, number> | null>(null);
  const [activeAlgorithmLog, setActiveAlgorithmLog] = useState<string>(
    'ALERT: Security Guard chasing Maddy! Grab Assignment & reach Foodys for your VIT ID Card!'
  );
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicOn, setIsMusicOn] = useState<boolean>(true);
  const [dashReady, setDashReady] = useState<boolean>(true);
  const [keyPauseRemaining, setKeyPauseRemaining] = useState<number>(0);
  const [assignmentSubmitted, setAssignmentSubmitted] = useState<boolean>(false);
  const assignmentSubmittedRef = useRef<boolean>(false);
  assignmentSubmittedRef.current = assignmentSubmitted;
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>(
    loadInitialLeaderboard
  );
  const [hasSubmittedScore, setHasSubmittedScore] = useState<boolean>(false);
  const [routeEfficiency, setRouteEfficiency] = useState<number>(100);
  const [currentLegDistance, setCurrentLegDistance] = useState<number>(0);

  // Canvas & Mutable 60fps Simulation Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniMapRef = useRef<HTMLCanvasElement | null>(null);
  const heldKeysRef = useRef<Set<string>>(new Set());
  const screenRef = useRef<ActiveScreen>('PLAYING');
  screenRef.current = screen;

  const simRef = useRef({
    playerX: 280,
    playerY: 385,
    playerVx: 0,
    playerVy: 0,
    knockbackVx: 0,
    knockbackVy: 0,
    facingAngle: 0,
    walkCycle: 0,
    footstepCounter: 0,
    squashX: 1,
    squashY: 1,
    hitFlashTimer: 0,
    invulnTimer: 0,
    hitstopTimer: 0,
    dashActiveTimer: 0,
    dashCooldownTimer: 0,
    dashDirX: 1,
    dashDirY: 0,
    dodgeRewardCooldown: 0,
    soakedTimer: 0,
    keyPauseTimer: 0,
    lastFreezeTickSec: 4,
    savedCheckpointUsed: false,
    chaiRefillCooldown: 0,
    whistleCooldown: 1.2,
    cameraX: 0,
    cameraY: 0,
    shakeIntensity: 0,
    timeSec: 0,
    runElapsedSec: 0,
    health: 100,
    score: 0,
    completedMissionCount: 0,
    totalOptimalDist: 0,
    totalWalkedDist: 0,
    legWalkedDist: 0,
    lastCheckpointX: 280,
    lastCheckpointY: 385,
    currentLocation: 'hostel' as CampusNodeId | null,
    items: createItemsForLevel(1),
    cyclists: createInitialCyclists(),
    shuttles: createInitialShuttles(),
    guards: createGuardsForLevel(1),
    sprinklers: createInitialSprinklers(),
    train: createInitialTrain(),
    particles: [] as Particle[],
    popups: [] as FloatingTextPopup[],
    dashAfterimages: [] as DashAfterimage[],
    highlightedPath: [] as CampusNodeId[],
    bfsLevels: null as Record<string, number> | null,
    dfsPingLocations: [] as CampusNodeId[],
    dfsPingTimer: 0,
    showGraphWeights: false,
    interactionHint: null as string | null,
    clickTarget: null as { x: number; y: number } | null,
  });

  useEffect(() => {
    simRef.current.highlightedPath = highlightedPath;
  }, [highlightedPath]);

  useEffect(() => {
    simRef.current.bfsLevels = bfsLevelsState;
  }, [bfsLevelsState]);

  useEffect(() => {
    simRef.current.showGraphWeights = showGraphWeights;
  }, [showGraphWeights]);

  const spawnParticles = useCallback(
    (x: number, y: number, color: string, count = 14) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const speed = 45 + Math.random() * 105;
        simRef.current.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.42 + Math.random() * 0.25,
          maxLife: 0.68,
          color,
          size: 3 + Math.random() * 3,
        });
      }
    },
    []
  );

  const spawnPopup = useCallback((x: number, y: number, text: string, color: string) => {
    simRef.current.popups.push({
      x,
      y: y - 24,
      text,
      color,
      life: 1.05,
      maxLife: 1.05,
    });
  }, []);

  // Initialize or Reset a Level Run
  const startNewGame = useCallback((levelOverride?: 1 | 2 | 3) => {
    const lvl = levelOverride || currentLevelRef.current;
    setCurrentLevel(lvl);
    currentLevelRef.current = lvl;

    const levelCfg = CAMPUS_LEVELS.find((c) => c.level === lvl)!;
    const freshItems = createItemsForLevel(lvl);
    const levelMissions = getMissionsForLevel(lvl);

    movementStackRef.current.clear();
    missionQueueRef.current.clear();
    inventoryHashRef.current.clear();

    for (const m of levelMissions) {
      missionQueueRef.current.enqueue(m);
    }

    const startX = 280;
    const startY = 385;
    movementStackRef.current.push({
      x: startX,
      y: startY,
      locationId: 'hostel',
      timestamp: Date.now(),
      label: 'MH Hostel Spawn',
    });

    const s = simRef.current;
    s.playerX = startX;
    s.playerY = startY;
    s.playerVx = 0;
    s.playerVy = 0;
    s.knockbackVx = 0;
    s.knockbackVy = 0;
    s.facingAngle = 0;
    s.walkCycle = 0;
    s.footstepCounter = 0;
    s.squashX = 1;
    s.squashY = 1;
    s.hitFlashTimer = 0;
    s.invulnTimer = 0.8;
    s.hitstopTimer = 0;
    s.dashActiveTimer = 0;
    s.dashCooldownTimer = 0;
    s.dodgeRewardCooldown = 0;
    s.soakedTimer = 0;
    s.keyPauseTimer = 0;
    s.lastFreezeTickSec = 4;
    s.savedCheckpointUsed = false;
    s.chaiRefillCooldown = 0;
    s.whistleCooldown = 0.9;
    s.shakeIntensity = 0;
    s.runElapsedSec = 0;
    s.health = 100;
    s.score = 0;
    s.completedMissionCount = 0;
    s.totalOptimalDist = 0;
    s.totalWalkedDist = 0;
    s.legWalkedDist = 0;
    s.lastCheckpointX = startX;
    s.lastCheckpointY = startY;
    s.currentLocation = 'hostel';
    s.items = freshItems;
    s.cyclists = createInitialCyclists();
    s.shuttles = createInitialShuttles();
    s.guards = createGuardsForLevel(lvl);
    s.sprinklers = createInitialSprinklers();
    s.train = createInitialTrain();
    s.particles = [];
    s.popups = [];
    s.dashAfterimages = [];
    s.highlightedPath = [];
    s.bfsLevels = null;
    s.dfsPingLocations = [];
    s.dfsPingTimer = 0;
    s.clickTarget = null;

    soundEngine.setTimeFrozen(false);
    soundEngine.setChaseMode(true); // Security Guard starts chasing Maddy until he gets his ID Card!

    setHealth(100);
    setScore(0);
    setElapsedSec(0);
    setCurrentLocation('hostel');
    setCompletedMissions([]);
    setQueuedMissions(missionQueueRef.current.toArray());
    setUndoCount(movementStackRef.current.size());
    setItemsState([...freshItems]);
    setInventoryVersion((v) => v + 1);
    setHighlightedPath([]);
    setHighlightedPathCost(null);
    setBfsLevelsState(null);
    setDashReady(true);
    setKeyPauseRemaining(0);
    setAssignmentSubmitted(false);
    assignmentSubmittedRef.current = false;
    setHasSubmittedScore(false);
    setRouteEfficiency(100);
    setCurrentLegDistance(0);
    setActiveAlgorithmLog(
      `${levelCfg.name} · ${levelCfg.subtitle}`
    );

    returnScreenRef.current = 'PLAYING';
    setScreen('PLAYING');
    heldKeysRef.current.clear();
  }, []);

  useEffect(() => {
    startNewGame(1);
  }, [startNewGame]);

  const navigateToScreen = useCallback((next: ActiveScreen) => {
    heldKeysRef.current.clear();
    simRef.current.clickTarget = null;
    if (next === 'TITLE') {
      returnScreenRef.current = 'TITLE';
    } else if (next === 'PLAYING') {
      returnScreenRef.current = 'PLAYING';
    }
    setScreen(next);
  }, []);

  const closeSubModal = useCallback(() => {
    heldKeysRef.current.clear();
    setScreen(returnScreenRef.current);
  }, []);

  // Trigger Maddy's Invulnerable Dodge Dash (Shortcut: Shift)
  const triggerDash = useCallback(() => {
    const s = simRef.current;
    if (s.dashCooldownTimer > 0 || s.dashActiveTimer > 0) return;

    soundEngine.unlockAudio();
    soundEngine.playDash();

    const dirX = Math.cos(s.facingAngle);
    const dirY = Math.sin(s.facingAngle);
    s.dashDirX = dirX;
    s.dashDirY = dirY;
    s.dashActiveTimer = 0.22;
    s.dashCooldownTimer = 1.25;
    s.invulnTimer = Math.max(s.invulnTimer, 0.26);
    s.squashX = 1.42;
    s.squashY = 0.72;
    setDashReady(false);

    spawnParticles(s.playerX, s.playerY, '#38BDF8', 12);
  }, [spawnParticles]);

  // Complete current front mission from FIFO Queue
  const completeFrontMission = useCallback(
    (extraLog?: string) => {
      const finished = missionQueueRef.current.dequeue();
      if (!finished) return;

      const s = simRef.current;
      const ratio =
        s.legWalkedDist <= finished.optimalDistance * 2.2
          ? 1
          : Math.max(0.4, (finished.optimalDistance * 2.2) / s.legWalkedDist);
      const efficiencyBonus = Math.round(50 * ratio);
      const levelBonus = (currentLevelRef.current - 1) * 40;
      const totalEarned = finished.rewardPoints + efficiencyBonus + levelBonus;

      s.score += totalEarned;
      s.completedMissionCount += 1;
      s.totalOptimalDist += finished.optimalDistance * 1.8;
      s.totalWalkedDist += Math.max(finished.optimalDistance, s.legWalkedDist);
      s.legWalkedDist = 0;

      const effPct = Math.min(
        100,
        Math.max(55, Math.round((s.totalOptimalDist / Math.max(1, s.totalWalkedDist)) * 100))
      );

      setScore(s.score);
      setRouteEfficiency(effPct);
      setCompletedMissions((prev) => [...prev, finished]);
      const remaining = missionQueueRef.current.toArray();
      setQueuedMissions(remaining);

      spawnParticles(s.playerX, s.playerY, '#10B981', 22);
      spawnPopup(s.playerX, s.playerY, `MISSION CLEAR +${totalEarned}`, '#34D399');

      if (remaining.length === 0) {
        soundEngine.setTimeFrozen(false);
        soundEngine.setChaseMode(false);
        soundEngine.playVictory();
        setActiveAlgorithmLog(
          `Level ${currentLevelRef.current} Cleared! Queue Empty — Final Score ${s.score} pts!`
        );
        setScreen('VICTORY');
      } else {
        soundEngine.playMissionComplete();
        const nextFront = remaining[0];
        setActiveAlgorithmLog(
          extraLog ||
            `Queue.dequeue() → Completed "${finished.title}" (+${totalEarned} pts) · Next: ${nextFront.title}`
        );

        if (nextFront.requiresDijkstra) {
          const origin = s.currentLocation || getNearestBuilding(s.playerX, s.playerY);
          const dj = runDijkstra(campusGraph, origin, nextFront.targetLocation, BUILDING_NAMES);
          setHighlightedPath(dj.path);
          setHighlightedPathCost(dj.totalCost);
          setActiveAlgorithmLog(
            `Dijkstra Route Ready: ${dj.path.map((n) => BUILDING_NAMES[n]).join(' → ')} (${dj.totalCost}m)`
          );
        }
      }
    },
    [campusGraph, spawnParticles, spawnPopup]
  );

  // Collect an item into Separate Chaining Hash Table
  const collectItem = useCallback(
    (item: CollectibleItem) => {
      if (item.collected) return;
      item.collected = true;
      const bucketIdx = inventoryHashRef.current.set(item.name, item);

      const s = simRef.current;
      s.score += item.points;
      s.squashX = 1.3;
      s.squashY = 0.74;

      if (item.iconType === 'chai') {
        s.health = Math.min(100, s.health + 32);
        setHealth(s.health);
        soundEngine.playPickup();
        spawnPopup(item.x, item.y, '+32 HP CHAI!', '#34D399');
      } else if (item.name === 'ID Card') {
        // ID CARD PICKED UP! Call off all No-ID Security Guard Chasers immediately!
        soundEngine.playIdVerified();
        soundEngine.setChaseMode(false);
        for (const g of s.guards) {
          if (g.isNoIdChaser && g.state === 'CHASE_NO_ID') {
            g.state = 'PATROL';
            spawnParticles(g.x, g.y, '#10B981', 16);
          }
        }
        spawnPopup(s.playerX, s.playerY - 12, 'VIT ID VERIFIED! CHASE OFF ✓', '#38BDF8');
      } else if (item.iconType === 'key') {
        // KEY PICKED UP! Activate 15-Second Campus Pause Time (Freezes Clock & All Hazards!)
        s.keyPauseTimer = 15.0;
        s.lastFreezeTickSec = 4;
        setKeyPauseRemaining(15);
        soundEngine.playTimeFreeze();
        soundEngine.setTimeFrozen(true);
        spawnParticles(item.x, item.y, '#38BDF8', 24);
        spawnPopup(s.playerX, s.playerY - 14, 'KEY! 15s PAUSE TIME ACTIVE ⏱', '#38BDF8');
      } else {
        soundEngine.playPickup();
        spawnPopup(item.x, item.y, `${item.name.toUpperCase()} +${item.points}`, '#FBBF24');
      }

      spawnParticles(item.x, item.y, '#F59E0B', 18);

      setScore(s.score);
      setItemsState([...s.items]);
      setInventoryVersion((v) => v + 1);
      setActiveAlgorithmLog(
        item.name === 'ID Card'
          ? `HashTable.set("ID Card") → Bucket [${bucketIdx}] in O(1)! VIT Security Guard stopped chasing Maddy!`
          : item.iconType === 'key'
          ? `HashTable.set("${item.name}") → Bucket [${bucketIdx}] in O(1)! 15s Pause Time Activated (Clock & Guards Frozen)!`
          : `HashTable.set("${item.name}") → Stored in Bucket [${bucketIdx}] in O(1) (+${item.points} pts)`
      );

      const front = missionQueueRef.current.front();
      if (front && front.collectItemTarget === item.name) {
        completeFrontMission(
          `HashTable.set("${item.name}") → Bucket [${bucketIdx}] & Queue.dequeue() Mission ${front.id}!`
        );
      }
    },
    [completeFrontMission, spawnParticles, spawnPopup]
  );

  // Finish the 3-Question Faculty DSA Viva Quiz at Technology Tower (TT)
  const handleCompleteAssignmentQuiz = useCallback(
    (firstTryCount: number) => {
      const s = simRef.current;
      const quizBonus = 150 + firstTryCount * 25;
      s.score += quizBonus;
      setScore(s.score);

      setAssignmentSubmitted(true);
      assignmentSubmittedRef.current = true;

      // Lock in Safe Respawn & LIFO Stack Checkpoint at Tech Tower DA Desk!
      s.lastCheckpointX = 1340;
      s.lastCheckpointY = 382;
      movementStackRef.current.push({
        x: 1340,
        y: 382,
        locationId: 'academic',
        timestamp: Date.now(),
        label: 'TT Saved DA Checkpoint (1/1 Pt)',
      });
      setUndoCount(movementStackRef.current.size());

      spawnParticles(s.playerX, s.playerY, '#10B981', 28);
      spawnPopup(
        s.playerX,
        s.playerY - 12,
        `DA 1/1 PT + CHECKPOINT SAVED! (+${quizBonus})`,
        '#34D399'
      );

      // Advance Mission Queue if Mission 3 (Go to TT) or Mission 4 (Submit DA) is at the front
      let front = missionQueueRef.current.front();
      if (front && front.id === 3 && front.targetLocation === 'academic' && !front.collectItemTarget) {
        completeFrontMission();
        front = missionQueueRef.current.front();
      }
      if (front && front.id === 4) {
        completeFrontMission(
          `DSA Viva Quiz Passed (${firstTryCount}/3 First-Try) → Earned 1/1 DA Point & Saved TT Checkpoint!`
        );
      } else {
        soundEngine.playMissionComplete();
        setActiveAlgorithmLog(
          `DSA Viva Quiz Passed! Earned 1/1 DA Completion Point (+${quizBonus} pts) & Saved Checkpoint at Tech Tower!`
        );
      }

      navigateToScreen('PLAYING');
    },
    [completeFrontMission, navigateToScreen, spawnParticles, spawnPopup]
  );

  // Space / E Context Action
  const triggerInteractAction = useCallback(() => {
    soundEngine.unlockAudio();
    const s = simRef.current;

    // 1. Check Foodys Hot Chai Healing Station (x: 725, y: 338)
    if (
      s.chaiRefillCooldown <= 0 &&
      s.health < 100 &&
      Math.hypot(s.playerX - 725, s.playerY - 338) <= 56
    ) {
      s.health = Math.min(100, s.health + 28);
      s.chaiRefillCooldown = 12;
      setHealth(s.health);
      soundEngine.playPickup();
      spawnParticles(725, 338, '#10B981', 14);
      spawnPopup(s.playerX, s.playerY, '+28 HP FOODYS CHAI!', '#34D399');
      return;
    }

    // 2. Check nearby uncollected item
    for (const item of s.items) {
      if (!item.collected && Math.hypot(s.playerX - item.x, s.playerY - item.y) <= 72) {
        collectItem(item);
        return;
      }
    }

    // 3. Check Technology Tower (TT) Assignment Submission & Faculty Quiz Checkpoint!
    const nearTTDesk =
      s.currentLocation === 'academic' || Math.hypot(s.playerX - 1340, s.playerY - 382) <= 76;
    if (nearTTDesk && !assignmentSubmittedRef.current) {
      const lvlMissions = getMissionsForLevel(currentLevelRef.current);
      const m4 = lvlMissions.find((m) => m.id === 4);
      const reqKey = m4?.requiredItem || 'Assignment';
      const hasReq = inventoryHashRef.current.has(reqKey);
      const hasAssignment = inventoryHashRef.current.has('Assignment');
      const hasIdCard = inventoryHashRef.current.has('ID Card');

      if (hasReq && hasAssignment && hasIdCard) {
        navigateToScreen('ASSIGNMENT_QUIZ');
      } else {
        soundEngine.playHazardBump();
        const missing = !hasIdCard
          ? 'ID Card'
          : !hasAssignment
          ? 'Assignment (MH Hostel)'
          : `${reqKey} (SJT Lab)`;
        setActiveAlgorithmLog(
          `TT Quiz Checkpoint Locked: Maddy needs ${missing} in his Hash Table first!`
        );
      }
      return;
    }

    // 4. Check VIT Main Gate Finish Line!
    const onMainGateFinish =
      s.currentLocation === 'gate' ||
      (s.playerX >= 1745 && s.playerX <= 1975 && s.playerY >= 1075 && s.playerY <= 1265);
    if (onMainGateFinish) {
      const lvlM = getMissionsForLevel(currentLevelRef.current);
      const m6 = lvlM.find((m) => m.id === 6);
      const reqKey = m6?.requiredItem || 'ID Card';

      if (!inventoryHashRef.current.has('ID Card')) {
        soundEngine.playHazardBump();
        setActiveAlgorithmLog(
          'Main Gate Finish Line Locked: Collect Maddy’s VIT ID Card first!'
        );
        return;
      }
      if (!assignmentSubmittedRef.current) {
        soundEngine.playHazardBump();
        setActiveAlgorithmLog(
          'Main Gate Finish Line Locked: Submit Assignment & Pass Quiz (0/1 Pt) at Tech Tower first!'
        );
        return;
      }
      if (!inventoryHashRef.current.has(reqKey)) {
        soundEngine.playHazardBump();
        setActiveAlgorithmLog(
          `Main Gate Finish Line Locked: Collect ${reqKey} at Anna Auditorium first!`
        );
        return;
      }

      // Drain remaining Queue up to & including Main Gate Finish Line so Maddy finishes cleanly!
      while (!missionQueueRef.current.isEmpty()) {
        completeFrontMission(
          'FINISH LINE CROSSED at VIT Main Gate! Level Complete!'
        );
      }
    }
  }, [collectItem, completeFrontMission, navigateToScreen, spawnParticles, spawnPopup]);

  // Stack Undo Feature (Shortcut: Z)
  const handleUndoMove = useCallback(() => {
    const popped = movementStackRef.current.pop();
    if (!popped) return;

    const s = simRef.current;
    spawnParticles(s.playerX, s.playerY, '#38BDF8', 14);
    s.playerX = popped.x;
    s.playerY = popped.y;
    s.knockbackVx = 0;
    s.knockbackVy = 0;
    s.lastCheckpointX = popped.x;
    s.lastCheckpointY = popped.y;
    s.currentLocation = popped.locationId;
    s.clickTarget = null;
    s.squashX = 0.8;
    s.squashY = 1.22;

    soundEngine.playUndo();
    spawnParticles(popped.x, popped.y, '#38BDF8', 14);
    spawnPopup(popped.x, popped.y, 'STACK UNDO!', '#38BDF8');

    setCurrentLocation(popped.locationId);
    setUndoCount(movementStackRef.current.size());
    setActiveAlgorithmLog(
      `Stack.pop() Undo → Rewound Maddy to ${popped.label} (${movementStackRef.current.size()} left)`
    );
  }, [spawnParticles, spawnPopup]);

  const handleRunBFSNearby = useCallback(() => {
    if (bfsLevelsState) {
      setBfsLevelsState(null);
      setActiveAlgorithmLog('Cleared BFS Nearby Radar overlay.');
      return;
    }
    const s = simRef.current;
    const origin = s.currentLocation || getNearestBuilding(s.playerX, s.playerY);
    const res = bfsExploreCampus(campusGraph, origin, 3);
    const levelLookup: Record<string, number> = {};
    for (const lvl of res.levels) {
      for (const n of lvl.nodes) {
        levelLookup[n] = lvl.level;
      }
    }
    setBfsLevelsState(levelLookup);
    soundEngine.playStepPing(2);
    const hop1 =
      res.levels
        .find((l) => l.level === 1)
        ?.nodes.map((n) => BUILDING_NAMES[n])
        .join(', ') || 'None';
    setActiveAlgorithmLog(`BFS from ${BUILDING_NAMES[origin]}: 1-Hop Neighbors = [${hop1}]`);
  }, [bfsLevelsState, campusGraph]);

  const handleRunDFSScan = useCallback(() => {
    const s = simRef.current;
    const origin = s.currentLocation || getNearestBuilding(s.playerX, s.playerY);
    const uncollectedMap: Record<string, string[]> = {};
    for (const item of s.items) {
      if (!item.collected) {
        if (!uncollectedMap[item.locationId]) uncollectedMap[item.locationId] = [];
        uncollectedMap[item.locationId].push(item.name);
      }
    }

    const res = dfsItemSearch(campusGraph, origin, uncollectedMap);
    s.dfsPingLocations = res.foundItems.map((f) => f.location);
    s.dfsPingTimer = 6.0;
    soundEngine.playStepPing(5);

    if (res.foundItems.length === 0) {
      setActiveAlgorithmLog(
        `DFS traversed all ${res.traversalOrder.length} VIT buildings: 0 uncollected items left!`
      );
    } else {
      const summary = res.foundItems
        .map((f) => `${f.itemName} @ ${BUILDING_NAMES[f.location]}`)
        .join(' · ');
      setActiveAlgorithmLog(`DFS Item Scan: Found ${summary}`);
    }
  }, [campusGraph]);

  const handleHighlightDijkstraTo = useCallback(
    (dest: CampusNodeId) => {
      const s = simRef.current;
      const origin = s.currentLocation || getNearestBuilding(s.playerX, s.playerY);
      const res = runDijkstra(campusGraph, origin, dest, BUILDING_NAMES);
      setHighlightedPath(res.path);
      setHighlightedPathCost(res.totalCost);
      soundEngine.playStepPing(4);
      setActiveAlgorithmLog(
        `Dijkstra Shortest Path: ${res.path.map((n) => BUILDING_NAMES[n]).join(' → ')} (${res.totalCost}m)`
      );
    },
    [campusGraph]
  );

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const handleToggleMusic = useCallback(() => {
    soundEngine.unlockAudio();
    setIsMusicOn((prev) => {
      const next = !prev;
      soundEngine.setMusicEnabled(next);
      return next;
    });
  }, []);

  const handleSubmitLeaderboard = useCallback(
    (playerName: string) => {
      if (hasSubmittedScore) return;
      const newEntry: LeaderboardEntry = {
        id: `run-${Date.now()}`,
        playerName,
        score,
        completionTimeSec: Math.max(1, Math.round(elapsedSec)),
        missionsCompleted: completedMissions.length,
        routeEfficiency,
        dateLabel: `Level ${currentLevel}`,
      };

      const heap = new LeaderboardMaxHeap([...leaderboardEntries, newEntry]);
      const updated = heap.extractAllRanked();
      setLeaderboardEntries(updated);
      setHasSubmittedScore(true);

      try {
        localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore quota error
      }
    },
    [
      completedMissions.length,
      currentLevel,
      elapsedSec,
      hasSubmittedScore,
      leaderboardEntries,
      routeEfficiency,
      score,
    ]
  );

  const handleRestoreCloudSave = useCallback(
    (payload: CloudSavePayload) => {
      const targetLvl: 1 | 2 | 3 =
        payload.currentLevel === 2 || payload.currentLevel === 3 ? payload.currentLevel : 1;
      startNewGame(targetLvl);

      if (typeof payload.score === 'number') {
        simRef.current.score = payload.score;
        setScore(payload.score);
      }
      if (typeof payload.health === 'number' && payload.health > 0) {
        simRef.current.health = Math.min(100, payload.health);
        setHealth(simRef.current.health);
      }
      if (typeof payload.elapsedSec === 'number') {
        simRef.current.runElapsedSec = payload.elapsedSec;
        setElapsedSec(payload.elapsedSec);
      }
      if (payload.assignmentSubmitted) {
        setAssignmentSubmitted(true);
        assignmentSubmittedRef.current = true;
      }
      if (Array.isArray(payload.leaderboardEntries) && payload.leaderboardEntries.length > 0) {
        const heap = new LeaderboardMaxHeap(payload.leaderboardEntries);
        const ranked = heap.extractAllRanked();
        setLeaderboardEntries(ranked);
        try {
          localStorage.setItem(LEADERBOARD_STORAGE_KEY, JSON.stringify(ranked));
        } catch {
          // Ignore quota error
        }
      }
      setActiveAlgorithmLog(
        `Restored Google Drive Cloud Save (Level ${targetLvl} · ${payload.score} pts)!`
      );
    },
    [startNewGame]
  );

  // Keyboard Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'select' || activeTag === 'textarea') {
        return;
      }

      soundEngine.unlockAudio();
      const key = e.key.toLowerCase();
      const curScreen = screenRef.current;

      if (curScreen === 'TITLE') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startNewGame(currentLevelRef.current);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (curScreen === 'PLAYING') {
          navigateToScreen('PAUSED');
        } else if (curScreen === 'PAUSED') {
          navigateToScreen('PLAYING');
        } else if (curScreen !== 'VICTORY' && curScreen !== 'GAME_OVER') {
          closeSubModal();
        }
        return;
      }

      if (curScreen !== 'PLAYING') {
        if (key === 'm' && curScreen === 'MAP_DIJKSTRA') closeSubModal();
        if (key === 'i' && curScreen === 'INVENTORY') closeSubModal();
        if (key === 'q' && curScreen === 'MISSIONS') closeSubModal();
        return;
      }

      if (!e.repeat) {
        if (key === 'shift') {
          e.preventDefault();
          triggerDash();
          return;
        }
        if (e.key === ' ' || key === 'e') {
          e.preventDefault();
          triggerInteractAction();
          return;
        }
        if (key === 'z') {
          e.preventDefault();
          handleUndoMove();
          return;
        }
        if (key === 'm') {
          e.preventDefault();
          navigateToScreen('MAP_DIJKSTRA');
          return;
        }
        if (key === 'i') {
          e.preventDefault();
          navigateToScreen('INVENTORY');
          return;
        }
        if (key === 'q') {
          e.preventDefault();
          navigateToScreen('MISSIONS');
          return;
        }
      }

      if (
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)
      ) {
        if (key.startsWith('arrow')) e.preventDefault();
        simRef.current.clickTarget = null;
        heldKeysRef.current.add(key);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      heldKeysRef.current.delete(e.key.toLowerCase());
    };

    const onWindowBlur = () => {
      heldKeysRef.current.clear();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onWindowBlur);
    };
  }, [
    closeSubModal,
    handleUndoMove,
    navigateToScreen,
    startNewGame,
    triggerDash,
    triggerInteractAction,
  ]);

  // Isolated 60fps VIT Campus Simulation & Hazard AI Loop
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();
    let hudSyncAccumulator = 0;

    const applyDamageToMaddy = (
      dmg: number,
      fromX: number,
      fromY: number,
      reasonLog: string,
      popupLabel: string
    ) => {
      const s = simRef.current;
      s.health = Math.max(0, s.health - dmg);
      s.invulnTimer = 1.25;
      s.hitFlashTimer = 0.38;
      s.hitstopTimer = 0.06; // Punchy 60ms simulation hitstop!
      s.shakeIntensity = 11;
      s.squashX = 1.38;
      s.squashY = 0.66;

      // Knockback impulse away from hazard
      const kx = s.playerX - fromX;
      const ky = s.playerY - fromY;
      const kmag = Math.max(1, Math.hypot(kx, ky));
      s.knockbackVx = (kx / kmag) * 340;
      s.knockbackVy = (ky / kmag) * 340;

      soundEngine.playHazardBump();
      spawnParticles(s.playerX, s.playerY, '#EF4444', 18);
      spawnPopup(s.playerX, s.playerY, popupLabel, '#F87171');
      setHealth(s.health);
      setActiveAlgorithmLog(reasonLog);

      if (s.health <= 0) {
        // Saved TT DA Checkpoint Respawn Protection!
        if (assignmentSubmittedRef.current && !s.savedCheckpointUsed) {
          s.savedCheckpointUsed = true;
          s.health = 65;
          s.playerX = 1340;
          s.playerY = 382;
          s.knockbackVx = 0;
          s.knockbackVy = 0;
          s.invulnTimer = 2.0;
          setHealth(65);
          soundEngine.playUndo();
          spawnParticles(1340, 382, '#38BDF8', 24);
          spawnPopup(1340, 370, 'SAVED TT CHECKPOINT RESPAWN! (+65 HP)', '#38BDF8');
          setActiveAlgorithmLog(
            'Saved Checkpoint Activated! Maddy respawned at Technology Tower with 65 HP!'
          );
        } else {
          soundEngine.setTimeFrozen(false);
          soundEngine.setChaseMode(false);
          setScreen('GAME_OVER');
        }
      }
    };

    const awardCloseDodge = () => {
      const s = simRef.current;
      if (s.dodgeRewardCooldown > 0) return;
      s.dodgeRewardCooldown = 1.1;
      s.score += 25;
      setScore(s.score);
      soundEngine.playCloseDodge();
      spawnParticles(s.playerX, s.playerY, '#38BDF8', 12);
      spawnPopup(s.playerX, s.playerY, 'CLOSE DODGE! +25', '#38BDF8');
    };

    const frame = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      const canvas = canvasRef.current;
      if (canvas) {
        if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }

        const ctx = canvas.getContext('2d');
        const s = simRef.current;
        const activeScr = screenRef.current;
        const lvlCfg = CAMPUS_LEVELS.find((c) => c.level === currentLevelRef.current)!;
        const difficultyMult =
          lvlCfg.hazardSpeedMultiplier * (1 + s.completedMissionCount * 0.06);
        const hasIdCard = inventoryHashRef.current.has('ID Card');
        const inSubway = isInsideSafeSubway(s.playerX, s.playerY);

        s.timeSec += dt;

        // Scenic Live-World Pan on Title Screen
        if (returnScreenRef.current === 'TITLE' && activeScr !== 'PLAYING') {
          const panCenterX = WORLD_WIDTH * 0.5 + Math.cos(s.timeSec * 0.22) * 380;
          const panCenterY = WORLD_HEIGHT * 0.5 + Math.sin(s.timeSec * 0.31) * 240;
          s.cameraX = Math.max(
            0,
            Math.min(WORLD_WIDTH - canvas.width, panCenterX - canvas.width / 2)
          );
          s.cameraY = Math.max(
            0,
            Math.min(WORLD_HEIGHT - canvas.height, panCenterY - canvas.height / 2)
          );
        }

        if (activeScr === 'PLAYING') {
          if (s.hitstopTimer > 0) {
            s.hitstopTimer -= dt;
          } else {
            // 15-Second Key Pause Time: Freezes Run Clock & All Campus Hazards!
            const wasFrozen = s.keyPauseTimer > 0;
            if (wasFrozen) {
              s.keyPauseTimer = Math.max(0, s.keyPauseTimer - dt);
              const ceilSec = Math.ceil(s.keyPauseTimer);
              if (ceilSec <= 3 && ceilSec > 0 && ceilSec < s.lastFreezeTickSec) {
                s.lastFreezeTickSec = ceilSec;
                soundEngine.playTimeTick();
              }
              if (s.keyPauseTimer <= 0) {
                soundEngine.setTimeFrozen(false);
                soundEngine.playTimeResume();
                setKeyPauseRemaining(0);
                spawnPopup(s.playerX, s.playerY - 14, '15s KEY PAUSE ENDED!', '#FBBF24');
              }
            } else {
              s.runElapsedSec += dt;
            }

            const isTimeFrozen = s.keyPauseTimer > 0;

            if (s.invulnTimer > 0) s.invulnTimer -= dt;
            if (s.hitFlashTimer > 0) s.hitFlashTimer -= dt;
            if (s.dodgeRewardCooldown > 0) s.dodgeRewardCooldown -= dt;
            if (s.soakedTimer > 0) s.soakedTimer -= dt;
            if (s.chaiRefillCooldown > 0) s.chaiRefillCooldown -= dt;
            if (s.whistleCooldown > 0) s.whistleCooldown -= dt;

            if (s.dashCooldownTimer > 0) {
              s.dashCooldownTimer -= dt;
              if (s.dashCooldownTimer <= 0) {
                setDashReady(true);
              }
            }

            if (s.dfsPingTimer > 0) {
              s.dfsPingTimer -= dt;
              if (s.dfsPingTimer <= 0) s.dfsPingLocations = [];
            }

            s.squashX += (1 - s.squashX) * Math.min(1, dt * 12);
            s.squashY += (1 - s.squashY) * Math.min(1, dt * 12);
            s.shakeIntensity = Math.max(0, s.shakeIntensity - dt * 28);

            // Decay knockback velocity
            s.knockbackVx *= Math.pow(0.015, dt);
            s.knockbackVy *= Math.pow(0.015, dt);

            // Player Movement or Active Dodge Dash
            if (s.dashActiveTimer > 0) {
              s.dashActiveTimer -= dt;
              s.playerVx = s.dashDirX * 610;
              s.playerVy = s.dashDirY * 610;

              // Spawn cyan dash ghost afterimage
              s.dashAfterimages.push({
                x: s.playerX,
                y: s.playerY,
                angle: s.facingAngle,
                alpha: 0.9,
              });
            } else {
              const keys = heldKeysRef.current;
              let moveX = 0;
              let moveY = 0;
              if (keys.has('w') || keys.has('arrowup')) moveY -= 1;
              if (keys.has('s') || keys.has('arrowdown')) moveY += 1;
              if (keys.has('a') || keys.has('arrowleft')) moveX -= 1;
              if (keys.has('d') || keys.has('arrowright')) moveX += 1;

              if (moveX === 0 && moveY === 0 && s.clickTarget) {
                const dx = s.clickTarget.x - s.playerX;
                const dy = s.clickTarget.y - s.playerY;
                const dist = Math.hypot(dx, dy);
                if (dist > 10) {
                  moveX = dx / dist;
                  moveY = dy / dist;
                } else {
                  s.clickTarget = null;
                }
              } else if (moveX !== 0 || moveY !== 0) {
                const mag = Math.hypot(moveX, moveY);
                moveX /= mag;
                moveY /= mag;
              }

              const runSpeed = s.soakedTimer > 0 ? 165 : 245;
              s.playerVx = moveX * runSpeed + s.knockbackVx;
              s.playerVy = moveY * runSpeed + s.knockbackVy;
            }

            // Apply Maddy Position
            const speedMag = Math.hypot(s.playerVx, s.playerVy);
            if (speedMag > 4) {
              const stepDist = speedMag * dt;
              s.playerX = Math.max(42, Math.min(WORLD_WIDTH - 42, s.playerX + s.playerVx * dt));
              s.playerY = Math.max(42, Math.min(WORLD_HEIGHT - 42, s.playerY + s.playerVy * dt));

              if (s.dashActiveTimer <= 0 && Math.hypot(s.knockbackVx, s.knockbackVy) < 40) {
                s.facingAngle = Math.atan2(s.playerVy, s.playerVx);
              }
              s.walkCycle += dt * 1.15;
              s.legWalkedDist += stepDist * 0.42;

              // Subtle rhythmic footstep dust & tap sound
              if (Math.floor(s.walkCycle * 3.8) > s.footstepCounter) {
                s.footstepCounter = Math.floor(s.walkCycle * 3.8);
                soundEngine.playFootstep(s.footstepCounter);
                s.particles.push({
                  x: s.playerX,
                  y: s.playerY + 11,
                  vx: (Math.random() - 0.5) * 18,
                  vy: (Math.random() - 0.5) * 18,
                  life: 0.24,
                  maxLife: 0.24,
                  color: 'rgba(148, 163, 184, 0.55)',
                  size: 2.6,
                });
              }

              // Push Stack Undo Checkpoint
              if (
                Math.hypot(s.playerX - s.lastCheckpointX, s.playerY - s.lastCheckpointY) >=
                210
              ) {
                const nearB = getNearestBuilding(s.playerX, s.playerY);
                movementStackRef.current.push({
                  x: s.lastCheckpointX,
                  y: s.lastCheckpointY,
                  locationId: s.currentLocation,
                  timestamp: Date.now(),
                  label: `Near ${BUILDING_NAMES[nearB]}`,
                });
                s.lastCheckpointX = s.playerX;
                s.lastCheckpointY = s.playerY;
                setUndoCount(movementStackRef.current.size());
              }
            } else {
              s.walkCycle = 0;
            }

            // Update Dash Ghost Afterimages
            for (let i = s.dashAfterimages.length - 1; i >= 0; i--) {
              s.dashAfterimages[i].alpha -= dt * 4.2;
              if (s.dashAfterimages[i].alpha <= 0) {
                s.dashAfterimages.splice(i, 1);
              }
            }

            // Detect Entering VIT Buildings
            const insideLoc = getInsideBuilding(s.playerX, s.playerY);
            if (insideLoc !== s.currentLocation) {
              const prevLoc = s.currentLocation;
              s.currentLocation = insideLoc;
              setCurrentLocation(insideLoc);

              if (insideLoc && insideLoc !== prevLoc) {
                soundEngine.playEnterBuilding();
                movementStackRef.current.push({
                  x: s.playerX,
                  y: s.playerY,
                  locationId: insideLoc,
                  timestamp: Date.now(),
                  label: BUILDING_NAMES[insideLoc],
                });
                s.lastCheckpointX = s.playerX;
                s.lastCheckpointY = s.playerY;
                setUndoCount(movementStackRef.current.size());

                // Crossing VIT Main Gate Finish Line!
                if (insideLoc === 'gate') {
                  const lvlM = getMissionsForLevel(currentLevelRef.current);
                  const m6 = lvlM.find((m) => m.id === 6);
                  const reqKey = m6?.requiredItem || 'ID Card';
                  if (
                    assignmentSubmittedRef.current &&
                    inventoryHashRef.current.has('ID Card') &&
                    inventoryHashRef.current.has(reqKey)
                  ) {
                    spawnParticles(1860, 1215, '#FBBF24', 32);
                    spawnPopup(s.playerX, s.playerY - 16, 'FINISH LINE CROSSED! ★', '#FBBF24');
                    while (!missionQueueRef.current.isEmpty()) {
                      completeFrontMission(
                        'FINISH LINE CROSSED at VIT Main Gate! Level Complete!'
                      );
                    }
                  } else if (!inventoryHashRef.current.has('ID Card')) {
                    setActiveAlgorithmLog(
                      'Main Gate Finish Line Locked: Collect Maddy’s VIT ID Card first!'
                    );
                  } else if (!assignmentSubmittedRef.current) {
                    setActiveAlgorithmLog(
                      'Main Gate Finish Line Locked: Submit DA & Pass Quiz (0/1 Pt) at Tech Tower first!'
                    );
                  } else {
                    setActiveAlgorithmLog(
                      `Main Gate Finish Line Locked: Missing ${reqKey}!`
                    );
                  }
                } else {
                  const front = missionQueueRef.current.front();
                  if (front && front.targetLocation === insideLoc) {
                    if (!front.collectItemTarget && !front.requiredItem) {
                      completeFrontMission();
                      const nextFront = missionQueueRef.current.front();
                      if (nextFront && nextFront.id === 4 && assignmentSubmittedRef.current) {
                        completeFrontMission();
                      }
                    } else if (front.id === 4 && assignmentSubmittedRef.current) {
                      completeFrontMission();
                    }
                  }
                }
              }
            }

            // Direct Finish Strip Crossing Check (in case Maddy already stood inside Gate or crosses the Checkered Strip)
            if (
              screenRef.current === 'PLAYING' &&
              s.playerX >= 1765 &&
              s.playerX <= 1955 &&
              s.playerY >= 1155 &&
              s.playerY <= 1245 &&
              assignmentSubmittedRef.current &&
              inventoryHashRef.current.has('ID Card')
            ) {
              const lvlM = getMissionsForLevel(currentLevelRef.current);
              const m6 = lvlM.find((m) => m.id === 6);
              const reqKey = m6?.requiredItem || 'ID Card';
              if (inventoryHashRef.current.has(reqKey) && !missionQueueRef.current.isEmpty()) {
                spawnParticles(1860, 1215, '#FBBF24', 32);
                spawnPopup(s.playerX, s.playerY - 16, 'FINISH LINE CROSSED! ★', '#FBBF24');
                while (!missionQueueRef.current.isEmpty()) {
                  completeFrontMission(
                    'FINISH LINE CROSSED at VIT Main Gate! Level Complete!'
                  );
                }
              }
            }

            // Item Auto-Pickup & Context Hints
            let hint: string | null = null;
            for (const item of s.items) {
              if (item.collected) continue;
              const d = Math.hypot(s.playerX - item.x, s.playerY - item.y);
              if (d <= 36) {
                collectItem(item);
              } else if (d <= 74) {
                hint =
                  item.iconType === 'key'
                    ? `[Space] Pick up ${item.name} (15s Pause!)`
                    : `[Space] Pick up ${item.name}`;
              }
            }

            if (
              !hint &&
              s.chaiRefillCooldown <= 0 &&
              s.health < 100 &&
              Math.hypot(s.playerX - 725, s.playerY - 338) <= 56
            ) {
              hint = '[Space] Drink Foodys Chai (+28 HP)';
            }

            const nearTT =
              s.currentLocation === 'academic' ||
              Math.hypot(s.playerX - 1340, s.playerY - 382) <= 76;
            if (!hint && nearTT && !assignmentSubmittedRef.current) {
              const lvlM = getMissionsForLevel(currentLevelRef.current);
              const m4 = lvlM.find((m) => m.id === 4);
              const reqKey = m4?.requiredItem || 'Assignment';
              const ready =
                inventoryHashRef.current.has('ID Card') &&
                inventoryHashRef.current.has('Assignment') &&
                inventoryHashRef.current.has(reqKey);
              hint = ready
                ? '[Space] Submit DA & Start Viva Quiz (0/1 Pt)'
                : `Quiz Checkpoint: Need ${!inventoryHashRef.current.has('ID Card') ? 'ID Card' : reqKey}!`;
            }

            if (!hint && s.currentLocation === 'gate') {
              const lvlM = getMissionsForLevel(currentLevelRef.current);
              const m6 = lvlM.find((m) => m.id === 6);
              const reqKey = m6?.requiredItem || 'ID Card';
              if (!inventoryHashRef.current.has('ID Card')) {
                hint = 'Finish Line Locked: Collect VIT ID Card First!';
              } else if (!assignmentSubmittedRef.current) {
                hint = 'Finish Line Locked: Submit DA & Quiz at TT First!';
              } else if (!inventoryHashRef.current.has(reqKey)) {
                hint = `Finish Line Locked: Need ${reqKey}!`;
              } else {
                hint = 'Cross Checkered Strip or Press [Space] to Finish!';
              }
            }
            s.interactionHint = hint;

            // =========================================================================
            // CAMPUS HAZARDS (Completely Frozen while 30s Key Pause Time is Active!)
            // =========================================================================
            if (!isTimeFrozen) {
              // HAZARD 1: Katpadi Express Train along x = 545 (Safe inside 4 Subways!)
            const tr = s.train;
            tr.timer -= dt * difficultyMult;
            if (tr.state === 'CLEAR' && tr.timer <= 0) {
              tr.state = 'WARNING';
              tr.timer = 1.65;
              tr.direction = Math.random() > 0.5 ? 1 : -1;
              tr.y = tr.direction === 1 ? -340 : WORLD_HEIGHT + 340;
              if (Math.abs(s.playerX - 545) < 420) {
                soundEngine.playTrainHorn();
              }
            } else if (tr.state === 'WARNING' && tr.timer <= 0) {
              tr.state = 'PASSING';
              tr.timer = 3.2;
            } else if (tr.state === 'PASSING') {
              tr.y += tr.direction * 920 * dt;
              const headY = tr.y;
              const tailY = tr.y - tr.direction * 340;
              const minY = Math.min(headY, tailY) - 42;
              const maxY = Math.max(headY, tailY) + 42;

              // Check Train Collision (ONLY hits Maddy if NOT inside a Safe Subway!)
              if (
                !inSubway &&
                Math.abs(s.playerX - 545) < 30 &&
                s.playerY >= minY &&
                s.playerY <= maxY
              ) {
                if (s.dashActiveTimer > 0) {
                  awardCloseDodge();
                } else if (s.invulnTimer <= 0) {
                  applyDamageToMaddy(
                    32,
                    545,
                    s.playerY,
                    'Clipped by Katpadi Express (-32 HP)! Always cross using the SAFE SUBWAY portals!',
                    'EXPRESS HIT -32 HP!'
                  );
                }
              }

              if (
                (tr.direction === 1 && tailY > WORLD_HEIGHT + 120) ||
                (tr.direction === -1 && tailY < -120)
              ) {
                tr.state = 'CLEAR';
                tr.timer = Math.max(3.5, 6.2 / difficultyMult);
              }
            }

            // =========================================================================
            // HAZARD 2: Rush-Hour VIT Cyclists
            // =========================================================================
            for (const cyc of s.cyclists) {
              cyc.progress += cyc.speed * difficultyMult * cyc.direction * dt;
              cyc.pedalPhase += dt * 14 * difficultyMult;
              if (cyc.progress >= 1) {
                cyc.progress = 1;
                cyc.direction = -1;
              } else if (cyc.progress <= 0) {
                cyc.progress = 0;
                cyc.direction = 1;
              }

              const u = BUILDING_MAP[cyc.from];
              const v = BUILDING_MAP[cyc.to];
              const cx = u.x + (v.x - u.x) * cyc.progress;
              const cy = u.y + (v.y - u.y) * cyc.progress;
              const dist = Math.hypot(s.playerX - cx, s.playerY - cy);

              if (dist < 24) {
                if (s.dashActiveTimer > 0) {
                  awardCloseDodge();
                } else if (s.invulnTimer <= 0) {
                  applyDamageToMaddy(
                    15,
                    cx,
                    cy,
                    'Maddy collided with a speeding VIT cyclist (-15 HP)! Tap [Shift] to Dash!',
                    '-15 HP CYCLIST!'
                  );
                }
              }
            }

            // =========================================================================
            // HAZARD 3: VIT Electric Shuttles (Headlight Detection -> HONK! -> SURGE)
            // =========================================================================
            for (const sh of s.shuttles) {
              const u = BUILDING_MAP[sh.from];
              const v = BUILDING_MAP[sh.to];
              const sx = u.x + (v.x - u.x) * sh.progress;
              const sy = u.y + (v.y - u.y) * sh.progress;
              const dirAngle =
                Math.atan2(v.y - u.y, v.x - u.x) + (sh.direction === -1 ? Math.PI : 0);

              if (sh.state === 'CRUISE') {
                sh.progress += sh.baseSpeed * difficultyMult * sh.direction * dt;
                // Check if Maddy is in front of headlight cone
                const dx = s.playerX - sx;
                const dy = s.playerY - sy;
                const dist = Math.hypot(dx, dy);
                if (dist < 155) {
                  const angleDiff = Math.atan2(
                    Math.sin(Math.atan2(dy, dx) - dirAngle),
                    Math.cos(Math.atan2(dy, dx) - dirAngle)
                  );
                  if (Math.abs(angleDiff) < 0.42) {
                    sh.state = 'HONK_WINDUP';
                    sh.stateTimer = 0.36;
                    soundEngine.playShuttleHorn();
                  }
                }
              } else if (sh.state === 'HONK_WINDUP') {
                sh.stateTimer -= dt;
                sh.progress += sh.baseSpeed * 0.35 * sh.direction * dt;
                if (sh.stateTimer <= 0) {
                  sh.state = 'SURGE';
                  sh.stateTimer = 0.85;
                }
              } else if (sh.state === 'SURGE') {
                sh.stateTimer -= dt;
                sh.progress += sh.baseSpeed * 1.95 * difficultyMult * sh.direction * dt;
                if (sh.stateTimer <= 0) {
                  sh.state = 'CRUISE';
                }
              }

              if (sh.progress >= 1) {
                sh.progress = 1;
                sh.direction = -1;
                sh.state = 'CRUISE';
              } else if (sh.progress <= 0) {
                sh.progress = 0;
                sh.direction = 1;
                sh.state = 'CRUISE';
              }

              const nsx = u.x + (v.x - u.x) * sh.progress;
              const nsy = u.y + (v.y - u.y) * sh.progress;
              const sDist = Math.hypot(s.playerX - nsx, s.playerY - nsy);

              if (sDist < 28) {
                if (s.dashActiveTimer > 0) {
                  awardCloseDodge();
                } else if (s.invulnTimer <= 0) {
                  applyDamageToMaddy(
                    22,
                    nsx,
                    nsy,
                    'Bumped by a speeding VIT Shuttle (-22 HP)! Watch for HONK! telegraphs!',
                    '-22 HP SHUTTLE!'
                  );
                }
              } else if (sDist < 48 && s.dashActiveTimer > 0 && sh.state === 'SURGE') {
                awardCloseDodge();
              }
            }

            // =========================================================================
            // HAZARD 4: VIT Security Chasers (Runs Until Maddy Gets ID!) & Red-Tag Patrols
            // =========================================================================
            for (const g of s.guards) {
              if (s.completedMissionCount < g.unlockAtMissionIndex) continue;

              // Enforce No-ID Relentless Chase whenever Maddy does NOT have his ID Card!
              if (g.isNoIdChaser && !hasIdCard && g.state !== 'COOLDOWN') {
                g.state = 'CHASE_NO_ID';
              } else if (g.isNoIdChaser && hasIdCard && g.state === 'CHASE_NO_ID') {
                g.state = 'PATROL';
              }

              const dxToMaddy = s.playerX - g.x;
              const dyToMaddy = s.playerY - g.y;
              const distToMaddy = Math.hypot(dxToMaddy, dyToMaddy);

              if (g.state === 'CHASE_NO_ID') {
                // Directly pursue Maddy across VIT Campus until he picks up his ID Card!
                const angle = Math.atan2(dyToMaddy, dxToMaddy);
                g.facingAngle = angle;
                const spd = (g.chaseSpeed || 160) * (1 + s.completedMissionCount * 0.04);
                g.x += Math.cos(angle) * spd * dt;
                g.y += Math.sin(angle) * spd * dt;

                if (distToMaddy < 190 && s.whistleCooldown <= 0) {
                  s.whistleCooldown = 2.8;
                  soundEngine.playGuardWhistle();
                }

                if (distToMaddy < 25) {
                  if (s.dashActiveTimer > 0) {
                    awardCloseDodge();
                  } else if (s.invulnTimer <= 0) {
                    applyDamageToMaddy(
                      20,
                      g.x,
                      g.y,
                      'Caught by VIT Security without ID Card (-20 HP)! Hurry and grab your ID Card!',
                      'NO ID FINE -20 HP!'
                    );
                    // Brief breather cooldown so Maddy can sprint away after getting tagged
                    g.state = 'COOLDOWN';
                    g.stateTimer = 1.1;
                  }
                }
              } else if (g.state === 'PATROL') {
                const wp = g.waypoints[g.targetWpIndex];
                const wx = wp.x - g.x;
                const wy = wp.y - g.y;
                const wDist = Math.hypot(wx, wy);
                if (wDist < 12) {
                  g.targetWpIndex = (g.targetWpIndex + 1) % g.waypoints.length;
                } else {
                  g.facingAngle = Math.atan2(wy, wx);
                  const patrolSpd = 95 * difficultyMult;
                  g.x += (wx / wDist) * patrolSpd * dt;
                  g.y += (wy / wDist) * patrolSpd * dt;
                }

                // Check Vision Cone for Red-Tag Whistle Lunge!
                if (distToMaddy < 142) {
                  const angleToPlayer = Math.atan2(dyToMaddy, dxToMaddy);
                  const diff = Math.atan2(
                    Math.sin(angleToPlayer - g.facingAngle),
                    Math.cos(angleToPlayer - g.facingAngle)
                  );
                  if (Math.abs(diff) < 0.48) {
                    g.state = 'WINDUP';
                    g.stateTimer = 0.48;
                    g.facingAngle = angleToPlayer;
                    g.lungeDirX = Math.cos(angleToPlayer);
                    g.lungeDirY = Math.sin(angleToPlayer);
                    soundEngine.playGuardWhistle();
                  }
                }
              } else if (g.state === 'WINDUP') {
                g.stateTimer -= dt;
                if (g.stateTimer <= 0) {
                  g.state = 'LUNGE';
                  g.stateTimer = 0.42;
                }
              } else if (g.state === 'LUNGE') {
                g.stateTimer -= dt;
                const lungeSpd = 385 * difficultyMult;
                g.x = Math.max(45, Math.min(WORLD_WIDTH - 45, g.x + g.lungeDirX * lungeSpd * dt));
                g.y = Math.max(45, Math.min(WORLD_HEIGHT - 45, g.y + g.lungeDirY * lungeSpd * dt));

                const newDist = Math.hypot(s.playerX - g.x, s.playerY - g.y);
                if (newDist < 26) {
                  if (s.dashActiveTimer > 0) {
                    awardCloseDodge();
                  } else if (s.invulnTimer <= 0) {
                    applyDamageToMaddy(
                      24,
                      g.x,
                      g.y,
                      `Intercepted by ${g.name} (-24 HP)! Dodge perpendicular when you hear the whistle!`,
                      'RED-TAGGED -24 HP!'
                    );
                    g.state = 'COOLDOWN';
                    g.stateTimer = 1.0;
                  }
                } else if (newDist < 48 && s.dashActiveTimer > 0) {
                  awardCloseDodge();
                }

                if (g.stateTimer <= 0) {
                  g.state = 'COOLDOWN';
                  g.stateTimer = 0.95;
                }
              } else if (g.state === 'COOLDOWN') {
                g.stateTimer -= dt;
                if (g.stateTimer <= 0) {
                  g.state = g.isNoIdChaser && !hasIdCard ? 'CHASE_NO_ID' : 'PATROL';
                }
              }
            }

            // =========================================================================
            // HAZARD 5: Rotary Lawn Sprinklers (IDLE -> TELEGRAPH -> SPRAY)
            // =========================================================================
            for (const spr of s.sprinklers) {
              spr.timer -= dt * difficultyMult;
              if (spr.state === 'IDLE' && spr.timer <= 0) {
                spr.state = 'TELEGRAPH';
                spr.timer = 1.1;
              } else if (spr.state === 'TELEGRAPH' && spr.timer <= 0) {
                spr.state = 'SPRAY';
                spr.timer = 2.6;
              } else if (spr.state === 'SPRAY') {
                spr.angle += dt * 3.4 * difficultyMult;
                const dSpr = Math.hypot(s.playerX - spr.x, s.playerY - spr.y);
                if (dSpr < spr.radius - 6 && s.dashActiveTimer <= 0 && s.invulnTimer <= 0) {
                  s.soakedTimer = 1.8;
                  soundEngine.playSplash();
                  applyDamageToMaddy(
                    10,
                    spr.x,
                    spr.y,
                    'Sprayed by a VIT Lawn Sprinkler (-10 HP & Soaked Slow)!',
                    'SOAKED -10 HP!'
                  );
                }
                if (spr.timer <= 0) {
                  spr.state = 'IDLE';
                  spr.timer = 2.0;
                }
              }
            }
            } // end if (!isTimeFrozen)
          }

          // Update Particles & Floating Popups
          for (let i = s.particles.length - 1; i >= 0; i--) {
            const p = s.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
              s.particles.splice(i, 1);
            }
          }

          for (let i = s.popups.length - 1; i >= 0; i--) {
            const pop = s.popups[i];
            pop.y -= 28 * dt;
            pop.life -= dt;
            if (pop.life <= 0) {
              s.popups.splice(i, 1);
            }
          }

          // Smooth Camera Follow
          const targetCamX = Math.max(
            0,
            Math.min(WORLD_WIDTH - canvas.width, s.playerX - canvas.width / 2)
          );
          const targetCamY = Math.max(
            0,
            Math.min(WORLD_HEIGHT - canvas.height, s.playerY - canvas.height / 2)
          );
          s.cameraX += (targetCamX - s.cameraX) * Math.min(1, dt * 8.5);
          s.cameraY += (targetCamY - s.cameraY) * Math.min(1, dt * 8.5);

          hudSyncAccumulator += dt;
          if (hudSyncAccumulator >= 0.15) {
            hudSyncAccumulator = 0;
            setElapsedSec(s.runElapsedSec);
            setCurrentLegDistance(s.legWalkedDist);
            setKeyPauseRemaining(s.keyPauseTimer);
          }
        }

        // Render Main 2D VIT Campus Canvas
        const frontM = missionQueueRef.current.front();
        const renderState: RenderSimulationState = {
          playerX: s.playerX,
          playerY: s.playerY,
          playerVx: s.playerVx,
          playerVy: s.playerVy,
          facingAngle: s.facingAngle,
          walkCycle: s.walkCycle,
          squashX: s.squashX,
          squashY: s.squashY,
          hitFlashTimer: s.hitFlashTimer,
          dashActiveTimer: s.dashActiveTimer,
          soakedTimer: s.soakedTimer,
          keyPauseTimer: s.keyPauseTimer,
          inSubway,
          hasIdCard,
          assignmentSubmitted: assignmentSubmittedRef.current,
          chaiRefillCooldown: s.chaiRefillCooldown,
          completedMissionCount: s.completedMissionCount,
          ambientMode: lvlCfg.ambientMode,
          cameraX: s.cameraX,
          cameraY: s.cameraY,
          shakeIntensity: s.shakeIntensity,
          timeSec: s.timeSec,
          currentLocation: s.currentLocation,
          targetMissionLocation: frontM ? frontM.targetLocation : null,
          highlightedPath: s.highlightedPath,
          bfsLevels: s.bfsLevels,
          dfsPingLocations: s.dfsPingLocations,
          showGraphWeights: s.showGraphWeights,
          items: s.items,
          cyclists: s.cyclists,
          shuttles: s.shuttles,
          guards: s.guards,
          sprinklers: s.sprinklers,
          train: s.train,
          particles: s.particles,
          popups: s.popups,
          dashAfterimages: s.dashAfterimages,
          interactionHint: s.interactionHint,
        };

        if (ctx) {
          renderCampusScene(ctx, canvas.width, canvas.height, renderState);
        }

        const miniCanvas = miniMapRef.current;
        if (miniCanvas && activeScr === 'PLAYING') {
          const mCtx = miniCanvas.getContext('2d');
          if (mCtx) {
            renderMiniMap(mCtx, miniCanvas.width, miniCanvas.height, renderState);
          }
        }
      }

      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => window.cancelAnimationFrame(rafId);
  }, [collectItem, completeFrontMission, spawnParticles, spawnPopup]);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    soundEngine.unlockAudio();
    if (screen !== 'PLAYING') return;
    if (e.button === 2) {
      e.preventDefault();
      triggerDash();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const worldX = e.clientX - rect.left + simRef.current.cameraX;
    const worldY = e.clientY - rect.top + simRef.current.cameraY;

    if (
      simRef.current.interactionHint &&
      Math.hypot(worldX - simRef.current.playerX, worldY - simRef.current.playerY) < 68
    ) {
      triggerInteractAction();
      return;
    }

    simRef.current.clickTarget = {
      x: Math.max(42, Math.min(WORLD_WIDTH - 42, worldX)),
      y: Math.max(42, Math.min(WORLD_HEIGHT - 42, worldY)),
    };
  };

  const frontMission = queuedMissions[0];
  const currentOrNearestNode =
    currentLocation || getNearestBuilding(simRef.current.playerX, simRef.current.playerY);
  const defaultDestination: CampusNodeId = frontMission
    ? frontMission.targetLocation
    : 'library';

  void inventoryVersion;
  const hasIdCardNow = inventoryHashRef.current.has('ID Card');

  return (
    <main
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handleCanvasPointerDown}
        className="block w-full h-full cursor-crosshair"
      />

      {screen === 'TITLE' && (
        <TitleScreen
          onStartGame={() => startNewGame(currentLevel)}
          onNavigate={navigateToScreen}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {screen === 'PLAYING' && (
        <HUD
          currentLevel={currentLevel}
          hasIdCard={hasIdCardNow}
          assignmentSubmitted={assignmentSubmitted}
          keyPauseRemaining={keyPauseRemaining}
          dashReady={dashReady}
          health={health}
          score={score}
          elapsedSec={elapsedSec}
          currentLocation={currentLocation}
          currentMission={frontMission}
          completedCount={completedMissions.length}
          totalMissions={queuedMissions.length + completedMissions.length}
          undoCount={undoCount}
          inventoryCount={inventoryHashRef.current.size()}
          highlightedPath={highlightedPath}
          highlightedPathCost={highlightedPathCost}
          activeAlgorithmLog={activeAlgorithmLog}
          showGraphWeights={showGraphWeights}
          bfsActive={bfsLevelsState !== null}
          isMuted={isMuted}
          isMusicOn={isMusicOn}
          miniMapRef={miniMapRef}
          onSelectLevel={(lvl) => startNewGame(lvl)}
          onDash={triggerDash}
          onUndo={handleUndoMove}
          onRunBFSNearby={handleRunBFSNearby}
          onRunDFSScan={handleRunDFSScan}
          onToggleWeights={() => setShowGraphWeights((w) => !w)}
          onClearOverlay={() => {
            setHighlightedPath([]);
            setHighlightedPathCost(null);
            setBfsLevelsState(null);
          }}
          onOpenScreen={navigateToScreen}
          onToggleMute={handleToggleMute}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {screen === 'ASSIGNMENT_QUIZ' && (
        <AssignmentQuizModal
          level={currentLevel}
          questions={ASSIGNMENT_QUIZ_BY_LEVEL[currentLevel]}
          onCompleteQuiz={handleCompleteAssignmentQuiz}
          onClose={closeSubModal}
        />
      )}

      {screen === 'HOW_TO_PLAY' && (
        <HowToPlayModal
          onClose={closeSubModal}
          onStartPlaying={() => {
            if (returnScreenRef.current === 'TITLE') {
              startNewGame(currentLevel);
            } else {
              navigateToScreen('PLAYING');
            }
          }}
        />
      )}

      {screen === 'MAP_DIJKSTRA' && (
        <DijkstraModal
          graph={campusGraph}
          defaultStart={currentOrNearestNode}
          defaultEnd={defaultDestination}
          items={itemsState}
          onApplyRouteToGame={(path, totalCost) => {
            setHighlightedPath(path);
            setHighlightedPathCost(totalCost);
            setActiveAlgorithmLog(
              `Route Active: ${path.map((n) => BUILDING_NAMES[n]).join(' → ')} (${totalCost}m)`
            );
          }}
          onClose={closeSubModal}
        />
      )}

      {screen === 'MISSIONS' && (
        <MissionModal
          completedMissions={completedMissions}
          queuedMissions={queuedMissions}
          currentLegDistance={currentLegDistance}
          onHighlightDestination={handleHighlightDijkstraTo}
          onClose={closeSubModal}
        />
      )}

      {screen === 'INVENTORY' && (
        <InventoryModal
          inventoryHash={inventoryHashRef.current}
          allItems={itemsState}
          onClose={closeSubModal}
        />
      )}

      {screen === 'DSA_CONCEPTS' && <DSAConceptsModal onClose={closeSubModal} />}

      {screen === 'PAUSED' && (
        <PauseModal
          currentLevel={currentLevel}
          undoCount={undoCount}
          isMuted={isMuted}
          onResume={() => navigateToScreen('PLAYING')}
          onSelectLevel={(lvl) => startNewGame(lvl)}
          onUndo={handleUndoMove}
          onRestart={() => startNewGame(currentLevel)}
          onToggleMute={handleToggleMute}
          onOpenScreen={navigateToScreen}
        />
      )}

      {(screen === 'VICTORY' || screen === 'GAME_OVER') && (
        <EndScreenModal
          currentLevel={currentLevel}
          isVictory={screen === 'VICTORY'}
          score={score}
          elapsedSec={elapsedSec}
          missionsCompleted={completedMissions.length}
          routeEfficiency={routeEfficiency}
          itemsCollectedCount={inventoryHashRef.current.size()}
          hasSubmittedScore={hasSubmittedScore}
          onSubmitToLeaderboard={handleSubmitLeaderboard}
          onNextLevel={() => {
            const nextLvl = Math.min(3, currentLevel + 1) as 1 | 2 | 3;
            startNewGame(nextLvl);
          }}
          onPlayAgain={() => startNewGame(currentLevel)}
          onOpenLeaderboard={() => navigateToScreen('LEADERBOARD')}
        />
      )}

      {screen === 'LEADERBOARD' && (
        <LeaderboardModal entries={leaderboardEntries} onClose={closeSubModal} />
      )}

      {screen === 'GOOGLE_DRIVE' && (
        <GoogleDriveModal
          currentSavePayload={{
            version: 1,
            savedAt: new Date().toISOString(),
            currentLevel,
            score,
            health,
            elapsedSec,
            assignmentSubmitted,
            leaderboardEntries,
          }}
          onRestoreCloudSave={handleRestoreCloudSave}
          onClose={closeSubModal}
        />
      )}
    </main>
  );
}
