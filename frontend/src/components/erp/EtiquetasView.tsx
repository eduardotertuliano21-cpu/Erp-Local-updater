import React, { useState } from 'react';
import { Tag, Printer, Download, Eye, CheckCircle2, Copy } from 'lucide-react';
import { enterpriseApi } from '../../services/enterpriseApi.js';

export const EtiquetasView: React.FC = () => {
  const [formato, setFormato] = useState<'GONDOLA' | 'PRECO_SIMPLES' | 'JOIA_DUPLA'>('GONDOLA');
  const [linguagem, setLinguagem] = useState<'ZPL' | 'EPL'>('ZPL');
  const [descricao, setDescricao] = useState('REFRIGERANTE COCA-COLA 2L');
  const [codigoBarras, setCodigoBarras] = useState('7894900010015');
  const [preco, setPreco] = useState('9.99');
  const [quantidade, setQuantidade] = useState('1');
  const [comandosGerados, setComandosGerados] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const handleGerar = async () => {
    try {
      const qtd = Math.max(1, parseInt(quantidade, 10) || 1);
      const itens = Array.from({ length: qtd }, () => ({
        descricao,
        codigoBarras,
        preco: parseFloat(preco) || 0,
        unidade: 'UN',
      }));

      const res = await enterpriseApi.gerarEtiquetas({ itens, formato, linguagem });
      setComandosGerados(res.comandos);
      setCopiado(false);
    } catch (err) {
      console.error('Erro ao gerar etiquetas:', err);
    }
  };

  const handleDownloadTxt = () => {
    if (!comandosGerados) return;
    const blob = new Blob([comandosGerados], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `etiquetas_${linguagem.toLowerCase()}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopiar = () => {
    if (!comandosGerados) return;
    navigator.clipboard.writeText(comandosGerados);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 bg-slate-900/60 overflow-y-auto font-sans">
      <div>
        <h1 className="text-xl font-black text-white flex items-center gap-2.5">
          <Tag className="w-6 h-6 text-indigo-400" />
          <span>Motor de Etiquetas Térmicas (Zebra & Argox)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Emissão de comandos nativos EPL2 e ZPL II para impressoras industriais e de gôndola
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Formulário de Configuração */}
        <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Printer className="w-4 h-4 text-indigo-400" />
            <span>Configuração do Modelo de Impressão</span>
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Modelo de Etiqueta</label>
              <select
                value={formato}
                onChange={(e) => setFormato(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="GONDOLA">Gôndola c/ Código de Barras</option>
                <option value="PRECO_SIMPLES">Preço Simples em Destaque</option>
                <option value="JOIA_DUPLA">Dupla (Jóias / Acessórios)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Linguagem / Fabricante</label>
              <select
                value={linguagem}
                onChange={(e) => setLinguagem(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="ZPL">Zebra (ZPL II)</option>
                <option value="EPL">Argox / Eltron (EPL2)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Descrição do Produto</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Código de Barras (EAN)</label>
                <input
                  type="text"
                  value={codigoBarras}
                  onChange={(e) => setCodigoBarras(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Preço de Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Cópias a Emitir</label>
              <input
                type="number"
                min="1"
                max="500"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white text-center focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleGerar}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            <span>Gerar Comandos de Impressão</span>
          </button>
        </div>

        {/* Saída RAW dos Comandos */}
        <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span>Script RAW ({linguagem})</span>
              </h2>
              {comandosGerados && (
                <div className="flex gap-2">
                  <button
                    onClick={handleCopiar}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                    title="Copiar código"
                  >
                    {copiado ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                  <button
                    onClick={handleDownloadTxt}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
                    title="Baixar arquivo TXT para Spooler"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download TXT</span>
                  </button>
                </div>
              )}
            </div>

            <pre className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-[11px] text-indigo-300 font-mono overflow-auto h-72">
              {comandosGerados || '// Selecione o formato e clique em "Gerar Comandos" para visualizar o script de impressão.'}
            </pre>
          </div>

          <div className="text-[11px] text-slate-500">
            Dica: Envie o arquivo gerado diretamente para a porta USB/Spooler (ex: `COPY /B arquivo.txt LPT1:` ou via RAW Printer).
          </div>
        </div>
      </div>
    </div>
  );
};
