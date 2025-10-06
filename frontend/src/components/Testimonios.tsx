"use client";

import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { getPublicasFelicitaciones, PublicFelicitacion } from '@/services/api';
import { FiMessageSquare } from 'react-icons/fi';

// Importar los estilos de slick-carousel
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const TestimonioCard = ({ testimonio }: { testimonio: PublicFelicitacion }) => {
  return (
    <div className="p-6">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center h-full flex flex-col justify-between">
        <FiMessageSquare className="text-blue-500 text-4xl mx-auto mb-4" />
        <blockquote className="text-gray-600 italic mb-6 flex-grow">
          &ldquo;{testimonio.mensaje}&rdquo;
        </blockquote>
        <footer className="font-bold text-gray-800">
          - {testimonio.remitente}
        </footer>
      </div>
    </div>
  );
};

const Testimonios = () => {
  const [testimonios, setTestimonios] = useState<PublicFelicitacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonios = async () => {
      try {
        const response = await getPublicasFelicitaciones();
        setTestimonios(response);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchTestimonios();
  }, []);

  const settings = {
    dots: true,
    infinite: testimonios.length > 1,
    speed: 500,
    slidesToShow: Math.min(3, testimonios.length),
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: Math.min(2, testimonios.length),
        }
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
        }
      }
    ]
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando testimonios...</div>;
  }

  if (testimonios.length === 0) {
    return null; // No mostrar nada si no hay testimonios
  }

  return (
    <section className="bg-gray-50 py-20">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">La Voz de Nuestros Visitantes</h2>
        <p className="text-center text-gray-600 mb-12">Descubre lo que otros opinan de nuestro paraíso.</p>
        <Slider {...settings}>
          {testimonios.map(testimonio => (
            <TestimonioCard key={testimonio.id} testimonio={testimonio} />
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default Testimonios;