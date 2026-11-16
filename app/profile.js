import { Link, Redirect } from 'expo-router';
import { View, Text, Button, TextInput, Image } from 'react-native';
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
        return (
            <View>
                <Text>Cargando sesión...</Text>
            </View>
        )
    }

    if (!user) {
        return <Redirect href="/login" />
    }

    return (
        <View>
            <Text>Perfil de usuario</Text>
            
            <Text>{user.email}</Text>

            <TextInput
                placeholder="Alias"
                value={displayName}
                onChangeText={setDisplayName}
                editable={!isLoadingProfile}
            />

            <Button title="Guardar" onPress={handleSave} disabled={isLoadingProfile} />

            <Text>
                RetroAchievements
            </Text>

            {raLink ? <Text>Cuenta asociada: {raLink.ra_username}</Text> : null}

            <TextInput
                placeholder="Usuario de RetroAchievements"
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
            />

            {raMessage ? <Text>{raMessage}</Text> : null}

            {raProfile ? (
                <View>
                    {raProfile.avatarPath ? (
                        <Image
                            source={{ uri: `https://retroachievements.org${raProfile.avatarPath}` }}
                            style={{ width: 64, height: 64 }}
                            accessibilityLabel={`Avatar de ${raProfile.username}`}
                        />
                    ) : null}
                    
                    <Text>Perfil encontrado: {raProfile.username}</Text>

                    <Button
                        title={isLinkingRa ? 'Asociando…' : 'Asociar cuenta'}
                        onPress={handleLinkRa}
                        disabled={isLinkingRa || !raProfile.ulid || isLoadingProfile}
                    />

                </View>
            ) : null}

            {message ? <Text>{message}</Text> : null}

            {raUlid ? (
                <View>
                    <Text>Juegos jugados</Text>
                    {!currentPlayedGames ? (
                        <Text>Cargando juegos…</Text>
                    ) : currentPlayedGames.error ? (
                        <Text>No se pudieron cargar los juegos jugados.</Text>
                    ) : currentPlayedGames.games.length === 0 ? (
                        <Text>Todavía no hay partidas con progreso registrado.</Text>
                    ) : currentPlayedGames.games.map((entry) => (
                        <View key={entry.ra_game_id}>
                            <Link href={`/games/ra-${entry.ra_game_id}`}>
                                {entry.game?.title ?? `Juego ${entry.ra_game_id}`}
                            </Link>
                            <Text>{entry.total_unlocked} de {entry.total_achievements} logros</Text>
                        </View>
                    ))}
                </View>
            ) : null}

            {user && (
            <Button title="Cerrar sesión" onPress={handleLogout} />
            )}
            <Link href="/">Volver a la biblioteca de juegos</Link>
        </View>
    )
}