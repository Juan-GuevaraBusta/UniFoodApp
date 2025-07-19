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

export interface PlatoCarrito {
    idRestaurante: number;
    plato: Plato;
    cantidad: number;
    comentarios: string;
    nombreUniversidad: string;
    nombreRestaurante: string,
    toppingsSeleccionados: Topping[];
    toppingsBaseRemocionados: number[];
    precioTotal: number;
    idUnico: string;
    fechaAgregado: Date;
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
    const [carrito, setCarrito] = useState<PlatoCarrito[]>([]);

    // Estados de disponibilidad
    const [disponibilidadLocal, setDisponibilidadLocal] = useState<DisponibilidadData>({});
    const STORAGE_KEY = 'restaurant_disponibilidad_';

    // Cargar disponibilidad al inicializar
    useEffect(() => {
        cargarDisponibilidadLocal();
    }, []);

    // =============== GESTIÓN DE DISPONIBILIDAD ===============

    // 📱 Cargar datos de disponibilidad local
    const cargarDisponibilidadLocal = async () => {
        try {
            // ✅ FASE 1: Cargar desde AsyncStorage (implementación actual)
            const keys = await AsyncStorage.getAllKeys();
            const disponibilidadKeys = keys.filter(key => key.startsWith(STORAGE_KEY));

            const nuevaDisponibilidad: DisponibilidadData = {};

            for (const key of disponibilidadKeys) {
                const restauranteId = parseInt(key.replace(STORAGE_KEY, ''));
                const data = await AsyncStorage.getItem(key);

                if (data) {
                    const disponibilidadRestaurante = JSON.parse(data);
                    nuevaDisponibilidad[restauranteId] = disponibilidadRestaurante;
                }
            }

            setDisponibilidadLocal(nuevaDisponibilidad);
            console.log('📱 Disponibilidad cargada desde AsyncStorage:', nuevaDisponibilidad);

            // ✅ TODO FASE 2: Sincronizar con servidor (futuro)
            // Una vez que tengamos backend, aquí buscaremos updates del servidor:
            //
            // try {
            //     // Verificar si hay updates en el servidor
            //     const serverData = await fetchDisponibilidadFromServer();
            //     
            //     // Mergear datos locales con datos del servidor
            //     const mergedData = mergeLocalAndServerData(nuevaDisponibilidad, serverData);
            //     
            //     if (JSON.stringify(mergedData) !== JSON.stringify(nuevaDisponibilidad)) {
            //         setDisponibilidadLocal(mergedData);
            //         // Guardar merged data localmente
            //         await saveDisponibilidadToLocal(mergedData);
            //         console.log('🔄 Datos sincronizados con servidor');
            //     }
            // } catch (syncError) {
            //     console.warn('⚠️ No se pudo sincronizar con servidor, usando datos locales');
            // }

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
            // ✅ FASE 1: Guardar localmente en AsyncStorage (implementación actual)
            const key = `${STORAGE_KEY}${restauranteId}`;
            await AsyncStorage.setItem(key, JSON.stringify(disponibilidad));

            // Actualizar estado local
            setDisponibilidadLocal(prev => ({
                ...prev,
                [restauranteId]: disponibilidad
            }));

            console.log(`💾 Disponibilidad guardada localmente para restaurante ${restauranteId}:`, disponibilidad);

            // ✅ TODO FASE 2: Sincronizar con backend (futuro)
            // Una vez que tengamos backend, aquí sincronizaremos:
            // 
            // try {
            //     // Amplify/GraphQL sync
            //     await syncDisponibilidadToCloud(restauranteId, disponibilidad);
            //     
            //     // O REST API sync
            //     await fetch(`/api/restaurantes/${restauranteId}/disponibilidad`, {
            //         method: 'PUT',
            //         body: JSON.stringify(disponibilidad),
            //         headers: { 'Content-Type': 'application/json' }
            //     });
            //     
            //     console.log(`☁️ Disponibilidad sincronizada con servidor`);
            // } catch (syncError) {
            //     console.warn('⚠️ Error de sincronización, datos guardados localmente:', syncError);
            //     // Marcar para re-sincronización posterior
            // }

            return true;
        } catch (error) {
            console.error('❌ Error guardando disponibilidad:', error);
            return false;
        }
    };

