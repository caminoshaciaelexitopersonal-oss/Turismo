"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getPrestadorById, PrestadorPublicoDetalle } from '@/services/api';
import ImageSlider from '@/components/ImageSlider';
import { ResenasSection } from '@/components/ResenasSection';
import { FiMail, FiPhone, FiMapPin, FiInstagram, FiFacebook } from 'react-icons/fi';
import { FaWhatsapp, FaTiktok } from 'react-icons/fa';

const ContactInfo = ({ icon: Icon, text, href }: { icon: React.ElementType, text?: string | null, href?: string | null }) => {
  if (!text) return null;
  const link = href || (text.startsWith('http') ? text : `tel:${text}`);
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
      <Icon className="mr-3 h-5 w-5 text-gray-400" />
      <span>{text}</span>
    </a>
  );
};

export default function PrestadorDetailPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;

    const [prestador, setPrestador] = useState<PrestadorPublicoDetalle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            const fetchPrestador = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const data = await getPrestadorById(Number(id));
                    setPrestador(data);
                } catch (err) {
                    setError('No se pudo encontrar al prestador solicitado.');
                    console.error(err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPrestador();
        }
    }, [id]);

    if (isLoading) {
        return <div className="text-center py-40">Cargando...</div>;
    }

    if (error) {
        return <div className="text-center py-40 text-red-600">{error}</div>;
    }

    if (!prestador) {
        return <div className="text-center py-40">Prestador no encontrado.</div>;
    }

    return (
      <div className="font-sans bg-gray-50">
        <div className="relative">
            <ImageSlider images={prestador.galeria_imagenes} />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-white bg-black bg-opacity-50 p-4">
                <p className="text-lg font-semibold text-blue-300">{prestador.categoria.nombre}</p>
                <h1 className="text-5xl font-extrabold text-center mt-2 shadow-text">{prestador.nombre_negocio}</h1>
            </div>
        </div>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <section>
                <h2 className="text-3xl font-bold text-gray-800 border-b-2 border-blue-500 pb-2 mb-4">
                  Descripción
                </h2>
                <div className="prose prose-lg max-w-none text-gray-600">
                  {prestador.descripcion || 'No hay una descripción disponible.'}
                </div>
              </section>
              <ResenasSection contentType="prestadorservicio" objectId={prestador.id} />
            </div>
            <aside className="lg:col-span-1">
              <div className="bg-white p-6 rounded-lg shadow-lg sticky top-24">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Información de Contacto</h3>
                <div className="space-y-4">
                  <ContactInfo icon={FiPhone} text={prestador.telefono} href={`tel:${prestador.telefono}`} />
                  <ContactInfo icon={FiMail} text={prestador.email_contacto} href={`mailto:${prestador.email_contacto}`} />
                  <ContactInfo icon={FaWhatsapp} text={prestador.red_social_whatsapp} href={`https://wa.me/${prestador.red_social_whatsapp}`} />
                  <ContactInfo icon={FiInstagram} text={prestador.red_social_instagram} />
                  <ContactInfo icon={FiFacebook} text={prestador.red_social_facebook} />
                  <ContactInfo icon={FaTiktok} text={prestador.red_social_tiktok} />
                </div>
                {prestador.ubicacion_mapa && (
                    <div className="mt-6">
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${prestador.ubicacion_mapa}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FiMapPin className="mr-2" />
                            Cómo Llegar
                        </a>
                    </div>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
    );
}