/* eslint-disable prettier/prettier */
// app/(root)/(restaurants)/pagoPlato.tsx - VERSIÓN PRODUCCIÓN CON GRAPHQL REAL
import { Text, TouchableOpacity, View, ScrollView, Image, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from 'expo-router';
import { useCarrito } from '@/context/contextCarrito';
import { useAuth } from "@/hooks/useAuth";
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { useState } from 'react';
import { Stack } from "expo-router";
import { ArrowLeft, CreditCard, CheckCircle, Clock, MapPin, User } from "lucide-react-native";

// ✅ Cliente GraphQL tipado para producción
const client = generateClient<Schema>();

const PagoPlato = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const { total: totalParam } = useLocalSearchParams<{ total: string }>();

    const {
        carrito,
        calcularTotalCarrito,
        obtenerCantidadTotalCarrito,
        limpiarCarrito
    } = useCarrito();

    const { user } = useAuth();

    // Función para formatear precio
    const formatearPrecio = (precio: number) => {
        return `$${precio.toLocaleString('es-CO')}`;
    };

    // Calcular totales
    const subtotal = calcularTotalCarrito();
    const tarifaServicio = Math.round(subtotal * 0.05);
    const total = subtotal + tarifaServicio;

    // ✅ FUNCIÓN PRINCIPAL: Crear pedido real en GraphQL/AppSync
    const crearPedidoProduccion = async (): Promise<{ success: boolean, numeroOrden?: string, pedidoId?: string, error?: string, needsReauth?: boolean }> => {
        try {
            console.log('🚀 PRODUCCIÓN - Iniciando creación de pedido real...');

            // ✅ PASO 1: Verificar usuario actual y sesión
            let currentUser;
            let session;

            try {
                [currentUser, session] = await Promise.all([
                    getCurrentUser(),
                    fetchAuthSession()
                ]);

                console.log('✅ PRODUCCIÓN - Usuario verificado:', {
                    username: currentUser.username,
                    hasTokens: !!session.tokens,
                    hasAccessToken: !!session.tokens?.accessToken
                });

                if (!session.tokens?.accessToken) {
                    throw new Error('No access token available');
                }

            } catch (authError) {
                console.error('❌ PRODUCCIÓN - Error de autenticación:', authError);
                return {
                    success: false,
                    error: 'Sesión expirada. Por favor inicia sesión nuevamente.',
                    needsReauth: true
                };
            }

            // ✅ PASO 2: Preparar datos del pedido
            const primerItem = carrito[0];
            const restauranteId = primerItem.idRestaurante.toString();
            const universidadId = primerItem.universidadId;
            const numeroOrden = generateShortOrderNumber();
            const usuarioEmail = currentUser.signInDetails?.loginId || user?.email;

            if (!usuarioEmail) {
                throw new Error('No se pudo obtener el email del usuario');
            }

            const pedidoData = {
                numeroOrden,
                usuarioEmail,
                restauranteId,
                subtotal,
                tarifaServicio,
                total,
                estado: 'pendiente' as const,
                fechaPedido: new Date().toISOString(),
                comentariosCliente: carrito
                    .filter(item => item.comentarios?.trim())
                    .map(item => `${item.plato.nombre}: ${item.comentarios}`)
                    .join('; ') || undefined,
                universidadId,
                restauranteEstado: `${restauranteId}#pendiente`,
                itemsPedido: carrito.map(item => ({
                    platoId: item.plato.idPlato,
                    platoNombre: item.plato.nombre,
                    platoDescripcion: item.plato.descripcion,
                    precioUnitario: item.plato.precio,
                    cantidad: item.cantidad,
                    comentarios: item.comentarios || undefined,
                    toppingsSeleccionados: item.toppingsSeleccionados || [],
                    toppingsBaseRemocionados: item.toppingsBaseRemocionados || [],
                    precioTotal: item.precioTotal,
                    totalItem: item.precioTotal * item.cantidad,
                    idUnico: item.idUnico,
                    restauranteNombre: item.nombreRestaurante,
                    universidadNombre: item.nombreUniversidad
                }))
            };

            console.log('📋 PRODUCCIÓN - Datos del pedido preparados:', {
                numeroOrden,
                usuarioEmail,
                restauranteId,
                total,
                itemsCount: pedidoData.itemsPedido.length
            });

            // ✅ PASO 3: Crear pedido en AppSync usando client tipado
            console.log('🔗 PRODUCCIÓN - Enviando a AppSync...');

            const { data: pedido, errors } = await client.models.Pedido.create(pedidoData);

            if (errors && errors.length > 0) {
                console.error('❌ PRODUCCIÓN - Errores de GraphQL:', errors);

                // Detectar errores de autenticación específicos
                const authError = errors.find(err =>
                    err.message?.includes('Unauthorized') ||
                    err.message?.includes('Not Authorized') ||
                    err.message?.includes('authentication') ||
                    err.message?.includes('UnauthorizedException')
                );

                if (authError) {
                    return {
                        success: false,
                        error: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
                        needsReauth: true
                    };
                }

                return {
                    success: false,
                    error: errors[0].message || 'Error del servidor al crear el pedido'
                };
            }

            if (!pedido) {
                return {
                    success: false,
                    error: 'No se recibió respuesta del servidor'
                };
            }

            console.log('✅ PRODUCCIÓN - Pedido creado exitosamente en AppSync:', {
                id: pedido.id,
                numeroOrden: pedido.numeroOrden,
                estado: pedido.estado
            });

            return {
                success: true,
                numeroOrden: pedido.numeroOrden,
                pedidoId: pedido.id
            };

        } catch (error: any) {
            console.error('❌ PRODUCCIÓN - Error inesperado:', error);

            // Detectar errores de autenticación en el catch
            if (error.message?.includes('autenticación') ||
                error.message?.includes('authentication') ||
                error.message?.includes('Unauthorized') ||
                error.message?.includes('No access token') ||
                error.name?.includes('NotAuthorizedException') ||
                error.name?.includes('UnauthorizedException')) {
                return {
                    success: false,
                    error: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
                    needsReauth: true
                };
            }

            return {
                success: false,
                error: error.message || 'Error interno del servidor'
            };
        }
    };

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

    // ✅ Función para procesar el pago en producción
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
            console.log('💳 PRODUCCIÓN - Iniciando proceso de pedido real...');

            console.log('💳 PRODUCCIÓN - Datos del pedido:', {
                usuario: user?.email,
                total,
                itemsCount: carrito.length,
                restaurante: restauranteInfo.nombreRestaurante
            });

            // ✅ Crear pedido real en AppSync
            const resultado = await crearPedidoProduccion();

            if (resultado.success) {
                console.log('✅ PRODUCCIÓN - Pedido creado exitosamente:', resultado);

                Alert.alert(
                    '🎉 ¡Pedido realizado exitosamente!',
                    `Tu pedido ${resultado.numeroOrden} ha sido enviado a ${restauranteInfo.nombreRestaurante}. \n\nEl restaurante recibirá la notificación y comenzará a preparar tu orden.`,
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
                console.error('❌ PRODUCCIÓN - Error en el pedido:', resultado.error);

                // ✅ MANEJO ESPECÍFICO: Error de autenticación
                if (resultado.needsReauth) {
                    Alert.alert(
                        'Sesión Expirada',
                        'Tu sesión ha expirado. Inicia sesión nuevamente para continuar.',
                        [
                            {
                                text: 'Iniciar Sesión',
                                onPress: () => router.replace('/(auth)/iniciaSesion')
                            },
                            {
                                text: 'Cancelar',
                                style: 'cancel'
                            }
                        ]
                    );
                } else {
                    Alert.alert(
                        'Error al procesar pedido',
                        resultado.error || 'Ha ocurrido un error inesperado. Intenta nuevamente.',
                        [
                            {
                                text: 'Reintentar',
                                onPress: () => confirmarPedido()
                            },
                            {
                                text: 'Cancelar',
                                style: 'cancel'
                            }
                        ]
                    );
                }
            }
        } catch (error: any) {
            console.error('❌ PRODUCCIÓN - Error inesperado:', error);

            Alert.alert(
                'Error de Conexión',
                'No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.',
                [
                    {
                        text: 'Reintentar',
                        onPress: () => confirmarPedido()
                    },
                    {
                        text: 'Cancelar',
                        style: 'cancel'
                    }
                ]
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

                {/* ✅ Información del usuario autenticado */}
                <View className="px-5 py-3 bg-green-50 border-b border-green-200">
                    <View className="flex-row items-center">
                        <User size={16} color="#059669" />
                        <Text className="text-green-800 font-JakartaBold text-sm ml-2">
                            Pedido para: {user?.email}
                        </Text>
                    </View>
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

                        <View className="mt-4 p-3 bg-green-50 rounded-xl">
                            <Text className="text-green-800 font-JakartaBold text-sm mb-1">
                                🚀 Sistema Real
                            </Text>
                            <Text className="text-green-700 font-JakartaMedium text-xs">
                                Este pedido se enviará en tiempo real al restaurante a través de AWS AppSync y DynamoDB.
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
                                    Enviando a restaurante...
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

                    {/* ✅ Info de producción */}
                    {__DEV__ && (
                        <View className="mt-4 p-3 bg-green-50 rounded-xl">
                            <Text className="text-green-800 font-JakartaBold text-sm mb-1">
                                🚀 PRODUCCIÓN - AppSync + DynamoDB
                            </Text>
                            <Text className="text-green-700 font-JakartaMedium text-xs">
                                Usuario: {user?.email} | GraphQL Client: Activo
                            </Text>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </>
    );
};

// ✅ Función para generar número de orden
function generateShortOrderNumber(): string {
    const timestamp = Date.now();
    const shortTimestamp = timestamp % 1000000;
    const random = Math.floor(Math.random() * 1000);

    const timestampHex = shortTimestamp.toString(16).toUpperCase().padStart(5, '0');
    const randomHex = random.toString(16).toUpperCase().padStart(3, '0');

    const part1 = timestampHex.substring(0, 3);
    const part2 = timestampHex.substring(3, 5);
    const part3 = randomHex;

    return `#${part1}${part2}-${part3}`;
}

export default PagoPlato;