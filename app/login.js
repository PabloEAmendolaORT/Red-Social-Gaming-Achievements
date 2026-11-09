import { TextInput } from 'react-native';
import { View, Text, Button } from 'react-native';
import { useState, useContext } from 'react';
import { login } from '../services/authService';
import { AuthContext } from '../context/AuthContext'

export default function Login() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const { setUser } = useContext(AuthContext);
    const [message, setMessage] = useState('');

    const handleLogin = () => {
        if (!username.trim() || !password) {
            return setMessage('Por favor, complete todos los campos');
        } else {
            const user = login(username.trim(), password);
            
            if (user) {
                setUser(user);
                setMessage(`Bienvenido, ${user.username}`);
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

            <Button title="Iniciar sesión" onPress={handleLogin} />
            {message ? <Text>{message}</Text> : null}


        </View>
    );
}