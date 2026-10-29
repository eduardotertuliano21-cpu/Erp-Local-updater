import React, { useState, useEffect } from 'react';
import { enterpriseApi, type InfoCertificado } from '../../services/enterpriseApi.js';
import { FileKey, UploadCloud, CheckCircle, AlertTriangle, XCircle, KeyRound, Calendar, Building, Hash } from 'lucide-react';
import { ParametrosNfceSection } from './ParametrosNfceSection.js';
import type { StoreSettings } from '../../context/ConfigProvider.js';

interface CertificadosA1TabProps {
  formData?: StoreSettings;
  setFormData?: React.Dispatch<React.SetStateAction<StoreSettings>>;
}

export const CertificadosA1Tab: React.FC<CertificadosA1TabProps> = ({ formData, setFormData }) => {
  const [certificados, setCertificados] = useState<InfoCertificado[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [senha, setSenha] = useState('');
  const [arquivoBase64, setArquivoBase64] = useState<string | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string>('');
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const carregarCertificados = async () => {
    setCarregando(true);
    try {
      const res = await enterpriseApi.listarCertificados();
      if (res.success && res.data) {
        setCertificados(res.data);
      }
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarCertificados();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNomeArquivo(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // Pega a parte base64 após a vírgula
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        setArquivoBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivoBase64 || !nomeArquivo) {
      setFeedback({ tipo: 'erro', texto: 'Selecione um arquivo .pfx ou .p12' });
      return;
    }
    setEnviando(true);
    setFeedback(null);
    try {
      const res = await enterpriseApi.uploadCertificado(nomeArquivo, arquivoBase64, senha);
      if (res.success) {
        setFeedback({ tipo: 'sucesso', texto: 'Certificado A1 importado e validado com sucesso!' });
        setSenha('');
        setArquivoBase64(null);
        setNomeArquivo('');
        carregarCertificados();
      } else {
        setFeedback({ tipo: 'erro', texto: res.error || 'Erro ao processar certificado.' });
      }
    } catch (err: any) {
      setFeedback({ tipo: 'erro', texto: err.message || 'Erro inesperado ao enviar.' });
    } finally {
      setEnviando(false);
    }
  };

  const handleAtivar = async (id: string) => {
    try {
      const res = await enterpriseApi.ativarCertificado(id);
      if (res.success) {
        carregarCertificados();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <FileKey className="w-5 h-5 text-emerald-400" />
          <span>Certificados Digitais (A1 - PFX) & Emissão NFC-e</span>
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Gerencie a numeração fiscal, série e certificados A1 instalados para emissão de NFC-e com segurança local.
        </p>
      </div>

      {/* Seção de Série, Próximo Número e CSC */}
      <ParametrosNfceSection formData={formData} setFormData={setFormData} />

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            feedback.tipo === 'sucesso'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.tipo === 'sucesso' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.texto}</span>
        </div>
      )}

      {/* Formulário de Importação */}
      <form onSubmit={handleUpload} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Novo Certificado A1 (.PFX / .P12)</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Arquivo do Certificado</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-medium text-slate-300 transition">
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span className="truncate">{nomeArquivo || 'Selecionar arquivo .pfx / .p12'}</span>
                <input type="file" accept=".pfx,.p12" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Senha do Certificado</label>
            <div className="relative">
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite a senha do arquivo PFX"
                className="w-full bg-slate-950 border border-slate-700/80 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition pr-10"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={enviando || !arquivoBase64}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950 transition flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{enviando ? 'Validando Certificado...' : 'Importar e Ativar Certificado'}</span>
          </button>
        </div>
      </form>

      {/* Lista de Certificados Instalados */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Certificados Cadastrados</h4>

        {carregando ? (
          <div className="p-6 text-center text-xs text-slate-500 animate-pulse">Carregando certificados...</div>
        ) : certificados.length === 0 ? (
          <div className="p-6 bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl text-center text-xs text-slate-400">
            Nenhum certificado A1 instalado. Importe seu arquivo acima para habilitar emissão de NFC-e.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {certificados.map((cert) => {
              const vencendo = cert.dias_restantes <= 30 && !cert.expirado;
              return (
                <div
                  key={cert.id}
                  className={`p-4 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    cert.ativo
                      ? 'bg-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-white flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{cert.razao_social}</span>
                      </span>
                      {cert.ativo ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ATIVO PARA NFC-E
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                          Inativo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      {cert.cnpj && (
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Hash className="w-3.5 h-3.5 text-slate-500" />
                          <span>CNPJ: {cert.cnpj}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Validade: {new Date(cert.valido_ate).toLocaleDateString('pt-BR')}</span>
                      </span>
                    </div>
                  </div>

                  {/* Badge de Vencimento e Ação */}
                  <div className="flex items-center gap-3 shrink-0">
                    {cert.expirado ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                        <XCircle className="w-4 h-4" />
                        <span>EXPIRADO</span>
                      </span>
                    ) : vencendo ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Vence em {cert.dias_restantes} dia(s)</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                        <CheckCircle className="w-4 h-4" />
                        <span>Válido ({cert.dias_restantes} dias)</span>
                      </span>
                    )}

                    {!cert.ativo && !cert.expirado && (
                      <button
                        type="button"
                        onClick={() => handleAtivar(cert.id)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition border border-slate-700"
                      >
                        Definir como Ativo
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
