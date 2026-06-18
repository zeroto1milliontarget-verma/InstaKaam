/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppProvider, useAppContext } from './AppContext';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { CustomerHome, CustomerJobs } from './components/CustomerScreens';
import { WorkerHome, WorkerJobs } from './components/WorkerScreens';
import { ProfileScreen } from './components/ProfileScreen';
import { LoginScreen } from './components/LoginScreen';

function AppContent() {
  const { user, role, tab } = useAppContext();

  if (!user) {
    return <LoginScreen onLoginComplete={() => window.location.reload()} />;
  }

  return (
    <div className={`min-h-screen w-full max-w-md mx-auto shadow-2xl relative border-x transition-colors duration-300 ${role === 'worker' ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
      <TopBar />
      
      <main className="overflow-x-hidden min-h-[calc(100vh-60px)]">
        {role === 'customer' && (
          <>
            {tab === 'home' && <CustomerHome />}
            {tab === 'jobs' && <CustomerJobs />}
          </>
        )}
        
        {role === 'worker' && (
          <>
            {tab === 'home' && <WorkerHome />}
            {tab === 'jobs' && <WorkerJobs />}
          </>
        )}

        {tab === 'profile' && <ProfileScreen />}
      </main>

      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

