import type { Schema } from '@/amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';

// ✅ Cliente GraphQL tipado para producción
const client = generateClient<Schema>();

export const usePedidosMonitor = () => {
    const { user } = useAuth();
    const { sendLocalNotification } = useNotifications();
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [lastPedidos, setLastPedidos] = useState<any[]>([]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isActiveRef = useRef(false);

    // ✅ Función para cargar pedidos del usuario
    const cargarPedidosUsuario = async (userEmail: string) => {
        try {
            console.log('🔍 MONITOR - Cargando pedidos para:', userEmail);

            const { data: pedidosData, errors } = await client.models.Pedido.list({
                filter: {
                    usuarioEmail: { eq: userEmail }
                },
                limit: 100
            });

            if (errors && errors.length > 0) {
                console.error('❌ MONITOR - Error cargando pedidos:', errors);
                return [];
            }

            if (!pedidosData || pedidosData.length === 0) {
                console.log('ℹ️ MONITOR - No hay pedidos para el usuario');
                return [];
            }

            // Procesar pedidos
            const pedidosProcesados = pedidosData.map((pedido: any) => {
                let itemsProcesados = [];
                try {
                    if (typeof pedido.itemsPedido === 'string') {
                        itemsProcesados = JSON.parse(pedido.itemsPedido);
                    } else {
                        itemsProcesados = pedido.itemsPedido || [];
                    }
                } catch (parseError) {
                    console.error('❌ Error parseando itemsPedido:', parseError);
                    itemsProcesados = [];
                }

                return {
                    ...pedido,
                    itemsPedido: itemsProcesados
                };
            });

            // Ordenar por fecha más reciente
            return pedidosProcesados.sort((a: any, b: any) =>
                new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime()
            );

        } catch (error) {
            console.error('❌ MONITOR - Error inesperado:', error);
            return [];
        }
    };

    // ✅ Función para detectar cambios en pedidos
    const detectarCambiosPedidos = (pedidosActuales: any[], pedidosAnteriores: any[]) => {
        // Detectar nuevos pedidos
        const nuevosPedidos = pedidosActuales.filter(pedidoActual =>
            !pedidosAnteriores.some(pedidoAnterior => pedidoAnterior.id === pedidoActual.id)
        );

        // Detectar cambios de estado
        const cambiosEstado = pedidosActuales.filter(pedidoActual => {
            const pedidoAnterior = pedidosAnteriores.find(p => p.id === pedidoActual.id);
            return pedidoAnterior && pedidoAnterior.estado !== pedidoActual.estado;
        });

        return { nuevosPedidos, cambiosEstado };
    };

    // ✅ Función para enviar notificaciones SOLO de cambios de estado (NO nuevos pedidos)
    const enviarNotificacionCambio = (pedido: any, tipo: 'nuevo' | 'cambio_estado', estadoAnterior?: string) => {
        let titulo = '';
        let mensaje = '';

        // ✅ SOLO notificar cambios de estado, NO nuevos pedidos
        if (tipo === 'cambio_estado') {
            switch (pedido.estado) {
                case 'aceptado':
                    titulo = '✅ Pedido Aceptado';
                    mensaje = `Tu pedido #${pedido.numeroOrden} ha sido aceptado y está siendo preparado.`;
                    break;
                case 'preparando':
                    titulo = '👨‍🍳 Pedido en Preparación';
                    mensaje = `Tu pedido #${pedido.numeroOrden} está siendo preparado. ¡Pronto estará listo!`;
                    break;
                case 'listo':
                    titulo = '🎉 ¡Tu Pedido Está Listo!';
                    mensaje = `Tu pedido #${pedido.numeroOrden} está listo para recoger. ¡Ve al restaurante!`;
                    break;
                case 'entregado':
                    titulo = '📦 Pedido Entregado';
                    mensaje = `Tu pedido #${pedido.numeroOrden} ha sido entregado. ¡Disfruta tu comida!`;
                    break;
                case 'cancelado':
                    titulo = '❌ Pedido Cancelado';
                    mensaje = `Tu pedido #${pedido.numeroOrden} ha sido cancelado.`;
                    break;
                default:
                    // No notificar para otros estados
                    return;
            }
        } else {
            // No notificar para nuevos pedidos
            return;
        }

        if (titulo && mensaje) {
            try {
                sendLocalNotification(titulo, mensaje, {
                    type: 'order_update',
                    orderId: pedido.id,
                    orderNumber: pedido.numeroOrden,
                    newStatus: pedido.estado,
                    previousStatus: estadoAnterior,
                    restaurantId: pedido.restauranteId
                });

                console.log(`🔔 MONITOR - Notificación enviada: ${titulo} - ${mensaje}`);
            } catch (error) {
                console.error('❌ MONITOR - Error enviando notificación:', error);
            }
        }
    };

    // ✅ Función para iniciar monitoreo
    const iniciarMonitoreo = async () => {
        if (isActiveRef.current) {
            console.log('⚠️ MONITOR - Ya está activo');
            return;
        }

        try {
            const currentUser = await getCurrentUser();
            const userEmail = currentUser.signInDetails?.loginId || '';

            if (!userEmail) {
                console.error('❌ MONITOR - No se pudo obtener el email del usuario');
                return;
            }

            console.log('🚀 MONITOR - Iniciando monitoreo para:', userEmail);
            isActiveRef.current = true;
            setIsMonitoring(true);

            // Cargar pedidos iniciales
            const pedidosIniciales = await cargarPedidosUsuario(userEmail);
            setLastPedidos(pedidosIniciales);

            // Configurar intervalo de monitoreo (cada 30 segundos)
            intervalRef.current = setInterval(async () => {
                if (!isActiveRef.current) return;

                try {
                    const pedidosActuales = await cargarPedidosUsuario(userEmail);

                    if (pedidosActuales.length > 0) {
                        const { nuevosPedidos, cambiosEstado } = detectarCambiosPedidos(pedidosActuales, lastPedidos);

                        // ✅ SOLO enviar notificaciones para cambios de estado (NO nuevos pedidos)
                        cambiosEstado.forEach(pedido => {
                            const pedidoAnterior = lastPedidos.find(p => p.id === pedido.id);
                            enviarNotificacionCambio(pedido, 'cambio_estado', pedidoAnterior?.estado);
                        });

                        // Actualizar estado si hay cambios
                        if (nuevosPedidos.length > 0 || cambiosEstado.length > 0) {
                            setLastPedidos(pedidosActuales);
                            console.log(`🔄 MONITOR - Cambios detectados: ${nuevosPedidos.length} nuevos, ${cambiosEstado.length} cambios de estado`);
                        }
                    }
                } catch (error) {
                    console.error('❌ MONITOR - Error en ciclo de monitoreo:', error);
                }
            }, 30000); // 30 segundos

            console.log('✅ MONITOR - Monitoreo iniciado exitosamente');

        } catch (error) {
            console.error('❌ MONITOR - Error iniciando monitoreo:', error);
            isActiveRef.current = false;
            setIsMonitoring(false);
        }
    };

    // ✅ Función para detener monitoreo
    const detenerMonitoreo = () => {
        console.log('🛑 MONITOR - Deteniendo monitoreo');
        isActiveRef.current = false;
        setIsMonitoring(false);

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // ✅ Limpiar al desmontar
    useEffect(() => {
        return () => {
            detenerMonitoreo();
        };
    }, []);

    return {
        isMonitoring,
        iniciarMonitoreo,
        detenerMonitoreo,
        lastPedidos
    };
};
