import 'react-native-get-random-values';
import { Amplify } from 'aws-amplify';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Image } from 'react-native';
import { CarritoProvider } from '@/context/contextCarrito';
import '@/global.css';

// Hook personalizado para configurar Amplify
const useAmplifyConfig = () => {
  const [isAmplifyConfigured, setIsAmplifyConfigured] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    const configureAmplify = async () => {
      try {
        let config;
        try {
          // Carga asíncrona de amplify_outputs.json
          const configModule = await import('../amplify_outputs.json');
          config = configModule.default || configModule;
        } catch (error) {
          console.warn('⚠️ No se pudo cargar amplify_outputs.json, usando configuración por defecto');
          // Configuración dummy para entorno de desarrollo
          config = {
            auth: {
              user_pool_id: process.env.EXPO_PUBLIC_DUMMY_USER_POOL_ID || 'us-east-1_dummy',
              user_pool_client_id: process.env.EXPO_PUBLIC_DUMMY_CLIENT_ID || 'dummy_client_id',
              identity_pool_id: process.env.EXPO_PUBLIC_DUMMY_IDENTITY_POOL_ID || 'us-east-1:dummy-identity-pool',
              password_policy: { min_length: 8 },
            },
            data: {
              url: process.env.EXPO_PUBLIC_DUMMY_APPSYNC_URL || 'https://dummy.appsync-api.us-east-1.amazonaws.com/graphql',
              api_key: process.env.EXPO_PUBLIC_DUMMY_API_KEY || 'dummy_api_key',
              default_authorization_type: 'API_KEY',
            },
          };
        }

        await Amplify.configure(config);
        console.log('✅ Amplify configurado exitosamente');
        setIsAmplifyConfigured(true);
      } catch (err) {
        console.error('❌ Error configurando Amplify:', err);
        setConfigError(err instanceof Error ? err.message : 'Error desconocido al configurar Amplify');
        setIsAmplifyConfigured(false);
      }
    };

    configureAmplify();
  }, []);

  return { isAmplifyConfigured, configError };
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const { isAmplifyConfigured, configError } = useAmplifyConfig();

  const [loaded, error] = useFonts({
    'Jakarta-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'Jakarta-ExtraBold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'Jakarta-ExtraLight': require('../assets/fonts/PlusJakartaSans-ExtraLight.ttf'),
    'Jakarta-Light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
    'Jakarta-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'Jakarta-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'Jakarta-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
  });

  useEffect(() => {
    if (loaded && isAmplifyConfigured && !error && !configError) {
      SplashScreen.hideAsync();
      setTimeout(() => {
        setShowCustomSplash(false);
      }, 2000);
    } else if (error || configError) {
      console.error('❌ Error cargando recursos:', { fontError: error, configError });
      // Mostrar pantalla de error o intentar recuperación
      SplashScreen.hideAsync();
      setShowCustomSplash(false);
    }
  }, [loaded, isAmplifyConfigured, error, configError]);

  if (showCustomSplash || !loaded || !isAmplifyConfigured) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Image
          source={require('../assets/images/splash.png')}
          style={{
            width: '120%',
            height: '100%',
          }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <CarritoProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(root)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(restaurant)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </CarritoProvider>
  );
}