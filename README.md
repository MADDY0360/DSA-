# Campus Escape – A DSA-Based Adventure Game

A beginner-friendly, interactive **2D top-down university campus adventure game** built with **React, TypeScript, HTML5 Canvas, and Tailwind CSS**. Every gameplay system is powered by real, modular Data Structures and Algorithms implemented from scratch in `src/dsa/`.

---

## 1. Campus Locations (9 Vertices & 15 Weighted Roads)
- **Hostel (Nilgiri Bhavan)** — Starting point & Assignment pickup
- **Campus Canteen (Annapurna)** — ID Card pickup
- **Academic Block (Aryabhata Hall)** — Assignment submission checkpoint
- **Lab Block (Turing Computing Center)** — Student Laptop pickup
- **Central Library (Vikram Sarabhai)** — Shortest-path destination
- **Central Park (Banyan Plaza)** — Lotus fountain & Masala Chai stamina restore
- **Sports Ground (Gymkhana Oval)** — Running track & cricket turf
- **Auditorium (Tagore Cultural Dome)** — Gate Pass Key pickup
- **Main Gate (Saraswati Arch)** — Final security verification & graduation exit

---

## 2. DSA Algorithms & How Each Connects to Gameplay

| # | DSA Concept | Module | Complexity | Gameplay Connection |
|---|---|---|---|---|
| 1 | **Graph (Adjacency List)** | `src/dsa/Graph.ts` | Space `O(V + E)` | Represents 9 campus buildings as vertices and 15 weighted roads (in meters) as undirected edges. |
| 2 | **Dijkstra's Algorithm** | `src/dsa/Dijkstra.ts` | `O((V + E) log V)` | Uses a Binary Min-Heap to compute and animate step-by-step shortest routes (e.g. `Hostel → Canteen → Academic Block → Library = 360m`). |
| 3 | **Breadth-First Search (BFS)** | `src/dsa/BFS.ts` | `O(V + E)` | Powers the **BFS Nearby** radar (1-hop, 2-hop, 3-hop rings) and fewest-road-hops route comparison (`Hostel → Park → Library = 2 hops, 410m`). |
| 4 | **Depth-First Search (DFS)** | `src/dsa/DFS.ts` | `O(V + E)` | Powers the **DFS Item Scan** which traverses campus branches recursively to locate uncollected items. |
| 5 | **Stack (LIFO)** | `src/dsa/Stack.ts` | `O(1)` push/pop | Powers **Undo (`Z`)**: pushes player checkpoints and pops the latest state to rewind movement. |
| 6 | **Queue (FIFO)** | `src/dsa/Queue.ts` | `O(1)` enqueue/dequeue | Stores the 6 sequential student missions in strict FIFO order using head/tail indices. |
| 7 | **Hash Table (Chaining)** | `src/dsa/HashTable.ts` | `O(1)` avg lookup | Stores player inventory across 8 Separate Chaining buckets (`h = (h * 31 + charCode) % 8`) for instant item checks. |
| 8 | **Priority Queue (Max-Heap)** | `src/dsa/MaxHeap.ts` | `O(log n)` insert/extract | Ranks student scores so the Campus Champion is always accessible at index `0` in `O(1)` time. |
| 9 | **Merge Sort & Quick Sort** | `src/dsa/Sorting.ts` | `O(n log n)` | Dynamically sorts Leaderboard entries by Highest Score or Fastest Completion Time with live comparison/swap counters. |

---

## 3. Folder Structure

```text
campus-escape-dsa/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx                       # Game state machine, 60fps loop & controls
    ├── types/game.ts                 # TypeScript interfaces
    ├── dsa/                          # Pure Data Structures & Algorithms
    │   ├── Graph.ts
    │   ├── Dijkstra.ts
    │   ├── BFS.ts
    │   ├── DFS.ts
    │   ├── Stack.ts
    │   ├── Queue.ts
    │   ├── HashTable.ts
    │   ├── MaxHeap.ts
    │   ├── Sorting.ts
    │   └── testCases.ts              # Live unit test suite for all 9 structures
    ├── data/
    │   ├── campusData.ts             # Buildings, roads, items & 6 missions
    │   └── projectDocs.ts            # Viva Q&A, setup guide & presentation notes
    ├── game/CampusRenderer.ts        # 2D HTML5 Canvas campus & mini-map renderer
    ├── audio/soundEngine.ts          # Procedural Web Audio synthesizer
    └── components/                   # Modular Game Screens & Visualizers
```

---

## 4. Setup Instructions (VS Code)

1. Install **Node.js (v18+)** and **VS Code**.
2. Open this project folder in VS Code (`File → Open Folder`).
3. Open the VS Code terminal (`` Ctrl + ` ``) and install dependencies:
   ```bash
   npm install
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser.
6. Click **DSA Concepts, Code & Viva Q&A** on the Title Screen (or **DSA & Viva Docs** during gameplay) to run all **9 automated unit test cases** and review the **12 Viva Questions & Answers**.
