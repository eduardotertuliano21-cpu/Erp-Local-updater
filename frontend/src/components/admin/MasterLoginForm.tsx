import React, { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface MasterLoginFormProps {
  onSubmit: (usuario: string, senha: string) => Promise<void>;
  loading: boolean;
  erro: string | null;
}

export const MasterLoginForm: React.FC<MasterLoginFormProps> = ({ onSubmit, loading, erro }) => {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(usuario, senha);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4 py-4 select-none">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-2">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-black text-white">Autenticação Mestre Requerida</h3>
        <p className="text-xs text-slate-400">Insira as credenciais do desenvolvedor para liberar o terminal.</p>
      </div>

      {erro && <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs text-center">{erro}</div>}

      <div className="space-y-3 pt-2">
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Usuário Mestre</label>
          <input
            type="text"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            placeholder="usuario.mestre"
            autoFocus
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Senha Mestre</label>
          <div className="relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-black rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
        <span>Acessar Painel Mestre</span>
      </button>
    </form>
  );
};
