// hooks/useRestaurantes.ts - VERSIÓN CON CARGA AGRESIVA
import { useState, useMemo, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { restaurantes as restaurantesData } from "@/constants/index";

// =============== INTERFACES ===============
export interface Topping {
    id: number;
    nombre: string;
    precio?: number;
    removible?: boolean;
    categoria?: string;
}

export interface Plato {
    idPlato: number;
    nombre: string;
    descripcion: string;
    precio: number;
    categoria: string;
    imagen: any;
    disponible: boolean;
    tipoPlato: 'simple' | 'fijo' | 'mixto' | 'personalizable';
    toppingsBase: Topping[];
    toppingsDisponibles: Topping[];
}

export interface Restaurante {
    idRestaurante: number;
    idUniversidad: number;
    nombreRestaurante: string;
    imagen: any;
    categorias: string[];
    calificacionRestaurante: number;
    tiempoEntrega: number;
    menu: Plato[];
}

interface DisponibilidadData {
    [restauranteId: number]: {
        [platoId: number]: boolean;
    };
}

// =============== HOOK PRINCIPAL ===============
export const useRestaurantes = () => {
    // Estados básicos
    const [universidadSeleccionada, setUniversidadSeleccionada] = useState<number>(1);

    // ✅ CLAVE: Estado de disponibilidad que se actualiza automáticamente
    const [disponibilidadLocal, setDisponibilidadLocal] = useState<DisponibilidadData>({});
    const [isLoadingDisponibilidad, setIsLoadingDisponibilidad] = useState(true);
    const [lastLoadTime, setLastLoadTime] = useState<number>(0);

    const STORAGE_KEY = 'restaurant_disponibilidad_';
    const CACHE_DURATION = 2000; // 2 segundos de cache mínimo

    // ✅ CRÍTICO: Cargar disponibilidad al inicializar Y configurar polling agresivo
    useEffect(() => {
        cargarDisponibilidadInicial();

        // ✅ Polling más frecuente - cada 2 segundos
        const interval = setInterval(() => {
            cargarDisponibilidadLocal();
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // =============== GESTIÓN DE DISPONIBILIDAD ===============

    // 📱 Cargar disponibilidad inicial (solo una vez)
    const cargarDisponibilidadInicial = async () => {
        console.log('🚀 Iniciando carga inicial de disponibilidad...');
        setIsLoadingDisponibilidad(true);
        await cargarDisponibilidadLocal();
        setIsLoadingDisponibilidad(false);
        console.log('✅ Carga inicial completada');
    };

    // 📱 Cargar datos de disponibilidad desde AsyncStorage con cache
    const cargarDisponibilidadLocal = async () => {
        try {
            // ✅ Control de cache para evitar lecturas excesivas
            const now = Date.now();
            if (now - lastLoadTime < CACHE_DURATION) {
                return;
            }
            setLastLoadTime(now);

            const keys = await AsyncStorage.getAllKeys();
            const disponibilidadKeys = keys.filter(key => key.startsWith(STORAGE_KEY));

            const nuevaDisponibilidad: DisponibilidadData = {};

            // ✅ Carga en paralelo para mayor velocidad
            const loadPromises = disponibilidadKeys.map(async (key) => {
                const restauranteId = parseInt(key.replace(STORAGE_KEY, ''));
                const data = await AsyncStorage.getItem(key);

                if (data) {
                    try {
                        const disponibilidadRestaurante = JSON.parse(data);
                        nuevaDisponibilidad[restauranteId] = disponibilidadRestaurante;
                    } catch (parseError) {
                        console.error(`❌ Error parsing data for key ${key}:`, parseError);
                    }
                }
            });

            await Promise.all(loadPromises);

            // ✅ Solo actualizar si hay cambios para evitar re-renders innecesarios
            setDisponibilidadLocal(prev => {
                const hasChanges = JSON.stringify(prev) !== JSON.stringify(nuevaDisponibilidad);
                if (hasChanges) {
                    console.log('🔄 Disponibilidad actualizada desde AsyncStorage:', {
                        restaurantesConDatos: Object.keys(nuevaDisponibilidad).length,
                        timestamp: new Date().toLocaleTimeString(),
                        detalles: nuevaDisponibilidad
                    });
                    return nuevaDisponibilidad;
                }
                return prev;
            });

        } catch (error) {
            console.error('❌ Error cargando disponibilidad local:', error);
        }
    };

    // 💾 Guardar disponibilidad para un restaurante
    const guardarDisponibilidadRestaurante = async (
        restauranteId: number,
        disponibilidad: { [platoId: number]: boolean }
    ): Promise<boolean> => {
        try {
            const key = `${STORAGE_KEY}${restauranteId}`;
            await AsyncStorage.setItem(key, JSON.stringify(disponibilidad));

            // ✅ Actualizar estado local inmediatamente
            setDisponibilidadLocal(prev => ({
                ...prev,
                [restauranteId]: disponibilidad
            }));

            console.log(`💾 Disponibilidad guardada para restaurante ${restauranteId}:`, disponibilidad);

            // ✅ Forzar recarga inmediata pero sin bloquear
            setTimeout(() => {
                cargarDisponibilidadLocal();
            }, 50);

            return true;
        } catch (error) {
            console.error('❌ Error guardando disponibilidad:', error);
            return false;
        }
    };

    // 🔍 Obtener disponibilidad actual de un restaurante con fallback inteligente
    const obtenerDisponibilidadRestaurante = useCallback((
        restauranteId: number,
        menuOriginal: any[]
    ): { [platoId: number]: boolean } => {
        // ✅ Prioridad 1: Datos locales de AsyncStorage
        if (disponibilidadLocal[restauranteId]) {
            console.log(`🔍 Usando disponibilidad LOCAL para restaurante ${restauranteId}:`, disponibilidadLocal[restauranteId]);
            return disponibilidadLocal[restauranteId];
        }

        // ✅ Prioridad 2: Valores del JSON original como fallback
        const disponibilidadOriginal: { [platoId: number]: boolean } = {};
        menuOriginal.forEach(plato => {
            disponibilidadOriginal[plato.idPlato] = plato.disponible;
        });

        console.log(`🔍 Usando disponibilidad ORIGINAL para restaurante ${restauranteId}:`, disponibilidadOriginal);
        return disponibilidadOriginal;
    }, [disponibilidadLocal]);

    // 🔄 Verificar si un plato específico está disponible
    const esPlatoDisponible = useCallback((
        restauranteId: number,
        platoId: number,
        valorOriginal: boolean
    ): boolean => {
        if (disponibilidadLocal[restauranteId] &&
            disponibilidadLocal[restauranteId][platoId] !== undefined) {
            const disponible = disponibilidadLocal[restauranteId][platoId];
            console.log(`🔄 Plato ${platoId} en restaurante ${restauranteId}: ${disponible ? 'DISPONIBLE' : 'NO DISPONIBLE'} (AsyncStorage)`);
            return disponible;
        }
        console.log(`🔄 Plato ${platoId} en restaurante ${restauranteId}: ${valorOriginal ? 'DISPONIBLE' : 'NO DISPONIBLE'} (original)`);
        return valorOriginal;
    }, [disponibilidadLocal]);

    // =============== PROCESAMIENTO DE DATOS ===============

    const restaurantesProcesados = useMemo(() => {
        return restaurantesData as Restaurante[];
    }, []);

    // ✅ Restaurantes filtrados con disponibilidad actualizada
    const restaurantesFiltrados = useMemo(() => {
        const restaurantesFiltradosPorUniversidad = restaurantesProcesados.filter(
            restaurante => restaurante.idUniversidad === universidadSeleccionada
        );

        // ✅ CRÍTICO: Aplicar disponibilidad actualizada a cada restaurante filtrado
        const restaurantesActualizados = restaurantesFiltradosPorUniversidad.map(restaurante => {
            const menuActualizado = restaurante.menu.map(plato => ({
                ...plato,
                disponible: esPlatoDisponible(restaurante.idRestaurante, plato.idPlato, plato.disponible)
            }));

            const platosDisponibles = menuActualizado.filter(p => p.disponible).length;

            console.log(`🍽️ Restaurante ${restaurante.nombreRestaurante} procesado:`, {
                totalPlatos: menuActualizado.length,
                platosDisponibles,
                tieneDisponibilidadLocal: !!disponibilidadLocal[restaurante.idRestaurante]
            });

            return {
                ...restaurante,
                menu: menuActualizado
            };
        });

        return restaurantesActualizados;
    }, [restaurantesProcesados, universidadSeleccionada, disponibilidadLocal, esPlatoDisponible]);

    // ✅ Obtener restaurante por ID con disponibilidad actualizada - OPTIMIZADO
    const obtenerRestaurantePorId = useCallback((id: number): Restaurante | undefined => {
        const restaurante = restaurantesProcesados.find(r => r.idRestaurante === id);

        if (!restaurante) {
            console.warn(`⚠️ Restaurante con ID ${id} no encontrado`);
            return undefined;
        }

        // ✅ CRÍTICO: Aplicar disponibilidad local a cada plato
        const menuActualizado = restaurante.menu.map(plato => ({
            ...plato,
            disponible: esPlatoDisponible(id, plato.idPlato, plato.disponible)
        }));

        console.log(`🔍 Restaurante ${id} cargado con disponibilidad actualizada:`, {
            nombre: restaurante.nombreRestaurante,
            platosOriginales: restaurante.menu.length,
            platosDisponibles: menuActualizado.filter(p => p.disponible).length,
            cambiosLocales: disponibilidadLocal[id] ? 'SÍ' : 'NO',
            detalleDisponibilidad: menuActualizado.map(p => ({
                id: p.idPlato,
                nombre: p.nombre,
                disponible: p.disponible
            }))
        });

        return {
            ...restaurante,
            menu: menuActualizado
        };
    }, [restaurantesProcesados, esPlatoDisponible, disponibilidadLocal]);

    const obtenerPlatoPorId = useCallback((idRestaurante: number, idPlato: number): Plato | undefined => {
        const restaurante = obtenerRestaurantePorId(idRestaurante);
        return restaurante?.menu.find(p => p.idPlato === idPlato);
    }, [obtenerRestaurantePorId]);

    // =============== FUNCIONES PÚBLICAS DE DISPONIBILIDAD ===============

    // ✅ Obtener estado de disponibilidad actual
    const obtenerDisponibilidadPlatos = useCallback((idRestaurante: number): { [key: number]: boolean } => {
        const restaurante = restaurantesProcesados.find(r => r.idRestaurante === idRestaurante);
        if (!restaurante) return {};

        return obtenerDisponibilidadRestaurante(idRestaurante, restaurante.menu);
    }, [restaurantesProcesados, obtenerDisponibilidadRestaurante]);

    // ✅ Guardar múltiples cambios de disponibilidad
    const guardarCambiosDisponibilidad = async (
        idRestaurante: number,
        cambios: { [platoId: number]: boolean }
    ): Promise<boolean> => {
        try {
            console.log(`💾 Guardando cambios de disponibilidad para restaurante ${idRestaurante}:`, cambios);

            const success = await guardarDisponibilidadRestaurante(idRestaurante, cambios);

            if (success) {
                console.log('✅ Cambios guardados exitosamente');

                // ✅ Forzar actualización inmediata en múltiples momentos
                await cargarDisponibilidadLocal();

                // ✅ Segunda actualización para asegurar sincronización
                setTimeout(async () => {
                    await cargarDisponibilidadLocal();
                }, 200);
            }

            return success;
        } catch (error) {
            console.error('❌ Error guardando cambios de disponibilidad:', error);
            return false;
        }
    };

    // ✅ Función para forzar recarga manual - MEJORADA
    const forzarRecargaDisponibilidad = useCallback(async () => {
        console.log('🔄 Forzando recarga de disponibilidad...');
        setIsLoadingDisponibilidad(true);

        try {
            // ✅ Resetear cache para forzar lectura
            setLastLoadTime(0);

            // ✅ Cargar inmediatamente
            await cargarDisponibilidadLocal();

            // ✅ Segunda carga para asegurar datos
            setTimeout(async () => {
                await cargarDisponibilidadLocal();
            }, 100);

            console.log('✅ Recarga forzada completada');
        } catch (error) {
            console.error('❌ Error en recarga forzada:', error);
        } finally {
            setIsLoadingDisponibilidad(false);
        }
    }, []);

    // 🧹 Limpiar datos de disponibilidad (para desarrollo)
    const limpiarDisponibilidad = async (): Promise<void> => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const disponibilidadKeys = keys.filter(key => key.startsWith(STORAGE_KEY));

            await AsyncStorage.multiRemove(disponibilidadKeys);
            setDisponibilidadLocal({});
            setLastLoadTime(0);

            console.log('🧹 Disponibilidad local limpiada');
        } catch (error) {
            console.error('❌ Error limpiando disponibilidad:', error);
        }
    };

    // ✅ NUEVA: Función para pre-cargar disponibilidad de un restaurante específico
    const precargarDisponibilidadRestaurante = useCallback(async (restauranteId: number) => {
        try {
            console.log(`🚀 Pre-cargando disponibilidad para restaurante ${restauranteId}...`);

            const key = `${STORAGE_KEY}${restauranteId}`;
            const data = await AsyncStorage.getItem(key);

            if (data) {
                const disponibilidadRestaurante = JSON.parse(data);
                setDisponibilidadLocal(prev => ({
                    ...prev,
                    [restauranteId]: disponibilidadRestaurante
                }));

                console.log(`✅ Disponibilidad pre-cargada para restaurante ${restauranteId}:`, disponibilidadRestaurante);
            } else {
                console.log(`ℹ️ No hay disponibilidad guardada para restaurante ${restauranteId}`);
            }
        } catch (error) {
            console.error(`❌ Error pre-cargando restaurante ${restauranteId}:`, error);
        }
    }, [STORAGE_KEY]);

    // =============== RETURN ===============
    return {
        // Estados básicos
        restaurantesFiltrados,
        universidadSeleccionada,
        isLoadingDisponibilidad,

        // Setters
        setUniversidadSeleccionada,

        // Funciones de obtención
        obtenerRestaurantePorId,
        obtenerPlatoPorId,

        // ✅ Funciones de disponibilidad
        obtenerDisponibilidadPlatos,
        guardarCambiosDisponibilidad,
        esPlatoDisponible,
        forzarRecargaDisponibilidad, // Mejorada
        precargarDisponibilidadRestaurante, // Nueva
        limpiarDisponibilidad, // Para desarrollo
        cargarDisponibilidadLocal: cargarDisponibilidadLocal, // Exponemos para uso manual

        // Estado de disponibilidad (para debugging)
        disponibilidadLocal, // Exponemos para ver qué datos tenemos
    };
};