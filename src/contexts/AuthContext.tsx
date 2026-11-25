import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, googleAuthProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { RoleType, UserProfile } from '../types';

export const BOOTSTRAP_SUPER_ADMIN_EMAIL = 'dawah.bd.21@gmail.com';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: RoleType;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: { displayName: string; bio?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<RoleType>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubRole: (() => void) | null = null;
    let unsubInvite: (() => void) | null = null;
    let loadingFallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (unsubProfile) unsubProfile();
      if (unsubRole) unsubRole();
      if (unsubInvite) unsubInvite();
      if (loadingFallbackTimer) clearTimeout(loadingFallbackTimer);

      if (!firebaseUser) {
        setProfile(null);
        setRole('user');
        setLoading(false);
        return;
      }

      const normalizedEmail = firebaseUser.email?.toLowerCase() || '';
      const isBootstrapEmail =
        normalizedEmail === BOOTSTRAP_SUPER_ADMIN_EMAIL && firebaseUser.emailVerified;

      if (isBootstrapEmail) {
        setRole('super_admin');
        setLoading(false);
      } else {
        setLoading(true);
        loadingFallbackTimer = setTimeout(() => {
          setLoading(false);
        }, 4000);
      }

      // Attach listeners immediately so UI is never blocked by background Firestore writes
      const userRef = doc(db, 'users', firebaseUser.uid);
      unsubProfile = onSnapshot(
        userRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        },
        (err) => {
          console.warn('Profile listener error:', err);
        }
      );

      let invitedRoleFromDoc: RoleType | null = null;
      if (normalizedEmail && firebaseUser.emailVerified && !isBootstrapEmail) {
        unsubInvite = onSnapshot(
          doc(db, 'admin_invites', normalizedEmail),
          (invSnap) => {
            if (invSnap.exists()) {
              const r = invSnap.data().role as RoleType;
              if (r && ['super_admin', 'admin', 'editor'].includes(r)) {
                invitedRoleFromDoc = r;
                setRole(r);
                setLoading(false);
              }
            }
          },
          () => {}
        );
      }

      const roleDocRef = doc(db, 'user_roles', firebaseUser.uid);
      unsubRole = onSnapshot(
        roleDocRef,
        (docSnap) => {
          if (isBootstrapEmail) {
            setRole('super_admin');
          } else if (invitedRoleFromDoc) {
            setRole(invitedRoleFromDoc);
          } else if (docSnap.exists()) {
            const r = docSnap.data().role as RoleType;
            setRole(r || 'user');
          } else {
            setRole('user');
          }
          if (loadingFallbackTimer) clearTimeout(loadingFallbackTimer);
          setLoading(false);
        },
        () => {
          setRole(isBootstrapEmail ? 'super_admin' : invitedRoleFromDoc || 'user');
          if (loadingFallbackTimer) clearTimeout(loadingFallbackTimer);
          setLoading(false);
        }
      );

      // Background sync: /users/{uid} profile and /user_roles/{uid} bootstrap/invite
      void (async () => {
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || normalizedEmail.split('@')[0] || 'পাঠক',
              email: normalizedEmail || firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              bio: '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          console.warn('Profile sync warning:', err);
        }

        if (isBootstrapEmail) {
          try {
            const roleSnap = await getDoc(roleDocRef);
            if (!roleSnap.exists()) {
              await setDoc(roleDocRef, {
                uid: firebaseUser.uid,
                email: normalizedEmail || BOOTSTRAP_SUPER_ADMIN_EMAIL,
                role: 'super_admin',
                assignedBy: firebaseUser.uid,
                updatedAt: serverTimestamp(),
              });
            }
          } catch (err) {
            console.warn('Bootstrap super admin role sync warning:', err);
          }
        } else if (normalizedEmail && firebaseUser.emailVerified) {
          try {
            const inviteSnap = await getDoc(doc(db, 'admin_invites', normalizedEmail));
            if (inviteSnap.exists()) {
              const inv = inviteSnap.data() as { role?: RoleType; assignedBy?: string };
              if (inv.role && ['super_admin', 'admin', 'editor'].includes(inv.role)) {
                invitedRoleFromDoc = inv.role;
                setRole(inv.role);
                const existingRoleSnap = await getDoc(roleDocRef);
                if (!existingRoleSnap.exists() || existingRoleSnap.data().role !== inv.role) {
                  await setDoc(roleDocRef, {
                    uid: firebaseUser.uid,
                    email: normalizedEmail,
                    role: inv.role,
                    assignedBy: inv.assignedBy || '',
                    updatedAt: serverTimestamp(),
                  });
                }
              }
            }
          } catch (err) {
            console.warn('Admin invite sync warning:', err);
          } finally {
            if (loadingFallbackTimer) clearTimeout(loadingFallbackTimer);
            setLoading(false);
          }
        }
      })();
    });

    return () => {
      unsubAuth();
      if (unsubProfile) unsubProfile();
      if (unsubRole) unsubRole();
      if (unsubInvite) unsubInvite();
      if (loadingFallbackTimer) clearTimeout(loadingFallbackTimer);
    };
  }, []);

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleAuthProvider);
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const registerWithEmail = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }
    const userRef = doc(db, 'users', cred.user.uid);
    try {
      await setDoc(userRef, {
        uid: cred.user.uid,
        displayName: name.trim() || email.split('@')[0],
        email: cred.user.email || email.trim(),
        photoURL: '',
        bio: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${cred.user.uid}`);
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (data: { displayName: string; bio?: string; photoURL?: string }) => {
    if (!auth.currentUser) throw new Error('লগইন করা প্রয়োজন');
    const uid = auth.currentUser.uid;
    const userRef = doc(db, 'users', uid);
    try {
      await updateDoc(userRef, {
        displayName: data.displayName.trim(),
        bio: (data.bio || '').trim(),
        photoURL: data.photoURL || '',
        updatedAt: serverTimestamp(),
      });
      await updateProfile(auth.currentUser, {
        displayName: data.displayName.trim(),
        photoURL: data.photoURL && data.photoURL.startsWith('http') ? data.photoURL : auth.currentUser.photoURL,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const isSuperAdmin =
    role === 'super_admin' ||
    (Boolean(user?.emailVerified) && user?.email?.toLowerCase() === BOOTSTRAP_SUPER_ADMIN_EMAIL);
  const isAdmin = isSuperAdmin || role === 'admin';
  const isStaff = isAdmin || role === 'editor';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        isSuperAdmin,
        isAdmin,
        isStaff,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
