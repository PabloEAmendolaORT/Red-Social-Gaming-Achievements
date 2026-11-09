import { Link, Redirect } from 'expo-router';
import { View, Text, Button } from 'react-native';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
    const { user, handleLogout, isRestoringSession } = useContext(AuthContext);
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
            <Text>{user.username}</Text>
            {user && (
            <Button title="Cerrar sesión" onPress={handleLogout} />
            )}
            <Link href="/">Volver a la biblioteca de juegos</Link>
        </View>
    )
}