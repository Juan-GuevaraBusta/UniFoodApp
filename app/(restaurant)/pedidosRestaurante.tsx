import type { Schema } from '@/amplify/data/resource';
import { useAuth } from "@/hooks/useAuth";
import { useFocusEffect } from '@react-navigation/native';
import { fetchAuthSession } from 'aws-amplify/auth';
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
            console.log('📋 RESTAURANTE - Cargando pedidos del restaurante...');

            // ✅ PASO 1: Verificar autenticación y obtener info del restaurante
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

            // ✅ PASO 2: Verificar que el usuario tenga información de restaurante
            if (!user?.restaurantInfo) {
                console.error('❌ RESTAURANTE - Usuario no tiene información de restaurante');
                Alert.alert('Error', 'No tienes permisos para ver pedidos de restaurante.');
                setLoading(false);
                return;
            }

            const { universidadId, restauranteId, nombreRestaurante } = user.restaurantInfo;
            console.log('🔍 RESTAURANTE - Filtrando por:', {
                universidadId,
                restauranteId,
                nombreRestaurante,
                userEmail: user.email
            });

            // ✅ PASO 3: Consultar pedidos filtrados por restaurante
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
            console.log('🔍 Usuario actual:', user?.email);
            console.log('🔍 Restaurante del usuario:', user?.restaurantInfo);

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
                console.log(`   - itemsPedido muestra: ${typeof pedido.itemsPedido === 'string'
                    ? pedido.itemsPedido.substring(0, 50) + '...'
                    : 'No es string'
                    }`);
                console.log(`   ---`);
            });

            // ✅ PASO 4: Procesar pedidos - PARSEAR itemsPedido
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

            // ✅ PASO 5: Ordenar por fecha más reciente
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
                            {user?.restaurantInfo?.nombreRestaurante || 'Restaurante'}
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
                    {user?.restaurantInfo && (
                        <Text className="text-blue-600 font-JakartaMedium text-sm text-center mt-1">
                            {user.restaurantInfo.nombreRestaurante} - {user.restaurantInfo.nombreUniversidad}
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
                                Se encontraron {pedidos.length} pedidos para tu restaurante. Solo se muestran los pedidos de {user?.restaurantInfo?.nombreRestaurante}.
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