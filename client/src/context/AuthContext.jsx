import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
    };

    const signupWithEmail = async (email, password) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        return userCredential;
    };

    const loginWithEmail = async (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => signOut(auth);

    const value = {
        user,
        loading,
        signInWithGoogle,
        signupWithEmail,
        loginWithEmail,
        logout
    };


    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
