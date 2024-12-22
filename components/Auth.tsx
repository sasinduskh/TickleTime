"use client"

import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Input } from './ui/input';

interface AuthProps {
  onUserChange: (user: User | null) => void;
}

export default function Auth({ onUserChange }: AuthProps) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hourlyRate, setHourlyRate] = useState<string>('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      onUserChange(user);
    });

    return () => unsubscribe();
  }, [onUserChange]);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
    
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          hourlyRate: parseFloat(hourlyRate) || 2550, // Default to 2550 if not provided
        });
      }
    
      setError(null);
    } catch (error) {
      console.error('Error signing in with Google', error);
      if (error instanceof Error) {
        if (error.message.includes('auth/unauthorized-domain')) {
          setError('Unauthorized domain. Please add this domain to your Firebase authorized domains list.');
        } else {
          setError(error.message);
        }
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <div>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {user ? (
        <div className="flex items-center gap-4">
          <span>Welcome, {user.displayName}</span>
          <Button onClick={signOut}>Sign Out</Button>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              placeholder="Hourly Rate (LKR)"
              className="mr-2"
            />
          </div>
          <Button onClick={signIn}>Sign In with Google</Button>
        </>
      )}
    </div>
  );
}

