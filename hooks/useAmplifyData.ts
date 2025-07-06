// hooks/useAmplifyData.ts
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

// Generar el cliente tipado
const client = generateClient<Schema>();

export const useAmplifyData = () => {

    // Universidades
    const crearUniversidad = async (universidad: { nombre: string; ciudad: string; imagen?: string }) => {
        try {
            const { data } = await client.models.Universidad.create(universidad);
            return { success: true, data };
        } catch (error) {
            console.error('Error creando universidad:', error);
            return { success: false, error };
        }
    };

    const obtenerUniversidades = async () => {
        try {
            const { data } = await client.models.Universidad.list();
            return { success: true, data };
        } catch (error) {
            console.error('Error obteniendo universidades:', error);
            return { success: false, error };
        }
    };

    // Restaurantes
    const crearRestaurante = async (restaurante: {
        nombre: string;
        universidadId: string;
        imagen?: string;
        categorias?: string[];
        calificacion?: number;
        tiempoEntrega?: number;
    }) => {
        try {
            const { data } = await client.models.Restaurante.create(restaurante);
            return { success: true, data };
        } catch (error) {
            console.error('Error creando restaurante:', error);
            return { success: false, error };
        }
    };

    const obtenerRestaurantesPorUniversidad = async (universidadId: string) => {
        try {
            const { data } = await client.models.Restaurante.list({
                filter: { universidadId: { eq: universidadId } }
            });
            return { success: true, data };
        } catch (error) {
            console.error('Error obteniendo restaurantes:', error);
            return { success: false, error };
        }
    };

    // Platos
    const crearPlato = async (plato: {
        nombre: string;
        descripcion?: string;
        precio: number;
        categoria: string;
        imagen?: string;
        tipoPlato?: 'simple' | 'fijo' | 'mixto' | 'personalizable';
        restauranteId: string;
    }) => {
        try {
            const { data } = await client.models.Plato.create(plato);
            return { success: true, data };
        } catch (error) {
            console.error('Error creando plato:', error);
            return { success: false, error };
        }
    };

    const obtenerPlatosPorRestaurante = async (restauranteId: string) => {
        try {
            const { data } = await client.models.Plato.list({
                filter: { restauranteId: { eq: restauranteId } }
            });
            return { success: true, data };
        } catch (error) {
            console.error('Error obteniendo platos:', error);
            return { success: false, error };
        }
    };

    // pedidos
    const crearPedido = async (pedido: {
        usuario: string;
        restauranteId: string;
        total: number;
        estado?: 'pendiente' | 'preparando' | 'listo' | 'entregado';
        comentarios?: string;
        fechaPedido?: string;
    }) => {
        try {
            const { data } = await client.models.Pedido.create({
                ...pedido,
                fechaPedido: pedido.fechaPedido || new Date().toISOString(),
                estado: pedido.estado || 'pendiente'
            });
            return { success: true, data };
        } catch (error) {
            console.error('Error creando pedido:', error);
            return { success: false, error };
        }
    };

    const obtenerPedidosUsuario = async (usuario: string) => {
        try {
            const { data } = await client.models.Pedido.list({
                filter: { usuario: { eq: usuario } }
            });
            return { success: true, data };
        } catch (error) {
            console.error('Error obteniendo pedidos:', error);
            return { success: false, error };
        }
    };

    return {
        // Universidades
        crearUniversidad,
        obtenerUniversidades,

        // Restaurantes
        crearRestaurante,
        obtenerRestaurantesPorUniversidad,

        // Platos
        crearPlato,
        obtenerPlatosPorRestaurante,

        // Pedidos
        crearPedido,
        obtenerPedidosUsuario,

        // Cliente directo para operaciones avanzadas
        client,
    };
};