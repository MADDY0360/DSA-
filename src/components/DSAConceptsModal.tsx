import React, { useMemo, useState } from 'react';
import { CheckCircle2, Play, X, XCircle } from 'lucide-react';
import {
  DSA_CONCEPT_DOCS,
  FOLDER_STRUCTURE_TEXT,
  PRESENTATION_POINTS,
  SAMPLE_GAMEPLAY_FLOW,
  VIVA_QUESTIONS,
  VSCODE_SETUP_STEPS,
} from '../data/projectDocs';
import { DSATestResult, runAllDSATests } from '../dsa/testCases';

interface DSAConceptsModalProps {
  onClose: () => void;
}

type DocTab = 'CONCEPTS' | 'TESTS' | 'ARCHITECTURE' | 'FLOW' | 'VIVA';

export const DSAConceptsModal: React.FC<DSAConceptsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<DocTab>('CONCEPTS');
  const [testRunSeed, setTestRunSeed] = useState(0);

  const testResults: DSATestResult[] = useMemo(() => {
    void testRunSeed;
    return runAllDSATests();
  }, [testRunSeed]);

  const passedCount = testResults.filter((t) => t.passed).length;

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/90 flex items-center justify-center p-3 md:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              DSA Concepts, Project Documentation & Viva Guide
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete College Project Review Reference · All 9 Algorithms Verified in Real Code
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close DSA Concepts"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center gap-1.5">
          {[
            { id: 'CONCEPTS', label: '1. Algorithms & Gameplay' },
            { id: 'TESTS', label: `2. Live Test Cases (${passedCount}/${testResults.length} Pass)` },
            { id: 'ARCHITECTURE', label: '3. Folder Structure & Setup' },
            { id: 'FLOW', label: '4. Gameplay Flow & Presentation' },
            { id: 'VIVA', label: '5. Viva Q&A (12 Questions)' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as DocTab)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === t.id
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'CONCEPTS' && (
            <div className="space-y-4">
              {DSA_CONCEPT_DOCS.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-bold text-white">
                      {doc.number}. {doc.title}
                    </h3>
                    <span className="text-xs font-mono text-amber-300 tabular-nums">
                      {doc.fileLocation} · Time: {doc.timeComplexity} · Space: {doc.spaceComplexity}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs leading-relaxed">
                    <div className="space-y-2 text-slate-300">
                      <p>
                        <strong className="text-white">Algorithm Explanation:</strong> {doc.whatItIs}
                      </p>
                      <p>
                        <strong className="text-emerald-400">How It Connects to Gameplay:</strong>{' '}
                        {doc.gameplayConnection}
                      </p>
                    </div>
                    <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-200 overflow-x-auto">
                      <code>{doc.codeExcerpt}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'TESTS' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-xl p-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Live Automated DSA Unit Test Runner
                  </h3>
                  <p className="text-xs text-slate-400">
                    Executes real calls against src/dsa/* modules and verifies outputs against expected mathematical values.
                  </p>
                </div>
                <button
                  onClick={() => setTestRunSeed((s) => s + 1)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Re-Run All 9 Tests</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {testResults.map((tr) => (
                  <div
                    key={tr.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white text-sm">
                        {tr.concept} — {tr.testName}
                      </span>
                      <span
                        className={`flex items-center gap-1 text-xs font-mono font-semibold whitespace-nowrap shrink-0 ${
                          tr.passed ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {tr.passed ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        {tr.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      Input: <span className="text-slate-300">{tr.inputSummary}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div className="text-slate-400">
                        Expected: <span className="text-amber-300">{tr.expectedOutput}</span>
                      </div>
                      <div className="text-slate-400">
                        Actual: <span className="text-emerald-300">{tr.actualOutput}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ARCHITECTURE' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl p-5">
                <h3 className="text-base font-bold text-white mb-3">
                  Modular Project Folder Structure
                </h3>
                <pre className="text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                  {FOLDER_STRUCTURE_TEXT}
                </pre>
              </div>

              <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-base font-bold text-white">
                  Running Locally in VS Code
                </h3>
                <div className="space-y-3">
                  {VSCODE_SETUP_STEPS.map((s) => (
                    <div key={s.step} className="border-b border-slate-900 pb-3 last:border-0">
                      <div className="text-xs font-semibold text-amber-400 mb-0.5">
                        {s.step}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{s.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'FLOW' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-base font-bold text-white">
                  Sample End-to-End Gameplay Flow
                </h3>
                <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  {SAMPLE_GAMEPLAY_FLOW.map((item, idx) => (
                    <li key={idx} className="border-b border-slate-900 pb-2.5 last:border-0">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-base font-bold text-white">
                  Key Project Presentation Points (For Review Panel)
                </h3>
                <ul className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  {PRESENTATION_POINTS.map((pt, idx) => (
                    <li key={idx} className="border-b border-slate-900 pb-2.5 last:border-0">
                      <strong className="text-amber-400">Point 0{idx + 1}:</strong> {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'VIVA' && (
            <div className="space-y-3">
              {VIVA_QUESTIONS.map((qa, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1.5"
                >
                  <h4 className="text-sm font-semibold text-amber-300">{qa.question}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{qa.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
