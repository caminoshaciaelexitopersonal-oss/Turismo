"use client";

import React from "react";
import Slider from "react-slick";
import Image from "next/image";

// Importar los estilos de slick-carousel
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

interface ImageSliderProps {
  images: {
    id: number;
    imagen: string;
    alt_text?: string;
  }[];
  className?: string;
}

const ImageSlider: React.FC<ImageSliderProps> = ({ images, className }) => {
  const settings = {
    dots: true,
    infinite: images.length > 1, // El bucle infinito solo tiene sentido si hay más de una imagen
    speed: 500,
    fade: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    cssEase: 'linear',
    arrows: false, // Ocultamos las flechas para un look más limpio
    dotsClass: "slick-dots slick-thumb", // Clase para personalizar los puntos
  };

  const fallbackImage = "/images/placeholder.png";

  if (!images || images.length === 0) {
    return (
      <div className={`relative h-96 w-full bg-gray-700 ${className}`}>
        <Image
            src={fallbackImage}
            alt="No hay imágenes disponibles"
            layout="fill"
            objectFit="cover"
            className="opacity-50"
        />
        <div className="absolute inset-0 flex justify-center items-center">
            <p className="text-white text-lg font-semibold">No hay imágenes en la galería</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-96 w-full overflow-hidden ${className}`}>
      <Slider {...settings}>
        {images.map((img) => (
          <div key={img.id} className="relative h-96 w-full">
            <Image
              src={img.imagen}
              alt={img.alt_text || "Imagen de la galería"}
              layout="fill"
              objectFit="cover"
            />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ImageSlider;