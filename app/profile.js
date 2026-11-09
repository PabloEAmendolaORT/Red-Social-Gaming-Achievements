import { Link } from 'expo-router';
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

    return (
        <View>
            <Text>Perfil de usuario</Text>
            <Text>{user ? user.username : 'Sin sesion iniciada'}</Text>
            {user && (
            <Button title="Cerrar sesión" onPress={handleLogout} />
            )}
            <Link href="/">Volver a la biblioteca de juegos</Link>
        </View>
    )
}