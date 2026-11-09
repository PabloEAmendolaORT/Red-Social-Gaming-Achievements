import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    function handleLogin(authenticatedUser) {
        setUser(authenticatedUser);
    }
    function handleLogout() {
        setUser(null);
    }

    return <AuthContext.Provider value={{ user, setUser, handleLogout, handleLogin }}>{children}</AuthContext.Provider>;
}