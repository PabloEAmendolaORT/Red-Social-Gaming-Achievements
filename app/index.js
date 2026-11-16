import { useContext } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { Button, Page, Text, Title, colors, layout } from '../components/RetroUI';

const features = [
    ['Coleccioná', 'Agregá tus juegos de Game Boy, Game Boy Color y Game Boy Advance.'],
    ['Jugá', 'Abrí un juego en el navegador y retomá tu partida guardada.'],
    ['Compará', 'Vinculá RetroAchievements para ver tus logros y el ranking de cada juego.'],
];

export default function Welcome() {
    const { user, isRestoringSession } = useContext(AuthContext);
    const { width } = useWindowDimensions();
    const wide = width >= 1024;
    const roomy = width >= 1200;

    return (
        <Page>
            <View style={[styles.hero, wide && styles.heroWide]}>
                <View style={styles.copy}>
                    <Text tone="meta">GAME BOY · GAME BOY COLOR · GAME BOY ADVANCE</Text>
                    <Title style={roomy && styles.largeTitle}>
                        Jugá tus clásicos.{'\n'}<Text tone="title" style={[styles.accent, roomy && styles.largeTitle]}>Seguí tus logros.</Text>
                    </Title>
                    <Text tone="muted" style={styles.intro}>
                        Tu colección de juegos retro, tus partidas y tu progreso en un solo lugar.
                    </Text>
                    {isRestoringSession ? <Text tone="muted">Cargando sesión…</Text> : (
                        <View style={layout.row}>
                            {user ? <Button title="Ir a mi biblioteca" href="/library" /> : (
                                <>
                                    <Button title="Crear cuenta" href="/register" />
                                    <Button title="Iniciar sesión" href="/login" secondary />
                                </>
                            )}
                        </View>
                    )}
                </View>
                <div className="console-art" aria-hidden="true">
                    <div className="console-body">
                        <div className="console-bezel">
                            <span className="console-led" />
                            <div className="console-screen">
                                <span className="console-moon" />
                                <span className="console-hills" />
                                <span className="console-ground" />
                            </div>
                        </div>
                        <div className="console-controls">
                            <span className="console-cross" />
                            <span className="console-buttons"><i /><i /></span>
                        </div>
                        <div className="console-switches"><i /><i /></div>
                        <span className="console-speaker" />
                    </div>
                </div>
            </View>
            <View style={[layout.grid, styles.features]}>
                {features.map(([title, description]) => (
                    <View key={title} style={styles.feature}>
                        <Text tone="heading" accessibilityRole="header">{title}</Text>
                        <Text tone="muted">{description}</Text>
                    </View>
                ))}
            </View>
        </Page>
    );
}

const styles = StyleSheet.create({
    hero: { gap: 28, paddingTop: 10 },
    heroWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 440 },
    copy: { gap: 20, flexShrink: 1 },
    largeTitle: { fontSize: 68, lineHeight: 78 },
    accent: { color: colors.accent },
    intro: { fontSize: 18, lineHeight: 28, maxWidth: 420 },
    features: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 24 },
    feature: { flexBasis: 240, flexGrow: 1, paddingRight: 24, gap: 8 },
});
