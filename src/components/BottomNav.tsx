import { NavLink } from 'react-router-dom';
import { Home, Search, Users, User } from 'lucide-react';
import { useHaptic } from '../hooks/useHaptic';

const tabs = [
  { to: '/home', label: 'HOME', Icon: Home },
  { to: '/browse', label: 'BROWSE', Icon: Search },
  { to: '/community', label: 'COMMUNITY', Icon: Users },
  { to: '/profile', label: 'PROFILE', Icon: User },
];

export function BottomNav() {
  const haptic = useHaptic();
  return (
    <nav className="glass-bar border-t border-white/20 px-8 pt-4 pb-safe z-30">
      <div className="flex justify-between items-center h-12">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => haptic(12)}
            className={({ isActive }) =>
              `flex flex-col items-center transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-30'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="text-ink"
                />
                <span className="text-[8px] font-bold mt-1 tracking-widest text-ink">
                  {label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 bg-ink rounded-full mt-1" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
