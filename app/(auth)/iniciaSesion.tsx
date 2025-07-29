/* eslint-disable prettier/prettier */
import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getRoleRedirectPath, getRoleDisplayName, UserRole } from "@/constants/userRoles";
import { Eye, EyeOff, Mail, Lock } from "lucide-react-native";

const iniciaSesion = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { iniciarSesion } = useAuth();

  // Solo necesitas actualizar la función handleLogin en iniciaSesion.tsx

  const handleLogin = async () => {
    // Validaciones básicas
    if (!email.trim()) {
      Alert.alert("Error", "Por favor ingresa tu email");
      return;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Por favor ingresa tu contraseña");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Por favor ingresa un email válido");
      return;
    }

    setIsLoading(true);

    try {
      console.log('🧪 DEBUGGING - Iniciando login para:', email);
      console.log('🧪 DEBUGGING - Longitud de contraseña:', password.length);

      const result = await iniciarSesion(email.trim(), password);

      console.log('🧪 DEBUGGING - Resultado completo:', result);

      if (
        result.success &&
        "role" in result &&
        typeof result.role === "string"
      ) {
        const roleDisplayName = getRoleDisplayName(result.role as UserRole);
        const redirectPath = getRoleRedirectPath(result.role as UserRole);

        Alert.alert(
          "¡Bienvenido!",
          `Has iniciado sesión como ${roleDisplayName}`,
          [
            {
              text: "Continuar",
              onPress: () => router.replace(redirectPath as any),
            },
          ]
        );
      } else {
        console.log('🧪 DEBUGGING - Error específico:', result.error);

        // Manejar error específico de confirmación
        if ("needsConfirmation" in result && result.needsConfirmation) {
          Alert.alert(
            "Cuenta no confirmada",
            result.error,
            [
              {
                text: "Confirmar ahora",
                onPress: () => router.push(`/(auth)/confirmarEmail?email=${encodeURIComponent(email.trim())}`),
              },
              {
                text: "Cancelar",
                style: "cancel",
              },
            ]
          );
        }
        // NUEVO: Manejar error de sesión ya activa
        else if ("needsManualSignOut" in result && result.needsManualSignOut) {
          Alert.alert(
            "Sesión activa detectada",
            result.error,
            [
              {
                text: "Ir a Perfil",
                onPress: () => router.push("/(root)/(tabs)/profile"),
              },
              {
                text: "Intentar de nuevo",
                onPress: () => handleLogin(), // Reintentar
              },
              {
                text: "Cancelar",
                style: "cancel",
              },
            ]
          );
        }
        else {
          Alert.alert("Error al iniciar sesión", result.error);
        }
      }
    } catch (error) {
      console.error('🧪 DEBUGGING - Error en handleLogin:', error);
      Alert.alert("Error", "Ha ocurrido un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="px-5 py-8">
          <Text className="text-[#132e3c] text-3xl font-JakartaExtraBold mb-2">
            ¡Hola de nuevo!
          </Text>
          <Text className="text-gray-600 text-base font-JakartaMedium">
            Inicia sesión para continuar con UniFud
          </Text>
        </View>

        {/* Formulario */}
        <View className="px-5 py-6">
          {/* Campo Email */}
          <View className="mb-6">
            <Text className="text-[#132e3c] text-base font-JakartaBold mb-2">
              Email
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-5 border border-gray-200">
              <Mail size={20} color="#9CA3AF" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tu.email@ejemplo.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 ml-3 text-[#132e3c] font-JakartaMedium text-base"
              />
            </View>
          </View>

          {/* Campo Contraseña */}
          <View className="mb-6">
            <Text className="text-[#132e3c] text-base font-JakartaBold mb-2">
              Contraseña
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-5 border border-gray-200">
              <Lock size={20} color="#9CA3AF" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Tu contraseña"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 ml-3 text-[#132e3c] font-JakartaMedium text-base"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="ml-2"
              >
                {showPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón Iniciar Sesión */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className={`py-4 rounded-xl mb-6 ${isLoading ? "bg-gray-300" : "bg-[#132e3c]"
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
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="white" />
                <Text className="text-white font-JakartaBold text-lg ml-2">
                  Iniciando sesión...
                </Text>
              </View>
            ) : (
              <Text className="text-white font-JakartaBold text-lg text-center">
                Iniciar Sesión
              </Text>
            )}
          </TouchableOpacity>

          {/* Enlace a registro */}
          <View className="items-center">
            <Text className="text-gray-600 font-JakartaMedium text-base mb-3">
              ¿No tienes cuenta?
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/inscribete")}
              className="py-3 px-6 border-2 border-[#132e3c] rounded-xl"
            >
              <Text className="text-[#132e3c] font-JakartaBold text-base">
                Crear cuenta nueva
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default iniciaSesion;