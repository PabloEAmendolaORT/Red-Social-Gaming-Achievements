import { Link } from 'expo-router';
import { View, Text } from 'react-native';

export default function Profile() {
    return (
        <View>
            <Text>Perfil de usuario</Text>
            <Link href="/">Volver a la biblioteca de juegos</Link>
        </View>
    )
}