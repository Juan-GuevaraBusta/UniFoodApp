/* eslint-disable prettier/prettier */
import { Text, View, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { User, LogOut, Settings, Shield, Mail } from "lucide-react-native";

const Profile = () => {
  const { user, cerrarSesion } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleCerrarSesion = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Cerrar sesión",
          onPress: async () => {
            setIsLoading(true);

            try {
              const result = await cerrarSesion();

              if (result.success) {
                Alert.alert(
                  "Sesión cerrada",
                  "Has cerrado sesión exitosamente",
                  [
                    {
                      text: "OK",
                      onPress: () => router.replace("/(auth)/bienvenido")
                    }
                  ]
                );
              } else {
                Alert.alert("Error", result.error || "No se pudo cerrar la sesión");
              }
            } catch (error) {
              Alert.alert("Error", "Ocurrió un error inesperado");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };



  // Usuario autenticado
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 py-8">
        {/* Header del usuario */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-[#132e3c] rounded-full items-center justify-center mb-4">
            <User size={40} color="white" />
          </View>
          <Text className="text-[#132e3c] text-2xl font-JakartaBold text-center">
            {user?.username || 'Usuario'}
          </Text>
          <Text className="text-gray-600 text-base font-JakartaMedium text-center mt-2">
            {user?.email || 'Email no disponible'}
          </Text>

          {/* Indicador de estado */}
          <View className="bg-green-100 px-3 py-1 rounded-full mt-3">
            <Text className="text-green-700 font-JakartaBold text-sm">
              ✓ Cuenta verificada
            </Text>
          </View>
        </View>

        {/* Opciones del perfil */}
        <View className="space-y-4 mb-8">
          {/* Información de la cuenta */}
          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex-row items-center mb-3">
              <Mail size={20} color="#132e3c" />
              <Text className="text-[#132e3c] font-JakartaBold text-base ml-3">
                Información de la cuenta
              </Text>
            </View>
            <Text className="text-gray-600 font-JakartaMedium text-sm mb-2">
              Email: {user?.email || 'No disponible'}
            </Text>
            <Text className="text-gray-600 font-JakartaMedium text-sm">
              Usuario: {user?.username || 'No disponible'}
            </Text>
          </View>

          {/* Opciones de configuración */}
          <TouchableOpacity className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center">
            <Settings size={20} color="#132e3c" />
            <Text className="text-[#132e3c] font-JakartaBold text-base ml-3 flex-1">
              Configuración
            </Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center">
            <Shield size={20} color="#132e3c" />
            <Text className="text-[#132e3c] font-JakartaBold text-base ml-3 flex-1">
              Privacidad y Seguridad
            </Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
        </View>

        {/* Información de la app */}
        <View className="bg-gray-50 rounded-xl p-4 mb-8">
          <Text className="text-[#132e3c] font-JakartaBold text-base mb-3">
            UniFood App
          </Text>
          <Text className="text-gray-600 font-JakartaMedium text-sm mb-2">
            Versión: 1.0.0
          </Text>
          <Text className="text-gray-600 font-JakartaMedium text-sm">
            Desarrollado por NeoDigital
          </Text>
        </View>

        {/* Botón de cerrar sesión */}
        <TouchableOpacity
          onPress={handleCerrarSesion}
          disabled={isLoading}
          className={`py-4 rounded-xl flex-row items-center justify-center ${isLoading ? 'bg-gray-300' : 'bg-red-500'
            }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <LogOut size={20} color="white" />
          )}
          <Text className="text-white font-JakartaBold text-lg ml-3">
            {isLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
          </Text>
        </TouchableOpacity>

        {/* Espaciado inferior */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;