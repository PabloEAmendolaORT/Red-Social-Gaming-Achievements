import { Redirect } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';
import { Button, Page, Panel, Text, TextInput, TextLink, Title, colors, layout } from '../components/RetroUI';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { saveProfile, getProfile } from '../services/profileService';
import { searchRaProfile, linkRaProfile, getRaLink, listPlayedGames } from '../services/raService';

export default function Profile() {
    const { user, handleLogout, isRestoringSession } = useContext(AuthContext);
    const [ displayName, setDisplayName ] = useState('');
    const [ message, setMessage ] = useState('');
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [raUsername, setRaUsername] = useState('');
    const [raProfile, setRaProfile] = useState(null);
    const [raMessage, setRaMessage] = useState('');
    const [isSearchingRa, setIsSearchingRa] = useState(false);
    const [isLinkingRa, setIsLinkingRa] = useState(false);
    const [raLink, setRaLink] = useState(null);
    const userId = user?.id;
    const raUlid = raLink?.ra_ulid;
    const [playedGamesResult, setPlayedGamesResult] = useState(null);

    useEffect(() => {
        if (!userId || !raUlid) return;

        let ignore = false;

        async function loadPlayedGames() {
            try {
                const { data, error } = await listPlayedGames(userId, raUlid);
                if (error) throw error;

                if (!ignore) setPlayedGamesResult({ userId, raUlid, games: data });
            } catch {
                if (!ignore) setPlayedGamesResult({ userId, raUlid, error: true });
            }
        }

        loadPlayedGames();
        return () => { ignore = true; };
    }, [userId, raUlid]);

    const currentPlayedGames = playedGamesResult?.userId === userId &&
        playedGamesResult?.raUlid === raUlid ? playedGamesResult : null;

    const handleSearchRa = async () => {
        const username = raUsername.trim();

        if (!username) {
            setRaMessage('Ingresá un usuario de RetroAchievements.');
            return;
        }

        setRaMessage('');
        setRaProfile(null);
        setIsSearchingRa(true);

        const { data, error } = await searchRaProfile(username);

        if (error) {
            setRaMessage('No se pudo encontrar el perfil. Revisá el usuario e intentá de nuevo.');
        } else {
            setRaProfile(data);
        }

        setIsSearchingRa(false);
    };

    const handleLinkRa = async () => {
        setRaMessage('');
        setIsLinkingRa(true);
        
        const { data, error } = await linkRaProfile(raProfile.ulid);
        
        if (!error && data?.linked) {
            setRaLink({ ra_ulid: data.ulid, ra_username: data.username });
        }

        if (error?.context?.status === 409) {
            setRaMessage('La cuenta ya se encuentra vinculada a otro usuario.');
        } else if (error || !data?.linked) {
            setRaMessage('No se pudo asociar la cuenta.');
        } else {
            setRaMessage(`Cuenta asociada: ${data.username}.`);
        }

        setIsLinkingRa(false);
    };

    useEffect(() => {
            if (!userId) return;

            let ignore = false;
            setIsLoadingProfile(true);

            async function loadProfile() {
                const [{ data, error }, raLinkResult] = await Promise.all([
                    getProfile(userId),
                    getRaLink(userId),
                ]);

                if (ignore) return;

                setRaLink(raLinkResult.data ?? null);

                if (raLinkResult.error) {
                    setRaMessage('No se pudo cargar la cuenta asociada.');
                }

                if (error) {
                    setMessage('Error al cargar el perfil.');
                } else {
                    setDisplayName(data?.display_name || '');
                }
                setIsLoadingProfile(false);
            }

            loadProfile();

            return () => {
                ignore = true;
            };

        }, [userId]);

    const handleSave = async () => {
        const alias = displayName.trim();

        if (!alias) {
            setMessage('El nombre de usuario no puede estar vacío.');
            return;
        }

        setMessage('');
        const { error } = await saveProfile(user.id, alias);

        setMessage(error ? 'Error al guardar el perfil.' : 'Perfil guardado correctamente.');
    }

    if (isRestoringSession) {
        return <Page><Text tone="muted">Cargando sesión…</Text></Page>;
    }

    if (!user) {
        return <Redirect href="/login" />;
    }

    return (
        <Page>
            <Title>Mi perfil</Title>
            <View style={layout.grid}>
                <Panel style={styles.column}>
                    <Text tone="heading" accessibilityRole="header">Cuenta</Text>
                    <Text tone="muted">{user.email}</Text>
                    <Text>Alias</Text>
                    <TextInput
                        accessibilityLabel="Alias"
                        placeholder="Tu nombre en el ranking"
                        value={displayName}
                        onChangeText={setDisplayName}
                        editable={!isLoadingProfile}
                    />
                    <Button title="Guardar alias" onPress={handleSave} disabled={isLoadingProfile} />
                    {message ? <Text accessibilityLiveRegion="polite">{message}</Text> : null}
                </Panel>

                <Panel style={styles.column}>
                    <Text tone="heading" accessibilityRole="header">RetroAchievements</Text>
                    {raLink ? (
                        <Text tone="meta">Cuenta asociada: {raLink.ra_username}</Text>
                    ) : (
                        <Text tone="muted">Asociá tu perfil para sincronizar tus logros y participar en los rankings.</Text>
                    )}
                    <Text>Usuario de RetroAchievements</Text>
                    <TextInput
                        accessibilityLabel="Usuario de RetroAchievements"
                        value={raUsername}
                        onChangeText={(value) => {
                            setRaUsername(value);
                            setRaProfile(null);
                            setRaMessage('');
                        }}
                        editable={!isSearchingRa && !isLinkingRa}
                        autoCapitalize="none"
                    />
                    <Button
                        title={isSearchingRa ? 'Buscando…' : 'Buscar perfil'}
                        onPress={handleSearchRa}
                        disabled={isSearchingRa || isLinkingRa}
                        secondary
                    />
                    {raMessage ? <Text accessibilityLiveRegion="polite">{raMessage}</Text> : null}
                    {raProfile ? (
                        <View style={layout.row}>
                            {raProfile.avatarPath ? (
                                <Image
                                    source={{ uri: `https://retroachievements.org${raProfile.avatarPath}` }}
                                    style={styles.avatar}
                                    accessibilityLabel={`Avatar de ${raProfile.username}`}
                                />
                            ) : null}
                            <Text>{raProfile.username}</Text>
                            <Button
                                title={isLinkingRa ? 'Asociando…' : 'Asociar cuenta'}
                                onPress={handleLinkRa}
                                disabled={isLinkingRa || !raProfile.ulid || isLoadingProfile}
                            />
                        </View>
                    ) : null}
                </Panel>
            </View>

            {raUlid ? (
                <Panel>
                    <Text tone="heading" accessibilityRole="header">Juegos jugados</Text>
                    {!currentPlayedGames ? (
                        <Text tone="muted">Cargando juegos…</Text>
                    ) : currentPlayedGames.error ? (
                        <Text tone="error">No se pudieron cargar los juegos jugados.</Text>
                    ) : currentPlayedGames.games.length === 0 ? (
                        <Text tone="muted">Todavía no hay partidas con progreso registrado.</Text>
                    ) : currentPlayedGames.games.map((entry) => (
                        <View key={entry.ra_game_id} style={styles.gameRow}>
                            <TextLink href={`/games/ra-${entry.ra_game_id}`}>
                                {entry.game?.title ?? `Juego ${entry.ra_game_id}`}
                            </TextLink>
                            <Text tone="muted">{entry.total_unlocked} de {entry.total_achievements} logros</Text>
                        </View>
                    ))}
                </Panel>
            ) : null}

            <Button title="Cerrar sesión" onPress={handleLogout} secondary />
        </Page>
    );
}

const styles = StyleSheet.create({
    column: { flexBasis: 380, flexGrow: 1 },
    avatar: { width: 40, height: 40, borderRadius: 8 },
    gameRow: { ...layout.row, justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
});
