import { doc, getDoc, getDocs, setDoc, updateDoc, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, GeoPoint } from 'firebase/firestore';

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const p = 0.017453292519943295;    // Math.PI / 180
  const c = Math.cos;
  const a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;
  const R = 6371; // Earth radius in km
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function getNearbyWorkers(lat: number, lng: number, maxDistance: number = 5) {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'worker'));
    const snap = await getDocs(q);
    const workers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    
    return workers.map((w: any) => {
      if (w.currentLocation) {
        w.distance = calculateDistance(lat, lng, w.currentLocation.lat, w.currentLocation.lng);
      } else {
        w.distance = Infinity;
      }
      return w;
    })
    .filter((w: any) => w.distance <= maxDistance)
    .sort((a: any, b: any) => a.distance - b.distance);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
    return [];
  }
}

import { db, auth } from './firebase';
import { Task, Role } from './types';

export enum OperationType {
  CREATE = 'create', UPDATE = 'update', DELETE = 'delete', LIST = 'list', GET = 'get', WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function getUserProfile(uid: string) {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch(error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

export async function createUserProfile(uid: string, data: any) {
  try {
    await setDoc(doc(db, 'users', uid), data);
  } catch(error) {
    handleFirestoreError(error, OperationType.CREATE, `users/${uid}`);
  }
}

export async function updateUserLocation(uid: string, lat: number, lng: number) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      currentLocation: { lat, lng }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function createJob(customerId: string, jobData: Omit<Task, 'id'>) {
  try {
    const docRef = doc(collection(db, 'jobs'));
    await setDoc(docRef, { ...jobData, createdAt: Date.now(), customerId });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'jobs');
    return null;
  }
}

export async function acceptJob(jobId: string, workerId: string) {
  try {
    const worker = await getUserProfile(workerId);
    await updateDoc(doc(db, 'jobs', jobId), {
      status: 'matched',
      workerId,
      worker: {
        name: worker?.name || 'Unknown',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${workerId}`,
        rating: worker?.rating || 5
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `jobs/${jobId}`);
  }
}

export async function updateJobStatus(jobId: string, status: string) {
  try {
    await updateDoc(doc(db, 'jobs', jobId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `jobs/${jobId}`);
  }
}

export async function updateJobPaymentStatus(jobId: string, paymentStatus: 'Held' | 'Released', razorpayOrderId?: string) {
  try {
    const updateData: any = { paymentStatus };
    if (razorpayOrderId) updateData.paymentId = razorpayOrderId;
    // When held, move job to in-progress
    if (paymentStatus === 'Held') updateData.status = 'in-progress';
    if (paymentStatus === 'Released') updateData.status = 'paid';
    await updateDoc(doc(db, 'jobs', jobId), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `jobs/${jobId}`);
  }
}
