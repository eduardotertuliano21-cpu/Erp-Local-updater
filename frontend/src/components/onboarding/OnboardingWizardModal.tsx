import React, { useState, useEffect } from 'react';
import { enterpriseApi } from '../../services/enterpriseApi.js';
import { api, setApiBaseUrl } from '../../services/api.js';
import { useTheme } from '../../context/ThemeContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Zap, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { buscarEnderecoPorCep } from './cepHelper.js';
import { EstabelecimentoFormStep } from './EstabelecimentoFormStep.js';
import { OnboardingModeStep } from './OnboardingModeStep.js';
import { FiscalConfigStep } from './FiscalConfigStep.js';
import { AdminFormStep } from './AdminFormStep.js';
import { TerminalCaixaStep } from './TerminalCaixaStep.js';

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
  const [passo, setPasso] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [chaveLicenca, setChaveLicenca] = useState('');
  const [camposBloqueados, setCamposBloqueados] = useState(false);
  const [moduloNfePlano, setModuloNfePlano] = useState<boolean>(false);
  const [numeroCaixa, setNumeroCaixa] = useState('01');
  const [masterIpDetectado, setMasterIpDetectado] = useState('');
  const [servidorOrigemLabel, setServidorOrigemLabel] = useState('Servidor Principal');

  const [nomeLoja, setNomeLoja] = useState(''), [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState(''), [telefone, setTelefone] = useState('');
  const [cep, setCep] = useState(''), [logradouro, setLogradouro] = useState(''), [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState(''), [cidade, setCidade] = useState(''), [estado, setEstado] = useState('');
  const [segmento, setSegmento] = useState('GERAL'), [carregandoCep, setCarregandoCep] = useState(false);

  const [adminNome, setAdminNome] = useState('ADMIN'), [adminLogin, setAdminLogin] = useState('ADMIN');
  const [adminSenha, setAdminSenha] = useState('1234'), [adminConfirmacao, setAdminConfirmacao] = useState('1234'), [verSenha, setVerSenha] = useState(false);

  const [tokenCsc, setTokenCsc] = useState(''), [idTokenCsc, setIdTokenCsc] = useState('000001');
  const [deixarParaDepois, setDeixarParaDepois] = useState(true), [comportamentoFiscal, setComportamentoFiscal] = useState<'SEMPRE' | 'MANUAL'>('MANUAL');
  const [balancaCheckoutAtiva, setBalancaCheckoutAtiva] = useState(false), [balancaModelo, setBalancaModelo] = useState('TOLEDO'), [balancaPorta, setBalancaPorta] = useState('AUTO');
  const [salvando, setSalvando] = useState(false), [erro, setErro] = useState<string | null>(null);

  const aplicarConfigServidor = (cfg: any, ipOrigem?: string, labelOrigem?: string) => {
    const ramo = (cfg.ramo_atuacao || 'mercado').toLowerCase();
    setSegmento(RAMO_PARA_SEGMENTO[ramo] || cfg.segmento || 'GERAL');
    setNomeLoja(cfg.nome_loja || cfg.nomeFantasia || 'CLICKSTORM PDV');
    setRazaoSocial(cfg.razao_social || cfg.razaoSocial || cfg.nome_loja || '');
    if (cfg.cnpj) setCnpj(cfg.cnpj);
    if (cfg.telefone) setTelefone(cfg.telefone);
    if (cfg.cep) setCep(cfg.cep);
    if (cfg.logradouro) setLogradouro(cfg.logradouro);
    if (cfg.numero) setNumero(cfg.numero);
    if (cfg.bairro) setBairro(cfg.bairro);
    if (cfg.cidade) setCidade(cfg.cidade);
    if (cfg.estado) setEstado(cfg.estado);
    if (cfg.modulo_nfe !== undefined || cfg.moduloNfe !== undefined) setModuloNfePlano(Boolean(cfg.modulo_nfe ?? cfg.moduloNfe));
    if (cfg.comportamento_fiscal_pdv) setComportamentoFiscal(cfg.comportamento_fiscal_pdv);
    if (cfg.balanca_checkout_ativa !== undefined) setBalancaCheckoutAtiva(Boolean(cfg.balanca_checkout_ativa));
    if (cfg.balanca_modelo) setBalancaModelo(cfg.balanca_modelo);
    if (cfg.balanca_porta) setBalancaPorta(cfg.balanca_porta);
    if (cfg.administradorLogin) setAdminLogin(String(cfg.administradorLogin).toUpperCase());
    if (cfg.administradorNome) setAdminNome(String(cfg.administradorNome).toUpperCase());
    if (cfg.senhaPrimeiroAcesso) {
      const pin = String(cfg.senhaPrimeiroAcesso).slice(0, 4);
      setAdminSenha(pin); setAdminConfirmacao(pin);
    }
    if (ipOrigem) setMasterIpDetectado(ipOrigem);
    if (labelOrigem) setServidorOrigemLabel(labelOrigem);
  };

  useEffect(() => {
    if (!isOpen) return;
    api.obterDiscoveryStatus().then((disc) => {
      const d = disc.data as any;
      if (disc.success && d?.role === 'SLAVE' && d?.masterIp && d?.masterConfig?.sistema_configurado) {
        const ip = String(d.masterIp).trim();
        setApiBaseUrl(`http://${ip}:${d.masterPort || 5000}/api`);
        localStorage.setItem('clickstorm_network_role', 'TERMINAL');
        aplicarConfigServidor(d.masterConfig, ip, `Servidor LAN (${ip})`);
        setNumeroCaixa('02');
        setPasso(4);
      }
    }).catch(() => {});
  }, [isOpen]);

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

  const handleChaveValidada = (t: any, chave: string, senhaPin?: string, jaConfigurado?: boolean) => {
    setChaveLicenca(chave);
    setCamposBloqueados(true);
    const pin = (senhaPin || t.senhaPrimeiroAcesso || '1234').trim().slice(0, 4);
    setAdminSenha(pin); setAdminConfirmacao(pin);
    if (t.email && !t.administradorLogin) {
      const def = String(t.email).split('@')[0].toUpperCase();
      setAdminLogin(def); setAdminNome(t.administradorNome || def);
    }
    aplicarConfigServidor(t, t.servidorMasterIp || '', t.servidorMasterIp ? `Servidor (${t.servidorMasterIp})` : 'Nuvem ClickStorm');
    setErro(null);

    if (jaConfigurado || t.jaConfigurado) {
      if (t.servidorMasterIp) {
        api.conectarMasterManual(t.servidorMasterIp, 5000).then((r) => {
          if (r.success && (r.data as any)?.masterConfig) {
            setApiBaseUrl(`http://${t.servidorMasterIp}:5000/api`);
            localStorage.setItem('clickstorm_network_role', 'TERMINAL');
            aplicarConfigServidor((r.data as any).masterConfig, t.servidorMasterIp, `Servidor LAN (${t.servidorMasterIp})`);
          }
        }).catch(() => {});
      }
      setNumeroCaixa('02');
      setPasso(4);
    } else {
      setNumeroCaixa('01');
      setPasso(1);
    }
  };

  const handleContaCriada = (chave: string, dados: any) => {
    setChaveLicenca(chave);
    if (dados.moduloNfe !== undefined) setModuloNfePlano(Boolean(dados.moduloNfe));
    if (dados.senhaPrimeiroAcesso) {
      const pin = String(dados.senhaPrimeiroAcesso).slice(0, 4);
      setAdminSenha(pin); setAdminConfirmacao(pin);
    }
    if (dados.email) {
      const def = String(dados.email).split('@')[0].toUpperCase();
      setAdminLogin(def); setAdminNome(def);
    }
    setErro(null); setPasso(1);
  };

  const handleServidorLanConectado = (masterCfg: any, masterIp: string) => {
    aplicarConfigServidor(masterCfg, masterIp, `Servidor LAN (${masterIp})`);
    setNumeroCaixa('02'); setErro(null); setPasso(4);
  };

  const enderecoFormatado = [
    logradouro.trim(), numero.trim() ? `Nº ${numero.trim()}` : '', bairro.trim() ? `Bairro ${bairro.trim()}` : '',
    cidade.trim() ? `${cidade.trim()}/${estado.trim() || 'SP'}` : '', cep.trim() ? `CEP ${cep.trim()}` : '',
  ].filter(Boolean).join(', ');

  const avancarPasso1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeLoja.trim()) return setErro('Informe o Nome da sua Loja.');
    if (!telefone.trim() || telefone.replace(/\D/g, '').length < 10) return setErro('Informe um Telefone / WhatsApp válido com DDD.');
    if (!cep.trim() || !logradouro.trim() || !numero.trim() || !bairro.trim() || !cidade.trim() || !estado.trim()) {
      return setErro('Endereço completo é obrigatório (CEP, Rua, Número, Bairro, Cidade e UF).');
    }
    setErro(null); setPasso(2);
  };

  const avancarPasso2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminNome.trim() || !adminLogin.trim() || !adminSenha) return setErro('Preencha o nome, usuário de login e senha do Administrador.');
    if (adminSenha.length !== 4) return setErro('A senha de acesso deve conter exatamente 4 dígitos numéricos.');
    if (adminSenha !== adminConfirmacao) return setErro('As senhas digitadas não coincidem.');
    setErro(null); setPasso(3);
  };

  const handleConcluir = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const numCxFormatado = (numeroCaixa.trim() || '01').padStart(2, '0');
    setSalvando(true); setErro(null);
    try {
      const ramo = SEGMENTO_PARA_RAMO[segmento] || 'mercado';
      const senhaFinal = (adminSenha.trim() || '1234').slice(0, 4);
      const loginFinal = (adminLogin.trim() || 'ADMIN').toUpperCase();
      const nomeLojaFinal = (nomeLoja.trim() || 'CLICKSTORM PDV').toUpperCase();

      const res = await enterpriseApi.concluirOnboarding({
        nome_loja: nomeLojaFinal, razao_social: (razaoSocial.trim() || nomeLojaFinal).toUpperCase(),
        cnpj: cnpj.trim(), telefone: telefone.trim(), endereco: enderecoFormatado,
        endereco_detalhado: { cep, logradouro, numero, bairro, cidade, estado },
        segmento, ramo_atuacao: ramo, admin_nome: (adminNome.trim() || loginFinal).toUpperCase(),
        admin_login: loginFinal, admin_senha: senhaFinal,
        token_csc: tokenCsc.trim(), id_token_csc: idTokenCsc.trim(),
        comportamento_fiscal_pdv: comportamentoFiscal, deixar_para_depois: deixarParaDepois,
        chave_licenca: chaveLicenca || undefined, balanca_checkout_ativa: balancaCheckoutAtiva ? 1 : 0,
        balanca_modelo: balancaModelo, balanca_porta: balancaPorta, modulo_nfe: moduloNfePlano ? 1 : 0,
        modo_operacao: masterIpDetectado ? 'SLAVE' : 'MASTER', master_ip: masterIpDetectado || undefined,
      });

      if (res.success) {
        localStorage.setItem('clickstorm_onboarded', 'true');
        localStorage.setItem('clickstorm_business_mode', ramo);
        localStorage.setItem('clickstorm_numero_caixa_fisico', numCxFormatado);
        if (chaveLicenca) localStorage.setItem('clickstorm_licenca_chave', chaveLicenca);

        await atualizarConfig({
          nome_loja: nomeLojaFinal, razao_social: (razaoSocial.trim() || nomeLojaFinal).toUpperCase(),
          cnpj: cnpj.trim(), telefone: telefone.trim(), endereco: enderecoFormatado, cep: cep.trim(),
          logradouro: logradouro.trim(), numero: numero.trim(), bairro: bairro.trim(), cidade: cidade.trim(),
          estado: estado.trim().toUpperCase(), sistema_configurado: 1, comportamento_fiscal_pdv: comportamentoFiscal,
          balanca_checkout_ativa: balancaCheckoutAtiva ? 1 : 0, balanca_modelo: balancaModelo, balanca_porta: balancaPorta,
          ramo_atuacao: ramo, segmento: (ramo || 'mercado').toUpperCase(), modulo_nfe: moduloNfePlano ? 1 : 0,
        } as any);

        try { await api.switchTenant(ramo); } catch {}
        await login(loginFinal, senhaFinal).catch(() => {});
        onConcluir();
        window.location.reload();
      } else {
        setErro(res.error || 'Falha ao salvar configuração inicial.');
      }
    } catch (err: any) {
      setErro(err.message || 'Erro inesperado ao salvar.');
    } finally { setSalvando(false); }
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
              <p className="text-[11px] text-slate-400">Ativação de Licença & Sincronização de Caixa</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {passo === 0 ? 'Modo de Início' : passo === 4 ? 'Identificação do Caixa' : `Etapa ${passo} de 3`}
          </span>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {erro && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium animate-shake">{erro}</div>}
          {passo === 0 && <OnboardingModeStep onChaveValidada={handleChaveValidada} onContaCriada={handleContaCriada} onServidorLanConectado={handleServidorLanConectado} onPularParaManual={() => setPasso(1)} />}
          {passo === 1 && <EstabelecimentoFormStep nomeLoja={nomeLoja} setNomeLoja={setNomeLoja} razaoSocial={razaoSocial} setRazaoSocial={setRazaoSocial} cnpj={cnpj} setCnpj={setCnpj} telefone={telefone} setTelefone={setTelefone} cep={cep} setCep={setCep} logradouro={logradouro} setLogradouro={setLogradouro} numero={numero} setNumero={setNumero} bairro={bairro} setBairro={setBairro} cidade={cidade} setCidade={setCidade} estado={estado} setEstado={setEstado} segmento={segmento} setSegmento={setSegmento} carregandoCep={carregandoCep} onBuscarCep={handleBuscarCep} onSubmit={avancarPasso1} bloqueado={camposBloqueados} />}
          {passo === 2 && <AdminFormStep adminNome={adminNome} setAdminNome={setAdminNome} adminLogin={adminLogin} setAdminLogin={setAdminLogin} adminSenha={adminSenha} setAdminSenha={setAdminSenha} adminConfirmacao={adminConfirmacao} setAdminConfirmacao={setAdminConfirmacao} verSenha={verSenha} setVerSenha={setVerSenha} onSubmit={avancarPasso2} />}
          {passo === 3 && <FiscalConfigStep deixarParaDepois={deixarParaDepois} setDeixarParaDepois={setDeixarParaDepois} idTokenCsc={idTokenCsc} setIdTokenCsc={setIdTokenCsc} tokenCsc={tokenCsc} setTokenCsc={setTokenCsc} comportamentoFiscal={comportamentoFiscal} setComportamentoFiscal={setComportamentoFiscal} balancaCheckoutAtiva={balancaCheckoutAtiva} setBalancaCheckoutAtiva={setBalancaCheckoutAtiva} balancaModelo={balancaModelo} setBalancaModelo={setBalancaModelo} balancaPorta={balancaPorta} setBalancaPorta={setBalancaPorta} nomeLoja={nomeLoja} enderecoFormatado={enderecoFormatado} telefone={telefone} adminNome={adminNome} adminLogin={adminLogin} />}
          {passo === 4 && <TerminalCaixaStep nomeLoja={nomeLoja} cnpj={cnpj} segmento={segmento} servidorOrigem={servidorOrigemLabel} numeroCaixa={numeroCaixa} setNumeroCaixa={setNumeroCaixa} moduloNfe={moduloNfePlano} onConfirmar={handleConcluir} onConfigurarManual={() => setPasso(1)} />}
        </div>

        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          {passo > 0 ? (
            <button type="button" onClick={() => setPasso(passo === 4 ? 0 : ((passo - 1) as any))} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white font-medium cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5" /><span>Voltar</span>
            </button>
          ) : <span className="text-[11px] text-slate-500">Configuração Inicial SaaS</span>}
          {passo === 1 && <button type="submit" form="passo1-form" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><span>Próximo</span><ArrowRight className="w-3.5 h-3.5" /></button>}
          {passo === 2 && <button type="submit" form="passo2-form" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><span>Avançar para Fiscal</span><ArrowRight className="w-3.5 h-3.5" /></button>}
          {(passo === 3 || passo === 4) && <button type="button" onClick={() => handleConcluir()} disabled={salvando} className="px-5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"><CheckCircle2 className="w-4 h-4" /><span>{salvando ? 'Iniciando...' : passo === 4 ? `Abrir Caixa ${(numeroCaixa || '01').padStart(2, '0')}` : 'Concluir e Iniciar'}</span></button>}
        </div>
      </div>
    </div>
  );
};
