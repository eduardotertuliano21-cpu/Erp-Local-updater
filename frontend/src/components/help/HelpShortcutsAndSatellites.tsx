import React, { useState } from 'react';
import { ChefHat, QrCode, ScanBarcode, BookMarked, Search, Keyboard } from 'lucide-react';
import { MAPA_ATALHOS_COMPLETO, normalizarTexto } from './helpSearchEngine.js';
import { GLOSSARIO_LEIGO } from './helpTypes.js';

export const HelpShortcutsGrid: React.FC = () => {
  const [filtro, setFiltro] = useState('');
  const grupos = Array.from(new Set(MAPA_ATALHOS_COMPLETO.map((i) => i.grupo)));

  const q = normalizarTexto(filtro);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
            <Keyboard className="w-4 h-4 text-sky-400" />
            <span>Mapa de Teclas de Atalho Rápido</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Você pode operar o caixa inteiro apenas pelo teclado, sem precisar tocar no mouse.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar tecla ou função..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {grupos.map((grupo) => {
        const itens = MAPA_ATALHOS_COMPLETO.filter(
          (item) =>
            item.grupo === grupo &&
            (!q ||
              normalizarTexto(item.tecla).includes(q) ||
              normalizarTexto(item.funcao).includes(q))
        );
        if (itens.length === 0) return null;

        return (
          <div key={grupo} className="space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-sky-500 dark:text-sky-400 px-1">
              {grupo}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {itens.map((item) => (
                <div
                  key={item.tecla}
                  className="p-3.5 rounded-xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
                    {item.funcao}
                  </div>
                  <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-sky-500/40 text-slate-800 dark:text-sky-300 font-mono text-xs font-black shrink-0">
                    {item.tecla}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const HelpSatellitesGrid: React.FC = () => (
  <div className="space-y-4">
    <div className="rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
      <h3 className="text-sm font-black text-slate-900 dark:text-white">
        Use celulares e tablets na mesma rede Wi-Fi (Sem instalar nada e sem internet)
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        Basta conectar o celular no mesmo Wi-Fi do computador principal e ler o QR Code correspondente ou digitar o endereço no navegador do celular.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center">
              <ScanBarcode className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-500/15 text-slate-400 border border-slate-500/30">
              🏪 Todos os Ramos
            </span>
          </div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            1. Coletor de Estoque com Câmera do Celular
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Transforma o celular do estoquista em um leitor de código de barras sem fio para contar mercadorias nas prateleiras e ajustar o estoque na hora.
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-sky-500 dark:text-sky-400 break-all">
          http://IP_DO_CAIXA:5000/?coletor=1
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              🍔 Exclusivo: Restaurante
            </span>
          </div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            2. Comanda Mobile no Celular do Garçom
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Escaneie o QR Code no botão <strong className="text-amber-400">F6 (Mesas)</strong> do PDV. O garçom entra com seu PIN de 4 dígitos, abre mesas e lança pedidos com observações direto da mesa do cliente.
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-amber-500 dark:text-amber-400 break-all">
          http://IP_DO_CAIXA:5000/?mobile=1
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              🍔 Exclusivo: Restaurante
            </span>
          </div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            3. Monitor de Cozinha (KDS) na TV ou Tablet
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Exibe os pedidos dos garçons em tempo real na cozinha com alerta sonoro, cronômetro de tempo de espera e botões para marcar "Preparando" e "Pronto".
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-emerald-500 dark:text-emerald-400 break-all">
          http://IP_DO_CAIXA:5000/?kds=1
        </div>
      </div>
    </div>
  </div>
);

export const HelpGlossaryGrid: React.FC = () => {
  const [buscaTermo, setBuscaTermo] = useState('');
  const q = normalizarTexto(buscaTermo);

  const filtrados = GLOSSARIO_LEIGO.filter(
    (g) =>
      !q ||
      normalizarTexto(g.termo).includes(q) ||
      normalizarTexto(g.significadoSimples).includes(q) ||
      normalizarTexto(g.exemploPratico).includes(q)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
            <BookMarked className="w-4 h-4 text-emerald-400" />
            <span>Dicionário Simplificado (Sem Termos Difíceis)</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Explicação direta e sem "economês" para as siglas que contadores e sistemas usam.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={buscaTermo}
            onChange={(e) => setBuscaTermo(e.target.value)}
            placeholder="Buscar sigla (ex: Sangria, NCM, DRE)..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-white outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtrados.map((item) => (
          <div
            key={item.termo}
            className="p-4 rounded-2xl bg-white dark:bg-[#0b1120] border border-slate-200 dark:border-slate-800 space-y-2"
          >
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {item.termo}
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {item.significadoSimples}
            </p>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              💡 <strong>Na prática:</strong> {item.exemploPratico}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
