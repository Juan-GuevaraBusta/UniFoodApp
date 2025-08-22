import type { Schema } from '@/amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';

// ✅ Cliente GraphQL tipado para producción
const client = generateClient<Schema>();

export const useBackgroundPedidosMonitor = () => {
    const { user } = useAuth();
    const { sendLocalNotification } = useNotifications();
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [lastPedidos, setLastPedidos] = useState<any[]>([]);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isActiveRef = useRef(false);
    const appState = useRef(AppState.currentState);

    // ✅ Función para cargar pedidos del usuario
    const cargarPedidosUsuario = async (userEmail: string) => {
        try {
            console.log('🔍 BACKGROUND MONITOR - Cargando pedidos para:', userEmail);

            const { data: pedidosData, errors } = await client.models.Pedido.list({
                filter: {
                    usuarioEmail: { eq: userEmail }
                },
                limit: 100
            });

            if (errors && errors.length > 0) {
                console.error('❌ BACKGROUND MONITOR - Error cargando pedidos:', errors);
                return [];
            }

            if (!pedidosData || pedidosData.length === 0) {
                console.log('ℹ️ BACKGROUND MONITOR - No hay pedidos para el usuario');
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
            console.error('❌ BACKGROUND MONITOR - Error inesperado:', error);
            return [];
        }
    };

    // ✅ Función para detectar cambios en pedidos
    const detectarCambiosPedidos = (pedidosActuales: any[], pedidosAnteriores: any[]) => {
        console.log('🔍 BACKGROUND MONITOR - Detectando cambios:', {
            pedidosActuales: pedidosActuales.length,
            pedidosAnteriores: pedidosAnteriores.length
        });

        // Detectar nuevos pedidos
        const nuevosPedidos = pedidosActuales.filter(pedidoActual =>
            !pedidosAnteriores.some(pedidoAnterior => pedidoAnterior.id === pedidoActual.id)
        );

        // Detectar cambios de estado
        const cambiosEstado = pedidosActuales.filter(pedidoActual => {
            const pedidoAnterior = pedidosAnteriores.find(p => p.id === pedidoActual.id);
            const hayCambio = pedidoAnterior && pedidoAnterior.estado !== pedidoActual.estado;

            if (hayCambio) {
                console.log('🔄 BACKGROUND MONITOR - Cambio detectado:', {
                    pedidoId: pedidoActual.id,
                    numeroOrden: pedidoActual.numeroOrden,
                    estadoAnterior: pedidoAnterior.estado,
                    estadoNuevo: pedidoActual.estado
                });
            }

            return hayCambio;
        });

        console.log('🔍 BACKGROUND MONITOR - Resultados de detección:', {
            nuevosPedidos: nuevosPedidos.length,
            cambiosEstado: cambiosEstado.length
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
                    console.log('⚠️ BACKGROUND MONITOR - Estado no manejado:', pedido.estado);
                    return;
            }
        } else {
            console.log('⚠️ BACKGROUND MONITOR - No notificando nuevo pedido');
            return;
        }

        if (titulo && mensaje) {
            try {
                console.log('🔔 BACKGROUND MONITOR - Enviando notificación:', { titulo, mensaje });

                sendLocalNotification(titulo, mensaje, {
                    type: 'order_update',
                    orderId: pedido.id,
                    orderNumber: pedido.numeroOrden,
                    newStatus: pedido.estado,
                    previousStatus: estadoAnterior,
                    restaurantId: pedido.restauranteId
                });

                console.log(`✅ BACKGROUND MONITOR - Notificación enviada exitosamente: ${titulo}`);
            } catch (error) {
                console.error('❌ BACKGROUND MONITOR - Error enviando notificación:', error);
            }
        }
    };

    // ✅ Función para manejar cambios en el estado de la aplicación
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
        console.log('📱 BACKGROUND MONITOR - Estado de app cambió:', appState.current, '->', nextAppState);

        if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
            // La aplicación se volvió activa
            console.log('📱 BACKGROUND MONITOR - App se volvió activa, iniciando monitoreo...');
            if (user?.email && !isActiveRef.current) {
                iniciarMonitoreo();
            }
        } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
            // La aplicación se volvió inactiva
            console.log('📱 BACKGROUND MONITOR - App se volvió inactiva, deteniendo monitoreo...');
            detenerMonitoreo();
        }

        appState.current = nextAppState;
    };

    // ✅ Función para iniciar monitoreo
    const iniciarMonitoreo = async () => {
        if (isActiveRef.current) {
            console.log('⚠️ BACKGROUND MONITOR - Ya está activo');
            return;
        }

        try {
            const currentUser = await getCurrentUser();
            const userEmail = currentUser.signInDetails?.loginId || '';

            if (!userEmail) {
                console.error('❌ BACKGROUND MONITOR - No se pudo obtener el email del usuario');
                return;
            }

            console.log('🚀 BACKGROUND MONITOR - Iniciando monitoreo para:', userEmail);
            isActiveRef.current = true;
            setIsMonitoring(true);

            // Cargar pedidos iniciales
            const pedidosIniciales = await cargarPedidosUsuario(userEmail);
            setLastPedidos(pedidosIniciales);

            console.log('📋 BACKGROUND MONITOR - Pedidos iniciales cargados:', pedidosIniciales.length);

            // Configurar intervalo de monitoreo (cada 30 segundos para ser más responsivo)
            intervalRef.current = setInterval(async () => {
                if (!isActiveRef.current) {
                    console.log('⚠️ BACKGROUND MONITOR - Monitoreo no activo, saltando ciclo');
                    return;
                }

                try {
                    console.log('🔄 BACKGROUND MONITOR - Ejecutando ciclo de monitoreo...');
                    const pedidosActuales = await cargarPedidosUsuario(userEmail);

                    if (pedidosActuales.length > 0) {
                        const { nuevosPedidos, cambiosEstado } = detectarCambiosPedidos(pedidosActuales, lastPedidos);

                        console.log('🔍 BACKGROUND MONITOR - Ciclo de monitoreo:', {
                            pedidosActuales: pedidosActuales.length,
                            nuevosPedidos: nuevosPedidos.length,
                            cambiosEstado: cambiosEstado.length,
                            isActive: isActiveRef.current
                        });

                        // ✅ SOLO enviar notificaciones para cambios de estado (NO nuevos pedidos)
                        cambiosEstado.forEach(pedido => {
                            const pedidoAnterior = lastPedidos.find(p => p.id === pedido.id);
                            console.log('🔔 BACKGROUND MONITOR - Enviando notificación para cambio de estado:', {
                                pedidoId: pedido.id,
                                numeroOrden: pedido.numeroOrden,
                                estadoAnterior: pedidoAnterior?.estado,
                                estadoNuevo: pedido.estado
                            });
                            enviarNotificacionCambio(pedido, 'cambio_estado', pedidoAnterior?.estado);
                        });

                        // Actualizar estado si hay cambios
                        if (nuevosPedidos.length > 0 || cambiosEstado.length > 0) {
                            setLastPedidos(pedidosActuales);
                            console.log(`🔄 BACKGROUND MONITOR - Cambios detectados: ${nuevosPedidos.length} nuevos, ${cambiosEstado.length} cambios de estado`);
                        }
                    } else {
                        console.log('🔍 BACKGROUND MONITOR - No hay pedidos para monitorear');
                    }
                } catch (error) {
                    console.error('❌ BACKGROUND MONITOR - Error en ciclo de monitoreo:', error);
                }
            }, 30000); // 30 segundos (más responsivo)

            console.log('✅ BACKGROUND MONITOR - Monitoreo iniciado exitosamente');

        } catch (error) {
            console.error('❌ BACKGROUND MONITOR - Error iniciando monitoreo:', error);
            isActiveRef.current = false;
            setIsMonitoring(false);
        }
    };

    // ✅ Función para detener monitoreo
    const detenerMonitoreo = () => {
        console.log('🛑 BACKGROUND MONITOR - Deteniendo monitoreo');
        isActiveRef.current = false;
        setIsMonitoring(false);

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    // ✅ Configurar listener de estado de la aplicación
    useEffect(() => {
        console.log('🔍 BACKGROUND MONITOR - Configurando listener, usuario:', user?.email);

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        // Iniciar monitoreo si la app está activa y hay usuario
        if (user?.email && AppState.currentState === 'active') {
            console.log('📱 BACKGROUND MONITOR - App activa, iniciando monitoreo inicial...');
            iniciarMonitoreo();
        } else {
            console.log('📱 BACKGROUND MONITOR - No se puede iniciar monitoreo:', {
                hasUser: !!user?.email,
                appState: AppState.currentState
            });
        }

        return () => {
            console.log('🔍 BACKGROUND MONITOR - Limpiando listener');
            subscription?.remove();
            detenerMonitoreo();
        };
    }, [user?.email]);

    return {
        isMonitoring,
        iniciarMonitoreo,
        detenerMonitoreo,
        lastPedidos
    };
};
