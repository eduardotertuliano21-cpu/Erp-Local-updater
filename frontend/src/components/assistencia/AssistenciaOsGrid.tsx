import React, { useState, useMemo } from 'react';
import { Wrench, ShoppingBag, X, Search, Plus, ArrowRight, MessageSquare } from 'lucide-react';
import { assistenciaApi, type OrdemDeServico } from '../../services/assistenciaApi.js';
import { NovaOsModal } from './NovaOsModal.js';

interface AssistenciaOsGridProps {
  ordens: OrdemDeServico[];
  osAtiva: OrdemDeServico | null;
  onSelectOs: (os: OrdemDeServico | null) => void;
  onClose: () => void;
  onAtualizarLista?: () => void;
}

export const AssistenciaOsGrid: React.FC<AssistenciaOsGridProps> = ({
  ordens,
  osAtiva,
  onSelectOs,
  onClose,
  onAtualizarLista,
}) => {
  const [filtro, setFiltro] = useState<'TODAS' | 'PRONTO' | 'ANDAMENTO' | 'ENTREGUE'>('TODAS');
  const [busca, setBusca] = useState('');
  const [isNovaOsOpen, setIsNovaOsOpen] = useState(false);

  const prontas = useMemo(() => ordens.filter((o) => o.status === 'PRONTO'), [ordens]);
  const emAndamento = useMemo(
    () => ordens.filter((o) => o.status === 'AGUARDANDO_AVALIACAO' || o.status === 'AGUARDANDO_PECA'),
    [ordens]
  );
  const entregues = useMemo(() => ordens.filter((o) => o.status === 'ENTREGUE'), [ordens]);

  const ordensFiltradas = useMemo(() => {
    return ordens.filter((o) => {
      if (filtro === 'PRONTO' && o.status !== 'PRONTO') return false;
      if (filtro === 'ANDAMENTO' && o.status !== 'AGUARDANDO_AVALIACAO' && o.status !== 'AGUARDANDO_PECA') return false;
      if (filtro === 'ENTREGUE' && o.status !== 'ENTREGUE') return false;

      if (busca.trim()) {
        const query = busca.toLowerCase().trim();
        const numStr = String(o.numero_os);
        const nome = (o.cliente_nome || '').toLowerCase();
        const equip = (o.equipamento_descricao || '').toLowerCase();
        const tel = (o.cliente_telefone || '').toLowerCase();
        return numStr.includes(query) || nome.includes(query) || equip.includes(query) || tel.includes(query);
      }
      return true;
    });
  }, [ordens, filtro, busca]);

  const handleMudarStatus = async (id: string, novoStatus: OrdemDeServico['status']) => {
    await assistenciaApi.atualizarStatus(id, novoStatus);
    onAtualizarLista?.();
  };

  const handleNotificarWhatsApp = (os: OrdemDeServico) => {
    const fone = (os.cliente_telefone || '').replace(/\D/g, '');
    const tel = fone ? `55${fone}` : '';
    const st = os.status === 'PRONTO' ? 'Pronto p/ Retirada' : os.status.replace('_', ' ');
    const msg = encodeURIComponent(`Olá ${os.cliente_nome || 'Cliente'}, sua O.S. #${os.numero_os} (${os.equipamento_descricao}) mudou de status para: ${st}. Valor: R$ ${(os.valor_total || 0).toFixed(2)}.`);
    window.open(fone ? `https://wa.me/${tel}?text=${msg}` : `https://wa.me/?text=${msg}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden select-none animate-in fade-in duration-200">
      {/* Header do Grid de Ordens de Serviço */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>Painel de Ordens de Serviço</span>
              <span className="text-[11px] font-mono font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 rounded-full border border-teal-500/20">
                {ordens.length} OSs
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Selecione uma OS pronta para carregar os serviços no caixa e receber pagamento
            </p>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar OS, cliente, aparelho..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500 w-36 sm:w-48"
            />
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
            <button
              type="button"
              onClick={() => setFiltro('TODAS')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                filtro === 'TODAS' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500'
              }`}
            >
              Todas ({ordens.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('PRONTO')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                filtro === 'PRONTO' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-500'
              }`}
            >
              Prontas ({prontas.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('ANDAMENTO')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                filtro === 'ANDAMENTO' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-500 hover:text-teal-500'
              }`}
            >
              Em Andamento ({emAndamento.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltro('ENTREGUE')}
              className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                filtro === 'ENTREGUE' ? 'bg-slate-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Entregues ({entregues.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsNovaOsOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg text-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nova OS</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer"
            title="Fechar e voltar ao caixa (ESC / F6)"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fechar (F6)</span>
          </button>
        </div>
      </div>

      {/* Grid de Cards de OS */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Card Especial: Venda Balcão / Acessórios */}
          <button
            type="button"
            onClick={() => {
              onSelectOs(null);
              onClose();
            }}
            className={`p-3.5 rounded-2xl flex flex-col justify-between items-start text-left transition cursor-pointer border min-h-[130px] ${
              osAtiva === null
                ? 'bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-500/50'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-teal-400'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                Caixa Rápido
              </span>
            </div>
            <div className="mt-2">
              <div className="text-sm font-black">Venda Balcão / Acessórios</div>
              <div className="text-[11px] text-slate-400">Venda direta de carregadores, capas, cabos e peças</div>
            </div>
          </button>

          {/* Cards de Ordens de Serviço */}
          {ordensFiltradas.map((os) => {
            const isAtiva = osAtiva?.id === os.id;
            const isPronta = os.status === 'PRONTO';
            const total = os.valor_total || 0;

            return (
              <div
                key={os.id}
                className={`p-3.5 rounded-2xl flex flex-col justify-between text-left transition border min-h-[140px] relative ${
                  isAtiva
                    ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-500 shadow-md ring-2 ring-teal-500/40'
                    : isPronta
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60 hover:border-emerald-500 hover:shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm font-black font-mono text-teal-600 dark:text-teal-400">
                      OS #{os.numero_os}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        isPronta
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 animate-pulse'
                          : os.status === 'AGUARDANDO_PECA'
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                          : os.status === 'ENTREGUE'
                          ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      }`}
                    >
                      {isPronta ? 'Pronto p/ Entrega' : os.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {os.cliente_nome}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                      {os.equipamento_descricao}
                    </div>
                    <div className="text-[10px] text-slate-400 italic line-clamp-1 mt-0.5">
                      &quot;{os.defeito_relatado}&quot;
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400">Total a Pagar</div>
                    <div className="text-xs font-black font-mono text-slate-900 dark:text-slate-100">
                      R$ {total.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleNotificarWhatsApp(os)}
                      className="p-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white rounded-lg transition cursor-pointer"
                      title="Notificar Cliente via WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    {os.status === 'AGUARDANDO_AVALIACAO' && (
                      <button
                        type="button"
                        onClick={() => handleMudarStatus(os.id, 'PRONTO')}
                        className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-600 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        title="Marcar como Pronto"
                      >
                        Pronto
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectOs(os);
                        onClose();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                      title="Carregar itens da OS no caixa e finalizar"
                    >
                      <span>No Caixa</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <NovaOsModal
        isOpen={isNovaOsOpen}
        onClose={() => setIsNovaOsOpen(false)}
        onSuccess={() => {
          setIsNovaOsOpen(false);
          onAtualizarLista?.();
        }}
      />
    </div>
  );
};
