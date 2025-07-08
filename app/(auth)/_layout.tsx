import { Stack } from "expo-router";

const Layout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="bienvenido" options={{ headerShown: false }} />
        <Stack.Screen name="iniciaSesion" options={{ headerShown: false }} />
        <Stack.Screen name="inscribete" options={{ headerShown: false }} />
        <Stack.Screen name="confirmarEmail" options={{ headerShown: false }} />
        <Stack.Screen name="testAuth" options={{headerShown : false}} />
      </Stack>
    </>
  );
};

export default Layout;
