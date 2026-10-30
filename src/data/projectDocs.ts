export interface DSAConceptDoc {
  id: string;
  number: string;
  title: string;
  fileLocation: string;
  timeComplexity: string;
  spaceComplexity: string;
  whatItIs: string;
  gameplayConnection: string;
  codeExcerpt: string;
}

export const DSA_CONCEPT_DOCS: DSAConceptDoc[] = [
  {
    id: 'graph',
    number: '01',
    title: 'Graph (Adjacency List)',
    fileLocation: 'src/dsa/Graph.ts',
    timeComplexity: 'Add Vertex/Edge: O(1) · Neighbors: O(1)',
    spaceComplexity: 'O(V + E)',
    whatItIs:
      'A non-linear data structure consisting of Vertices (V) and weighted undirected Edges (E). Using an Adjacency List (Map<CampusNodeId, GraphEdge[]>) avoids wasting memory on non-existent roads.',
    gameplayConnection:
      'All 9 campus buildings (Hostel, Canteen, Academic Block, Lab Block, Library, Central Park, Sports Ground, Auditorium, Main Gate) are vertices, and the 15 campus pathways with distance weights in meters are edges.',
    codeExcerpt: `class CampusGraph {
  private adjacencyList = new Map<CampusNodeId, GraphEdge[]>();

  addUndirectedEdge(u: CampusNodeId, v: CampusNodeId, weight: number) {
    this.adjacencyList.get(u)!.push({ to: v, weight });
    this.adjacencyList.get(v)!.push({ to: u, weight });
  }
}`,
  },
  {
    id: 'dijkstra',
    number: '02',
    title: "Dijkstra's Shortest Path Algorithm",
    fileLocation: 'src/dsa/Dijkstra.ts',
    timeComplexity: 'O((V + E) log V) using Binary Min-Heap',
    spaceComplexity: 'O(V)',
    whatItIs:
      'A greedy single-source shortest path algorithm for graphs with non-negative edge weights. It repeatedly extracts the unvisited vertex with the lowest tentative distance and relaxes its outgoing road edges.',
    gameplayConnection:
      'Calculates the minimum-distance route from the student’s current location to any destination (e.g., Hostel → Canteen → Academic Block → Library = 360m), animates every relaxation step, and draws the golden route line on the map.',
    codeExcerpt: `const candidateDist = distances[u] + edge.weight;
if (candidateDist < distances[v]) {
  distances[v] = candidateDist;
  previous[v] = u;
  pq.enqueue(v, candidateDist);
}`,
  },
  {
    id: 'bfs',
    number: '03',
    title: 'Breadth-First Search (BFS)',
    fileLocation: 'src/dsa/BFS.ts',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V)',
    whatItIs:
      'A graph traversal algorithm that explores vertices layer-by-layer (Level 0, Level 1, Level 2...) using a FIFO Queue. On unweighted edges, BFS guarantees the path with the minimum number of hops.',
    gameplayConnection:
      'Powers the "Search Nearby (BFS)" radar to highlight buildings 1 hop, 2 hops, and 3 hops away, and compares fewest-road-hops routes (e.g., Hostel → Park → Library = 2 hops, 410m) against Dijkstra’s lowest-distance route (3 hops, 360m).',
    codeExcerpt: `queue.enqueue({ node: startNode, level: 0 });
while (!queue.isEmpty()) {
  const { node, level } = queue.dequeue()!;
  for (const edge of graph.getNeighbors(node)) {
    if (!visited.has(edge.to)) {
      visited.add(edge.to);
      queue.enqueue({ node: edge.to, level: level + 1 });
    }
  }
}`,
  },
  {
    id: 'dfs',
    number: '04',
    title: 'Depth-First Search (DFS)',
    fileLocation: 'src/dsa/DFS.ts',
    timeComplexity: 'O(V + E)',
    spaceComplexity: 'O(V) call stack',
    whatItIs:
      'A recursive graph traversal algorithm that plunges as deep as possible along each branch before backtracking when all neighbors of a vertex have been visited.',
    gameplayConnection:
      'Powers the "DFS Item Scanner" which traverses every connected campus building branch-by-branch and reports exact locations of uncollected items (ID Card, Assignment, Laptop, Gate Key, Masala Chai).',
    codeExcerpt: `function dfsVisit(u: CampusNodeId): void {
  visited.add(u);
  checkItemsAtBuilding(u);
  for (const edge of graph.getNeighbors(u)) {
    if (!visited.has(edge.to)) {
      dfsVisit(edge.to); // Go deep first, then backtrack
    }
  }
}`,
  },
  {
    id: 'stack',
    number: '05',
    title: 'Stack (LIFO — Undo Movement)',
    fileLocation: 'src/dsa/Stack.ts',
    timeComplexity: 'Push: O(1) · Pop: O(1) · Peek: O(1)',
    spaceComplexity: 'O(N) checkpoints',
    whatItIs:
      'A linear Last-In, First-Out (LIFO) data structure where elements are inserted and removed exclusively from the top.',
    gameplayConnection:
      'Every time the student enters a campus building or crosses a road checkpoint, that MovementSnapshot is pushed onto the Stack. Pressing Z (or clicking Undo) pops the top state and rewinds the player’s position.',
    codeExcerpt: `// Record checkpoint
movementStack.push({ x: player.x, y: player.y, locationId, label });

// Undo most recent movement (LIFO)
const previousState = movementStack.pop();`,
  },
  {
    id: 'queue',
    number: '06',
    title: 'Queue (FIFO — Mission Progression)',
    fileLocation: 'src/dsa/Queue.ts',
    timeComplexity: 'Enqueue: O(1) · Dequeue: O(1) · Front: O(1)',
    spaceComplexity: 'O(M) missions',
    whatItIs:
      'A linear First-In, First-Out (FIFO) data structure implemented with head and tail pointers so dequeue runs in true O(1) time without shifting array elements.',
    gameplayConnection:
      'All 6 campus missions are enqueued at game start. The player always works on queue.front(); completing it calls queue.dequeue() to unlock the next mission in strict sequential order.',
    codeExcerpt: `// Initialize missions in order
INITIAL_MISSIONS.forEach((m) => missionQueue.enqueue(m));

// Complete current active mission
const completed = missionQueue.dequeue();
const nextMission = missionQueue.front();`,
  },
  {
    id: 'hashtable',
    number: '07',
    title: 'Hash Table (Inventory Lookup)',
    fileLocation: 'src/dsa/HashTable.ts',
    timeComplexity: 'Average Lookup/Insert/Delete: O(1)',
    spaceComplexity: 'O(B + N) buckets & items',
    whatItIs:
      'A key-value data structure using a polynomial rolling hash function (prime 31 modulo 8 buckets) with Separate Chaining to resolve hash collisions.',
    gameplayConnection:
      'Stores collected items ("ID Card", "Assignment", "Laptop", "Gate Key"). When submitting the assignment at Academic Block or exiting Main Gate, inventoryHash.has("ID Card") verifies possession in O(1) time.',
    codeExcerpt: `hash(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) % this.bucketCount;
  }
  return h;
}`,
  },
  {
    id: 'heap',
    number: '08',
    title: 'Priority Queue / Binary Max-Heap',
    fileLocation: 'src/dsa/MaxHeap.ts',
    timeComplexity: 'Peek Max: O(1) · Insert/ExtractMax: O(log n)',
    spaceComplexity: 'O(n)',
    whatItIs:
      'A complete binary tree stored inside an array where every parent node has a higher score priority than its left (2i + 1) and right (2i + 2) children.',
    gameplayConnection:
      'Maintains the Campus Escape Leaderboard. When a student finishes the game, their score is inserted via heapifyUp in O(log n) time, keeping the Campus Champion immediately accessible at index 0.',
    codeExcerpt: `insert(entry: LeaderboardEntry): void {
  this.heap.push(entry);
  this.heapifyUp(this.heap.length - 1);
}`,
  },
  {
    id: 'sorting',
    number: '09',
    title: 'Sorting (Merge Sort & Quick Sort)',
    fileLocation: 'src/dsa/Sorting.ts',
    timeComplexity: 'Merge Sort: O(n log n) · Quick Sort: O(n log n) avg',
    spaceComplexity: 'Merge: O(n) · Quick: O(log n)',
    whatItIs:
      'Divide-and-Conquer sorting algorithms. Merge Sort recursively splits and stably merges halves; Quick Sort partitions elements in-place around a pivot.',
    gameplayConnection:
      'Allows players and evaluators on the Leaderboard screen to dynamically re-order rankings by Highest Score or Fastest Completion Time while inspecting exact comparison and swap/merge counts.',
    codeExcerpt: `const mid = Math.floor(arr.length / 2);
const left = sort(arr.slice(0, mid));
const right = sort(arr.slice(mid));
return merge(left, right);`,
  },
];

