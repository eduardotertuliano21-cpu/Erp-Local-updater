import React, { useState } from 'react';
import { enterpriseApi } from '../../services/enterpriseApi.js';
import { useTheme } from '../../context/ThemeContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Zap, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { buscarEnderecoPorCep } from './cepHelper.js';
import { EstabelecimentoFormStep } from './EstabelecimentoFormStep.js';
import { OnboardingModeStep } from './OnboardingModeStep.js';
import { FiscalConfigStep } from './FiscalConfigStep.js';
import { AdminFormStep } from './AdminFormStep.js';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onConcluir: () => void;
}

const SEGMENTO_PARA_RAMO: Record<string, string> = {
  GERAL: 'mercado', RESTAURANTE: 'restaurante', ACOUQUE: 'acougue',
  ROUPAS: 'roupas', AUTOPECAS: 'autopecas', ASSISTENCIA: 'assistencia',
};

const RAMO_PARA_SEGMENTO: Record<string, string> = {
  mercado: 'GERAL', restaurante: 'RESTAURANTE', acougue: 'ACOUQUE',
  roupas: 'ROUPAS', autopecas: 'AUTOPECAS', assistencia: 'ASSISTENCIA',
};

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({ isOpen, onConcluir }) => {
  const { atualizarConfig } = useTheme();
  const { login } = useAuth();
  const [passo, setPasso] = useState<0 | 1 | 2 | 3>(0);
  const [chaveLicenca, setChaveLicenca] = useState('');
  const [camposBloqueados, setCamposBloqueados] = useState(false);

  // Passo 1: Estabelecimento
  const [nomeLoja, setNomeLoja] = useState(''), [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState(''), [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState(''), [logradouro, setLogradouro] = useState(''), [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState(''), [cidade, setCidade] = useState(''), [estado, setEstado] = useState('');
  const [segmento, setSegmento] = useState('GERAL'), [carregandoCep, setCarregandoCep] = useState(false);

  // Passo 2: Administrador Principal
  const [adminNome, setAdminNome] = useState('ADMIN'), [adminLogin, setAdminLogin] = useState('ADMIN');
  const [adminSenha, setAdminSenha] = useState(''), [adminConfirmacao, setAdminConfirmacao] = useState(''), [verSenha, setVerSenha] = useState(false);

  // Passo 3: Fiscal & Balança de Checkout
  const [tokenCsc, setTokenCsc] = useState(''), [idTokenCsc, setIdTokenCsc] = useState('000001');
  const [deixarParaDepois, setDeixarParaDepois] = useState(true), [comportamentoFiscal, setComportamentoFiscal] = useState<'SEMPRE' | 'MANUAL'>('MANUAL');
  const [balancaCheckoutAtiva, setBalancaCheckoutAtiva] = useState(false), [balancaModelo, setBalancaModelo] = useState('TOLEDO'), [balancaPorta, setBalancaPorta] = useState('AUTO');

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBuscarCep = async (cepVal: string) => {
    setCarregandoCep(true);
    const end = await buscarEnderecoPorCep(cepVal);
    setCarregandoCep(false);
    if (end) {
      if (end.logradouro) setLogradouro(end.logradouro);
      if (end.bairro) setBairro(end.bairro);
      if (end.localidade) setCidade(end.localidade);
      if (end.uf) setEstado(end.uf);
    }
  };

  const handleChaveValidada = (t: any, chave: string) => {
    setChaveLicenca(chave);
    setCamposBloqueados(true);
    if (t.ramo_atuacao) setSegmento(RAMO_PARA_SEGMENTO[t.ramo_atuacao.toLowerCase()] || 'GERAL');
    if (t.nomeFantasia) setNomeLoja(t.nomeFantasia);
    if (t.razaoSocial) setRazaoSocial(t.razaoSocial);
    if (t.cnpj) setCnpj(t.cnpj);
    if (t.telefone) setTelefone(t.telefone);
    if (t.cep) setCep(t.cep);
    if (t.logradouro) setLogradouro(t.logradouro);
    if (t.numero) setNumero(t.numero);
    if (t.bairro) setBairro(t.bairro);
    if (t.cidade) setCidade(t.cidade);
    if (t.estado) setEstado(t.estado);
    if (t.email) {
      const def = String(t.email).split('@')[0].toUpperCase();
      setAdminLogin(def);
      setAdminNome(t.administradorNome || def);
    }
    setErro(null);
    setPasso(1);
  };

  const handleContaCriada = (chave: string, dados: any) => {
    setChaveLicenca(chave);
    if (dados.email) {
      const def = String(dados.email).split('@')[0].toUpperCase();
      setAdminLogin(def);
      setAdminNome(def);
    }
    setErro(null);
    setPasso(1);
  };

  const enderecoFormatado = [
    logradouro.trim(), numero.trim() ? `Nº ${numero.trim()}` : '', bairro.trim() ? `Bairro ${bairro.trim()}` : '',
    cidade.trim() ? `${cidade.trim()}/${estado.trim() || 'SP'}` : '', cep.trim() ? `CEP ${cep.trim()}` : '',
  ].filter(Boolean).join(', ');

  const avancarPasso1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeLoja.trim()) return setErro('Informe o Nome da sua Loja.');
    if (!telefone.trim() || telefone.replace(/\D/g, '').length < 10) {
      return setErro('Informe um Telefone / WhatsApp válido de contato com DDD.');
    }
    if (!cep.trim() || !logradouro.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !estado.trim()) {
      return setErro('Endereço completo é obrigatório (CEP, Rua, Número, Bairro, Cidade e UF).');
    }
    setErro(null);
    setPasso(2);
  };

  const avancarPasso2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNome.trim() || !adminLogin.trim() || !adminSenha) {
      return setErro('Preencha o nome, usuário de login e senha do Administrador.');
    }
    if (adminSenha.length !== 4) {
      return setErro('A senha de acesso deve conter exatamente 4 dígitos numéricos.');
    }
    if (adminSenha !== adminConfirmacao) {
      return setErro('As senhas digitadas não coincidem.');
    }
    setErro(null);
    setPasso(3);
  };

  const handleConcluir = async () => {
    setSalvando(true);
    setErro(null);
    try {
      const ramo = SEGMENTO_PARA_RAMO[segmento] || 'mercado';
      const res = await enterpriseApi.concluirOnboarding({
        nome_loja: nomeLoja.trim().toUpperCase(),
        razao_social: (razaoSocial.trim() || nomeLoja.trim()).toUpperCase(),
        cnpj: cnpj.trim(), telefone: telefone.trim(), endereco: enderecoFormatado,
        endereco_detalhado: { cep, logradouro, numero, bairro, cidade, estado },
        segmento, ramo_atuacao: ramo,
        admin_nome: adminNome.trim().toUpperCase(),
        admin_login: adminLogin.trim().toUpperCase(),
        admin_senha: adminSenha.trim(),
        token_csc: tokenCsc.trim(), id_token_csc: idTokenCsc.trim(),
        comportamento_fiscal_pdv: comportamentoFiscal, deixar_para_depois: deixarParaDepois,
        chave_licenca: chaveLicenca || undefined,
        balanca_checkout_ativa: balancaCheckoutAtiva ? 1 : 0,
        balanca_modelo: balancaModelo, balanca_porta: balancaPorta,
      });

      if (res.success) {
        localStorage.setItem('clickstorm_onboarded', 'true');
        localStorage.setItem('clickstorm_business_mode', ramo);
        if (chaveLicenca) localStorage.setItem('clickstorm_licenca_chave', chaveLicenca);

        await atualizarConfig({
          nome_loja: nomeLoja.trim().toUpperCase(), razao_social: (razaoSocial.trim() || nomeLoja.trim()).toUpperCase(),
          cnpj: cnpj.trim(), telefone: telefone.trim(), endereco: enderecoFormatado, cep: cep.trim(),
          logradouro: logradouro.trim(), numero: numero.trim(), bairro: bairro.trim(), cidade: cidade.trim(),
          estado: estado.trim().toUpperCase(), sistema_configurado: 1, comportamento_fiscal_pdv: comportamentoFiscal,
          balanca_checkout_ativa: balancaCheckoutAtiva ? 1 : 0, balanca_modelo: balancaModelo, balanca_porta: balancaPorta,
        } as any);

        const loginRes = await login(adminLogin.trim().toUpperCase(), adminSenha.trim());
        if (!loginRes.success) {
          setErro(loginRes.error || 'Configurações salvas, mas falha ao autenticar o Administrador.');
          return;
        }
        onConcluir();
      } else {
        setErro(res.error || 'Falha ao salvar configuração inicial.');
      }
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado ao salvar.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 select-none font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-tight">CLICKSTORM • CONFIGURAÇÃO SAAS</h2>
              <p className="text-[11px] text-slate-400">Ativação de Licença & Configuração Inicial</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {passo === 0 ? 'Modo de Início' : `Etapa ${passo} de 3`}
          </span>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {erro && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium animate-shake">{erro}</div>
          )}

          {passo === 0 && (
            <OnboardingModeStep
              onChaveValidada={handleChaveValidada}
              onContaCriada={handleContaCriada}
              onPularParaManual={() => setPasso(1)}
            />
          )}

          {passo === 1 && (
            <EstabelecimentoFormStep
              nomeLoja={nomeLoja} setNomeLoja={setNomeLoja}
              razaoSocial={razaoSocial} setRazaoSocial={setRazaoSocial}
              cnpj={cnpj} setCnpj={setCnpj}
              telefone={telefone} setTelefone={setTelefone}
              cep={cep} setCep={setCep}
              logradouro={logradouro} setLogradouro={setLogradouro}
              numero={numero} setNumero={setNumero}
              bairro={bairro} setBairro={setBairro}
              cidade={cidade} setCidade={setCidade}
              estado={estado} setEstado={setEstado}
              segmento={segmento} setSegmento={setSegmento}
              carregandoCep={carregandoCep}
              onBuscarCep={handleBuscarCep}
              onSubmit={avancarPasso1}
              bloqueado={camposBloqueados}
            />
          )}

          {passo === 2 && (
            <AdminFormStep
              adminNome={adminNome} setAdminNome={setAdminNome}
              adminLogin={adminLogin} setAdminLogin={setAdminLogin}
              adminSenha={adminSenha} setAdminSenha={setAdminSenha}
              adminConfirmacao={adminConfirmacao} setAdminConfirmacao={setAdminConfirmacao}
              verSenha={verSenha} setVerSenha={setVerSenha}
              onSubmit={avancarPasso2}
            />
          )}

          {passo === 3 && (
            <FiscalConfigStep
              deixarParaDepois={deixarParaDepois} setDeixarParaDepois={setDeixarParaDepois}
              idTokenCsc={idTokenCsc} setIdTokenCsc={setIdTokenCsc}
              tokenCsc={tokenCsc} setTokenCsc={setTokenCsc}
              comportamentoFiscal={comportamentoFiscal} setComportamentoFiscal={setComportamentoFiscal}
              balancaCheckoutAtiva={balancaCheckoutAtiva} setBalancaCheckoutAtiva={setBalancaCheckoutAtiva}
              balancaModelo={balancaModelo} setBalancaModelo={setBalancaModelo}
              balancaPorta={balancaPorta} setBalancaPorta={setBalancaPorta}
              nomeLoja={nomeLoja} enderecoFormatado={enderecoFormatado} telefone={telefone}
              adminNome={adminNome} adminLogin={adminLogin}
            />
          )}
        </div>

        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          {passo > 0 ? (
            <button type="button" onClick={() => setPasso((prev) => (prev - 1) as any)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white font-medium cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" /><span>Voltar</span>
            </button>
          ) : <span className="text-[11px] text-slate-500">Configuração Inicial SaaS</span>}

          {passo === 1 && (
            <button type="submit" form="passo1-form" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
              <span>Próximo</span><ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {passo === 2 && (
            <button type="submit" form="passo2-form" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
              <span>Avançar para Fiscal</span><ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {passo === 3 && (
            <button type="button" onClick={handleConcluir} disabled={salvando} className="px-5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
              <CheckCircle2 className="w-4 h-4" /><span>{salvando ? 'Iniciando...' : 'Concluir e Iniciar'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
