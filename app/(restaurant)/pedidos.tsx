import { Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, ClipboardList } from "lucide-react-native";

const PedidosRestaurante = () => {
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
                <Text className="text-[#132e3c] text-xl font-JakartaBold">Pedidos</Text>
                <View className="w-10" />
            </View>

            {/* Contenido */}
            <View className="flex-1 justify-center items-center px-8">
                <View className="w-20 h-20 bg-[#132e3c] rounded-full items-center justify-center mb-6">
                    <ClipboardList size={40} color="white" />
                </View>

                <Text className="text-[#132e3c] text-2xl font-JakartaBold text-center mb-2">
                    Gestión de Pedidos
                </Text>

                <Text className="text-gray-600 font-JakartaMedium text-center mb-2">
                    {user?.restaurantInfo?.nombreRestaurante}
                </Text>

                <Text className="text-gray-500 font-JakartaMedium text-center mb-8">
                    Funcionalidad en desarrollo
                </Text>

                <TouchableOpacity
                    onPress={() => router.push("/(restaurant)/home")}
                    className="bg-[#132e3c] px-8 py-4 rounded-xl"
                >
                    <Text className="text-white font-JakartaBold text-base">
                        Volver al Panel Principal
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default PedidosRestaurante;