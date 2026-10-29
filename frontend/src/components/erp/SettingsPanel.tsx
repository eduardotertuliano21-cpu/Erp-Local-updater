import React, { useState, useEffect } from 'react';
import {
  Building2,
  Sliders,
  Users,
  Printer,
  Palette,
  Scale,
  HardDrive,
  Check,
  Save,
} from 'lucide-react';
import { useStoreConfig } from '../../context/ConfigProvider.js';
import { DadosEmpresaTab } from './DadosEmpresaTab.js';
import { RegrasNegocioTab } from './RegrasNegocioTab.js';
import { UsuariosAcessosTab } from './UsuariosAcessosTab.js';
import { ImpressaoTab } from './ImpressaoTab.js';
import { BrandingCustomizerTab } from './BrandingCustomizerTab.js';
import { FailoverBackupTab } from './FailoverBackupTab.js';
import { CertificadosA1Tab } from './CertificadosA1Tab.js';
import { MatrizRbacTab } from './MatrizRbacTab.js';
import { BalancaConfigTab } from './BalancaConfigTab.js';
import { FileKey, Shield } from 'lucide-react';
import { ResponsiveTabBar } from '../common/ResponsiveTabBar.js';

type TabId = 'EMPRESA' | 'CERTIFICADO' | 'MATRIZ_RBAC' | 'REGRAS' | 'USUARIOS' | 'IMPRESSAO' | 'IDENTIDADE' | 'BALANCA' | 'FAILOVER';

export const SettingsPanel: React.FC = () => {
  const { config, atualizarConfig } = useStoreConfig();
  const [formData, setFormData] = useState(config);
  const [activeTab, setActiveTab] = useState<TabId>('EMPRESA');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleSalvar = async () => {
    setSalvando(true);
    const ok = await atualizarConfig(formData);
    setSalvando(false);
    if (ok) {
      setSucesso(true);
      setTimeout(() => setSucesso(false), 2000);
    }
  };

  const tabs: Array<{ id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'EMPRESA', label: 'Dados da Empresa', icon: Building2 },
    ...(config?.modulo_nfe ? [{ id: 'CERTIFICADO' as TabId, label: 'Certificado A1 (NFC-e)', icon: FileKey }] : []),
    { id: 'MATRIZ_RBAC', label: 'Permissões RBAC', icon: Shield },
    { id: 'REGRAS', label: 'Regras de Negócio', icon: Sliders },
    { id: 'USUARIOS', label: 'Usuários & Acessos', icon: Users },
    { id: 'IMPRESSAO', label: 'Impressão', icon: Printer },
    { id: 'IDENTIDADE', label: 'Identidade Visual', icon: Palette },
    { id: 'BALANCA', label: 'Balança Checkout & MGV', icon: Scale },
    { id: 'FAILOVER', label: 'Contingência', icon: HardDrive },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-12 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex flex-wrap items-center gap-2">
            <span>Configurações Gerenciais do Estabelecimento</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Master SSOT
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie dados fiscais, regras operacionais, perfis de usuários e impressoras do sistema
          </p>
        </div>
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 cursor-pointer shrink-0"
        >
          {sucesso ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          {salvando ? 'Salvando...' : sucesso ? 'Configuração Salva!' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Navigation Tabs Bar com suporte a overflow e menu "Mais" */}
      <ResponsiveTabBar
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        variant="blue"
      />

      {/* Tab Panels */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        {activeTab === 'EMPRESA' && (
          <DadosEmpresaTab formData={formData} setFormData={setFormData} />
        )}

        {activeTab === 'CERTIFICADO' && (
          <CertificadosA1Tab formData={formData} setFormData={setFormData} />
        )}

        {activeTab === 'MATRIZ_RBAC' && (
          <MatrizRbacTab />
        )}

        {activeTab === 'REGRAS' && (
          <RegrasNegocioTab formData={formData} setFormData={setFormData} />
        )}

        {activeTab === 'USUARIOS' && (
          <UsuariosAcessosTab />
        )}

        {activeTab === 'IMPRESSAO' && (
          <ImpressaoTab formData={formData} setFormData={setFormData} />
        )}

        {activeTab === 'IDENTIDADE' && (
          <BrandingCustomizerTab
            nomeLoja={formData.nome_loja}
            logoUrl={formData.logo_url}
            corPrimaria={formData.cor_primaria}
            onChangeNome={(nome) => setFormData((prev) => ({ ...prev, nome_loja: nome }))}
            onChangeLogo={(url) => setFormData((prev) => ({ ...prev, logo_url: url }))}
            onChangeCor={(cor) => {
              setFormData((prev) => ({ ...prev, cor_primaria: cor }));
              document.documentElement.style.setProperty('--color-brand', cor);
              document.documentElement.style.setProperty('--brand-primary', cor);
            }}
            onRestaurarPadrao={() => {
              setFormData((prev) => ({ ...prev, cor_primaria: '#0ea5e9', logo_url: undefined }));
              document.documentElement.style.setProperty('--color-brand', '#0ea5e9');
              document.documentElement.style.setProperty('--brand-primary', '#0ea5e9');
            }}
          />
        )}

        {activeTab === 'BALANCA' && (
          <BalancaConfigTab formData={formData} setFormData={setFormData} />
        )}

        {activeTab === 'FAILOVER' && <FailoverBackupTab />}
      </div>
    </div>
  );
};
