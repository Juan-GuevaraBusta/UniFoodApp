import { Stack } from "expo-router";

const LayoutTabs = () => {
    return (
        <>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="uniSelection" options={{ headerShown: false }} />
                <Stack.Screen name="(restaurants)" options={{ headerShown: false }} />
            </Stack>
        </>
    );
};

export default LayoutTabs;