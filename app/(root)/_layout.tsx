import { Stack } from "expo-router";

const LayoutTabs = () => {
    return (
        <>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        //Aqui deberán ir las otras stack sobre el restaurante y posteriormente el plato
            </Stack>
        </>
    );
};

export default LayoutTabs;