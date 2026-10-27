import React, { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  Plus,
  Search,
  RefreshCw,
  Clock,
  PackageCheck,
  CheckCircle,
  Truck,
  Monitor,
  Sun,
  Moon,
  ChevronDown,
  ShoppingBag,
  Utensils,
  Scale,
  Car,
} from 'lucide-react';
import { assistenciaApi, type OrdemDeServico } from '../../services/assistenciaApi.js';
import { NovaOsModal } from './NovaOsModal.js';
import { OsCard } from './OsCard.js';
import { useBusinessMode, TENANTS_OPTIONS } from '../../context/BusinessModeContext.js';
import { useTheme } from '../../context/ThemeContext.js';

const COLUNAS: Array<{
  id: OrdemDeServico['status'];
  label: string;
  badgeCor: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'AGUARDANDO_AVALIACAO', label: 'Aguardando Avaliação', badgeCor: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
  { id: 'AGUARDANDO_PECA', label: 'Aguardando Peça', badgeCor: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: PackageCheck },
  { id: 'PRONTO', label: 'Pronto p/ Retirada', badgeCor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: CheckCircle },
  { id: 'ENTREGUE', label: 'Entregue / Concluído', badgeCor: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: Truck },
];

const ICONS_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag,
  Utensils,
  Scale,
  Car,
  Wrench,
};

interface AssistenciaPosProps {
  onAbrirRetaguarda?: () => void;
}

export const AssistenciaPos: React.FC<AssistenciaPosProps> = ({ onAbrirRetaguarda }) => {
  const { mode, trocarTenant } = useBusinessMode();
  const { isDark, toggleTheme } = useTheme();

  const [ordens, setOrdens] = useState<OrdemDeServico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seletorNichoAberto, setSeletorNichoAberto] = useState(false);

  const carregarOrdens = useCallback(async () => {
    try {
      setCarregando(true);
      const res = await assistenciaApi.listarOrdens(undefined, busca.trim() || undefined);
      if (res.success && res.data) {
        setOrdens(res.data);
      }
    } finally {
      setCarregando(false);
    }
  }, [busca]);

  useEffect(() => {
    carregarOrdens();
  }, [carregarOrdens]);

  const handleMudarStatus = async (id: string, novoStatus: OrdemDeServico['status']) => {
    await assistenciaApi.atualizarStatus(id, novoStatus);
    carregarOrdens();
  };

  const currentTenantOpt = TENANTS_OPTIONS.find((t) => t.id === mode) || TENANTS_OPTIONS[4];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none">
      {/* Header Superior */}
      <header className="px-5 py-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black shadow-xs">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                Assistência Técnica
              </h1>
              <span className="text-[10px] bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold px-2 py-0.5 rounded-full border border-teal-500/20">
                Kanban OS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Painel de Ordens de Serviço & Manutenção de Equipamentos
            </p>
          </div>

          {/* Seletor de Área de Atuação */}
          <div className="relative ml-2">
            <button
              onClick={() => setSeletorNichoAberto(!seletorNichoAberto)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition shadow-xs"
              title="Alternar Módulo / Banco de Dados"
            >
              <Wrench className="w-3.5 h-3.5 text-teal-400" />
              <span>{currentTenantOpt.label}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {seletorNichoAberto && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-1.5 shadow-2xl z-50">
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 px-2 py-1 uppercase tracking-wider">
                  Trocar Área de Atuação (Multi-DB)
                </div>
                {TENANTS_OPTIONS.map((t) => {
                  const Icon = ICONS_MAP[t.iconName] || Wrench;
                  const isSel = t.id === mode;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSeletorNichoAberto(false);
                        trocarTenant(t.id);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition text-left ${
                        isSel ? 'bg-teal-600 text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSel ? 'text-white' : t.cor}`} />
                      <div>
                        <div>{t.label}</div>
                        <div className={`text-[10px] font-normal ${isSel ? 'text-teal-100' : 'text-slate-400'}`}>
                          {t.sublabel}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Ações Topo */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-64 sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente, OS ou serial..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <button
            onClick={carregarOrdens}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition"
            title="Atualizar OS"
          >
            <RefreshCw className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {onAbrirRetaguarda && (
            <button
              onClick={onAbrirRetaguarda}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Monitor className="w-3.5 h-3.5 text-blue-500" />
              <span>Retaguarda (F11)</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova Ordem de Serviço (Entrada de Equipamento)</span>
          </button>
        </div>
      </header>

      {/* Grid Kanban (4 Colunas) */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-hidden min-h-0">
        {COLUNAS.map((col) => {
          const Icon = col.icon;
          const itensColuna = ordens.filter((os) => os.status === col.id);

          return (
            <div
              key={col.id}
              className="flex flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
            >
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{col.label}</span>
                </div>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${col.badgeCor}`}>
                  {itensColuna.length}
                </span>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {itensColuna.map((os) => (
                  <OsCard key={os.id} os={os} onMudarStatus={handleMudarStatus} />
                ))}

                {itensColuna.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <p>Nenhuma OS nesta etapa</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <NovaOsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => carregarOrdens()}
      />
    </div>
  );
};