    // 🔍 Obtener disponibilidad actual de un restaurante
    const obtenerDisponibilidadRestaurante = useCallback((
        restauranteId: number,
        menuOriginal: any[]
    ): { [platoId: number]: boolean } => {
        // Si tenemos datos locales, usarlos
        if (disponibilidadLocal[restauranteId]) {
            console.log(`🔍 Usando disponibilidad LOCAL para restaurante ${restauranteId}`);
            return disponibilidadLocal[restauranteId];
        }

        // Si no, usar valores del JSON original
        const disponibilidadOriginal: { [platoId: number]: boolean } = {};
        menuOriginal.forEach(plato => {
            disponibilidadOriginal[plato.idPlato] = plato.disponible;
        });

        console.log(`🔍 Usando disponibilidad ORIGINAL para restaurante ${restauranteId}`);
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
            return disponibilidadLocal[restauranteId][platoId];
        }
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
        return restaurantesFiltradosPorUniversidad.map(restaurante => {
            const menuActualizado = restaurante.menu.map(plato => ({
                ...plato,
                disponible: esPlatoDisponible(restaurante.idRestaurante, plato.idPlato, plato.disponible)
            }));

            return {
                ...restaurante,
                menu: menuActualizado
            };
        });
    }, [restaurantesProcesados, universidadSeleccionada, disponibilidadLocal, esPlatoDisponible]);

    // ✅ Obtener restaurante por ID con disponibilidad actualizada
    const obtenerRestaurantePorId = useCallback((id: number): Restaurante | undefined => {
        const restaurante = restaurantesProcesados.find(r => r.idRestaurante === id);

        if (!restaurante) return undefined;

        // ✅ CRÍTICO: Aplicar disponibilidad local a cada plato para que estudiantes vean cambios
        const menuActualizado = restaurante.menu.map(plato => ({
            ...plato,
            disponible: esPlatoDisponible(id, plato.idPlato, plato.disponible)
        }));

        console.log(`🔍 Restaurante ${id} cargado con disponibilidad actualizada:`, {
            nombre: restaurante.nombreRestaurante,
            platosOriginales: restaurante.menu.length,
            platosDisponibles: menuActualizado.filter(p => p.disponible).length,
            cambiosLocales: disponibilidadLocal[id] ? 'SÍ' : 'NO'
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

    // ✅ Actualizar disponibilidad de un plato individual
    const actualizarDisponibilidadPlato = async (
        idRestaurante: number,
        idPlato: number,
        disponible: boolean
    ): Promise<boolean> => {
        try {
            console.log(`🔄 Actualizando disponibilidad - Restaurante: ${idRestaurante}, Plato: ${idPlato}, Disponible: ${disponible}`);

            // Obtener disponibilidad actual del restaurante
            const restaurante = restaurantesProcesados.find(r => r.idRestaurante === idRestaurante);
            if (!restaurante) return false;

            const disponibilidadActual = obtenerDisponibilidadRestaurante(idRestaurante, restaurante.menu);

            // Actualizar solo este plato
            const nuevaDisponibilidad = {
                ...disponibilidadActual,
                [idPlato]: disponible
            };

            // ✅ TODO: En un entorno real, aquí haríamos la llamada a la API/GraphQL
            // Ejemplo con Amplify:
            // await updatePlato({ 
            //     id: idPlato, 
            //     disponible,
            //     restauranteId: idRestaurante 
            // });
            // 
            // Ejemplo con REST API:
            // await fetch(`/api/restaurantes/${idRestaurante}/platos/${idPlato}`, {
            //     method: 'PATCH',
            //     body: JSON.stringify({ disponible }),
            //     headers: { 'Content-Type': 'application/json' }
            // });

            // Por ahora, guardamos localmente en AsyncStorage
            return await guardarDisponibilidadRestaurante(idRestaurante, nuevaDisponibilidad);
        } catch (error) {
            console.error('❌ Error actualizando disponibilidad:', error);
            return false;
        }
    };

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
            // ✅ TODO: En un entorno real, aquí haríamos una llamada batch a la API/GraphQL
            // Ejemplo con Amplify (batch update):
            // const updatePromises = Object.entries(cambios).map(([platoId, disponible]) => 
            //     updatePlato({ 
            //         id: parseInt(platoId), 
            //         disponible,
            //         restauranteId: idRestaurante 
            //     })
            // );
            // await Promise.all(updatePromises);
            //
            // Ejemplo con REST API (batch endpoint):
            // await fetch(`/api/restaurantes/${idRestaurante}/platos/batch-update`, {
            //     method: 'PATCH',
            //     body: JSON.stringify({ 
            //         updates: Object.entries(cambios).map(([platoId, disponible]) => ({
            //             platoId: parseInt(platoId),
            //             disponible
            //         }))
            //     }),
            //     headers: { 'Content-Type': 'application/json' }
            // });

            // Por ahora, guardamos localmente en AsyncStorage
            return await guardarDisponibilidadRestaurante(idRestaurante, cambios);
        } catch (error) {
            console.error('❌ Error guardando cambios de disponibilidad:', error);
            return false;
        }
    };

    // 🧹 Limpiar datos de disponibilidad (para desarrollo)
    const limpiarDisponibilidad = async (): Promise<void> => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const disponibilidadKeys = keys.filter(key => key.startsWith(STORAGE_KEY));

            await AsyncStorage.multiRemove(disponibilidadKeys);
            setDisponibilidadLocal({});

            console.log('🧹 Disponibilidad local limpiada');
        } catch (error) {
            console.error('❌ Error limpiando disponibilidad:', error);
        }
    };

    // =============== FUNCIONES DEL CARRITO ===============

    const agregarAlCarrito = (platoCarrito: Omit<PlatoCarrito, 'idUnico' | 'fechaAgregado'>): string => {
        const idUnico = `${platoCarrito.idRestaurante}-${platoCarrito.plato.idPlato}-${Date.now()}-${Math.random()}`;
        const nuevoPlatoCarrito: PlatoCarrito = {
            ...platoCarrito,
            idUnico,
            fechaAgregado: new Date()
        };

        setCarrito(prev => [...prev, nuevoPlatoCarrito]);
        return idUnico;
    };

    const eliminarDelCarrito = (idUnico: string): void => {
        setCarrito(prev => prev.filter(item => item.idUnico !== idUnico));
    };

    const actualizarCantidadCarrito = (idUnico: string, nuevaCantidad: number): void => {
        if (nuevaCantidad <= 0) {
            eliminarDelCarrito(idUnico);
            return;
        }

        setCarrito(prev => prev.map(item =>
            item.idUnico === idUnico
                ? { ...item, cantidad: nuevaCantidad }
                : item
        ));
    };

    const limpiarCarrito = (): void => {
        setCarrito([]);
    };

    const calcularTotalCarrito = (): number => {
        return carrito.reduce((total, item) => total + (item.precioTotal * item.cantidad), 0);
    };

    const obtenerCantidadTotalCarrito = (): number => {
        return carrito.reduce((total, item) => total + item.cantidad, 0);
    };

    // =============== RETURN ===============
    return {
        // Estados básicos
        restaurantesFiltrados,
        universidadSeleccionada,
        carrito,

        // Setters
        setUniversidadSeleccionada,

        // Funciones de obtención
        obtenerRestaurantePorId,
        obtenerPlatoPorId,

        // ✅ Funciones de disponibilidad
        actualizarDisponibilidadPlato,
        obtenerDisponibilidadPlatos,
        guardarCambiosDisponibilidad,
        esPlatoDisponible,
        limpiarDisponibilidad, // Para desarrollo
        cargarDisponibilidadLocal, // Para forzar recarga

        // Funciones de carrito
        agregarAlCarrito,
        eliminarDelCarrito,
        actualizarCantidadCarrito,
        limpiarCarrito,
        calcularTotalCarrito,
        obtenerCantidadTotalCarrito,
    };
};