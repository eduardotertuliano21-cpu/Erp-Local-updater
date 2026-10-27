import React from 'react';

interface FuncionarioFieldsProps {
  cargo: string;
  setCargo: (val: string) => void;
  matricula: string;
  setMatricula: (val: string) => void;
  pin: string;
  setPin: (val: string) => void;
  comissaoPercentual: string;
  setComissaoPercentual: (val: string) => void;
  limiteDesconto: string;
  setLimiteDesconto: (val: string) => void;
}

export const FuncionarioFields: React.FC<FuncionarioFieldsProps> = ({
  cargo,
  setCargo,
  matricula,
  setMatricula,
  pin,
  setPin,
  comissaoPercentual,
  setComissaoPercentual,
  limiteDesconto,
  setLimiteDesconto,
}) => {
  return (
    <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-4">
      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide flex items-center gap-1.5">
          <span>⚡</span> Dados de Acesso ao Caixa & Funções
        </span>
        <span className="text-[10px] text-indigo-400 font-mono">Sincroniza com PDV</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Cargo / Nível de Acesso *</label>
          <select
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            className="w-full bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-2 text-indigo-200 text-sm focus:border-indigo-400 focus:outline-none"
          >
            <option value="GARCOM">Garçom / Atendente (Acesso Comanda Mobile)</option>
            <option value="OPERADOR_CAIXA">Operador de Caixa (Vendas no PDV)</option>
            <option value="SUPERVISOR">Supervisor de Loja (Autoriza F4/F5/F9)</option>
            <option value="GERENTE">Gerente Geral (Acesso Total)</option>
            <option value="VENDEDOR">Vendedor Balcão (Comissões)</option>
            <option value="ESTOQUISTA">Estoquista / Conferente</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Matrícula / Usuário de Login PDV *
          </label>
          <input
            type="text"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            placeholder="Ex: 01, OP02, CARLOS"
            className="w-full bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-2 text-white font-mono font-bold text-sm focus:border-indigo-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">PIN / Senha Numérica PDV *</label>
          <input
            type="text"
            maxLength={8}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="1234"
            className="w-full bg-slate-950 border border-indigo-500/50 rounded-lg px-3 py-2 text-amber-400 font-mono font-black text-sm tracking-widest focus:border-indigo-400 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500">Para abrir caixa ou autorizar</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Comissão Vendas (%)</label>
          <input
            type="text"
            value={comissaoPercentual}
            onChange={(e) => setComissaoPercentual(e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Limite Desconto (%)</label>
          <input
            type="text"
            value={limiteDesconto}
            onChange={(e) => setLimiteDesconto(e.target.value)}
            placeholder="5.00"
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-rose-400 font-mono font-bold text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
