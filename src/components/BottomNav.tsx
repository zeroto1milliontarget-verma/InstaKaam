import { Home, ClipboardList, User } from 'lucide-react';
import { useAppContext } from '../AppContext';

export function BottomNav() {
  const { tab, setTab, role } = useAppContext();

  const isCustomer = role === 'customer';
  const navBg = isCustomer ? 'bg-white border-t border-slate-200 shadow-xl' : 'bg-slate-950/50 border-t border-slate-800 backdrop-blur-md';
  const activeColorStr = isCustomer ? 'text-orange-500' : 'text-teal-400';
  const activeBgStr = isCustomer ? 'bg-orange-500' : 'bg-teal-400';
  const inactiveTextColor = isCustomer ? 'text-slate-400' : 'text-slate-500';
  const inactiveBgStr = isCustomer ? 'bg-slate-100' : 'bg-slate-800';

  const NavItem = ({ id, icon: Icon, label }: { id: typeof tab, icon: any, label: string }) => {
    const isActive = tab === id;
    
    // In geometrical balance, the icon itself might be standard but it has a solid square/round bg or simple fill
    // We'll approximate the little box next to the text.
    return (
      <button 
        onClick={() => setTab(id)}
        className="flex flex-col items-center justify-center flex-1 py-3 px-1 relative transition-all"
      >
        <div className={`flex flex-col items-center gap-1 ${isActive ? activeColorStr : inactiveTextColor}`}>
          <div className={`w-5 h-5 rounded-sm flex items-center justify-center ${isActive ? activeBgStr : inactiveBgStr}`}>
            <Icon className={`w-3.5 h-3.5 ${isActive ? (isCustomer ? 'text-white' : 'text-slate-900') : (isCustomer ? 'text-slate-400' : 'text-slate-500')}`} strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {label}
          </span>
        </div>
      </button>
    );
  };

  return (
    <nav className={`fixed bottom-0 w-full pb-safe pt-1 z-50 ${navBg}`}>
      <div className="max-w-md mx-auto flex items-center justify-around px-8 h-16 shrink-0">
        <NavItem id="home" icon={Home} label="Home" />
        <NavItem id="jobs" icon={ClipboardList} label="My Jobs" />
        <NavItem id="profile" icon={User} label="Profile" />
      </div>
    </nav>
  );
}
