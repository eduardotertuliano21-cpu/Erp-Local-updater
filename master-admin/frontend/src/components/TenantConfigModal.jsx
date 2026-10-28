import React, { useState } from 'react';
import { api } from '../api.js';
import { TenantCredentialsCard } from './TenantCredentialsCard.jsx';
import { TenantAddressCard } from './TenantAddressCard.jsx';

export function TenantConfigModal({
  tenant,
  onClose,
  onSave,
  onRenovar30Dias,
  onMudarStatus,
  onForcarAtualizar,
  onExcluir,
}) {
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
  const [atualizandoRemoto, setAtualizandoRemoto] = useState(false);

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
      setAlerta({ tipo: 'sucesso', texto: 'Configurações salvas e sincronizadas com o ERP!' });
      if (onSave) onSave(res.tenant || formData);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setAlerta({ tipo: 'erro', texto: 'Erro ao salvar: ' + err.message });
    } finally {
      setSalvando(false);
    }
  };

  const handleDispararUpdate = async () => {
    setAtualizandoRemoto(true);
    try {
      if (onForcarAtualizar) await onForcarAtualizar(formData);
      setAlerta({ tipo: 'sucesso', texto: 'Comando de atualização remota enviado ao ERP!' });
    } catch (err) {
      setAlerta({ tipo: 'erro', texto: 'Falha: ' + err.message });
    } finally {
      setAtualizandoRemoto(false);
    }
  };

  const rKey = formData.ramo_atuacao || 'mercado';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden my-auto">
        {/* Cabeçalho da Janela */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                {formData.nomeFantasia || formData.razaoSocial}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                formData.statusLicenca === 'ATIVA'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {formData.statusLicenca}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              CNPJ: {formData.cnpj || 'ISENTO'} • Chave: <span className="text-cyan-400">{formData.chaveLicenca}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer text-base"
            title="Fechar Janela"
          >
            ✕
          </button>
        </div>

        {/* Barra de Ações Remotas Rápidas */}
        <div className="p-3 sm:px-5 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={handleDispararUpdate} disabled={atualizandoRemoto} className="px-3 py-1.5 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5" title="Forçar download do GitHub e reinstalação no ERP">
              <span>🔄</span><span>{atualizandoRemoto ? 'Enviando...' : 'Atualizar Sistema (GitHub)'}</span>
            </button>
            <button type="button" onClick={() => { if (onRenovar30Dias) onRenovar30Dias(formData); setAlerta({ tipo: 'sucesso', texto: 'Renovação de +30 dias aplicada!' }); }} className="px-3 py-1.5 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 font-bold rounded-lg transition cursor-pointer">
              📅 +30 Dias Licença
            </button>
            {formData.statusLicenca === 'ATIVA' ? (
              <button type="button" onClick={() => { setFormData({ ...formData, statusLicenca: 'BLOQUEADA' }); if (onMudarStatus) onMudarStatus(formData.id, 'BLOQUEADA'); }} className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/40 text-rose-300 font-semibold rounded-lg cursor-pointer">
                🔒 Travar PDV
              </button>
            ) : (
              <button type="button" onClick={() => { setFormData({ ...formData, statusLicenca: 'ATIVA' }); if (onMudarStatus) onMudarStatus(formData.id, 'ATIVA'); }} className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/40 text-emerald-300 font-semibold rounded-lg cursor-pointer">
                🔓 Liberar PDV
              </button>
            )}
          </div>
          <button type="button" onClick={() => { if (onExcluir) onExcluir(formData); onClose(); }} className="text-xs text-slate-500 hover:text-rose-400 transition cursor-pointer ml-auto" title="Excluir Loja do Painel">
            🗑️ Excluir Loja
          </button>
        </div>

        {/* Mensagem de Feedback */}
        {alerta && (
          <div className={`mx-4 sm:mx-5 mt-4 p-3 rounded-xl text-xs font-bold flex items-center justify-between ${
            alerta.tipo === 'sucesso'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}>
            <span>{alerta.texto}</span>
            <button onClick={() => setAlerta(null)} className="cursor-pointer opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Formulário com Scroll Interno */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
          {/* Card 1: Credenciais e Login */}
          <TenantCredentialsCard
            formData={formData}
            setFormData={setFormData}
            onGerarLogin={handleGerarLogin}
          />

          {/* Card 2: Ramo de Atuação & Licenciamento */}
          <div className="p-4 sm:p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>🛡️</span>
              <span>Ramo de Atuação & Licença Cloud</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-amber-400 font-bold block mb-1">Ramo de Atuação</label>
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

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>📄</span> Módulo Fiscal NF-e / DANFE
                </div>
                <div className="text-[11px] text-slate-400">
                  Ativa emissão de NFC-e e visualização de DANFE para esta loja individualmente
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(formData.moduloNfe)}
                  onChange={(e) => setFormData({ ...formData, moduloNfe: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-700 text-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-300">
                  {formData.moduloNfe ? <span className="text-emerald-400">LIBERADO</span> : <span className="text-slate-500">BLOQUEADO</span>}
                </span>
              </label>
            </div>
          </div>

          {/* Card 3: Dados & Endereço Separado */}
          <TenantAddressCard
            formData={formData}
            setFormData={setFormData}
            buscandoCep={buscandoCep}
            onCepChange={handleCepChange}
          />

          {/* Rodapé com Botões de Ação */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800 sticky bottom-0 bg-slate-900/90 py-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-sm text-slate-400 hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="w-full sm:w-auto px-7 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/20 cursor-pointer transition disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : '💾 Salvar Alterações e Sincronizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
