import { Text, View, TouchableOpacity, ScrollView, RefreshControl, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { useState, useCallback, useEffect } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { ClipboardList, Clock, CheckCircle, Home, RefreshCw } from "lucide-react-native";

// ✅ Cliente GraphQL tipado para producción
const client = generateClient<Schema>();

const PedidosRestaurante = () => {
    const { user } = useAuth();

    const [pedidos, setPedidos] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');

    // ✅ Cargar pedidos al enfocar la pantalla
    useFocusEffect(
        useCallback(() => {
            console.log('📱 RESTAURANTE - Pantalla pedidos enfocada, cargando pedidos...');
            cargarPedidos();
        }, [])
    );

    // ✅ FUNCIÓN PRINCIPAL: Cargar pedidos reales desde AppSync
    const cargarPedidos = async () => {
        try {
            if (!user?.restaurantInfo) {
                console.log('❌ RESTAURANTE - No hay información de restaurante');
                setLoading(false);
                return;
            }

            console.log('📋 RESTAURANTE - Cargando pedidos para:', user.restaurantInfo.restauranteId);

            // ✅ PASO 1: Verificar autenticación del restaurante
            let currentUser;
            let session;

            try {
                [currentUser, session] = await Promise.all([
                    getCurrentUser(),
                    fetchAuthSession()
                ]);

                if (!session.tokens?.accessToken) {
                    throw new Error('No access token available');
                }

                console.log('✅ RESTAURANTE - Autenticación verificada');
            } catch (authError) {
                console.error('❌ RESTAURANTE - Error de autenticación:', authError);
                Alert.alert(
                    'Sesión expirada',
                    'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
                    [
                        {
                            text: 'Iniciar sesión',
                            onPress: () => router.replace('/(auth)/iniciaSesion')
                        }
                    ]
                );
                setLoading(false);
                return;
            }

            // ✅ PASO 2: Preparar filtros para la consulta GraphQL
            const restauranteId = user.restaurantInfo.restauranteId.toString();
            let filter: any;

            if (filtroEstado === 'todos') {
                // Obtener todos los pedidos del restaurante
                filter = {
                    restauranteId: { eq: restauranteId }
                };
            } else {
                // Filtrar por estado específico usando restauranteEstado
                filter = {
                    restauranteEstado: { eq: `${restauranteId}#${filtroEstado}` }
                };
            }

            console.log('🔍 RESTAURANTE - Filtro aplicado:', {
                restauranteId,
                filtroEstado,
                filter
            });

            // ✅ PASO 3: Consultar pedidos en AppSync/DynamoDB
            console.log('🔗 RESTAURANTE - Consultando AppSync...');

            const { data: pedidosData, errors } = await client.models.Pedido.list({
                filter,
                // Ordenar por fecha más reciente primero
                limit: 50
            });

            if (errors && errors.length > 0) {
                console.error('❌ RESTAURANTE - Errores GraphQL:', errors);

                const authError = errors.find(err =>
                    err.message?.includes('Unauthorized') ||
                    err.message?.includes('Not Authorized')
                );

                if (authError) {
                    Alert.alert(
                        'Sesión expirada',
                        'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
                        [
                            {
                                text: 'Iniciar sesión',
                                onPress: () => router.replace('/(auth)/iniciaSesion')
                            }
                        ]
                    );
                } else {
                    Alert.alert('Error', errors[0].message || 'No se pudieron cargar los pedidos');
                }

                setLoading(false);
                return;
            }

            if (!pedidosData) {
                console.log('⚠️ RESTAURANTE - No se recibieron datos');
                setPedidos([]);
                setLoading(false);
                return;
            }

            // ✅ PASO 4: Procesar y ordenar pedidos
            console.log('📊 RESTAURANTE - Procesando pedidos recibidos:', pedidosData.length);

            // Procesar itemsPedido (viene como JSON string)
            const pedidosProcesados = pedidosData.map((pedido: any) => ({
                ...pedido,
                itemsPedido: typeof pedido.itemsPedido === 'string'
                    ? JSON.parse(pedido.itemsPedido)
                    : pedido.itemsPedido || []
            }));

            // Ordenar por fecha más reciente
            const pedidosOrdenados = pedidosProcesados.sort((a: any, b: any) =>
                new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime()
            );

            console.log('✅ RESTAURANTE - Pedidos cargados exitosamente:', {
                total: pedidosOrdenados.length,
                estados: pedidosOrdenados.reduce((acc: any, p: any) => {
                    acc[p.estado] = (acc[p.estado] || 0) + 1;
                    return acc;
                }, {}),
                filtroActual: filtroEstado
            });

            setPedidos(pedidosOrdenados);

        } catch (error: any) {
            console.error('❌ RESTAURANTE - Error inesperado:', error);
            Alert.alert('Error', 'Ocurrió un error inesperado al cargar los pedidos');
        } finally {
            setLoading(false);
        }
    };

    // ✅ Recargar cuando cambie el filtro
    useEffect(() => {
        if (!loading) {
            console.log('🔄 RESTAURANTE - Filtro cambió a:', filtroEstado);
            cargarPedidos();
        }
    }, [filtroEstado]);

    // ✅ Pull to refresh
    const onRefresh = useCallback(async () => {
        console.log('🔄 RESTAURANTE - Refrescando pedidos...');
        setRefreshing(true);
        await cargarPedidos();
        setRefreshing(false);
    }, [filtroEstado]);

    // ✅ FUNCIÓN PRINCIPAL: Actualizar estado del pedido
    const cambiarEstadoPedido = async (pedidoId: string, nuevoEstado: string, numeroOrden: string) => {
        try {
            console.log('🔄 RESTAURANTE - Cambiando estado:', { pedidoId, nuevoEstado, numeroOrden });

            // ✅ PASO 1: Verificar autenticación
            let session;
            try {
                session = await fetchAuthSession();
                if (!session.tokens?.accessToken) {
                    throw new Error('No access token available');
                }
            } catch (authError) {
                console.error('❌ RESTAURANTE - Error de autenticación al actualizar:', authError);
                Alert.alert(
                    'Sesión expirada',
                    'Tu sesión ha expirada. Por favor inicia sesión nuevamente.',
                    [
                        {
                            text: 'Iniciar sesión',
                            onPress: () => router.replace('/(auth)/iniciaSesion')
                        }
                    ]
                );
                return;
            }

            // ✅ PASO 2: Obtener pedido actual para obtener restauranteId
            const { data: pedidoActual, errors: getErrors } = await client.models.Pedido.get({
                id: pedidoId
            });

            if (getErrors && getErrors.length > 0) {
                console.error('❌ RESTAURANTE - Error obteniendo pedido:', getErrors);
                Alert.alert('Error', 'No se pudo obtener la información del pedido');
                return;
            }

            if (!pedidoActual) {
                Alert.alert('Error', 'Pedido no encontrado');
                return;
            }

            // ✅ PASO 3: Preparar datos de actualización
            const updateData: any = {
                id: pedidoId,
                estado: nuevoEstado,
                restauranteEstado: `${pedidoActual.restauranteId}#${nuevoEstado}`,
            };

            const now = new Date().toISOString();
            switch (nuevoEstado) {
                case 'aceptado':
                    updateData.fechaAceptado = now;
                    updateData.tiempoEstimado = 20;
                    break;
                case 'listo':
                    updateData.fechaListo = now;
                    break;
                case 'entregado':
                    updateData.fechaEntregado = now;
                    break;
            }

            console.log('📝 RESTAURANTE - Actualizando en AppSync:', updateData);

            // ✅ PASO 4: Actualizar en AppSync/DynamoDB
            const { data: pedidoActualizado, errors: updateErrors } = await client.models.Pedido.update(updateData);

            if (updateErrors && updateErrors.length > 0) {
                console.error('❌ RESTAURANTE - Errores al actualizar:', updateErrors);
                Alert.alert('Error', updateErrors[0].message || 'No se pudo actualizar el pedido');
                return;
            }

            if (!pedidoActualizado) {
                Alert.alert('Error', 'No se recibió confirmación de la actualización');
                return;
            }

            console.log('✅ RESTAURANTE - Pedido actualizado exitosamente:', pedidoActualizado);

            // ✅ PASO 5: Actualizar lista local inmediatamente
            setPedidos(prev => prev.map(pedido =>
                pedido.id === pedidoId
                    ? { ...pedido, estado: nuevoEstado }
                    : pedido
            ));

            // ✅ Mostrar confirmación al usuario
            const mensajes = {
                'aceptado': '✅ Pedido aceptado',
                'preparando': '👨‍🍳 Pedido en preparación',
                'listo': '🍽️ Pedido listo para entregar',
                'entregado': '✅ Pedido entregado',
                'cancelado': '❌ Pedido cancelado'
            };

            Alert.alert(
                'Estado actualizado',
                `${mensajes[nuevoEstado as keyof typeof mensajes]} - ${numeroOrden}`
            );

        } catch (error: any) {
            console.error('❌ RESTAURANTE - Error inesperado actualizando:', error);
            Alert.alert('Error', 'Ocurrió un error inesperado al actualizar el pedido');
        }
    };

    // ✅ Funciones auxiliares sin cambios
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
        return `${precio.toLocaleString('es-CO')}`;
    };

    const formatearFecha = (fechaISO: string) => {
        const fecha = new Date(fechaISO);
        const ahora = new Date();
        const diferencia = Math.floor((ahora.getTime() - fecha.getTime()) / 60000); // minutos

        if (diferencia < 1) return 'Hace menos de 1 min';
        if (diferencia < 60) return `Hace ${diferencia} min`;

        const horas = Math.floor(diferencia / 60);
        if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;

        return fecha.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calcular contadores
    const contadorPorEstado = {
        pendiente: pedidos.filter(p => p.estado === 'pendiente').length,
        aceptado: pedidos.filter(p => p.estado === 'aceptado').length,
        preparando: pedidos.filter(p => p.estado === 'preparando').length,
        listo: pedidos.filter(p => p.estado === 'listo').length,
    };

    const pedidosActivos = pedidos.filter(p => !['entregado', 'cancelado'].includes(p.estado));

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="px-5 py-6 border-b border-gray-200">
                <View className="flex-row items-center justify-between mb-4">
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/(tabs)/home")}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                        <Home size={20} color="#132e3c" />
                    </TouchableOpacity>
                    <View className="flex-1 items-center">
                        <Text className="text-[#132e3c] text-xl font-JakartaBold">Pedidos en Tiempo Real</Text>
                        <Text className="text-gray-600 text-sm font-JakartaMedium">
                            {user?.restaurantInfo?.nombreRestaurante}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={onRefresh}
                        className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"
                    >
                        <RefreshCw size={20} color="#3B82F6" />
                    </TouchableOpacity>
                </View>

                {/* Resumen rápido */}
                <View className="flex-row justify-around py-4 bg-gray-50 rounded-xl">
                    <View className="items-center">
                        <Text className="text-yellow-600 text-2xl font-JakartaBold">
                            {contadorPorEstado.pendiente}
                        </Text>
                        <Text className="text-gray-600 font-JakartaMedium text-sm">Pendientes</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-orange-600 text-2xl font-JakartaBold">
                            {contadorPorEstado.preparando + contadorPorEstado.aceptado}
                        </Text>
                        <Text className="text-gray-600 font-JakartaMedium text-sm">Preparando</Text>
                    </View>
                    <View className="items-center">
                        <Text className="text-green-600 text-2xl font-JakartaBold">
                            {contadorPorEstado.listo}
                        </Text>
                        <Text className="text-gray-600 font-JakartaMedium text-sm">Listos</Text>
                    </View>
                </View>
            </View>

            {/* Filtros */}
            <View className="px-5 py-4 border-b border-gray-100">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row space-x-3">
                        {[
                            { key: 'todos', label: 'Todos', count: pedidosActivos.length },
                            { key: 'pendiente', label: 'Pendientes', count: contadorPorEstado.pendiente },
                            { key: 'preparando', label: 'Preparando', count: contadorPorEstado.preparando + contadorPorEstado.aceptado },
                            { key: 'listo', label: 'Listos', count: contadorPorEstado.listo }
                        ].map((filtro) => (
                            <TouchableOpacity
                                key={filtro.key}
                                onPress={() => setFiltroEstado(filtro.key)}
                                className={`px-4 py-2 rounded-full border ${filtroEstado === filtro.key
                                    ? 'bg-[#132e3c] border-[#132e3c]'
                                    : 'bg-white border-gray-300'
                                    }`}
                            >
                                <Text className={`font-JakartaBold text-sm ${filtroEstado === filtro.key ? 'text-white' : 'text-gray-600'
                                    }`}>
                                    {filtro.label} ({filtro.count})
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
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
                            Cargando pedidos...
                        </Text>
                        <Text className="text-gray-600 text-sm font-JakartaMedium mt-2">
                            Conectando con AppSync en tiempo real...
                        </Text>
                    </View>
                ) : pedidosActivos.length > 0 ? (
                    <>
                        {pedidosActivos.map((pedido) => (
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
                                            {pedido.numeroOrden}
                                        </Text>
                                        <Text className="text-gray-500 font-JakartaMedium text-sm">
                                            {formatearFecha(pedido.fechaPedido)}
                                        </Text>
                                    </View>
                                    <View className={`px-3 py-1 rounded-full border flex-row items-center ${getEstadoColor(pedido.estado)}`}>
                                        {getEstadoIcon(pedido.estado)}
                                        <Text className="font-JakartaBold text-xs ml-1 capitalize">
                                            {pedido.estado}
                                        </Text>
                                    </View>
                                </View>

                                {/* Información del cliente */}
                                <View className="mb-3">
                                    <Text className="text-gray-600 font-JakartaMedium text-sm">
                                        Cliente: <Text className="font-JakartaBold">{pedido.usuarioEmail}</Text>
                                    </Text>
                                </View>

                                {/* Items del pedido */}
                                <View className="mb-4">
                                    <Text className="text-[#132e3c] font-JakartaBold text-sm mb-2">
                                        Productos:
                                    </Text>
                                    {pedido.itemsPedido && Array.isArray(pedido.itemsPedido) ? (
                                        pedido.itemsPedido.map((item: any, index: number) => (
                                            <View key={index} className="flex-row justify-between items-center mb-1">
                                                <Text className="text-gray-600 font-JakartaMedium text-sm flex-1">
                                                    {item.cantidad}x {item.platoNombre}
                                                </Text>
                                                <Text className="text-gray-800 font-JakartaBold text-sm">
                                                    {formatearPrecio(item.totalItem)}
                                                </Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text className="text-gray-500 font-JakartaMedium text-sm italic">
                                            No se pudieron cargar los items del pedido
                                        </Text>
                                    )}

                                    {/* Toppings y comentarios si existen */}
                                    {pedido.itemsPedido && Array.isArray(pedido.itemsPedido) &&
                                        pedido.itemsPedido.some((item: any) => item.toppingsSeleccionados?.length > 0 || item.comentarios) && (
                                            <View className="mt-2 pl-4 border-l-2 border-gray-200">
                                                {pedido.itemsPedido.map((item: any, index: number) => (
                                                    <View key={`details-${index}`}>
                                                        {item.toppingsSeleccionados?.length > 0 && (
                                                            <Text className="text-green-600 font-JakartaMedium text-xs">
                                                                + {item.toppingsSeleccionados.map((t: any) => t.nombre).join(', ')}
                                                            </Text>
                                                        )}
                                                        {item.comentarios && (
                                                            <Text className="text-blue-600 font-JakartaMedium text-xs italic">
                                                                "{item.comentarios}"
                                                            </Text>
                                                        )}
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                </View>

                                {/* Comentarios del cliente si existen */}
                                {pedido.comentariosCliente && (
                                    <View className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <Text className="text-yellow-800 font-JakartaBold text-sm mb-1">
                                            💬 Comentarios del cliente:
                                        </Text>
                                        <Text className="text-yellow-700 font-JakartaMedium text-sm italic">
                                            "{pedido.comentariosCliente}"
                                        </Text>
                                    </View>
                                )}

                                {/* Footer con total y acciones */}
                                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                                    <View>
                                        <Text className="text-gray-600 font-JakartaMedium text-sm">Total:</Text>
                                        <Text className="text-[#132e3c] font-JakartaBold text-lg">
                                            {formatearPrecio(pedido.total)}
                                        </Text>
                                    </View>

                                    <View className="flex-row space-x-2">
                                        {pedido.estado === 'pendiente' && (
                                            <>
                                                <TouchableOpacity
                                                    onPress={() => cambiarEstadoPedido(pedido.id, 'cancelado', pedido.numeroOrden)}
                                                    className="bg-red-500 px-3 py-2 rounded-lg"
                                                >
                                                    <Text className="text-white font-JakartaBold text-sm">
                                                        Rechazar
                                                    </Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => cambiarEstadoPedido(pedido.id, 'aceptado', pedido.numeroOrden)}
                                                    className="bg-[#132e3c] px-4 py-2 rounded-lg"
                                                >
                                                    <Text className="text-white font-JakartaBold text-sm">
                                                        Aceptar
                                                    </Text>
                                                </TouchableOpacity>
                                            </>
                                        )}

                                        {pedido.estado === 'aceptado' && (
                                            <TouchableOpacity
                                                onPress={() => cambiarEstadoPedido(pedido.id, 'preparando', pedido.numeroOrden)}
                                                className="bg-orange-600 px-4 py-2 rounded-lg"
                                            >
                                                <Text className="text-white font-JakartaBold text-sm">
                                                    Iniciar Preparación
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        {pedido.estado === 'preparando' && (
                                            <TouchableOpacity
                                                onPress={() => cambiarEstadoPedido(pedido.id, 'listo', pedido.numeroOrden)}
                                                className="bg-green-600 px-4 py-2 rounded-lg"
                                            >
                                                <Text className="text-white font-JakartaBold text-sm">
                                                    Marcar Listo
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        {pedido.estado === 'listo' && (
                                            <TouchableOpacity
                                                onPress={() => cambiarEstadoPedido(pedido.id, 'entregado', pedido.numeroOrden)}
                                                className="bg-blue-600 px-4 py-2 rounded-lg"
                                            >
                                                <Text className="text-white font-JakartaBold text-sm">
                                                    Entregado
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Información de tiempo real */}
                        <View className="bg-green-50 rounded-xl p-4 mt-4">
                            <Text className="text-green-800 font-JakartaBold text-sm mb-2">
                                🚀 Sistema en Tiempo Real
                            </Text>
                            <Text className="text-green-700 font-JakartaMedium text-xs">
                                Los pedidos se cargan directamente desde AWS DynamoDB a través de AppSync. Los cambios se reflejan inmediatamente.
                            </Text>
                        </View>
                    </>
                ) : (
                    <View className="flex-1 justify-center items-center py-20">
                        <Text className="text-gray-400 text-6xl mb-4">📋</Text>
                        <Text className="text-[#132e3c] text-xl font-JakartaBold text-center mb-2">
                            {filtroEstado === 'todos' ? 'No hay pedidos activos' : `No hay pedidos ${filtroEstado}`}
                        </Text>
                        <Text className="text-gray-500 font-JakartaMedium text-center mb-6">
                            {filtroEstado === 'todos'
                                ? 'Los nuevos pedidos aparecerán aquí automáticamente'
                                : 'Cambia el filtro para ver otros pedidos'
                            }
                        </Text>
                        <TouchableOpacity
                            onPress={onRefresh}
                            className="bg-[#132e3c] px-6 py-3 rounded-xl"
                        >
                            <Text className="text-white font-JakartaBold">
                                Actualizar
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* ✅ Debug info en desarrollo */}
                {__DEV__ && (
                    <View className="mt-4 p-4 bg-blue-50 rounded-xl">
                        <Text className="text-blue-800 font-JakartaBold text-sm mb-2">
                            🔧 DEV - AppSync + DynamoDB:
                        </Text>
                        <Text className="text-blue-600 font-JakartaMedium text-xs">
                            Total pedidos: {pedidos.length} | Activos: {pedidosActivos.length}
                        </Text>
                        <Text className="text-blue-600 font-JakartaMedium text-xs">
                            Filtro: {filtroEstado} | Restaurante: {user?.restaurantInfo?.restauranteId}
                        </Text>
                        <Text className="text-blue-600 font-JakartaMedium text-xs">
                            Última actualización: {new Date().toLocaleTimeString()}
                        </Text>
                    </View>
                )}

                {/* Espaciado inferior para los tabs */}
                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default PedidosRestaurante;