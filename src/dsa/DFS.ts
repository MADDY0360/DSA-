import { CampusNodeId, DFSSearchResult } from '../types/game';
import { CampusGraph } from './Graph';

/**
 * 4. DEPTH-FIRST SEARCH (DFS)
 * Explores deep along each campus pathway branch before backtracking.
 * Used for: Campus Treasure / Uncollected Item Scanner across buildings.
 *
 * Time Complexity: O(V + E)
 * Space Complexity: O(V) recursion call stack
 */
export function dfsItemSearch(
  graph: CampusGraph,
  startNode: CampusNodeId,
  uncollectedItemsByLocation: Record<string, string[]>
): DFSSearchResult {
  const visited = new Set<CampusNodeId>();
  const traversalOrder: CampusNodeId[] = [];
  const discoverySteps: DFSSearchResult['discoverySteps'] = [];
  const foundItems: DFSSearchResult['foundItems'] = [];

  function dfsVisit(u: CampusNodeId): void {
    visited.add(u);
    traversalOrder.push(u);

    const itemsHere = uncollectedItemsByLocation[u] || [];
    const firstItem = itemsHere[0];

    discoverySteps.push({
      node: u,
      action: 'visit',
      foundItem: itemsHere.length > 0 ? itemsHere.join(', ') : undefined,
    });

    for (const itemName of itemsHere) {
      foundItems.push({ itemName, location: u });
    }

    for (const edge of graph.getNeighbors(u)) {
      if (!visited.has(edge.to)) {
        dfsVisit(edge.to);
        discoverySteps.push({
          node: u,
          action: 'backtrack',
        });
      }
    }
  }

  dfsVisit(startNode);

  return {
    startNode,
    traversalOrder,
    discoverySteps,
    foundItems,
  };
}
