// hooks/useRestaurantes.ts
import { useState, useMemo } from 'react';
import { restaurantes as restaurantesData } from "@/constants/index"; // Cambiar import

// Exportar las interfaces para que otros archivos las usen
export interface Plato {
    idPlato: number;
    nombre: string;
    descripcion: string | null;
    precio: number;
    categoria: string;
    imagen: any;
}

export interface Restaurante {
    idRestaurante: number;
    idUniversidad: number;
    nombreRestaurante: string;
    imagen: any; // Ya viene procesada desde index.ts
    categorias: string[];
    calificacionRestaurante: number;
    tiempoEntrega: number; 
    menu: Plato[];
}

export interface RestauranteConImagen extends Restaurante {
    imagenOriginal?: string | null; // Opcional porque ya no la necesitamos
}

export const useRestaurantes = () => {
    const [universidadSeleccionada, setUniversidadSeleccionada] = useState<number>(1);

    // Ya no necesitamos procesar imágenes, vienen listas desde index.ts
    const restaurantesProcesados = useMemo((): RestauranteConImagen[] => {
        return restaurantesData as RestauranteConImagen[];
    }, []);

    // Filtrar por universidad
    const restaurantesFiltrados = useMemo(() => {
        return restaurantesProcesados.filter(
            restaurante => restaurante.idUniversidad === universidadSeleccionada
        );
    }, [restaurantesProcesados, universidadSeleccionada]);

    // Función para obtener restaurante por ID
    const obtenerRestaurantePorId = (id: number): RestauranteConImagen | undefined => {
        return restaurantesProcesados.find(r => r.idRestaurante === id);
    };

    // Función para obtener todas las categorías únicas
    const obtenerCategoriasUnicas = (): string[] => {
        const categorias = restaurantesProcesados.flatMap(r => r.categorias);
        return Array.from(new Set(categorias));
    };

    return {
        restaurantesFiltrados,
        restaurantesProcesados,
        universidadSeleccionada,
        setUniversidadSeleccionada,
        obtenerRestaurantePorId,
        obtenerCategoriasUnicas,
    };
};