import {
  BUILDING_MAP,
  CAMPUS_BUILDINGS,
  CAMPUS_ROADS,
  CyclistHazard,
  DashAfterimage,
  ExpressTrainState,
  FloatingTextPopup,
  RedTagGuard,
  SprinklerHazard,
  VitShuttleHazard,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../data/campusData';
import { CampusNodeId, CollectibleItem } from '../types/game';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface RenderSimulationState {
  playerX: number;
  playerY: number;
  playerVx: number;
  playerVy: number;
  facingAngle: number;
  walkCycle: number;
  squashX: number;
  squashY: number;
  hitFlashTimer: number;
  dashActiveTimer: number;
  soakedTimer: number;
  keyPauseTimer: number;
  inSubway: boolean;
  hasIdCard: boolean;
  assignmentSubmitted: boolean;
  chaiRefillCooldown: number;
  completedMissionCount: number;
  ambientMode: 'MORNING' | 'AFTERNOON' | 'DUSK';
  cameraX: number;
  cameraY: number;
  shakeIntensity: number;
  timeSec: number;
  currentLocation: CampusNodeId | null;
  targetMissionLocation: CampusNodeId | null;
  highlightedPath: CampusNodeId[];
  bfsLevels: Record<string, number> | null;
  dfsPingLocations: CampusNodeId[];
  showGraphWeights: boolean;
  items: CollectibleItem[];
  cyclists: CyclistHazard[];
  shuttles: VitShuttleHazard[];
  guards: RedTagGuard[];
  sprinklers: SprinklerHazard[];
  train: ExpressTrainState;
  particles: Particle[];
  popups: FloatingTextPopup[];
  dashAfterimages: DashAfterimage[];
  interactionHint: string | null;
}

interface TreeProp {
  x: number;
  y: number;
  radius: number;
  type: 'banyan' | 'gulmohar' | 'neem';
}

interface BenchProp {
  x: number;
  y: number;
  horizontal: boolean;
}

const CAMPUS_TREES: TreeProp[] = [
  { x: 115, y: 135, radius: 30, type: 'banyan' },
  { x: 465, y: 135, radius: 24, type: 'gulmohar' },
  { x: 615, y: 145, radius: 23, type: 'neem' },
  { x: 1045, y: 150, radius: 27, type: 'gulmohar' },
  { x: 1610, y: 165, radius: 26, type: 'neem' },
  { x: 2065, y: 175, radius: 29, type: 'banyan' },
  { x: 135, y: 560, radius: 27, type: 'neem' },
  { x: 660, y: 540, radius: 24, type: 'gulmohar' },
  { x: 755, y: 900, radius: 28, type: 'banyan' },
  { x: 1255, y: 535, radius: 24, type: 'neem' },
  { x: 1320, y: 925, radius: 26, type: 'gulmohar' },
  { x: 2045, y: 635, radius: 27, type: 'neem' },
  { x: 175, y: 1185, radius: 31, type: 'banyan' },
  { x: 660, y: 1230, radius: 25, type: 'gulmohar' },
  { x: 1440, y: 1245, radius: 27, type: 'banyan' },
  { x: 2075, y: 975, radius: 25, type: 'gulmohar' },
];

const CAMPUS_BENCHES: BenchProp[] = [
  { x: 640, y: 225, horizontal: true },
  { x: 1065, y: 235, horizontal: true },
  { x: 830, y: 690, horizontal: false },
  { x: 1090, y: 690, horizontal: false },
  { x: 1475, y: 695, horizontal: true },
  { x: 1420, y: 1125, horizontal: true },
];

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
}

