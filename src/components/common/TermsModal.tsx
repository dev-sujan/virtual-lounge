import React from 'react';
import { X, ShieldCheck, Scale, Lock, Heart } from 'lucide-react';
import { Modal } from './Modal';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl" className="max-h-[85dvh] overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-white rounded-full transition hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center z-10"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Terms & Conditions & Privacy Policy</h3>
          <p className="text-xs text-indigo-300 font-mono">SyncLounge • Created & Maintained by Sujan Maji</p>
        </div>
      </div>

      <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
        {/* Copyright Notice */}
        <div className="bg-indigo-950/40 p-4 rounded-2xl border border-indigo-500/30">
          <div className="flex items-center space-x-2 text-indigo-200 font-bold mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Copyright © 2026 Sujan Maji. All Rights Reserved.</span>
          </div>
          <p className="text-[11px] text-slate-300">
            SyncLounge is a proprietary web application developed by <strong>Sujan Maji</strong>. All intellectual property, UI/UX design, custom P2P synchronization algorithms, and software features are protected under international copyright laws.
          </p>
        </div>

        {/* Privacy & E2EE Policy */}
        <div>
          <h4 className="text-sm font-bold text-white mb-2 flex items-center space-x-1.5">
            <Lock className="w-4 h-4 text-purple-400" />
            <span>1. Zero-Backend Privacy Policy (E2EE)</span>
          </h4>
          <p>
            SyncLounge is built on a 100% serverless, peer-to-peer (P2P) architecture. We do not operate centralized databases or store your personal data, chat messages, voice notes, or shared media. All communication between room participants is encrypted end-to-end (E2EE) using WebCrypto AES-256-GCM directly inside your browser.
          </p>
        </div>

        {/* Terms of Service */}
        <div>
          <h4 className="text-sm font-bold text-white mb-2 flex items-center space-x-1.5">
            <Scale className="w-4 h-4 text-pink-400" />
            <span>2. Terms & Acceptable Use</span>
          </h4>
          <ul className="list-disc list-inside space-y-1.5 text-slate-300">
            <li>Users are solely responsible for content transmitted within their private room sessions.</li>
            <li>Harassment, unauthorized distribution of copyrighted material, or illegal activities are strictly prohibited.</li>
            <li>SyncLounge is provided "as-is" without warranties of uninterrupted uptime or network availability.</li>
          </ul>
        </div>

        {/* Developer Credit */}
        <div className="pt-4 border-t border-white/10 text-center flex flex-col items-center justify-center space-y-2">
          <p className="text-[11px] text-slate-400 flex items-center justify-center space-x-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>by <strong className="text-white">Sujan Maji</strong></span>
          </p>
          <span className="text-[10px] font-mono text-slate-500">Version 2.0 PWA • Built with React, WebRTC & WebCrypto</span>
        </div>
      </div>

      <button
        onClick={onClose}
        className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl text-xs transition shadow-lg"
      >
        Accept & Close
      </button>
    </Modal>
  );
};
