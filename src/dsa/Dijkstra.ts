import { CampusNodeId, DijkstraResult, DijkstraStep } from '../types/game';
import { CampusGraph } from './Graph';

interface MinPQNode {
  vertex: CampusNodeId;
  distance: number;
}

/**
 * Min-Heap Priority Queue used internally by Dijkstra's Algorithm
 * Always extracts the unvisited campus building with the smallest tentative distance.
 */
class MinPriorityQueue {
  private heap: MinPQNode[] = [];

  public enqueue(vertex: CampusNodeId, distance: number): void {
    this.heap.push({ vertex, distance });
    this.bubbleUp(this.heap.length - 1);
  }

  public dequeue(): MinPQNode | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return min;
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIdx = Math.floor((index - 1) / 2);
      if (this.heap[parentIdx].distance <= this.heap[index].distance) break;
      [this.heap[parentIdx], this.heap[index]] = [this.heap[index], this.heap[parentIdx]];
      index = parentIdx;
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.heap[left].distance < this.heap[smallest].distance) {
        smallest = left;
      }
      if (right < length && this.heap[right].distance < this.heap[smallest].distance) {
        smallest = right;
      }
      if (smallest === index) break;

      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }
}

/**
 * 2. DIJKSTRA'S SHORTEST PATH ALGORITHM
 * Finds the minimum-cost route from startNode to endNode on the CampusGraph.
 * Records every relaxation step so students can step through the algorithm visually.
 *
 * Time Complexity: O((V + E) log V) with Binary Min-Heap
 * Space Complexity: O(V)
 */
export function runDijkstra(
  graph: CampusGraph,
  startNode: CampusNodeId,
  endNode: CampusNodeId,
  buildingNames?: Record<CampusNodeId, string>
): DijkstraResult {
  const vertices = graph.getVertices();
  const distances = {} as Record<CampusNodeId, number>;
  const previous = {} as Record<CampusNodeId, CampusNodeId | null>;
  const visited = new Set<CampusNodeId>();
  const steps: DijkstraStep[] = [];
  const pq = new MinPriorityQueue();

  const label = (id: CampusNodeId) => (buildingNames ? buildingNames[id] : id);

  // Step 1: Initialize all distances to Infinity, startNode to 0
  for (const v of vertices) {
    distances[v] = v === startNode ? 0 : Infinity;
    previous[v] = null;
  }

  pq.enqueue(startNode, 0);
  let stepCounter = 1;

  steps.push({
    stepNumber: stepCounter++,
    currentNode: startNode,
    visited: [],
    distances: { ...distances },
    previous: { ...previous },
    explanation: `Initialized distances: ${label(startNode)} = 0m, all other buildings = ∞.`,
  });

  // Step 2: Process vertices in order of shortest known distance
  while (!pq.isEmpty()) {
    const current = pq.dequeue()!;
    const u = current.vertex;

    if (visited.has(u)) continue;
    visited.add(u);

    steps.push({
      stepNumber: stepCounter++,
      currentNode: u,
      visited: Array.from(visited),
      distances: { ...distances },
      previous: { ...previous },
      explanation: `Selected ${label(u)} with shortest tentative distance (${distances[u]}m) and marked visited.`,
    });

    if (u === endNode) {
      break;
    }

    // Step 3: Relax outgoing edges from u
    for (const edge of graph.getNeighbors(u)) {
      const v = edge.to;
      if (visited.has(v)) continue;

      const candidateDist = distances[u] + edge.weight;
      if (candidateDist < distances[v]) {
        const oldDist = distances[v];
        distances[v] = candidateDist;
        previous[v] = u;
        pq.enqueue(v, candidateDist);

        steps.push({
          stepNumber: stepCounter++,
          currentNode: u,
          visited: Array.from(visited),
          distances: { ...distances },
          previous: { ...previous },
          relaxedEdge: {
            from: u,
            to: v,
            weight: edge.weight,
            newDist: candidateDist,
          },
          explanation: `Relaxed road ${label(u)} → ${label(v)} (+${edge.weight}m): updated distance from ${oldDist === Infinity ? '∞' : `${oldDist}m`} to ${candidateDist}m.`,
        });
      }
    }
  }

  // Step 4: Reconstruct shortest path by following parent pointers backward
  const path: CampusNodeId[] = [];
  let curr: CampusNodeId | null = endNode;

  if (distances[endNode] !== Infinity) {
    while (curr !== null) {
      path.unshift(curr);
      curr = previous[curr];
    }
  }

  return {
    startNode,
    endNode,
    path,
    totalCost: distances[endNode],
    distances,
    previous,
    steps,
  };
}
