import { Link } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text as NativeText, TextInput as NativeInput, View } from 'react-native';

const classicColors = {
    background: '#10141f',
    panel: '#1b2230',
    input: '#141a25',
    line: '#384254',
    text: '#f5f0df',
    muted: '#b4bed0',
    accent: '#d2f577',
    dark: '#192216',
    error: '#ffb4a9',
    highlight: '#293727',
    highlightLine: '#657b45',
};

export const colors = Platform.OS === 'web'
    ? Object.fromEntries(Object.entries(classicColors).map(([name, fallback]) => [name, `var(--retro-${name}, ${fallback})`]))
    : classicColors;

export const layout = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
    panel: { backgroundColor: colors.panel, borderColor: colors.line, borderWidth: 1, borderRadius: 14, padding: 24, gap: 14 },
    grow: { flexGrow: 1 },
});

const styles = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    page: { width: '100%', maxWidth: 1224, alignSelf: 'center', paddingHorizontal: 28, paddingTop: 42, paddingBottom: 60, gap: 24 },
    narrow: { maxWidth: 520, paddingTop: 64 },
    body: { color: colors.text, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 15, lineHeight: 23 },
    muted: { color: colors.muted },
    error: { color: colors.error },
    meta: { color: colors.accent, fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, letterSpacing: 1 },
    title: { fontFamily: 'Inter, system-ui, sans-serif', fontWeight: '700', fontSize: 52, lineHeight: 61, letterSpacing: 0.5 },
    heading: { fontWeight: '700', fontSize: 21, lineHeight: 28 },
    action: { display: 'flex', textDecorationLine: 'none', minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
    primary: { backgroundColor: colors.accent, borderColor: colors.accent },
    secondary: { backgroundColor: colors.input, borderColor: colors.line },
    actionText: { fontWeight: '700', color: colors.dark },
    secondaryText: { color: colors.text },
    active: { opacity: 0.82 },
    disabled: { opacity: 0.5 },
    input: { minHeight: 46, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.input },
    link: { color: colors.accent, textDecorationLine: 'underline', fontSize: 15 },
});

export function Text({ style, tone, ...props }) {
    return <NativeText {...props} style={[styles.body, styles[tone], style]} />;
}

export function Title({ children, style }) {
    return <Text accessibilityRole="header" tone="title" style={style}>{children}</Text>;
}

export function Page({ children, narrow, style }) {
    return (
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.page, narrow && styles.narrow, style]}>
            {children}
        </ScrollView>
    );
}

export function Panel({ children, style }) {
    return <View style={[layout.panel, style]}>{children}</View>;
}

export function TextInput({ style, ...props }) {
    return <NativeInput {...props} placeholderTextColor={colors.muted} style={[styles.body, styles.input, style]} />;
}

export function TextLink({ style, ...props }) {
    return <Link {...props} style={[styles.link, style]} />;
}

export function Button({ title, href, secondary, disabled, onPress }) {
    const surface = [styles.action, secondary ? styles.secondary : styles.primary];
    const label = [styles.actionText, secondary && styles.secondaryText];

    if (href) {
        return <Link href={href} style={[styles.body, ...surface, ...label]}>{title}</Link>;
    }

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: Boolean(disabled) }}
            onPress={onPress}
            disabled={disabled}
            style={({ pressed, hovered }) => [
                ...surface, (pressed || hovered) && styles.active, disabled && styles.disabled,
            ]}
        >
            <Text style={label}>{title}</Text>
        </Pressable>
    );
}
