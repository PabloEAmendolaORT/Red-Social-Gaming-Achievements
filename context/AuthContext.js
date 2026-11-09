import { createContext, useState, useEffect } from "react";
import { supabase } from '../services/supabaseClient';
import { logout } from "../services/authService";


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isRestoringSession, setIsRestoringSession] = useState(true);
    const [user, setUser] = useState(null);
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
                setIsRestoringSession(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    return <AuthContext.Provider value={{ user, isRestoringSession, handleLogout: logout }}>{children}</AuthContext.Provider>;
}