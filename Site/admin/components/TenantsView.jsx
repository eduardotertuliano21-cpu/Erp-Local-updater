import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { TenantConfigModal } from './TenantConfigModal.jsx';

export function TenantsView() {
  const [tenants, setTenants] = useState([]);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [configTenant, setConfigTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alerta, setAlerta] = useState(null);

  const carregarTenants = (silencioso = false) => {
    if (!silencioso) setLoading(true);
    api.getTenants(busca, statusFiltro)
      .then((data) => setTenants(data.itens || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarTenants();
    const timer = setInterval(() => carregarTenants(true), 8000);
    return () => clearInterval(timer);
  }, [statusFiltro]);

  const handleTrocarRamo = async (tenantId, novoRamo, e) => {
    if (e) e.stopPropagation();
    try {
      await api.updateTenant(tenantId, { ramo_atuacao: novoRamo });
      setAlerta({ tipo: 'sucesso', texto: `Ramo alterado com sucesso para ${novoRamo.toUpperCase()}! Sincronizando com ERP...` });
      carregarTenants(true);
    } catch (err) {
      setAlerta({ tipo: 'erro', texto: 'Erro ao alterar ramo: ' + err.message });
    }
  };

  const handleToggleModuloNfe = async (tenant, e) => {
    if (e) e.stopPropagation();
    const novoValor = !Boolean(tenant.moduloNfe);
    try {
      await api.toggleTenantModuloNfe(tenant.id, novoValor);
      setTenants((prev) => prev.map((item) => (item.id === tenant.id ? { ...item, moduloNfe: novoValor } : item)));
      setAlerta({
        tipo: 'sucesso',
        texto: `Módulo Fiscal NF-e / DANFE ${novoValor ? 'HABILITADO' : 'DESABILITADO'} para "${tenant.nomeFantasia || tenant.razaoSocial}" (sem alterar plano ou cobrança adicional)!`,
      });
      carregarTenants(true);
    } catch (err) {
      setAlerta({ tipo: 'erro', texto: 'Erro ao alternar módulo NF-e: ' + err.message });
    }
  };

  const handleMudarStatus = async (id, novoStatus) => {
    await api.updateTenantStatus(id, novoStatus);
    carregarTenants(true);
  };

  const handleRenovar30Dias = async (tenant) => {
    const hoje = new Date();
    const atual = new Date(tenant.dataExpiracao);
    const base = atual > hoje ? atual : hoje;
    const novaData = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await api.updateTenantStatus(tenant.id, 'ATIVA', 0, novaData);
    carregarTenants(true);
  };

  const handleForcarAtualizar = async (t) => {
    const nome = t.nomeFantasia || t.razaoSocial || 'Loja';
    if (!window.confirm(`Deseja forçar a atualização remota do sistema para "${nome}"?\n\nO sistema ERP baixará a versão oficial do GitHub e reinstalará mesmo que já esteja na mesma versão.`)) return;
    try {
      const res = await api.forcarAtualizacaoTenant(t.id);
      setAlerta({ tipo: 'sucesso', texto: res.mensagem || 'Comando de atualização enviado com sucesso!' });
      carregarTenants(true);
    } catch (err) {
      setAlerta({ tipo: 'erro', texto: 'Falha ao enviar comando: ' + err.message });
      throw err;
    }
  };

  const handleExcluir = async (tenant) => {
    if (!window.confirm(`Deseja realmente remover a loja "${tenant.nomeFantasia || tenant.razaoSocial}" do painel?`)) return;
    await api.deleteTenant(tenant.id);
    setAlerta({ tipo: 'sucesso', texto: 'Loja removida do painel com sucesso.' });
    carregarTenants(true);
  };

  const isOnline = (ultimoSync) => {
    if (!ultimoSync) return false;
    return Date.now() - new Date(ultimoSync).getTime() < 60000;
  };

  const getRamoBadge = (rKey) => {
    const r = rKey || 'mercado';
    if (r === 'restaurante') return { l: 'Restaurante', i: '🍽️', c: 'text-amber-400 bg-amber-950/40 border-amber-800/40' };
    if (r === 'acougue') return { l: 'Açougue', i: '🥩', c: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' };
    if (r === 'autopecas') return { l: 'Autopeças', i: '🚗', c: 'text-purple-400 bg-purple-950/40 border-purple-800/40' };
    if (r === 'assistencia') return { l: 'Assistência', i: '🔧', c: 'text-teal-400 bg-teal-950/40 border-teal-800/40' };
    if (r === 'roupas') return { l: 'Vestuário', i: '👕', c: 'text-rose-400 bg-rose-950/40 border-rose-800/40' };
    return { l: 'Mercado / Varejo', i: '🛒', c: 'text-sky-400 bg-sky-950/40 border-sky-800/40' };
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* Cabeçalho e Busca Compacta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Clientes & Lojas (Tenants)</h1>
          <p className="text-xs text-slate-400">Clique na loja para abrir todas as configurações ou selecione o nicho direto</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar por CNPJ, Razão ou Chave..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && carregarTenants()}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 flex-1 sm:w-64"
          />
          <button onClick={() => carregarTenants()} className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition cursor-pointer shrink-0">
            Buscar
          </button>
        </div>
      </div>

      {alerta && (
        <div className={`p-3 rounded-xl flex items-center justify-between text-xs ${
          alerta.tipo === 'sucesso' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
        }`}>
          <span>{alerta.texto}</span>
          <button onClick={() => setAlerta(null)} className="text-slate-400 hover:text-white ml-4 cursor-pointer">✕</button>
        </div>
      )}

      {/* Filtros rápidos de status */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {['', 'ATIVA', 'INADIMPLENTE', 'BLOQUEADA', 'TESTE'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFiltro(st)}
            className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition cursor-pointer text-xs ${
              statusFiltro === st
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {st === '' ? 'Todos' : st}
          </button>
        ))}
      </div>

      {/* TABELA OTIMIZADA PARA CABER 100% NA TELA SEM CORTES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/50">
                <th className="py-3 px-3 sm:px-4 w-[34%]">Loja & Nicho</th>
                <th className="py-3 px-3 sm:px-4 w-[18%]">Administrador</th>
                <th className="py-3 px-3 sm:px-4 w-[18%]">Chave & Telemetria</th>
                <th className="py-3 px-3 sm:px-4 w-[12%]">Vencimento</th>
                <th className="py-3 px-3 sm:px-4 w-[10%]">Status</th>
                <th className="py-3 px-3 sm:px-4 w-[8%] text-right pr-4">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading && tenants.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400">Carregando lojas...</td></tr>
              ) : tenants.length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-500">Nenhuma loja encontrada</td></tr>
              ) : (
                tenants.map((t) => {
                  const online = isOnline(t.ultimoSyncEm);
                  const cidUf = t.cidade ? `${t.cidade}/${t.estado || 'SP'}` : t.endereco;
                  const badge = getRamoBadge(t.ramo_atuacao);
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setConfigTenant(t)}
                      className="hover:bg-cyan-950/20 cursor-pointer transition group"
                      title="Clique para abrir todas as configurações desta loja"
                    >
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-bold text-white group-hover:text-cyan-400 transition text-sm flex items-center gap-1.5">
                          <span>{t.nomeFantasia || t.razaoSocial}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">CNPJ: {t.cnpj || 'ISENTO'}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={t.ramo_atuacao || 'mercado'}
                            onChange={(e) => handleTrocarRamo(t.id, e.target.value, e)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer outline-none ${badge.c}`}
                            title="Alterar nicho da loja diretamente"
                          >
                            <option value="mercado">🛒 Mercado / Varejo</option>
                            <option value="restaurante">🍽️ Restaurante</option>
                            <option value="acougue">🥩 Açougue</option>
                            <option value="autopecas">🚗 Autopeças</option>
                            <option value="assistencia">🔧 Assistência</option>
                            <option value="roupas">👕 Vestuário</option>
                          </select>
                          <button
                            type="button"
                            onClick={(e) => handleToggleModuloNfe(t, e)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer transition flex items-center gap-1 ${
                              t.moduloNfe
                                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 border-slate-700'
                            }`}
                            title="Clique para habilitar ou desabilitar o Módulo NF-e / DANFE sem alterar o plano e sem cobrança adicional"
                          >
                            <span>📄</span>
                            <span>{t.moduloNfe ? 'NF-e: ATIVO' : 'NF-e: OFF'}</span>
                          </button>
                          {t.telefone && <span className="text-[11px] text-slate-400">📞 {t.telefone}</span>}
                        </div>
                        {cidUf && <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5" title={t.endereco || cidUf}>📍 {cidUf}</div>}
                      </td>

                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-semibold text-slate-200 truncate max-w-[130px]">
                          {t.administradorNome || 'Admin'}
                        </div>
                        {t.administradorLogin && <div className="text-cyan-400 text-[11px] font-mono">@{t.administradorLogin}</div>}
                        <div className="text-[10px] text-slate-500">PDV v{t.versaoDesktop || '1.0.0'}</div>
                      </td>

                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-mono text-[11px] text-cyan-400 truncate max-w-[120px]" title={t.chaveLicenca}>{t.chaveLicenca}</div>
                        <div className="flex items-center gap-1 mt-1 text-[10px]">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${online ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                          <span className={online ? 'text-emerald-400 font-bold' : 'text-slate-500 truncate max-w-[110px]'}>
                            {online ? 'Online' : t.ultimoSyncEm ? `Visto: ${new Date(t.ultimoSyncEm).toLocaleTimeString('pt-BR')}` : 'Aguardando'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 sm:px-4 font-mono text-[11px]">
                        <div className="text-white font-bold">{t.dataExpiracao}</div>
                        {t.diasCarencia > 0 && <div className="text-[10px] text-amber-400">+{t.diasCarencia}d</div>}
                      </td>

                      <td className="py-3 px-3 sm:px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                          t.statusLicenca === 'ATIVA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : t.statusLicenca === 'INADIMPLENTE' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>{t.statusLicenca}</span>
                      </td>

                      <td className="py-3 px-3 sm:px-4 text-right pr-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-700/50 text-cyan-300 group-hover:text-white rounded-lg transition-all text-xs font-semibold whitespace-nowrap shadow-sm">
                          <span>⚙️</span>
                          <span>Config</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Janela Modal com TODAS as configurações do cliente */}
      {configTenant && (
        <TenantConfigModal
          tenant={configTenant}
          onClose={() => setConfigTenant(null)}
          onSave={() => carregarTenants(true)}
          onRenovar30Dias={handleRenovar30Dias}
          onMudarStatus={handleMudarStatus}
          onForcarAtualizar={handleForcarAtualizar}
          onExcluir={handleExcluir}
        />
      )}
    </div>
  );
}
