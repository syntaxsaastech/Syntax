import {
    auth,
    db,
    googleProvider,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    updateProfile,
    sendEmailVerification,
    signInWithPopup,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from './config';

// ============================================
// SIGN UP
// ============================================
export const signUpUser = async (email, password, userData) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile
        if (userData.name) {
            await updateProfile(user, { displayName: userData.name });
        }

        // Send email verification
        await sendEmailVerification(user);

        // Save user to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: userData.name || '',
            email: user.email,
            phone: userData.phone || '',
            photoURL: userData.photoURL || '',
            role: 'user',
            emailVerified: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return { success: true, user };
    } catch (error) {
        console.error('Sign Up Error:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// SIGN IN
// ============================================
export const signInUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Sign In Error:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// SIGN IN WITH GOOGLE
// ============================================
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: user.displayName || '',
                email: user.email,
                photoURL: user.photoURL || '',
                role: 'user',
                emailVerified: user.emailVerified,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }

        return { success: true, user };
    } catch (error) {
        console.error('Google Sign In Error:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// SIGN OUT
// ============================================
export const logoutUser = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Sign Out Error:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// RESET PASSWORD
// ============================================
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error) {
        console.error('Reset Password Error:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// GET CURRENT USER
// ============================================
export const getCurrentUser = () => {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
};

// ============================================
// AUTH STATE OBSERVER
// ============================================
export const onAuthStateChange = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// ============================================
// GET USER DATA FROM FIRESTORE
// ============================================
export const getUserData = async (uid) => {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        } else {
            return { success: false, error: 'User not found' };
        }
    } catch (error) {
        console.error('Get User Error:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// UPDATE USER PROFILE
// ============================================
export const updateUserProfile = async (uid, data) => {
    try {
        const docRef = doc(db, 'users', uid);
        await setDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        }, { merge: true });
        return { success: true };
    } catch (error) {
        console.error('Update User Error:', error);
        return { success: false, error: error.message };
    }
};