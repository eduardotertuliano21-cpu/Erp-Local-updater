import React, { useState, useEffect, useCallback } from 'react';
import { usePDV } from './hooks/usePDV.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';
import { CartSummary } from './components/pdv/CartSummary.js';
import { KeyboardShortcutsBar } from './components/pdv/KeyboardShortcutsBar.js';
import { ErpLayout, type ErpTabType } from './components/erp/ErpLayout.js';
import { ErpContent } from './components/erp/ErpContent.js';
import { PdvModalsContainer } from './components/pdv/PdvModalsContainer.js';
import { PdvLeftColumn } from './components/pdv/PdvLeftColumn.js';
import { useBusinessMode } from './context/BusinessModeContext.js';
import { useTheme } from './context/ThemeContext.js';
import { type Mesa } from './components/restaurant/RestaurantTablesBar.js';
import { assistenciaApi, type OrdemDeServico } from './services/assistenciaApi.js';
import { QrCodeModal } from './components/restaurant/QrCodeModal.js';
import { MobileOrderApp } from './components/restaurant/MobileOrderApp.js';
import { DataCollectorApp } from './components/inventory/DataCollectorApp.js';
import { LockScreen } from './components/licenca/LockScreen.js';
import { MasterSecretModal } from './components/admin/MasterSecretModal.js';
import { KdsScreen } from './components/restaurant/KdsScreen.js';
import { emitLiberaMesa, subscribeToMesas } from './services/restaurantSocket.js';
import { converterItensMesa, converterItensOs } from './utils/cartConverters.js';
import { useAuth } from './context/AuthContext.js';
import { LoginScreen } from './components/auth/LoginScreen.js';
import { OnboardingWizardModal } from './components/onboarding/OnboardingWizardModal.js';
import { TermoResponsabilidadeModal } from './components/onboarding/TermoResponsabilidadeModal.js';
import { CashRegisterStateMachineModal } from './components/auth/CashRegisterStateMachineModal.js';

