// This file shows the initial page of the app
import { Platform, StyleSheet, Text, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


export default function HomeScreen() {
  return (
    <SafeAreaView className ="flex-1 items-center justify-center bg-white">
      <Text className={"text-red-500"}>¡Bienvenido a UniFood!</Text>
      <StatusBar style="auto" />
    </SafeAreaView>
  )  
}
