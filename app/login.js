import { Button, Page, Panel, Text, TextInput, TextLink, Title } from '../components/RetroUI';
import { useState, useContext } from 'react';
import { Redirect } from 'expo-router';
import { login } from '../services/authService';
import { AuthContext } from '../context/AuthContext'

export default function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { user, isRestoringSession } = useContext(AuthContext);
    const [message, setMessage] = useState('');

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
        return <Redirect href="/library" />;
    }


    return (
        <Page narrow>
            <Title>Iniciar sesión</Title>
            <Text tone="muted">Entrá para acceder a tu biblioteca.</Text>
            <Panel>
                <Text>Correo electrónico</Text>
                <TextInput
                    accessibilityLabel="Correo electrónico"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />
                <Text>Contraseña</Text>
                <TextInput
                    accessibilityLabel="Contraseña"
                    autoComplete="current-password"
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={handleSubmit}
                    secureTextEntry
                />
                <Button title="Iniciar sesión" onPress={handleSubmit} />
                {message ? <Text tone="error" accessibilityRole="alert">{message}</Text> : null}
            </Panel>
            <TextLink href="/register">Crear cuenta</TextLink>
        </Page>
    );
}
