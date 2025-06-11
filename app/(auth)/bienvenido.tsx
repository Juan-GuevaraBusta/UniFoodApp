/* eslint-disable prettier/prettier */
import { router } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const menuPrincipal = () => {
    return (
        <SafeAreaView className="flex h-full items-center justify-between bg-white">
            <TouchableOpacity
                onPress={() => {
                    router.replace('/(auth)/iniciaSesion');
                }}
                className="w-full flex justify-end items-end p-5"
            >
                <Text className="text-black text-base font-JakartaBold">Saltar</Text>
            </TouchableOpacity>
            
        </SafeAreaView>
    );
};
export default menuPrincipal;