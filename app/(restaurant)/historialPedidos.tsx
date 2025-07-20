import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { BarChart3, Calendar, DollarSign, TrendingUp, Home } from "lucide-react-native";

const HistorialPedidos = () => {
    const { user } = useAuth();

    // Datos simulados del historial para mostrar la interfaz
    const pedidosHistorial = [
        {
            id: '1',
            fecha: '2024-01-15',
            numeroOrden: 'UF123456',
            cliente: 'Juan Pérez',
            total: 25000,
            estado: 'entregado',
            items: ['Hamburguesa Clásica', 'Papas Fritas', 'Coca Cola']
        },
        {
            id: '2',
            fecha: '2024-01-15',
            numeroOrden: 'UF123457',
            cliente: 'María García',
            total: 18000,
            estado: 'entregado',
            items: ['Bowl de Carne', 'Jugo Hit']
        },
        {
            id: '3',
            fecha: '2024-01-14',
            numeroOrden: 'UF123458',
            cliente: 'Carlos López',
            total: 32000,
            estado: 'entregado',
            items: ['Pasta Pesto', 'Hamburguesa Doble', 'Jugo Hit']
        },
        {
            id: '4',
            fecha: '2024-01-14',
            numeroOrden: 'UF123459',
            cliente: 'Ana Rodríguez',
            total: 22000,
            estado: 'cancelado',
            items: ['Bowl de Pollo', 'Sprite']
        },
        {
            id: '5',
            fecha: '2024-01-13',
            numeroOrden: 'UF123460',
            cliente: 'Luis Martínez',
            total: 15000,
            estado: 'entregado',
            items: ['Hamburguesa Simple', 'Papas']
        }
    ];

    const formatearPrecio = (precio: number) => {
        return `$${precio.toLocaleString('es-CO')}`;
    };

    const formatearFecha = (fecha: string) => {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'entregado': return 'bg-green-100 text-green-800';
            case 'cancelado': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Calcular estadísticas
    const totalVentas = pedidosHistorial
        .filter(p => p.estado === 'entregado')
        .reduce((sum, p) => sum + p.total, 0);

    const pedidosEntregados = pedidosHistorial.filter(p => p.estado === 'entregado').length;
    const pedidosCancelados = pedidosHistorial.filter(p => p.estado === 'cancelado').length;
    const promedioVenta = pedidosEntregados > 0 ? totalVentas / pedidosEntregados : 0;

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="px-5 py-6 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/(tabs)/home")}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                        <Home size={20} color="#132e3c" />
                    </TouchableOpacity>
                    <View className="flex-1 items-center">
                        <Text className="text-[#132e3c] text-xl font-JakartaBold">Historial de Pedidos</Text>
                        <Text className="text-gray-600 text-sm font-JakartaMedium">
                            {user?.restaurantInfo?.nombreRestaurante}
                        </Text>
                    </View>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header con estadísticas */}
                <View className="px-5 py-6 bg-gray-50">
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 bg-[#132e3c] rounded-full items-center justify-center mb-3">
                            <BarChart3 size={32} color="white" />
                        </View>
                        <Text className="text-[#132e3c] text-2xl font-JakartaBold text-center">
                            Resumen de Ventas
                        </Text>
                        <Text className="text-gray-600 font-JakartaMedium text-center mt-1">
                            Últimos 7 días
                        </Text>
                    </View>

                    {/* Tarjetas de estadísticas */}
                    <View className="flex-row justify-between space-x-3">
                        <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
                            <View className="items-center">
                                <DollarSign size={24} color="#059669" />
                                <Text className="text-green-600 text-lg font-JakartaBold mt-2">
                                    {formatearPrecio(totalVentas)}
                                </Text>
                                <Text className="text-gray-600 text-xs font-JakartaMedium text-center">
                                    Total Ventas
                                </Text>
                            </View>
                        </View>

                        <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
                            <View className="items-center">
                                <TrendingUp size={24} color="#3B82F6" />
                                <Text className="text-blue-600 text-lg font-JakartaBold mt-2">
                                    {pedidosEntregados}
                                </Text>
                                <Text className="text-gray-600 text-xs font-JakartaMedium text-center">
                                    Entregados
                                </Text>
                            </View>
                        </View>

                        <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
                            <View className="items-center">
                                <Calendar size={24} color="#D97706" />
                                <Text className="text-orange-600 text-lg font-JakartaBold mt-2">
                                    {formatearPrecio(promedioVenta)}
                                </Text>
                                <Text className="text-gray-600 text-xs font-JakartaMedium text-center">
                                    Promedio
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Lista de pedidos */}
                <View className="px-5 py-6">
                    <Text className="text-[#132e3c] text-xl font-JakartaBold mb-4">
                        Pedidos Recientes
                    </Text>

                    {pedidosHistorial.map((pedido) => (
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
                                    <Text className="text-[#132e3c] font-JakartaBold text-base">
                                        #{pedido.numeroOrden}
                                    </Text>
                                    <Text className="text-gray-500 font-JakartaMedium text-sm">
                                        {formatearFecha(pedido.fecha)}
                                    </Text>
                                </View>
                                <View className={`px-3 py-1 rounded-full ${getEstadoColor(pedido.estado)}`}>
                                    <Text className="font-JakartaBold text-xs capitalize">
                                        {pedido.estado}
                                    </Text>
                                </View>
                            </View>

                            {/* Información del cliente */}
                            <View className="mb-3">
                                <Text className="text-gray-600 font-JakartaMedium text-sm">
                                    Cliente: {pedido.cliente}
                                </Text>
                            </View>

                            {/* Items del pedido */}
                            <View className="mb-3">
                                <Text className="text-[#132e3c] font-JakartaBold text-sm mb-2">
                                    Productos:
                                </Text>
                                {pedido.items.map((item, index) => (
                                    <Text key={index} className="text-gray-600 font-JakartaMedium text-sm">
                                        • {item}
                                    </Text>
                                ))}
                            </View>

                            {/* Total */}
                            <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
                                <Text className="text-gray-600 font-JakartaMedium text-sm">
                                    Total del pedido:
                                </Text>
                                <Text className="text-[#132e3c] font-JakartaBold text-lg">
                                    {formatearPrecio(pedido.total)}
                                </Text>
                            </View>
                        </View>
                    ))}

                    {/* Estadísticas del período */}
                    <View className="bg-blue-50 rounded-xl p-4 mt-4">
                        <Text className="text-blue-800 font-JakartaBold text-sm mb-2">
                            📊 Estadísticas del Período
                        </Text>
                        <Text className="text-blue-700 font-JakartaMedium text-xs mb-2">
                            • {pedidosEntregados} pedidos entregados exitosamente
                        </Text>
                        <Text className="text-blue-700 font-JakartaMedium text-xs mb-2">
                            • {pedidosCancelados} pedidos cancelados
                        </Text>
                        <Text className="text-blue-700 font-JakartaMedium text-xs">
                            • Tasa de éxito: {pedidosHistorial.length > 0 ? Math.round((pedidosEntregados / pedidosHistorial.length) * 100) : 0}%
                        </Text>
                    </View>

                    {/* Nota informativa */}
                    <View className="bg-yellow-50 rounded-xl p-4 mt-4">
                        <Text className="text-yellow-800 font-JakartaBold text-sm mb-2">
                            💡 Información
                        </Text>
                        <Text className="text-yellow-700 font-JakartaMedium text-xs">
                            Esta es una vista previa con datos simulados. El historial real se actualizará automáticamente con los pedidos procesados.
                        </Text>
                    </View>
                </View>

                {/* Espaciado inferior */}
                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default HistorialPedidos;