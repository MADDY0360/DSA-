import { LeaderboardEntry } from '../types/game';

export type SortField = 'score_desc' | 'time_asc';

export interface SortMetricsResult {
  sorted: LeaderboardEntry[];
  comparisons: number;
  operations: number;
  algorithmName: 'Merge Sort' | 'Quick Sort';
  timeComplexity: string;
}

function shouldComeFirst(a: LeaderboardEntry, b: LeaderboardEntry, mode: SortField): boolean {
  if (mode === 'score_desc') {
    if (a.score !== b.score) return a.score > b.score;
    return a.completionTimeSec <= b.completionTimeSec;
  } else {
    if (a.completionTimeSec !== b.completionTimeSec) {
      return a.completionTimeSec < b.completionTimeSec;
    }
    return a.score >= b.score;
  }
}

/**
 * 9A. MERGE SORT (Divide & Conquer, Stable)
 * Time Complexity: O(n log n) guaranteed in best, average, and worst cases.
 * Space Complexity: O(n)
 */
export function mergeSortLeaderboard(
  entries: LeaderboardEntry[],
  mode: SortField
): SortMetricsResult {
  let comparisons = 0;
  let merges = 0;

  function merge(left: LeaderboardEntry[], right: LeaderboardEntry[]): LeaderboardEntry[] {
    const result: LeaderboardEntry[] = [];
    let i = 0;
    let j = 0;

    while (i < left.length && j < right.length) {
      comparisons++;
      merges++;
      if (shouldComeFirst(left[i], right[j], mode)) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
      }
    }

    while (i < left.length) {
      merges++;
      result.push(left[i++]);
    }
    while (j < right.length) {
      merges++;
      result.push(right[j++]);
    }

    return result;
  }

  function sort(arr: LeaderboardEntry[]): LeaderboardEntry[] {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = sort(arr.slice(0, mid));
    const right = sort(arr.slice(mid));
    return merge(left, right);
  }

  const sorted = sort([...entries]);

  return {
    sorted,
    comparisons,
    operations: merges,
    algorithmName: 'Merge Sort',
    timeComplexity: 'O(n log n)',
  };
}

/**
 * 9B. QUICK SORT (In-Place Partitioning)
 * Time Complexity: O(n log n) average, O(n²) worst-case
 * Space Complexity: O(log n) recursion stack
 */
export function quickSortLeaderboard(
  entries: LeaderboardEntry[],
  mode: SortField
): SortMetricsResult {
  const arr = [...entries];
  let comparisons = 0;
  let swaps = 0;

  function partition(low: number, high: number): number {
    const pivot = arr[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
      comparisons++;
      if (shouldComeFirst(arr[j], pivot, mode)) {
        i++;
        if (i !== j) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          swaps++;
        }
      }
    }

    if (i + 1 !== high) {
      [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
      swaps++;
    }
    return i + 1;
  }

  function quickSort(low: number, high: number): void {
    if (low < high) {
      const pi = partition(low, high);
      quickSort(low, pi - 1);
      quickSort(pi + 1, high);
    }
  }

  if (arr.length > 1) {
    quickSort(0, arr.length - 1);
  }

  return {
    sorted: arr,
    comparisons,
    operations: swaps,
    algorithmName: 'Quick Sort',
    timeComplexity: 'O(n log n) avg',
  };
}
