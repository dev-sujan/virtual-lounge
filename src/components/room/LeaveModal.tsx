import React from 'react';
import { useRoomStore } from '../../stores/useRoomStore';
import { useVideoStore } from '../../stores/useVideoStore';
import { peerService } from '../../services/webrtc/peerService';
import { LogOut, AlertTriangle, X } from 'lucide-react';
import { Modal } from '../common/Modal';

interface LeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaveModal: React.FC<LeaveModalProps> = ({ isOpen, onClose }) => {
  const { leaveRoom, currentUser } = useRoomStore();
  const { closeVideoCall } = useVideoStore();

  const handleLeaveConfirm = () => {
    if (currentUser) {
      peerService.broadcast('LEAVE_ROOM', {
        userId: currentUser.id,
        userName: currentUser.displayName,
      });
    }

    closeVideoCall();
    peerService.destroy();
    leaveRoom();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm" className="text-center">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-2 text-slate-400 hover:text-white rounded-full transition hover:bg-white/10 z-10"
        title="Close Modal"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h3 className="text-lg font-bold text-white mb-1">Leave this room?</h3>
      <p className="text-xs text-slate-400 mb-6">
        Your temporary session identity and memory state will end.
      </p>

      <div className="flex space-x-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/20 text-white transition"
        >
          Cancel
        </button>
        <button
          onClick={handleLeaveConfirm}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition flex items-center justify-center space-x-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span>Leave Room</span>
        </button>
      </div>
    </Modal>
  );
};
