import { Slot, usePathname } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { AuthContext, AuthProvider } from '../context/AuthContext';
import { colors, layout, TextLink } from '../components/RetroUI';
import '../components/retro.css';

const themeKey = 'pnt2-retro-theme';
const themes = [
    { id: 'classic', label: 'Game Boy clásica' },
    { id: 'advance', label: 'GBA índigo' },
    { id: 'color', label: 'GBC turquesa' },
];

function ThemePicker() {
    const [theme, setTheme] = useState('classic');

    useEffect(() => {
        try {
            const savedTheme = window.localStorage.getItem(themeKey);
            if (themes.some(({ id }) => id === savedTheme)) {
                setTheme(savedTheme);
            }
        } catch {
            // The current tab can still change themes when storage is unavailable.
        }
    }, []);

    useEffect(() => {
        document.documentElement.dataset.retroTheme = theme;
    }, [theme]);

    function changeTheme(nextTheme) {
        setTheme(nextTheme);
        try {
            window.localStorage.setItem(themeKey, nextTheme);
        } catch {
            // Keep the selected theme for the current tab.
        }
    }

    return (
        <div className="retro-theme-picker" role="group" aria-label="Tema">
            {themes.map(({ id, label }) => (
                <button
                    key={id}
                    type="button"
                    className="retro-theme-swatch"
                    data-palette={id}
                    aria-label={label}
                    aria-pressed={theme === id}
                    title={label}
                    onClick={() => changeTheme(id)}
                />
            ))}
        </div>
    );
}

function Navigation() {
    const { user, isRestoringSession } = useContext(AuthContext);
    const path = usePathname();

    // Playing has its own exit control so navigation goes through session sync.
    const playing = path.startsWith('/play/');

    return (
        <View style={[styles.bar, playing && styles.hidden]}>
            <View style={[layout.row, styles.content]}>
                <TextLink href="/" style={styles.brand}>Red Social Gaming Achievements</TextLink>
                <View style={layout.row}>
                    <TextLink href="/" style={path === '/' ? styles.current : styles.link}>Inicio</TextLink>
                    {user && <TextLink href="/library" style={path === '/library' ? styles.current : styles.link}>Mi biblioteca</TextLink>}
                    {!isRestoringSession && (
                        <TextLink href={user ? '/profile' : '/login'} style={path === '/profile' || path === '/login' ? styles.current : styles.link}>
                            {user ? 'Mi perfil' : 'Iniciar sesión'}
                        </TextLink>
                    )}
                    {Platform.OS === 'web' ? <ThemePicker /> : null}
                </View>
            </View>
        </View>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <View style={styles.root}>
                <Navigation />
                <Slot />
            </View>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    hidden: { display: 'none' },
    bar: { backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.line },
    content: { width: '100%', maxWidth: 1224, alignSelf: 'center', justifyContent: 'space-between', paddingHorizontal: 28, paddingVertical: 19 },
    brand: { color: colors.text, fontFamily: 'Inter, system-ui, sans-serif', fontWeight: '700', fontSize: 17, letterSpacing: 0.35, textDecorationLine: 'none' },
    link: { color: colors.muted, textDecorationLine: 'none', padding: 6 },
    current: { fontWeight: '700', textDecorationLine: 'none', padding: 6 },
});
