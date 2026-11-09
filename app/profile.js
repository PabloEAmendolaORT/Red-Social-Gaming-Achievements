import { Link } from 'expo-router';
import { View, Text } from 'react-native';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Profile() {
    const { user } = useContext(AuthContext);

    return (
        <View>
            <Text>Perfil de usuario</Text>
            <Text>{user ? user.username : 'Sin sesion iniciada'}</Text>

            <Link href="/">Volver a la biblioteca de juegos</Link>
        </View>
    )
}