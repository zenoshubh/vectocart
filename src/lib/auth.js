import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth/web-extension';
import { auth } from './firebase';

// Auth helper functions with better error handling
export const signIn = async (email, password) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized. Please check Firebase configuration.');
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = error.message;
    switch (error.code) {
      case 'auth/configuration-not-found':
        errorMessage = 'Authentication is not configured. Please contact support.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email address.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password. Please try again.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.';
        break;
    }
    
    return { user: null, error: errorMessage };
  }
};

export const signUp = async (email, password) => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth not initialized. Please check Firebase configuration.');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = error.message;
    switch (error.code) {
      case 'auth/configuration-not-found':
        errorMessage = 'Authentication is not configured. Please contact support.';
        break;
      case 'auth/email-already-in-use':
        errorMessage = 'An account with this email already exists.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters long.';
        break;
    }
    
    return { user: null, error: errorMessage };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
