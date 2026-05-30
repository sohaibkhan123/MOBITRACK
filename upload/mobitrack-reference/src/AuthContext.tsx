import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { UserProfile } from './types';
import { auth } from './firebase';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, displayName?: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: any) => {
      setUser(currentUser);
      if (currentUser) {
        setProfile({
          uid: currentUser.uid || currentUser.id,
          email: currentUser.email || '',
          displayName: currentUser.displayName || 'User',
          role: currentUser.role || 'admin'
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, displayName?: string, role?: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName, role })
      });
      if (!res.ok) {
        throw new Error('Authentication failed on the server');
      }
      const data = await res.json();
      if (data.success && data.user) {
        localStorage.setItem('mobitrack_user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
      } else {
        throw new Error(data.error || 'Unknown auth error');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login connection error: Please make sure Node server is up and MySQL/fallback can execute.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
