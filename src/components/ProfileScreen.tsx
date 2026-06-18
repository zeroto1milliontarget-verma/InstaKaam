import { useAppContext } from '../AppContext';
import { User, Shield, HelpCircle, LogOut, ChevronRight, Settings, Wallet, CheckCircle2 } from 'lucide-react';

export function ProfileScreen() {
  const { user, role, workerTasks, customerTasks, logout } = useAppContext();
  const isWorker = role === 'worker';
  const completedCount = workerTasks.filter(t => t.status === 'paid' || t.status === 'completed').length;
  // Calculate earnings if we don't track it on the user object yet.
  const workerEarnings = workerTasks.filter(t => t.status === 'paid').reduce((sum, task) => sum + task.budget, 0);

  const pastPayments = isWorker
    ? workerTasks.filter(t => t.status === 'paid')
    : customerTasks.filter(t => t.status === 'paid');

  return (
    <div className="p-6 pb-24">
      <div className={`flex items-center gap-4 mb-8 p-5 rounded-3xl shadow-xl ${isWorker ? 'bg-slate-800 border-none' : 'bg-white border border-slate-200'}`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${isWorker ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-400'}`}>
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid}`} className="w-full h-full rounded-2xl" />
        </div>
        <div>
          <h2 className={`text-lg font-bold tracking-tight ${isWorker ? 'text-white' : 'text-slate-800'}`}>{user?.name}</h2>
          <p className={`text-xs font-mono mt-0.5 ${isWorker ? 'text-slate-400' : 'text-slate-500'}`}>{user?.phone}</p>
        </div>
      </div>

      {isWorker && (
        <div className="mb-8">
          <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest">Earnings Dashboard</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
              <p className="text-teal-100 text-[10px] uppercase tracking-widest font-bold mb-2 relative z-10">Total Earned</p>
              <p className="text-2xl font-black font-mono italic relative z-10">₹{workerEarnings}</p>
            </div>
            <div className="bg-slate-800 border-none rounded-3xl p-5 shadow-xl">
               <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-2">Jobs Done</p>
               <p className="text-2xl font-black font-mono text-white italic">{completedCount}</p>
            </div>
          </div>
        </div>
      )}

      {pastPayments.length > 0 && (
        <div className="mb-8">
          <h3 className="text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest">Payment History</h3>
          <div className="space-y-3">
            {pastPayments.map(task => (
              <div key={task.id} className={`p-4 rounded-2xl shadow-sm flex items-center justify-between ${isWorker ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
                <div>
                  <p className={`text-sm font-bold tracking-tight ${isWorker ? 'text-slate-200' : 'text-slate-800'}`}>{task.title}</p>
                  <p className={`text-[10px] uppercase tracking-widest mt-1 ${isWorker ? 'text-slate-400' : 'text-slate-500'}`}>
                    {isWorker ? `From: Customer` : `To: ${task.worker?.name || 'Worker'}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold ${isWorker ? 'text-teal-400' : 'text-orange-500'}`}>
                    {isWorker ? '+' : '-'}₹{task.budget}
                  </p>
                  <p className="text-[10px] items-center gap-1 text-slate-400 inline-flex mt-1">
                    <CheckCircle2 className="w-3 h-3" /> Paid
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`rounded-3xl shadow-xl overflow-hidden mb-6 ${isWorker ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
        <ul className={`divide-y ${isWorker ? 'divide-slate-700' : 'divide-slate-100'}`}>
          <li className={`flex items-center justify-between p-5 cursor-pointer ${isWorker ? 'active:bg-slate-700' : 'active:bg-slate-50'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 flex items-center justify-center rounded-xl ${isWorker ? 'bg-slate-700 text-teal-400' : 'bg-slate-100 text-orange-500'}`}><Settings className="w-4 h-4"/></div>
              <span className={`font-bold text-sm tracking-wide ${isWorker ? 'text-slate-200' : 'text-slate-700'}`}>Account Settings</span>
            </div>
            <ChevronRight className={`w-4 h-4 ${isWorker ? 'text-slate-500' : 'text-slate-300'}`} />
          </li>
          
          {isWorker && (
            <li className={`flex items-center justify-between p-5 cursor-pointer active:bg-slate-700`}>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-700 text-teal-400"><Wallet className="w-4 h-4"/></div>
                <span className="font-bold text-sm tracking-wide text-slate-200">Bank Details</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </li>
          )}

          <li className={`flex items-center justify-between p-5 cursor-pointer ${isWorker ? 'active:bg-slate-700' : 'active:bg-slate-50'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 flex items-center justify-center rounded-xl ${isWorker ? 'bg-slate-700 text-teal-400' : 'bg-slate-100 text-orange-500'}`}><Shield className="w-4 h-4"/></div>
              <span className={`font-bold text-sm tracking-wide ${isWorker ? 'text-slate-200' : 'text-slate-700'}`}>Trust & Safety</span>
            </div>
            <ChevronRight className={`w-4 h-4 ${isWorker ? 'text-slate-500' : 'text-slate-300'}`} />
          </li>
          <li className={`flex items-center justify-between p-5 cursor-pointer ${isWorker ? 'active:bg-slate-700' : 'active:bg-slate-50'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 flex items-center justify-center rounded-xl ${isWorker ? 'bg-slate-700 text-teal-400' : 'bg-slate-100 text-orange-500'}`}><HelpCircle className="w-4 h-4"/></div>
              <span className={`font-bold text-sm tracking-wide ${isWorker ? 'text-slate-200' : 'text-slate-700'}`}>Support Center</span>
            </div>
            <ChevronRight className={`w-4 h-4 ${isWorker ? 'text-slate-500' : 'text-slate-300'}`} />
          </li>
        </ul>
      </div>

      <button onClick={logout} className={`w-full py-4 flex items-center justify-center gap-2 font-bold rounded-2xl transition-colors tracking-widest uppercase text-[10px] shadow-sm ${isWorker ? 'bg-slate-800 text-red-400 active:bg-slate-700' : 'bg-white text-red-500 border border-slate-200 active:bg-slate-50'}`}>
        <LogOut className="w-4 h-4" />
        Log Out
      </button>
    </div>
  );
}
