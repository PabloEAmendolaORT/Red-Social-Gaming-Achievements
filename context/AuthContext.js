import { createContext, useState, useEffect } from "react";
import { saveSession, removeSession, loadSession } from "../services/sessionStorage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    useEffect(() => {
            loadSession().then(setUser);
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

    return <AuthContext.Provider value={{ user, setUser, handleLogout, handleLogin }}>{children}</AuthContext.Provider>;
}