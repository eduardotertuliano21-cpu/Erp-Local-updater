import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export function TenantSubscriptionCard({ formData, setFormData }) {
  const [planos, setPlanos] = useState([]);

  useEffect(() => {
    api.getPlanos().then(res => setPlanos(res || [])).catch(() => {});
  }, []);

  const planoSelecionado = planos.find(p => p.id === formData.planoId) || planos[0] || {
    id: 'plano-mensal',
    nome: 'Plano Mensal',
    preco: 99,
    limiteCaixas: 3,
    valorMaquinaExtra: 25,
  };

  const limiteBase = planoSelecionado.limiteCaixas ?? 3;
  const valorUnitExtra = planoSelecionado.valorMaquinaExtra ?? 25;
  const maquinas = Math.max(1, Number(formData.maquinasContratadas || limiteBase));
  const extras = Math.max(0, maquinas - limiteBase);
  const extraRecorrente = extras * valorUnitExtra;

  const cobrancaExtra = formData.proximaCobrancaExtra || { valor: 0, motivo: '', ativa: false };
  const valorAvulso = cobrancaExtra.ativa ? Number(cobrancaExtra.valor || 0) : 0;
  const totalPrevisto = (Number(planoSelecionado.preco || 0)) + extraRecorrente + valorAvulso;

  const handleMaquinasChange = (val) => {
    const qtd = Math.max(1, parseInt(val, 10) || 1);
    const extr = Math.max(0, qtd - limiteBase);
    setFormData(prev => ({
      ...prev,
      maquinasContratadas: qtd,
      maquinasExtras: extr,
      valorExtraRecorrente: extr * valorUnitExtra,
    }));
  };

  const handlePlanoChange = (novoPlanoId) => {
    const p = planos.find(item => item.id === novoPlanoId);
    const pLim = p?.limiteCaixas ?? 3;
    const pValExtra = p?.valorMaquinaExtra ?? 25;
    const extr = Math.max(0, maquinas - pLim);
    setFormData(prev => ({
      ...prev,
      planoId: novoPlanoId,
      maquinasExtras: extr,
      valorExtraRecorrente: extr * pValExtra,
      moduloNfe: p?.moduloNfe !== undefined ? Boolean(p.moduloNfe) : prev.moduloNfe,
    }));
  };

  const handleToggleExtra = (ativa) => {
    setFormData(prev => ({
      ...prev,
      proximaCobrancaExtra: {
        ...(prev.proximaCobrancaExtra || {}),
        ativa,
      },
    }));
  };

  const handleExtraChange = (campo, val) => {
    setFormData(prev => ({
      ...prev,
      proximaCobrancaExtra: {
        ...(prev.proximaCobrancaExtra || {}),
        [campo]: val,
      },
    }));
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span>💳</span>
          <span>Plano, Máquinas Contratadas & Cobranças Extras</span>
        </h2>
        <span className="text-xs text-slate-400 font-mono">
          Cobrança automatizada via Stripe / Licenciamento
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-cyan-400 font-bold block mb-1">Plano Vinculado</label>
          <select
            value={formData.planoId || planoSelecionado.id}
            onChange={(e) => handlePlanoChange(e.target.value)}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-medium outline-none focus:border-cyan-500"
          >
            {planos.map(p => (
              <option key={p.id} value={p.id}>
                {p.nome} - R$ {p.preco?.toFixed(2)} ({p.periodicidade || 'MENSAL'})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 mt-1">
            Cobre até {limiteBase} máquinas. Extra: R$ {valorUnitExtra.toFixed(2)}/mês cada.
          </p>
        </div>

        <div>
          <label className="text-xs text-emerald-400 font-bold block mb-1">Máquinas Contratadas</label>
          <input
            type="number"
            min="1"
            value={maquinas}
            onChange={(e) => handleMaquinasChange(e.target.value)}
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono outline-none focus:border-emerald-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            {extras > 0 ? (
              <span className="text-amber-400 font-bold">
                +{extras} máquina(s) extra(s) = +R$ {extraRecorrente.toFixed(2)}/mês
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">Incluso nas {limiteBase} máquinas do plano</span>
            )}
          </p>
        </div>

        <div>
          <label className="text-xs text-purple-400 font-bold block mb-1">Previsão da Mensalidade</label>
          <div className="p-2.5 bg-slate-950 border border-purple-900/50 rounded-xl text-white font-mono">
            <div className="text-lg font-black text-purple-300">
              R$ {totalPrevisto.toFixed(2)}
            </div>
            <div className="text-[10px] text-slate-400">
              Base: R$ {Number(planoSelecionado.preco || 0).toFixed(2)} + Ext: R$ {extraRecorrente.toFixed(2)} + Avulso: R$ {valorAvulso.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
            <span>📄</span>
            <span>Módulo Fiscal NF-e & DANFE A4 (Independente de Plano e Sem Custo Adicional)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Habilite ou desabilite o módulo NF-e / DANFE para este cliente a qualquer momento sem alterar o plano vinculado e sem gerar cobrança extra.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormData(prev => ({ ...prev, moduloNfe: !Boolean(prev.moduloNfe) }))}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer shrink-0 ${
            formData.moduloNfe
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}
        >
          {formData.moduloNfe ? '✓ NF-e HABILITADO (R$ 0,00)' : '✕ NF-e DESABILITADO'}
        </button>
      </div>

      <div className="mt-4 p-4 bg-slate-950 border border-slate-800/80 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300">
            <input
              type="checkbox"
              checked={!!cobrancaExtra.ativa}
              onChange={(e) => handleToggleExtra(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
            />
            <span>Adicionar Cobrança Extra Avulsa na Próxima Fatura (Serviço ou Implantação)</span>
          </label>
          {cobrancaExtra.ativa && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Cobrança Ativa
            </span>
          )}
        </div>

        {cobrancaExtra.ativa && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Valor Avulso Extra (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cobrancaExtra.valor || ''}
                onChange={(e) => handleExtraChange('valor', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 50.00"
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Motivo do Serviço Contratado</label>
              <input
                type="text"
                value={cobrancaExtra.motivo || ''}
                onChange={(e) => handleExtraChange('motivo', e.target.value)}
                placeholder="Ex: Visita técnica / Treinamento / Terminal extra avulso"
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
