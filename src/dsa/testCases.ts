import { buildCampusGraph } from '../data/campusData';
import { bfsExploreCampus, bfsFewestHopsPath } from './BFS';
import { dfsItemSearch } from './DFS';
import { runDijkstra } from './Dijkstra';
import { HashTable } from './HashTable';
import { LeaderboardMaxHeap } from './MaxHeap';
import { Queue } from './Queue';
import { mergeSortLeaderboard, quickSortLeaderboard } from './Sorting';
import { Stack } from './Stack';

export interface DSATestResult {
  id: string;
  concept: string;
  testName: string;
  inputSummary: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
}

/**
 * Automated Unit Test Suite for all 9 DSA Implementations.
 * Can be executed live inside the "DSA Concepts & Viva Guide" screen during project review!
 */
export function runAllDSATests(): DSATestResult[] {
  const results: DSATestResult[] = [];
  const campusGraph = buildCampusGraph();

  // Test 1: Graph Adjacency List
  const hostelNeighbors = campusGraph.getNeighbors('hostel').map((n) => n.to);
  const graphPassed =
    campusGraph.getVertices().length === 9 &&
    hostelNeighbors.includes('canteen') &&
    campusGraph.getEdgeWeight('hostel', 'canteen') === 120;
  results.push({
    id: 'test-graph',
    concept: '1. Graph (Adjacency List)',
    testName: 'Verify 9 campus vertices and Hostel → Canteen weighted road',
    inputSummary: 'Vertices count & getEdgeWeight("hostel", "canteen")',
    expectedOutput: '9 vertices · Hostel-Canteen = 120m',
    actualOutput: `${campusGraph.getVertices().length} vertices · Hostel-Canteen = ${campusGraph.getEdgeWeight('hostel', 'canteen')}m`,
    passed: graphPassed,
  });

  // Test 2: Dijkstra Shortest Path
  const dijkstraRes = runDijkstra(campusGraph, 'hostel', 'library');
  const expectedPath = 'hostel → canteen → academic → library';
  const actualPath = dijkstraRes.path.join(' → ');
  results.push({
    id: 'test-dijkstra',
    concept: "2. Dijkstra's Algorithm",
    testName: 'Find minimum-distance route from Hostel to Library',
    inputSummary: 'runDijkstra(graph, "hostel", "library")',
    expectedOutput: `${expectedPath} (360m)`,
    actualOutput: `${actualPath} (${dijkstraRes.totalCost}m)`,
    passed: actualPath === expectedPath && dijkstraRes.totalCost === 360,
  });

  // Test 3: Breadth-First Search (BFS)
  const bfsRes = bfsExploreCampus(campusGraph, 'park', 1);
  const level1Nodes = bfsRes.levels.find((l) => l.level === 1)?.nodes || [];
  const bfsHops = bfsFewestHopsPath(campusGraph, 'hostel', 'gate');
  results.push({
    id: 'test-bfs',
    concept: '3. Breadth-First Search (BFS)',
    testName: 'Level-1 neighbors of Central Park & minimum hops Hostel → Main Gate',
    inputSummary: 'bfsExploreCampus("park", depth=1) & bfsFewestHopsPath("hostel", "gate")',
    expectedOutput: 'Level-1 count >= 4 · Fewest hops = 4 nodes',
    actualOutput: `Level-1 count = ${level1Nodes.length} · Fewest hops = ${bfsHops.length} nodes (${bfsHops.join(' → ')})`,
    passed: level1Nodes.length >= 4 && bfsHops.length === 4,
  });

  // Test 4: Depth-First Search (DFS)
  const dfsRes = dfsItemSearch(campusGraph, 'hostel', {
    canteen: ['ID Card'],
    lab: ['Laptop'],
    auditorium: ['Gate Key'],
  });
  results.push({
    id: 'test-dfs',
    concept: '4. Depth-First Search (DFS)',
    testName: 'Deep campus traversal discovers all 9 buildings and locates 3 items',
    inputSummary: 'dfsItemSearch(graph, "hostel", {canteen, lab, auditorium})',
    expectedOutput: 'Visited 9/9 nodes · Found 3 items',
    actualOutput: `Visited ${dfsRes.traversalOrder.length}/9 nodes · Found ${dfsRes.foundItems.length} items`,
    passed: dfsRes.traversalOrder.length === 9 && dfsRes.foundItems.length === 3,
  });

  // Test 5: Stack (Undo Movement)
  const moveStack = new Stack<string>();
  moveStack.push('Hostel');
  moveStack.push('Canteen');
  moveStack.push('Academic Block');
  const popped = moveStack.pop();
  results.push({
    id: 'test-stack',
    concept: '5. Stack (LIFO Undo)',
    testName: 'Push 3 movements and Pop latest checkpoint',
    inputSummary: 'push(Hostel, Canteen, Academic) → pop()',
    expectedOutput: 'Popped: Academic Block · New Top: Canteen',
    actualOutput: `Popped: ${popped} · New Top: ${moveStack.peek()}`,
    passed: popped === 'Academic Block' && moveStack.peek() === 'Canteen',
  });

  // Test 6: Queue (Sequential Missions)
  const missionQueue = new Queue<string>();
  missionQueue.enqueue('M1: Go to Canteen');
  missionQueue.enqueue('M2: Collect ID Card');
  missionQueue.enqueue('M3: Go to Academic Block');
  const firstMission = missionQueue.dequeue();
  results.push({
    id: 'test-queue',
    concept: '6. Queue (FIFO Missions)',
    testName: 'Enqueue 3 sequential missions and Dequeue first mission in FIFO order',
    inputSummary: 'enqueue(M1, M2, M3) → dequeue()',
    expectedOutput: 'Dequeued: M1: Go to Canteen · Next Front: M2: Collect ID Card',
    actualOutput: `Dequeued: ${firstMission} · Next Front: ${missionQueue.front()}`,
    passed: firstMission === 'M1: Go to Canteen' && missionQueue.front() === 'M2: Collect ID Card',
  });

  // Test 7: Hash Table (Inventory O(1) Lookup)
  const invHash = new HashTable<{ points: number }>(8);
  invHash.set('ID Card', { points: 100 });
  invHash.set('Assignment', { points: 150 });
  invHash.set('Laptop', { points: 200 });
  const hasId = invHash.has('ID Card');
  const missingKey = invHash.has('Gate Key');
  results.push({
    id: 'test-hashtable',
    concept: '7. Hash Table (Separate Chaining)',
    testName: 'Insert 3 items and verify O(1) key lookup & non-existent key check',
    inputSummary: 'set("ID Card", "Assignment", "Laptop") → has("ID Card"), has("Gate Key")',
    expectedOutput: 'has("ID Card") = true · has("Gate Key") = false · size = 3',
    actualOutput: `has("ID Card") = ${hasId} · has("Gate Key") = ${missingKey} · size = ${invHash.size()}`,
    passed: hasId === true && missingKey === false && invHash.size() === 3,
  });

  // Test 8: Priority Queue / Max-Heap (Leaderboard)
  const heap = new LeaderboardMaxHeap([
    { id: '1', playerName: 'Aarav', score: 780, completionTimeSec: 145, missionsCompleted: 6, routeEfficiency: 88, dateLabel: 'Today' },
    { id: '2', playerName: 'Diya', score: 1120, completionTimeSec: 98, missionsCompleted: 6, routeEfficiency: 97, dateLabel: 'Today' },
    { id: '3', playerName: 'Rohan', score: 940, completionTimeSec: 120, missionsCompleted: 6, routeEfficiency: 92, dateLabel: 'Today' },
  ]);
  const topPlayer = heap.extractMax();
  results.push({
    id: 'test-heap',
    concept: '8. Priority Queue (Binary Max-Heap)',
    testName: 'Insert 3 unsorted scores and extract highest-scoring student from root',
    inputSummary: 'insert(780, 1120, 940) → extractMax()',
    expectedOutput: 'Top: Diya (1120 pts)',
    actualOutput: `Top: ${topPlayer?.playerName} (${topPlayer?.score} pts)`,
    passed: topPlayer?.playerName === 'Diya' && topPlayer?.score === 1120,
  });

  // Test 9: Merge Sort & Quick Sort
  const sampleEntries = [
    { id: '1', playerName: 'Karan', score: 850, completionTimeSec: 132, missionsCompleted: 6, routeEfficiency: 85, dateLabel: 'Today' },
    { id: '2', playerName: 'Meera', score: 1050, completionTimeSec: 84, missionsCompleted: 6, routeEfficiency: 98, dateLabel: 'Today' },
    { id: '3', playerName: 'Vikram', score: 920, completionTimeSec: 109, missionsCompleted: 6, routeEfficiency: 91, dateLabel: 'Today' },
  ];
  const mergeByScore = mergeSortLeaderboard(sampleEntries, 'score_desc');
  const quickByTime = quickSortLeaderboard(sampleEntries, 'time_asc');
  const sortPassed =
    mergeByScore.sorted[0].playerName === 'Meera' &&
    mergeByScore.sorted[2].playerName === 'Karan' &&
    quickByTime.sorted[0].completionTimeSec === 84;
  results.push({
    id: 'test-sorting',
    concept: '9. Merge Sort & Quick Sort',
    testName: 'Sort leaderboard descending by Score (Merge Sort) & ascending by Time (Quick Sort)',
    inputSummary: 'mergeSort(score_desc) & quickSort(time_asc)',
    expectedOutput: 'Score #1: Meera (1050) · Fastest #1: 84s',
    actualOutput: `Score #1: ${mergeByScore.sorted[0].playerName} (${mergeByScore.sorted[0].score}) · Fastest #1: ${quickByTime.sorted[0].completionTimeSec}s`,
    passed: sortPassed,
  });

  return results;
}
