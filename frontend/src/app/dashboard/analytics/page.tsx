"use client";

import React, { useEffect, useState } from 'react';
import { getAnalyticsData, AnalyticsData } from '@/services/analyticsService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { FaUsers, FaStore, FaPaintBrush, FaNewspaper, FaStar } from 'react-icons/fa';

// --- Componentes de Visualización ---

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center">
    <div className="p-3 bg-blue-100 rounded-full mr-4">{icon}</div>
    <div>
      <h3 className="text-sm font-semibold text-gray-500">{title}</h3>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const ChartContainer = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                {children}
            </ResponsiveContainer>
        </div>
    </div>
);

const TopProvidersTable = ({ title, data }: { title: string; data: { name: string; score: number }[] }) => (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
        <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                    <th scope="col" className="px-6 py-3">Nombre</th>
                    <th scope="col" className="px-6 py-3">Puntuación</th>
                </tr>
            </thead>
            <tbody>
                {data.map((item, index) => (
                    <tr key={index} className="bg-white border-b">
                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{item.name}</th>
                        <td className="px-6 py-4">{item.score}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


// --- Componente Principal de la Página ---

const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAnalyticsData();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p className="text-center text-gray-500 mt-8">Cargando panel de análisis...</p>;
  if (error) return <p className="text-center text-red-500 mt-8">Error al cargar los datos: {error}</p>;
  if (!data) return <p className="text-center text-gray-500 mt-8">No hay datos de análisis disponibles.</p>;

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  const topPrestadoresData = data.top_providers.prestadores.map(p => ({ name: p.nombre_negocio || '', score: p.puntuacion_total }));
  const topArtesanosData = data.top_providers.artesanos.map(a => ({ name: a.nombre_taller || '', score: a.puntuacion_total }));

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Panel de Análisis de Datos</h1>

      {/* Fila de Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Prestadores Activos" value={data.summary_cards.total_prestadores.value} icon={<FaStore className="text-blue-500" />} />
        <StatCard title="Artesanos Activos" value={data.summary_cards.total_artesanos.value} icon={<FaPaintBrush className="text-green-500" />} />
        <StatCard title="Publicaciones" value={data.summary_cards.total_publicaciones.value} icon={<FaNewspaper className="text-orange-500" />} />
        <StatCard title="Calificación Promedio" value={data.summary_cards.calificacion_promedio.value} icon={<FaStar className="text-yellow-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Gráfico de Distribución de Roles */}
        <ChartContainer title="Distribución de Usuarios por Rol">
            <PieChart>
                <Pie data={data.user_roles_distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {data.user_roles_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ChartContainer>

        {/* Gráfico de Prestadores por Categoría */}
        <ChartContainer title="Prestadores por Categoría">
            <BarChart data={data.providers_by_category.prestadores} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" name="Cantidad"/>
            </BarChart>
        </ChartContainer>
      </div>

      {/* Gráfico de Evolución de Registros */}
      <div className="mb-8">
        <ChartContainer title="Evolución de Registros (Último Año)">
            <LineChart data={data.registration_over_time}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Prestadores" stroke="#8884d8" />
                <Line type="monotone" dataKey="Artesanos" stroke="#82ca9d" />
                <Line type="monotone" dataKey="Turistas" stroke="#ffc658" />
            </LineChart>
        </ChartContainer>
      </div>

      {/* Tablas de Top Proveedores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TopProvidersTable title="Top 5 Prestadores por Puntuación" data={topPrestadoresData} />
        <TopProvidersTable title="Top 5 Artesanos por Puntuación" data={topArtesanosData} />
      </div>
    </div>
  );
};

export default AnalyticsPage;