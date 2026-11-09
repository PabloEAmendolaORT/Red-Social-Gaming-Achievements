import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    function handleLogout() {
        setUser(null);
    }

    return <AuthContext.Provider value={{ user, setUser, handleLogout }}>{children}</AuthContext.Provider>;
}