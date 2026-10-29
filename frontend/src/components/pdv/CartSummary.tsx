import React, { useState, useEffect } from 'react';
import type { ItemCarrinho } from '../../types/pdv.js';
import { ArrowRight, SlidersHorizontal, Check } from 'lucide-react';
import { useStoreConfig } from '../../context/ConfigProvider.js';
import { api } from '../../services/api.js';

interface CartSummaryProps {
  itens: ItemCarrinho[];
  subtotal: number;
  descontoTotal: number;
  totalLiquido: number;
  quantidadeTotalItens: number;
  caixaNumero?: number;
  operadorNome?: string;
  isOnline?: boolean;
  logoUrl?: string;
  nomeLoja?: string;
  modoFiscalAtivo?: boolean;
  clienteIdentificado?: any | null;
  onIdentificarCliente?: () => void;
  onFinalizarVenda?: () => void;
  onAcaoSecundaria?: () => void;
}

export const CartSummary: React.FC<CartSummaryProps> = ({
  itens,
  subtotal,
  descontoTotal,
  totalLiquido,
  quantidadeTotalItens,
  caixaNumero = 1,
  operadorNome = 'Operador',
  isOnline = true,
  logoUrl,
  nomeLoja,
  modoFiscalAtivo = false,
  clienteIdentificado,
  onIdentificarCliente,
  onFinalizarVenda,
  onAcaoSecundaria,
}) => {
  const { config } = useStoreConfig();
  const balancaAtiva = Boolean(config?.balanca_checkout_ativa);
  const [balancaStatus, setBalancaStatus] = useState<{ porta?: string; online: boolean }>({ online: false });

  useEffect(() => {
    if (!balancaAtiva) return;
    let ativo = true;

    const checarStatus = async () => {
      try {
        const res = await api.obterStatusBalanca();
        if (ativo && (res.success || (res as any).sucesso) && res.data) {
          setBalancaStatus({
            porta: res.data.portaAtiva || (res.data.portaConfigurada !== 'AUTO' ? res.data.portaConfigurada : undefined),
            online: Boolean(res.data.portaAtiva || (res.data.portasDisponiveis && res.data.portasDisponiveis.length > 0)),
          });
        }
      } catch {}
    };

    checarStatus();
    const interval = setInterval(checarStatus, 4000);
    return () => {
      ativo = false;
      clearInterval(interval);
    };
  }, [balancaAtiva]);

  const ultimoItem = itens.length > 0 ? itens[itens.length - 1] : null;

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 shadow-md rounded-xl p-3 sm:p-4 flex flex-col justify-between border border-slate-200 dark:border-slate-800 select-none overflow-y-auto transition-colors">
      {/* 1. Topo: Logo & Status do Caixa / Operador */}
      <div className="pb-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-8 h-8 rounded-lg object-contain border border-slate-200 dark:border-slate-700 p-0.5 bg-white dark:bg-slate-800 shrink-0 shadow-xs" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
              {nomeLoja ? nomeLoja.charAt(0).toUpperCase() : '⚡'}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100 tracking-tight leading-tight uppercase truncate max-w-[140px] xl:max-w-[180px]">
              {nomeLoja || 'CLICKSTORM PDV'}
            </div>
            <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5 flex-wrap">
              <span>Terminal</span>
              {modoFiscalAtivo && Boolean(config?.modulo_nfe) && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  NFC-E ATIVA
                </span>
              )}
              {balancaAtiva && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-1 border transition-colors ${
                    balancaStatus.online
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                  title={balancaStatus.online ? `Balança Conectada (${balancaStatus.porta || 'Serial'})` : 'Procurando Balança na porta serial...'}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${balancaStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{balancaStatus.online ? `Balança Pronta (${balancaStatus.porta || 'COM'})` : 'Procurando Balança...'}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0">
          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            CX #{String(caixaNumero).padStart(2, '0')}
          </span>
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            <span className="max-w-[70px] truncate">{operadorNome}</span>
          </div>
        </div>
      </div>

      {/* Identificação de Cliente / Políticas de Preço */}
      <div className="py-2 px-1 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 text-xs">
        {clienteIdentificado ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {clienteIdentificado.tabela_preco_id ? 'ATACADO' : 'CLIENTE'}
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]" title={clienteIdentificado.razao_social}>
              {clienteIdentificado.razao_social}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Venda ao Consumidor</span>
        )}
        <button
          type="button"
          onClick={onIdentificarCliente}
          className="text-[11px] font-bold text-indigo-500 hover:text-indigo-400 hover:underline cursor-pointer"
        >
          {clienteIdentificado ? 'Alterar' : '+ Cliente (B2B)'}
        </button>
      </div>

      {/* 2. Display do Item Atual */}
      <div className="my-3 space-y-2">
        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Leitura do Momento ({quantidadeTotalItens} {quantidadeTotalItens === 1 ? 'item' : 'itens'})
        </div>

        {ultimoItem ? (
          <div className="space-y-2">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block mb-0.5">Descrição do Item</span>
              <div className="font-black text-slate-900 dark:text-slate-100 text-base leading-tight truncate" title={ultimoItem.descricao}>
                {ultimoItem.descricao}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Quantidade</span>
                <span className="text-xl xl:text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
                  {ultimoItem.quantidade}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block mb-0.5">Valor Unitário</span>
                <span className="text-xl xl:text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
                  R$ {ultimoItem.preco_unitario.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 xl:p-6 bg-slate-50/70 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700/60 rounded-xl text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
            Nenhum item bipado no momento
          </div>
        )}

        {/* Resumo de Subtotal e Desconto */}
        {descontoTotal > 0 && (
          <div className="flex justify-between items-center px-1 text-xs text-rose-600 dark:text-rose-400 font-bold">
            <span>Descontos Aplicados:</span>
            <span>- R$ {descontoTotal.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* 3. BLOCO DE TOTAL - Feedback Vermelho no Modo Fiscal ou Emerald Padrão */}
      <div
        className={`rounded-xl p-3.5 xl:p-5 flex flex-col items-center justify-center mt-auto shadow-inner border transition-all shrink-0 ${
          modoFiscalAtivo
            ? 'bg-rose-950/90 text-rose-400 border-rose-800/80 shadow-rose-950/50'
            : 'bg-slate-900 text-emerald-400 border-slate-800'
        }`}
      >
        <span className={`text-xs font-black tracking-widest uppercase ${modoFiscalAtivo ? 'text-rose-300' : 'text-slate-400'}`}>
          {modoFiscalAtivo ? 'TOTAL A PAGAR (NFC-E ATIVA)' : 'TOTAL A PAGAR'}
        </span>
        <div className={`text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight tabular-nums my-1 drop-shadow-sm ${modoFiscalAtivo ? 'text-rose-400' : 'text-emerald-400'}`}>
          R$ {totalLiquido.toFixed(2)}
        </div>
        <span className={`text-xs font-semibold ${modoFiscalAtivo ? 'text-rose-300/80' : 'text-slate-400'}`}>
          Subtotal: R$ {subtotal.toFixed(2)}
        </span>
      </div>

      {/* 4. Botões de Ação */}
      <div className="space-y-2 mt-2.5 shrink-0">
        <button
          type="button"
          onClick={onAcaoSecundaria}
          className="w-full h-12 xl:h-15 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 font-bold text-sm xl:text-base rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer border border-slate-300 dark:border-slate-700 px-3"
          title="Abrir Opções do Caixa / Conferência (F7)"
        >
          <SlidersHorizontal className="w-4 h-4 xl:w-5 xl:h-5 text-slate-700 dark:text-slate-300 shrink-0" />
          <span className="truncate">[F7] OPÇÕES DO CAIXA</span>
        </button>

        {/* Botão primário: Vermelho se modo fiscal ativo, Brand caso contrário */}
        <button
          type="button"
          onClick={onFinalizarVenda}
          disabled={itens.length === 0}
          className={`w-full h-14 xl:h-18 active:opacity-90 text-white font-black text-base sm:text-lg xl:text-xl rounded-xl transition-all shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer px-3 ${
            modoFiscalAtivo
              ? 'bg-rose-600 hover:bg-rose-500 border border-rose-500 shadow-rose-950/60'
              : 'bg-brand hover:bg-brand-hover'
          }`}
          title="Finalizar Venda e Abrir Pagamento (F10)"
        >
          <Check className="w-5 h-5 xl:w-6 xl:h-6 stroke-[3] text-white shrink-0" />
          <span className="text-white font-black truncate">
            {modoFiscalAtivo ? '[F10] FINALIZAR (FISCAL)' : '[F10] FINALIZAR VENDA'}
          </span>
          <ArrowRight className="w-5 h-5 xl:w-6 xl:h-6 ml-0.5 text-white shrink-0" />
        </button>
      </div>
    </div>
  );
};
