/* eslint-disable prettier/prettier */
import BotonCustom from "@/components/botonCustom";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { menuPrincipal } from "../../constants/index";


const MenuInicio = () => {
    const swiperRef = useRef<Swiper>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const isLastSlide = activeIndex === menuPrincipal.length - 1;
    const { user, isAuthenticated } = useAuth();

    // ✅ Redirección automática si ya está autenticado
    useEffect(() => {
        if (isAuthenticated && user) {
            console.log('🚀 Usuario ya autenticado, redirigiendo al home...');

            // Redirigir según el rol del usuario
            if (user.role === 'restaurant_owner') {
                router.replace('/(restaurant)/(tabs)/home');
            } else {
                router.replace('/(root)/(tabs)/home');
            }
        }
    }, [isAuthenticated, user]);
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

            <Swiper ref={swiperRef}
                loop={false}
                dot={<View className="w-[32px] h-[8px] mx-1 bg-[#E2E8F0] rounded-full" />}
                activeDot={<View className="w-[32px] h-[8px] mx-1 bg-[#132e3c] rounded-full opacity-100" />}
                onIndexChanged={(index) => { setActiveIndex(index); }}
            >
                {menuPrincipal.map((item) => (
                    <View key={item.id} className="flex-1 items-center p-5">

                        <View className="h-[10%] justify-center items-center w-full">
                            <Text className="text-black text-3xl font-JakartaBold text-center">
                                {item.title}
                            </Text>
                        </View>

                        <View className="h-[60%] justify-center items-center">
                            <Image
                                source={item.image}
                                className="w-[250px] h-[200px]"
                                resizeMode="contain"
                            />
                        </View>

                        <View className="h-[70%] justify-start items-center pt-8 w-full">
                            <Text className="text-black text-2xl font-JakartaBold text-center px-4">
                                {item.description}
                            </Text>
                        </View>

                    </View>
                ))}
            </Swiper>
            <BotonCustom
                title={isLastSlide ? "¡Empieza ya!" : "Siguiente"}
                onPress={() => isLastSlide ? router.replace('/(auth)/iniciaSesion') : swiperRef.current?.scrollBy(1)}
                className="w-11/12 mt-10"
            />
        </SafeAreaView>
    );
};
export default MenuInicio;