import React from 'react';
import { X } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
  onStartPlaying: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  onClose,
  onStartPlaying,
}) => {
  return (
    <div className="fixed inset-0 z-30 bg-slate-950/85 flex items-center justify-center p-4 md:p-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">How to Play VIT Campus Escape</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Maddy&apos;s Controls · Security ID Chase · 4 VIT Hazards · 3 Progressive Levels
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close How to Play"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-3">01. Controls & Dodge Dash</h3>
              <ul className="space-y-2 text-xs font-mono">
                <li className="flex justify-between">
                  <span className="text-amber-400">W A S D / Arrows</span>
                  <span>Run across VIT Campus</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-sky-400">Shift (Tap)</span>
                  <span>Dodge Dash (Invulnerable!)</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-amber-400">Space / E</span>
                  <span>Pick up item / Submit DA</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-amber-400">Z</span>
                  <span>Undo checkpoint (LIFO Stack)</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-amber-400">M / I / Q</span>
                  <span>Dijkstra Map / Inventory / Queue</span>
                </li>
              </ul>
              <p className="text-xs text-emerald-400 mt-3">
                Pro Move: Dashing closely past a lunging Guard or speeding Shuttle scores a <strong>CLOSE DODGE! +25 PTS</strong> bonus!
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-3">02. Key 15s Pause &amp; VIT Hazards</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <strong className="text-emerald-400">DA Quiz Checkpoint (1/1 Point):</strong> Before clearing the Final Gate Checkpoint, submit Maddy&apos;s Assignment at <strong>Technology Tower (TT)</strong> and pass the 3-question <strong>DSA Viva Quiz</strong> to earn your <strong>1/1 Completion Point</strong> and lock a Saved Respawn Checkpoint!
                </li>
                <li>
                  <strong className="text-sky-400">Distant Key = 15s Pause Time:</strong> Trekking out to the far-east <strong>Key</strong> (behind SJT Labs / Stadium corner) or southern <strong>Gate Key</strong> (behind Anna Auditorium) grants <strong>15 seconds of Pause Time</strong> — freezing the run timer, Security Chasers, Express Train, Shuttles, and Sprinklers!
                </li>
                <li>
                  <strong className="text-red-400">No-ID Security Guard Chase:</strong> Until Maddy picks up his <strong>VIT ID Card</strong>, the Security Guard sprints after him nonstop! Grab the ID Card (`HashTable O(1)`) to call off the chase!
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
            <h3 className="text-base font-semibold text-white mb-2">
              03. Three Progressive VIT Campus Levels
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="font-semibold text-amber-400 mb-1">Level 1: 8 AM Lecture Rush</div>
                <p className="text-slate-400">Outrun 1 Security Chaser to Foodys for your ID Card, submit DA at TT, and escape Gate 1.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="font-semibold text-sky-400 mb-1">Level 2: Gravitas Tech-Fest</div>
                <p className="text-slate-400">2 Security Chasers! Recover ID at VIT Lake, grab Laptop at SJT, demo at TT, and reach Gate 1.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <div className="font-semibold text-violet-400 mb-1">Level 3: Dusk Curfew Escape</div>
                <p className="text-slate-400">Evening streetlights & fast hazards! Recover ID at Stadium & Proctor Gate Key at Anna Audi.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={onStartPlaying}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Play VIT Campus Escape
          </button>
        </div>
      </div>
    </div>
  );
};
