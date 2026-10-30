import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, HelpCircle, ShieldCheck, X } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';
import { DSAQuizQuestion } from '../types/game';

interface AssignmentQuizModalProps {
  level: 1 | 2 | 3;
  questions: DSAQuizQuestion[];
  onCompleteQuiz: (firstTryCount: number) => void;
  onClose: () => void;
}

export const AssignmentQuizModal: React.FC<AssignmentQuizModalProps> = ({
  level,
  questions,
  onCompleteQuiz,
  onClose,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [hadWrongAttemptOnCurrent, setHadWrongAttemptOnCurrent] = useState<boolean>(false);
  const [firstTryScore, setFirstTryScore] = useState<number>(0);

  const q = questions[currentIdx];

  const handleSelectOption = (idx: number) => {
    if (isCorrect === true || idx < 0 || idx >= q.options.length) return;
    soundEngine.unlockAudio();
    setSelectedOption(idx);

    if (idx === q.correctIndex) {
      setIsCorrect(true);
      soundEngine.playStepPing(currentIdx + 4);
      if (!hadWrongAttemptOnCurrent) {
        setFirstTryScore((s) => s + 1);
      }
    } else {
      setIsCorrect(false);
      setHadWrongAttemptOnCurrent(true);
      soundEngine.playHazardBump();
    }
  };

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setHadWrongAttemptOnCurrent(false);
    } else {
      onCompleteQuiz(firstTryScore);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['1', '2', '3', '4'].includes(k)) {
        e.preventDefault();
        handleSelectOption(Number(k) - 1);
      } else if (['a', 'b', 'c', 'd'].includes(k)) {
        e.preventDefault();
        handleSelectOption(k.charCodeAt(0) - 97);
      } else if ((e.key === 'Enter' || e.key === ' ') && isCorrect === true) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/88 flex items-center justify-center p-4 md:p-6">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-100 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 mb-1">
              <Award className="w-4 h-4 shrink-0" />
              <span>TECH TOWER (TT) FACULTY CABIN · LEVEL {level} CHECKPOINT</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white">
              Submit Digital Assignment &amp; Pass DSA Viva Quiz
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Answer {questions.length} quick DSA questions to earn your{' '}
              <strong className="text-emerald-400">1/1 Assignment Completion Point</strong> and lock
              in a <strong className="text-sky-400">Saved Checkpoint</strong> before the Final Gate!
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close Quiz"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 tabular-nums mb-1.5">
            <span>
              Question {currentIdx + 1} of {questions.length} ·{' '}
              <span className="text-amber-300">{q.conceptTag}</span>
            </span>
            <span className="text-emerald-400">
              First-Try Bonus: {firstTryScore}/{questions.length}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-sm overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-transform duration-200 origin-left"
              style={{
                transform: `scaleX(${(currentIdx + (isCorrect ? 1 : 0)) / questions.length})`,
              }}
            />
          </div>
        </div>

        {/* Question Body */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm md:text-base font-semibold text-white leading-relaxed">
                {q.question}
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {q.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const showRight = isCorrect === true && idx === q.correctIndex;
              const showWrong = isCorrect === false && isSelected;

              let btnStyle =
                'bg-slate-950 hover:bg-slate-800/90 border-slate-800 text-slate-200';
              if (showRight) {
                btnStyle =
                  'bg-emerald-950/70 border-emerald-500 text-emerald-200';
              } else if (showWrong) {
                btnStyle = 'bg-red-950/60 border-red-500 text-red-200';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-amber-400 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-xs md:text-sm font-medium">{opt}</span>
                  </div>
                  {showRight && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation Feedback */}
          {selectedOption !== null && (
            <div
              className={`rounded-xl p-3.5 border text-xs leading-relaxed ${
                isCorrect
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}
            >
              {isCorrect ? (
                <>
                  <strong className="text-emerald-400">Correct! </strong>
                  {q.explanation}
                </>
              ) : (
                <>
                  <strong className="text-amber-400">Not quite — try another option! </strong>
                  Hint: Think about how <span className="font-mono">{q.conceptTag}</span> works in
                  Maddy&apos;s campus engine.
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Saves Respawn Checkpoint at Tech Tower + Grants 1/1 DA Point</span>
          </div>

          <button
            onClick={handleNext}
            disabled={!isCorrect}
            className={`px-5 py-2.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              isCorrect
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {currentIdx + 1 < questions.length
              ? 'Next Viva Question →'
              : 'Submit DA · Earn 1/1 Pt & Save Checkpoint ✓'}
          </button>
        </div>
      </div>
    </div>
  );
};
