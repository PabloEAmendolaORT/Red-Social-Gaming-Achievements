import { createContext, useState, useEffect } from "react";
import { saveSession, removeSession, loadSession } from "../services/sessionStorage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isRestoringSession, setIsRestoringSession] = useState(true);
    const [user, setUser] = useState(null);
    useEffect(() => {
        loadSession().then(setUser).finally(() => {
            setIsRestoringSession(false);
        });
        }, 
        []
    );
    async function handleLogin(authenticatedUser) {
        await saveSession(authenticatedUser);
        setUser(authenticatedUser);
    }
    async function handleLogout() {
        await removeSession();
        setUser(null);
    }

    return <AuthContext.Provider value={{ user, isRestoringSession, setUser, handleLogout, handleLogin }}>{children}</AuthContext.Provider>;
}