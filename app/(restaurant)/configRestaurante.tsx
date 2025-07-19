/* eslint-disable prettier/prettier */
import { Text, TouchableOpacity, View, FlatList, Image, Switch, Alert, ActivityIndicator } from "react-native";
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useRestaurantes, type Plato } from '@/hooks/useRestaurantes';
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Star, Clock, Save, RefreshCw } from "lucide-react-native";

const ConfigRestaurante = () => {
    const { user, verificarSesion } = useAuth();
    const { obtenerRestaurantePorId, guardarCambiosDisponibilidad, obtenerDisponibilidadPlatos } = useRestaurantes();

    // Estados del componente
    const [restauranteData, setRestauranteData] = useState<any>(null);
    const [platosDisponibles, setPlatosDisponibles] = useState<{ [key: number]: boolean }>({});
    const [disponibilidadOriginal, setDisponibilidadOriginal] = useState<{ [key: number]: boolean }>({});
    const [cambiosRealizados, setCambiosRealizados] = useState(false);
    const [guardando, setGuardando] = useState(false);

    // ✅ Verificar sesión al cargar el componente - IGUAL QUE EN HOME
    useEffect(() => {
        verificarSesion();
    }, []);

    // ✅ Cargar datos del restaurante - MISMA LÓGICA QUE EN HOME
    useEffect(() => {
        if (user?.restaurantInfo?.restauranteId) {
            const timer = setTimeout(() => {
                const restaurante = obtenerRestaurantePorId(user.restaurantInfo!.restauranteId);
                setRestauranteData(restaurante);

                // Cargar disponibilidad actual (local + original)
                if (restaurante?.menu) {
                    const disponibilidadActual = obtenerDisponibilidadPlatos(user.restaurantInfo!.restauranteId);
                    setPlatosDisponibles(disponibilidadActual);
                    setDisponibilidadOriginal(disponibilidadActual);

                    console.log('📊 Disponibilidad cargada en config:', disponibilidadActual);
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [user]);

    // Función para cambiar disponibilidad de un plato
    const toggleDisponibilidadPlato = (idPlato: number) => {
        setPlatosDisponibles(prev => {
            const nuevaDisponibilidad = {
                ...prev,
                [idPlato]: !prev[idPlato]
            };

            // Verificar cambios comparando con disponibilidad original
            const hayCambios = Object.keys(nuevaDisponibilidad).some(
                platoId => nuevaDisponibilidad[parseInt(platoId)] !== disponibilidadOriginal[parseInt(platoId)]
            );

            setCambiosRealizados(hayCambios);
            console.log('🔄 Toggle plato:', idPlato, 'Nueva disponibilidad:', !prev[idPlato], 'Hay cambios:', hayCambios);

            return nuevaDisponibilidad;
        });
    };

    // Función para guardar cambios
    const guardarCambios = async () => {
        if (!user?.restaurantInfo || !cambiosRealizados) return;

        setGuardando(true);

        try {
            console.log('💾 Guardando cambios de disponibilidad...');

            // Guardar todos los cambios usando la función integrada
            const success = await guardarCambiosDisponibilidad(
                user.restaurantInfo.restauranteId,
                platosDisponibles
            );

            if (success) {
                // Identificar cambios específicos para el mensaje
                const platosModificados: Array<{ plato: string, estado: string }> = [];

                Object.keys(platosDisponibles).forEach(platoIdStr => {
                    const platoId = parseInt(platoIdStr);
                    const nuevaDisponibilidad = platosDisponibles[platoId];
                    const disponibilidadOriginalPlato = disponibilidadOriginal[platoId];

                    if (nuevaDisponibilidad !== disponibilidadOriginalPlato) {
                        const plato = restauranteData.menu.find((p: any) => p.idPlato === platoId);
                        platosModificados.push({
                            plato: plato?.nombre || `Plato ${platoId}`,
                            estado: nuevaDisponibilidad ? 'disponible' : 'no disponible'
                        });
                    }
                });

                // Actualizar estado original con los nuevos valores
                setDisponibilidadOriginal({ ...platosDisponibles });
                setCambiosRealizados(false);

                // Mostrar confirmación
                if (platosModificados.length > 0) {
                    const resumenCambios = platosModificados
                        .map(cambio => `• ${cambio.plato}: ${cambio.estado}`)
                        .join('\n');

                    Alert.alert(
                        '✅ Cambios guardados exitosamente',
                        `Se actualizaron ${platosModificados.length} plato(s):\n\n${resumenCambios}\n\nLos estudiantes verán estos cambios inmediatamente.`,
                        [
                            {
                                text: 'Ver vista previa',
                                onPress: () => router.push('/(restaurant)/viewRestaurante')
                            },
                            {
                                text: 'Continuar editando',
                                style: 'cancel'
                            }
                        ]
                    );
                } else {
                    Alert.alert('✅ Guardado', 'Configuración actualizada correctamente.');
                }
            } else {
                throw new Error('Error al guardar en AsyncStorage');
            }

        } catch (error) {
            console.error('❌ Error guardando cambios:', error);
            Alert.alert(
                'Error al guardar',
                'No se pudieron guardar los cambios. Intenta nuevamente.',
                [{ text: 'OK' }]
            );
        } finally {
            setGuardando(false);
        }
    };

    // Función para descartar cambios
    const descartarCambios = () => {
        if (!cambiosRealizados) return;

        Alert.alert(
            'Descartar cambios',
            '¿Estás seguro de que quieres descartar todos los cambios realizados?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Descartar',
                    style: 'destructive',
                    onPress: () => {
                        // Restaurar a la disponibilidad original
                        setPlatosDisponibles({ ...disponibilidadOriginal });
                        setCambiosRealizados(false);
                        console.log('🔄 Cambios descartados, restaurando a:', disponibilidadOriginal);
                    }
                }
            ]
        );
    };

    // Función para agrupar platos por categoría
    const agruparPorCategoria = () => {
        if (!restauranteData?.menu) return {};

        const grupos: { [key: string]: Plato[] } = {};
        restauranteData.menu.forEach((plato: any) => {
            const categoria = plato.categoria;
            if (!grupos[categoria]) {
                grupos[categoria] = [];
            }
            grupos[categoria].push(plato);
        });
        return grupos;
    };

    // Función para formatear precio
    const formatearPrecio = (precio: number) => {
        return `${precio.toLocaleString('es-CO')}`;
    };

    // Pantalla de carga
    if (!user?.restaurantInfo?.restauranteId || !restauranteData) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center px-8">
                    <Text className="text-2xl mb-4">🔄</Text>
                    <Text className="text-xl text-center mb-2">
                        Cargando información del restaurante...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex h-full bg-white">
            {/* Header con imagen de fondo */}
            <View className="relative w-full pt-12 pb-6 px-5">
                <View className="absolute inset-0">
                    <Image
                        source={restauranteData.imagen}
                        className="w-full h-full"
                        resizeMode="cover"
                        style={{
                            opacity: 0.3,
                            borderBottomLeftRadius: 30,
                            borderBottomRightRadius: 30
                        }}
                    />
                </View>

                <View className="relative mb-4 h-12">
                    <TouchableOpacity
                        onPress={() => {
                            if (cambiosRealizados) {
                                descartarCambios();
                            } else {
                                router.back();
                            }
                        }}
                        className="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center z-10"
                    >
                        <ArrowLeft size={24} color="#132e3c" />
                    </TouchableOpacity>

                    <View className="absolute left-0 right-0 top-0 flex items-center justify-center z-10">
                        <Text className="text-[#132e3c] font-JakartaExtraBold text-3xl text-center absolute top-6 opacity-90">
                            Configurar menú
                        </Text>
                    </View>
                </View>

                <View
                    className="bg-[#132e3c] px-16 py-4 rounded-full self-center relative z-10 p-4 mt-4"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 4,
                    }}
                >
                    <View className="flex-row items-center justify-between">
                        <View className="items-center">
                            <Text className="text-white text-sm font-JakartaBold mb-2">
                                Calificación
                            </Text>
                            <View className="flex-row items-center">
                                <Star size={12} color="#FFFFFF"></Star>
                                <Text className="text-white text-lg font-JakartaExtraLight ml-2">
                                    {restauranteData.calificacionRestaurante}
                                </Text>
                            </View>
                        </View>

                        <View style={{ width: 60 }}></View>

                        <View className="items-center">
                            <Text className="text-white text-sm font-JakartaBold mb-2">
                                Entrega
                            </Text>
                            <View className="flex-row items-center">
                                <Clock size={12} color="#FFFFFF"></Clock>
                                <Text className="text-white text-lg font-JakartaExtraLight ml-2">
                                    {restauranteData.tiempoEntrega} min
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Barra de categorías */}
            <View className="px-10 bg-[#132e3c] items-center justify-center">
                <Text className="text-white font-JakartaExtraBold m-4">
                    {restauranteData.categorias.join(' • ')}
                </Text>
            </View>

            {/* Lista del menú */}
            <View className="flex-1 px-5 pt-2 bg-white">
                <FlatList
                    data={Object.entries(agruparPorCategoria())}
                    keyExtractor={([categoria]) => categoria}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: [categoria, platos] }) => (
                        <View className="mb-6">
                            <Text className="text-[#132e3c] text-xl font-JakartaBold mb-4 ml-2">
                                {Object.keys(agruparPorCategoria()).indexOf(categoria) + 1}. {categoria}
                            </Text>

                            <FlatList
                                data={platos}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(plato) => plato.idPlato.toString()}
                                contentContainerStyle={{ paddingHorizontal: 8 }}
                                renderItem={({ item: plato }) => (
                                    <View
                                        className="bg-white rounded-xl mr-4 shadow-sm border border-gray-100 relative"
                                        style={{
                                            width: 160,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.1,
                                            shadowRadius: 4,
                                            elevation: 3,
                                        }}
                                    >
                                        {/* Imagen del plato */}
                                        <View className="h-32 bg-gray-200 rounded-t-xl mb-3 relative">
                                            <View className="absolute inset-0 bg-gray-300 rounded-t-xl flex items-center justify-center">
                                                <Image source={plato.imagen} className="w-full h-full rounded-t-xl" />
                                            </View>

                                            {/* Overlay de no disponible */}
                                            {!platosDisponibles[plato.idPlato] && (
                                                <View className="absolute inset-0 bg-black opacity-60 rounded-t-xl flex items-center justify-center">
                                                    <Text className="text-white font-JakartaBold text-sm">Agotado</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Información del plato */}
                                        <View className="px-3 pb-4 items-center justify-center">
                                            <Text className="text-[#132e3c] text-base font-JakartaExtraBold mb-1" numberOfLines={2}>
                                                {plato.nombre}
                                            </Text>

                                            <Text className="text-[#132e3c] text-lg font-JakartaLight mb-3">
                                                {formatearPrecio(plato.precio)}
                                            </Text>

                                            {/* Switch de disponibilidad */}
                                            <View className="flex-row items-center">
                                                <Switch
                                                    value={platosDisponibles[plato.idPlato]}
                                                    onValueChange={() => toggleDisponibilidadPlato(plato.idPlato)}
                                                    trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                                                    thumbColor={platosDisponibles[plato.idPlato] ? '#FFFFFF' : '#FFFFFF'}
                                                    ios_backgroundColor="#E5E7EB"
                                                />
                                                <Text className={`ml-2 text-xs font-JakartaBold ${platosDisponibles[plato.idPlato] ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {platosDisponibles[plato.idPlato] ? 'Disponible' : 'Agotado'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                            />
                        </View>
                    )}
                />
            </View>

            {/* Footer fijo con botones de acción */}
            {cambiosRealizados && (
                <View className="bg-white border-t border-gray-200 px-5 py-4">
                    {/* Mensaje de cambios pendientes */}
                    <View className="mb-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                        <Text className="text-yellow-800 font-JakartaBold text-sm text-center">
                            ⚠️ Hay cambios sin guardar
                        </Text>
                        <Text className="text-yellow-700 font-JakartaMedium text-xs text-center mt-1">
                            Los estudiantes verán los cambios después de guardar
                        </Text>
                    </View>

                    {/* Botones de acción */}
                    <View className="flex-row space-x-3">
                        {/* Botón descartar */}
                        <TouchableOpacity
                            onPress={descartarCambios}
                            disabled={guardando}
                            className="flex-1 py-3 rounded-xl border-2 border-gray-300 flex-row items-center justify-center"
                        >
                            <RefreshCw size={18} color="#6B7280" />
                            <Text className="text-gray-600 font-JakartaBold text-base ml-2">
                                Descartar
                            </Text>
                        </TouchableOpacity>

                        {/* Botón guardar */}
                        <TouchableOpacity
                            onPress={guardarCambios}
                            disabled={guardando}
                            className={`flex-2 py-3 rounded-xl flex-row items-center justify-center ${guardando ? 'bg-gray-400' : 'bg-[#132e3c]'
                                }`}
                            style={{
                                flex: 2,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 4,
                            }}
                        >
                            {guardando ? (
                                <>
                                    <ActivityIndicator size="small" color="white" />
                                    <Text className="text-white font-JakartaBold text-base ml-2">
                                        Guardando...
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Save size={18} color="white" />
                                    <Text className="text-white font-JakartaBold text-base ml-2">
                                        Guardar cambios
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

export default ConfigRestaurante;