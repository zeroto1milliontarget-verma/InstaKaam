import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { Role, Tab, Task } from './types';
import { getUserProfile, updateUserLocation } from './db';

interface AppContextType {
  user: any | null;
  role: Role;
  setRole: (r: Role) => void;
  tab: Tab;
  setTab: (t: Tab) => void;
  
  customerTasks: Task[];
  workerTasks: Task[];
  availableJobs: Task[];
  
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<Role>('customer');
  const [tab, setTab] = useState<Tab>('home');
  const [initialized, setInitialized] = useState(false);
  
  const [customerTasks, setCustomerTasks] = useState<Task[]>([]);
  const [workerTasks, setWorkerTasks] = useState<Task[]>([]);
  const [availableJobs, setAvailableJobs] = useState<Task[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const profile = await getUserProfile(fbUser.uid);
        if (profile) {
          setUser({ uid: fbUser.uid, ...profile });
          setRole(profile.role as Role);
          
          // Get live location
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              updateUserLocation(fbUser.uid, pos.coords.latitude, pos.coords.longitude);
            },
            (err) => console.error("Location error", err)
          );
        } else {
          setUser(null); // Wait for profile completion
        }
      } else {
        setUser(null);
      }
      setInitialized(true);
    });
    return unsub;
  }, []);

  // Sync Jobs based on Role
  useEffect(() => {
    if (!user) return;

    let unsubTasks: any;
    let unsubAvailable: any;

    if (user.role === 'customer') {
      const q = query(
        collection(db, 'jobs'), 
        where('customerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      unsubTasks = onSnapshot(q, (snap) => {
        setCustomerTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      }, err => console.error(err));
    } else if (user.role === 'worker') {
      const qAssigned = query(
        collection(db, 'jobs'), 
        where('workerId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      unsubTasks = onSnapshot(qAssigned, (snap) => {
        setWorkerTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      }, err => console.error(err));

      const qAvailable = query(
        collection(db, 'jobs'), 
        where('status', '==', 'posted'),
        orderBy('createdAt', 'desc') // we'll sort by distance locally since firestore can't easily query geo without hash
      );
      unsubAvailable = onSnapshot(qAvailable, (snap) => {
        setAvailableJobs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      }, err => console.error(err));
    }

    return () => {
      if(unsubTasks) unsubTasks();
      if(unsubAvailable) unsubAvailable();
    };
  }, [user]);

  const logout = () => {
    auth.signOut();
  };

  if (!initialized) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <AppContext.Provider value={{
      user, role, setRole,
      tab, setTab,
      customerTasks, workerTasks, availableJobs,
      logout
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
