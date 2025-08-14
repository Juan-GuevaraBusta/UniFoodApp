/* eslint-disable prettier/prettier */
import { useAuth } from "@/hooks/useAuth";
import { useRestaurantes, type Plato } from '@/hooks/useRestaurantes';
import { useAmplifyData } from '@/hooks/useAmplifyData';
import { router } from 'expo-router';
import { ArrowLeft, Clock, RefreshCw, Star } from "lucide-react-native";
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Switch, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ConfigRestaurante = () => {
    const { user, verificarSesion } = useAuth();
    const { obtenerRestaurantePorId, guardarCambiosDisponibilidad, obtenerDisponibilidadPlatos } = useRestaurantes();
    const { actualizarDisponibilidadPlato } = useAmplifyData();

    // Estados del componente
    const [restauranteData, setRestauranteData] = useState<any>(null);
    const [platosDisponibles, setPlatosDisponibles] = useState<{ [key: number]: boolean }>({});
    const [guardando, setGuardando] = useState(false);

    // ✅ Verificar sesión al cargar el componente - IGUAL QUE EN HOME
    useEffect(() => {
        verificarSesion();
    }, []);

    // ✅ Cargar datos del restaurante - MISMA LÓGICA QUE EN HOME
    useEffect(() => {
        if (user?.restaurantInfo?.restauranteId) {
            const timer = setTimeout(async () => {
                const restaurante = obtenerRestaurantePorId(user.restaurantInfo!.restauranteId);
                setRestauranteData(restaurante);

                // Cargar disponibilidad actual desde backend
                if (restaurante?.menu) {
                    const disponibilidadActual = await obtenerDisponibilidadPlatos(user.restaurantInfo!.restauranteId);
                    setPlatosDisponibles(disponibilidadActual);
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [user]);

    // Función para cambiar disponibilidad de un plato - ACTUALIZA EN TIEMPO REAL
    const toggleDisponibilidadPlato = async (idPlato: number) => {
        if (!user?.restaurantInfo?.restauranteId) return;

        const nuevaDisponibilidad = !platosDisponibles[idPlato];

        try {
            // ✅ Actualizar en backend inmediatamente
            const resultado = await actualizarDisponibilidadPlato(
                idPlato.toString(),
                user.restaurantInfo.restauranteId.toString(),
                nuevaDisponibilidad
            );

            if (resultado.success) {
                // ✅ Actualizar estado local
                setPlatosDisponibles(prev => ({
                    ...prev,
                    [idPlato]: nuevaDisponibilidad
                }));

                // ✅ Mostrar confirmación
                const plato = restauranteData?.menu?.find((p: any) => p.idPlato === idPlato);
                const nombrePlato = plato?.nombre || `Plato ${idPlato}`;
                const estado = nuevaDisponibilidad ? 'disponible' : 'no disponible';

                Alert.alert(
                    '✅ Actualizado',
                    `${nombrePlato} ahora está ${estado}`,
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('Error', resultado.error || 'No se pudo actualizar la disponibilidad');
            }
        } catch (error) {
            console.error('Error actualizando disponibilidad:', error);
            Alert.alert('Error', 'Ocurrió un error al actualizar la disponibilidad');
        }
    };

    // Función para recargar disponibilidad
    const guardarCambios = async () => {
        if (!user?.restaurantInfo?.restauranteId) return;

        setGuardando(true);

        try {
            // ✅ Recargar disponibilidad desde backend
            const disponibilidadActual = await obtenerDisponibilidadPlatos(user.restaurantInfo.restauranteId);
            setPlatosDisponibles(disponibilidadActual);

            Alert.alert('✅ Actualizado', 'Disponibilidad actualizada correctamente.');
        } catch (error) {
            console.error('Error recargando disponibilidad:', error);
            Alert.alert('Error', 'No se pudo actualizar la disponibilidad');
        } finally {
            setGuardando(false);
        }
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
                        onPress={() => router.back()}
                        className="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center z-10"
                    >
                        <ArrowLeft size={24} color="#132e3c" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={guardarCambios}
                        disabled={guardando}
                        className="absolute right-0 top-0 w-10 h-10 rounded-full flex items-center justify-center z-10"
                    >
                        {guardando ? (
                            <ActivityIndicator size="small" color="#132e3c" />
                        ) : (
                            <RefreshCw size={24} color="#132e3c" />
                        )}
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


        </SafeAreaView>
    );
};

export default ConfigRestaurante;