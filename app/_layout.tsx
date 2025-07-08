import 'react-native-get-random-values';
import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
Amplify.configure(outputs)

import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "@/global.css";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { View, Image } from "react-native";
import { CarritoProvider } from "@/context/contextCarrito";




SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const [loaded] = useFonts({
    "Jakarta-Bold": require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    "Jakarta-ExtraBold": require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
    "Jakarta-ExtraLight": require("../assets/fonts/PlusJakartaSans-ExtraLight.ttf"),
    "Jakarta-Light": require("../assets/fonts/PlusJakartaSans-Light.ttf"),
    "Jakarta-Medium": require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    "Jakarta-Regular": require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    "Jakarta-SemiBold": require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      setTimeout(() => {
        setShowCustomSplash(false);
      }, 2000);
    }
  }, [loaded]);

  if (showCustomSplash) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Image
          source={require("../assets/images/splash.png")}
          style={{
            width: "120%",
            height: "100%",
          }}
          resizeMode="cover"
        />
      </View>
    );
  }

  if (!loaded) {
    return null;
  }

  return (
    <CarritoProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(root)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </CarritoProvider>
  );
}