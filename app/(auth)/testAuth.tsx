import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';

type Screen = 'login' | 'register' | 'confirm';

const SimpleAuthScreen = () => {
    const [currentScreen, setCurrentScreen] = useState<Screen>('register');
    const [email, setEmail] = useState('test@example.com');
    const [password, setPassword] = useState('TempPass123!');
    const [confirmationCode, setConfirmationCode] = useState('');

    const {
        isLoading,
        user,
        isAuthenticated,
        registrarUsuario,
        confirmarUsuario,
        iniciarSesion,
        cerrarSesion,
        verificarSesion,
    } = useAuth();

    // Verificar sesión al cargar
    useEffect(() => {
        verificarSesion();
    }, []);

    const handleRegister = async () => {
        const result = await registrarUsuario(email, password);

        if (result.success) {
            Alert.alert(
                '✅ Registro Exitoso',
                result.message,
                [{ text: 'OK', onPress: () => setCurrentScreen('confirm') }]
            );
        } else {
            Alert.alert('❌ Error', result.error);
        }
    };

    const handleConfirm = async () => {
        const result = await confirmarUsuario(email, confirmationCode);

        if (result.success) {
            Alert.alert(
                '✅ Confirmación Exitosa',
                result.message,
                [{ text: 'OK', onPress: () => setCurrentScreen('login') }]
            );
        } else {
            Alert.alert('❌ Error', result.error);
        }
    };

    const handleLogin = async () => {
        const result = await iniciarSesion(email, password);

        if (result.success) {
            Alert.alert('🎉 Login Exitoso', `Bienvenido ${result.user?.username}`);
        } else {
            if (result.needsConfirmation) {
                Alert.alert(
                    '⚠️ Confirmación Requerida',
                    result.error,
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Confirmar', onPress: () => setCurrentScreen('confirm') }
                    ]
                );
            } else {
                Alert.alert('❌ Error', result.error);
            }
        }
    };

    const handleSignOut = async () => {
        const result = await cerrarSesion();

        if (result.success) {
            Alert.alert('👋 Sesión Cerrada', result.message);
            setCurrentScreen('login');
        } else {
            Alert.alert('❌ Error', result.error);
        }
    };

    // Si está autenticado, mostrar pantalla de usuario
    if (isAuthenticated && user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>¡Bienvenido!</Text>
                    <Text style={styles.subtitle}>Usuario: {user.username}</Text>
                    <Text style={styles.subtitle}>Email: {user.email}</Text>

                    <TouchableOpacity
                        style={[styles.button, styles.signOutButton]}
                        onPress={handleSignOut}
                        disabled={isLoading}
                    >
                        <Text style={styles.buttonText}>
                            {isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
                <View style={styles.content}>
                    <Text style={styles.title}>Amplify Auth Simple</Text>
                    <Text style={styles.subtitle}>
                        Modo: {currentScreen === 'register' ? 'Registro' :
                            currentScreen === 'confirm' ? 'Confirmación' : 'Login'}
                    </Text>

                    {/* Campos de Email y Password */}
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    {currentScreen !== 'confirm' && (
                        <TextInput
                            style={styles.input}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                        />
                    )}

                    {/* Campo de Confirmación */}
                    {currentScreen === 'confirm' && (
                        <TextInput
                            style={styles.input}
                            placeholder="Código de Confirmación (6 dígitos)"
                            value={confirmationCode}
                            onChangeText={setConfirmationCode}
                            keyboardType="number-pad"
                            maxLength={6}
                        />
                    )}

                    {/* Botón Principal */}
                    {currentScreen === 'register' && (
                        <TouchableOpacity
                            style={[styles.button, styles.registerButton]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Registrando...' : 'Registrar Usuario'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {currentScreen === 'confirm' && (
                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton]}
                            onPress={handleConfirm}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Confirmando...' : 'Confirmar Email'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {currentScreen === 'login' && (
                        <TouchableOpacity
                            style={[styles.button, styles.loginButton]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Navegación entre pantallas */}
                    <View style={styles.navigation}>
                        <TouchableOpacity
                            style={[styles.navButton, currentScreen === 'register' && styles.activeNavButton]}
                            onPress={() => setCurrentScreen('register')}
                        >
                            <Text style={[styles.navButtonText, currentScreen === 'register' && styles.activeNavButtonText]}>
                                Registro
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.navButton, currentScreen === 'confirm' && styles.activeNavButton]}
                            onPress={() => setCurrentScreen('confirm')}
                        >
                            <Text style={[styles.navButtonText, currentScreen === 'confirm' && styles.activeNavButtonText]}>
                                Confirmar
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.navButton, currentScreen === 'login' && styles.activeNavButton]}
                            onPress={() => setCurrentScreen('login')}
                        >
                            <Text style={[styles.navButtonText, currentScreen === 'login' && styles.activeNavButtonText]}>
                                Login
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Información sobre Expo Go */}
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            ⚠️ Si obtienes "Unknown error" en Login:
                        </Text>
                        <Text style={styles.infoText}>
                            1. Usa Development Build: npx expo run:android
                        </Text>
                        <Text style={styles.infoText}>
                            2. O prueba en web: npx expo start --web
                        </Text>
                        <Text style={styles.infoText}>
                            3. Expo Go no es compatible con Amplify Auth
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingTop: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        color: '#132e3c',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        color: '#666',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
    },
    button: {
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        alignItems: 'center',
    },
    registerButton: {
        backgroundColor: '#007AFF',
    },
    confirmButton: {
        backgroundColor: '#34C759',
    },
    loginButton: {
        backgroundColor: '#FF9500',
    },
    signOutButton: {
        backgroundColor: '#FF3B30',
        marginTop: 20,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    navigation: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        marginBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 20,
    },
    navButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    activeNavButton: {
        backgroundColor: '#132e3c',
    },
    navButtonText: {
        color: '#666',
        fontWeight: '500',
    },
    activeNavButtonText: {
        color: 'white',
    },
    infoBox: {
        backgroundColor: '#f0f8ff',
        padding: 15,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
        marginTop: 20,
    },
    infoText: {
        color: '#0066cc',
        fontSize: 12,
        marginBottom: 4,
    },
});

export default SimpleAuthScreen;