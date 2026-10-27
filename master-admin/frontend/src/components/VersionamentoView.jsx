import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export function VersionamentoView() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [novaVersao, setNovaVersao] = useState('');
  const [notas, setNotas] = useState('');
  const [obrigatoria, setObrigatoria] = useState(false);
  const [sucesso, setSucesso] = useState('');

  const carregarConfig = () => {
    setLoading(true);
    api.getRelease()
      .then((data) => {
        setConfig(data);
        if (data) {
          setNovaVersao(data.versao);
          setNotas(data.notasVersao);
          setObrigatoria(data.obrigatoria);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarConfig();
  }, []);

  const handleSalvar = async (e) => {
    e.preventDefault();
    setSalvando(true);
    setSucesso('');
    try {
      const res = await api.definirRelease({
        versao: novaVersao,
        notasVersao: notas,
        obrigatoria,
      });
      if (res.sucesso) {
        setSucesso(res.mensagem);
        setConfig(res.config);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Versionamento & Atualizações Automáticas</h1>
        <p className="text-sm text-slate-400">
          Controle a versão oficial distribuída pelo site para todos os PDVs e computadores em operação
        </p>
      </div>

      {sucesso && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
          ✓ {sucesso}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur md:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-white">Lançar ou Redefinir Versão Oficial</h3>
          <form onSubmit={handleSalvar} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Número da Versão
                </label>
                <input
                  type="text"
                  required
                  value={novaVersao}
                  onChange={(e) => setNovaVersao(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono"
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={obrigatoria}
                    onChange={(e) => setObrigatoria(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-800"
                  />
                  <span>Atualização Crítica Obrigatória</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Notas da Versão (Changelog)
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white"
                placeholder="Descreva as novidades desta versão..."
              />
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 font-bold text-sm text-white rounded-xl shadow-lg shadow-cyan-500/20"
            >
              {salvando ? 'Salvando...' : 'Definir Versão para os PDVs'}
            </button>
          </form>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Status Atual na Nuvem</h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Versão Ativa:</span>
              <strong className="text-white text-sm">{config?.versao || '1.0.0'}</strong>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Lançada em:</span>
              <span className="text-slate-300">{config?.dataLancamento}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Obrigatória:</span>
              <span className={config?.obrigatoria ? 'text-amber-400' : 'text-slate-400'}>
                {config?.obrigatoria ? 'SIM' : 'NÃO'}
              </span>
            </div>
            <div className="pt-2 text-[11px] text-slate-400 font-sans leading-relaxed">
              💡 Os clientes que abrirem o ClickStorm verificarão esta versão automaticamente. Caso a versão instalada seja diferente, o sistema iniciará o processo de atualização conforme definido aqui.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
