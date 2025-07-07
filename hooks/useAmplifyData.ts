// hooks/useAmplifyData.ts - Versión simplificada
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../amplify/data/resource';
import { PlatoCarrito } from '@/context/contextCarrito';

// Generar el cliente tipado
const client = generateClient<Schema>();

export const useAmplifyData = () => {

    // Función helper para obtener el usuario actual
    const obtenerUsuarioActual = async () => {
        try {
            const user = await getCurrentUser();
            return {
                userId: user.userId,
                email: user.signInDetails?.loginId || '',
            };
        } catch (error) {
            console.warn('No hay usuario autenticado');
            return null;
        }
    };

    // =============== PEDIDOS ===============
    const crearPedido = async (carritoItems: PlatoCarrito[], total: number) => {
        try {
            const usuario = await obtenerUsuarioActual();
            if (!usuario) {
                return { success: false, error: 'Usuario no autenticado' };
            }

            if (carritoItems.length === 0) {
                return { success: false, error: 'El carrito está vacío' };
            }

            // Obtener información del primer item para el restaurante
            const primerItem = carritoItems[0];
            const restauranteId = primerItem.idRestaurante.toString();

            // Generar número de orden único
            const numeroOrden = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

            // Preparar items del pedido para guardar en JSON
            const itemsPedido = carritoItems.map(item => ({
                platoId: item.plato.idPlato,
                platoNombre: item.plato.nombre,
                platoDescripcion: item.plato.descripcion,
                precioUnitario: item.plato.precio,
                cantidad: item.cantidad,
                comentarios: item.comentarios,
                toppingsSeleccionados: item.toppingsSeleccionados.map(t => ({
                    id: t.id,
                    nombre: t.nombre,
                    precio: t.precio || 0
                })),
                toppingsBaseRemocionados: item.toppingsBaseRemocionados,
                precioTotal: item.precioTotal,
                totalItem: item.precioTotal * item.cantidad,
                idUnico: item.idUnico
            }));

            // Crear el pedido
            const { data: pedido, errors } = await client.models.Pedido.create({
                usuarioEmail: usuario.email,
                restauranteId,
                total,
                estado: 'pendiente',
                fechaPedido: new Date().toISOString(),
                numeroOrden,
                itemsPedido,
                comentarios: carritoItems.map(item => item.comentarios).filter(Boolean).join('; ') || undefined,
            });

            if (errors) {
                console.error('Errores creando pedido:', errors);
                return { success: false, errors };
            }

            console.log('✅ Pedido creado exitosamente:', pedido);

            return {
                success: true,
                data: pedido,
                numeroOrden
            };

        } catch (error) {
            console.error('❌ Error creando pedido:', error);
            return { success: false, error: 'Error interno del servidor' };
        }
    };

    const obtenerPedidosUsuario = async (limite = 20) => {
        try {
            const usuario = await obtenerUsuarioActual();
            if (!usuario) {
                return { success: false, error: 'Usuario no autenticado' };
            }

            const { data, errors } = await client.models.Pedido.list({
                filter: { usuarioEmail: { eq: usuario.email } },
                limit: limite,
            });

            if (errors) {
                console.error('Errores obteniendo pedidos:', errors);
                return { success: false, errors };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error obteniendo pedidos:', error);
            return { success: false, error };
        }
    };

    const actualizarEstadoPedido = async (
        pedidoId: string,
        nuevoEstado: 'pendiente' | 'preparando' | 'listo' | 'entregado' | 'cancelado'
    ) => {
        try {
            const { data, errors } = await client.models.Pedido.update({
                id: pedidoId,
                estado: nuevoEstado,
            });

            if (errors) {
                console.error('Errores actualizando pedido:', errors);
                return { success: false, errors };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error actualizando estado del pedido:', error);
            return { success: false, error };
        }
    };

    // =============== DATOS BÁSICOS (SOLO LECTURA) ===============
    const obtenerUniversidades = async () => {
        try {
            const { data, errors } = await client.models.Universidad.list();

            if (errors) {
                console.error('Errores obteniendo universidades:', errors);
                return { success: false, errors };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error obteniendo universidades:', error);
            return { success: false, error };
        }
    };

    const obtenerRestaurantesPorUniversidad = async (universidadId: string) => {
        try {
            const { data, errors } = await client.models.Restaurante.list({
                filter: { universidadId: { eq: universidadId } },
            });

            if (errors) {
                console.error('Errores obteniendo restaurantes:', errors);
                return { success: false, errors };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error obteniendo restaurantes:', error);
            return { success: false, error };
        }
    };

    const obtenerPlatosPorRestaurante = async (restauranteId: string) => {
        try {
            const { data, errors } = await client.models.Plato.list({
                filter: { restauranteId: { eq: restauranteId } },
            });

            if (errors) {
                console.error('Errores obteniendo platos:', errors);
                return { success: false, errors };
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error obteniendo platos:', error);
            return { success: false, error };
        }
    };

    return {
        // Funciones principales
        crearPedido,
        obtenerPedidosUsuario,
        actualizarEstadoPedido,

        // Funciones de consulta
        obtenerUniversidades,
        obtenerRestaurantesPorUniversidad,
        obtenerPlatosPorRestaurante,

        // Utilidades
        obtenerUsuarioActual,

        // Cliente directo para operaciones avanzadas
        client,
    };
};