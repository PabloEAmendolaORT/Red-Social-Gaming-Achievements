import { TextInput } from 'react-native';
import { View, Text, Button } from 'react-native';
import { useState, useContext } from 'react';
import { Redirect, Link } from 'expo-router';
import { login } from '../services/authService';
import { AuthContext } from '../context/AuthContext'

export default function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { user, isRestoringSession } = useContext(AuthContext);    const [message, setMessage] = useState('');

    const handleSubmit = async () => {
        if (!email.trim() || !password) {
            setMessage('Por favor, complete todos los campos');
            return; 
        }

        setMessage('');

        const { error } = await login(email.trim(), password);

        if (error) {
            setMessage('No se pudo iniciar sesión. Revisá el correo y la contraseña.');
            console.log(error.code, error.message);

        }
    }

    if (!isRestoringSession && user) {
    return <Redirect href="/profile" />;
    }

    return (
        <View>
            <Text>Login</Text>

            <View>
                <TextInput
                    placeholder="Email"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
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

            <Link href="/register">Crear cuenta</Link>

        </View>
    );
}