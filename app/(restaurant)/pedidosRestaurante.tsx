import { Text, View, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useState, useCallback } from "react";
import { ClipboardList, Clock, CheckCircle, Home, Bell, Filter } from "lucide-react-native";

const PedidosRestaurante = () => {
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');

    // Datos simulados de pedidos para mostrar la interfaz
    const pedidosSimulados = [
        {
            id: '1',
            numeroOrden: 'UF123456',
            cliente: 'Juan Pérez',
            total: 25000,
            estado: 'pendiente',
            tiempo: '2 min',
            items: ['Hamburguesa Clásica', 'Papas Fritas'],
            comentarios: 'Sin cebolla, por favor'
        },
        {
            id: '2',
            numeroOrden: 'UF123457',
            cliente: 'María García',
            total: 18000,
            estado: 'preparando',
            tiempo: '8 min',
            items: ['Bowl de Carne', 'Coca Cola'],
            comentarios: null
        },
        {
            id: '3',
            numeroOrden: 'UF123458',
            cliente: 'Carlos López',
            total: 32000,
            estado: 'listo',
            tiempo: '15 min',
            items: ['Pasta Pesto', 'Hamburguesa Doble', 'Jugo Hit'],
            comentarios: 'Pasta bien cocida'
        },
        {
            id: '4',
            numeroOrden: 'UF123459',
            cliente: 'Ana Rodríguez',
            total: 22000,
            estado: 'pendiente',
            tiempo: '1 min',
            items: ['Bowl de Pollo', 'Sprite'],
            comentarios: null
        }
    ];

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Simular actualización
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    }, []);

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'preparando': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'listo': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'pendiente': return <Clock size={16} color="#D97706" />;
            case 'preparando': return <ClipboardList size={16} color="#2563EB" />;
            case 'listo': return <CheckCircle size={16} color="#059669" />;
            default: return <Clock size={16} color="#6B7280" />;
        }
    };

    const formatearPrecio = (precio: number) => {
        return `$${precio.toLocaleString('es-CO')}`;
    };

    const pedidosFiltrados = pedidosSimulados.filter(pedido =>
        filtroEstado === 'todos' || pedido.estado === filtroEstado
    );

    const contadorPorEstado = {
        pendiente: pedidosSimulados.filter(p => p.estado === 'pendiente').length,
        preparando: pedidosSimulados.filter(p => p.estado === 'preparando').length,
        listo: pedidosSimulados.filter(p => p.estado === 'listo').length
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="px-5 py-6 border-b border-gray-200">
                <View className="flex-row items-center justify-between mb-4">
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/home")}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                        <Home size={20} color="#132e3c" />
                    </TouchableOpacity>
                    <View className="flex-1 items-center">
                        <Text className="text-[#132e3c] text-xl font-JakartaBold">Pedidos Activos</Text>
                        <Text className="text-gray-600 text-sm font-JakartaMedium">
                            {user?.restaurantInfo?.nombreRestaurante}
                        </Text>
                    </View>
                    <TouchableOpacity className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Bell size={20} color="#3B82F6" />
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
                        <Text className="text-blue-600 text-2xl font-JakartaBold">
                            {contadorPorEstado.preparando}
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
                            { key: 'todos', label: 'Todos', count: pedidosSimulados.length },
                            { key: 'pendiente', label: 'Pendientes', count: contadorPorEstado.pendiente },
                            { key: 'preparando', label: 'Preparando', count: contadorPorEstado.preparando },
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

            <ScrollView
                className="flex-1 px-5 py-6"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {pedidosFiltrados.length > 0 ? (
                    <>
                        {pedidosFiltrados.map((pedido) => (
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
                                            #{pedido.numeroOrden}
                                        </Text>
                                        <Text className="text-gray-500 font-JakartaMedium text-sm">
                                            Hace {pedido.tiempo}
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
                                        Cliente: <Text className="font-JakartaBold">{pedido.cliente}</Text>
                                    </Text>
                                </View>

                                {/* Items del pedido */}
                                <View className="mb-4">
                                    <Text className="text-[#132e3c] font-JakartaBold text-sm mb-2">
                                        Productos:
                                    </Text>
                                    {pedido.items.map((item, index) => (
                                        <Text key={index} className="text-gray-600 font-JakartaMedium text-sm">
                                            • {item}
                                        </Text>
                                    ))}
                                </View>

                                {/* Comentarios si existen */}
                                {pedido.comentarios && (
                                    <View className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <Text className="text-yellow-800 font-JakartaBold text-sm mb-1">
                                            💬 Comentarios del cliente:
                                        </Text>
                                        <Text className="text-yellow-700 font-JakartaMedium text-sm italic">
                                            "{pedido.comentarios}"
                                        </Text>
                                    </View>
                                )}

                                {/* Footer con total y acciones */}
                                <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                                    <Text className="text-[#132e3c] font-JakartaBold text-lg">
                                        {formatearPrecio(pedido.total)}
                                    </Text>

                                    <View className="flex-row space-x-2">
                                        {pedido.estado === 'pendiente' && (
                                            <TouchableOpacity className="bg-[#132e3c] px-4 py-2 rounded-lg">
                                                <Text className="text-white font-JakartaBold text-sm">
                                                    Aceptar
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        {pedido.estado === 'preparando' && (
                                            <TouchableOpacity className="bg-green-600 px-4 py-2 rounded-lg">
                                                <Text className="text-white font-JakartaBold text-sm">
                                                    Marcar Listo
                                                </Text>
                                            </TouchableOpacity>
                                        )}

                                        {pedido.estado === 'listo' && (
                                            <TouchableOpacity className="bg-blue-600 px-4 py-2 rounded-lg">
                                                <Text className="text-white font-JakartaBold text-sm">
                                                    Entregado
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Nota informativa */}
                        <View className="bg-blue-50 rounded-xl p-4 mt-4">
                            <Text className="text-blue-800 font-JakartaBold text-sm mb-2">
                                🔄 Actualización automática
                            </Text>
                            <Text className="text-blue-700 font-JakartaMedium text-xs">
                                Los pedidos se actualizan en tiempo real. Desliza hacia abajo para refrescar manualmente.
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
                    </View>
                )}

                {/* Espaciado inferior para los tabs */}
                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default PedidosRestaurante;