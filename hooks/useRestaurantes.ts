// hooks/useRestaurantes.ts - VERSIÓN SIMPLIFICADA
import { restaurantes as restaurantesData } from "@/constants/index";
import { useCallback, useMemo, useState } from 'react';
import { useAmplifyData } from './useAmplifyData';

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
    const [disponibilidadLocal, setDisponibilidadLocal] = useState<DisponibilidadData>({});

    // ✅ Hook de disponibilidad backend
    const { obtenerDisponibilidadRestaurante, actualizarDisponibilidadPlato } = useAmplifyData();

    // =============== PROCESAMIENTO DE DATOS ===============
    const restaurantesProcesados = useMemo(() => {
        return restaurantesData as Restaurante[];
    }, []);

    // ✅ NOTA: La disponibilidad ahora se carga directamente en las pantallas
    // siguiendo el mismo patrón que los pedidos (useFocusEffect + carga directa)

    // ✅ Restaurantes filtrados (sin disponibilidad - se carga directamente en pantallas)
    const restaurantesFiltrados = useMemo(() => {
        return restaurantesProcesados.filter(
            restaurante => restaurante.idUniversidad === universidadSeleccionada
        );
    }, [restaurantesProcesados, universidadSeleccionada]);

    // =============== FUNCIONES DE OBTENCIÓN ===============
    const obtenerRestaurantePorId = useCallback((id: number): Restaurante | undefined => {
        return restaurantesProcesados.find(restaurante => restaurante.idRestaurante === id);
    }, [restaurantesProcesados]);

    const obtenerPlatoPorId = useCallback((restauranteId: number, platoId: number): Plato | undefined => {
        const restaurante = obtenerRestaurantePorId(restauranteId);
        return restaurante?.menu.find(plato => plato.idPlato === platoId);
    }, [obtenerRestaurantePorId]);

    // =============== FUNCIONES DE DISPONIBILIDAD ===============

    // ✅ Obtener disponibilidad de un restaurante desde backend
    const obtenerDisponibilidadPlatos = useCallback(async (idRestaurante: number): Promise<{ [key: number]: boolean }> => {
        try {
            console.log(`🔍 Obteniendo disponibilidad para restaurante ${idRestaurante}...`);
            const resultado = await obtenerDisponibilidadRestaurante(idRestaurante.toString());

            if (resultado.success && resultado.disponibilidad) {
                // ✅ Convertir string keys a number keys
                const disponibilidadNumerica: { [key: number]: boolean } = {};
                Object.entries(resultado.disponibilidad).forEach(([key, value]) => {
                    disponibilidadNumerica[parseInt(key)] = value;
                });

                console.log(`✅ Disponibilidad obtenida para restaurante ${idRestaurante}:`, disponibilidadNumerica);

                // ✅ Actualizar estado local
                setDisponibilidadLocal(prev => {
                    const nuevoEstado = {
                        ...prev,
                        [idRestaurante]: disponibilidadNumerica
                    };
                    console.log(`💾 Estado de disponibilidad actualizado:`, nuevoEstado);
                    return nuevoEstado;
                });

                return disponibilidadNumerica;
            } else {
                console.log(`⚠️ No se encontró disponibilidad para restaurante ${idRestaurante}:`, resultado);
            }

            return {};
        } catch (error) {
            console.error('❌ Error obteniendo disponibilidad:', error);
            return {};
        }
    }, [obtenerDisponibilidadRestaurante]);



    // ✅ Guardar cambios de disponibilidad
    const guardarCambiosDisponibilidad = useCallback(async (
        idRestaurante: number,
        cambios: { [platoId: number]: boolean }
    ): Promise<boolean> => {
        try {
            console.log(`💾 Guardando cambios de disponibilidad para restaurante ${idRestaurante}:`, cambios);

            // ✅ Guardar en backend
            const promises = Object.entries(cambios).map(([platoId, disponible]) =>
                actualizarDisponibilidadPlato(platoId, idRestaurante.toString(), disponible)
            );

            const resultados = await Promise.all(promises);
            const errores = resultados.filter(r => !r.success);

            if (errores.length > 0) {
                console.error('❌ Errores guardando en backend:', errores);
                return false;
            }

            console.log('✅ Cambios guardados exitosamente en backend');

            // ✅ Actualizar estado local
            setDisponibilidadLocal(prev => ({
                ...prev,
                [idRestaurante]: cambios
            }));

            return true;
        } catch (error) {
            console.error('❌ Error guardando cambios de disponibilidad:', error);
            return false;
        }
    }, [actualizarDisponibilidadPlato]);

    // ✅ Verificar si un plato específico está disponible
    const esPlatoDisponible = useCallback((
        restauranteId: number,
        platoId: number,
        valorOriginal: boolean
    ): boolean => {
        return disponibilidadLocal[restauranteId]?.[platoId] ?? valorOriginal;
    }, [disponibilidadLocal]);

    // ✅ Forzar recarga de disponibilidad
    const forzarRecargaDisponibilidad = useCallback(async () => {
        console.log('🔄 Forzando recarga de disponibilidad...');

        const restaurantesIds = restaurantesProcesados.map(r => r.idRestaurante);
        const promises = restaurantesIds.map(id => obtenerDisponibilidadPlatos(id));

        await Promise.all(promises);
        console.log('✅ Recarga forzada completada');
    }, [restaurantesProcesados, obtenerDisponibilidadPlatos]);

    // ✅ Precargar disponibilidad de un restaurante específico
    const precargarDisponibilidadRestaurante = useCallback(async (idRestaurante: number) => {
        await obtenerDisponibilidadPlatos(idRestaurante);
    }, [obtenerDisponibilidadPlatos]);

    // =============== RETURN ===============
    return {
        // Estados básicos
        restaurantesFiltrados,
        universidadSeleccionada,
        isLoadingDisponibilidad: false,

        // Setters
        setUniversidadSeleccionada,

        // Funciones de obtención
        obtenerRestaurantePorId,
        obtenerPlatoPorId,

        // ✅ Funciones de disponibilidad
        obtenerDisponibilidadPlatos,
        guardarCambiosDisponibilidad,
        esPlatoDisponible,
        forzarRecargaDisponibilidad,
        precargarDisponibilidadRestaurante,

        // Estado de disponibilidad (para debugging)
        disponibilidadLocal,
    };
};