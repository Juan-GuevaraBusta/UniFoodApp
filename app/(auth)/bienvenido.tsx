/* eslint-disable prettier/prettier */
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Text, TouchableOpacity, View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { menuPrincipal } from "../../constants/index";
import BotonCustom from "@/components/botonCustom";


const MenuInicio = () => {
    const swiperRef = useRef<Swiper>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const isLastSlide = activeIndex === menuPrincipal.length - 1;
    return (
        <SafeAreaView className="flex h-full items-center justify-between bg-white">
            <TouchableOpacity
                onPress={() => {
                    router.replace('/(root)/(tabs)/home');
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
                onPress={() => isLastSlide ? router.replace('/(root)/(tabs)/home') : swiperRef.current?.scrollBy(1)}
                className="w-11/12 mt-10"
            />
        </SafeAreaView>
    );
};
export default MenuInicio;