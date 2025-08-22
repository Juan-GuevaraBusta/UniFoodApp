import { useAuth } from '@/hooks/useAuth';
import { useBackgroundPedidosMonitor } from '@/hooks/useBackgroundPedidosMonitor';
import { useNotifications } from '@/hooks/useNotifications';
import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TestNotifications = () => {
    const { sendLocalNotification, expoPushToken } = useNotifications();
    const { user } = useAuth();
    const { isMonitoring, iniciarMonitoreo, detenerMonitoreo, lastPedidos } = useBackgroundPedidosMonitor();

    const testNotification = (title: string, body: string) => {
        try {
            sendLocalNotification(title, body, {
                type: 'test',
                timestamp: new Date().toISOString()
            });
            Alert.alert('✅ Notificación Enviada', `${title}\n\n${body}`);
        } catch (error) {
            console.error('❌ Error enviando notificación:', error);
            Alert.alert('❌ Error', 'No se pudo enviar la notificación');
        }
    };

    const testOrderNotifications = () => {
        // Simular diferentes estados de pedido
        const estados = [
            { estado: 'aceptado', titulo: '✅ Pedido Aceptado', mensaje: 'Tu pedido #TEST-001 ha sido aceptado y está siendo preparado.' },
            { estado: 'preparando', titulo: '👨‍🍳 Pedido en Preparación', mensaje: 'Tu pedido #TEST-001 está siendo preparado. ¡Pronto estará listo!' },
            { estado: 'listo', titulo: '🎉 ¡Tu Pedido Está Listo!', mensaje: 'Tu pedido #TEST-001 está listo para recoger. ¡Ve al restaurante!' },
            { estado: 'entregado', titulo: '📦 Pedido Entregado', mensaje: 'Tu pedido #TEST-001 ha sido entregado. ¡Disfruta tu comida!' }
        ];

        estados.forEach((test, index) => {
            setTimeout(() => {
                testNotification(test.titulo, test.mensaje);
            }, index * 2000); // Enviar cada 2 segundos
        });
    };

    const testMonitoring = async () => {
        try {
            console.log('🧪 TEST - Iniciando prueba de monitoreo...');
            await iniciarMonitoreo();
            Alert.alert('✅ Prueba Iniciada', 'Monitoreo iniciado manualmente. Revisa la consola para ver los logs.');
        } catch (error) {
            console.error('❌ TEST - Error en prueba de monitoreo:', error);
            Alert.alert('❌ Error', 'No se pudo iniciar la prueba de monitoreo');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView className="flex-1 px-5 py-6">
                {/* Header */}
                <View className="mb-6">
                    <Text className="text-2xl font-JakartaBold text-[#132e3c] mb-2">
                        🔔 Prueba de Notificaciones
                    </Text>
                    <Text className="text-gray-600 font-JakartaMedium">
                        Prueba el sistema de notificaciones de la aplicación
                    </Text>
                </View>

                {/* Estado del sistema */}
                <View className="bg-blue-50 rounded-xl p-4 mb-6">
                    <Text className="text-blue-800 font-JakartaBold text-lg mb-3">
                        📊 Estado del Sistema
                    </Text>

                    <View className="space-y-2">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-blue-700 font-JakartaMedium">Notificaciones Locales:</Text>
                            <Text className="text-green-600 font-JakartaMedium text-xs">
                                ✅ Disponibles
                            </Text>
                        </View>

                        <View className="flex-row items-center justify-between">
                            <Text className="text-blue-700 font-JakartaMedium">Usuario:</Text>
                            <Text className="text-blue-600 font-JakartaMedium text-xs">
                                {user?.email || 'No autenticado'}
                            </Text>
                        </View>

                        <View className="flex-row items-center justify-between">
                            <Text className="text-blue-700 font-JakartaMedium">Monitoreo en Segundo Plano:</Text>
                            <Text className={`font-JakartaMedium text-xs ${isMonitoring ? 'text-green-600' : 'text-red-600'}`}>
                                {isMonitoring ? '🟢 Activo' : '🔴 Inactivo'}
                            </Text>
                        </View>

                        <View className="flex-row items-center justify-between">
                            <Text className="text-blue-700 font-JakartaMedium">Pedidos Monitoreados:</Text>
                            <Text className="text-blue-600 font-JakartaMedium text-xs">
                                {lastPedidos.length} pedidos
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Pruebas básicas */}
                <View className="mb-6">
                    <Text className="text-lg font-JakartaBold text-[#132e3c] mb-3">
                        🧪 Pruebas Básicas
                    </Text>

                    <TouchableOpacity
                        onPress={() => testNotification('🔔 Prueba Simple', 'Esta es una notificación de prueba básica.')}
                        className="bg-blue-500 p-4 rounded-xl mb-3"
                    >
                        <Text className="text-white font-JakartaBold text-center">
                            Enviar Notificación Simple
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => testNotification('🎉 ¡Éxito!', '¡La operación se completó exitosamente!')}
                        className="bg-green-500 p-4 rounded-xl mb-3"
                    >
                        <Text className="text-white font-JakartaBold text-center">
                            Notificación de Éxito
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => testNotification('⚠️ Advertencia', 'Hay algo que debes revisar.')}
                        className="bg-yellow-500 p-4 rounded-xl mb-3"
                    >
                        <Text className="text-white font-JakartaBold text-center">
                            Notificación de Advertencia
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => testNotification('❌ Error', 'Ocurrió un error inesperado.')}
                        className="bg-red-500 p-4 rounded-xl"
                    >
                        <Text className="text-white font-JakartaBold text-center">
                            Notificación de Error
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Pruebas de monitoreo */}
                <View className="mb-6">
                    <Text className="text-lg font-JakartaBold text-[#132e3c] mb-3">
                        🔍 Pruebas de Monitoreo
                    </Text>

                    <TouchableOpacity
                        onPress={testMonitoring}
                        className="bg-purple-500 p-4 rounded-xl mb-3"
                    >
                        <Text className="text-white font-JakartaBold text-center">
                            🧪 Probar Monitoreo Manual
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            detenerMonitoreo();
                            Alert.alert('✅ Detenido', 'Monitoreo detenido manualmente');
                        }}
                        className="bg-orange-500 p-4 rounded-xl mb-3"
                    >
                        <Text className="text-white font-JakartaBold text-center">
                            🛑 Detener Monitoreo
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            console.log('📋 DEBUG - Pedidos actuales:', lastPedidos);
                            Alert.alert('📋 Debug', `Pedidos monitoreados: ${lastPedidos.length}\nRevisa la consola para más detalles.`);
                        }}
                        className="bg-gray-500 p-4 rounded-xl"
                    >
                        <Text className="text-white font-JakartaBold text-center">
                            📋 Ver Pedidos Monitoreados
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Pruebas de pedidos */}
                <View className="mb-6">
                    <Text className="text-lg font-JakartaBold text-[#132e3c] mb-3">
                        🍽️ Pruebas de Pedidos
                    </Text>

                    <TouchableOpacity
                        onPress={testOrderNotifications}
                        className="bg-purple-500 p-4 rounded-xl mb-3"
                    >
                        <Text className="text-white font-JakartaBold text-center">
                            Simular Secuencia de Estados de Pedido
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => testNotification('🍽️ ¡Nuevo Pedido Creado!', 'Tu pedido #TEST-002 ha sido enviado al restaurante.')}
                        className="bg-orange-500 p-4 rounded-xl"
                    >
                        <Text className="text-white font-JakartaBold text-center">
                            Simular Nuevo Pedido
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Información adicional */}
                <View className="bg-gray-50 rounded-xl p-4">
                    <Text className="text-gray-800 font-JakartaBold text-sm mb-2">
                        ℹ️ Información
                    </Text>
                    <Text className="text-gray-600 font-JakartaMedium text-xs leading-5">
                        • Las notificaciones locales funcionan inmediatamente{'\n'}
                        • El monitoreo en segundo plano se ejecuta cada 30 segundos{'\n'}
                        • RESTAURANTE: Notifica cuando recibe nuevos pedidos{'\n'}
                        • USUARIO: Notifica cuando el restaurante cambia el estado{'\n'}
                        • Estados: Aceptado, Preparando, Listo, Entregado, Cancelado{'\n'}
                        • Revisa la consola para ver logs de debug{'\n'}
                        • Usa "Probar Monitoreo Manual" para diagnosticar{'\n'}
                        • Las notificaciones push están deshabilitadas temporalmente
                    </Text>
                </View>

                {/* Espaciado inferior */}
                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default TestNotifications;
