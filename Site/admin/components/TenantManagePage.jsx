import React, { useState } from 'react';
import { api } from '../api.js';
import { TenantCredentialsCard } from './TenantCredentialsCard.jsx';
import { TenantSubscriptionCard } from './TenantSubscriptionCard.jsx';
import { TenantAddressCard } from './TenantAddressCard.jsx';

export function TenantManagePage({ tenant, onVoltar, onSave, onAtualizarSistema }) {
  const [formData, setFormData] = useState({
    ...tenant,
    administradorLogin: tenant.administradorLogin || '',
    administradorNome: tenant.administradorNome || '',
    administradorEmail: tenant.administradorEmail || tenant.email || '',
    novaSenha: '',
  });

  const [salvando, setSalvando] = useState(false);
  const [alerta, setAlerta] = useState(null);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [disparandoUpdate, setDisparandoUpdate] = useState(false);

  const handleGerarLogin = () => {
    const base = formData.nomeFantasia || formData.razaoSocial || 'loja';
    const sugerido = base
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    setFormData((prev) => ({ ...prev, administradorLogin: sugerido || 'admin' }));
  };

  const handleCepChange = async (valor) => {
    const cepLimpo = valor.replace(/\D/g, '');
    let cepFmt = valor;
    if (cepLimpo.length <= 5) cepFmt = cepLimpo;
    else cepFmt = `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5, 8)}`;

    setFormData((prev) => ({ ...prev, cep: cepFmt }));

    if (cepLimpo.length === 8) {
      setBuscandoCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            logradouro: data.logradouro || prev.logradouro,
            bairro: data.bairro || prev.bairro,
            cidade: data.localidade || prev.cidade,
            estado: data.uf || prev.estado,
          }));
        }
      } catch {}
      setBuscandoCep(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.administradorLogin.trim()) {
      setAlerta({ tipo: 'erro', texto: 'Informe ou gere um Login para o Administrador da Loja.' });
      return;
    }
    setSalvando(true);
    setAlerta(null);
    try {
      const res = await api.updateTenant(formData.id, formData);
      setAlerta({ tipo: 'sucesso', texto: 'Configurações e credenciais da loja salvas com sucesso!' });
      if (onSave) onSave(res.tenant || formData);
    } catch (err) {
      setAlerta({ tipo: 'erro', texto: 'Erro ao salvar: ' + err.message });
    } finally {
      setSalvando(false);
    }
  };

  const handleUpdateClick = async () => {
    if (onAtualizarSistema) {
      onAtualizarSistema(tenant);
      return;
    }
    setDisparandoUpdate(true);
    try {
      const res = await api.forcarAtualizacaoTenant(tenant.id);
      setAlerta({ tipo: 'sucesso', texto: res.mensagem || 'Comando de atualização enviado!' });
    } catch (err) {
      setAlerta({ tipo: 'erro', texto: 'Falha: ' + err.message });
    } finally {
      setDisparandoUpdate(false);
    }
  };

  const rKey = formData.ramo_atuacao || 'mercado';

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Header com Botão Voltar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onVoltar}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Voltar para Lista de Lojas</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white">{formData.nomeFantasia || formData.razaoSocial}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                formData.statusLicenca === 'ATIVA' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>{formData.statusLicenca}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              CNPJ: {formData.cnpj || 'ISENTO'} • Chave: <span className="text-cyan-400">{formData.chaveLicenca}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUpdateClick}
            disabled={disparandoUpdate}
            className="px-3.5 py-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 text-xs font-bold rounded-xl shadow-lg transition cursor-pointer"
          >
            {disparandoUpdate ? 'Disparando...' : '🔄 Atualizar Sistema (GitHub)'}
          </button>
        </div>
      </div>

      {alerta && (
        <div className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between ${
          alerta.tipo === 'sucesso' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
        }`}>
          <span>{alerta.texto}</span>
          <button onClick={() => setAlerta(null)} className="cursor-pointer opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Login e Credenciais do ERP da Loja */}
        <TenantCredentialsCard
          formData={formData}
          setFormData={setFormData}
          onGerarLogin={handleGerarLogin}
        />

        {/* Card 2: Ramo de Atuação & Licenciamento */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>🛡️</span>
            <span>Ramo de Atuação & Licenciamento SaaS</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-amber-400 font-bold block mb-1">Ramo de Atuação (Nicho)</label>
              <select
                value={rKey}
                onChange={(e) => setFormData({ ...formData, ramo_atuacao: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-medium outline-none"
              >
                <option value="mercado">🛒 Mercado / Varejo</option>
                <option value="restaurante">🍽️ Restaurante / Food</option>
                <option value="acougue">🥩 Açougue / Peso</option>
                <option value="autopecas">🚗 Autopeças</option>
                <option value="assistencia">🔧 Assistência Técnica</option>
                <option value="roupas">👕 Vestuário / Roupas</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-cyan-400 font-bold block mb-1">Status da Licença</label>
              <select
                value={formData.statusLicenca}
                onChange={(e) => setFormData({ ...formData, statusLicenca: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white outline-none"
              >
                <option value="ATIVA">ATIVA (Liberado)</option>
                <option value="BLOQUEADA">BLOQUEADA (Travar PDV)</option>
                <option value="INADIMPLENTE">INADIMPLENTE</option>
                <option value="TESTE">TESTE (Trial)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">Vencimento da Licença</label>
              <input
                type="date"
                value={formData.dataExpiracao || ''}
                onChange={(e) => setFormData({ ...formData, dataExpiracao: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">Dias de Carência</label>
              <input
                type="number"
                value={formData.diasCarencia || 0}
                onChange={(e) => setFormData({ ...formData, diasCarencia: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>📄</span> Módulo Fiscal NF-e / DANFE (Sem Alterar Plano / Sem Cobrança Adicional)
              </div>
              <div className="text-[11px] text-slate-400">
                Habilita ou desabilita emissão de NF-e (Modelo 55), DANFE A4 e NFC-e diretamente para esta loja sem alterar o plano nem cobrar valor extra.
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.moduloNfe)}
                onChange={async (e) => {
                  const checked = e.target.checked;
                  setFormData((prev) => ({ ...prev, moduloNfe: checked }));
                  try {
                    const res = await api.toggleTenantModuloNfe(formData.id, checked);
                    if (onSave) onSave(res.tenant || { ...formData, moduloNfe: checked });
                    setAlerta({ tipo: 'sucesso', texto: `Módulo NF-e / DANFE ${checked ? 'HABILITADO' : 'DESABILITADO'} com sucesso (sem custo extra)!` });
                  } catch {}
                }}
                className="w-5 h-5 rounded border-slate-700 text-emerald-500 cursor-pointer"
              />
              <span className="text-xs font-bold">
                {formData.moduloNfe ? <span className="text-emerald-400">LIBERADO</span> : <span className="text-slate-500">DESABILITADO</span>}
              </span>
            </label>
          </div>
        </div>

        {/* Card 3: Plano, Máquinas & Cobrança Extra */}
        <TenantSubscriptionCard
          formData={formData}
          setFormData={setFormData}
        />

        {/* Card 4: Dados Cadastrais & Endereço */}
        <TenantAddressCard
          formData={formData}
          setFormData={setFormData}
          buscandoCep={buscandoCep}
          onCepChange={handleCepChange}
        />

        {/* Botão de Salvar Principal */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onVoltar}
            className="px-5 py-2.5 text-sm text-slate-400 hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer transition disabled:opacity-50"
          >
            {salvando ? 'Salvando no Servidor...' : '💾 Salvar Alterações e Sincronizar com ERP'}
          </button>
        </div>
      </form>
    </div>
  );
}
