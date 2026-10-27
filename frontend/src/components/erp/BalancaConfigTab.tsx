import React, { useState, useEffect } from 'react';
import { Scale, Download, Activity, Cpu, CheckCircle2, RefreshCw, FolderDown, HardDrive } from 'lucide-react';
import { api } from '../../services/api.js';
import { TestarBalancaModal } from './TestarBalancaModal.js';

interface BalancaConfigTabProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export const BalancaConfigTab: React.FC<BalancaConfigTabProps> = ({ formData, setFormData }) => {
  const [modalTesteAberto, setModalTesteAberto] = useState(false);
  const [portasDisponiveis, setPortasDisponiveis] = useState<Array<{ path: string; friendlyName?: string }>>([]);
  const [carregandoPortas, setCarregandoPortas] = useState(false);

  // Estados de Exportação de Carga
  const [marcaCarga, setMarcaCarga] = useState('TOLEDO');
  const [diretorioDestino, setDiretorioDestino] = useState('C:\\MGV6');
  const [diretoriosPadrao, setDiretoriosPadrao] = useState<Record<string, string>>({
    TOLEDO: 'C:\\MGV6',
    FILIZOLA: 'C:\\Filizola',
    ELGIN: 'C:\\Elgin',
    URANO: 'C:\\Urano',
  });
  const [gravandoCarga, setGravandoCarga] = useState(false);
  const [mensagemCarga, setMensagemCarga] = useState('');

  const carregarPortas = async () => {
    setCarregandoPortas(true);
    try {
      const res = await api.listarPortasBalanca();
      const lista = (res.data as any) || (res as any).portas || [];
      if (Array.isArray(lista)) setPortasDisponiveis(lista);
    } catch {}
    finally { setCarregandoPortas(false); }
  };

  useEffect(() => {
    carregarPortas();
    api.obterDiretoriosCarga().then((res) => {
      if (res.success && res.data) {
        setDiretoriosPadrao(res.data);
        if (res.data.TOLEDO) setDiretorioDestino(res.data.TOLEDO);
      }
    }).catch(() => {});
  }, []);

  const handleTrocaMarcaCarga = (novaMarca: string) => {
    setMarcaCarga(novaMarca);
    if (diretoriosPadrao[novaMarca]) setDiretorioDestino(diretoriosPadrao[novaMarca]);
  };

  const handleGravarCargaDisco = async () => {
    setGravandoCarga(true);
    setMensagemCarga('');
    try {
      const res = await api.exportarCargaBalanca(marcaCarga, diretorioDestino);
      if (res.success && res.data) {
        setMensagemCarga(`✓ ${res.data.totalItens} produtos exportados com sucesso para: ${res.data.caminhoCompleto}`);
      } else {
        setMensagemCarga(`❌ ${res.error || 'Erro ao exportar arquivo de carga'}`);
      }
    } catch (e: any) {
      setMensagemCarga(`❌ ${e.message || 'Erro de comunicação'}`);
    } finally {
      setGravandoCarga(false);
    }
  };

  const balancaAtiva = Boolean(formData.balanca_checkout_ativa);
  const modelo = formData.balanca_modelo || 'TOLEDO';
  const porta = formData.balanca_porta || 'AUTO';