export const FOLDER_STRUCTURE_TEXT = `campus-escape-dsa/
├── index.html                    # Entry HTML & typography imports
├── package.json                  # Scripts & dependencies (React, Vite, Tailwind)
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite bundler configuration
└── src/
    ├── main.tsx                  # React DOM root mount
    ├── App.tsx                   # Game state machine, 60fps loop & controls
    ├── types/
    │   └── game.ts               # Campus, Mission, Item & DSA interfaces
    ├── dsa/                      # Pure, modular DSA implementations
    │   ├── Graph.ts              # 1. Weighted Adjacency List Graph
    │   ├── Dijkstra.ts           # 2. Dijkstra Shortest Path + Min-Heap
    │   ├── BFS.ts                # 3. Breadth-First Search (Nearby & Hops)
    │   ├── DFS.ts                # 4. Depth-First Search (Item Scanner)
    │   ├── Stack.ts              # 5. LIFO Stack (Undo Movement)
    │   ├── Queue.ts              # 6. FIFO Queue (Sequential Missions)
    │   ├── HashTable.ts          # 7. Chaining Hash Table (Inventory O(1))
    │   ├── MaxHeap.ts            # 8. Binary Max-Heap (Leaderboard Priority)
    │   ├── Sorting.ts            # 9. Merge Sort & Quick Sort (Rankings)
    │   └── testCases.ts          # Automated unit tests for all 9 structures
    ├── data/
    │   ├── campusData.ts         # 9 campus buildings, 15 roads & 6 missions
    │   └── projectDocs.ts        # Setup guide, presentation & Viva Q&A
    ├── game/
    │   └── CampusRenderer.ts     # 2D HTML5 Canvas campus & graph renderer
    ├── audio/
    │   └── soundEngine.ts        # Procedural Web Audio sound effects
    └── components/               # Modular UI & Visualizer screens
        ├── TitleScreen.tsx       # Main Menu over live panning campus
        ├── HUD.tsx               # Low-occlusion gameplay status & mini-map
        ├── DijkstraModal.tsx     # Interactive Map + Dijkstra/BFS/DFS Studio
        ├── MissionModal.tsx      # Live FIFO Queue Mission inspector
        ├── InventoryModal.tsx    # Hash Table Bucket & O(1) Lookup inspector
        ├── LeaderboardModal.tsx  # Max-Heap & Merge/Quick Sort rankings
        ├── DSAConceptsModal.tsx  # Code docs, Test Runner & Viva Q&A hub
        ├── HowToPlayModal.tsx    # Controls & scoring guide
        └── PauseAndVictoryModals.tsx # Pause, Victory & Game Over screens`;

