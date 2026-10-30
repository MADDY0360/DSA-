import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { BUILDING_NAMES } from '../data/campusData';
import { HashTable } from '../dsa/HashTable';
import { CollectibleItem } from '../types/game';

interface InventoryModalProps {
  inventoryHash: HashTable<CollectibleItem>;
  allItems: CollectibleItem[];
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  inventoryHash,
  allItems,
  onClose,
}) => {
  const [queryKey, setQueryKey] = useState('ID Card');
  const buckets = inventoryHash.getBucketsSnapshot();
  const collectedEntries = inventoryHash.entries();

  const computedBucket = queryKey.trim() ? inventoryHash.hash(queryKey) : null;
  const lookupMatch = queryKey.trim() ? inventoryHash.get(queryKey) : undefined;

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/85 flex items-center justify-center p-4 md:p-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              Maddy&apos;s Inventory (Separate Chaining Hash Table)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              {collectedEntries.length} / {allItems.length} VIT Items Collected · 8 Buckets · Average O(1) Key Lookup
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Inventory"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Collected & Missing Items + O(1) Lookup Tester */}
          <div className="lg:col-span-6 space-y-5">
            {/* Live O(1) Lookup Tester */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Test Live O(1) Hash Function & Lookup
              </label>
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={queryKey}
                    onChange={(e) => setQueryKey(e.target.value)}
                    placeholder="Type item name (e.g. ID Card, Assignment, Laptop)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {['ID Card', 'Key', 'Assignment', 'Laptop', 'Gate Key', 'Masala Chai'].map((sample) => (
                  <button
                    key={sample}
                    onClick={() => setQueryKey(sample)}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[11px] font-mono text-slate-300 cursor-pointer"
                  >
                    {sample}
                  </button>
                ))}
              </div>

              {computedBucket !== null && (
                <div className="text-xs font-mono bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1 tabular-nums">
                  <div className="text-slate-300">
                    hash(&quot;{queryKey.trim()}&quot;) →{' '}
                    <strong className="text-amber-400">Bucket [{computedBucket}]</strong>
                  </div>
                  <div>
                    Result:{' '}
                    {lookupMatch ? (
                      <span className="text-emerald-400 font-semibold">
                        FOUND in O(1) — {lookupMatch.name} (+{lookupMatch.points} pts)
                      </span>
                    ) : (
                      <span className="text-amber-300">
                        NOT IN INVENTORY YET (Bucket [{computedBucket}] scanned)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Item Cards */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-semibold text-slate-400">Campus Items Checklist</h3>
              {allItems.map((item) => {
                const owned = inventoryHash.has(item.name);
                const bucketIdx = inventoryHash.hash(item.name);
                return (
                  <div
                    key={item.id}
                    className={`border rounded-xl p-3.5 flex items-start justify-between gap-3 ${
                      owned
                        ? 'bg-slate-950 border-emerald-500/40'
                        : 'bg-slate-950/40 border-slate-800 opacity-75'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {item.name}{' '}
                        <span className="text-xs font-mono font-normal text-slate-400">
                          · Bucket [{bucketIdx}] · {BUILDING_NAMES[item.locationId]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                    </div>
                    <span
                      className={`text-xs font-mono whitespace-nowrap shrink-0 tabular-nums ${
                        owned ? 'text-emerald-400 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {owned ? 'STORED' : 'UNCOLLECTED'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Live 8-Bucket Separate Chaining Table */}
          <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col">
            <h3 className="text-sm font-semibold text-white mb-1">
              Internal Hash Table Buckets (Separate Chaining)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Formula: <code className="text-amber-300">h = (h * 31 + charCode) % 8</code>. Colliding keys link inside the same bucket chain.
            </p>

            <div className="space-y-2 flex-1 font-mono text-xs tabular-nums">
              {buckets.map((b) => {
                const isQueried = computedBucket === b.bucketIndex;
                return (
                  <div
                    key={b.bucketIndex}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                      isQueried
                        ? 'bg-amber-500/10 border-amber-500/60'
                        : 'bg-slate-900/70 border-slate-800'
                    }`}
                  >
                    <span className="w-20 text-slate-400 shrink-0">
                      Bucket [{b.bucketIndex}]
                    </span>
                    <span className="text-slate-600">→</span>
                    {b.chain.length === 0 ? (
                      <span className="text-slate-600">null (empty)</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {b.chain.map((entry, idx) => (
                          <React.Fragment key={entry.key}>
                            <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-700/60 rounded text-emerald-300">
                              {`{ key: "${entry.key}", pts: ${entry.value.points} }`}
                            </span>
                            {idx < b.chain.length - 1 && (
                              <span className="text-amber-400">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
