import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = 'demo-session';

export async function saveSession(user) {
    try {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } catch (error) {
        console.error('Error saving session:', error);
    }
}

export async function loadSession() {
    try {
        const storedUser = await AsyncStorage.getItem(SESSION_KEY);
        return storedUser === null ? null : JSON.parse(storedUser);
    } catch (error) {
        console.error('Error loading session:', error);
        return null;
    }
}

export async function removeSession() {
    await AsyncStorage.removeItem(SESSION_KEY);
}