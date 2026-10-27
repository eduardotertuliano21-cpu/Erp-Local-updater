import React, { useState } from 'react';
import { Building2, Image, Phone, MapPin, FileText, Search, Loader2 } from 'lucide-react';
import type { StoreSettings } from '../../context/ConfigProvider.js';
import { buscarEnderecoPorCep, formatarCep, formatarTelefone } from '../onboarding/cepHelper.js';
import { formatarLogoUrl } from '../../services/api.js';

interface DadosEmpresaTabProps {
  formData: StoreSettings;
  setFormData: React.Dispatch<React.SetStateAction<StoreSettings>>;
}

export const DadosEmpresaTab: React.FC<DadosEmpresaTabProps> = ({ formData, setFormData }) => {
  const [buscandoCep, setBuscandoCep] = useState(false);

  const atualizarEnderecoFormatado = (patch: Partial<StoreSettings>) => {
    const next = { ...formData, ...patch };
    const endFmt = [
      next.logradouro?.trim(),
      next.numero?.trim() ? `Nº ${next.numero.trim()}` : '',
      next.bairro?.trim() ? `Bairro ${next.bairro.trim()}` : '',
      next.cidade?.trim() ? `${next.cidade.trim()}/${next.estado?.trim() || 'SP'}` : '',
      next.cep?.trim() ? `CEP ${next.cep.trim()}` : '',
    ].filter(Boolean).join(', ');

    setFormData({ ...next, endereco: endFmt || next.endereco });
  };

  const handleCepChange = async (valor: string) => {
    const cepFmt = formatarCep(valor);
    atualizarEnderecoFormatado({ cep: cepFmt });

    if (cepFmt.replace(/\D/g, '').length === 8) {
      setBuscandoCep(true);
      const dados = await buscarEnderecoPorCep(cepFmt);
      setBuscandoCep(false);
      if (dados) {
        atualizarEnderecoFormatado({
          cep: cepFmt,
          logradouro: dados.logradouro || formData.logradouro || '',
          bairro: dados.bairro || formData.bairro || '',
          cidade: dados.localidade || formData.cidade || '',
          estado: dados.uf || formData.estado || '',
        });
        if (dados.ibge) {
          setFormData((prev) => ({ ...prev, codigo_municipio_ibge: dados.ibge }));
        }
      }
    }
  };

  return (
    <div className="space-y-4 font-sans select-none">
      <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-500" />
          <span>Dados da Empresa e Identificação Fiscal</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Informações sincronizadas com o Primeiro Acesso, cupons fiscais NFC-e e Painel Administrativo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Razão Social</label>
          <div className="relative mt-1">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={formData.razao_social || ''}
              onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
              placeholder="Ex: Comercial de Alimentos e Bebidas LTDA"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-3.5 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nome Fantasia (Nome da Loja)</label>
          <div className="relative mt-1">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={formData.nome_loja || ''}
              onChange={(e) => setFormData({ ...formData, nome_loja: e.target.value })}
              placeholder="Ex: ClickStorm Supermercados"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-3.5 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">CNPJ / CPF do Emitente</label>
          <div className="relative mt-1">
            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={formData.cnpj || ''}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0001-00"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-3.5 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Telefone / WhatsApp Comercial</label>
          <div className="relative mt-1">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={formData.telefone || ''}
              onChange={(e) => setFormData({ ...formData, telefone: formatarTelefone(e.target.value) })}
              placeholder="(11) 99999-9999"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-3.5 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Inscrição Estadual (IE)</label>
          <div className="relative mt-1">
            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={formData.inscricao_estadual || ''}
              onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })}
              placeholder="Isento ou Nº da Inscrição"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-3.5 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Regime Tributário (CRT)</label>
          <select
            value={formData.crt || 1}
            onChange={(e) => setFormData({ ...formData, crt: Number(e.target.value) })}
            className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none font-semibold"
          >
            <option value={1}>1 - Simples Nacional</option>
            <option value={2}>2 - Simples Nacional (Sublimite)</option>
            <option value={3}>3 - Regime Normal (Lucro Presumido/Real)</option>
            <option value={4}>4 - Simples Nacional - MEI</option>
          </select>
        </div>
      </div>

      {/* Bloco de Endereço Estruturado Separado */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-blue-500" />
          <span>Endereço Fiscal do Estabelecimento</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">CEP (Auto-Busca)</label>
            <div className="relative mt-1">
              <input
                type="text"
                value={formData.cep || ''}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-3.5 pr-8 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-mono outline-none"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {buscandoCep ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" /> : <Search className="w-3.5 h-3.5" />}
              </div>
            </div>
          </div>

          <div className="md:col-span-7">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Rua / Logradouro</label>
            <input
              type="text"
              value={formData.logradouro || ''}
              onChange={(e) => atualizarEnderecoFormatado({ logradouro: e.target.value })}
              placeholder="Ex: Rua Diamante"
              className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Número</label>
            <input
              type="text"
              value={formData.numero || ''}
              onChange={(e) => atualizarEnderecoFormatado({ numero: e.target.value })}
              placeholder="Ex: 360"
              className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="md:col-span-5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bairro</label>
            <input
              type="text"
              value={formData.bairro || ''}
              onChange={(e) => atualizarEnderecoFormatado({ bairro: e.target.value })}
              placeholder="Ex: Centro"
              className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="md:col-span-5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cidade</label>
            <input
              type="text"
              value={formData.cidade || ''}
              onChange={(e) => atualizarEnderecoFormatado({ cidade: e.target.value })}
              placeholder="Ex: Campo Limpo Paulista"
              className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">UF (Estado)</label>
            <input
              type="text"
              maxLength={2}
              value={formData.estado || ''}
              onChange={(e) => atualizarEnderecoFormatado({ estado: e.target.value.toUpperCase() })}
              placeholder="SP"
              className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-mono uppercase outline-none"
            />
          </div>

          <div className="md:col-span-5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Código IBGE Município (NFC-e)</label>
            <input
              type="text"
              maxLength={7}
              value={formData.codigo_municipio_ibge || ''}
              onChange={(e) => setFormData({ ...formData, codigo_municipio_ibge: e.target.value.replace(/\D/g, '').slice(0, 7) })}
              placeholder="Ex: 3509600"
              className="mt-1 w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 font-mono outline-none"
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">URL do Logotipo da Empresa</label>
        <div className="relative mt-1">
          <Image className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={formData.logo_url || ''}
            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            placeholder="https://suaempresa.com/logo.png"
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-3.5 py-2 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none"
          />
        </div>
        {formData.logo_url && (
          <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800">
            <img
              src={formatarLogoUrl(formData.logo_url)}
              alt="Logo Prévia"
              className="w-12 h-12 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
              onError={(e) => { (e.target as any).style.display = 'none'; }}
            />
            <span className="text-[11px] text-slate-500">Prévia do logotipo carregado</span>
          </div>
        )}
      </div>
    </div>
  );
};
