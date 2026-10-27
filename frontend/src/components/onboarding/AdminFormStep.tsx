import React from 'react';
import { UserPlus, Eye, EyeOff } from 'lucide-react';

interface AdminFormStepProps {
  adminNome: string;
  setAdminNome: (v: string) => void;
  adminLogin: string;
  setAdminLogin: (v: string) => void;
  adminSenha: string;
  setAdminSenha: (v: string) => void;
  adminConfirmacao: string;
  setAdminConfirmacao: (v: string) => void;
  verSenha: boolean;
  setVerSenha: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AdminFormStep: React.FC<AdminFormStepProps> = ({
  adminNome,
  setAdminNome,
  adminLogin,
  setAdminLogin,
  adminSenha,
  setAdminSenha,
  adminConfirmacao,
  setAdminConfirmacao,
  verSenha,
  setVerSenha,
  onSubmit,
}) => {
  return (
    <form id="passo2-form" onSubmit={onSubmit} className="space-y-3">
      <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
        <UserPlus className="w-4 h-4 text-emerald-400" />
        <span>Primeiro Cadastro: Administrador Principal</span>
      </div>
      <p className="text-[11px] text-slate-400">Nome e Login são automaticamente convertidos e travados em MAIÚSCULAS.</p>
      <div className="space-y-2.5">
        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">Nome Completo do Administrador *</label>
          <input
            type="text"
            required
            autoFocus
            value={adminNome}
            onChange={(e) => setAdminNome(e.target.value.toUpperCase())}
            placeholder="EX: ROBERTO SILVA"
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-white text-xs uppercase outline-none"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-300 mb-1">Usuário / Login de Acesso *</label>
          <input
            type="text"
            required
            value={adminLogin}
            onChange={(e) => setAdminLogin(e.target.value.toUpperCase())}
            placeholder="EX: ADMIN"
            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-white text-xs font-mono uppercase outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Senha (Exatamente 4 dígitos) *</label>
            <div className="relative flex items-center">
              <input
                type={verSenha ? 'text' : 'password'}
                required
                maxLength={4}
                value={adminSenha}
                onChange={(e) => setAdminSenha(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="4 dígitos"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-3 pr-8 py-1.5 text-white text-xs tracking-widest outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setVerSenha(!verSenha)}
                className="absolute right-2 text-slate-400 hover:text-white"
              >
                {verSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Confirmar Senha *</label>
            <input
              type={verSenha ? 'text' : 'password'}
              required
              maxLength={4}
              value={adminConfirmacao}
              onChange={(e) => setAdminConfirmacao(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4 dígitos"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-white text-xs tracking-widest outline-none font-mono"
            />
          </div>
        </div>
      </div>
    </form>
  );
};
