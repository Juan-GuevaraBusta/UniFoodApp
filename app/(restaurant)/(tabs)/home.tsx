/* eslint-disable prettier/prettier */
import { Text, View, TouchableOpacity, ScrollView, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { useRestaurantes } from "@/hooks/useRestaurantes";

const RestaurantHome = () => {
    const { user, verificarSesion } = useAuth();
    const { obtenerRestaurantePorId } = useRestaurantes();
    const [restauranteData, setRestauranteData] = useState<any>(null);

    // Verificar sesión al cargar el componente
    useEffect(() => {
        verificarSesion();
    }, []);

    useEffect(() => {
        if (user?.restaurantInfo?.restauranteId) {
            const timer = setTimeout(() => {
                const restaurante = obtenerRestaurantePorId(user.restaurantInfo!.restauranteId);
                setRestauranteData(restaurante);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [user]);

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

    const restaurantInfo = user.restaurantInfo;

    // Datos de las opciones del panel de restaurante
    const opcionesRestaurante = [
        {
            id: 1,
            titulo: "Ver Restaurante",
            subtitulo: "Imagen, restaurante con opcidad",
            descripcion: "Vista previa como la ven los estudiantes",
            ruta: "/(restaurant)/viewRestaurante",
            imagen: restauranteData.imagen
        },
        {
            id: 2,
            titulo: "Configuración",
            subtitulo: "Imagen, restaurante con opcidad",
            descripcion: "Gestionar menú y disponibilidad",
            ruta: "/(restaurant)/configRestaurante",
            imagen: restauranteData.imagen
        },
        {
            id: 3,
            titulo: "Pedidos Activos",
            subtitulo: "Imagen, restaurante con opcidad",
            descripcion: "Gestionar pedidos en tiempo real",
            ruta: "/(restaurant)/pedidosRestaurante",
            imagen: restauranteData.imagen
        },
        {
            id: 4,
            titulo: "Historial",
            subtitulo: "Imagen, restaurante con opcidad",
            descripcion: "Ver estadísticas y pedidos pasados",
            ruta: "/(restaurant)/historialPedidos",
            imagen: restauranteData.imagen
        }
    ];

    const seleccionarOpcion = (opcion: any) => {
        router.push(opcion.ruta);
    };

    return (
        <SafeAreaView className="flex h-full bg-white">
            {/* Header - Información del restaurante */}
            <View className="w-full flex justify-start items-start p-5 border-b border-gray-200">
                <View className="bg-[#132e3c] p-4 rounded-full w-full">
                    <View className="flex-row items-center justify-between">
                        <View>
                            <Text className="text-white text-lg font-JakartaBold">
                                {restaurantInfo.nombreRestaurante}
                            </Text>
                            <Text className="text-gray-300 text-sm font-Jakarta">
                                Panel de administración
                            </Text>
                        </View>
                        <Text className="text-white text-xl">👨‍💼</Text>
                    </View>
                </View>
            </View>

            {/* Lista de opciones */}
            <View className="flex-1 p-5">
                <ScrollView showsVerticalScrollIndicator={false}>
                    {opcionesRestaurante.map((opcion) => (
                        <TouchableOpacity
                            key={opcion.id}
                            onPress={() => seleccionarOpcion(opcion)}
                            style={{
                                padding: 20,
                                borderRadius: 38,
                                marginBottom: 16,
                                borderWidth: 3,
                                borderColor: '#132e3c',
                                backgroundColor: '#132e3c',
                                overflow: 'hidden',
                                opacity: 1,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.2,
                                shadowRadius: 8,
                                elevation: 3,
                            }}
                        >
                            {/* Imagen de fondo con opacidad */}
                            {opcion.imagen && (
                                <View style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    opacity: 0.25
                                }}>
                                    <ImageBackground
                                        source={opcion.imagen}
                                        style={{ flex: 1 }}
                                        resizeMode="cover"
                                    />
                                </View>
                            )}

                            <View className="flex-row items-center justify-between">
                                <View className="flex-1">
                                    <Text style={{
                                        fontSize: 20,
                                        fontWeight: 'bold',
                                        color: '#FFFFFF',
                                        textShadowColor: 'rgba(0,0,0,0.8)',
                                        textShadowOffset: { width: 1, height: 1 },
                                        textShadowRadius: 2
                                    }}>
                                        {opcion.titulo}
                                    </Text>
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#FFFFFF',
                                        marginTop: 4,
                                        textShadowColor: 'rgba(0,0,0,0.8)',
                                        textShadowOffset: { width: 1, height: 1 },
                                        textShadowRadius: 1
                                    }}>
                                        {opcion.descripcion}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}

                    {/* Información adicional */}
                    <View className="mt-4 p-4 bg-gray-50 rounded-xl">
                        <Text className="text-[#132e3c] font-JakartaBold text-base mb-2">
                            ℹ️ Panel de Administración
                        </Text>
                        <Text className="text-gray-600 font-JakartaMedium text-sm">
                            Gestiona tu restaurante desde este panel de control.
                            Puedes actualizar tu menú, ver pedidos activos y revisar estadísticas de ventas.
                        </Text>
                    </View>

                    {/* Espaciado para los tabs */}
                    <View className="h-20" />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

export default RestaurantHome;