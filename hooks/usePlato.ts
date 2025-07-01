// hooks/usePlato.ts - Hook para personalización de plato (React Native)
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Plato, Topping, PlatoCarrito } from './useRestaurantes';

interface UsePlatoProps {
    plato: Plato | null;
    idRestaurante: number;
}

export const usePlato = ({ plato, idRestaurante }: UsePlatoProps) => {
    // Estados simplificados para checkboxes
    const [toppingsAdicionalesSeleccionados, setToppingsAdicionalesSeleccionados] = useState<number[]>([]);
    const [toppingsBaseRemocionados, setToppingsBaseRemocionados] = useState<number[]>([]);
    const [cantidad, setCantidad] = useState<number>(1);
    const [comentarios, setComentarios] = useState<string>('');

    // Ejecutar inicialización cuando cambie el plato
    useEffect(() => {
        // Limpiar selecciones cuando cambie el plato
        setToppingsAdicionalesSeleccionados([]);
        setToppingsBaseRemocionados([]);
        setComentarios('');
        setCantidad(1);
    }, [plato]);

    // Toggle para toppings adicionales
    const toggleToppingAdicional = useCallback((toppingId: number) => {
        if (!plato) return;

        setToppingsAdicionalesSeleccionados(prev => {
            if (prev.includes(toppingId)) {
                return prev.filter(id => id !== toppingId);
            } else {
                return [...prev, toppingId];
            }
        });
    }, [plato]);

    // Toggle para toppings base (remover/incluir)
    const toggleToppingBase = useCallback((toppingId: number) => {
        if (!plato) return;

        const toppingBase = plato.toppingsBase.find(t => t.id === toppingId);
        if (!toppingBase?.removible) return;

        setToppingsBaseRemocionados(prev => {
            if (prev.includes(toppingId)) {
                return prev.filter(id => id !== toppingId);
            } else {
                return [...prev, toppingId];
            }
        });
    }, [plato]);

    // Verificar si un topping adicional está seleccionado
    const isToppingAdicionalSeleccionado = useCallback((toppingId: number): boolean => {
        return toppingsAdicionalesSeleccionados.includes(toppingId);
    }, [toppingsAdicionalesSeleccionados]);

    // Verificar si un topping base está removido
    const isToppingBaseRemovido = useCallback((toppingId: number): boolean => {
        return toppingsBaseRemocionados.includes(toppingId);
    }, [toppingsBaseRemocionados]);

    // Calcular precio total
    const precioTotal = useMemo(() => {
        if (!plato) return 0;

        let precio = plato.precio;

        // Sumar toppings adicionales seleccionados
        toppingsAdicionalesSeleccionados.forEach(toppingId => {
            const topping = plato.toppingsDisponibles.find(t => t.id === toppingId);
            if (topping?.precio) {
                precio += topping.precio;
            }
        });

        return precio;
    }, [plato, toppingsAdicionalesSeleccionados]);

    // Obtener toppings seleccionados completos
    const obtenerToppingsSeleccionados = useCallback((): Topping[] => {
        if (!plato) return [];

        return toppingsAdicionalesSeleccionados
            .map(id => plato.toppingsDisponibles.find(t => t.id === id))
            .filter(Boolean) as Topping[];
    }, [toppingsAdicionalesSeleccionados, plato]);

    // Obtener toppings base removidos
    const obtenerToppingsBaseRemocionados = useCallback((): number[] => {
        return toppingsBaseRemocionados;
    }, [toppingsBaseRemocionados]);

    // Crear objeto para carrito
    const crearPlatoParaCarrito = useCallback((): Omit<PlatoCarrito, 'idUnico' | 'fechaAgregado'> | null => {
        if (!plato) return null;

        return {
            idRestaurante,
            plato,
            cantidad,
            comentarios: comentarios.trim(),
            toppingsSeleccionados: obtenerToppingsSeleccionados(),
            toppingsBaseRemocionados: obtenerToppingsBaseRemocionados(),
            precioTotal
        };
    }, [idRestaurante, plato, cantidad, comentarios, obtenerToppingsSeleccionados, obtenerToppingsBaseRemocionados, precioTotal]);

    // Limpiar selecciones
    const limpiarSelecciones = useCallback(() => {
        setToppingsAdicionalesSeleccionados([]);
        setToppingsBaseRemocionados([]);
        setCantidad(1);
        setComentarios('');
    }, []);

    // Validar si se puede agregar al carrito
    const puedeAgregarAlCarrito = useMemo(() => {
        if (!plato) return false;

        // Para platos personalizables, debe tener al menos un topping adicional
        if (plato.tipoPlato === 'personalizable') {
            return toppingsAdicionalesSeleccionados.length > 0;
        }
        return true;
    }, [plato, toppingsAdicionalesSeleccionados]);

    return {
        // Estados
        toppingsAdicionalesSeleccionados,
        toppingsBaseRemocionados,
        cantidad,
        comentarios,
        precioTotal,
        puedeAgregarAlCarrito,
        platoDisponible: !!plato,

        // Setters
        setCantidad,
        setComentarios,

        // Funciones de toggle
        toggleToppingAdicional,
        toggleToppingBase,

        // Verificadores - NOMBRES CORRECTOS
        isToppingAdicionalSeleccionado,
        isToppingBaseRemovido,

        // Funciones de utilidad
        obtenerToppingsSeleccionados,
        obtenerToppingsBaseRemocionados,
        crearPlatoParaCarrito,
        limpiarSelecciones,
    };
};