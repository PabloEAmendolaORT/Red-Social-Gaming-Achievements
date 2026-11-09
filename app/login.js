import { TextInput } from 'react-native';
import { View, Text, Button } from 'react-native';
import { useState, useContext } from 'react';
import { useRouter } from 'expo-router';
import { login } from '../services/authService';
import { AuthContext } from '../context/AuthContext'

export default function Login() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { handleLogin } = useContext(AuthContext);
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleSubmit = async () => {
        if (!username.trim() || !password) {
            return setMessage('Por favor, complete todos los campos');
        } else {
            const user = login(username.trim(), password);
            
            if (user) {
                await handleLogin(user);
                router.replace('/profile');
            } else {
                setMessage('Usuario o contraseña incorrectos');
            }
        }
    }

    return (
        <View>
            <Text>Login</Text>

            <View>
                <TextInput
                    placeholder="Usuario"
                    placeholderTextColor="#999"
                    value={username}
                    onChangeText={setUsername}
                />
            </View>

            <View>
                <TextInput
                    placeholder="Contraseña"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <Button title="Iniciar sesión" onPress={handleSubmit} />
            {message ? <Text>{message}</Text> : null}


        </View>
    );
}