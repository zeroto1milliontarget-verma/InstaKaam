import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Task, Category, Urgency, TaskStatus } from '../types';
import { MapPin, Search, Star, Clock, CheckCircle2, IndianRupee, MessageCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createJob, updateJobStatus, getNearbyWorkers, acceptJob, updateJobPaymentStatus } from '../db';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function CustomerHome() {
  const { user, setTab } = useAppContext();
  const [step, setStep] = useState<'form' | 'matches' | 'payment'>('form');
  const [draft, setDraft] = useState<Partial<Task>>({ category: 'Home Service', urgency: 'Instant', budget: 500 });
  const [taskIdToMatch, setTaskIdToMatch] = useState<string>('');
  const [matchedWorkers, setMatchedWorkers] = useState<any[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title || !draft.location || !user) return;
    setLoading(true);
    
    // Create Job
    const jobId = await createJob(user.uid, {
      title: draft.title!,
      category: draft.category as Category,
      description: draft.description || '',
      location: draft.location!,
      coords: { 
        lat: user.currentLocation?.lat || 0, 
        lng: user.currentLocation?.lng || 0 
      },
      distance: 0,
      budget: draft.budget || 0,
      urgency: draft.urgency as Urgency,
      status: 'posted' as TaskStatus,
    });
    
    if (jobId) {
      setTaskIdToMatch(jobId);
      
      // Get nearby workers using user's current location, fallback to (0,0) if blocked
      const lat = user.currentLocation?.lat || 0;
      const lng = user.currentLocation?.lng || 0;
      const workers = await getNearbyWorkers(lat, lng, 10);
      setMatchedWorkers(workers);
      setStep('matches');
    }
    setLoading(false);
  };

  const handleAcceptWorker = async (workerId: string) => {
    setSelectedWorkerId(workerId);
    setStep('payment');
  };

  const handlePayAndConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: draft.budget || 500 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "InstaKaam",
        description: "Hold payment for task in Escrow",
        order_id: data.orderId,
        handler: async function (response: any) {
          await acceptJob(taskIdToMatch, selectedWorkerId);
          await updateJobPaymentStatus(taskIdToMatch, 'Held', response.razorpay_payment_id);
          
          setDraft({ category: 'Home Service', urgency: 'Instant', budget: 500 });
          setStep('form');
          setTab('jobs');
          setLoading(false);
        },
        prefill: {
          name: user.name,
          contact: user.phone
        },
        theme: {
          color: "#0f172a"
        }
      };
      
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        alert("Payment Failed: " + response.error.description);
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      alert("Error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="pb-24">
      <AnimatePresence mode="wait">
        {step === 'form' ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Post a New Task</h2>
              <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full uppercase tracking-widest">{draft.urgency}</span>
            </div>
            
            <form onSubmit={handlePost} className="space-y-4">
              <div className="space-y-1">
                <input 
                  required autoFocus
                  type="text" placeholder="Title: e.g. Kitchen Sink Repair"
                  value={draft.title || ''} onChange={e => setDraft({...draft, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <select 
                    value={draft.category} onChange={e => setDraft({...draft, category: e.target.value as Category})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium appearance-none"
                  >
                    <option>Home Service</option>
                    <option>Labor/Delivery</option>
                    <option>Errand</option>
                    <option>Freelance/Other</option>
                  </select>
                </div>
                <div className="space-y-1 relative">
                  <span className="absolute left-4 top-3.5 text-slate-400 font-mono text-sm leading-none">₹</span>
                  <input 
                    required type="number" placeholder="Budget"
                    value={draft.budget || ''} onChange={e => setDraft({...draft, budget: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1 relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  required placeholder="Location: e.g. HSR Layout Sector 2"
                  value={draft.location || ''} onChange={e => setDraft({...draft, location: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex gap-3">
                  {(['Instant', 'Within a few hours'] as Urgency[]).map(urg => (
                    <button
                      key={urg} type="button"
                      onClick={() => setDraft({...draft, urgency: urg})}
                      className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold transition-all border ${draft.urgency === urg ? 'bg-orange-50 border-orange-500 text-orange-600 ring-1 ring-orange-100 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                    >
                      {urg}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-6 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-lg shadow-slate-200 active:scale-95 uppercase tracking-wider text-xs disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Find Workers'}
              </button>
            </form>
          </motion.div>
        ) : step === 'matches' ? (
          <motion.div 
            key="matches"
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={() => setStep('form')}
                className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ←
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Nearby Matches</h2>
                <p className="text-slate-500 text-xs">Found {matchedWorkers.length} workers near you</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Top Matches Nearby</p>
              {matchedWorkers.map(worker => (
                <div key={worker.id} className="bg-slate-50 rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-teal-300 transition-colors flex flex-col gap-4">
                  <div className="flex gap-4 items-center">
                    <img src={worker.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed='+worker.id} alt={worker.name} className="w-12 h-12 rounded-xl object-cover bg-slate-300 shadow-inner" />
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-sm tracking-tight">{worker.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{worker.rating} ★ • {worker.distance === Infinity ? '?' : worker.distance.toFixed(1)} km away</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-teal-600 font-mono">₹{worker.hourlyRate || 200}/hr</p>
                      <button 
                        onClick={() => handleAcceptWorker(worker.id)}
                        disabled={loading}
                        className="mt-1 text-[10px] bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded-lg font-bold uppercase tracking-wider transition-colors active:scale-95 disabled:opacity-50"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="payment"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="p-6 text-center mt-10"
          >
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IndianRupee className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Pay securely in escrow</h2>
              <p className="text-xs text-slate-500 mt-2 mb-6">Payment is held safely until the worker completes the job.</p>
              
              <div className="text-4xl font-mono italic font-bold text-slate-800 mb-8">
                ₹{draft.budget || 500}
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-left border border-slate-100 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <p className="text-[10px] text-slate-600 font-medium">We don't transfer this money to the worker until you verify the task is complete.</p>
              </div>

              <button 
                onClick={handlePayAndConfirm}
                disabled={loading}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-transform active:scale-95 text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Pay & Confirm Worker'}
              </button>
              
              <button 
                onClick={() => setStep('matches')}
                disabled={loading}
                className="w-full mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600"
              >
                Go Back
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CustomerJobs() {
  const { customerTasks } = useAppContext();

  const handleReleasePayment = async (taskId: string) => {
    await updateJobPaymentStatus(taskId, 'Released');
  };

  const handleRaiseIssue = () => {
    alert("Dispute raised. A support agent will review this task.");
  };

  if (customerTasks.length === 0) return (
    <div className="p-6 flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 border border-slate-200">
        <Clock className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="font-bold text-slate-800 text-lg">No active jobs</h3>
      <p className="text-slate-500 text-sm mt-1">Post a new task to get started.</p>
    </div>
  );

  return (
    <div className="p-6 pb-24 space-y-6">
      <h2 className="text-lg font-bold text-slate-800 tracking-tight">Active Jobs</h2>
      
      {customerTasks.map(task => (
        <div key={task.id} className="bg-white rounded-3xl p-5 shadow-xl border border-slate-200 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 text-[10px] font-bold rounded uppercase tracking-wider mb-2 inline-block">{task.category}</span>
              <h3 className="font-bold text-slate-800 text-sm">{task.title}</h3>
            </div>
            <div className="font-mono font-bold text-orange-600">
              ₹{task.budget}
            </div>
          </div>
          
          {task.worker && (
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl mb-4 border border-slate-100">
              <img src={task.worker.avatarUrl} alt="" className="w-10 h-10 rounded-xl" />
              <div className="flex-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Assigned Worker</p>
                <p className="text-sm font-bold text-slate-800">{task.worker.name}</p>
              </div>
              {task.status === 'in-progress' && (
                <button className="flex items-center justify-center p-2.5 bg-white border border-slate-200 rounded-xl text-teal-600 shadow-sm active:scale-95 transition-all">
                  <MessageCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <div className="mt-2 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Status: {task.status.replace('-', ' ')} {task.paymentStatus === 'Held' && '(Payment Held)'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">ID: #{task.id.slice(-4)}</span>
            </div>
            <div className="flex gap-1 h-1.5">
              {['posted', 'matched', 'in-progress', 'completed', 'paid'].map((s, i, arr) => {
                const currentIndex = arr.indexOf(task.status);
                const isActive = i <= currentIndex;
                const isPaid = task.status === 'paid';
                return (
                  <div key={s} className={`flex-1 rounded-full ${isActive ? (isPaid ? 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]' : 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]') : 'bg-slate-200'}`} />
                );
              })}
            </div>
          </div>

          {(task.status === 'completed') && (
            <div className="flex gap-3">
              <button 
                onClick={() => handleReleasePayment(task.id)}
                className="flex-1 mt-2 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] shadow-sm transition-transform active:scale-95"
              >
                Release Payment
              </button>
            </div>
          )}
          {task.status === 'in-progress' && (
            <button 
              onClick={handleRaiseIssue}
              className="w-full mt-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-transform active:scale-95"
            >
              Raise Issue
            </button>
          )}
          {task.status === 'paid' && (
            <div className="w-full mt-2 py-3 bg-teal-50/50 text-teal-600 rounded-xl font-bold flex items-center justify-center gap-2 border border-teal-100 text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4" /> Payment Released
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
