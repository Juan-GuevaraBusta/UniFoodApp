// hooks/useDisponibilidad.ts - Hook para manejar disponibilidad desde el backend
import type { Schema } from '@/amplify/data/resource';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateClient } from 'aws-amplify/data';
import { useCallback, useState } from 'react';
import { useAuth } from './useAuth';

// ✅ Cliente tipado de Gen 2 - usando apiKey como modo por defecto
const client = generateClient<Schema>({
    authMode: 'apiKey',
});

// ✅ Cliente alternativo para debugging
const clientDebug = generateClient<Schema>({
    authMode: 'apiKey',
});

interface DisponibilidadPlato {
    id: string;
    platoId: string;
    restauranteId: string;
    disponible: boolean;
    fechaActualizacion: string;
    comentario: string | null;
}

interface DisponibilidadResult {
    success: boolean;
    error?: string;
    disponibilidad?: { [platoId: string]: boolean };
    needsReauth?: boolean;
}

export const useDisponibilidad = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { user, isAuthenticated } = useAuth();

    // ✅ Obtener disponibilidad de todos los platos de un restaurante (Backend primero, AsyncStorage como fallback)
    const obtenerDisponibilidadRestaurante = useCallback(async (restauranteId: string): Promise<DisponibilidadResult> => {
        try {
            setIsLoading(true);
            console.log(`🔄 Obteniendo disponibilidad para restaurante ${restauranteId}...`);

            const disponibilidad: { [platoId: string]: boolean } = {};

            // ✅ PASO 1: Intentar obtener desde backend usando apiKey
            try {
                const { data: disponibilidadPlatos, errors } = await client.models.DisponibilidadPlato.list({
                    filter: {
                        restauranteId: { eq: restauranteId }
                    }
                });

                if (!errors && disponibilidadPlatos) {
                    disponibilidadPlatos.forEach((item: any) => {
                        // ✅ Priorizar datos del backend
                        disponibilidad[item.platoId] = item.disponible;
                    });
                    console.log('✅ Datos del backend cargados exitosamente con apiKey');
                } else if (errors) {
                    console.warn('⚠️ Error cargando desde backend:', errors);
                }
            } catch (backendError) {
                console.warn('⚠️ Error cargando desde backend, usando AsyncStorage como fallback:', backendError);
            }

            // ✅ PASO 2: Si no hay datos del backend, usar AsyncStorage como fallback
            if (Object.keys(disponibilidad).length === 0) {
                console.log('ℹ️ No hay datos del backend, cargando desde AsyncStorage...');

                const keys = await AsyncStorage.getAllKeys();
                const disponibilidadKeys = keys.filter((key: string) => key.startsWith(`disponibilidad_${restauranteId}_`));

                // ✅ Cargar desde AsyncStorage
                for (const key of disponibilidadKeys) {
                    try {
                        const data = await AsyncStorage.getItem(key);
                        if (data) {
                            const item = JSON.parse(data);
                            const platoId = item.platoId;

                            // ✅ Tomar la más reciente
                            if (!disponibilidad[platoId] ||
                                new Date(item.fechaActualizacion) > new Date(disponibilidad[platoId] ? '0' : '0')) {
                                disponibilidad[item.platoId] = item.disponible;
                            }
                        }
                    } catch (error) {
                        console.warn(`⚠️ Error leyendo key ${key}:`, error);
                    }
                }
            }

            console.log(`✅ Disponibilidad obtenida para restaurante ${restauranteId}:`, disponibilidad);

            return {
                success: true,
                disponibilidad
            };

        } catch (error: any) {
            console.error('❌ Error obteniendo disponibilidad:', error);
            return {
                success: false,
                error: error.message || 'Error obteniendo disponibilidad'
            };
        } finally {
            setIsLoading(false);
        }
    }, [client]);

    // ✅ Actualizar disponibilidad de un plato (Backend primero, luego AsyncStorage como backup)
    const actualizarDisponibilidadPlato = useCallback(async (
        platoId: string,
        restauranteId: string,
        disponible: boolean,
        comentario?: string
    ): Promise<{ success: boolean; error?: string; needsReauth?: boolean }> => {
        try {
            setIsLoading(true);
            console.log(`🚨 ACTUALIZACIÓN URGENTE - Plato ${platoId}:`, { disponible, comentario });

            // ✅ PASO 1: Verificar autenticación para backend
            if (!isAuthenticated) {
                console.warn('⚠️ Usuario no autenticado, usando solo AsyncStorage');

                // ✅ Guardar solo en AsyncStorage si no hay autenticación
                const key = `disponibilidad_${restauranteId}_${platoId}`;
                const data = {
                    platoId,
                    restauranteId,
                    disponible,
                    fechaActualizacion: new Date().toISOString(),
                    comentario: comentario || undefined
                };

                await AsyncStorage.setItem(key, JSON.stringify(data));
                console.log('✅ Disponibilidad guardada en AsyncStorage (sin autenticación)');

                return {
                    success: true,
                    error: 'Usuario no autenticado. Los cambios solo están disponibles localmente.'
                };
            }

            // ✅ PASO 2: Guardar en backend usando apiKey (modo por defecto)
            try {
                const disponibilidadData = {
                    platoId,
                    restauranteId,
                    disponible,
                    fechaActualizacion: new Date().toISOString(),
                    comentario: comentario || undefined,
                    restaurantePlato: `${restauranteId}#${platoId}`
                };

                console.log('🔍 Intentando guardar en backend con datos:', disponibilidadData);

                const { data: nuevaDisponibilidad, errors } = await clientDebug.models.DisponibilidadPlato.create(disponibilidadData);

                if (errors && errors.length > 0) {
                    console.error('❌ Error crítico guardando en backend:', errors);
                    console.error('❌ Detalles del error:', JSON.stringify(errors, null, 2));
                    throw new Error('No se pudo guardar en el backend');
                } else {
                    console.log('✅ Disponibilidad guardada exitosamente en backend con apiKey');
                    console.log('✅ Datos guardados:', nuevaDisponibilidad);
                }
            } catch (backendError: any) {
                console.error('❌ Error crítico de backend:', backendError);
                console.error('❌ Stack trace:', backendError.stack);
                throw new Error(`Error de backend: ${backendError.message}`);
            }

            // ✅ PASO 3: Guardar en AsyncStorage como backup local
            const key = `disponibilidad_${restauranteId}_${platoId}`;
            const data = {
                platoId,
                restauranteId,
                disponible,
                fechaActualizacion: new Date().toISOString(),
                comentario: comentario || undefined
            };

            await AsyncStorage.setItem(key, JSON.stringify(data));
            console.log('✅ Disponibilidad guardada en AsyncStorage (backup local)');

            return {
                success: true
            };

        } catch (error: any) {
            console.error('❌ Error actualizando disponibilidad:', error);
            return {
                success: false,
                error: error.message || 'Error actualizando disponibilidad'
            };
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, client]);

    // ✅ Obtener disponibilidad de un plato específico
    const obtenerDisponibilidadPlato = useCallback(async (platoId: string): Promise<{ success: boolean; disponible?: boolean; error?: string }> => {
        try {
            console.log(`🔍 Obteniendo disponibilidad para plato ${platoId}...`);

            const { data: disponibilidadPlatos, errors } = await client.models.DisponibilidadPlato.list({
                filter: {
                    platoId: { eq: platoId }
                }
            });

            if (errors && errors.length > 0) {
                console.error('❌ Error obteniendo disponibilidad del plato:', errors);
                return {
                    success: false,
                    error: errors[0].message || 'Error obteniendo disponibilidad del plato'
                };
            }

            if (disponibilidadPlatos && disponibilidadPlatos.length > 0) {
                const disponibilidad = disponibilidadPlatos[0];
                console.log(`✅ Disponibilidad del plato ${platoId}:`, disponibilidad.disponible);

                return {
                    success: true,
                    disponible: disponibilidad.disponible
                };
            }

            // ✅ Si no hay registro, el plato está disponible por defecto
            console.log(`ℹ️ No hay registro de disponibilidad para plato ${platoId}, asumiendo disponible`);
            return {
                success: true,
                disponible: true
            };

        } catch (error: any) {
            console.error('❌ Error obteniendo disponibilidad del plato:', error);
            return {
                success: false,
                error: error.message || 'Error obteniendo disponibilidad del plato'
            };
        }
    }, []);

    // ✅ NUEVA: Función para verificar configuración del backend
    const verificarConfiguracionBackend = useCallback(async () => {
        try {
            console.log('🔍 Verificando configuración del backend...');

            // ✅ Intentar una operación simple de lectura
            const { data: testData, errors: testErrors } = await clientDebug.models.DisponibilidadPlato.list({
                limit: 1
            });

            if (testErrors && testErrors.length > 0) {
                console.error('❌ Error verificando backend:', testErrors);
                return {
                    success: false,
                    error: testErrors[0].message
                };
            } else {
                console.log('✅ Backend configurado correctamente');
                return {
                    success: true,
                    data: testData
                };
            }
        } catch (error: any) {
            console.error('❌ Error verificando configuración:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }, [clientDebug]);

    return {
        obtenerDisponibilidadRestaurante,
        actualizarDisponibilidadPlato,
        obtenerDisponibilidadPlato,
        verificarConfiguracionBackend,
        isLoading
    };
};