  return (
    <div className="space-y-6">
      {/* 1. SEÇÃO PRINCIPAL: AUTOMAÇÃO DE BALANÇA DE CHECKOUT (SERIAL / USB) */}
      <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-sm">
              <Scale className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>Automação de Balança de Checkout (Serial / USB)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Plug & Play
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Captura instantânea de peso direto no PDV com auto-scan de portas seriais e adaptadores USB-Serial
              </p>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer self-start sm:self-center">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {balancaAtiva ? 'Balança Ativa no Caixa' : 'Balança Desativada'}
            </span>
            <input
              type="checkbox"
              checked={balancaAtiva}
              onChange={(e) => setFormData((prev: any) => ({ ...prev, balanca_checkout_ativa: e.target.checked ? 1 : 0 }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600 relative"></div>
          </label>
        </div>

        {balancaAtiva && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-blue-500" />
                  <span>Modelo / Fabricante da Balança</span>
                </label>
                <select
                  value={modelo}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, balanca_modelo: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="TOLEDO">Toledo (Prix 3, Prix 3 Fit, Prix 3 Plus, 9094 - Protocolo P03/P05)</option>
                  <option value="FILIZOLA">Filizola (BP-15, Platina, CS - Protocolo Filizola)</option>
                  <option value="ELGIN">Elgin (DP-15, DP-30, SA-110 - Protocolo Elgin)</option>
                  <option value="URANO">Urano (Pop Light, Pop-S, TopMax - Protocolo Urano)</option>
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Formatos de peso contínuo e sob demanda ENQ (0x05) pré-homologados.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Porta de Comunicação</span>
                  </label>
                  <button
                    type="button"
                    onClick={carregarPortas}
                    disabled={carregandoPortas}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${carregandoPortas ? 'animate-spin' : ''}`} />
                    <span>Atualizar Portas</span>
                  </button>
                </div>
                <select
                  value={porta}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, balanca_porta: e.target.value }))}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                >
                  <option value="AUTO">Modo Automático Plug & Play (Varredura de Portas)</option>
                  {portasDisponiveis.map((p) => (
                    <option key={p.path} value={p.path}>{p.friendlyName ? `${p.path} - ${p.friendlyName}` : p.path}</option>
                  ))}
                  {['COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Recomendado: AUTO para tolerar troca de portas USB do computador.
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Verifique em tempo real a pesagem do prato antes de iniciar as vendas</span>
              </div>
              <button
                type="button"
                onClick={() => setModalTesteAberto(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                <Scale className="w-4 h-4" />
                <span>⚖️ Testar Leitura e Comunicação com a Balança</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. SEÇÃO SECUNDÁRIA: GERADOR DE CARGA PARA BALANÇAS DE ETIQUETA / RETAGUARDA */}
      <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-500" />
            <span>Gerador de Carga para Balanças de Etiqueta (Retaguarda / Açougue / Padaria)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Exporta os produtos com etiqueta pesável diretamente para as pastas de comunicação dos softwares oficiais (Toledo MGV, Filizola, Elgin, Urano).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Fabricante / Software de Carga
            </label>
            <select
              value={marcaCarga}
              onChange={(e) => handleTrocaMarcaCarga(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="TOLEDO">Toledo MGV (MGV5 / MGV6 - ITENSMGV.TXT)</option>
              <option value="FILIZOLA">Filizola Smart / BP (CADTXT.TXT)</option>
              <option value="ELGIN">Elgin Smart / Linha DP (PRODUTOS.TXT)</option>
              <option value="URANO">Urano UR 10.000 / TopMax (PRODUTOS.TXT)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Pasta de Destino no Computador
            </label>
            <input
              type="text"
              value={diretorioDestino}
              onChange={(e) => setDiretorioDestino(e.target.value)}
              placeholder="Ex: C:\MGV6"
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {mensagemCarga && (
          <div className={`p-3 rounded-xl text-xs font-semibold ${mensagemCarga.startsWith('✓') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'}`}>
            {mensagemCarga}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.open(api.exportarCargaMgvUrl(marcaCarga), '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Arquivo TXT</span>
          </button>
          <button
            type="button"
            onClick={handleGravarCargaDisco}
            disabled={gravandoCarga}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
          >
            <FolderDown className="w-4 h-4" />
            <span>{gravandoCarga ? 'Gravando Arquivo...' : 'Gravar Carga na Pasta Local'}</span>
          </button>
        </div>
      </div>

      {/* Modal Interativo de Teste de Balança */}
      <TestarBalancaModal
        isOpen={modalTesteAberto}
        onClose={() => setModalTesteAberto(false)}
        modeloPadrao={modelo}
        portaPadrao={porta}
      />
    </div>
  );
};
