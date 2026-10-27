import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api.js';
import { Users, Search, CheckCircle, ShieldAlert } from 'lucide-react';

interface ConvenioClienteSelectorProps {
  totalPagar: number;
  onSelectCliente: (cliente: any | null, bloqueado: boolean) => void;
}

export const ConvenioClienteSelector: React.FC<ConvenioClienteSelectorProps> = ({
  totalPagar,
  onSelectCliente,
}) => {
  const [clientes, setClientes] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<any | null>(null);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    let cancel = false;
    const buscar = async () => {
      setCarregando(true);
      const res = await api.listarEntidades('CLIENTE', busca);
      if (!cancel && res.success && res.data) {
        setClientes(res.data);
      }
      if (!cancel) setCarregando(false);
    };
    const timer = setTimeout(buscar, 250);
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [busca]);

  const handleEscolher = (c: any) => {
    setClienteSelecionado(c);
    const limite = Number(c.limite_credito || 0);
    const devedor = Number(c.saldo_devedor || 0);
    const disponivel = Math.max(0, limite - devedor);
    const bloqueado = limite > 0 ? totalPagar > disponivel : false;
    onSelectCliente(c, bloqueado);
  };

  const limite = Number(clienteSelecionado?.limite_credito || 0);
  const devedor = Number(clienteSelecionado?.saldo_devedor || 0);
  const disponivel = Math.max(0, limite - devedor);
  const bloqueado = clienteSelecionado && limite > 0 && totalPagar > disponivel;

  return (
    <div className="space-y-3 bg-black/40 p-4 rounded-xl border border-white/[0.08]">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-mono">
          <Users className="w-4 h-4" /> Selecionar Cliente do Convênio/Fiado:
        </label>
        {clienteSelecionado && (
          <button
            type="button"
            onClick={() => { setClienteSelecionado(null); onSelectCliente(null, true); }}
            className="text-[11px] text-zinc-400 hover:text-white underline"
          >
            Trocar Cliente
          </button>
        )}
      </div>

      {!clienteSelecionado ? (
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite o nome ou CPF do cliente..."
              className="w-full bg-black/60 border border-white/[0.12] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="max-h-36 overflow-y-auto divide-y divide-white/[0.06] border border-white/[0.06] rounded-xl bg-black/30">
            {carregando ? (
              <div className="p-3 text-center text-xs text-zinc-500">Buscando clientes...</div>
            ) : clientes.length === 0 ? (
              <div className="p-3 text-center text-xs text-zinc-500">Nenhum cliente cadastrado encontrado</div>
            ) : (
              clientes.map((c) => {
                const lim = Number(c.limite_credito || 0);
                const dev = Number(c.saldo_devedor || 0);
                const disp = Math.max(0, lim - dev);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleEscolher(c)}
                    className="p-2.5 hover:bg-white/[0.06] cursor-pointer flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <div className="font-bold text-white">{c.razao_social}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{c.cpf_cnpj}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-[11px] text-emerald-400 font-bold">Disp: R$ {disp.toFixed(2)}</div>
                      <div className="text-[10px] text-zinc-500">Limite: R$ {lim.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="bg-white/[0.04] p-3 rounded-xl border border-white/[0.08] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">{clienteSelecionado.razao_social}</div>
              <div className="text-[11px] font-mono text-zinc-400">{clienteSelecionado.cpf_cnpj}</div>
            </div>
            <div className="text-right font-mono">
              <div className="text-[10px] text-zinc-400">Limite Total: R$ {limite.toFixed(2)}</div>
              <div className="text-[10px] text-amber-400">Saldo Devedor: R$ {devedor.toFixed(2)}</div>
              <div className="text-xs font-bold text-emerald-400">Disponível: R$ {disponivel.toFixed(2)}</div>
            </div>
          </div>

          {bloqueado ? (
            <div className="p-3 bg-rose-950/80 border border-rose-600/60 rounded-xl text-rose-200 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <div className="font-black text-rose-300 uppercase tracking-wide">
                  ⚠️ Limite de Crédito Insuficiente
                </div>
                <div className="text-[11px] text-rose-200/90 mt-0.5">
                  Disponível: R$ {disponivel.toFixed(2)} | Total a Pagar: R$ {totalPagar.toFixed(2)}. Solicite autorização de gerente ou altere o pagamento.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-950/40 border border-emerald-600/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Limite suficiente para aprovação do convênio.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
