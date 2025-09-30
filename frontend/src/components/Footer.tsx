"use client";

import { useState, useEffect } from 'react';
import { FaFacebookF, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';

// Interfaz para la configuración del sitio, coincidiendo con el modelo de la API
interface SiteConfig {
  direccion: string;
  horario_atencion: string;
  telefono_conmutador: string;
  telefono_movil: string;
  linea_gratuita: string;
  linea_anticorrupcion: string;
  correo_institucional: string;
  correo_notificaciones: string;
  social_facebook: string;
  social_twitter: string;
  social_youtube: string;
  social_instagram: string;
}

const initialConfig: SiteConfig = {
    direccion: "No disponible",
    horario_atencion: "No disponible",
    telefono_conmutador: "No disponible",
    telefono_movil: "No disponible",
    linea_gratuita: "No disponible",
    linea_anticorrupcion: "No disponible",
    correo_institucional: "no-disponible@example.com",
    correo_notificaciones: "no-disponible@example.com",
    social_facebook: "",
    social_twitter: "",
    social_youtube: "",
    social_instagram: "",
};


export default function Footer() {
  const [config, setConfig] = useState<SiteConfig>(initialConfig);

  useEffect(() => {
    const fetchSiteConfig = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/config/site/');
        if (!response.ok) {
          throw new Error('Error al cargar la configuración del sitio');
        }
        const data: SiteConfig = await response.json();
        setConfig(data);
      } catch (error) {
        console.error("No se pudo obtener la configuración del sitio:", error);
      }
    };

    fetchSiteConfig();
  }, []);

  const socialLinks = [
    { name: 'Facebook', href: config.social_facebook, icon: FaFacebookF },
    { name: 'Twitter', href: config.social_twitter, icon: FaTwitter },
    { name: 'YouTube', href: config.social_youtube, icon: FaYoutube },
    { name: 'Instagram', href: config.social_instagram, icon: FaInstagram },
  ].filter(link => link.href); // Filtrar para no mostrar iconos sin URL

  return (
    <footer className="bg-gray-800 text-gray-300 font-sans">
      <div className="max-w-screen-xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Columna 1: Información Principal */}
          <div className="md:col-span-2 lg:col-span-2 space-y-4">
            <h3 className="text-xl font-bold text-white">Alcaldía de Puerto Gaitán</h3>
            <div className="text-sm space-y-2">
                <p><span className="font-semibold">Dirección:</span> {config.direccion}</p>
                <p><span className="font-semibold">Horario de atención:</span> {config.horario_atencion}</p>
            </div>
          </div>

          {/* Columna 2: Contactos */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold tracking-wider uppercase text-gray-400">Contacto</h3>
            <div className="text-sm space-y-2">
                <p>Conmutador: {config.telefono_conmutador}</p>
                <p>Móvil: {config.telefono_movil}</p>
                <p>Línea Gratuita: {config.linea_gratuita}</p>
                <p>Línea Anticorrupción: {config.linea_anticorrupcion}</p>
            </div>
          </div>

          {/* Columna 3: Correos */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold tracking-wider uppercase text-gray-400">Correos</h3>
             <div className="text-sm space-y-2">
                <p>
                    <a href={`mailto:${config.correo_institucional}`} className="hover:text-blue-400 break-all">{config.correo_institucional}</a>
                </p>
                <p className="font-semibold mt-2">Notificaciones Judiciales:</p>
                <p>
                    <a href={`mailto:${config.correo_notificaciones}`} className="hover:text-blue-400 break-all">{config.correo_notificaciones}</a>
                </p>
            </div>
          </div>

        </div>

        <div className="mt-10 border-t border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <div className="flex space-x-5 order-2 sm:order-1 mt-4 sm:mt-0">
                {socialLinks.map((item) => (
                    <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <span className="sr-only">{item.name}</span>
                    <item.icon className="h-6 w-6" />
                    </a>
                ))}
            </div>
            <p className="text-gray-500 text-sm order-1 sm:order-2">&copy; {new Date().getFullYear()} Municipio de Puerto Gaitán. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}