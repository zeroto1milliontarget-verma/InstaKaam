import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getUserProfile, createUserProfile } from '../db';

export function LoginScreen({ onLoginComplete }: { onLoginComplete: (userData: any) => void }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP' | 'PROFILE'>('PHONE');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Profile form
  const [name, setName] = useState('');
  const [role, setRole] = useState<'customer'|'worker'>('customer');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  }, []);

  const sendOtp = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const appVerifier = window.recaptchaVerifier;
      const fullPhone = `+91${phone}`;
      const res = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      setConfirmationResult(res);
      setStep('OTP');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setErrorMsg('Phone Authentication is not enabled. Please go to the Firebase Console -> Authentication -> Sign-in method, and enable Phone Auth.');
      } else {
        setErrorMsg('Failed to send OTP: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      
      const userDoc = await getUserProfile(res.user.uid);
      if (userDoc) {
        onLoginComplete(userDoc);
      } else {
        setStep('PROFILE');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to sign in with Google: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      if (!confirmationResult) return;
      const res = await confirmationResult.confirm(otp);
      
      const userDoc = await getUserProfile(res.user.uid);
      if (userDoc) {
        onLoginComplete(userDoc);
      } else {
        setStep('PROFILE');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Invalid OTP.');
    } finally {
      setLoading(false);
    }
  };

  const completeProfile = async () => {
    if (!auth.currentUser) return;
    try {
      setLoading(true);
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      }).catch(() => null);

      let currentLocation = null;
      if (position) {
        currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      }

      const newProfile = {
        name,
        phone: auth.currentUser.phoneNumber || `+91${phone}`,
        role,
        rating: 5.0,
        ...(currentLocation ? { currentLocation } : {})
      };

      await createUserProfile(auth.currentUser.uid, newProfile);
      onLoginComplete(newProfile);
    } catch (err) {
      console.error('Error completing profile:', err);
      alert('Failed to create profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center p-6 w-full max-w-md mx-auto">
      <div className="bg-slate-800 p-8 rounded-3xl text-white shadow-2xl border border-slate-700">
        <h2 className="text-2xl font-bold mb-6">Welcome</h2>
        
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm mb-6">
            {errorMsg}
          </div>
        )}

        {step === 'PHONE' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">Enter your 10-digit mobile number to sign in or register.</p>
            <div className="flex bg-slate-900 border border-slate-700 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-teal-500">
              <span className="flex items-center justify-center bg-slate-800 text-slate-300 px-4 border-r border-slate-700 font-medium tracking-wider">
                +91
              </span>
              <input 
                type="tel" 
                className="w-full bg-transparent p-3 text-white focus:outline-none tracking-widest" 
                value={phone} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 10) setPhone(val);
                }} 
                placeholder="98765 43210"
              />
            </div>
            <button 
              onClick={sendOtp} 
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest">
                <span className="bg-slate-800 px-2 text-slate-500 font-bold">Or continue with</span>
              </div>
            </div>

            <button 
              onClick={signInWithGoogle} 
              disabled={loading}
              className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Sign In with Google
            </button>
          </div>
        )}

        {step === 'OTP' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">Enter the code sent to +91 {phone}.</p>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white tracking-widest text-center text-lg" 
              value={otp} 
              onChange={e => setOtp(e.target.value)} 
              placeholder="123456"
            />
            <button 
              onClick={verifyOtp}
              disabled={loading}
              className="w-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
        )}

        {step === 'PROFILE' && (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">Complete your profile to continue.</p>
            <input 
              type="text" 
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Full Name"
            />
            <div className="flex gap-4 mb-4">
              <button 
                onClick={() => setRole('customer')} 
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${role === 'customer' ? 'bg-teal-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}
              >
                Customer
              </button>
              <button 
                onClick={() => setRole('worker')} 
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${role === 'worker' ? 'bg-orange-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}
              >
                Worker
              </button>
            </div>
            <button 
              onClick={completeProfile}
              disabled={loading || !name}
              className="w-full bg-white hover:bg-slate-200 text-slate-900 font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Finish Setup'}
            </button>
          </div>
        )}
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
}

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
