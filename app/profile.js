import { Link, Redirect } from 'expo-router';
import { View, Text, Button, TextInput } from 'react-native';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { saveProfile, getProfile } from '../services/profileService';

export default function Profile() {
    const { user, handleLogout, isRestoringSession } = useContext(AuthContext);
    const [ displayName, setDisplayName ] = useState('');
    const [ message, setMessage ] = useState('');
    const userId = user?.id;
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    useEffect(() => {
            if (!userId) return;

            let ignore = false;
            setIsLoadingProfile(true);

            async function loadProfile() {
                const { data, error } = await getProfile(userId);
                if (ignore) return;

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
            {message ? <Text>{message}</Text> : null}

            {user && (
            <Button title="Cerrar sesión" onPress={handleLogout} />
            )}
            <Link href="/">Volver a la biblioteca de juegos</Link>
        </View>
    )
}