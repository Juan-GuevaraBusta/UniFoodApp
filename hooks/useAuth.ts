// hooks/useAuth.ts - Con información específica de restaurante
import { useState } from 'react';
import { signUp, signIn, confirmSignUp, signOut, getCurrentUser } from 'aws-amplify/auth';
import { getUserRoleByEmail, getRestaurantInfoByEmail, type RestaurantInfo } from '@/constants/userRoles';

export interface AuthUser {
    username: string;
    email: string;
    isAuthenticated: boolean;
    role?: string;
    restaurantInfo?: RestaurantInfo | null; // Nueva propiedad para info del restaurante
}

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<AuthUser | null>(null);

    // Función auxiliar para crear usuario autenticado con toda la info
    const createAuthUser = (currentUser: any, email: string): AuthUser => {
        const role = getUserRoleByEmail(email);
        const restaurantInfo = role === 'restaurant_owner' ? getRestaurantInfoByEmail(email) : null;

        return {
            username: currentUser.username,
            email: email,
            isAuthenticated: true,
            role,
            restaurantInfo,
        };
    };

    // REGISTRO - Sin cambios significativos
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
                email,
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

    // CONFIRMACIÓN - Con información específica de restaurante
    const confirmarUsuario = async (email: string, confirmationCode: string) => {
        try {
            setIsLoading(true);
            console.log('✅ Confirmando usuario:', email);

            const { isSignUpComplete, nextStep } = await confirmSignUp({
                username: email,
                confirmationCode,
            });

            console.log('✅ Confirmación exitosa:', { isSignUpComplete, nextStep });

            if (isSignUpComplete) {
                console.log('🔐 Haciendo login automático después de confirmación...');

                try {
                    const currentUser = await getCurrentUser();
                    const authUser = createAuthUser(currentUser, email);

                    setUser(authUser);

                    // Log específico para restaurantes
                    if (authUser.restaurantInfo) {
                        console.log('🍕 Restaurante confirmado:', {
                            nombre: authUser.restaurantInfo.nombreRestaurante,
                            universidad: authUser.restaurantInfo.nombreUniversidad,
                            universidadId: authUser.restaurantInfo.universidadId,
                            restauranteId: authUser.restaurantInfo.restauranteId
                        });
                    }

                    return {
                        success: true,
                        message: 'Usuario confirmado e iniciado sesión exitosamente',
                        user: authUser,
                        role: authUser.role,
                        restaurantInfo: authUser.restaurantInfo,
                        autoLogin: true
                    };
                } catch (loginError) {
                    return {
                        success: true,
                        message: 'Usuario confirmado exitosamente. Por favor inicia sesión.',
                        needsLogin: true
                    };
                }
            }

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

    // FUNCIÓN AUXILIAR: Cerrar sesión forzadamente
    const forzarCerrarSesion = async () => {
        try {
            await signOut({ global: true });
            setUser(null);
            return true;
        } catch (error) {
            try {
                await signOut();
                setUser(null);
                return true;
            } catch (fallbackError) {
                return false;
            }
        }
    };

    // LOGIN - Con información específica de restaurante
    const iniciarSesion = async (email: string, password: string, retryCount = 0) => {
        try {
            setIsLoading(true);
            console.log('🔐 Iniciando sesión (múltiples dispositivos permitidos):', email);

            const username = email.toLowerCase().trim();

            // PRIMER INTENTO: Verificar usuario actual
            try {
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    // Si es el mismo usuario, devolver éxito inmediatamente
                    if (currentUser.signInDetails?.loginId === username) {
                        console.log('✅ Usuario ya autenticado - acceso directo');

                        const authUser = createAuthUser(currentUser, username);
                        setUser(authUser);

                        // Log específico para restaurantes
                        if (authUser.restaurantInfo) {
                            console.log('🍕 Restaurante ya autenticado:', {
                                nombre: authUser.restaurantInfo.nombreRestaurante,
                                universidad: authUser.restaurantInfo.nombreUniversidad,
                                universidadId: authUser.restaurantInfo.universidadId,
                                restauranteId: authUser.restaurantInfo.restauranteId
                            });
                        }

                        return {
                            success: true,
                            message: 'Ya estás logueado con esta cuenta',
                            user: authUser,
                            role: authUser.role,
                            restaurantInfo: authUser.restaurantInfo,
                        };
                    }
                }
            } catch (getUserError) {
                // Silencioso - no hay usuario previo
            }

            // SEGUNDO INTENTO: Intentar login normal
            const { isSignedIn, nextStep } = await signIn({
                username,
                password,
                options: {
                    authFlowType: 'USER_SRP_AUTH',
                },
            });

            console.log('✅ Login exitoso');

            if (isSignedIn) {
                const currentUser = await getCurrentUser();
                const authUser = createAuthUser(currentUser, username);

                setUser(authUser);

                // Log específico para restaurantes
                if (authUser.restaurantInfo) {
                    console.log('🍕 Restaurante logueado exitosamente:', {
                        nombre: authUser.restaurantInfo.nombreRestaurante,
                        universidad: authUser.restaurantInfo.nombreUniversidad,
                        universidadId: authUser.restaurantInfo.universidadId,
                        restauranteId: authUser.restaurantInfo.restauranteId
                    });
                }

                return {
                    success: true,
                    message: 'Inicio de sesión exitoso',
                    user: authUser,
                    role: authUser.role,
                    restaurantInfo: authUser.restaurantInfo,
                };
            } else {
                if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
                    return {
                        success: false,
                        error: 'Debes confirmar tu email antes de iniciar sesión',
                        needsConfirmation: true,
                        email: username,
                    };
                }

                return {
                    success: false,
                    error: `Paso adicional requerido: ${nextStep?.signInStep}`,
                };
            }

        } catch (error: any) {
            // Manejo silencioso de UserAlreadyAuthenticatedException
            if (error.name === 'UserAlreadyAuthenticatedException' ||
                error.message.includes('There is already a signed in user')) {

                if (retryCount === 0) {
                    console.log('🔄 Resolviendo conflicto de sesión...');

                    const signOutSuccess = await forzarCerrarSesion();

                    if (signOutSuccess) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                        return await iniciarSesion(email, password, 1);
                    }
                }

                return {
                    success: false,
                    error: 'Conflicto de sesiones. Intenta cerrar sesión desde el perfil.',
                    needsManualSignOut: true,
                };
            }

            // SOLO LOGEAR OTROS ERRORES
            console.error('❌ Error en login:', error);

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
                        email: email.toLowerCase().trim(),
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

    // CERRAR SESIÓN - Sin cambios
    const cerrarSesion = async () => {
        try {
            setIsLoading(true);
            console.log('🚪 Cerrando sesión (solo en este dispositivo)...');

            await signOut();
            setUser(null);

            console.log('✅ Sesión cerrada en este dispositivo. Otras sesiones permanecen activas.');
            return {
                success: true,
                message: 'Sesión cerrada exitosamente'
            };

        } catch (error: any) {
            console.error('❌ Error cerrando sesión:', error);
            setUser(null);

            return {
                success: false,
                error: error.message || 'Error al cerrar sesión'
            };
        } finally {
            setIsLoading(false);
        }
    };

    // VERIFICAR SESIÓN ACTUAL - Con información específica
    const verificarSesion = async () => {
        try {
            console.log('🔍 VERIFICAR SESION - Iniciando...');
            const currentUser = await getCurrentUser();
            console.log('🔍 VERIFICAR SESION - Current user:', currentUser);

            if (currentUser) {
                const email = currentUser.signInDetails?.loginId || '';
                console.log('🔍 VERIFICAR SESION - Email:', email);

                const authUser = createAuthUser(currentUser, email);
                console.log('🔍 VERIFICAR SESION - AuthUser creado:', authUser);

                setUser(authUser);
                return authUser;
            }

            return null;
        } catch (error) {
            console.error('❌ VERIFICAR SESION - Error:', error);
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