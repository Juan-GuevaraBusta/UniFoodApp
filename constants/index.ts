import restaurantesData from "@/assets/data/restaurantes.json";
import bienvenido1 from "@/assets/images/bienvenido1.png";
import bienvenido2 from "@/assets/images/bienvenido2.png";
import bienvenido3 from "@/assets/images/bienvenido3.png";
import icesi from "@/assets/images/icesi.jpeg";
import javerianaCali from "@/assets/images/javerianaCali.jpeg";
import bowlPrueba from "@/assets/images/bowlprueba.png";
import star from "@/assets/icons/star.png";
import clock from "@/assets/icons/alarm.png";


export const imagenes = {
    bienvenido1,
    bienvenido2,
    bienvenido3,
    icesi,
    javerianaCali,
    bowlPrueba
};

export const icons = {
    clock,
    star,
};

export const menuPrincipal = [
    {
        id: 1,
        title: "¡Basta de esperar en la U!",
        description:
            "Selecciona tu universidad y explora tus restaurantes favoritos.",
        image: imagenes.bienvenido1,
    },
    {
        id: 2,
        title: "Tu pedido, cuando quieras",
        description:
            "Elige tu plato, ajústalo a tu gusto y paga desde la app.",
        image: imagenes.bienvenido2,
    },
    {
        id: 3,
        title: "Sin demoras",
        description:
            "¡Tu comida estará lista!\n Solo pasa, recoge y disfruta.",
        image: imagenes.bienvenido3,
    },
];

export const Universidades = [
    {
        id: 1,
        nombre: "Universidad ICESI",
        ciudad: "Cali",
        imagen: imagenes.icesi, 
    },
    {
        id: 2,
        nombre: "Universidad Javeriana Cali",
        ciudad: "Cali",
        imagen: imagenes.javerianaCali
    }
]

export const restaurantes = restaurantesData.map((restaurante: any) => ({
    ...restaurante,
    imagen: restaurante.imagen ? imagenes[restaurante.imagen as keyof typeof imagenes] : null,
    menu: restaurante.menu.map((plato: any) => ({ // ← ¿Tienes esta parte?
        ...plato,
        imagen: plato.imagen ? imagenes[plato.imagen as keyof typeof imagenes] : null
      }))
}));

export const data = {
    menuPrincipal,
    Universidades,
    icons,
    restaurantes,
};

