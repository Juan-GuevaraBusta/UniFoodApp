// hooks/useAmplifyData.ts - Sistema mejorado de pedidos
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getRestaurantEmailByIds, canReceiveOrders } from '@/constants/userRoles';

export const useAmplifyData = () => {
    const { user } = useAuth();

    // Crear pedido vinculado al restaurante específico
    const crearPedido = async (carritoItems: any[], total: number) => {
        try {
            console.log('📝 Creando pedido...');
            console.log('🛒 Items del carrito:', carritoItems);

            if (!carritoItems || carritoItems.length === 0) {
                return {
                    success: false,
                    error: 'El carrito está vacío'
                };
            }

            // Obtener información del primer item (todos deberían ser del mismo restaurante)
            const primerItem = carritoItems[0];
            const universidadId = primerItem.universidadId || 1; // Fallback a ICESI
            const restauranteId = primerItem.idRestaurante;
            const nombreRestaurante = primerItem.nombreRestaurante;
            const nombreUniversidad = primerItem.nombreUniversidad;

            console.log('🏪 Información del restaurante:', {
                universidadId,
                restauranteId,
                nombreRestaurante,
                nombreUniversidad
            });

            // Obtener email del restaurante específico
            const restaurantEmail = getRestaurantEmailByIds(universidadId, restauranteId);

            if (!restaurantEmail) {
                console.error('❌ No se encontró email para el restaurante:', {
                    universidadId,
                    restauranteId
                });
                return {
                    success: false,
                    error: `No se encontró email para el restaurante ${nombreRestaurante} en ${nombreUniversidad}`
                };
            }

            console.log('📧 Email del restaurante destinatario:', restaurantEmail);

            // Generar número de orden único
            const numeroOrden = generateOrderNumber();

            // Preparar datos del pedido
            const pedidoData = {
                numeroOrden,
                usuarioEmail: user?.email || 'usuario-anonimo@unifood.com',
                restauranteId: restauranteId.toString(),
                restaurantEmail, // Email específico del restaurante
                universidadId,
                nombreRestaurante,
                nombreUniversidad,
                total,
                estado: 'pendiente' as const,
                fechaPedido: new Date().toISOString(),
                itemsPedido: carritoItems.map(item => ({
                    platoId: item.plato.idPlato,
                    platoNombre: item.plato.nombre,
                    platoDescripcion: item.plato.descripcion,
                    precioUnitario: item.plato.precio,
                    cantidad: item.cantidad,
                    comentarios: item.comentarios,
                    toppingsSeleccionados: item.toppingsSeleccionados,
                    toppingsBaseRemocionados: item.toppingsBaseRemocionados,
                    precioTotal: item.precioTotal,
                    totalItem: item.precioTotal * item.cantidad,
                    idUnico: item.idUnico
                })),
                comentarios: carritoItems
                    .filter(item => item.comentarios && item.comentarios.trim() !== '')
                    .map(item => `${item.plato.nombre}: ${item.comentarios}`)
                    .join('; ') || null
            };

            console.log('📋 Datos del pedido preparados:', pedidoData);

            // En un entorno real, aquí enviarías el pedido a Amplify/GraphQL
            // Por ahora, simularemos el proceso
            await simulateOrderCreation(pedidoData);

            console.log('✅ Pedido creado exitosamente');
            console.log(`📧 Notificación enviada a: ${restaurantEmail}`);
            console.log(`🏪 Restaurante: ${nombreRestaurante} (ID: ${restauranteId})`);
            console.log(`🏫 Universidad: ${nombreUniversidad} (ID: ${universidadId})`);

            return {
                success: true,
                numeroOrden,
                restaurantEmail,
                restauranteInfo: {
                    id: restauranteId,
                    nombre: nombreRestaurante,
                    universidad: nombreUniversidad,
                    universidadId,
                    email: restaurantEmail
                },
                message: `Pedido enviado a ${nombreRestaurante}`
            };

        } catch (error) {
            console.error('❌ Error creando pedido:', error);
            return {
                success: false,
                error: 'Error interno al procesar el pedido'
            };
        }
    };

    // Verificar si un usuario puede recibir pedidos para un restaurante específico
    const puedeRecibirPedidos = (universidadId: number, restauranteId: number): boolean => {
        if (!user || !user.email) {
            return false;
        }

        return canReceiveOrders(user.email, universidadId, restauranteId);
    };

    // Obtener pedidos para el restaurante actual (si es dueño de restaurante)
    const obtenerPedidosRestaurante = async () => {
        if (!user?.restaurantInfo) {
            return {
                success: false,
                error: 'No eres dueño de un restaurante'
            };
        }

        try {
            console.log('📋 Obteniendo pedidos para restaurante:', {
                nombre: user.restaurantInfo.nombreRestaurante,
                universidadId: user.restaurantInfo.universidadId,
                restauranteId: user.restaurantInfo.restauranteId
            });

            // En un entorno real, aquí harías una query a GraphQL
            const pedidos = await simulateGetRestaurantOrders(
                user.restaurantInfo.universidadId,
                user.restaurantInfo.restauranteId
            );

            return {
                success: true,
                pedidos,
                restaurantInfo: user.restaurantInfo
            };

        } catch (error) {
            console.error('❌ Error obteniendo pedidos:', error);
            return {
                success: false,
                error: 'Error obteniendo pedidos del restaurante'
            };
        }
    };

    return {
        crearPedido,
        puedeRecibirPedidos,
        obtenerPedidosRestaurante,
        user,
    };
};

// Función auxiliar para generar número de orden
function generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `UF${timestamp.toString().slice(-6)}${random}`;
}

// Simulación de creación de pedido (reemplazar con GraphQL real)
async function simulateOrderCreation(pedidoData: any): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log('🔄 Simulando creación en base de datos...');
            console.log('📧 Simulando notificación por email...');
            console.log('✅ Pedido guardado en sistema');
            resolve();
        }, 1500);
    });
}

// Simulación de obtener pedidos del restaurante (reemplazar con GraphQL real)
async function simulateGetRestaurantOrders(universidadId: number, restauranteId: number): Promise<any[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Pedidos simulados
            const pedidosSimulados = [
                {
                    id: '1',
                    numeroOrden: 'UF123456001',
                    usuarioEmail: 'estudiante@ejemplo.com',
                    total: 25000,
                    estado: 'pendiente',
                    fechaPedido: new Date().toISOString(),
                    itemsPedido: [
                        {
                            platoNombre: 'Hamburguesa Clásica',
                            cantidad: 1,
                            totalItem: 15000
                        },
                        {
                            platoNombre: 'Papas Fritas',
                            cantidad: 1,
                            totalItem: 8000
                        }
                    ]
                }
            ];
            resolve(pedidosSimulados);
        }, 1000);
    });
}