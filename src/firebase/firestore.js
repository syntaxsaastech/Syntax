import {
    db,
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    addDoc,
    serverTimestamp,
    onSnapshot
} from './config';

// ============================================
// USERS
// ============================================

// Add User (used in Signup)
export const addUser = async (uid, userData) => {
    try {
        await setDoc(doc(db, 'users', uid), {
            ...userData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Add User Error:', error);
        return { success: false, error: error.message };
    }
};

// Get User
export const getUser = async (uid) => {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: docSnap.data() };
        }
        return { success: false, error: 'User not found' };
    } catch (error) {
        console.error('Get User Error:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// CLIENTS
// ============================================

// Add Client
export const addClient = async (clientData) => {
    try {
        const docRef = await addDoc(collection(db, 'clients'), {
            ...clientData,
            status: clientData.status || 'Active',
            projects: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Add Client Error:', error);
        return { success: false, error: error.message };
    }
};

// Get All Clients (Real-time)
export const subscribeClients = (callback) => {
    return onSnapshot(
        query(collection(db, 'clients'), orderBy('createdAt', 'desc')),
        (snapshot) => {
            const clients = [];
            snapshot.forEach((doc) => {
                clients.push({ id: doc.id, ...doc.data() });
            });
            callback(clients);
        },
        (error) => {
            console.error('Subscribe Clients Error:', error);
            callback([]);
        }
    );
};

// Get All Clients (One-time)
export const getClients = async () => {
    try {
        const querySnapshot = await getDocs(collection(db, 'clients'));
        const clients = [];
        querySnapshot.forEach((doc) => {
            clients.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: clients };
    } catch (error) {
        console.error('Get Clients Error:', error);
        return { success: false, error: error.message };
    }
};

// Get Client by ID
export const getClient = async (clientId) => {
    try {
        const docRef = doc(db, 'clients', clientId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        }
        return { success: false, error: 'Client not found' };
    } catch (error) {
        console.error('Get Client Error:', error);
        return { success: false, error: error.message };
    }
};

// Update Client
export const updateClient = async (clientId, data) => {
    try {
        const docRef = doc(db, 'clients', clientId);
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Update Client Error:', error);
        return { success: false, error: error.message };
    }
};

// Delete Client
export const deleteClient = async (clientId) => {
    try {
        await deleteDoc(doc(db, 'clients', clientId));
        return { success: true };
    } catch (error) {
        console.error('Delete Client Error:', error);
        return { success: false, error: error.message };
    }
};

// Get Clients by Industry
export const getClientsByIndustry = async (industry) => {
    try {
        const q = query(collection(db, 'clients'), where('industry', '==', industry));
        const querySnapshot = await getDocs(q);
        const clients = [];
        querySnapshot.forEach((doc) => {
            clients.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: clients };
    } catch (error) {
        console.error('Get Clients by Industry Error:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// CONTACTS
// ============================================

// Submit Contact Form
export const submitContact = async (formData) => {
    try {
        const docRef = await addDoc(collection(db, 'contacts'), {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || '',
            subject: formData.subject || '',
            message: formData.message,
            status: 'unread',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Submit Contact Error:', error);
        return { success: false, error: error.message };
    }
};

// Get All Contacts
export const getContacts = async () => {
    try {
        const q = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const contacts = [];
        querySnapshot.forEach((doc) => {
            contacts.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: contacts };
    } catch (error) {
        console.error('Get Contacts Error:', error);
        return { success: false, error: error.message };
    }
};

// Update Contact Status
export const updateContactStatus = async (contactId, status) => {
    try {
        const docRef = doc(db, 'contacts', contactId);
        await updateDoc(docRef, {
            status: status,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Update Contact Error:', error);
        return { success: false, error: error.message };
    }
};