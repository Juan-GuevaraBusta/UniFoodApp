/* eslint-disable prettier/prettier */
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
const iniciaSesion = () => {
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center">
      <Text className={"text-red-0"}>¡Bienvenido a UniFood!</Text>
    </SafeAreaView>
  );
};
export default iniciaSesion;
