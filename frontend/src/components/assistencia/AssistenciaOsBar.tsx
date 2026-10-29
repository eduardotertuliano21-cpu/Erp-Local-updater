import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Wrench, ShoppingBag, Plus, RefreshCw, LayoutGrid, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { assistenciaApi, type OrdemDeServico } from '../../services/assistenciaApi.js';
import { NovaOsModal } from './NovaOsModal.js';

interface AssistenciaOsBarProps {
  osAtiva: OrdemDeServico | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectOs: (os: OrdemDeServico | null) => void;
  onOrdensChange?: (ordens: OrdemDeServico[]) => void;
}

export const AssistenciaOsBar: React.FC<AssistenciaOsBarProps> = ({
  osAtiva,
  isExpanded,
  onToggleExpand,
  onSelectOs,
  onOrdensChange,
}) => {
  const [ordens, setOrdens] = useState<OrdemDeServico[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [isNovaOsOpen, setIsNovaOsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollHoriz = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
  };

  const carregarOrdens = async () => {
    try {
      setCarregando(true);
      const res = await assistenciaApi.listarOrdens();
      if (res.success && res.data) {
        setOrdens(res.data);
        onOrdensChange?.(res.data);
      }
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarOrdens();
  }, []);

  const prontas = useMemo(() => ordens.filter((o) => o.status === 'PRONTO'), [ordens]);
  const emAndamento = useMemo(
    () => ordens.filter((o) => o.status === 'AGUARDANDO_AVALIACAO' || o.status === 'AGUARDANDO_PECA'),
    [ordens]
  );

  // Priorização rápida no scroll: Prontas para entrega primeiro, depois em andamento
  const ordensPriorizadas = useMemo(() => {
    return [...prontas, ...emAndamento];
  }, [prontas, emAndamento]);

  return (
    <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 p-3 shrink-0 flex flex-col gap-2">
      {/* Topo da barra: Título, contadores e ações */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
            <span>Ordens de Serviço</span>
            <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
              ({prontas.length} prontas • {emAndamento.length} em andamento)
            </span>
            {prontas.length > 0 && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                {prontas.length} aguardando retirada
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={carregarOrdens}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Atualizar Ordens de Serviço"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsNovaOsOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-[11px] transition shadow-xs active:scale-95 cursor-pointer"
            title="Cadastrar Nova Ordem de Serviço"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova OS</span>
          </button>

          <button
            type="button"
            onClick={onToggleExpand}
            className={`flex items-center gap-1.5 px-3 py-1 font-bold rounded-lg text-[11px] transition shadow-xs active:scale-95 cursor-pointer ${
              isExpanded
                ? 'bg-rose-500 hover:bg-rose-400 text-white ring-2 ring-rose-500/30'
                : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
            title="Alternar entre Cupom e Painel Completo de OS (F6)"
          >
            {isExpanded ? <X className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5 text-teal-500" />}
            <span>{isExpanded ? 'Fechar OS (F6)' : 'Ver Todas (F6)'}</span>
          </button>
        </div>
      </div>

      {/* Grade Horizontal Rolável com Venda Balcão, OSs e Botões de Navegação */}
      <div className="flex items-center gap-1.5 min-w-0">
        {ordensPriorizadas.length > 2 && (
          <button
            type="button"
            onClick={() => scrollHoriz('left')}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 transition cursor-pointer"
            title="Rolar ordens de serviço para a esquerda"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div
          ref={scrollRef}
          className="flex-1 flex items-center gap-2 overflow-x-auto pb-1 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-w-0"
        >
        {/* Opção 1: Venda Balcão / Acessórios */}
        <button
          type="button"
          onClick={() => onSelectOs(null)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
            osAtiva === null
              ? 'bg-teal-600 text-white shadow-md ring-2 ring-teal-500/50'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-teal-400'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Venda Balcão / Acessórios</span>
        </button>

        {/* Chips de OSs Ativas */}
        {ordensPriorizadas.map((os) => {
          const isAtiva = osAtiva?.id === os.id;
          const isPronta = os.status === 'PRONTO';

          return (
            <button
              key={os.id}
              type="button"
              onClick={() => onSelectOs(os)}
              className={`flex flex-col items-start px-3 py-1.5 rounded-xl text-xs transition shrink-0 min-w-[130px] max-w-[200px] cursor-pointer ${
                isAtiva
                  ? 'bg-teal-600 text-white shadow-md ring-2 ring-teal-500/50'
                  : isPronta
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700/60 text-slate-900 dark:text-slate-100 hover:border-emerald-500'
                  : 'bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full gap-1">
                <span className="font-black text-xs font-mono truncate">
                  OS #{os.numero_os}
                </span>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isAtiva
                      ? 'bg-white'
                      : isPronta
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
              </div>
              <div className="text-[11px] font-bold truncate w-full text-left">
                {os.cliente_nome}
              </div>
              <div className="flex items-center justify-between w-full text-[10px] mt-0.5">
                <span className="text-slate-400 truncate max-w-[80px]">
                  {os.equipamento_descricao}
                </span>
                <span className={isAtiva ? 'font-mono font-bold' : isPronta ? 'text-emerald-600 dark:text-emerald-400 font-mono font-bold' : 'text-slate-400 font-mono'}>
                  R$ {(os.valor_total || 0).toFixed(2)}
                </span>
              </div>
            </button>
          );
        })}

          {/* Botão Final de Expansão */}
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer bg-slate-200 dark:bg-slate-800 hover:bg-teal-600 hover:text-white text-slate-700 dark:text-slate-300 border border-dashed border-slate-300 dark:border-slate-700"
            title="Ver painel completo de ordens de serviço (F6)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Ver Todas ({ordens.length})</span>
          </button>
        </div>
        {ordensPriorizadas.length > 2 && (
          <button
            type="button"
            onClick={() => scrollHoriz('right')}
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 transition cursor-pointer"
            title="Rolar ordens de serviço para a direita"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <NovaOsModal
        isOpen={isNovaOsOpen}
        onClose={() => setIsNovaOsOpen(false)}
        onSuccess={() => {
          setIsNovaOsOpen(false);
          carregarOrdens();
        }}
      />
    </div>
  );
};
