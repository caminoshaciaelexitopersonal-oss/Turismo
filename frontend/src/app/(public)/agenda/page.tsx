"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer, EventProps } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { getPublicaciones, Publicacion } from '@/services/api';
import Link from 'next/link';
import { FiChevronRight } from 'react-icons/fi';

// Setup moment localizer
moment.locale('es');
const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: Publicacion;
}

const CustomEvent = ({ event }: EventProps<CalendarEvent>) => (
  <Link href={`/publicaciones/${event.resource.slug}`} legacyBehavior>
    <a className="block text-white p-1 hover:bg-blue-700 rounded-sm">
      <span className="font-semibold">{event.title}</span>
    </a>
  </Link>
);

const DestacadoCard = ({ evento }: { evento: Publicacion }) => {
  const startDate = moment(evento.fecha_evento_inicio);

  return (
    <Link href={`/publicaciones/${evento.slug}`} legacyBehavior>
      <a className="flex items-center bg-white p-4 rounded-lg shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1 border border-gray-200">
        <div className="flex flex-col items-center justify-center bg-blue-50 text-blue-600 rounded-md p-3 w-20 h-20 mr-4">
          <span className="text-3xl font-bold">{startDate.format('DD')}</span>
          <span className="text-sm font-semibold uppercase">{startDate.format('MMM')}</span>
        </div>
        <div className="flex-grow">
          <h4 className="font-bold text-gray-800 text-md leading-tight">{evento.titulo}</h4>
        </div>
        <FiChevronRight className="text-gray-400" size={20} />
      </a>
    </Link>
  );
};

const AgendaPage = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [destacados, setDestacados] = useState<Publicacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgendaData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [eventosData, destacadosData] = await Promise.all([
          getPublicaciones({ tipo: 'EVENTO' }),
          getPublicaciones({ tipo: 'EVENTO', destacados: true, limit: 5 })
        ]);

        const calendarEvents = eventosData.map(e => ({
          id: e.id,
          title: e.titulo,
          start: new Date(e.fecha_evento_inicio!),
          end: new Date(e.fecha_evento_fin!),
          allDay: false,
          resource: e,
        }));

        setEvents(calendarEvents);
        setDestacados(destacadosData);

      } catch (err) {
        setError('No se pudo cargar la agenda. Por favor, intente más tarde.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgendaData();
  }, []);

  const { messages } = useMemo(() => ({
    messages: {
      allDay: 'Todo el día',
      previous: 'Anterior',
      next: 'Siguiente',
      today: 'Hoy',
      month: 'Mes',
      week: 'Semana',
      day: 'Día',
      agenda: 'Agenda',
      date: 'Fecha',
      time: 'Hora',
      event: 'Evento',
      noEventsInRange: 'No hay eventos en este rango.',
      showMore: (total: number) => `+ Ver más (${total})`,
    },
  }), []);

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-6 py-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
            Agenda <span className="text-blue-600">Cultural y de Eventos</span>
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
            Descubre todos los eventos, ferias y fiestas que nuestro municipio tiene para ofrecer.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading && <p className="text-center text-gray-500">Cargando agenda...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!isLoading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-lg">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                messages={messages}
                culture='es'
                components={{
                  event: CustomEvent,
                }}
                eventPropGetter={() => ({
                  className: 'bg-blue-500 border-none',
                })}
              />
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Próximos Eventos Destacados</h2>
                {destacados.length > 0 ? (
                  <div className="space-y-4">
                    {destacados.map(evento => (
                      <DestacadoCard key={evento.id} evento={evento} />
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-10">No hay eventos destacados próximamente.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AgendaPage;