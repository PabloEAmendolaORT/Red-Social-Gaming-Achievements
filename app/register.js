import { useState } from 'react';
import { Button, Page, Panel, Text, TextInput, TextLink, Title } from '../components/RetroUI';
import { register } from '../services/authService';

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
        <Page narrow>
            <Title>Crear cuenta</Title>
            <Text tone="muted">Armá tu biblioteca y vinculá tu perfil de RetroAchievements.</Text>
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
                    autoComplete="new-password"
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={handleSubmit}
                    secureTextEntry
                />
                <Button title="Crear cuenta" onPress={handleSubmit} />
                {message ? <Text accessibilityLiveRegion="polite">{message}</Text> : null}
            </Panel>
            <TextLink href="/login">Ya tengo una cuenta</TextLink>
        </Page>
    );
}
