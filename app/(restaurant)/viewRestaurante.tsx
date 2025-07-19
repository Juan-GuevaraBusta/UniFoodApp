/* eslint-disable prettier/prettier */
import { Text, TouchableOpacity, View, FlatList, Image, Alert } from "react-native";
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useRestaurantes, type Plato } from '@/hooks/useRestaurantes';
import { useAuth } from "@/hooks/useAuth";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Star, Clock, Eye, Home, Settings } from "lucide-react-native";

const ViewRestaurante = () => {
    const { user, verificarSesion } = useAuth();
    const { obtenerRestaurantePorId } = useRestaurantes();

    // Estados del componente
    const [restauranteData, setRestauranteData] = useState<any>(null);
    const [itemsMenu, setItemsMenu] = useState<Plato[]>([]);

    // ✅ Verificar sesión al cargar el componente - IGUAL QUE EN HOME
    useEffect(() => {
        verificarSesion();
    }, []);

    // ✅ Cargar datos del restaurante - MISMA LÓGICA QUE EN HOME Y CONFIG
    useEffect(() => {
        if (user?.restaurantInfo?.restauranteId) {
            const timer = setTimeout(() => {
                const restaurante = obtenerRestaurantePorId(user.restaurantInfo!.restauranteId);
                setRestauranteData(restaurante);

                if (restaurante?.menu) {
                    setItemsMenu(restaurante.menu);
                    console.log('👀 Vista previa cargada para restaurante:', restaurante.nombreRestaurante);
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [user]);

    // Función para simular selección de plato (solo muestra info)
    const mostrarInfoPlato = (plato: Plato) => {
        if (!plato.disponible) {
            Alert.alert(
                'Plato no disponible',
                `${plato.nombre} está marcado como agotado. Los estudiantes verán este mensaje y no podrán agregarlo al carrito.`,
                [{ text: 'Entendido' }]
            );
        } else {
            Alert.alert(
                'Vista previa del plato',
                `Los estudiantes pueden agregar "${plato.nombre}" al carrito por ${formatearPrecio(plato.precio)}.`,
                [
                    {
                        text: 'Ver configuración',
                        onPress: () => router.push('/(restaurant)/configRestaurante')
                    },
                    {
                        text: 'Cerrar',
                        style: 'cancel'
                    }
                ]
            );
        }
    };

    // Función para agrupar platos por categoría
    const agruparPorCategoria = () => {
        const grupos: { [key: string]: Plato[] } = {};

        itemsMenu.forEach(plato => {
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
        return `$${precio.toLocaleString('es-CO')}`;
    };

    // Pantalla de carga - MISMA LÓGICA QUE EN HOME
    if (!user?.restaurantInfo?.restauranteId || !restauranteData) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <View className="flex-1 justify-center items-center px-8">
                    <Text className="text-2xl mb-4">🔄</Text>
                    <Text className="text-xl text-center mb-2">
                        Cargando vista previa del restaurante...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const restaurantInfo = user.restaurantInfo;

    return (
        <SafeAreaView className="flex h-full bg-white">
            {/* Header con imagen de fondo - IGUAL QUE menuRestaurante */}
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
                    {/* Botón atrás */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center z-10"
                    >
                        <ArrowLeft size={24} color="#132e3c" />
                    </TouchableOpacity>

                    {/* Botón de configuración en lugar del carrito */}
                    <TouchableOpacity
                        onPress={() => router.push('/(restaurant)/configRestaurante')}
                        className="absolute right-0 top-0 w-12 h-12 rounded-full bg-[#132e3c] flex items-center justify-center z-10"
                    >
                        <Settings size={20} color="white" />
                    </TouchableOpacity>

                    {/* Nombre del restaurante */}
                    <View className="absolute left-0 right-0 top-0 flex items-center justify-center z-10">
                        <Text className="text-[#132e3c] font-JakartaExtraBold text-5xl text-center absolute top-6 opacity-90">
                            {restaurantInfo.nombreRestaurante}
                        </Text>
                    </View>
                </View>

                {/* Caja de información del restaurante */}
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

            {/* Información de vista previa */}
            <View className="px-5 py-4 bg-blue-50 border-b border-blue-200">
                <View className="flex-row items-center">
                    <Eye size={20} color="#3B82F6" />
                    <Text className="text-blue-800 font-JakartaBold text-base ml-3 flex-1">
                        Vista previa del estudiante
                    </Text>
                </View>
                <Text className="text-blue-600 font-JakartaMedium text-sm mt-1 ml-8">
                    Así es como los estudiantes ven tu restaurante
                </Text>
            </View>

            {/* Lista del menú - IGUAL QUE menuRestaurante pero con funcionalidad adaptada */}
            <View className="flex-1 px-5 pt-2 bg-white">
                <FlatList
                    data={Object.entries(agruparPorCategoria())}
                    keyExtractor={([categoria]) => categoria}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item: [categoria, platos] }) => (
                        <View className="mb-6">
                            <Text className="text-[#132e3c] text-xl font-JakartaBold mb-4 ml-2">
                                {categoria}
                            </Text>

                            <FlatList
                                data={platos}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(plato) => plato.idPlato.toString()}
                                contentContainerStyle={{ paddingHorizontal: 8 }}
                                renderItem={({ item: plato }) => (
                                    <TouchableOpacity
                                        onPress={() => mostrarInfoPlato(plato)}
                                        disabled={!plato.disponible} // ✅ Deshabilitar si no está disponible
                                        className={`bg-white rounded-xl mr-4 shadow-sm border border-gray-100 ${!plato.disponible ? 'opacity-60' : '' // ✅ Reducir opacidad si no está disponible
                                            }`}
                                        style={{
                                            width: 160,
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: plato.disponible ? 0.1 : 0.05,
                                            shadowRadius: 4,
                                            elevation: plato.disponible ? 3 : 1,
                                        }}
                                    >
                                        {/* Imagen del plato */}
                                        <View className="h-32 bg-gray-200 rounded-t-xl mb-3 relative">
                                            <View className="absolute inset-0 bg-gray-300 rounded-t-xl flex items-center justify-center">
                                                <Image
                                                    source={plato.imagen}
                                                    className="w-full h-full rounded-t-xl"
                                                    style={{
                                                        opacity: plato.disponible ? 1 : 0.5
                                                    }}
                                                />
                                            </View>

                                            {/* ✅ Overlay de agotado */}
                                            {!plato.disponible && (
                                                <View className="absolute inset-0 bg-black bg-opacity-60 rounded-t-xl flex items-center justify-center">
                                                    <View className="bg-red-500 px-3 py-1 rounded-full">
                                                        <Text className="text-white font-JakartaBold text-xs">
                                                            AGOTADO
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}

                                            {/* ✅ Icono de vista previa en lugar del + */}
                                            {plato.disponible && (
                                                <TouchableOpacity
                                                    className="absolute top-2 right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center"
                                                    onPress={() => mostrarInfoPlato(plato)}
                                                >
                                                    <Eye size={16} color="white" />
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {/* Información del plato */}
                                        <View className="px-3 pb-4 items-center justify-center">
                                            <Text
                                                className={`text-base font-JakartaExtraBold mb-1 text-center ${plato.disponible ? 'text-[#132e3c]' : 'text-gray-500'
                                                    }`}
                                                numberOfLines={2}
                                            >
                                                {plato.nombre}
                                            </Text>

                                            <Text
                                                className={`text-lg font-JakartaLight ${plato.disponible ? 'text-[#132e3c]' : 'text-gray-400'
                                                    }`}
                                            >
                                                {formatearPrecio(plato.precio)}
                                            </Text>

                                            {/* ✅ Mensaje de no disponible */}
                                            {!plato.disponible && (
                                                <Text className="text-red-500 font-JakartaBold text-xs mt-1 text-center">
                                                    No disponible
                                                </Text>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    )}
                />
            </View>

            {/* Footer con acciones rápidas */}
            <View className="bg-white border-t border-gray-200 px-5 py-4">
                <View className="flex-row space-x-3">
                    {/* Botón Panel Principal */}
                    <TouchableOpacity
                        onPress={() => router.push("/(restaurant)/(tabs)/home")}
                        className="flex-1 py-3 rounded-xl border-2 border-[#132e3c] flex-row items-center justify-center"
                    >
                        <Home size={18} color="#132e3c" />
                        <Text className="text-[#132e3c] font-JakartaBold text-base ml-2">
                            Panel Principal
                        </Text>
                    </TouchableOpacity>

                    {/* Botón Configurar */}
                    <TouchableOpacity
                        onPress={() => router.push('/(restaurant)/configRestaurante')}
                        className="flex-1 py-3 rounded-xl bg-[#132e3c] flex-row items-center justify-center"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 4,
                            elevation: 4,
                        }}
                    >
                        <Settings size={18} color="white" />
                        <Text className="text-white font-JakartaBold text-base ml-2">
                            Configurar
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Información adicional */}
                <View className="mt-4 p-3 bg-green-50 rounded-xl">
                    <Text className="text-green-800 font-JakartaBold text-sm mb-1">
                        ✅ Vista previa activa
                    </Text>
                    <Text className="text-green-700 font-JakartaMedium text-xs">
                        Esta es exactamente la vista que tienen los estudiantes cuando navegan por tu restaurante
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ViewRestaurante;