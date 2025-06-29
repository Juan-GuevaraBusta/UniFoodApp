import { Stack } from "expo-router";

const RestaurantsLayout = () => {
    return (
        <>
            <Stack>
                <Stack.Screen name="menuRestaurante" options={{ headerShown: false }} />
                <Stack.Screen name="plato" options={{ headerShown: false }} />
                <Stack.Screen name="carrito" options={{ headerShown: false }} />
            </Stack>
        </>
    );
};

export default RestaurantsLayout;