export const App: React.FC = () => {
  if (typeof window !== 'undefined' && (window.location.search.includes('kds=1') || window.location.pathname.startsWith('/kds'))) return <KdsScreen />;
  if (typeof window !== 'undefined' && (window.location.search.includes('coletor=1') || window.location.pathname.startsWith('/coletor'))) return <DataCollectorApp />;
  if (typeof window !== 'undefined' && (window.location.search.includes('mobile=1') || window.location.pathname.startsWith('/mobile'))) return <MobileOrderApp />;

  const { isRestaurante, isAssistencia } = useBusinessMode();
  const { config, isDark, toggleTheme } = useTheme();
  const { usuario, logout, exigirAutenticacao } = useAuth();

  const [viewMode, setViewModeState] = useState<'PDV' | 'RETAGUARDA'>(() => (typeof sessionStorage !== 'undefined' && (sessionStorage.getItem('cs_view_mode') as any)) || (localStorage.getItem('cs_exigir_autenticacao') === 'false' ? 'RETAGUARDA' : 'PDV'));
  const setViewMode = (m: 'PDV' | 'RETAGUARDA' | ((p: 'PDV' | 'RETAGUARDA') => 'PDV' | 'RETAGUARDA')) => {
    setViewModeState((prev) => { const next = typeof m === 'function' ? m(prev) : m; try { sessionStorage.setItem('cs_view_mode', next); } catch {} return next; });
  };
  const [erpTab, setErpTab] = useState<ErpTabType>('DASHBOARD');
  const [termoAceito, setTermoAceito] = useState<boolean>(() => localStorage.getItem('clickstorm_termo_aceito') === 'true');
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => !localStorage.getItem('clickstorm_onboarded'));
  const [modoFiscalAtivo, setModoFiscalAtivo] = useState<boolean>(() => config.comportamento_fiscal_pdv === 'SEMPRE');
  const [showCustomizer, setShowCustomizer] = useState(false), [showConfigOperacao, setShowConfigOperacao] = useState(false);
  const [mesaAtiva, setMesaAtiva] = useState<number | null>(null), [osAtiva, setOsAtiva] = useState<OrdemDeServico | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false), [mesasRestaurante, setMesasRestaurante] = useState<Mesa[]>([]);
  const [ordensAssistencia, setOrdensAssistencia] = useState<OrdemDeServico[]>([]), [showQrModal, setShowQrModal] = useState(false), [qrModalTipo, setQrModalTipo] = useState<'mobile' | 'kds'>('mobile');
  const [cupomDanfe, setCupomDanfe] = useState<{ texto: string; chave: string; vendaId?: string } | null>(null);
  const [supervisorAction, setSupervisorAction] = useState<{ motivo: string; onAprovar: () => void } | null>(null), [showMasterModal, setShowMasterModal] = useState(false);

  useEffect(() => {
    if (config.comportamento_fiscal_pdv === 'SEMPRE') setModoFiscalAtivo(true);
    if (!exigirAutenticacao && !sessionStorage.getItem('cs_boot_done')) {
      sessionStorage.setItem('cs_boot_done', 'true');
      setViewMode('RETAGUARDA');
    }
  }, [config.comportamento_fiscal_pdv, exigirAutenticacao]);

  const {
    caixa, itens, selectedIndex, setSelectedIndex, subtotal, descontoTotal,
    totalLiquido, quantidadeTotalItens, activeModal, abrirModal, fecharModal,
    mensagemStatus, setMensagemStatus, isCarregando, operadorId,
    clienteIdentificado, identificarCliente,
    adicionarProdutoPorBarcode, removerItemSelecionado, cancelarVenda,
    recarregarStatusCaixa, carregarItensExternos,
    produtoPesagemAoVivo, confirmarPesagemAoVivo, cancelarPesagemAoVivo,
  } = usePDV();

  const solicitarSupervisor = (motivo: string, acao: () => void) => setSupervisorAction({ motivo, onAprovar: acao });

  const handleSelectMesa = useCallback((numero: number | null, mesa?: Mesa) => {
    if (numero === null) {
      setMesaAtiva(null);
      cancelarVenda();
      setMensagemStatus('Venda de Balcão selecionada');
    } else {
      setMesaAtiva(numero);
      if (mesa?.itens && mesa.itens.length > 0) {
        carregarItensExternos(converterItensMesa(mesa.itens, numero), `Mesa ${String(numero).padStart(2, '0')}`);
      } else {
        cancelarVenda();
        setMensagemStatus(`Mesa ${String(numero).padStart(2, '0')} selecionada (Livre)`);
      }
    }
  }, [cancelarVenda, carregarItensExternos, setMensagemStatus]);

  const handleSelectOs = useCallback((os: OrdemDeServico | null) => {
    if (!os) {
      setOsAtiva(null);
      cancelarVenda();
      setMensagemStatus('Venda Balcão / Acessórios selecionada');
    } else {
      setOsAtiva(os);
      carregarItensExternos(converterItensOs(os), `OS #${os.numero_os} - ${os.cliente_nome}`);
    }
  }, [cancelarVenda, carregarItensExternos, setMensagemStatus]);

  useEffect(() => {
    if (!isRestaurante || !mesaAtiva) return;
    return subscribeToMesas(
      () => {},
      (mesaAtualizada) => {
        if (mesaAtualizada.numero === mesaAtiva) {
          if (mesaAtualizada.status === 'LIVRE') {
            setMesaAtiva(null);
            cancelarVenda();
          } else if (mesaAtualizada.itens) {
            carregarItensExternos(converterItensMesa(mesaAtualizada.itens, mesaAtiva), `Mesa ${String(mesaAtiva).padStart(2, '0')}`);
          }
        }
      }
    );
  }, [isRestaurante, mesaAtiva, cancelarVenda, carregarItensExternos]);

  useKeyboardShortcuts({
    onF1: () => viewMode === 'PDV' && abrirModal('HELP'),
    onF2: () => viewMode === 'PDV' && abrirModal('SEARCH'),
    onF3: () => viewMode === 'PDV' && setShowConfigOperacao(true),
    onCtrlF3: () => setShowMasterModal((prev) => !prev),
    onF4: () => viewMode === 'PDV' && itens.length > 0 && solicitarSupervisor(`Cancelar Item`, removerItemSelecionado),
    onF5: () => viewMode === 'PDV' && solicitarSupervisor('Sangria de Caixa', () => abrirModal('SANGRIA')),
    onF6: () => viewMode === 'PDV' && (isRestaurante || isAssistencia ? setIsMapExpanded((prev) => !prev) : abrirModal('SUPRIMENTO')),
    onF7: () => viewMode === 'PDV' && abrirModal('CAIXA_STATUS'),
    onF8: () => viewMode === 'PDV' && abrirModal('CLOSE_CAIXA'),
    onF9: () => viewMode === 'PDV' && itens.length > 0 && solicitarSupervisor('Cancelar Venda', cancelarVenda),
    onF10: () => viewMode === 'PDV' && (itens.length > 0 ? abrirModal('PAYMENT') : setMensagemStatus('Adicione itens antes de finalizar')),
    onF11: () => setViewMode((prev) => (prev === 'PDV' ? 'RETAGUARDA' : 'PDV')),
    onF12: () => logout(),
    onPageUp: () => { if (!config.modulo_nfe) { setMensagemStatus('Módulo Fiscal não contratado'); return; } setModoFiscalAtivo(true); setMensagemStatus('✓ Modo Fiscal (NFC-e) ATIVADO'); },
    onPageDown: () => { setModoFiscalAtivo(false); setMensagemStatus('Modo Fiscal DESATIVADO (Gerencial)'); },
    onEscape: () => {
      if (showMasterModal) setShowMasterModal(false);
      else if (isMapExpanded) setIsMapExpanded(false);
      else if (showQrModal) setShowQrModal(false);
      else if (showConfigOperacao) setShowConfigOperacao(false);
      else if (showCustomizer) setShowCustomizer(false);
      else if (supervisorAction) setSupervisorAction(null);
      else if (cupomDanfe) setCupomDanfe(null);
      else fecharModal();
    },
    onArrowUp: () => viewMode === 'PDV' && setSelectedIndex((prev) => Math.max(0, prev - 1)),
    onArrowDown: () => viewMode === 'PDV' && setSelectedIndex((prev) => Math.min(itens.length - 1, prev + 1)),
    onDelete: () => viewMode === 'PDV' && itens.length > 0 && solicitarSupervisor(`Cancelar Item`, removerItemSelecionado),
  });

  const shortcutsList = [
    { key: 'F1', label: 'Ajuda', action: () => abrirModal('HELP') }, { key: 'F2', label: 'Buscar Item', action: () => abrirModal('SEARCH') },
    { key: 'F3', label: 'Configurações', action: () => setShowConfigOperacao(true) },
    { key: 'F4', label: 'Cancelar Item', action: () => itens.length > 0 && solicitarSupervisor(`Cancelar Item`, removerItemSelecionado), variant: 'warning' as const },
    { key: 'F5', label: 'Sangria', action: () => solicitarSupervisor('Sangria', () => abrirModal('SANGRIA')) },
    ...(isRestaurante || isAssistencia ? [{ key: 'F6', label: isMapExpanded ? 'Fechar (F6)' : (isRestaurante ? 'Ver Mesas (F6)' : 'Ver OS (F6)'), action: () => setIsMapExpanded((prev) => !prev) }] : [{ key: 'F6', label: 'Suprimento', action: () => abrirModal('SUPRIMENTO') }]),
    { key: 'F7', label: 'Conferir Caixa', action: () => abrirModal('CAIXA_STATUS') }, { key: 'F8', label: 'Fechar Caixa', action: () => abrirModal('CLOSE_CAIXA'), variant: 'danger' as const },
    { key: 'F9', label: 'Canc. Venda', action: () => itens.length > 0 && solicitarSupervisor('Cancelar Venda', cancelarVenda), variant: 'danger' as const },
    { key: 'F10', label: 'Finalizar', action: () => (itens.length > 0 ? abrirModal('PAYMENT') : setMensagemStatus('Adicione itens antes de finalizar')), variant: 'primary' as const },
    { key: 'F11', label: 'Retaguarda ERP', action: () => setViewMode('RETAGUARDA') }, { key: 'F12', label: 'Sair (Logout)', action: logout, variant: 'warning' as const },
    ...(config.modulo_nfe ? [{ key: 'PgUp', label: 'Fiscal', action: () => setModoFiscalAtivo((prev) => !prev) }] : []),
  ];

  const precisaPrimeiroAcesso = !localStorage.getItem('clickstorm_onboarded') || (config && (config.sistema_configurado === 0 || config.sistema_configurado === false) && !usuario);

  if (!termoAceito) {
    return (
      <LockScreen>
        <TermoResponsabilidadeModal isOpen={true} onAceitar={() => setTermoAceito(true)} />
        <MasterSecretModal isOpen={showMasterModal} onClose={() => setShowMasterModal(false)} />
      </LockScreen>
    );
  }

  if (precisaPrimeiroAcesso || showOnboarding) {
    return (
      <LockScreen>
        <OnboardingWizardModal
          isOpen={true}
          onConcluir={() => { setShowOnboarding(false); localStorage.setItem('clickstorm_onboarded', 'true'); setViewMode('RETAGUARDA'); setErpTab('DASHBOARD'); }}
        />
        <MasterSecretModal isOpen={showMasterModal} onClose={() => setShowMasterModal(false)} />
      </LockScreen>
    );
  }

  if (!usuario && exigirAutenticacao) {
    return (
      <LockScreen>
        <LoginScreen
          onLoginSuccess={(dest) => {
            setViewMode(dest);
            if (dest === 'RETAGUARDA') setErpTab('DASHBOARD');
          }}
        />
        <MasterSecretModal isOpen={showMasterModal} onClose={() => setShowMasterModal(false)} />
      </LockScreen>
    );
  }

  if (viewMode === 'RETAGUARDA') {
    return (
      <LockScreen>
        <ErpLayout currentTab={erpTab} onSelectTab={setErpTab} onVoltarPdv={() => setViewMode('PDV')}>
          <ErpContent currentTab={erpTab} onSelectTab={setErpTab} onVoltarPdv={() => setViewMode('PDV')} />
        </ErpLayout>
        <MasterSecretModal isOpen={showMasterModal} onClose={() => setShowMasterModal(false)} />
      </LockScreen>
    );
  }

  const tituloPainel = mesaAtiva
    ? `MESA ${String(mesaAtiva).padStart(2, '0')}`
    : osAtiva
    ? `OS #${osAtiva.numero_os} • ${osAtiva.cliente_nome}`
    : config.nome_loja;

  return (
    <LockScreen>
      <div className="fixed inset-0 flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans select-none transition-colors">
        <main className="flex-1 p-3 flex gap-3 overflow-hidden relative z-0 min-h-0 bg-slate-100 dark:bg-slate-950 transition-colors">
          <PdvLeftColumn
            config={config}
            isDark={isDark}
            toggleTheme={toggleTheme}
            onAbrirRetaguarda={() => setViewMode('RETAGUARDA')}
            onAbrirConfig={() => setShowConfigOperacao(true)}
            modoRestaurante={isRestaurante}
            isAssistencia={isAssistencia}
            mesaAtiva={mesaAtiva}
            osAtiva={osAtiva}
            isMapExpanded={isMapExpanded}
            onToggleExpand={() => setIsMapExpanded((prev) => !prev)}
            onSelectMesa={handleSelectMesa}
            onSelectOs={handleSelectOs}
            onAbrirQrModal={(tipo = 'mobile') => { setQrModalTipo(tipo); setShowQrModal(true); }}
            mesasRestaurante={mesasRestaurante}
            setMesasRestaurante={setMesasRestaurante}
            ordensAssistencia={ordensAssistencia}
            setOrdensAssistencia={setOrdensAssistencia}
            onScanBarcode={adicionarProdutoPorBarcode}
            isModalOpen={activeModal !== 'NONE' || cupomDanfe !== null || supervisorAction !== null || showQrModal}
            isCarregando={isCarregando}
            mensagemStatus={mensagemStatus}
            itens={itens}
            selectedIndex={selectedIndex}
            onSelectItem={(idx) => setSelectedIndex(idx)}
            onCloseExpanded={() => setIsMapExpanded(false)}
          />

          {/* Direita (30%): Painel de Controle e Finalização */}
          <div className="w-[30%] h-full flex flex-col overflow-hidden min-h-0">
            <CartSummary
              itens={itens}
              subtotal={subtotal}
              descontoTotal={descontoTotal}
              totalLiquido={totalLiquido}
              quantidadeTotalItens={quantidadeTotalItens}
              caixaNumero={caixa?.numero || 1}
              operadorNome={usuario?.nome || operadorId || 'Operador'}
              logoUrl={config.logo_url}
              nomeLoja={tituloPainel}
              modoFiscalAtivo={Boolean(config.modulo_nfe && modoFiscalAtivo)}
              clienteIdentificado={clienteIdentificado}
              onIdentificarCliente={() => abrirModal('CLIENTE')}
              onFinalizarVenda={() => (itens.length > 0 ? abrirModal('PAYMENT') : setMensagemStatus('Adicione itens antes de finalizar a venda'))}
              onAcaoSecundaria={() => abrirModal('CAIXA_STATUS')}
            />
          </div>
        </main>

        <KeyboardShortcutsBar shortcuts={shortcutsList} />
        <CashRegisterStateMachineModal onSucessoAbertura={recarregarStatusCaixa} caixaAberto={Boolean(caixa)} onIrParaRetaguarda={() => setViewMode('RETAGUARDA')} />

        <PdvModalsContainer
          activeModal={activeModal} fecharModal={fecharModal}
          supervisorAction={supervisorAction} setSupervisorAction={setSupervisorAction}
          operadorId={operadorId} setMensagemStatus={setMensagemStatus}
          totalLiquido={totalLiquido} itens={itens} caixa={caixa}
          cancelarVenda={cancelarVenda} cupomDanfe={cupomDanfe} setCupomDanfe={setCupomDanfe}
          adicionarProdutoPorBarcode={adicionarProdutoPorBarcode} recarregarStatusCaixa={recarregarStatusCaixa}
          showOnboarding={showOnboarding} setShowOnboarding={setShowOnboarding}
          showCustomizer={showCustomizer} setShowCustomizer={setShowCustomizer}
          showConfigOperacao={showConfigOperacao} setShowConfigOperacao={setShowConfigOperacao}
          showFoodTables={false} setShowFoodTables={() => {}} carregarItensExternos={carregarItensExternos}
          clienteIdentificado={clienteIdentificado} identificarCliente={identificarCliente}
          produtoPesagemAoVivo={produtoPesagemAoVivo} confirmarPesagemAoVivo={confirmarPesagemAoVivo} cancelarPesagemAoVivo={cancelarPesagemAoVivo}
          onVendaSucesso={() => {
            if (mesaAtiva !== null) { emitLiberaMesa(mesaAtiva); setMesaAtiva(null); }
            if (osAtiva !== null) { assistenciaApi.atualizarStatus(osAtiva.id, 'ENTREGUE', 'Baixa efetuada no Caixa PDV').catch(() => {}); setOsAtiva(null); }
          }}
        />

        <QrCodeModal isOpen={showQrModal} onClose={() => setShowQrModal(false)} initialTipo={qrModalTipo} />
        <MasterSecretModal isOpen={showMasterModal} onClose={() => setShowMasterModal(false)} />
      </div>
    </LockScreen>
  );
};

export default App;
