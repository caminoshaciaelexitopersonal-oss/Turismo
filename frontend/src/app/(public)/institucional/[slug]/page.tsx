import { notFound } from 'next/navigation';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import ImageSlider from '@/components/ImageSlider';

interface ImagenGaleria {
  id: number;
  imagen_url: string;
  alt_text: string;
}

interface PaginaData {
  id: number;
  nombre: string;
  titulo_banner: string;
  subtitulo_banner: string;
  banner_url: string;
  contenido_principal: string;
  programas_proyectos: string;
  estrategias_apoyo: string;
  politicas_locales: string;
  convenios_asociaciones: string;
  informes_resultados: string;
  galeria_imagenes: ImagenGaleria[];
}

async function getPaginaData(slug: string): Promise<PaginaData | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const res = await fetch(`${apiUrl}/paginas-institucionales/${slug}/`, {
      next: { revalidate: 60 }, // Revalidar cada 60 segundos
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    console.error("Error fetching página institucional:", error);
    return null;
  }
}

export default async function PaginaInstitucionalPage({ params }: { params: { slug: string } }) {
  const pageData = await getPaginaData(params.slug);

  if (!pageData) {
    notFound();
  }

  // Mapear a la estructura de props que ImageSlider espera (`id`, `imagen`, `alt_text`)
  const sliderImages = pageData.galeria_imagenes.map(img => ({
    id: img.id,
    imagen: img.imagen_url,
    alt_text: img.alt_text || `Imagen de ${pageData.nombre}`,
  }));

  return (
    <div className="bg-gray-50">
      {/* Banner Principal */}
      <div className="relative h-64 md:h-80 w-full">
        <Image
          src={pageData.banner_url}
          alt={`Banner de ${pageData.nombre}`}
          fill={true}
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-center text-white p-4">
          <h1 className="text-3xl md:text-5xl font-bold">{pageData.titulo_banner}</h1>
          {pageData.subtitulo_banner && <p className="mt-2 text-lg md:text-xl">{pageData.subtitulo_banner}</p>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Slider de Imágenes (si hay imágenes en la galería) */}
        {sliderImages.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Galería</h2>
            <ImageSlider images={sliderImages} />
          </div>
        )}

        {/* Contenido Principal */}
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown>{pageData.contenido_principal}</ReactMarkdown>
        </div>

        {/* Secciones Adicionales (se renderizan si tienen contenido) */}
        <div className="mt-10 space-y-8">
          {pageData.programas_proyectos && (
            <section>
              <h3 className="text-xl font-semibold mb-2">Programas y Proyectos</h3>
              <div className="prose max-w-none"><ReactMarkdown>{pageData.programas_proyectos}</ReactMarkdown></div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}