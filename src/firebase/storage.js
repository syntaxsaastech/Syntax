import {
    storage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
    uploadBytesResumable
} from './config';

// ============================================
// UPLOAD FILE
// ============================================
export const uploadFile = async (file, path) => {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { success: true, url: downloadURL };
    } catch (error) {
        console.error('Upload File Error:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// UPLOAD WITH PROGRESS
// ============================================
export const uploadFileWithProgress = (file, path, onProgress) => {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onProgress) {
                    onProgress(progress);
                }
            },
            (error) => {
                console.error('Upload Error:', error);
                reject({ success: false, error: error.message });
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve({ success: true, url: downloadURL });
                } catch (error) {
                    reject({ success: false, error: error.message });
                }
            }
        );
    });
};

// ============================================
// UPLOAD PROFILE PICTURE
// ============================================
export const uploadProfilePicture = async (file, uid) => {
    try {
        const fileExtension = file.name.split('.').pop();
        const path = `profile-pictures/${uid}/profile.${fileExtension}`;
        const result = await uploadFile(file, path);
        return result;
    } catch (error) {
        console.error('Upload Profile Picture Error:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// UPLOAD CLIENT LOGO
// ============================================
export const uploadClientLogo = async (file, clientId) => {
    try {
        const fileExtension = file.name.split('.').pop();
        const path = `client-logos/${clientId}/logo.${fileExtension}`;
        const result = await uploadFile(file, path);
        return result;
    } catch (error) {
        console.error('Upload Client Logo Error:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// UPLOAD PROJECT IMAGE
// ============================================
export const uploadProjectImage = async (file, projectId) => {
    try {
        const fileExtension = file.name.split('.').pop();
        const path = `project-images/${projectId}/${Date.now()}.${fileExtension}`;
        const result = await uploadFile(file, path);
        return result;
    } catch (error) {
        console.error('Upload Project Image Error:', error);
        return { success: false, error: error.message };
    }
};

// ============================================
// DELETE FILE
// ============================================
export const deleteFile = async (path) => {
    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        return { success: true };
    } catch (error) {
        console.error('Delete File Error:', error);
        return { success: false, error: error.message };
    }
};