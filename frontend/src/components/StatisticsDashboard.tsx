"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { FiUsers, FiFileText, FiBarChart2, FiAlertCircle, FiBriefcase } from 'react-icons/fi';
import { getStatistics, StatisticsData } from '@/services/api';

// --- Componentes de UI ---

const StatCard = ({
  icon,
  title,
  value,
  details,
  color = 'blue'
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  details?: string;
  color?: string;
}) => {
  const colors = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-green-500 to-teal-600',
    purple: 'from-purple-500 to-violet-600',
    red: 'from-red-500 to-orange-600',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white p-5 rounded-lg shadow-md`}>
      <div className="flex items-center">
        <div className="text-3xl mr-4">{icon}</div>
        <div>
          <p className="text-sm font-medium uppercase opacity-90">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
      {details && <p className="text-xs opacity-80 mt-2">{details}</p>}
    </div>
  );
};

const ChartContainer = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>{children}</ResponsiveContainer>
    </div>
  </div>
);

// --- Dashboard Principal ---

export default function StatisticsDashboard() {
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para los filtros de fecha
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStats = useCallback(async (start?: string, end?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getStatistics(start, end);
      setStats(data);
      // Actualizar el estado de las fechas si vienen del backend (carga inicial)
      if (data.query_range) {
        setStartDate(data.query_range.start_date);
        setEndDate(data.query_range.end_date);
      }
    } catch {
      setError("No se pudieron cargar las estadísticas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Carga inicial sin parámetros de fecha
    fetchStats();
  }, [fetchStats]);

  const handleFilter = () => {
    fetchStats(startDate, endDate);
  };

  if (isLoading) return <p className="text-center py-12">Cargando estadísticas avanzadas...</p>;
  if (error) return <div className="text-center py-12 text-red-500"><FiAlertCircle className="mx-auto h-12 w-12"/><p className="mt-4">{error}</p></div>;
  if (!stats) return <p className="text-center py-12">No hay datos de estadísticas disponibles.</p>;

  const { summary, time_series } = stats;

  const userRoleData = Object.entries(summary.usuarios.por_rol).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

  return (
    <div className="bg-gray-100 p-4 sm:p-6 rounded-xl space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center"><FiBarChart2 className="mr-3" />Dashboard de Inteligencia</h2>

        {/* Controles de Filtro de Fecha */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border-gray-200 rounded-md text-sm"/>
            <span className="text-gray-500">-</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border-gray-200 rounded-md text-sm"/>
            <button onClick={handleFilter} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors text-sm">
                Aplicar
            </button>
        </div>
      </div>

      {/* Tarjetas de Resumen Global */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<FiUsers />} title="Usuarios Totales" value={summary.usuarios.total} color="blue" />
        <StatCard icon={<FiBriefcase />} title="Prestadores Totales" value={summary.prestadores.total} details={`${summary.prestadores.pendientes} pendientes`} color="green" />
        <StatCard icon={<FiBriefcase />} title="Artesanos Totales" value={summary.artesanos.total} details={`${summary.artesanos.pendientes} pendientes`} color="green" />
        <StatCard icon={<FiFileText />} title="Publicaciones Totales" value={summary.contenido.publicaciones_total} color="purple" />
      </div>

      {/* Gráficos de Tendencias */}
      <ChartContainer title={`Tendencia de Nuevos Usuarios (${stats.query_range.start_date} al ${stats.query_range.end_date})`}>
        <LineChart data={time_series.users} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="count" name="Nuevos Usuarios" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ChartContainer>

      {/* Gráficos de Distribución */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="Distribución de Usuarios por Rol">
          <PieChart>
            <Pie data={userRoleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
              {userRoleData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ChartContainer>

        <ChartContainer title="Contenido por Tipo">
            <BarChart data={Object.entries(summary.contenido.publicaciones_por_tipo).map(([name, value]) => ({name, value}))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Cantidad" fill="#82ca9d" />
            </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}