export const VSCODE_SETUP_STEPS = [
  {
    step: '1. Prerequisites',
    detail: 'Install Node.js (v18 or v20 LTS recommended) and Visual Studio Code.',
  },
  {
    step: '2. Open Project Folder',
    detail: 'Extract or clone the project folder and open it in VS Code via File → Open Folder.',
  },
  {
    step: '3. Install Dependencies',
    detail: 'Open the integrated terminal in VS Code (Ctrl + `) and run: npm install',
  },
  {
    step: '4. Start Development Server',
    detail: 'Run: npm run dev — Vite starts the local server at http://localhost:3000',
  },
  {
    step: '5. Verify TypeScript & DSA Tests',
    detail: 'Run npm run lint for zero-error TypeScript verification, and open "DSA Concepts → Test Cases" in-game to run all 9 live unit tests.',
  },
];

export const SAMPLE_GAMEPLAY_FLOW = [
  '1. Spawn at Hostel (Nilgiri Bhavan): Pick up the Assignment folder right outside Hostel (inserted into Hash Table bucket) and view Mission 1 at the front of the FIFO Queue ("Go to the Canteen").',
  '2. Navigate North Hostel Lane (120m): Walk east using WASD/Arrow keys while dodging rush-hour campus cyclists. Reaching Canteen dequeues Mission 1 (+150 pts) and activates Mission 2 ("Collect your ID Card").',
  '3. Hash Table Pickup: Collect the glowing ID Card at Canteen (+150 pts). Open Inventory (I) to see hash("id card") mapped into its Chaining Bucket in O(1) time.',
  '4. Undo Demonstration (Stack): Press Z at any moment to pop the most recent MovementSnapshot from the LIFO Stack and smoothly rewind a wrong turn.',
  '5. Academic Submission: Travel along Scholar Avenue (130m) to Academic Block (completes Mission 3). Press Space inside Academic Block — the engine runs O(1) Hash Table lookups has("ID Card") and has("Assignment") to complete Mission 4 (+250 pts).',
  '6. Dijkstra Shortest Path Visualization: Mission 5 asks for the shortest route to the Library. Press M to open the Campus Graph Visualizer, step through edge relaxations (Hostel → Canteen → Academic → Library = 360m, or Academic → Library = 110m), and follow the highlighted path to Central Library.',
  '7. Escape via Main Gate: Follow Convocation Boulevard (160m) to Saraswati Arch Main Gate. Passing the final ID Card check completes Mission 6, inserts your score into the Binary Max-Heap Leaderboard, and lets you compare Merge Sort vs Quick Sort!',
];

