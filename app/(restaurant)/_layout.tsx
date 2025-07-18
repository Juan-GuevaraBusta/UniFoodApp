import { Stack } from "expo-router";

const RestaurantLayout = () => {
    return (
        <>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="viewRestaurante" options={{ headerShown: false }} />
                <Stack.Screen name="configRestaurante" options={{ headerShown: false }} />
                <Stack.Screen name="pedidosRestaurante" options={{ headerShown: false }} />
                <Stack.Screen name="historialPedidos" options={{ headerShown: false }} />
            </Stack>
        </>
    );
};

export default RestaurantLayout;