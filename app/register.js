import { useState } from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { register } from '../services/authService';
import { Link } from 'expo-router';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async () => {
        if (!email.trim() || !password) {
            setMessage('Completá el correo y la contraseña.');
            return;
        }

        setMessage('');
        const { data, error } = await register(email.trim(), password);

        if (error) {
            setMessage(error.message);
            return;
        }

        setMessage(data.session
            ? 'Cuenta creada. Ya iniciaste sesión.'
            : 'Revisá tu correo para confirmar la cuenta.');
    };

    return (
        <View>
            <Text>Crear Cuenta</Text>
            <TextInput
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Button title="Registrarse" onPress={handleSubmit} />
            {message ? <Text>{message}</Text> : null}

            <Link href="/login">Ya tengo una cuenta</Link>
        </View>
    )

}