import { BFSLevelResult, CampusNodeId } from '../types/game';
import { CampusGraph } from './Graph';
import { Queue } from './Queue';

/**
 * 3. BREADTH-FIRST SEARCH (BFS)
 * Explores the campus level-by-level using our custom FIFO Queue.
 * Used for:
 * 1) "Search Nearby" radar (shows 1-hop, 2-hop, 3-hop buildings from player)
 * 2) Alternative route with minimum intermediate building hops
 *
 * Time Complexity: O(V + E)
 * Space Complexity: O(V)
 */
export function bfsExploreCampus(
  graph: CampusGraph,
  startNode: CampusNodeId,
  maxDepth: number = 4
): BFSLevelResult {
  const queue = new Queue<{ node: CampusNodeId; level: number }>();
  const visited = new Set<CampusNodeId>();
  const parentMap: Record<string, CampusNodeId | null> = {};
  const levelMap = new Map<number, CampusNodeId[]>();
  const traversalOrder: CampusNodeId[] = [];

  visited.add(startNode);
  parentMap[startNode] = null;
  queue.enqueue({ node: startNode, level: 0 });

  while (!queue.isEmpty()) {
    const current = queue.dequeue()!;
    const { node, level } = current;

    traversalOrder.push(node);
    if (!levelMap.has(level)) {
      levelMap.set(level, []);
    }
    levelMap.get(level)!.push(node);

    if (level >= maxDepth) continue;

    for (const edge of graph.getNeighbors(node)) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        parentMap[edge.to] = node;
        queue.enqueue({ node: edge.to, level: level + 1 });
      }
    }
  }

  const levels = Array.from(levelMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([level, nodes]) => ({ level, nodes }));

  return {
    startNode,
    levels,
    traversalOrder,
    parentMap,
  };
}

/**
 * Finds the route with the fewest road segments (unweighted shortest path) using BFS.
 */
export function bfsFewestHopsPath(
  graph: CampusGraph,
  startNode: CampusNodeId,
  targetNode: CampusNodeId
): CampusNodeId[] {
  const result = bfsExploreCampus(graph, startNode, 10);
  if (startNode === targetNode) return [startNode];
  if (!(targetNode in result.parentMap)) return [];

  const path: CampusNodeId[] = [];
  let curr: CampusNodeId | null = targetNode;
  while (curr !== null) {
    path.unshift(curr);
    curr = result.parentMap[curr] ?? null;
  }
  return path;
}