export const PRESENTATION_POINTS = [
  'Real Engine Integration vs. Mock Slides: Every single mechanic (missions, undo, inventory verification, navigation hints, nearby search, item radar, and leaderboard) is backed by custom TypeScript data structures in src/dsa/ with zero external algorithm libraries.',
  'Textbook BFS vs. Dijkstra Contrast: On our campus map, Hostel → Central Park → Library takes only 2 road hops (found by BFS) but costs 410m, whereas Hostel → Canteen → Academic Block → Library takes 3 hops but costs only 360m (found by Dijkstra).',
  'Transparent Internal State Inspection: Evaluators can open Inventory to watch live Separate Chaining buckets, Missions to inspect Queue front/rear pointers, Map to step through Dijkstra relaxations, and Leaderboard to compare Merge Sort vs Quick Sort operation counts.',
  'Clean Software Architecture: Strict separation of concerns across Pure DSA Logic (src/dsa/), Campus Domain Data (src/data/), 60fps Canvas Rendering (src/game/), and React UI Modals (src/components/).',
];

export interface VivaQA {
  question: string;
  answer: string;
}

export const VIVA_QUESTIONS: VivaQA[] = [
  {
    question: '1. Why did you choose an Adjacency List over an Adjacency Matrix for the campus map?',
    answer:
      'Our campus graph has V = 9 buildings and E = 15 roads (a sparse graph where E is much smaller than V² = 81). An Adjacency List uses O(V + E) space and iterates only over actual connected roads during Dijkstra/BFS/DFS, whereas an Adjacency Matrix would consume O(V²) space and scan non-existent edges.',
  },
  {
    question: "2. Why can't Breadth-First Search (BFS) replace Dijkstra's Algorithm for finding the shortest campus route?",
    answer:
      'BFS treats every road edge as having equal weight (1 hop), so it finds the path with the fewest intermediate buildings (Hostel → Park → Library = 2 hops, 410m). Campus roads have different physical distances in meters, so Dijkstra with a Min-Heap is required to find the true minimum-distance path (Hostel → Canteen → Academic → Library = 360m).',
  },
  {
    question: "3. What happens if a campus road has a negative weight in Dijkstra's Algorithm?",
    answer:
      'Dijkstra assumes non-negative edge weights so that once a vertex is extracted from the Min-Heap and marked visited, its shortest distance is final. Negative weights break this greedy invariant and would require the Bellman-Ford algorithm (O(V × E)). Since physical road distances are always positive, Dijkstra is optimal here.',
  },
  {
    question: '4. What is the time complexity of your Dijkstra implementation and why?',
    answer:
      'Using our Binary Min-Priority Queue, each vertex extraction takes O(log V) and edge relaxations enqueue at most E items taking O(log V) each, giving O((V + E) log V) overall time complexity.',
  },
  {
    question: '5. How does the Undo feature work using a Stack?',
    answer:
      'A Stack follows Last-In, First-Out (LIFO). Whenever the student reaches a new checkpoint or building, we push({ x, y, locationId }) in O(1) time. Pressing Z calls pop() in O(1) time, retrieving the exact most recent position to restore the player.',
  },
  {
    question: '6. Why did you implement the Mission Queue using head/tail indices over an object instead of Array.shift()?',
    answer:
      'In JavaScript/TypeScript, Array.shift() shifts all remaining elements left, costing O(n) time per dequeue. Using an object store with incrementing head and tail indices achieves true O(1) enqueue and O(1) dequeue.',
  },
  {
    question: '7. How does your Hash Table handle collisions in the player inventory?',
    answer:
      'We use Separate Chaining: each of the 8 array slots holds a bucket array of { key, value } pairs. If two item names hash to the same bucket index via our polynomial rolling hash (prime 31), both entries coexist in that bucket chain and are resolved by key comparison.',
  },
  {
    question: '8. Why use a Hash Table for inventory instead of searching an array?',
    answer:
      'Searching an unsorted array takes O(n) linear scans every time a player interacts with a mission checkpoint. A Hash Table provides O(1) average-case lookup via has("ID Card") and has("Assignment"), which scales cleanly even if hundreds of campus items exist.',
  },
  {
    question: '9. How is a Binary Max-Heap stored inside a flat array for the Leaderboard?',
    answer:
      'For any node at 0-based index i, its parent is at Math.floor((i - 1) / 2), its left child is at 2i + 1, and its right child is at 2i + 2. This avoids pointer overhead while supporting O(1) peekMax() and O(log n) insert/extractMax.',
  },
  {
    question: '10. Compare Merge Sort and Quick Sort as used in your Leaderboard.',
    answer:
      'Merge Sort is a stable Divide-and-Conquer sort guaranteeing O(n log n) time in all cases at the cost of O(n) auxiliary space. Quick Sort partitions in-place using O(log n) stack space and is very fast on average O(n log n), though poor pivots can degrade to O(n²) worst-case.',
  },
  {
    question: '11. Where is DFS more useful than BFS in Campus Escape?',
    answer:
      'DFS explores deep along each road branch using recursion and backtracking (O(V + E)), making it natural for exhaustive campus exploration and scanning all reachable corridors for hidden/uncollected items, whereas BFS is better for radial "what is 1 hop nearby" queries.',
  },
  {
    question: '12. How is route efficiency calculated in the scoring system?',
    answer:
      'When a mission starts, we compute the optimal shortest-path distance D_opt using Dijkstra. As the student walks actual distance D_actual, taking detours beyond the optimal corridor gradually deducts efficiency bonus points, rewarding players who apply shortest-path routing.',
  },
];
