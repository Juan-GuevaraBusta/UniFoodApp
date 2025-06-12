/* eslint-disable prettier/prettier */
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { menuPrincipal } from "../../constants/index";

const MenuPrincipal = () => {
    const swiperRef = useRef<Swiper>(null);
        const [activeIndex, setActiveIndex] = useState(0);
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
                dot={<View className="w-{32px] h-[4px] mx-1 bg-[#E2E8F0] rounded-full" />}
                activeDot={<View className="w-{32px] h-[4px] mx-1 bg-[#0286FF] rounded-full" />}
                onIndexChanged={(index) => {setActiveIndex(index);}}
                >
                    {menuPrincipal.map((item) => (
                        <View key ={item.id}>
                            <Text>{item.title}</Text>
                        </View>
                    ))}
                </Swiper>
        </SafeAreaView>
    );
};
export default MenuPrincipal;