import React, { useState, useEffect } from 'react';
import { assistenciaApi, type OrdemDeServico } from '../../services/assistenciaApi.js';
import { AssistenciaOsGrid } from '../assistencia/AssistenciaOsGrid.js';
import { RefreshCw } from 'lucide-react';
import { useBusinessMode } from '../../context/BusinessModeContext.js';

export const AssistenciaErpView: React.FC = () => {
  const { isAssistencia } = useBusinessMode();
  const [ordens, setOrdens] = useState<OrdemDeServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [osAtiva, setOsAtiva] = useState<OrdemDeServico | null>(null);

  if (!isAssistencia) return null;

  const carregarOrdens = async () => {
    try {
      setLoading(true);
      const res = await assistenciaApi.listarOrdens();
      if (res.success && res.data) {
        setOrdens(res.data);
      }
    } catch (err) {
      console.error('Erro ao carregar OS no ERP:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarOrdens();
  }, []);

  if (loading && ordens.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-3">
        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="text-sm font-bold text-slate-500">Carregando Ordens de Serviço...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
      <AssistenciaOsGrid
        ordens={ordens}
        osAtiva={osAtiva}
        onSelectOs={setOsAtiva}
        onClose={() => setOsAtiva(null)}
        onAtualizarLista={carregarOrdens}
      />
    </div>
  );
};
