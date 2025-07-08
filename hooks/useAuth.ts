// hooks/useAuth.ts - Basado en documentación oficial Amplify Gen 2
import { useState } from 'react';
import { signUp, signIn, confirmSignUp, signOut, getCurrentUser } from 'aws-amplify/auth';

export interface AuthUser {
    username: string;
    email: string;
    isAuthenticated: boolean;
}

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);

    // REGISTRO - Basado en docs oficiales
    const registrarUsuario = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            console.log('📝 Registrando usuario:', email);

            const { isSignUpComplete, userId, nextStep } = await signUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email,
                    },
                },
            });

            console.log('✅ Registro exitoso:', { isSignUpComplete, userId, nextStep });

            return {
                success: true,
                message: 'Usuario registrado. Revisa tu email para confirmar.',
                needsConfirmation: !isSignUpComplete,
                userId,
            };

        } catch (error: any) {
            console.error('❌ Error en registro:', error);
            return {
                success: false,
                error: error.message || 'Error al registrar usuario'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // CONFIRMACIÓN - Basado en docs oficiales
    const confirmarUsuario = async (email: string, confirmationCode: string) => {
        try {
            setIsLoading(true);
            console.log('✅ Confirmando usuario:', email);

            const { isSignUpComplete, nextStep } = await confirmSignUp({
                username: email,
                confirmationCode,
            });

            console.log('✅ Confirmación exitosa:', { isSignUpComplete, nextStep });

            return {
                success: true,
                message: 'Usuario confirmado exitosamente'
            };

        } catch (error: any) {
            console.error('❌ Error en confirmación:', error);
            return {
                success: false,
                error: error.message || 'Error al confirmar usuario'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // LOGIN - Basado en docs oficiales + fixes del issue
    const iniciarSesion = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            console.log('🔐 Iniciando sesión:', email);

            // FIX: Normalizar email
            const username = email.toLowerCase().trim();

            const { isSignedIn, nextStep } = await signIn({
                username,
                password,
                options: {
                    // FIX: Especificar authFlowType explícitamente
                    authFlowType: 'USER_SRP_AUTH', // Recomendado por AWS
                },
            });

            console.log('✅ Resultado signIn:', { isSignedIn, nextStep });

            if (isSignedIn) {
                // Obtener información del usuario
                const currentUser = await getCurrentUser();
                console.log('👤 Usuario actual:', currentUser);

                const authUser: AuthUser = {
                    username: currentUser.username,
                    email: username,
                    isAuthenticated: true,
                };

                setUser(authUser);

                return {
                    success: true,
                    message: 'Inicio de sesión exitoso',
                    user: authUser,
                };
            } else {
                // Manejar pasos adicionales
                console.log('⚠️ Login incompleto:', nextStep);

                if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
                    return {
                        success: false,
                        error: 'Debes confirmar tu email antes de iniciar sesión',
                        needsConfirmation: true,
                    };
                }

                return {
                    success: false,
                    error: `Paso adicional requerido: ${nextStep?.signInStep}`,
                };
            }

        } catch (error: any) {
            console.error('❌ Error en login:', error);

            // Manejo específico de errores conocidos
            let errorMessage = error.message || 'Error al iniciar sesión';

            switch (error.name) {
                case 'UserNotFoundException':
                    errorMessage = 'Usuario no encontrado';
                    break;
                case 'NotAuthorizedException':
                    errorMessage = 'Email o contraseña incorrectos';
                    break;
                case 'UserNotConfirmedException':
                    errorMessage = 'Debes confirmar tu email antes de iniciar sesión';
                    return {
                        success: false,
                        error: errorMessage,
                        needsConfirmation: true,
                    };
                case 'TooManyRequestsException':
                    errorMessage = 'Demasiados intentos. Espera un momento';
                    break;
                default:
                    if (error.message.includes('Unknown')) {
                        errorMessage = 'Error de conectividad. Intenta con: 1) Development Build 2) Verificar configuración Cognito';
                    }
            }

            return {
                success: false,
                error: errorMessage,
            };
        } finally {
            setIsLoading(false);
        }
    };

    // CERRAR SESIÓN
    const cerrarSesion = async () => {
        try {
            setIsLoading(true);
            console.log('🚪 Cerrando sesión...');

            await signOut();
            setUser(null);

            console.log('✅ Sesión cerrada');
            return {
                success: true,
                message: 'Sesión cerrada exitosamente'
            };

        } catch (error: any) {
            console.error('❌ Error cerrando sesión:', error);
            return {
                success: false,
                error: error.message || 'Error al cerrar sesión'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // VERIFICAR SESIÓN ACTUAL
    const verificarSesion = async () => {
        try {
            const currentUser = await getCurrentUser();

            if (currentUser) {
                const authUser: AuthUser = {
                    username: currentUser.username,
                    email: currentUser.signInDetails?.loginId || '',
                    isAuthenticated: true,
                };

                setUser(authUser);
                return authUser;
            }

            return null;
        } catch (error) {
            console.log('No hay sesión activa');
            setUser(null);
            return null;
        }
    };

    return {
        // Estados
        isLoading,
        user,
        isAuthenticated: !!user,

        // Métodos
        registrarUsuario,
        confirmarUsuario,
        iniciarSesion,
        cerrarSesion,
        verificarSesion,
    };
};