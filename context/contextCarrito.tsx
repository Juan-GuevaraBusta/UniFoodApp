// context/CarritoContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Interfaces (cópialas de useRestaurantes.ts)
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

export interface PlatoCarrito {
    idRestaurante: number;
    nombreRestaurante: string;  // ← AGREGAR
    nombreUniversidad: string;  // ← AGREGAR
    plato: Plato;
    cantidad: number;
    comentarios: string;
    toppingsSeleccionados: Topping[];
    toppingsBaseRemocionados: number[];
    precioTotal: number;
    idUnico: string;
    fechaAgregado: Date;
}

interface CarritoContextType {
    carrito: PlatoCarrito[];
    agregarAlCarrito: (platoCarrito: Omit<PlatoCarrito, 'idUnico' | 'fechaAgregado'>) => string;
    eliminarDelCarrito: (idUnico: string) => void;
    actualizarCantidadCarrito: (idUnico: string, nuevaCantidad: number) => void;
    limpiarCarrito: () => void;
    calcularTotalCarrito: () => number;
    obtenerCantidadTotalCarrito: () => number;
}

const CarritoContext = createContext<CarritoContextType | undefined>(undefined);

interface CarritoProviderProps {
    children: ReactNode;
}

export const CarritoProvider: React.FC<CarritoProviderProps> = ({ children }) => {
    const [carrito, setCarrito] = useState<PlatoCarrito[]>([]);

    const agregarAlCarrito = (platoCarrito: Omit<PlatoCarrito, 'idUnico' | 'fechaAgregado'>): string => {
        // Función para generar ID hexadecimal ####-####
        const generarIdHex = (): string => {
            const generarGrupo = () => {
                return Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0').toUpperCase();
            };

            return `${generarGrupo()}-${generarGrupo()}`;
        };

        const idUnico = generarIdHex();
        const nuevoPlatoCarrito: PlatoCarrito = {
            ...platoCarrito,
            idUnico,
            fechaAgregado: new Date()
        };

        setCarrito(prev => {
            const nuevoCarrito = [...prev, nuevoPlatoCarrito];
            return nuevoCarrito;
        });

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
        const total = carrito.reduce((total, item) => total + item.cantidad, 0);
        return total;
    };

    return (
        <CarritoContext.Provider value={{
            carrito,
            agregarAlCarrito,
            eliminarDelCarrito,
            actualizarCantidadCarrito,
            limpiarCarrito,
            calcularTotalCarrito,
            obtenerCantidadTotalCarrito
        }}>
            {children}
        </CarritoContext.Provider>
    );
};

export const useCarrito = (): CarritoContextType => {
    const context = useContext(CarritoContext);
    if (!context) {
        throw new Error('useCarrito debe ser usado dentro de CarritoProvider');
    }
    return context;
};