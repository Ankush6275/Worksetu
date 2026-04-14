// Import Firebase functions
import { 
  auth, 
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc
} from './firebase-config.js';

// Check if user is logged in
export function checkAuthState(callback) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(user);
    } else {
      callback(null);
    }
  });
}

// Register new user with email/password
export async function registerUser(email, password, userData) {
  try {
    // Create authentication account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save additional user data to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: email,
      ...userData,
      createdAt: new Date().toISOString(),
      trustScore: 50,
      isActive: true
    });

    return { success: true, user: user };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, error: error.message };
  }
}

// Login user with email/password
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return { success: true, user: user, userData: userData };
    } else {
      // User document doesn't exist - return user object with empty userData
      // Let the calling page handle document creation if needed
      console.warn('User document not found in Firestore for:', user.uid);
      return { success: true, user: user, userData: {} };
    }
  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = 'Login failed';
    
    if (error.code === 'auth/invalid-credential') {
      errorMessage = 'Invalid email or password';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'User not found';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Wrong password';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many attempts. Please try again later';
    }
    
    return { success: false, error: errorMessage };
  }
}

// Logout user
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
}

// Get current user
export function getCurrentUser() {
  return auth.currentUser;
}

// Get user data from Firestore
export async function getUserData(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    return { success: false, error: error.message };
  }
}

// Update user profile
export async function updateUserProfile(uid, updates) {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, updates, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message };
  }
}

// Redirect to appropriate dashboard based on user type
export function redirectToDashboard(userType) {
  if (userType === 'worker') {
    window.location.href = '../pages/worker-dashboard.html';
  } else if (userType === 'employer') {
    window.location.href = '../pages/employer-dashboard.html';
  } else if (userType === 'admin') {
    window.location.href = '../pages/admin-dashboard.html';
  }
}

// Protect pages - redirect to login if not authenticated
export function protectPage(allowedUserTypes = []) {
  checkAuthState(async (user) => {
    if (!user) {
      // Not logged in - redirect to login
      window.location.href = '../pages/login.html';
    } else {
      // Logged in - check user type
      const userData = await getUserData(user.uid);
      if (userData.success && allowedUserTypes.length > 0) {
        if (!allowedUserTypes.includes(userData.data.userType)) {
          // Wrong user type - redirect to their dashboard
          redirectToDashboard(userData.data.userType);
        }
      }
    }
  });
}