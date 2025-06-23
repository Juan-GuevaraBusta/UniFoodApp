/* eslint-disable prettier/prettier */
import { Image, ScrollView, Text, View } from "react-native";
const inscribete = () => {
  return (
    <ScrollView className="flex-1 bg-white items-center justify-center">
      <View className="flex-1 bg-white">
        <View>
          <Image
            source={{ uri: "https://via.placeholder.com/150" }}
            style={{ width: 150, height: 150 }}
          />
        </View>
      </View>
    </ScrollView>
  );
};
export default inscribete;
