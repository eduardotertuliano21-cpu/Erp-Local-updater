import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { CobrancaExtraModal } from './CobrancaExtraModal.jsx';

export function PlanosView() {
  const [planos, setPlanos] = useState([]);
  const [editingPlano, setEditingPlano] = useState(null);
  const [novoRecurso, setNovoRecurso] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCobrancaModal, setShowCobrancaModal] = useState(false);
  const [diasTrial, setDiasTrial] = useState(7);
  const [salvandoTrial, setSalvandoTrial] = useState(false);
  const [sucessoTrial, setSucessoTrial] = useState(false);

  const carregarPlanos = () => {
    setLoading(true);
    api.getPlanos().then((d) => setPlanos(d || [])).catch(console.error).finally(() => setLoading(false));
    api.getConfig().then((res) => {
      if (res?.data?.diasTrialNovosClientes !== undefined) {
        setDiasTrial(Number(res.data.diasTrialNovosClientes));
      }
    }).catch(console.error);
  };

  useEffect(() => { carregarPlanos(); }, []);

  const handleSalvarTrial = async () => {
    setSalvandoTrial(true);
    try {
      await api.updateConfig({ diasTrialNovosClientes: diasTrial });
      setSucessoTrial(true);
      setTimeout(() => setSucessoTrial(false), 2500);
    } catch {
      alert('Erro ao salvar período grátis.');
    } finally {
      setSalvandoTrial(false);
    }
  };

  const handleSalvarPlano = async (e) => {
    e.preventDefault();
    if (!editingPlano) return;
    setSaving(true);
    try {
      await api.savePlano(editingPlano);
      setEditingPlano(null);
      carregarPlanos();
    } catch (err) {
      alert('Erro ao sincronizar plano com Stripe');
    } finally { setSaving(false); }
  };

  const handleExcluirPlano = async (id, nome) => {
    if (!window.confirm(`Excluir o plano "${nome}"?`)) return;
    try { await api.deletePlano(id); carregarPlanos(); } catch { alert('Erro ao excluir plano.'); }
  };

  const adicionarRecurso = () => {
    if (!novoRecurso.trim() || !editingPlano) return;
    setEditingPlano({ ...editingPlano, recursos: [...(editingPlano.recursos || []), novoRecurso.trim()] });
    setNovoRecurso('');
  };

  const removerRecurso = (index) => {
    if (!editingPlano) return;
    setEditingPlano({ ...editingPlano, recursos: editingPlano.recursos.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Planos & Preços (Stripe Sync)</h1>
          <p className="text-sm text-slate-400">Edite valores, limite de máquinas (inclusas e extras) e sincronize com o Stripe</p>
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl">
            <span className="text-xs text-slate-300 font-medium">🎁 Teste Grátis:</span>
            <input
              type="number"
              min="0"
              max="90"
              value={diasTrial}
              onChange={(e) => setDiasTrial(parseInt(e.target.value) || 0)}
              className="w-12 p-1 bg-slate-950 border border-slate-700 rounded text-center text-xs font-bold text-cyan-400"
            />
            <span className="text-xs text-slate-400">dias</span>
            <button
              type="button"
              onClick={handleSalvarTrial}
              disabled={salvandoTrial}
              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-[11px] font-bold text-white rounded-lg transition"
            >
              {salvandoTrial ? '...' : sucessoTrial ? '✓ Salvo' : 'Salvar'}
            </button>
          </div>
          <button
            type="button" onClick={() => setShowCobrancaModal(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-xs sm:text-sm font-bold text-white rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition"
          >
            <span>⚡</span> Cobrança Extra
          </button>
          <button
            type="button"
            onClick={() => setEditingPlano({
              nome: '', slug: '', valorMensal: 99.00, periodicidade: 'MENSAL', descricao: '',
              recursos: ['PDV Frente de Caixa e Retaguarda', 'Módulo Fiscal NF-e / NFC-e', 'Cobre até 3 Máquinas'],
              limiteCaixas: 3, valorMaquinaExtra: 25.00, ativo: true, moduloNfe: true,
            })}
            className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 font-bold text-xs sm:text-sm text-white rounded-xl shadow-lg transition"
          >
            + Novo Plano
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center text-slate-500 py-10">Carregando planos da nuvem...</div>
        ) : (
          planos.map((p) => (
            <div key={p.id} className={`p-6 rounded-2xl bg-slate-900/60 border ${p.ativo ? 'border-slate-800' : 'border-rose-900/40 opacity-70'} flex flex-col justify-between backdrop-blur relative overflow-hidden`}>
              {!p.ativo && <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">INATIVO</span>}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{p.slug}</span>
                  <div className="flex items-center gap-1.5">
                    {p.moduloNfe && (
                      <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <span>📄</span> NF-e
                      </span>
                    )}
                    <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded">
                      {p.periodicidade === 'ANUAL' ? 'ANUAL' : 'MENSAL'}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{p.nome}</h3>
                <div className="text-xs font-mono text-slate-300 mb-2">
                  Cobre até <strong className="text-cyan-400">{p.limiteCaixas || 3} máquinas</strong>
                  <span className="text-slate-400 block text-[11px]">+ R$ {Number(p.valorMaquinaExtra || 25).toFixed(2)}/mês por máquina extra</span>
                </div>
                <p className="text-xs text-slate-400 mb-4 min-h-[32px]">{p.descricao}</p>
                <div className="text-3xl font-black text-white mb-4">
                  R$ {Number(p.valorMensal || 0).toFixed(2)} <span className="text-xs text-slate-400 font-normal">/{p.periodicidade === 'ANUAL' ? 'ano' : 'mês'}</span>
                </div>
                <div className="space-y-1.5 border-t border-slate-800/80 pt-3 mb-6">
                  {(p.recursos || []).map((rec, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300"><span className="text-cyan-400">✓</span><span>{rec}</span></div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-800/60">
                <div className="text-[10px] text-slate-500 font-mono truncate">Stripe: {p.stripePriceId || 'Não vinculado'}</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingPlano({ ...p })} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-white rounded-xl transition">
                    Editar & Sincronizar
                  </button>
                  <button type="button" onClick={() => handleExcluirPlano(p.id, p.nome)} className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition text-xs" title="Excluir">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {editingPlano && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">{editingPlano.id ? 'Editar Plano & Sincronizar Stripe' : 'Criar Novo Plano SaaS'}</h3>
            <form onSubmit={handleSalvarPlano} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nome do Plano</label>
                <input type="text" required value={editingPlano.nome} onChange={(e) => setEditingPlano({ ...editingPlano, nome: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:border-cyan-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Periodicidade</label>
                  <select value={editingPlano.periodicidade || 'MENSAL'} onChange={(e) => setEditingPlano({ ...editingPlano, periodicidade: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white">
                    <option value="MENSAL">Mensal (Mês a Mês)</option>
                    <option value="ANUAL">Anual (Cobrança Anual)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Valor do Plano (R$)</label>
                  <input type="number" step="0.01" required value={editingPlano.valorMensal} onChange={(e) => setEditingPlano({ ...editingPlano, valorMensal: parseFloat(e.target.value) })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Máquinas Inclusas (Limite)</label>
                  <input type="number" min="1" value={editingPlano.limiteCaixas || 3} onChange={(e) => setEditingPlano({ ...editingPlano, limiteCaixas: parseInt(e.target.value) })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Valor Máquina Extra (R$/mês)</label>
                  <input type="number" step="0.01" min="0" value={editingPlano.valorMaquinaExtra ?? 25.00} onChange={(e) => setEditingPlano({ ...editingPlano, valorMaquinaExtra: parseFloat(e.target.value) })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-emerald-400 font-bold" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Descrição</label>
                <textarea value={editingPlano.descricao || ''} onChange={(e) => setEditingPlano({ ...editingPlano, descricao: e.target.value })} className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white" rows={2} />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Recursos Inclusos</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" placeholder="Adicionar recurso (ex: Balança Toledo)" value={novoRecurso} onChange={(e) => setNovoRecurso(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarRecurso(); } }} className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white" />
                  <button type="button" onClick={adicionarRecurso} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl">+ Adicionar</button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(editingPlano.recursos || []).map((rec, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700">{rec}<button type="button" onClick={() => removerRecurso(i)} className="text-slate-500 hover:text-rose-400">×</button></span>
                  ))}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="moduloNfe"
                      checked={Boolean(editingPlano.moduloNfe)}
                      onChange={(e) => setEditingPlano({ ...editingPlano, moduloNfe: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 text-cyan-500"
                    />
                    <label htmlFor="moduloNfe" className="text-xs font-bold text-white cursor-pointer flex items-center gap-1.5">
                      <span>📄</span> Módulo Fiscal NF-e / DANFE Incluso
                    </label>
                  </div>
                  {editingPlano.moduloNfe && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ATIVO NO PLANO
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  Ao ativar, lojas assinantes deste plano terão emissão de NFC-e e DANFE liberadas.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input type="checkbox" id="planoAtivo" checked={editingPlano.ativo !== false} onChange={(e) => setEditingPlano({ ...editingPlano, ativo: e.target.checked })} className="rounded border-slate-800 text-cyan-500" />
                <label htmlFor="planoAtivo" className="text-xs text-slate-300 cursor-pointer">Plano Ativo (Disponível no ERP e Checkout)</label>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setEditingPlano(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancelar</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-sm font-bold text-white rounded-xl shadow-lg disabled:opacity-50">{saving ? 'Sincronizando...' : 'Salvar no Stripe'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showCobrancaModal && <CobrancaExtraModal onClose={() => setShowCobrancaModal(false)} onSuccess={() => {}} />}
    </div>
  );
}
