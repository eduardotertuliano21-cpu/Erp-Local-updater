import React, { useState } from 'react';
import { ShieldCheck, User, Lock, ArrowRight, Zap, AlertCircle, Wifi } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { NetworkTerminalSelectorModal } from '../network/NetworkTerminalSelectorModal.js';

interface LoginScreenProps {
  onLoginSuccess: (destino: 'PDV' | 'RETAGUARDA') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { login, carregando } = useAuth();
  const [loginInput, setLoginInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !senhaInput) {
      setErro('Informe o usuário e a senha de acesso.');
      return;
    }

    setErro(null);
    const res = await login(loginInput.trim(), senhaInput);

    if (res.success && res.hierarquia) {
      if (res.hierarquia === 'ADMIN' || res.hierarquia === 'GERENTE') {
        onLoginSuccess('RETAGUARDA');
      } else {
        onLoginSuccess('PDV');
      }
    } else {
      setErro(res.error || 'Credenciais inválidas. Verifique seu login e senha.');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 font-sans select-none p-4 z-50">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        <button
          type="button"
          onClick={() => setIsNetworkModalOpen(true)}
          className="absolute top-5 right-5 p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-blue-400 rounded-xl transition border border-slate-700/60 cursor-pointer"
          title="Configuração Multi-Terminal (Rede LAN)"
        >
          <Wifi className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 text-white mb-1">
            <Zap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            CLICK<span className="text-blue-500">STORM</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Autenticação Segura • Identificação Automática de Perfil
          </p>
        </div>

        {erro && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-300 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 ml-1">Usuário / Login</label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                autoFocus
                autoComplete="off"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value.toUpperCase())}
                placeholder="DIGITE SEU USUÁRIO OU LOGIN"
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 transition outline-none uppercase font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 ml-1">Senha de Acesso / PIN (4 dígitos)</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                autoComplete="new-password"
                maxLength={4}
                value={senhaInput}
                onChange={(e) => setSenhaInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="w-full bg-slate-950/70 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 transition outline-none tracking-widest font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <span>{carregando ? 'Identificando e Autenticando...' : 'Entrar no Sistema'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 pt-1">
          O sistema detecta seu nível de acesso (Administrador, Gerente ou Operador) de forma automática.
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-600 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500/70" />
          <span>ClickStorm Enterprise Guard • Criptografia SHA-256</span>
        </div>
      </div>

      <NetworkTerminalSelectorModal
        isOpen={isNetworkModalOpen}
        onClose={() => setIsNetworkModalOpen(false)}
      />
    </div>
  );
};
