import type { Schema } from '@/amplify/data/resource';
import { getRestaurantInfoByEmail } from '@/constants/userRoles';
import { useAuth } from "@/hooks/useAuth";
import { useFocusEffect } from '@react-navigation/native';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { router } from "expo-router";
import { CheckCircle, ClipboardList, Clock, Home, RefreshCw } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ✅ Cliente GraphQL tipado para producción
const client = generateClient<Schema>();

const PedidosRestaurante = () => {
    const { user } = useAuth();

    const [pedidos, setPedidos] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updatingPedido, setUpdatingPedido] = useState<string | null>(null);

    // ✅ Cargar pedidos al enfocar la pantalla
    useFocusEffect(
        useCallback(() => {
            console.log('📱 RESTAURANTE - Pantalla pedidos enfocada, cargando pedidos...');
            cargarPedidosDelRestaurante();
        }, [])
    );

    // ✅ FUNCIÓN ACTUALIZADA: Cargar solo los pedidos del restaurante del usuario
    const cargarPedidosDelRestaurante = async () => {
        try {
            console.log('📱 RESTAURANTE - Cargando pedidos del restaurante...');

            // ✅ PASO 1: Verificar autenticación básica
            let session;
            try {
                session = await fetchAuthSession();
                if (!session.tokens?.accessToken) {
                    throw new Error('No access token available');
                }
                console.log('✅ RESTAURANTE - Autenticación verificada');
            } catch (authError) {
                console.error('❌ RESTAURANTE - Error de autenticación:', authError);
                Alert.alert('Error de sesión', 'Por favor inicia sesión nuevamente.');
                setLoading(false);
                return;
            }

            // ✅ PASO 2: Obtener email del usuario usando getCurrentUser
            let userEmail = '';
            try {
                const currentUser = await getCurrentUser();
                userEmail = currentUser.signInDetails?.loginId || '';
                console.log('🔍 RESTAURANTE - Email obtenido de getCurrentUser:', userEmail);
            } catch (userError) {
                console.error('❌ RESTAURANTE - Error obteniendo usuario actual:', userError);
                // Intentar obtener desde el hook useAuth como respaldo
                userEmail = user?.email || '';
                console.log('🔍 RESTAURANTE - Email obtenido de useAuth como respaldo:', userEmail);
            }

            if (!userEmail) {
                console.error('❌ RESTAURANTE - No se pudo obtener el email del usuario');
                Alert.alert('Error', 'No se pudo identificar tu cuenta.');
                setLoading(false);
                return;
            }

            // ✅ PASO 3: Obtener información del restaurante desde las constantes
            const restaurantInfo = getRestaurantInfoByEmail(userEmail);

            if (!restaurantInfo) {
                console.error('❌ RESTAURANTE - Usuario no tiene información de restaurante:', userEmail);
                Alert.alert('Error', 'No tienes permisos para ver pedidos de restaurante.');
                setLoading(false);
                return;
            }

            const { universidadId, restauranteId, nombreRestaurante } = restaurantInfo;
            console.log('🔍 RESTAURANTE - Filtrando por:', {
                universidadId,
                restauranteId,
                nombreRestaurante,
                userEmail
            });

            // ✅ PASO 4: Consultar pedidos filtrados por restaurante
            console.log('🔗 RESTAURANTE - Consultando AppSync con filtros...');

            const { data: pedidosData, errors } = await client.models.Pedido.list({
                filter: {
                    and: [
                        { universidadId: { eq: universidadId } },
                        { restauranteId: { eq: String(restauranteId) } }
                    ]
                },
                limit: 100
            });

            // ✅ LOGS DE DEBUGGING COMPLETOS
            console.log('🔍 === DEBUGGING COMPLETO ===');
            console.log('🔍 Errores GraphQL:', errors);
            console.log('🔍 Datos recibidos:', pedidosData);
            console.log('🔍 Cantidad de pedidos del restaurante:', pedidosData?.length || 0);
            console.log('🔍 Usuario actual:', userEmail);
            console.log('🔍 Restaurante del usuario:', restaurantInfo);

            if (errors && errors.length > 0) {
                console.error('❌ RESTAURANTE - Errores GraphQL:', errors);
                Alert.alert('Error', 'No se pudieron cargar los pedidos: ' + errors[0].message);
                setLoading(false);
                return;
            }

            if (!pedidosData || pedidosData.length === 0) {
                console.log('⚠️ RESTAURANTE - No hay pedidos para este restaurante');
                setPedidos([]);
                setLoading(false);
                return;
            }

            // ✅ LOGS DETALLADOS de cada pedido
            console.log('🔍 === DETALLES DE CADA PEDIDO ===');
            pedidosData.forEach((pedido, index) => {
                console.log(`🔍 Pedido ${index + 1}:`);
                console.log(`   - ID: ${pedido.id}`);
                console.log(`   - numeroOrden: ${pedido.numeroOrden}`);
                console.log(`   - restauranteId: ${pedido.restauranteId}`);
                console.log(`   - universidadId: ${pedido.universidadId}`);
                console.log(`   - usuarioEmail: ${pedido.usuarioEmail}`);
                console.log(`   - estado: ${pedido.estado}`);
                console.log(`   - total: ${pedido.total}`);
                console.log(`   - fechaPedido: ${pedido.fechaPedido}`);
                console.log(`   - itemsPedido tipo: ${typeof pedido.itemsPedido}`);
                console.log(`   ---`);
            });

            // ✅ PASO 5: Procesar pedidos - PARSEAR itemsPedido
            const pedidosProcesados = pedidosData.map((pedido: any) => {
                let itemsProcesados = [];

                try {
                    if (typeof pedido.itemsPedido === 'string') {
                        itemsProcesados = JSON.parse(pedido.itemsPedido);
                    } else {
                        itemsProcesados = pedido.itemsPedido || [];
                    }
                } catch (parseError) {
                    console.error('❌ Error parseando itemsPedido para pedido:', pedido.id, parseError);
                    itemsProcesados = [];
                }

                return {
                    ...pedido,
                    itemsPedido: itemsProcesados
                };
            });

            // ✅ PASO 6: Ordenar por fecha más reciente
            const pedidosOrdenados = pedidosProcesados.sort((a: any, b: any) =>
                new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime()
            );

            console.log('✅ RESTAURANTE - Pedidos procesados exitosamente:', {
                totalPedidos: pedidosOrdenados.length,
                pedidosConItems: pedidosOrdenados.filter(p => p.itemsPedido && p.itemsPedido.length > 0).length,
                restaurante: nombreRestaurante
            });

            setPedidos(pedidosOrdenados);

        } catch (error: any) {
            console.error('❌ RESTAURANTE - Error inesperado:', error);
            Alert.alert('Error', 'Ocurrió un error inesperado: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Pull to refresh
    const onRefresh = useCallback(async () => {
        console.log('🔄 RESTAURANTE - Refrescando pedidos...');
        setRefreshing(true);
        await cargarPedidosDelRestaurante();
        setRefreshing(false);
    }, []);

    // ✅ Funciones auxiliares
    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'aceptado': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'preparando': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'listo': return 'bg-green-100 text-green-800 border-green-200';
            case 'entregado': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'pendiente': return <Clock size={16} color="#D97706" />;
            case 'aceptado':
            case 'preparando': return <ClipboardList size={16} color="#EA580C" />;
            case 'listo': return <CheckCircle size={16} color="#059669" />;
            default: return <Clock size={16} color="#6B7280" />;
        }
    };

    const formatearPrecio = (precio: number) => {
        return `$${precio.toLocaleString('es-CO')}`;
    };

    const formatearFecha = (fechaISO: string) => {
        const fecha = new Date(fechaISO);
        return fecha.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ✅ FUNCIÓN PARA ACTUALIZAR ESTADO DEL PEDIDO
    const actualizarEstadoPedido = async (pedidoId: string, nuevoEstado: string) => {
        try {
            setUpdatingPedido(pedidoId);
            console.log(`🔄 RESTAURANTE - Actualizando pedido ${pedidoId} a estado: ${nuevoEstado}`);

            // Preparar datos de actualización
            const updateData: any = {
                id: pedidoId,
                estado: nuevoEstado
            };

            // Agregar fechas según el estado
            const now = new Date().toISOString();
            switch (nuevoEstado) {
                case 'aceptado':
                    updateData.fechaAceptado = now;
                    break;
                case 'listo':
                    updateData.fechaListo = now;
                    break;
                case 'entregado':
                    updateData.fechaEntregado = now;
                    break;
            }

            // Actualizar en la base de datos
            const { data: pedidoActualizado, errors } = await client.models.Pedido.update(updateData);

            if (errors && errors.length > 0) {
                console.error('❌ RESTAURANTE - Error actualizando pedido:', errors);
                Alert.alert('Error', 'No se pudo actualizar el pedido: ' + errors[0].message);
                return false;
            }

            console.log('✅ RESTAURANTE - Pedido actualizado exitosamente:', pedidoActualizado);

            // Mostrar mensaje de confirmación
            const mensajes = {
                'aceptado': 'Pedido aceptado exitosamente',
                'preparando': 'Pedido en preparación',
                'listo': 'Pedido listo para entrega',
                'entregado': 'Pedido entregado y completado'
            };

            Alert.alert(
                '✅ Éxito',
                mensajes[nuevoEstado as keyof typeof mensajes] || 'Estado actualizado',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Recargar la lista de pedidos
                            cargarPedidosDelRestaurante();
                        }
                    }
                ]
            );

            return true;

        } catch (error: any) {
            console.error('❌ RESTAURANTE - Error actualizando pedido:', error);
            Alert.alert('Error', 'Ocurrió un error al actualizar el pedido: ' + error.message);
            return false;
        } finally {
            setUpdatingPedido(null);
        }
    };

    // ✅ FUNCIÓN PARA ACEPTAR PEDIDO (ACTUALIZADA)
    const aceptarPedido = async (pedidoId: string) => {
        Alert.alert(
            'Aceptar Pedido',
            '¿Confirmas que aceptas este pedido y comienzas su preparación?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Aceptar y Preparar',
                    onPress: () => actualizarEstadoPedido(pedidoId, 'preparando')
                }
            ]
        );
    };

    // ✅ FUNCIÓN PARA RECHAZAR PEDIDO
    const rechazarPedido = async (pedidoId: string) => {
        Alert.alert(
            'Rechazar Pedido',
            '¿Confirmas que rechazas este pedido?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Rechazar',
                    style: 'destructive',
                    onPress: () => actualizarEstadoPedido(pedidoId, 'cancelado')
                }
            ]
        );
    };

    // ✅ FUNCIÓN PARA MARCAR COMO LISTO
    const marcarListo = async (pedidoId: string) => {
        actualizarEstadoPedido(pedidoId, 'listo');
    };

    // ✅ FUNCIÓN PARA MARCAR COMO ENTREGADO
    const entregarPedido = async (pedidoId: string) => {
        Alert.alert(
            'Entregar Pedido',
            '¿Confirmas que el pedido ha sido entregado al cliente?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Entregar',
                    onPress: () => actualizarEstadoPedido(pedidoId, 'entregado')
                }
            ]
        );
    };

    // ✅ FUNCIÓN PARA RENDERIZAR BOTONES SEGÚN ESTADO (ACTUALIZADA)
    const renderBotonesAccion = (pedido: any) => {
        const isUpdating = updatingPedido === pedido.id;

        switch (pedido.estado) {
            case 'pendiente':
                return (
                    <View className="flex-row space-x-3 mt-4">
                        <TouchableOpacity
                            onPress={() => aceptarPedido(pedido.id)}
                            disabled={isUpdating}
                            className={`flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center ${isUpdating ? 'bg-gray-300' : 'bg-green-500'}`}
                        >
                            <CheckCircle size={18} color="white" />
                            <Text className="text-white font-JakartaBold text-sm ml-2">
                                {isUpdating ? 'Procesando...' : 'Aceptar'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => rechazarPedido(pedido.id)}
                            disabled={isUpdating}
                            className={`flex-1 py-3 px-4 rounded-xl flex-row items-center justify-center ${isUpdating ? 'bg-gray-300' : 'bg-red-500'}`}
                        >
                            <ClipboardList size={18} color="white" />
                            <Text className="text-white font-JakartaBold text-sm ml-2">
                                {isUpdating ? 'Procesando...' : 'Rechazar'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'preparando':
                return (
                    <TouchableOpacity
                        onPress={() => marcarListo(pedido.id)}
                        disabled={isUpdating}
                        className={`mt-4 py-3 px-4 rounded-xl flex-row items-center justify-center ${isUpdating ? 'bg-gray-300' : 'bg-green-500'}`}
                    >
                        <CheckCircle size={18} color="white" />
                        <Text className="text-white font-JakartaBold text-sm ml-2">
                            {isUpdating ? 'Procesando...' : 'Pedido Listo'}
                        </Text>
                    </TouchableOpacity>
                );

            case 'listo':
                return (
                    <TouchableOpacity
                        onPress={() => entregarPedido(pedido.id)}
                        disabled={isUpdating}
                        className={`mt-4 py-3 px-4 rounded-xl flex-row items-center justify-center ${isUpdating ? 'bg-gray-300' : 'bg-blue-500'}`}
                    >
                        <CheckCircle size={18} color="white" />
                        <Text className="text-white font-JakartaBold text-sm ml-2">
                            {isUpdating ? 'Procesando...' : 'Confirmar Entrega'}
                        </Text>
                    </TouchableOpacity>
                );

            default:
                return null;
        }
    };

    // ✅ Obtener información del restaurante para mostrar en el header
    const getRestaurantInfo = () => {
        const userEmail = user?.email;
        if (!userEmail) return null;
        return getRestaurantInfoByEmail(userEmail);
    };

    const restaurantInfo = getRestaurantInfo();

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header actualizado */}
            <View className="px-5 py-6 border-b border-gray-200">
                <View className="flex-row items-center justify-between mb-4">
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/(tabs)/home")}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                        <Home size={20} color="#132e3c" />
                    </TouchableOpacity>
                    <View className="flex-1 items-center">
                        <Text className="text-[#132e3c] text-xl font-JakartaBold">Mis Pedidos</Text>
                        <Text className="text-gray-600 text-sm font-JakartaMedium">
                            {restaurantInfo?.nombreRestaurante || 'Restaurante'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={onRefresh}
                        className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"
                    >
                        <RefreshCw size={20} color="#3B82F6" />
                    </TouchableOpacity>
                </View>

                {/* Contador actualizado */}
                <View className="bg-blue-50 rounded-xl p-4">
                    <Text className="text-blue-800 font-JakartaBold text-lg text-center">
                        📋 Pedidos de mi restaurante: {pedidos.length}
                    </Text>
                    {restaurantInfo && (
                        <Text className="text-blue-600 font-JakartaMedium text-sm text-center mt-1">
                            {restaurantInfo.nombreRestaurante} - {restaurantInfo.nombreUniversidad}
                        </Text>
                    )}
                </View>
            </View>

            {/* Lista de pedidos */}
            <ScrollView
                className="flex-1 px-5 py-6"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading ? (
                    <View className="flex-1 items-center justify-center py-20">
                        <Text className="text-[#132e3c] text-lg font-JakartaBold">
                            Cargando pedidos de tu restaurante...
                        </Text>
                        <Text className="text-gray-600 text-sm font-JakartaMedium mt-2">
                            Consultando base de datos...
                        </Text>
                    </View>
                ) : pedidos.length > 0 ? (
                    <>
                        {pedidos.map((pedido, index) => (
                            <View
                                key={pedido.id}
                                className="bg-white rounded-xl border border-gray-200 p-4 mb-4"
                                style={{
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 3,
                                    elevation: 3,
                                }}
                            >
                                {/* Header del pedido */}
                                <View className="flex-row items-center justify-between mb-3">
                                    <View>
                                        <Text className="text-[#132e3c] font-JakartaBold text-lg">
                                            #{index + 1} - {pedido.numeroOrden || 'Sin número'}
                                        </Text>
                                        <Text className="text-gray-500 font-JakartaMedium text-sm">
                                            {formatearFecha(pedido.fechaPedido)}
                                        </Text>
                                        <Text className="text-blue-600 font-JakartaMedium text-xs">
                                            ID: {pedido.id}
                                        </Text>
                                    </View>
                                    <View className={`px-3 py-1 rounded-full border flex-row items-center ${getEstadoColor(pedido.estado)}`}>
                                        {getEstadoIcon(pedido.estado)}
                                        <Text className="font-JakartaBold text-xs ml-1 capitalize">
                                            {pedido.estado}
                                        </Text>
                                    </View>
                                </View>

                                {/* Información básica */}
                                <View className="mb-3 bg-gray-50 rounded-lg p-3">
                                    <Text className="text-gray-600 font-JakartaMedium text-sm">
                                        👤 Cliente: <Text className="font-JakartaBold">{pedido.usuarioEmail}</Text>
                                    </Text>
                                    <Text className="text-gray-600 font-JakartaMedium text-sm">
                                        💰 Total: <Text className="font-JakartaBold">{formatearPrecio(pedido.total)}</Text>
                                    </Text>
                                </View>

                                {/* Items del pedido */}
                                <View className="mb-3">
                                    <Text className="text-[#132e3c] font-JakartaBold text-sm mb-2">
                                        📋 Productos ({pedido.itemsPedido?.length || 0}):
                                    </Text>

                                    {pedido.itemsPedido && Array.isArray(pedido.itemsPedido) && pedido.itemsPedido.length > 0 ? (
                                        pedido.itemsPedido.map((item: any, itemIndex: number) => (
                                            <View key={itemIndex} className="bg-blue-50 rounded-lg p-2 mb-2">
                                                <View className="flex-row justify-between items-center">
                                                    <Text className="text-blue-800 font-JakartaMedium text-sm flex-1">
                                                        {item.cantidad}x {item.platoNombre}
                                                    </Text>
                                                    <Text className="text-blue-800 font-JakartaBold text-sm">
                                                        {formatearPrecio(item.totalItem || 0)}
                                                    </Text>
                                                </View>

                                                {/* Toppings si existen */}
                                                {item.toppingsSeleccionados && item.toppingsSeleccionados.length > 0 && (
                                                    <Text className="text-green-600 font-JakartaMedium text-xs mt-1">
                                                        + {item.toppingsSeleccionados.map((t: any) => t.nombre).join(', ')}
                                                    </Text>
                                                )}

                                                {/* Comentarios si existen */}
                                                {item.comentarios && (
                                                    <Text className="text-purple-600 font-JakartaMedium text-xs italic mt-1">
                                                        💬 "{item.comentarios}"
                                                    </Text>
                                                )}
                                            </View>
                                        ))
                                    ) : (
                                        <View className="bg-red-50 rounded-lg p-3">
                                            <Text className="text-red-600 font-JakartaMedium text-sm">
                                                ❌ No se pudieron cargar los items del pedido
                                            </Text>
                                            <Text className="text-red-500 font-JakartaMedium text-xs mt-1">
                                                Tipo de datos: {typeof pedido.itemsPedido}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Comentarios del cliente si existen */}
                                {pedido.comentariosCliente && (
                                    <View className="mb-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <Text className="text-yellow-800 font-JakartaBold text-sm mb-1">
                                            💬 Comentarios del cliente:
                                        </Text>
                                        <Text className="text-yellow-700 font-JakartaMedium text-sm italic">
                                            "{pedido.comentariosCliente}"
                                        </Text>
                                    </View>
                                )}

                                {/* Botones de acción según el estado */}
                                {renderBotonesAccion(pedido)}

                                {/* Información de debug */}
                                {__DEV__ && (
                                    <View className="mt-3 p-2 bg-gray-100 rounded-lg">
                                        <Text className="text-gray-600 font-JakartaBold text-xs mb-1">
                                            🔧 DEBUG INFO:
                                        </Text>
                                        <Text className="text-gray-500 font-JakartaMedium text-xs">
                                            Estado completo: {pedido.restauranteEstado || 'No definido'}
                                        </Text>
                                        <Text className="text-gray-500 font-JakartaMedium text-xs">
                                            Subtotal: {formatearPrecio(pedido.subtotal || 0)} | Servicio: {formatearPrecio(pedido.tarifaServicio || 0)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        ))}

                        {/* Información del sistema */}
                        <View className="bg-green-50 rounded-xl p-4 mt-4">
                            <Text className="text-green-800 font-JakartaBold text-sm mb-2">
                                ✅ Pedidos filtrados correctamente
                            </Text>
                            <Text className="text-green-700 font-JakartaMedium text-xs">
                                Se encontraron {pedidos.length} pedidos para tu restaurante. Solo se muestran los pedidos de {restaurantInfo?.nombreRestaurante}.
                            </Text>
                        </View>
                    </>
                ) : (
                    <View className="flex-1 justify-center items-center py-20">
                        <Text className="text-gray-400 text-6xl mb-4">📋</Text>
                        <Text className="text-[#132e3c] text-xl font-JakartaBold text-center mb-2">
                            No hay pedidos para tu restaurante
                        </Text>
                        <Text className="text-gray-500 font-JakartaMedium text-center mb-6">
                            Los estudiantes pueden hacer pedidos desde la app para verlos aquí
                        </Text>
                        <TouchableOpacity
                            onPress={onRefresh}
                            className="bg-[#132e3c] px-6 py-3 rounded-xl"
                        >
                            <Text className="text-white font-JakartaBold">
                                🔄 Recargar
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Espaciado inferior */}
                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default PedidosRestaurante;