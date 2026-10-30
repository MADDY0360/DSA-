import { CampusNodeId } from '../types/game';

export interface GraphEdge {
  to: CampusNodeId;
  weight: number;
  roadName?: string;
}

/**
 * 1. GRAPH DATA STRUCTURE (Adjacency List)
 * - Vertices: Campus buildings (Hostel, Canteen, Library, etc.)
 * - Edges: Weighted roads & pathways connecting buildings
 * - Time Complexity:
 *   - Add Vertex: O(1)
 *   - Add Edge: O(1)
 *   - Get Neighbors: O(1)
 * - Space Complexity: O(V + E)
 */
export class CampusGraph {
  private adjacencyList: Map<CampusNodeId, GraphEdge[]>;

  constructor() {
    this.adjacencyList = new Map<CampusNodeId, GraphEdge[]>();
  }

  public addVertex(vertex: CampusNodeId): void {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
  }

  public addUndirectedEdge(
    u: CampusNodeId,
    v: CampusNodeId,
    weight: number,
    roadName?: string
  ): void {
    this.addVertex(u);
    this.addVertex(v);

    const uEdges = this.adjacencyList.get(u)!;
    if (!uEdges.some((edge) => edge.to === v)) {
      uEdges.push({ to: v, weight, roadName });
    }

    const vEdges = this.adjacencyList.get(v)!;
    if (!vEdges.some((edge) => edge.to === u)) {
      vEdges.push({ to: u, weight, roadName });
    }
  }

  public getNeighbors(vertex: CampusNodeId): GraphEdge[] {
    return this.adjacencyList.get(vertex) || [];
  }

  public getVertices(): CampusNodeId[] {
    return Array.from(this.adjacencyList.keys());
  }

  public getEdgeWeight(u: CampusNodeId, v: CampusNodeId): number | null {
    const edges = this.getNeighbors(u);
    const match = edges.find((e) => e.to === v);
    return match ? match.weight : null;
  }

  public getAdjacencySnapshot(): Record<string, Array<{ to: CampusNodeId; weight: number }>> {
    const result: Record<string, Array<{ to: CampusNodeId; weight: number }>> = {};
    for (const [vertex, edges] of this.adjacencyList.entries()) {
      result[vertex] = edges.map((e) => ({ to: e.to, weight: e.weight }));
    }
    return result;
  }
}
