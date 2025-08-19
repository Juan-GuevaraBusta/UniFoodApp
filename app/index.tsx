/* eslint-disable prettier/prettier */
import { useAuth } from "@/hooks/useAuth";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

const Home = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    // Esperar a que se complete la verificación de autenticación
    if (!isLoading) {
      setShouldRedirect(true);
    }
  }, [isLoading]);

  if (!shouldRedirect) {
    return null; // Mostrar pantalla de carga mientras verifica
  }

  // Si está autenticado, redirigir según el rol
  if (isAuthenticated && user) {
    if (user.role === 'restaurant_owner') {
      return <Redirect href="/(restaurant)/(tabs)/home" />;
    } else {
      return <Redirect href="/(root)/(tabs)/home" />;
    }
  }

  // Si no está autenticado, ir a bienvenida
  return <Redirect href="/(auth)/bienvenido" />;
};

export default Home;
