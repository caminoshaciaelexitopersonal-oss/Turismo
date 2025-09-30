import Link from 'next/link';
import Testimonios from '@/components/Testimonios';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <main className="flex-grow">
        <section className="relative flex items-center justify-center h-[60vh] bg-cover bg-center text-white" style={{ backgroundImage: "url('https://via.placeholder.com/1920x1080/87CEEB/FFFFFF?text=Paisaje+Llanero')" }}>
          <div className="absolute inset-0 bg-black opacity-40"></div>
          <div className="relative z-10 text-center p-4">
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
              Puerto Gaitán, Paraíso Natural
            </h1>
            <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto">
              Descubre un destino donde la cultura llanera, la biodiversidad y la aventura se encuentran.
            </p>
            <div className="mt-8 flex justify-center gap-4 flex-wrap">
              <Link href="/explorar" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-full font-semibold transition-transform transform hover:scale-105">
                Explorar Oferta Turística
              </Link>
              <Link href="/mapa" className="px-8 py-3 bg-white text-indigo-600 hover:bg-gray-200 rounded-full font-semibold transition-transform transform hover:scale-105">
                Ver Mapa Interactivo
              </Link>
            </div>
          </div>
        </section>

        <Testimonios />

        {/* Placeholder for other sections */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Próximamente: Eventos Destacados</h2>
            <p className="mt-4 text-lg text-gray-600">
              Aquí se mostrará una vista previa del calendario de eventos.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}