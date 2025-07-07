// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import {
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    confirmSignUp,
    resendSignUpCode,
    fetchAuthSession
} from 'aws-amplify/auth';
import { getUserRoleByEmail, type UserRole } from '@/constants/userRoles';

export interface UserData {
    email: string;
    role: UserRole;
    isAuthenticated: boolean;
    userId?: string;
}

export const useAuth = () => {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {
            console.log('🔍 Verificando configuración de Amplify...');
            const session = await fetchAuthSession();
            console.log('📊 Session:', session);

            if (session.tokens) {
                const user = await getCurrentUser();
                const email = user.signInDetails?.loginId || '';
                const role = getUserRoleByEmail(email);

                setUserData({
                    email,
                    role,
                    isAuthenticated: true,
                    userId: user.userId,
                });
            } else {
                setUserData(null);
            }
        } catch (error) {
            setUserData(null);
        } finally {
            setIsLoading(false);
        }
    };

    const registrarUsuario = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            console.log('📝 Registrando usuario:', email);

            console.log('🔍 Datos enviados a signUp:');
            console.log('Email:', email);
            console.log('Password length:', password.length);
            console.log('Password chars:', password.split('').map(c => c.charCodeAt(0)));

            const result = await signUp({
                username: email,
                password,
                options: {
                    userAttributes: { email },
                },
            });

            console.log('✅ Registro exitoso:', result);

            const role = getUserRoleByEmail(email);

            return {
                success: true,
                message: 'Código de confirmación enviado a tu email',
                role,
                needsConfirmation: true,
                userId: result.userId
            };

        } catch (error: any) {
            console.error('❌ Error en registro:', error);

            let errorMessage = 'Error al registrar usuario';
            if (error.name === 'UsernameExistsException') {
                errorMessage = 'Este email ya está registrado';
            }

            return { success: false, error: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const iniciarSesion = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            console.log('🔐 Intentando login con:', email);

            const result = await signIn({
                username: email,
                password,
            });

            console.log('✅ Login exitoso:', result);

            // Solo retornar éxito
            return {
                success: true,
                message: 'Login exitoso',
                role: getUserRoleByEmail(email)
            };

        } catch (error: any) {
            console.error('❌ Error específico:', error);
            return {
                success: false,
                error: error.message || 'Error desconocido'
            };
        } finally {
            setIsLoading(false);
        }
    };

    const cerrarSesion = async () => {
        try {
            await signOut();
            setUserData(null);
            return { success: true, message: 'Sesión cerrada' };
        } catch (error: any) {
            return { success: false, error: 'Error al cerrar sesión' };
        }
    };

    return {
        userData,
        isLoading,
        isAuthenticated: userData?.isAuthenticated || false,
        registrarUsuario,
        iniciarSesion,
        cerrarSesion,
        checkAuthState,
    };
};