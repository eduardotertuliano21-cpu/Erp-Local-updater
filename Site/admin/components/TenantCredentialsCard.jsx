import React from 'react';

export function TenantCredentialsCard({ formData, setFormData, onGerarLogin }) {
  const gerarChave = () => {
    const cnpjLimpo = String(formData.cnpj || '').replace(/\D/g, '');
    const sufixo = (cnpjLimpo.slice(0, 8) || Math.floor(100000 + Math.random() * 900000).toString()).toUpperCase();
    setFormData((prev) => ({ ...prev, chaveLicenca: `CS-2026-${sufixo}` }));
  };

  const gerarPin4Digitos = () => {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    setFormData((prev) => ({ ...prev, senhaPrimeiroAcesso: pin, novaSenha: pin }));
  };

  return (
    <div className="p-5 bg-slate-900/90 border-2 border-cyan-500/30 rounded-2xl space-y-4 shadow-xl shadow-cyan-950/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🔑</span>
            <span>Chave de Licença & Senha de Primeiro Login (ERP / PDV)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Envie a Chave de Licença e a Senha Inicial abaixo para o cliente ativar o primeiro acesso
          </p>
        </div>
        {!formData.administradorLogin && (
          <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-lg animate-pulse">
            ⚠️ Loja sem Login Definido
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/70 p-3.5 rounded-xl border border-cyan-500/20">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-cyan-400">Chave de Licença (Token de Ativação)</label>
            <button type="button" onClick={gerarChave} className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer">
              ⚡ Gerar Nova Chave
            </button>
          </div>
          <input
            type="text"
            value={formData.chaveLicenca || ''}
            onChange={(e) => setFormData({ ...formData, chaveLicenca: e.target.value.toUpperCase().trim() })}
            placeholder="Ex: CS-2026-123456"
            className="w-full p-2.5 bg-slate-900 border border-cyan-500/40 rounded-xl text-sm text-cyan-300 font-mono font-bold focus:border-cyan-400 outline-none"
          />
          <p className="text-[10px] text-slate-400 mt-1">Chave usada pelo cliente para ativar o servidor e caixas.</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-amber-400">Senha de Primeiro Login (PIN 4 Dígitos)</label>
            <button type="button" onClick={gerarPin4Digitos} className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer">
              🎲 Gerar PIN 4 Dígitos
            </button>
          </div>
          <input
            type="text"
            maxLength={12}
            value={formData.novaSenha !== '' && formData.novaSenha !== undefined ? formData.novaSenha : (formData.senhaPrimeiroAcesso || '1234')}
            onChange={(e) => setFormData({ ...formData, senhaPrimeiroAcesso: e.target.value, novaSenha: e.target.value })}
            placeholder="Ex: 1234"
            className="w-full p-2.5 bg-slate-900 border border-amber-500/40 rounded-xl text-sm text-amber-300 font-mono font-bold focus:border-amber-400 outline-none"
          />
          <p className="text-[10px] text-slate-400 mt-1">Senha solicitada junto com a chave no primeiro acesso e login do Admin.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-cyan-400">Login da Loja (Usuário)</label>
            <button type="button" onClick={onGerarLogin} className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer">
              ⚡ Gerar Login
            </button>
          </div>
          <input
            type="text"
            required
            value={formData.administradorLogin}
            onChange={(e) => setFormData({ ...formData, administradorLogin: e.target.value.toLowerCase().replace(/\s/g, '') })}
            placeholder="Ex: lojinhachina"
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono font-bold focus:border-cyan-400 outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Nome do Responsável</label>
          <input
            type="text"
            value={formData.administradorNome}
            onChange={(e) => setFormData({ ...formData, administradorNome: e.target.value })}
            placeholder="Ex: Eduardo Silva"
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">E-mail do Administrador</label>
          <input
            type="email"
            value={formData.administradorEmail}
            onChange={(e) => setFormData({ ...formData, administradorEmail: e.target.value })}
            placeholder="Ex: contato@loja.com"
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none"
          />
        </div>
      </div>
    </div>
  );
}
