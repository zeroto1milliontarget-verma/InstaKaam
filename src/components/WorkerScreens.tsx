import { useAppContext } from '../AppContext';
import { IndianRupee, MapPin, Clock, CalendarCheck, CheckCircle2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from '../types';
import { acceptJob, updateJobStatus, calculateDistance } from '../db';
import { useState } from 'react';

export function WorkerHome() {
  const { user, availableJobs, setTab, workerTasks } = useAppContext();
  const [loading, setLoading] = useState(false);

  const workerEarnings = (workerTasks || []).filter(t => t.status === 'paid').reduce((sum, task) => sum + task.budget, 0);

  const handleAccept = async (job: Task) => {
    if (!user) return;
    setLoading(true);
    await acceptJob(job.id, user.uid);
    setTab('jobs');
    setLoading(false);
  };

  const processedJobs = availableJobs.map((job) => {
    let dist = Infinity;
    if (job.coords && user?.currentLocation) {
      dist = calculateDistance(job.coords.lat, job.coords.lng, user.currentLocation.lat, user.currentLocation.lng);
    }
    return { ...job, distance: dist };
  }).sort((a, b) => {
    // order by urgency first (Instant < Within a few hours)
    const urgA = a.urgency === 'Instant' ? 0 : 1;
    const urgB = b.urgency === 'Instant' ? 0 : 1;
    if (urgA !== urgB) return urgA - urgB;
    return a.distance - b.distance;
  });

  return (
    <div className="p-6 pb-24 flex flex-col min-h-full">
      <div className="flex justify-between items-end mb-6 mt-2">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Worker Hub</h2>
          <p className="text-teal-400 text-[10px] font-bold tracking-widest uppercase mt-1">Status: Online</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Today's Earnings</p>
          <p className="text-2xl font-black text-white italic font-mono">₹{workerEarnings}</p>
        </div>
      </div>

      {processedJobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-12 bg-slate-800/50 rounded-3xl border border-slate-800 p-8">
          <CalendarCheck className="w-8 h-8 text-teal-500/50 mb-4" />
          <h3 className="font-bold text-white text-sm">No jobs nearby</h3>
          <p className="text-slate-500 text-xs mt-2">We'll alert you when tasks pop up.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Incoming Requests</p>
          <AnimatePresence>
            {processedJobs.map(job => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                key={job.id} className="bg-slate-800 p-5 rounded-2xl border-l-4 border-orange-500 shadow-xl"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-bold rounded uppercase tracking-wider">
                    {job.category}
                  </span>
                  <span className="text-white font-mono font-bold text-lg">₹{job.budget}</span>
                </div>
                
                <h3 className="text-sm font-bold text-white mb-1.5">{job.title}</h3>
                <p className="text-xs text-slate-400 mb-5 font-mono">{job.location} • {job.distance.toFixed(1)} km away • {job.urgency}</p>

                <div className="flex gap-3">
                  <button className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-[10px] uppercase tracking-wider font-bold rounded-xl transition-colors">
                    View Map
                  </button>
                  <button 
                    onClick={() => handleAccept(job)}
                    className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] uppercase tracking-wider font-bold rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-colors active:scale-95"
                  >
                    Accept Job
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export function WorkerJobs() {
  const { workerTasks, addWorkerEarnings } = useAppContext();

  const handleStatusChange = async (jobId: string, currentStatus: string, budget: number) => {
    if (currentStatus === 'in-progress') {
      await updateJobStatus(jobId, 'completed');
      setTimeout(async () => {
        // Mock client acceptance for demo if wanted? Actually, the customer app flow has a 'completed' state where the customer clicks "Pay".
        // The worker just sets it to 'completed' and waits for the customer to pay!
        // wait, I don't need to auto-set it to paid here if the customer handles it. So I'll just leave it at 'completed'.
      }, 2000);
    }
  };

  if (workerTasks.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[60vh] text-center">
        <h3 className="font-bold text-white text-sm mb-2">Queue is empty</h3>
        <p className="text-slate-500 text-xs">Accept jobs from the Hub to earn.</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-24 space-y-4">
      <h2 className="text-lg font-bold text-white tracking-tight mb-6">Active Assignments</h2>
      
      {workerTasks.map(task => (
        <div key={task.id} className="bg-slate-800/50 p-5 rounded-3xl border-l-4 border-teal-500 ring-1 ring-teal-500/20 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
             <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 text-[10px] font-bold rounded uppercase tracking-widest italic">
               {task.status.replace('-', ' ')}
             </span>
             <span className="font-bold font-mono text-white text-lg">₹{task.budget}</span>
          </div>
          
          <h3 className="font-bold text-white text-sm mb-1.5">{task.title}</h3>
          
          <div className="text-xs text-slate-400 font-mono mb-5 flex flex-col gap-2">
             <span>Loc: {task.location}</span>
             {task.status === 'in-progress' && (
               <div className="flex items-center justify-between text-teal-400">
                 <span>🟢 Task started</span>
                 <button className="flex items-center gap-1.5 bg-slate-700/50 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-white transition-colors">
                   <MessageCircle className="w-3.5 h-3.5" />
                   <span className="text-[10px] uppercase tracking-widest font-bold">Client Chat</span>
                 </button>
               </div>
             )}
          </div>

          <div className="pt-4 border-t border-slate-700/50">
            {task.status === 'in-progress' && (
              <button 
                onClick={() => handleStatusChange(task.id, task.status, task.budget)}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-[10px] uppercase font-bold tracking-widest shadow-[0_0_15px_rgba(20,184,166,0.2)] transition-transform active:scale-95"
              >
                Mark Completed
              </button>
            )}
            
            {task.status === 'completed' && (
              <div className="bg-slate-900 text-teal-500 py-3 rounded-xl text-center text-[10px] uppercase tracking-widest font-bold border border-slate-700">
                 Awaiting Client Auth...
              </div>
            )}

            {task.status === 'paid' && (
              <div className="bg-teal-500/10 text-teal-400 py-3 rounded-xl text-center text-[10px] uppercase tracking-widest font-bold border border-teal-500/20 flex flex-col items-center justify-center gap-1 group">
                 <CheckCircle2 className="w-5 h-5 text-teal-500 mb-1" /> Payment Verified
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
