import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api.js';
import { Users, Search, CheckCircle, X, Tag } from 'lucide-react';

interface IdentificarClienteModalProps {
  isOpen: boolean;
  clienteAtual: any | null;
  onClose: () => void;
  onSelectCliente: (cliente: any | null) => void;
}

export const IdentificarClienteModal: React.FC<IdentificarClienteModalProps> = ({
  isOpen,
  clienteAtual,
  onClose,
  onSelectCliente,
}) => {
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancel = false;
    const buscar = async () => {
      setCarregando(true);
      const res = await api.listarEntidades('CLIENTE', busca);
      if (!cancel && res.success && res.data) {
        setClientes(res.data);
      }
      if (!cancel) setCarregando(false);
    };
    const timer = setTimeout(buscar, 200);
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [busca, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Topo */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Identificar Cliente (B2B / Políticas de Preço)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Busca */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por Razão Social, Nome Fantasia ou CPF/CNPJ..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          {clienteAtual && (
            <div className="mt-2.5 p-2 bg-indigo-950/40 border border-indigo-800/50 rounded-xl flex items-center justify-between text-xs text-indigo-300">
              <span>Cliente Atual: <strong>{clienteAtual.razao_social}</strong></span>
              <button
                type="button"
                onClick={() => {
                  onSelectCliente(null);
                  onClose();
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-bold underline"
              >
                Remover Identificação
              </button>
            </div>
          )}
        </div>

        {/* Lista de Clientes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[220px]">
          {carregando ? (
            <div className="text-center py-8 text-xs text-slate-500">Buscando clientes no banco local...</div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">Nenhum cliente encontrado</div>
          ) : (
            clientes.map((c) => {
              const temTabela = Boolean(c.tabela_preco_id);
              const isSelected = clienteAtual?.id === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectCliente(c);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 text-slate-200'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="font-bold text-sm truncate">{c.razao_social}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{c.cpf_cnpj || 'Sem documento'}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {temTabela && (
                      <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Tag className="w-3 h-3" /> Tabela Atacado
                      </span>
                    )}
                    {isSelected && <CheckCircle className="w-5 h-5 text-indigo-400" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
          >
            Fechar [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
