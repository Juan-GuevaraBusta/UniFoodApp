// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserRoleByEmail, type UserRole } from '@/constants/userRoles';

export interface UserData {
    email: string;
    role: UserRole;
    isAuthenticated: boolean;
}

export const useAuth = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Verificar si hay usuario logueado al iniciar
    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            const savedEmail = await AsyncStorage.getItem('userEmail');
            const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');

            if (savedEmail && isLoggedIn === 'true') {
                const role = getUserRoleByEmail(savedEmail);
                setUserData({
                    email: savedEmail,
                    role,
                    isAuthenticated: true,
                });
            } else {
                setUserData(null);
            }
        } catch (error) {
            console.log('Error checking auth state:', error);
            setUserData(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Registro de usuarios (simplificado - solo guarda localmente)
    const registrarUsuario = async (email: string, password: string) => {
        try {
            setIsLoading(true);

            // Simulamos validación
            if (password.length < 8) {
                return {
                    success: false,
                    error: 'La contraseña debe tener al menos 8 caracteres'
                };
            }

            // Guardar credenciales localmente (en producción usarías Amplify/Firebase)
            await AsyncStorage.setItem('userEmail', email);
            await AsyncStorage.setItem('userPassword', password); // Solo para demo

            const role = getUserRoleByEmail(email);

            return {
                success: true,
                message: 'Usuario registrado correctamente',
                role
            };
        } catch (error: any) {
            console.error('Error en registro:', error);
            return {
                success: false,
                error: 'Error al registrar usuario'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // Login de usuarios
    const iniciarSesion = async (email: string, password: string) => {
        try {
            setIsLoading(true);

            // Verificar credenciales localmente (en producción usarías Amplify/Firebase)
            const savedEmail = await AsyncStorage.getItem('userEmail');
            const savedPassword = await AsyncStorage.getItem('userPassword');

            if (savedEmail === email && savedPassword === password) {
                // Login exitoso
                await AsyncStorage.setItem('isLoggedIn', 'true');

                const role = getUserRoleByEmail(email);

                setUserData({
                    email,
                    role,
                    isAuthenticated: true,
                });

                return {
                    success: true,
                    message: 'Sesión iniciada correctamente',
                    role
                };
            } else {
                return {
                    success: false,
                    error: 'Email o contraseña incorrectos'
                };
            }
        } catch (error: any) {
            console.error('Error en login:', error);
            return {
                success: false,
                error: 'Error al iniciar sesión'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // Logout
    const cerrarSesion = async () => {
        try {
            setIsLoading(true);
            await AsyncStorage.removeItem('isLoggedIn');
            setUserData(null);
            return { success: true, message: 'Sesión cerrada' };
        } catch (error: any) {
            console.error('Error en logout:', error);
            return { success: false, error: error.message };
        } finally {
            setIsLoading(false);
        }
    };

    // Funciones de verificación de rol
    const getUserRole = (): UserRole | null => {
        return userData?.role || null;
    };

    const isStudent = (): boolean => {
        return userData?.role === 'student';
    };

    const isRestaurantOwner = (): boolean => {
        return userData?.role === 'restaurant_owner';
    };

    const isAdmin = (): boolean => {
        return userData?.role === 'admin';
    };

    return {
        // Estados
        userData,
        isLoading,
        isAuthenticated: userData?.isAuthenticated || false,

        // Funciones de autenticación
        registrarUsuario,
        iniciarSesion,
        cerrarSesion,
        checkAuthState,

        // Funciones de rol
        getUserRole,
        isStudent,
        isRestaurantOwner,
        isAdmin,
    };
};