export function renderCampusScene(
  ctx: CanvasRenderingContext2D,
  viewportWidth: number,
  viewportHeight: number,
  state: RenderSimulationState
): void {
  ctx.save();

  ctx.fillStyle = '#DCFCE7';
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  const shakeX =
    state.shakeIntensity > 0.2 ? (Math.random() - 0.5) * state.shakeIntensity * 2 : 0;
  const shakeY =
    state.shakeIntensity > 0.2 ? (Math.random() - 0.5) * state.shakeIntensity * 2 : 0;

  ctx.translate(-state.cameraX + shakeX, -state.cameraY + shakeY);

  // 1. Base VIT Campus Lawn
  const grassGrad = ctx.createLinearGradient(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  grassGrad.addColorStop(0, '#E7F6E7');
  grassGrad.addColorStop(0.5, '#DDF3E4');
  grassGrad.addColorStop(1, '#D1FAE5');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // VIT Perimeter Compound Wall
  ctx.strokeStyle = '#64748B';
  ctx.lineWidth = 16;
  ctx.strokeRect(16, 16, WORLD_WIDTH - 32, WORLD_HEIGHT - 32);

  // Subtle architectural grid
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.035)';
  ctx.lineWidth = 1;
  for (let gx = 100; gx < WORLD_WIDTH; gx += 100) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, WORLD_HEIGHT);
    ctx.stroke();
  }
  for (let gy = 100; gy < WORLD_HEIGHT; gy += 100) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(WORLD_WIDTH, gy);
    ctx.stroke();
  }

  // Katpadi–Chennai Railway Corridor (x = 545)
  ctx.save();
  ctx.fillStyle =
    state.train.state === 'WARNING'
      ? Math.sin(state.timeSec * 18) > 0
        ? '#FCA5A5'
        : '#CBD5E1'
      : '#CBD5E1';
  ctx.fillRect(525, 24, 40, WORLD_HEIGHT - 48);
  ctx.strokeStyle = state.train.state === 'WARNING' ? '#EF4444' : '#94A3B8';
  ctx.lineWidth = 2;
  ctx.strokeRect(525, 24, 40, WORLD_HEIGHT - 48);

  // Wooden railway sleepers
  ctx.fillStyle = '#78350F';
  for (let ry = 36; ry < WORLD_HEIGHT - 36; ry += 22) {
    ctx.fillRect(530, ry, 30, 6);
  }

  // Dual steel rails
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(537, 24);
  ctx.lineTo(537, WORLD_HEIGHT - 24);
  ctx.moveTo(553, 24);
  ctx.lineTo(553, WORLD_HEIGHT - 24);
  ctx.stroke();

  // Animated Warning Chevrons when Express Train is approaching!
  if (state.train.state === 'WARNING') {
    ctx.save();
    ctx.fillStyle = '#DC2626';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    const scrollOffset = (state.timeSec * 120 * state.train.direction + 1400) % 160;
    for (let wy = 80; wy < WORLD_HEIGHT - 80; wy += 160) {
      const cy = wy + scrollOffset - 80;
      ctx.fillText(state.train.direction === 1 ? '▼ EXPRESS ▼' : '▲ EXPRESS ▲', 545, cy);
    }
    ctx.restore();
  }

  // Zone ground plaques
  ctx.fillStyle = '#0F172A';
  drawRoundedRect(ctx, 70, 52, 195, 28, 6);
  ctx.fill();
  ctx.fillStyle = '#F8FAFC';
  ctx.font = '700 11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VIT HOSTEL & SPORTS ZONE', 167, 66.5);

  ctx.fillStyle = '#0F172A';
  drawRoundedRect(ctx, 595, 52, 225, 28, 6);
  ctx.fill();
  ctx.fillStyle = '#FBBF24';
  ctx.fillText('VIT MAIN ACADEMIC CAMPUS', 707, 66.5);
  ctx.restore();

  // VIT Lake Aura
  ctx.fillStyle = 'rgba(14, 165, 233, 0.1)';
  ctx.beginPath();
  ctx.arc(960, 720, 215, 0, Math.PI * 2);
  ctx.fill();

  // 2. Paved VIT Campus Avenues & Safe Pedestrian Subways
  for (const road of CAMPUS_ROADS) {
    const u = BUILDING_MAP[road.from];
    const v = BUILDING_MAP[road.to];

    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 34;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(u.x, u.y);
    ctx.lineTo(v.x, v.y);
    ctx.stroke();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.moveTo(u.x, u.y);
    ctx.lineTo(v.x, v.y);
    ctx.stroke();

    ctx.save();
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.48)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 12]);
    ctx.beginPath();
    ctx.moveTo(u.x, u.y);
    ctx.lineTo(v.x, v.y);
    ctx.stroke();
    ctx.restore();

    // VIT Subway Underpass Portal (100% Safe from Express Train!)
    if ((u.x < 545 && v.x > 545) || (v.x < 545 && u.x > 545)) {
      const t = (545 - u.x) / (v.x - u.x);
      const crossY = u.y + (v.y - u.y) * t;
      ctx.save();
      ctx.fillStyle = '#0F172A';
      drawRoundedRect(ctx, 515, crossY - 24, 60, 48, 7);
      ctx.fill();
      ctx.strokeStyle =
        state.train.state !== 'CLEAR' ? '#10B981' : '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Blinking railway crossing signal lamps on portal corners
      if (state.train.state !== 'CLEAR') {
        const blink = Math.sin(state.timeSec * 20) > 0;
        ctx.fillStyle = blink ? '#EF4444' : '#7F1D1D';
        ctx.beginPath();
        ctx.arc(522, crossY - 17, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = !blink ? '#EF4444' : '#7F1D1D';
        ctx.beginPath();
        ctx.arc(568, crossY - 17, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#E0F2FE';
      ctx.font = '700 9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SAFE SUBWAY', 545, crossY);
      ctx.restore();
    }
  }

  // 3. Rotary Lawn Sprinklers (Area-Denial Hazards with Clear Telegraph Rings)
  for (const spr of state.sprinklers) {
    ctx.save();
    if (spr.state === 'TELEGRAPH') {
      const progress = Math.max(0.15, 1 - spr.timer / 1.1);
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(spr.x, spr.y, spr.radius * progress, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.32)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(spr.x, spr.y, spr.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else if (spr.state === 'SPRAY') {
      // Wet mist zone
      ctx.fillStyle = 'rgba(14, 165, 233, 0.16)';
      ctx.beginPath();
      ctx.arc(spr.x, spr.y, spr.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 4 Rotating High-Pressure Water Streams
      for (let arm = 0; arm < 4; arm++) {
        const baseA = spr.angle + (arm * Math.PI) / 2;
        for (let step = 1; step <= 6; step++) {
          const dist = (spr.radius / 6) * step;
          const curveA = baseA - step * 0.09;
          const wx = spr.x + Math.cos(curveA) * dist;
          const wy = spr.y + Math.sin(curveA) * dist;
          ctx.fillStyle = step % 2 === 0 ? '#E0F2FE' : '#38BDF8';
          ctx.beginPath();
          ctx.arc(wx, wy, 4.2 - step * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Sprinkler brass hub
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(spr.x, spr.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = spr.state === 'SPRAY' ? '#38BDF8' : '#F59E0B';
    ctx.beginPath();
    ctx.arc(spr.x, spr.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 4. Highlighted Shortest Path Overlay (Dijkstra / BFS)
  if (state.highlightedPath.length >= 2) {
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.42)';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    state.highlightedPath.forEach((nodeId, idx) => {
      const b = BUILDING_MAP[nodeId];
      if (idx === 0) ctx.moveTo(b.x, b.y);
      else ctx.lineTo(b.x, b.y);
    });
    ctx.stroke();

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 6;
    ctx.setLineDash([14, 10]);
    ctx.lineDashOffset = -state.timeSec * 48;
    ctx.stroke();
    ctx.restore();
  }

  // 5. Optional Graph Weight Badges on VIT Roads
  if (state.showGraphWeights || state.highlightedPath.length >= 2) {
    ctx.save();
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const road of CAMPUS_ROADS) {
      const u = BUILDING_MAP[road.from];
      const v = BUILDING_MAP[road.to];
      const midX = (u.x + v.x) / 2;
      const midY = (u.y + v.y) / 2;

      let onActivePath = false;
      for (let i = 0; i < state.highlightedPath.length - 1; i++) {
        const a = state.highlightedPath[i];
        const b = state.highlightedPath[i + 1];
        if ((a === road.from && b === road.to) || (a === road.to && b === road.from)) {
          onActivePath = true;
          break;
        }
      }

      if (!state.showGraphWeights && !onActivePath) continue;

      const text = `${road.weight}m`;
      const boxW = 44;
      const boxH = 20;
      ctx.fillStyle = onActivePath ? '#FEF3C7' : '#0F172A';
      drawRoundedRect(ctx, midX - boxW / 2, midY - boxH / 2, boxW, boxH, 5);
      ctx.fill();

      ctx.strokeStyle = onActivePath ? '#D97706' : '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = onActivePath ? '#92400E' : '#F8FAFC';
      ctx.fillText(text, midX, midY + 0.5);
    }
    ctx.restore();
  }

  // 6. Campus Benches, Foodys Umbrellas & Chai Refill Dispenser
  for (const bench of CAMPUS_BENCHES) {
    ctx.save();
    ctx.fillStyle = '#92400E';
    const w = bench.horizontal ? 32 : 10;
    const h = bench.horizontal ? 10 : 32;
    drawRoundedRect(ctx, bench.x - w / 2, bench.y - h / 2, w, h, 3);
    ctx.fill();
    ctx.strokeStyle = '#451A03';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  for (const [ux, uy, uColor] of [
    [665, 315, '#EA580C'],
    [905, 315, '#0284C7'],
  ] as Array<[number, number, string]>) {
    ctx.save();
    ctx.fillStyle = uColor;
    ctx.beginPath();
    ctx.arc(ux, uy, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFBEB';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // Foodys Hot Chai Healing Station (x: 725, y: 338)
  ctx.save();
  const chaiReady = state.chaiRefillCooldown <= 0;
  ctx.fillStyle = chaiReady ? 'rgba(16, 185, 129, 0.25)' : 'rgba(100, 116, 139, 0.2)';
  ctx.beginPath();
  ctx.arc(725, 338, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = chaiReady ? '#10B981' : '#475569';
  ctx.beginPath();
  ctx.arc(725, 338, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 9px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(chaiReady ? '+HP' : `${Math.ceil(state.chaiRefillCooldown)}s`, 725, 338.5);
  ctx.restore();

  // 7. VIT Campus Buildings & Landmarks
  for (const b of CAMPUS_BUILDINGS) {
    const left = b.x - b.width / 2;
    const top = b.y - b.height / 2;
    const isTarget = state.targetMissionLocation === b.id;
    const isCurrent = state.currentLocation === b.id;
    const isDfsPing = state.dfsPingLocations.includes(b.id);
    const bfsLevel = state.bfsLevels ? state.bfsLevels[b.id] : undefined;

    if (isTarget) {
      const pulse = 1 + Math.sin(state.timeSec * 4.5) * 0.06;
      ctx.save();
      ctx.strokeStyle = '#EA580C';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([10, 6]);
      drawRoundedRect(
        ctx,
        b.x - (b.width / 2 + 14) * pulse,
        b.y - (b.height / 2 + 14) * pulse,
        (b.width + 28) * pulse,
        (b.height + 28) * pulse,
        18
      );
      ctx.stroke();
      ctx.restore();
    }

    if (isDfsPing) {
      ctx.save();
      ctx.strokeStyle = '#7C3AED';
      ctx.lineWidth = 3;
      drawRoundedRect(ctx, left - 10, top - 10, b.width + 20, b.height + 20, 16);
      ctx.stroke();
      ctx.restore();
    }

    if (b.id === 'sports') {
      ctx.fillStyle = '#C2410C';
      drawRoundedRect(ctx, left, top, b.width, b.height, 68);
      ctx.fill();
      ctx.strokeStyle = '#FED7AA';
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, left + 10, top + 10, b.width - 20, b.height - 20, 58);
      ctx.stroke();

      ctx.fillStyle = '#16A34A';
      drawRoundedRect(ctx, left + 22, top + 22, b.width - 44, b.height - 44, 46);
      ctx.fill();

      ctx.fillStyle = '#FDE68A';
      drawRoundedRect(ctx, b.x - 32, b.y - 9, 64, 18, 3);
      ctx.fill();
    } else if (b.id === 'park') {
      ctx.fillStyle = '#A7F3D0';
      drawRoundedRect(ctx, left, top, b.width, b.height, 26);
      ctx.fill();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#0284C7';
      drawRoundedRect(ctx, b.x - 66, b.y - 42, 132, 84, 34);
      ctx.fill();
      ctx.strokeStyle = '#E0F2FE';
      ctx.lineWidth = 3;
      ctx.stroke();

      const rippleR = 14 + ((state.timeSec * 16) % 22);
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(b.x - 16, b.y, rippleR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#92400E';
      drawRoundedRect(ctx, b.x + 22, b.y - 10, 44, 20, 3);
      ctx.fill();
    } else if (b.id === 'gate') {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
      drawRoundedRect(ctx, left + 6, top + 8, b.width, b.height, 14);
      ctx.fill();

      ctx.fillStyle = '#CCFBF1';
      drawRoundedRect(ctx, left, top, b.width, b.height, 14);
      ctx.fill();
      ctx.strokeStyle = '#0F766E';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Main Gate Grand Archway & Pillars
      ctx.fillStyle = '#0F766E';
      drawRoundedRect(ctx, left + 14, top + 14, b.width - 28, 42, 8);
      ctx.fill();
      drawRoundedRect(ctx, left + 16, top + 52, 30, 82, 5);
      ctx.fill();
      drawRoundedRect(ctx, left + b.width - 46, top + 52, 30, 82, 5);
      ctx.fill();

      // Checkered Black & White Finish Line Strip across Main Gate Arch!
      const stripX = left + 48;
      const stripY = top + 98;
      const stripW = b.width - 96;
      const tileSize = 11;
      const cols = Math.floor(stripW / tileSize);
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#0F172A' : '#FFFFFF';
          ctx.fillRect(stripX + c * tileSize, stripY + r * tileSize, tileSize, tileSize);
        }
      }
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 2;
      ctx.strokeRect(stripX, stripY, cols * tileSize, tileSize * 2);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 12.5px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FINISH LINE — VIT MAIN GATE', b.x, top + 35);
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
      drawRoundedRect(ctx, left + 6, top + 8, b.width, b.height, 14);
      ctx.fill();

      ctx.fillStyle = b.wallColor;
      drawRoundedRect(ctx, left, top, b.width, b.height, 14);
      ctx.fill();

      ctx.strokeStyle = isCurrent ? '#0F172A' : b.roofColor;
      ctx.lineWidth = isCurrent ? 3.5 : 2;
      ctx.stroke();

      ctx.fillStyle = b.roofColor;
      drawRoundedRect(ctx, left + 10, top + 10, b.width - 20, b.height - 34, 10);
      ctx.fill();

      if (b.id === 'library') {
        ctx.fillStyle = '#93C5FD';
        drawRoundedRect(ctx, b.x - 54, top + 22, 108, 48, 24);
        ctx.fill();
      } else if (b.id === 'academic' || b.id === 'lab') {
        ctx.fillStyle = b.wallColor;
        drawRoundedRect(ctx, b.x - 56, top + 24, 42, 44, 6);
        ctx.fill();
        drawRoundedRect(ctx, b.x + 14, top + 24, 42, 44, 6);
        ctx.fill();
      } else if (b.id === 'auditorium') {
        ctx.fillStyle = b.wallColor;
        ctx.beginPath();
        ctx.arc(b.x, b.y - 10, 26, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = b.wallColor;
        drawRoundedRect(ctx, b.x - 32, top + 24, 64, 30, 5);
        ctx.fill();
      }

      ctx.fillStyle = '#CBD5E1';
      drawRoundedRect(ctx, b.x - 24, top + b.height - 14, 48, 12, 3);
      ctx.fill();
    }

    // Building Nameplate
    ctx.save();
    ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    const labelText = b.shortName;
    const textWidth = ctx.measureText(labelText).width;
    const plateW = Math.max(textWidth + 24, 100);
    const plateH = 24;
    const plateX = b.x - plateW / 2;
    const plateY = top - 16;

    ctx.fillStyle = isTarget ? '#EA580C' : '#0F172A';
    drawRoundedRect(ctx, plateX, plateY, plateW, plateH, 6);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, b.x, plateY + plateH / 2 + 0.5);

    if (bfsLevel !== undefined) {
      const bfsLabel = bfsLevel === 0 ? 'Origin (L0)' : `BFS Hop ${bfsLevel}`;
      ctx.font = '600 11px "JetBrains Mono", monospace';
      const bw = ctx.measureText(bfsLabel).width + 14;
      ctx.fillStyle = '#0284C7';
      drawRoundedRect(ctx, b.x - bw / 2, top + b.height + 6, bw, 20, 5);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(bfsLabel, b.x, top + b.height + 16.5);
    }
    ctx.restore();
  }

  // 7B. Technology Tower (TT) DA Quiz Checkpoint Desk & VIT Main Gate Final Checkpoint Pad
  ctx.save();
  // TT DA Submission & Quiz Checkpoint (x: 1340, y: 382)
  const ttPulse = 24 + Math.sin(state.timeSec * 5) * 3;
  ctx.strokeStyle = state.assignmentSubmitted ? '#10B981' : '#F59E0B';
  ctx.fillStyle = state.assignmentSubmitted
    ? 'rgba(16, 185, 129, 0.2)'
    : 'rgba(245, 158, 11, 0.22)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(1340, 382, ttPulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.font = '700 10px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const ttTag = state.assignmentSubmitted
    ? '✓ DA CHECKPOINT SAVED (1/1 PT)'
    : '★ DA QUIZ CHECKPOINT (0/1 PT)';
  const ttW = ctx.measureText(ttTag).width + 16;
  ctx.fillStyle = state.assignmentSubmitted ? '#065F46' : '#0F172A';
  drawRoundedRect(ctx, 1340 - ttW / 2, 408, ttW, 18, 4);
  ctx.fill();
  ctx.fillStyle = state.assignmentSubmitted ? '#A7F3D0' : '#FCD34D';
  ctx.fillText(ttTag, 1340, 417.5);

  // Main Gate Checkered Finish Line Banner, Waving Flags & Runway Chevrons (x: 1860, y: 1235)
  const gateReady = state.assignmentSubmitted && state.hasIdCard;
  const wave = Math.sin(state.timeSec * 6) * 4;

  // Animated Finish Runway Chevrons leading into Main Gate
  for (let i = 0; i < 3; i++) {
    const pulseAlpha = gateReady
      ? 0.35 + 0.45 * Math.sin(state.timeSec * 6 - i * 1.1)
      : 0.18;
    ctx.strokeStyle = gateReady
      ? `rgba(16, 185, 129, ${pulseAlpha.toFixed(2)})`
      : 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 3;
    const cy = 1042 + i * 16;
    ctx.beginPath();
    ctx.moveTo(1844, cy - 6);
    ctx.lineTo(1860, cy + 4);
    ctx.lineTo(1876, cy - 6);
    ctx.stroke();
  }

  // Twin Waving Checkered Flags flanking VIT Main Gate
  for (const fx of [1736, 1984]) {
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(fx, 1246);
    ctx.lineTo(fx, 1206);
    ctx.stroke();

    // Flag cloth
    const dir = fx < 1860 ? -1 : 1;
    ctx.fillStyle = gateReady ? '#10B981' : '#0F172A';
    ctx.beginPath();
    ctx.moveTo(fx, 1206);
    ctx.lineTo(fx + dir * 24, 1210 + wave * 0.6);
    ctx.lineTo(fx + dir * 24, 1224 + wave * 0.6);
    ctx.lineTo(fx, 1221);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  const gateTag = gateReady
    ? '★ FINISH LINE UNLOCKED — CROSS MAIN GATE TO WIN! ★'
    : !state.hasIdCard
    ? 'FINISH LINE LOCKED: COLLECT VIT ID CARD FIRST'
    : 'FINISH LINE LOCKED: SUBMIT DA & QUIZ AT TT FIRST';
  const gW = ctx.measureText(gateTag).width + 18;
  ctx.fillStyle = gateReady ? '#065F46' : '#0F172A';
  drawRoundedRect(ctx, 1860 - gW / 2, 1244, gW, 20, 5);
  ctx.fill();
  ctx.strokeStyle = gateReady ? '#34D399' : '#F59E0B';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = gateReady ? '#A7F3D0' : '#FDE68A';
  ctx.fillText(gateTag, 1860, 1254.5);
  ctx.restore();

  // 8. Collectible Items (Bobbing + Spinning Glow Halo)
  for (const item of state.items) {
    if (item.collected) continue;
    const bob = Math.sin(state.timeSec * 5 + item.x) * 4.5;
    const ix = item.x;
    const iy = item.y + bob;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.beginPath();
    ctx.ellipse(ix, item.y + 14, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rotating dashed halo (cyan-gold chrono ring for Keys!)
    const isKeyItem = item.iconType === 'key';
    ctx.save();
    ctx.translate(ix, iy);
    ctx.rotate(state.timeSec * (isKeyItem ? 2.4 : 1.8));
    ctx.strokeStyle = isKeyItem ? 'rgba(56, 189, 248, 0.85)' : 'rgba(245, 158, 11, 0.65)';
    ctx.lineWidth = isKeyItem ? 2.5 : 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, isKeyItem ? 23 : 21, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = isKeyItem ? '#ECFEFF' : '#FFFBEB';
    ctx.beginPath();
    ctx.arc(ix, iy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isKeyItem ? '#0284C7' : '#D97006';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = isKeyItem ? '#0369A1' : '#B45309';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const glyph =
      item.iconType === 'id_card'
        ? 'ID'
        : item.iconType === 'assignment'
        ? 'DA'
        : item.iconType === 'laptop'
        ? 'DEV'
        : item.iconType === 'key'
        ? 'KEY'
        : 'TEA';
    ctx.fillText(glyph, ix, iy + 0.5);

    ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = isKeyItem ? '#0369A1' : '#0F172A';
    const itemLabel = isKeyItem ? `${item.name} (15s Pause)` : item.name;
    ctx.fillText(itemLabel, ix, iy - 25);
    ctx.restore();
  }

  // 9. Rush-Hour VIT Cyclists (Pedaling Legs & Spinning Wheels)
  for (const cyc of state.cyclists) {
    const u = BUILDING_MAP[cyc.from];
    const v = BUILDING_MAP[cyc.to];
    const cx = u.x + (v.x - u.x) * cyc.progress;
    const cy = u.y + (v.y - u.y) * cyc.progress;
    const angle =
      Math.atan2(v.y - u.y, v.x - u.x) + (cyc.direction === -1 ? Math.PI : 0);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Front & Rear tires
    ctx.fillStyle = '#0F172A';
    drawRoundedRect(ctx, 8, -2, 8, 4, 2);
    ctx.fill();
    drawRoundedRect(ctx, -16, -2, 8, 4, 2);
    ctx.fill();

    // Frame & Handlebars
    ctx.strokeStyle = cyc.color;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-11, 0);
    ctx.lineTo(10, 0);
    ctx.moveTo(7, -7);
    ctx.lineTo(7, 7);
    ctx.stroke();

    // Pedaling knees animation
    const pedal = Math.sin(cyc.pedalPhase) * 4;
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(pedal, -5.5, 3, 0, Math.PI * 2);
    ctx.arc(-pedal, 5.5, 3, 0, Math.PI * 2);
    ctx.fill();

    // Helmet
    ctx.fillStyle = cyc.color;
    ctx.beginPath();
    ctx.arc(-1, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // 10. VIT Electric Shuttles / Vee-Cabs (Headlight Cones + HONK Surge!)
  for (const sh of state.shuttles) {
    const u = BUILDING_MAP[sh.from];
    const v = BUILDING_MAP[sh.to];
    const sx = u.x + (v.x - u.x) * sh.progress;
    const sy = u.y + (v.y - u.y) * sh.progress;
    const angle =
      Math.atan2(v.y - u.y, v.x - u.x) + (sh.direction === -1 ? Math.PI : 0);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);

    // Headlight beam cone ahead of shuttle
    ctx.fillStyle =
      sh.state === 'HONK_WINDUP'
        ? 'rgba(239, 68, 68, 0.28)'
        : sh.state === 'SURGE'
        ? 'rgba(245, 158, 11, 0.35)'
        : 'rgba(254, 240, 138, 0.22)';
    ctx.beginPath();
    ctx.moveTo(20, -8);
    ctx.lineTo(135, -36);
    ctx.lineTo(135, 36);
    ctx.lineTo(20, 8);
    ctx.closePath();
    ctx.fill();

    // 4 Tires
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-16, -14, 9, 4);
    ctx.fillRect(8, -14, 9, 4);
    ctx.fillRect(-16, 10, 9, 4);
    ctx.fillRect(8, 10, 9, 4);

    // Shuttle chassis & white roof canopy
    ctx.fillStyle = sh.color;
    drawRoundedRect(ctx, -22, -12, 44, 24, 6);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#F8FAFC';
    drawRoundedRect(ctx, -15, -9, 26, 18, 4);
    ctx.fill();

    // Windshield
    ctx.fillStyle = '#38BDF8';
    drawRoundedRect(ctx, 12, -9, 6, 18, 2);
    ctx.fill();
    ctx.restore();

    // HONK Telegraph Badge above Shuttle
    if (sh.state === 'HONK_WINDUP' || sh.state === 'SURGE') {
      ctx.save();
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillStyle = sh.state === 'HONK_WINDUP' ? '#DC2626' : '#D97706';
      drawRoundedRect(ctx, sx - 28, sy - 28, 56, 17, 4);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sh.state === 'HONK_WINDUP' ? 'HONK!' : 'SPEED!', sx, sy - 19);
      ctx.restore();
    }
  }

  // 11. VIT Red-Tag Patrol Guards (Vision Cone + Whistle Windup + Lunge!)
  for (const g of state.guards) {
    if (state.completedMissionCount < g.unlockAtMissionIndex) continue;

    ctx.save();
    // Vision Cone, No-ID Chase Lock, or Lunge Lock-on Line
    if (g.state === 'CHASE_NO_ID') {
      const sirenFlash = Math.sin(state.timeSec * 16) > 0;
      ctx.fillStyle = sirenFlash
        ? 'rgba(239, 68, 68, 0.25)'
        : 'rgba(59, 130, 246, 0.25)';
      ctx.beginPath();
      ctx.arc(g.x, g.y, 28, 0, Math.PI * 2);
      ctx.fill();

      // Pursuit lock-on line toward Maddy when within 520px
      const distToMaddy = Math.hypot(state.playerX - g.x, state.playerY - g.y);
      if (distToMaddy < 520) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(g.x, g.y);
        ctx.lineTo(state.playerX, state.playerY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    } else if (g.state === 'PATROL') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.14)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.arc(g.x, g.y, 138, g.facingAngle - 0.45, g.facingAngle + 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (g.state === 'WINDUP') {
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + g.lungeDirX * 155, g.y + g.lungeDirY * 155);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(239, 68, 68, 0.24)';
      ctx.beginPath();
      ctx.arc(g.x, g.y, 26, 0, Math.PI * 2);
      ctx.fill();
    } else if (g.state === 'LUNGE') {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.55)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x - g.lungeDirX * 36, g.y - g.lungeDirY * 36);
      ctx.stroke();
    }

    // Guard Body (frozen still when Key 30s Pause is active!)
    const guardStride =
      state.keyPauseTimer > 0
        ? 0
        : g.state === 'CHASE_NO_ID' || g.state === 'LUNGE'
        ? Math.sin(state.timeSec * 18) * 5.5
        : Math.sin(state.timeSec * 8) * 2.5;

    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.facingAngle);

    // Guard boots
    ctx.fillStyle = '#0F172A';
    drawRoundedRect(ctx, guardStride - 4, -10, 8, 4.5, 2);
    ctx.fill();
    drawRoundedRect(ctx, -guardStride - 4, 5.5, 8, 4.5, 2);
    ctx.fill();

    // Khaki security shoulders (frosted cyan tint when paused!)
    ctx.fillStyle =
      state.keyPauseTimer > 0
        ? '#0284C7'
        : g.state === 'COOLDOWN'
        ? '#64748B'
        : '#B45309';
    drawRoundedRect(ctx, -9, -11, 18, 22, 7);
    ctx.fill();
    ctx.strokeStyle = state.keyPauseTimer > 0 ? '#BAE6FD' : '#FEF3C7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Famous VIT Crimson Red-Tag Lanyard
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(1, -6);
    ctx.lineTo(9, 0);
    ctx.lineTo(1, 6);
    ctx.stroke();

    // Guard Head & Security Cap
    ctx.fillStyle = '#FDBA74';
    ctx.beginPath();
    ctx.arc(2, 0, 8.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#991B1B';
    ctx.beginPath();
    ctx.arc(0, 0, 9, Math.PI * 0.45, Math.PI * 1.55);
    ctx.fill();
    ctx.restore();

    // Frozen Ring + Guard State Tag
    ctx.font = '700 9.5px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    if (state.keyPauseTimer > 0) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(g.x, g.y, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#0369A1';
      drawRoundedRect(ctx, g.x - 38, g.y - 29, 76, 17, 4);
      ctx.fill();
      ctx.fillStyle = '#E0F2FE';
      ctx.fillText(`PAUSED ${Math.ceil(state.keyPauseTimer)}s`, g.x, g.y - 20);
    } else if (g.state === 'CHASE_NO_ID') {
      ctx.fillStyle = '#DC2626';
      drawRoundedRect(ctx, g.x - 48, g.y - 29, 96, 17, 4);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('NO ID! STOP!', g.x, g.y - 20);
    } else if (g.state === 'WINDUP') {
      ctx.fillStyle = '#DC2626';
      drawRoundedRect(ctx, g.x - 36, g.y - 28, 72, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('! WHISTLE !', g.x, g.y - 19.5);
    } else if (g.state === 'COOLDOWN') {
      ctx.fillStyle = '#334155';
      drawRoundedRect(ctx, g.x - 28, g.y - 26, 56, 15, 4);
      ctx.fill();
      ctx.fillStyle = '#CBD5E1';
      ctx.fillText('TIRED...', g.x, g.y - 18);
    } else if (g.isNoIdChaser && state.hasIdCard) {
      ctx.fillStyle = '#065F46';
      drawRoundedRect(ctx, g.x - 34, g.y + 15, 68, 15, 4);
      ctx.fill();
      ctx.fillStyle = '#A7F3D0';
      ctx.fillText('ID OK ✓', g.x, g.y + 23);
    } else {
      ctx.fillStyle = 'rgba(127, 29, 29, 0.9)';
      drawRoundedRect(ctx, g.x - 28, g.y + 15, 56, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#FCA5A5';
      ctx.fillText('RED-TAG', g.x, g.y + 22.5);
    }
    ctx.restore();
  }

  // 12. Dash Ghost Afterimages behind Maddy
  for (const ghost of state.dashAfterimages) {
    ctx.save();
    ctx.globalAlpha = ghost.alpha * 0.55;
    ctx.translate(ghost.x, ghost.y);
    ctx.rotate(ghost.angle);
    ctx.fillStyle = '#38BDF8';
    drawRoundedRect(ctx, -10, -12, 20, 24, 8);
    ctx.fill();
    ctx.restore();
  }

  // 13. Pooled Particles
  for (const p of state.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 14. Game Character: MADDY (VIT CSE Student)
  ctx.save();
  ctx.translate(state.playerX, state.playerY);

  // Subtle Mission Compass Pointer orbiting Maddy's feet toward active target
  if (state.targetMissionLocation) {
    const targetB = BUILDING_MAP[state.targetMissionLocation];
    const distToTarget = Math.hypot(targetB.x - state.playerX, targetB.y - state.playerY);
    if (distToTarget > 140) {
      const targetAngle = Math.atan2(targetB.y - state.playerY, targetB.x - state.playerX);
      ctx.save();
      ctx.rotate(targetAngle);
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(21, -5.5);
      ctx.lineTo(21, 5.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // 15-Second Key Time-Freeze Radial Stopwatch Ring around Maddy
  if (state.keyPauseTimer > 0) {
    const ratio = Math.max(0, Math.min(1, state.keyPauseTimer / 15));
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = state.keyPauseTimer <= 4 ? '#FBBF24' : '#38BDF8';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    ctx.stroke();
  }

  // Dash i-frame protective aura
  if (state.dashActiveTimer > 0) {
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 21, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Ground shadow
  ctx.fillStyle = state.inSubway ? 'rgba(15, 23, 42, 0.5)' : 'rgba(15, 23, 42, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 15, 14, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const isMoving = Math.hypot(state.playerVx, state.playerVy) > 5;
  const walkBob = isMoving ? Math.sin(state.walkCycle * 12) * 2.6 : Math.sin(state.timeSec * 3) * 0.8;
  const strideOffset = isMoving ? Math.sin(state.walkCycle * 12) * 6.5 : 0;

  ctx.save();
  if (state.inSubway) {
    ctx.globalAlpha = 0.72; // Underpass tunnel visual cue!
  }
  ctx.translate(0, walkBob);
  ctx.scale(state.squashX, state.squashY);
  ctx.rotate(state.facingAngle);

  // Animated Sneakers
  ctx.fillStyle = '#F8FAFC';
  drawRoundedRect(ctx, strideOffset - 4, -10.5, 9.5, 5, 2.5);
  ctx.fill();
  drawRoundedRect(ctx, -strideOffset - 4, 5.5, 9.5, 5, 2.5);
  ctx.fill();

  // Swinging Hands
  ctx.fillStyle = '#FDBA74';
  ctx.beginPath();
  ctx.arc(-strideOffset * 0.7 + 3, -12.5, 3.2, 0, Math.PI * 2);
  ctx.arc(strideOffset * 0.7 + 3, 12.5, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Maddy's Backpack
  ctx.fillStyle = state.hitFlashTimer > 0 ? '#EF4444' : '#D97706';
  drawRoundedRect(ctx, -16, -9.5, 9.5, 19, 4);
  ctx.fill();
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Maddy's VIT Varsity Jacket
  ctx.fillStyle =
    state.hitFlashTimer > 0
      ? '#FCA5A5'
      : state.soakedTimer > 0
      ? '#0284C7'
      : '#1E3A8A';
  drawRoundedRect(ctx, -9, -12, 18, 24, 8);
  ctx.fill();

  ctx.fillStyle = '#E0F2FE';
  ctx.fillRect(-3, -12, 5, 3);
  ctx.fillRect(-3, 9, 5, 3);

  if (state.hasIdCard) {
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(2, -5);
    ctx.lineTo(10, 0);
    ctx.lineTo(2, 5);
    ctx.stroke();
  }

  // Maddy's Head & Hair
  ctx.fillStyle = state.hitFlashTimer > 0 ? '#FFFFFF' : '#FDBA74';
  ctx.beginPath();
  ctx.arc(2.5, 0, 9.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(0.5, 0, 9.8, Math.PI * 0.52, Math.PI * 1.48);
  ctx.fill();

  ctx.strokeStyle = '#38BDF8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(1.5, 0, 9.8, -Math.PI * 0.42, Math.PI * 0.42, true);
  ctx.stroke();
  ctx.restore();

  // "MADDY" Nameplate
  ctx.font = '700 10px "JetBrains Mono", monospace';
  const nameTag =
    state.soakedTimer > 0
      ? 'MADDY · SOAKED!'
      : state.hasIdCard
      ? 'MADDY · VIT ID'
      : 'MADDY';
  const nw = ctx.measureText(nameTag).width + 12;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  drawRoundedRect(ctx, -nw / 2, 19, nw, 16, 4);
  ctx.fill();
  ctx.fillStyle = state.soakedTimer > 0 ? '#7DD3FC' : '#38BDF8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(nameTag, 0, 27.5);

  if (state.interactionHint) {
    ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
    const hw = ctx.measureText(state.interactionHint).width + 20;
    ctx.fillStyle = '#0F172A';
    drawRoundedRect(ctx, -hw / 2, -42, hw, 24, 6);
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#FEF3C7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.interactionHint, 0, -29.5);
  }
  ctx.restore();

  // 15. Katpadi Express Train Roaring Over the Railway Corridor (x = 545)!
  // Drawn AFTER Maddy so when Maddy is safely inside the underground SUBWAY, the train passes overhead!
  if (state.train.state === 'PASSING') {
    ctx.save();
    const trainX = 545;
    const carCount = 4;
    const carLen = 78;
    const gap = 8;

    for (let c = 0; c < carCount; c++) {
      const offset = c * (carLen + gap) * -state.train.direction;
      const cy = state.train.y + offset;

      // Train shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      drawRoundedRect(ctx, trainX - 15, cy - carLen / 2 + 4, 34, carLen, 10);
      ctx.fill();

      // Vande Bharat White & Royal-Blue Coach Body
      ctx.fillStyle = '#F8FAFC';
      drawRoundedRect(ctx, trainX - 16, cy - carLen / 2, 32, carLen, c === 0 ? 14 : 6);
      ctx.fill();
      ctx.strokeStyle = '#1D4ED8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Blue side stripe & windows
      ctx.fillStyle = '#1D4ED8';
      ctx.fillRect(trainX - 13, cy - carLen / 2 + 10, 5, carLen - 20);
      ctx.fillRect(trainX + 8, cy - carLen / 2 + 10, 5, carLen - 20);

      // Aerodynamic Locomotive Cab Windshield on car 0
      if (c === 0) {
        const noseY = cy + (state.train.direction * carLen) / 2 - state.train.direction * 14;
        ctx.fillStyle = '#0F172A';
        drawRoundedRect(ctx, trainX - 11, noseY - 6, 22, 12, 4);
        ctx.fill();

        // Bright Locomotive Headlight Beam
        ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
        ctx.beginPath();
        ctx.moveTo(trainX - 10, noseY);
        ctx.lineTo(trainX - 38, noseY + state.train.direction * 110);
        ctx.lineTo(trainX + 38, noseY + state.train.direction * 110);
        ctx.lineTo(trainX + 10, noseY);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 16. Swaying VIT Campus Trees & Ambient Drifting Gulmohar Petals
  for (let i = 0; i < CAMPUS_TREES.length; i++) {
    const tree = CAMPUS_TREES[i];
    const swayX = Math.sin(state.timeSec * 1.8 + i * 0.9) * 2.5;
    const swayY = Math.cos(state.timeSec * 1.5 + i * 0.7) * 1.8;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
    ctx.beginPath();
    ctx.arc(tree.x + 5, tree.y + 6, tree.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle =
      tree.type === 'gulmohar'
        ? '#EA580C'
        : tree.type === 'banyan'
        ? '#15803D'
        : '#16A34A';
    ctx.beginPath();
    ctx.arc(tree.x + swayX, tree.y + swayY, tree.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = tree.type === 'gulmohar' ? '#FB923C' : '#22C55E';
    ctx.beginPath();
    ctx.arc(
      tree.x + swayX - tree.radius * 0.22,
      tree.y + swayY - tree.radius * 0.22,
      tree.radius * 0.55,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  // Ambient drifting Gulmohar petals across VIT breeze
  ctx.save();
  for (let pIdx = 0; pIdx < 18; pIdx++) {
    const px = ((pIdx * 197 + state.timeSec * 38) % (WORLD_WIDTH - 120)) + 60;
    const py =
      ((pIdx * 131 + state.timeSec * 24 + Math.sin(state.timeSec * 2 + pIdx) * 18) %
        (WORLD_HEIGHT - 120)) +
      60;
    ctx.fillStyle = pIdx % 2 === 0 ? 'rgba(251, 146, 60, 0.65)' : 'rgba(74, 222, 128, 0.55)';
    ctx.beginPath();
    ctx.ellipse(px, py, 3.5, 2, state.timeSec + pIdx, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 17. Level Time-of-Day Atmospheric Tint & Evening Streetlamps (Level 2 Afternoon / Level 3 Dusk)
  if (state.ambientMode === 'AFTERNOON') {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  } else if (state.ambientMode === 'DUSK') {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Warm golden streetlamp pools near each VIT landmark
    for (const b of CAMPUS_BUILDINGS) {
      const lampGrad = ctx.createRadialGradient(b.x, b.y + 70, 8, b.x, b.y + 70, 95);
      lampGrad.addColorStop(0, 'rgba(253, 224, 71, 0.28)');
      lampGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = lampGrad;
      ctx.beginPath();
      ctx.arc(b.x, b.y + 70, 95, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 18. Floating World-Space Combat / Score Popups ("CLOSE DODGE! +25", "+150 PTS", etc.)
  for (const pop of state.popups) {
    const alpha = Math.min(1, (pop.life / pop.maxLife) * 1.4);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3.5;
    ctx.strokeText(pop.text, pop.x, pop.y);
    ctx.fillStyle = pop.color;
    ctx.fillText(pop.text, pop.x, pop.y);
    ctx.restore();
  }

  ctx.restore();

  // Screen-Edge Chrono Frame when 30-Second Key Pause Time is active
  if (state.keyPauseTimer > 0) {
    ctx.save();
    ctx.strokeStyle =
      state.keyPauseTimer <= 5 && Math.sin(state.timeSec * 14) > 0
        ? 'rgba(251, 191, 36, 0.8)'
        : 'rgba(56, 189, 248, 0.65)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, viewportWidth - 4, viewportHeight - 4);
    ctx.restore();
  }
}

/**
 * Renders the compact VIT Campus Mini-Map Canvas in 60fps
 */
export function renderMiniMap(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: RenderSimulationState
): void {
  const scaleX = width / WORLD_WIDTH;
  const scaleY = height / WORLD_HEIGHT;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, width, height);

  // VIT Railway Dividing Line (glows red when train incoming!)
  ctx.strokeStyle =
    state.train.state === 'CLEAR' ? 'rgba(148, 163, 184, 0.35)' : '#EF4444';
  ctx.lineWidth = state.train.state === 'CLEAR' ? 1.5 : 2.2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(545 * scaleX, 0);
  ctx.lineTo(545 * scaleX, height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Roads
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  for (const r of CAMPUS_ROADS) {
    const u = BUILDING_MAP[r.from];
    const v = BUILDING_MAP[r.to];
    ctx.beginPath();
    ctx.moveTo(u.x * scaleX, u.y * scaleY);
    ctx.lineTo(v.x * scaleX, v.y * scaleY);
    ctx.stroke();
  }

  // Highlighted Dijkstra path on mini-map
  if (state.highlightedPath.length >= 2) {
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    state.highlightedPath.forEach((id, idx) => {
      const b = BUILDING_MAP[id];
      if (idx === 0) ctx.moveTo(b.x * scaleX, b.y * scaleY);
      else ctx.lineTo(b.x * scaleX, b.y * scaleY);
    });
    ctx.stroke();
  }

  // Active Red-Tag Guards as crimson dots on mini-map
  for (const g of state.guards) {
    if (state.completedMissionCount < g.unlockAtMissionIndex) continue;
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(g.x * scaleX, g.y * scaleY, 2.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // VIT Buildings (with pulsating Finish Line ring on Main Gate!)
  for (const b of CAMPUS_BUILDINGS) {
    const bx = b.x * scaleX;
    const by = b.y * scaleY;
    const isTarget = state.targetMissionLocation === b.id;

    if (b.id === 'gate') {
      ctx.strokeStyle =
        state.assignmentSubmitted && state.hasIdCard ? '#34D399' : '#FBBF24';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(bx, by, 6.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = b.id === 'gate' ? '#FFFFFF' : isTarget ? '#F97316' : b.accentColor;
    ctx.beginPath();
    ctx.arc(bx, by, isTarget || b.id === 'gate' ? 4.5 : 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Uncollected Items
  for (const item of state.items) {
    if (item.collected) continue;
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(item.x * scaleX - 1.5, item.y * scaleY - 1.5, 3, 3);
  }

  // Maddy's Position
  ctx.fillStyle = '#38BDF8';
  ctx.beginPath();
  ctx.arc(state.playerX * scaleX, state.playerY * scaleY, 4.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.3;
  ctx.stroke();
}
