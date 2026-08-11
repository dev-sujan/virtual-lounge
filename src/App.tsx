import { useRoomStore } from './stores/useRoomStore';
import { useSessionRestorer } from './hooks/useSessionRestorer';
import { Home } from './pages/Home';
import { Lounge } from './pages/Lounge';

export function App() {
  const { isRestored } = useSessionRestorer();
  const { roomId, currentUser } = useRoomStore();

  if (!isRestored) {
    return (
      <div className="min-h-screen bg-[#07080c] text-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Restoring Private Lounge Session...</span>
        </div>
      </div>
    );
  }

  if (roomId && currentUser) {
    return <Lounge />;
  }

  return <Home />;
}

export default App;
