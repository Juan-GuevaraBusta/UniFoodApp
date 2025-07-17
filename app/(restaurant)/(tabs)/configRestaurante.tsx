import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Settings, Bell, Lock, HelpCircle } from "lucide-react-native";

const ConfigRestaurante = () => {
    const { user } = useAuth();

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                >
                    <ArrowLeft size={20} color="#132e3c" />
                </TouchableOpacity>
                <Text className="text-[#132e3c] text-xl font-JakartaBold">Configuración</Text>
                <View className="w-10" />
            </View>

            <ScrollView className="flex-1 px-5 py-8">
                {/* Header del restaurante */}
                <View className="items-center mb-8">
                    <View className="w-20 h-20 bg-[#132e3c] rounded-full items-center justify-center mb-4">
                        <Settings size={40} color="white" />
                    </View>
                    <Text className="text-[#132e3c] text-2xl font-JakartaBold text-center">
                        Configuración del Restaurante
                    </Text>
                    <Text className="text-gray-600 text-base font-JakartaMedium text-center mt-2">
                        {user?.restaurantInfo?.nombreRestaurante}
                    </Text>
                </View>

                {/* Opciones de configuración */}
                <View className="space-y-4 mb-8">
                    {/* Notificaciones */}
                    <TouchableOpacity className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center">
                        <Bell size={20} color="#132e3c" />
                        <Text className="text-[#132e3c] font-JakartaBold text-base ml-3 flex-1">
                            Notificaciones
                        </Text>
                        <Text className="text-gray-400">→</Text>
                    </TouchableOpacity>

                    {/* Privacidad */}
                    <TouchableOpacity className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center">
                        <Lock size={20} color="#132e3c" />
                        <Text className="text-[#132e3c] font-JakartaBold text-base ml-3 flex-1">
                            Privacidad y Seguridad
                        </Text>
                        <Text className="text-gray-400">→</Text>
                    </TouchableOpacity>

                    {/* Ayuda */}
                    <TouchableOpacity className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center">
                        <HelpCircle size={20} color="#132e3c" />
                        <Text className="text-[#132e3c] font-JakartaBold text-base ml-3 flex-1">
                            Ayuda y Soporte
                        </Text>
                        <Text className="text-gray-400">→</Text>
                    </TouchableOpacity>
                </View>

                {/* Información de la app */}
                <View className="bg-gray-50 rounded-xl p-4 mb-8">
                    <Text className="text-[#132e3c] font-JakartaBold text-base mb-3">
                        UniFood Restaurant Panel
                    </Text>
                    <Text className="text-gray-600 font-JakartaMedium text-sm mb-2">
                        Versión: 1.0.0
                    </Text>
                    <Text className="text-gray-600 font-JakartaMedium text-sm">
                        Desarrollado por NeoDigital
                    </Text>
                </View>

                {/* Botón volver al home */}
                <TouchableOpacity
                    onPress={() => router.push("/(restaurant)/home")}
                    className="bg-[#132e3c] py-4 rounded-xl flex-row items-center justify-center"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 4,
                    }}
                >
                    <Text className="text-white font-JakartaBold text-lg">
                        Volver al Panel Principal
                    </Text>
                </TouchableOpacity>

                <View className="h-8" />
            </ScrollView>
        </SafeAreaView>
    );
};

export default ConfigRestaurante;