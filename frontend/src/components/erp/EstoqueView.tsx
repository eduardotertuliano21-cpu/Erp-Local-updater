import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { AjusteEstoqueModal } from './AjusteEstoqueModal.js';

export const EstoqueView: React.FC = () => {
  const [subTab, setSubTab] = useState<'POSICAO' | 'MOVIMENTOS' | 'XML'>('POSICAO');
  const [posicao, setPosicao] = useState<any[]>([]);
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalAjuste, setModalAjuste] = useState(false);

  // XML Import states
  const [xmlInput, setXmlInput] = useState('');
  const [importandoXml, setImportandoXml] = useState(false);
  const [resultadoXml, setResultadoXml] = useState<any>(null);
  const [erroXml, setErroXml] = useState<string | null>(null);

  const carregarDados = async () => {
    setLoading(true);
    if (subTab === 'POSICAO') {
      const res = await api.obterPosicaoEstoque();
      if (res.success && res.data) setPosicao(res.data);
    } else if (subTab === 'MOVIMENTOS') {
      const res = await api.listarMovimentosEstoque();
      if (res.success && res.data) setMovimentos(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
  }, [subTab]);

  const handleImportarXml = async () => {
    if (!xmlInput.trim()) {
      setErroXml('Cole o conteúdo XML da NF-e para prosseguir.');
      return;
    }
    setImportandoXml(true);
    setErroXml(null);
    setResultadoXml(null);

    const res = await api.importarXmlNfe(xmlInput.trim());
    if (res.success && res.data) {
      setResultadoXml(res.data);
      setXmlInput('');
    } else {
      setErroXml(res.error || 'Falha ao importar XML de NF-e');
    }
    setImportandoXml(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setXmlInput(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6">
      {/* Header and Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-wide">ESTOQUE & SUPRIMENTOS</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle Multi-Almoxarifado, Inventário e Importador Automático de NF-e
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setSubTab('POSICAO')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                subTab === 'POSICAO' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Posição de Estoque
            </button>
            <button
              onClick={() => setSubTab('MOVIMENTOS')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                subTab === 'MOVIMENTOS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Extrato de Movimentos
            </button>
            <button
              onClick={() => setSubTab('XML')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                subTab === 'XML' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📥 Importar XML NF-e
            </button>
          </div>

          {subTab === 'POSICAO' && (
            <button
              onClick={() => setModalAjuste(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition"
            >
              + Ajuste Manual
            </button>
          )}
        </div>
      </div>

      {/* Posição de Estoque Table */}
      {subTab === 'POSICAO' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Descrição do Produto</th>
                  <th className="px-4 py-3">UN</th>
                  <th className="px-4 py-3">Estoque Loja</th>
                  <th className="px-4 py-3">Depósito</th>
                  <th className="px-4 py-3">Avarias/Defeito</th>
                  <th className="px-4 py-3 font-bold text-slate-800 dark:text-white">Saldo Consolidado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400 font-sans">Carregando saldo...</td></tr>
                ) : posicao.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-slate-400 font-sans">Nenhum produto em estoque.</td></tr>
                ) : (
                  posicao.map((p) => (
                    <tr key={p.produto_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{p.codigo_barras}</td>
                      <td className="px-4 py-3 font-sans font-medium text-slate-800 dark:text-slate-100">{p.descricao}</td>
                      <td className="px-4 py-3">{p.unidade_medida}</td>
                      <td className="px-4 py-3 text-cyan-600 dark:text-cyan-400">{Number(p.saldo_loja).toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{Number(p.saldo_deposito).toFixed(2)}</td>
                      <td className="px-4 py-3 text-rose-600 dark:text-rose-400">{Number(p.saldo_defeito).toFixed(2)}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {Number(p.saldo_total).toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Extrato de Movimentos Table */}
      {subTab === 'MOVIMENTOS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Data/Hora</th>
                  <th className="px-4 py-3">Tipo Movimento</th>
                  <th className="px-4 py-3">Almoxarifado</th>
                  <th className="px-4 py-3">Quantidade</th>
                  <th className="px-4 py-3">Documento Ref</th>
                  <th className="px-4 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400 font-sans">Carregando...</td></tr>
                ) : movimentos.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400 font-sans">Nenhum movimento registrado.</td></tr>
                ) : (
                  movimentos.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{new Date(m.criado_em).toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 font-bold text-amber-600 dark:text-amber-400">{m.tipo}</td>
                      <td className="px-4 py-3">{m.almoxarifado}</td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{Number(m.quantidade).toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{m.documento_referencia || '-'}</td>
                      <td className="px-4 py-3 font-sans text-slate-600 dark:text-slate-300">{m.motivo || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* XML Import View */}
      {subTab === 'XML' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm max-w-3xl mx-auto space-y-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-white">IMPORTADOR AUTOMÁTICO DE NF-e DE COMPRA</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cadastra novos produtos, atualiza fornecedor, dá entrada no estoque e gera o Contas a Pagar automaticamente.
          </p>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 rounded-xl p-6 text-center space-y-2">
            <input type="file" accept=".xml" onChange={handleFileUpload} className="hidden" id="xml-upload" />
            <label htmlFor="xml-upload" className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold inline-block shadow-xs transition">
              📁 Selecionar Arquivo XML do Computador
            </label>
            <div className="text-xs text-slate-400">ou cole o texto XML abaixo:</div>
          </div>

          <textarea
            value={xmlInput}
            onChange={(e) => setXmlInput(e.target.value)}
            placeholder="<nfeProc xmlns=...><NFe>...</NFe></nfeProc>"
            rows={6}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs font-mono text-emerald-700 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {erroXml && <div className="p-3 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200 text-xs rounded">{erroXml}</div>}

          {resultadoXml && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs space-y-2">
              <div className="font-bold text-emerald-700 dark:text-emerald-300">✓ NF-e Importada com Sucesso!</div>
              <div className="text-slate-700 dark:text-slate-300">Fornecedor: <span className="font-bold text-slate-900 dark:text-white">{resultadoXml.fornecedorNome}</span></div>
              <div className="text-slate-700 dark:text-slate-300">NF-e #{resultadoXml.numeroNfe} - Valor Total: <span className="font-bold text-emerald-600 dark:text-emerald-400">R$ {resultadoXml.valorTotal.toFixed(2)}</span></div>
              <div className="text-slate-700 dark:text-slate-300">Produtos cadastrados/atualizados: <span className="font-bold text-slate-900 dark:text-white">{resultadoXml.produtosImportados} itens</span></div>
              <div className="text-slate-700 dark:text-slate-300">Duplicata gerada no Contas a Pagar: <span className="font-bold text-cyan-600 dark:text-cyan-400">{resultadoXml.titulosFinanceirosCriados} título</span></div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleImportarXml}
              disabled={importandoXml}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-xs transition"
            >
              {importandoXml ? 'Processando XML...' : 'Processar e Dar Entrada'}
            </button>
          </div>
        </div>
      )}

      {/* Modal Ajuste Manual */}
      <AjusteEstoqueModal
        isOpen={modalAjuste}
        posicao={posicao}
        onClose={() => setModalAjuste(false)}
        onSalvo={carregarDados}
      />
    </div>
  );
};
