/* eslint-disable prettier/prettier */
import { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";
import { Mail, Hash, ArrowLeft } from "lucide-react-native";

const ConfirmarEmail = () => {
    const { email } = useLocalSearchParams<{ email: string }>();
    const [codigo, setCodigo] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const handleConfirmar = async () => {
        if (!codigo.trim()) {
            Alert.alert("Error", "Por favor ingresa el código de confirmación");
            return;
        }

        if (codigo.length !== 6) {
            Alert.alert("Error", "El código debe tener 6 dígitos");
            return;
        }

        setIsLoading(true);

        try {
            console.log('🔐 Confirmando usuario:', email, 'con código:', codigo);

            const { isSignUpComplete } = await confirmSignUp({
                username: email!,
                confirmationCode: codigo,
            });

            console.log('✅ Confirmación exitosa:', isSignUpComplete);

            if (isSignUpComplete) {
                Alert.alert(
                    "¡Cuenta confirmada!",
                    "¿Bienvenido a uniFood!",
                    [
                        {
                            text: "Continuar",
                            onPress: () => router.replace("/(root)/(tabs)/home"),
                        },
                    ]
                );
            }
        } catch (error: any) {
            console.error('❌ Error en confirmación:', error);
            Alert.alert(
                "Error de confirmación",
                error.message || "Código incorrecto o expirado"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleReenviarCodigo = async () => {
        setIsResending(true);

        try {
            console.log('📧 Reenviando código a:', email);

            await resendSignUpCode({
                username: email!,
            });

            Alert.alert(
                "Código reenviado",
                "Te hemos enviado un nuevo código de confirmación a tu email."
            );
        } catch (error: any) {
            console.error('❌ Error reenviando código:', error);
            Alert.alert("Error", "No se pudo reenviar el código");
        } finally {
            setIsResending(false);
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
                        <ArrowLeft size={24} color="#132e3c" />
                    </TouchableOpacity>

                    <Text className="text-[#132e3c] text-3xl font-JakartaExtraBold mb-2">
                        Confirma tu email
                    </Text>
                    <Text className="text-gray-600 text-base font-JakartaMedium">
                        Te hemos enviado un código de 6 dígitos a:
                    </Text>
                    <Text className="text-[#132e3c] font-JakartaBold text-base mt-2">
                        {email}
                    </Text>
                </View>

                {/* Formulario */}
                <View className="px-5 py-6">
                    {/* Campo Código */}
                    <View className="mb-6">
                        <Text className="text-[#132e3c] text-base font-JakartaBold mb-2">
                            Código de confirmación
                        </Text>
                        <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-5 border border-gray-200">
                            <Hash size={20} color="#9CA3AF" />
                            <TextInput
                                value={codigo}
                                onChangeText={setCodigo}
                                placeholder="123456"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="number-pad"
                                maxLength={6}
                                autoComplete="one-time-code"
                                className="flex-1 ml-3 text-[#132e3c] font-JakartaMedium text-lg text-center"
                                style={{ letterSpacing: 4 }}
                            />
                        </View>
                    </View>

                    {/* Información del código */}
                    <View className="mb-6 p-4 bg-blue-50 rounded-xl">
                        <Text className="text-blue-800 font-JakartaBold text-sm mb-2">
                            📧 Revisa tu email
                        </Text>
                        <Text className="text-blue-700 font-JakartaMedium text-sm">
                            El código puede tardar unos minutos en llegar. Revisa también tu carpeta de spam.
                        </Text>
                    </View>

                    {/* Botón Confirmar */}
                    <TouchableOpacity
                        onPress={handleConfirmar}
                        disabled={isLoading || codigo.length !== 6}
                        className={`py-4 rounded-xl mb-4 ${isLoading || codigo.length !== 6 ? "bg-gray-300" : "bg-[#132e3c]"
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
                                    Confirmando...
                                </Text>
                            </View>
                        ) : (
                            <Text className={`font-JakartaBold text-lg text-center ${codigo.length !== 6 ? 'text-gray-500' : 'text-white'
                                }`}>
                                Confirmar Cuenta
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Botón Reenviar */}
                    <TouchableOpacity
                        onPress={handleReenviarCodigo}
                        disabled={isResending}
                        className="py-3 px-6 border-2 border-[#132e3c] rounded-xl"
                    >
                        {isResending ? (
                            <View className="flex-row items-center justify-center">
                                <ActivityIndicator size="small" color="#132e3c" />
                                <Text className="text-[#132e3c] font-JakartaBold text-base ml-2">
                                    Reenviando...
                                </Text>
                            </View>
                        ) : (
                            <Text className="text-[#132e3c] font-JakartaBold text-base text-center">
                                Reenviar código
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Enlace para cambiar email */}
                    <View className="mt-6 pt-6 border-t border-gray-200">
                        <TouchableOpacity
                            onPress={() => router.replace("/(auth)/inscribete")}
                            className="py-3"
                        >
                            <Text className="text-gray-500 font-JakartaMedium text-sm text-center">
                                ¿Email incorrecto? Registrarse de nuevo
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default ConfirmarEmail;