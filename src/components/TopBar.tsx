import { Briefcase, User, Search, MapPin } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function TopBar() {
  const { user, role, setRole } = useAppContext();

  const handleRoleToggle = async (newRole: 'customer' | 'worker') => {
    setRole(newRole);
    if (user && user.uid) {
      await updateDoc(doc(db, 'users', user.uid), { role: newRole });
    }
  };

  return (
    <header className={`${role === 'worker' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} sticky top-0 z-50 border-b shadow-sm pt-4 pb-3 px-4 transition-colors duration-300`}>
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-black text-xl italic shadow-sm">IK</div>
          <h1 className={`text-2xl font-bold tracking-tight ${role === 'worker' ? 'text-white' : 'text-slate-800'}`}>Insta<span className="text-orange-500">Kaam</span></h1>
        </div>
        
        {/* Role Toggle */}
        <div className={`flex p-1 rounded-full relative ${role === 'worker' ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div 
            className={`absolute top-1 bottom-1 w-1/2 rounded-full shadow-sm transition-transform duration-300 ease-out ${role === 'worker' ? 'bg-slate-700' : 'bg-white'}`}
            style={{ transform: role === 'customer' ? 'translateX(0)' : 'translateX(100%)' }}
          />
          <button 
            onClick={() => handleRoleToggle('customer')}
            className={`relative z-10 px-3 py-1.5 text-[0.65rem] uppercase tracking-wider font-bold flex items-center gap-1.5 rounded-full transition-colors ${role === 'customer' ? 'text-orange-600' : 'text-slate-500 hover:text-slate-400'}`}
          >
            Need Work
          </button>
          <button 
            onClick={() => handleRoleToggle('worker')}
            className={`relative z-10 px-3 py-1.5 text-[0.65rem] uppercase tracking-wider font-bold flex items-center gap-1.5 rounded-full transition-colors ${role === 'worker' ? 'text-teal-400' : 'text-slate-500 hover:text-slate-400'}`}
          >
            Do Work
          </button>
        </div>
      </div>
    </header>
  );
}
