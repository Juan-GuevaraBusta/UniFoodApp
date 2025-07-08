/* eslint-disable prettier/prettier */
import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { getUserRoleByEmail, getRoleDisplayName } from "@/constants/userRoles";
import { validatePassword, getPasswordStrength } from "@/utils/passwordValidator";
import { Eye, EyeOff, Mail, Lock, Check, X } from "lucide-react-native";

const inscribete = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { registrarUsuario } = useAuth();

  // Mostrar tipo de cuenta basado en email
  const userRole = getUserRoleByEmail(email);
  const roleDisplayName = getRoleDisplayName(userRole);

  // Validación de contraseña en tiempo real
  const passwordValidation = validatePassword(password);
  const passwordStrength = getPasswordStrength(password);

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'strong': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStrengthText = () => {
    switch (passwordStrength) {
      case 'weak': return 'Débil';
      case 'medium': return 'Media';
      case 'strong': return 'Fuerte';
      default: return '';
    }
  };

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Por favor ingresa tu email");
      return false;
    }

    if (!email.includes("@")) {
      Alert.alert("Error", "Por favor ingresa un email válido");
      return false;
    }

    if (!password.trim()) {
      Alert.alert("Error", "Por favor ingresa una contraseña");
      return false;
    }

    // Validación fuerte de contraseña
    if (!passwordValidation.isValid) {
      Alert.alert(
        "Contraseña no válida", 
        passwordValidation.errors.join('\n')
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await registrarUsuario(email.trim(), password);

      if (result.success) {
        Alert.alert(
          "¡Registro exitoso!",
          `Te hemos enviado un código de confirmación a tu email. Tu cuenta será de tipo: ${roleDisplayName}`,
          [
            {
              text: "Confirmar Email",
              onPress: () => router.push(`/(auth)/testAuth`),
            },
          ]
        );
      } else {
        Alert.alert("Error en el registro", result.error);
      }
    } catch (error) {
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
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-6"
          >
            <Text className="text-[#132e3c] text-lg font-JakartaBold">← Atrás</Text>
          </TouchableOpacity>

          <Text className="text-[#132e3c] text-3xl font-JakartaExtraBold mb-2">
            ¡Únete a UniFood!
          </Text>
          <Text className="text-gray-600 text-base font-JakartaMedium">
            Crea tu cuenta para acceder a la plataforma
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

          {/* Mostrar tipo de cuenta detectado */}
          {email.includes("@") && (
            <View className={`mb-6 p-4 rounded-xl ${
              userRole === 'admin' ? 'bg-purple-50' :
              userRole === 'restaurant_owner' ? 'bg-orange-50' : 'bg-blue-50'
            }`}>
              <Text className={`font-JakartaBold text-sm mb-1 ${
                userRole === 'admin' ? 'text-purple-800' :
                userRole === 'restaurant_owner' ? 'text-orange-800' : 'text-blue-800'
              }`}>
                Tipo de cuenta detectado:
              </Text>
              <Text className={`font-JakartaMedium text-base ${
                userRole === 'admin' ? 'text-purple-700' :
                userRole === 'restaurant_owner' ? 'text-orange-700' : 'text-blue-700'
              }`}>
                {roleDisplayName}
                {userRole === 'admin' && ' 👨‍💼'}
                {userRole === 'restaurant_owner' && ' 🍕'}
                {userRole === 'student' && ' 🎓'}
              </Text>
            </View>
          )}

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
                placeholder="Crea una contraseña segura"
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

            {/* Indicador de fortaleza de contraseña */}
            {password.length > 0 && (
              <View className="mt-2">
                <Text className={`font-JakartaBold text-sm ${getStrengthColor()}`}>
                  Fortaleza: {getStrengthText()}
                </Text>
              </View>
            )}
          </View>

          {/* Campo Confirmar Contraseña */}
          <View className="mb-6">
            <Text className="text-[#132e3c] text-base font-JakartaBold mb-2">
              Confirmar contraseña
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-5 border border-gray-200">
              <Lock size={20} color="#9CA3AF" />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite tu contraseña"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 ml-3 text-[#132e3c] font-JakartaMedium text-base"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="ml-2"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            </View>

            {/* Indicador de coincidencia */}
            {confirmPassword.length > 0 && (
              <View className="mt-2 flex-row items-center">
                {password === confirmPassword ? (
                  <>
                    <Check size={16} color="#16a34a" />
                    <Text className="text-green-600 font-JakartaMedium text-sm ml-1">
                      Las contraseñas coinciden
                    </Text>
                  </>
                ) : (
                  <>
                    <X size={16} color="#dc2626" />
                    <Text className="text-red-600 font-JakartaMedium text-sm ml-1">
                      Las contraseñas no coinciden
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Requisitos de contraseña */}
          {password.length > 0 && (
            <View className="mb-6 p-4 bg-gray-50 rounded-xl">
              <Text className="text-gray-800 font-JakartaBold text-sm mb-3">
                Requisitos de contraseña:
              </Text>
              {Object.entries({
                minLength: '8 caracteres mínimo',
                hasUppercase: 'Una letra mayúscula',
                hasLowercase: 'Una letra minúscula',
                hasNumber: 'Un número',
                hasSpecialChar: 'Un carácter especial (!@#$%...)'
              }).map(([key, label]) => (
                <View key={key} className="flex-row items-center mb-1">
                  {passwordValidation.requirements[key as keyof typeof passwordValidation.requirements] ? (
                    <Check size={14} color="#16a34a" />
                  ) : (
                    <X size={14} color="#dc2626" />
                  )}
                  <Text className={`font-JakartaMedium text-xs ml-2 ${
                    passwordValidation.requirements[key as keyof typeof passwordValidation.requirements] 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Botón Registrarse */}
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading || !passwordValidation.isValid || password !== confirmPassword}
            className={`py-4 rounded-xl mb-6 ${
              isLoading || !passwordValidation.isValid || password !== confirmPassword
                ? "bg-gray-300" 
                : "bg-[#132e3c]"
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
                  Creando cuenta...
                </Text>
              </View>
            ) : (
              <Text className={`font-JakartaBold text-lg text-center ${
                !passwordValidation.isValid || password !== confirmPassword
                  ? 'text-gray-500'
                  : 'text-white'
              }`}>
                Crear Cuenta
              </Text>
            )}
          </TouchableOpacity>

          {/* Enlace a iniciar sesión */}
          <View className="items-center">
            <Text className="text-gray-600 font-JakartaMedium text-base mb-3">
              ¿Ya tienes cuenta?
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/iniciaSesion")}
              className="py-3 px-6 border-2 border-[#132e3c] rounded-xl"
            >
              <Text className="text-[#132e3c] font-JakartaBold text-base">
                Iniciar Sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default inscribete;