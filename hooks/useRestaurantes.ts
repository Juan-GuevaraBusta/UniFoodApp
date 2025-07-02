import { useState, useMemo } from 'react';
import { restaurantes as restaurantesData } from "@/constants/index";

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

export const useRestaurantes = () => {
    const [universidadSeleccionada, setUniversidadSeleccionada] = useState<number>(1);
    const [carrito, setCarrito] = useState<PlatoCarrito[]>([]);

    const restaurantesProcesados = useMemo(() => {
        return restaurantesData as Restaurante[];
    }, []);

    const restaurantesFiltrados = useMemo(() => {
        return restaurantesProcesados.filter(
            restaurante => restaurante.idUniversidad === universidadSeleccionada
        );
    }, [restaurantesProcesados, universidadSeleccionada]);

    const obtenerRestaurantePorId = (id: number): Restaurante | undefined => {
        return restaurantesProcesados.find(r => r.idRestaurante === id);
    };

    const obtenerPlatoPorId = (idRestaurante: number, idPlato: number): Plato | undefined => {
        const restaurante = obtenerRestaurantePorId(idRestaurante);
        return restaurante?.menu.find(p => p.idPlato === idPlato);
    };

    // Funciones del carrito
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

    return {
        // Estados
        restaurantesFiltrados,
        universidadSeleccionada,
        carrito,

        // Setters
        setUniversidadSeleccionada,

        // Funciones de obtención
        obtenerRestaurantePorId,
        obtenerPlatoPorId,

        // Funciones de carrito
        agregarAlCarrito,
        eliminarDelCarrito,
        actualizarCantidadCarrito,
        limpiarCarrito,
        calcularTotalCarrito,
        obtenerCantidadTotalCarrito,
    };
};