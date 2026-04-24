import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HapticTap } from './HapticTap';

export function FloatingAction() {
  const navigate = useNavigate();
  return (
    <HapticTap
      onClick={() => navigate('/linking')}
      aria-label="上架新专辑"
      className="fixed bottom-28 right-6 w-16 h-16 bg-paper shadow-neumo rounded-full flex items-center justify-center z-20"
    >
      <Plus size={28} strokeWidth={1.5} className="text-ink" />
    </HapticTap>
  );
}
