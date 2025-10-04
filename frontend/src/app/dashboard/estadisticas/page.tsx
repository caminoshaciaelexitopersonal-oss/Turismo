'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getStatistics } from '@/services/api'; // Suponiendo que esta función se añadirá en api.ts

// --- Tipos de Datos ---
interface SummaryStats {
  usuarios: { total: number; por_rol: { [key: string]: number } };
  prestadores: { total: number };
  artesanos: { total: number };
  publicaciones: { total: number };
  atractivos: { total: number };
}

interface ComplianceData {
    item_texto: string;
    distribucion_actual: { cumplen: number; no_cumplen: number };
    evolucion_temporal: { ano: number; total_cumplen: number; total_no_cumplen: number }[];
}

// --- Componentes de Gráficos Específicos ---

const RoleDistributionChart = ({ data }: { data: { [key: string]: number } }) => {
    const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];
    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
};

const ComplianceDistributionChart = ({ data }: { data: { cumplen: number; no_cumplen: number }}) => {
    const chartData = [
        { name: 'Cumplen', value: data.cumplen },
        { name: 'No Cumplen', value: data.no_cumplen },
    ];
    const COLORS = ['#00C49F', '#FF8042'];
    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                     {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}

const ComplianceEvolutionChart = ({ data }: { data: { ano: number; total_cumplen: number; total_no_cumplen: number }[] }) => {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ano" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_cumplen" stackId="a" fill="#00C49F" name="Cumplen" />
                <Bar dataKey="total_no_cumplen" stackId="a" fill="#FF8042" name="No Cumplen" />
            </BarChart>
        </ResponsiveContainer>
    );
};


// --- Página Principal del Dashboard ---

const StatisticsDashboardPage = () => {
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TODO: Estos IDs deberían venir de un selector en la UI
  const [selectedItemId, setSelectedItemId] = useState<number>(1); // ID de ejemplo para el RNT

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const stats = await getStatistics({ item_id: selectedItemId });
        setSummary(stats.summary);
        setComplianceData(stats.compliance_analysis);
      } catch (err) {
        setError('No se pudieron cargar las estadísticas.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedItemId]);

  if (loading) return <div className="p-8">Cargando estadísticas...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Indicadores y Estadísticas</h1>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summary && Object.entries(summary).map(([key, value]) => (
            <div key={key} className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-600 capitalize">{key}</h3>
                <p className="text-3xl font-bold text-gray-900">{value.total}</p>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribución de Roles */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Distribución de Usuarios por Rol</h2>
          {summary && <RoleDistributionChart data={summary.usuarios.por_rol} />}
        </div>

        {/* Análisis de Cumplimiento */}
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Análisis de Cumplimiento</h2>
            {/* TODO: Añadir un <select> para cambiar selectedItemId */}
            {complianceData?.item_texto && (
                <>
                    <h3 className="text-lg font-semibold text-center mb-2">{complianceData.item_texto}</h3>
                    <ComplianceDistributionChart data={complianceData.distribucion_actual} />
                    <h3 className="text-lg font-semibold text-center mt-6 mb-2">Evolución Anual</h3>
                    <ComplianceEvolutionChart data={complianceData.evolucion_temporal} />
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboardPage;