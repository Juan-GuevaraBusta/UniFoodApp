/* eslint-disable prettier/prettier */
// app/(root)/(restaurants)/pagoPlato.tsx - Nueva pantalla de pago
import { Text, TouchableOpacity, View, ScrollView, Image, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from 'expo-router';
import { useCarrito } from '@/context/contextCarrito';
import { useAmplifyData } from "@/hooks/useAmplifyData";
import { useState } from 'react';
import { Stack } from "expo-router";
import { ArrowLeft, CreditCard, CheckCircle, Clock, MapPin } from "lucide-react-native";

const PagoPlato = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { total: totalParam } = useLocalSearchParams<{ total: string }>();

    const {
        carrito,
        calcularTotalCarrito,
        obtenerCantidadTotalCarrito,
        limpiarCarrito
    } = useCarrito();

    const { crearPedido } = useAmplifyData();

    // Función para formatear precio
    const formatearPrecio = (precio: number) => {
        return `$${precio.toLocaleString('es-CO')}`;
    };

    // Calcular totales
    const subtotal = calcularTotalCarrito();
    const tarifaServicio = Math.round(subtotal * 0.05); // 5% de tarifa de servicio
    const total = subtotal + tarifaServicio;

    // Verificar que hay items en el carrito
    if (carrito.length === 0) {
        return (
            <>
                <Stack.Screen options={{ headerShown: false }} />
                <SafeAreaView className="flex-1 bg-white">
                    <View className="flex-1 justify-center items-center px-8">
                        <Text className="text-gray-400 text-6xl mb-4">🛒</Text>
                        <Text className="text-[#132e3c] text-xl font-JakartaBold text-center mb-2">
                            No hay items para pagar
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-[#132e3c] px-8 py-4 rounded-xl mt-4"
                        >
                            <Text className="text-white font-JakartaBold text-base">
                                Volver al carrito
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </>
        );
    }

    const restauranteInfo = carrito[0];

    // Función para procesar el pago
    const procesarPago = async () => {
        Alert.alert(
            'Confirmar pedido',
            `¿Estás seguro de realizar este pedido por ${formatearPrecio(total)}?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Confirmar',
                    onPress: confirmarPedido
                }
            ]
        );
    };

    const confirmarPedido = async () => {
        setIsProcessing(true);

        try {
            console.log('💳 Procesando pago para pedido:', carrito);

            const resultado = await crearPedido(carrito, total);

            if (resultado.success) {
                Alert.alert(
                    '🎉 ¡Pedido realizado exitosamente!',
                    `Tu pedido #${resultado.numeroOrden} ha sido enviado a ${restauranteInfo.nombreRestaurante}. Te notificaremos cuando esté listo para recoger.`,
                    [
                        {
                            text: 'Ver mis pedidos',
                            onPress: () => {
                                limpiarCarrito();
                                router.replace('/(root)/(tabs)/home');
                            }
                        },
                        {
                            text: 'Continuar comprando',
                            onPress: () => {
                                limpiarCarrito();
                                router.replace('/(root)/(tabs)/home');
                            }
                        }
                    ]
                );
            } else {
                console.error('❌ Error en el pedido:', resultado.error);
                Alert.alert(
                    'Error al procesar pedido',
                    resultado.error || 'Ha ocurrido un error inesperado. Intenta nuevamente.'
                );
            }
        } catch (error) {
            console.error('❌ Error inesperado:', error);
            Alert.alert(
                'Error',
                'Ha ocurrido un error inesperado. Verifica tu conexión e intenta nuevamente.'
            );
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView className="flex-1 bg-white">
                {/* Header */}
                <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                        <ArrowLeft size={20} color="#132e3c" />
                    </TouchableOpacity>
                    <View className="items-center">
                        <Text className="text-[#132e3c] text-xl font-JakartaBold">Finalizar Pedido</Text>
                        <Text className="text-gray-500 text-sm font-JakartaMedium">
                            Confirma tu orden
                        </Text>
                    </View>
                    <View className="w-10" />
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    {/* Información del restaurante */}
                    <View className="px-5 py-6 bg-gray-50">
                        <View className="flex-row items-center mb-4">
                            <Image
                                source={restauranteInfo.plato.imagen}
                                className="w-16 h-16 rounded-xl mr-4"
                                resizeMode="cover"
                            />
                            <View className="flex-1">
                                <Text className="text-[#132e3c] text-xl font-JakartaBold">
                                    {restauranteInfo.nombreRestaurante}
                                </Text>
                                <Text className="text-gray-600 font-JakartaMedium text-sm">
                                    {restauranteInfo.nombreUniversidad}
                                </Text>
                            </View>
                        </View>

                        {/* Información de entrega */}
                        <View className="flex-row items-center justify-between py-4 bg-white rounded-xl px-4">
                            <View className="flex-row items-center">
                                <Clock size={20} color="#3B82F6" />
                                <View className="ml-3">
                                    <Text className="text-[#132e3c] font-JakartaBold text-sm">
                                        Tiempo de preparación
                                    </Text>
                                    <Text className="text-gray-600 font-JakartaMedium text-sm">
                                        15-25 minutos
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row items-center">
                                <MapPin size={20} color="#059669" />
                                <View className="ml-3">
                                    <Text className="text-[#132e3c] font-JakartaBold text-sm">
                                        Retiro en
                                    </Text>
                                    <Text className="text-gray-600 font-JakartaMedium text-sm">
                                        {restauranteInfo.nombreRestaurante}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Resumen del pedido */}
                    <View className="px-5 py-6">
                        <Text className="text-[#132e3c] text-xl font-JakartaBold mb-4">
                            Resumen del pedido
                        </Text>

                        {/* Lista compacta de productos */}
                        {carrito.map((item) => (
                            <View
                                key={item.idUnico}
                                className="flex-row items-center justify-between py-3 border-b border-gray-100"
                            >
                                <View className="flex-1">
                                    <Text className="text-[#132e3c] font-JakartaBold text-base">
                                        {item.cantidad}x {item.plato.nombre}
                                    </Text>
                                    {item.toppingsSeleccionados.length > 0 && (
                                        <Text className="text-gray-600 font-JakartaMedium text-sm mt-1">
                                            +{item.toppingsSeleccionados.map(t => t.nombre).join(', ')}
                                        </Text>
                                    )}
                                    {item.comentarios && (
                                        <Text className="text-gray-500 font-JakartaMedium text-sm mt-1 italic">
                                            "{item.comentarios}"
                                        </Text>
                                    )}
                                </View>
                                <Text className="text-[#132e3c] font-JakartaBold text-base">
                                    {formatearPrecio(item.precioTotal * item.cantidad)}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Métodos de pago */}
                    <View className="px-5 py-6 bg-gray-50">
                        <Text className="text-[#132e3c] text-xl font-JakartaBold mb-4">
                            Método de pago
                        </Text>

                        <View className="bg-white rounded-xl p-4 border-2 border-[#132e3c]">
                            <View className="flex-row items-center">
                                <CreditCard size={24} color="#132e3c" />
                                <View className="ml-3 flex-1">
                                    <Text className="text-[#132e3c] font-JakartaBold text-base">
                                        Pago en el restaurante
                                    </Text>
                                    <Text className="text-gray-600 font-JakartaMedium text-sm">
                                        Efectivo o tarjeta al momento de recoger
                                    </Text>
                                </View>
                                <View className="w-6 h-6 bg-[#132e3c] rounded-full items-center justify-center">
                                    <CheckCircle size={16} color="white" />
                                </View>
                            </View>
                        </View>

                        <View className="mt-4 p-3 bg-blue-50 rounded-xl">
                            <Text className="text-blue-800 font-JakartaBold text-sm mb-1">
                                💡 Información de pago
                            </Text>
                            <Text className="text-blue-700 font-JakartaMedium text-xs">
                                El pago se realiza directamente en el restaurante cuando recojas tu pedido. Puedes pagar en efectivo o con tarjeta.
                            </Text>
                        </View>
                    </View>

                    {/* Espaciado para el footer */}
                    <View className="h-32" />
                </ScrollView>

                {/* Footer con totales y botón de confirmar */}
                <View className="bg-white border-t border-gray-200 px-5 py-4">
                    {/* Resumen de costos */}
                    <View className="mb-4">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-600 font-JakartaMedium">
                                Subtotal ({obtenerCantidadTotalCarrito()} productos)
                            </Text>
                            <Text className="text-gray-600 font-JakartaMedium">
                                {formatearPrecio(subtotal)}
                            </Text>
                        </View>

                        <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-600 font-JakartaMedium">
                                Tarifa de servicio (5%)
                            </Text>
                            <Text className="text-gray-600 font-JakartaMedium">
                                {formatearPrecio(tarifaServicio)}
                            </Text>
                        </View>

                        <View className="border-t border-gray-200 pt-2">
                            <View className="flex-row justify-between">
                                <Text className="text-[#132e3c] font-JakartaBold text-xl">
                                    Total a pagar
                                </Text>
                                <Text className="text-[#132e3c] font-JakartaBold text-xl">
                                    {formatearPrecio(total)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Botón de confirmar pedido */}
                    <TouchableOpacity
                        onPress={procesarPago}
                        disabled={isProcessing}
                        className={`py-4 rounded-xl flex-row items-center justify-center ${isProcessing ? 'bg-gray-400' : 'bg-[#132e3c]'
                            }`}
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 4,
                        }}
                    >
                        {isProcessing ? (
                            <>
                                <ActivityIndicator size="small" color="white" />
                                <Text className="text-white font-JakartaBold text-lg ml-3">
                                    Procesando pedido...
                                </Text>
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} color="white" />
                                <Text className="text-white font-JakartaBold text-lg ml-3">
                                    Confirmar pedido - {formatearPrecio(total)}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </>
    );
};

export default PagoPlato;