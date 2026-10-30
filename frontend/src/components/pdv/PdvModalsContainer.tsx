import React from 'react';
import type { ItemCarrinho, CaixaStatus, Produto } from '../../types/pdv.js';
import type { ActiveModal } from '../../hooks/usePDV.js';
import { SupervisorAuthModal } from './modals/SupervisorAuthModal.js';
import { PaymentModal } from './modals/PaymentModal.js';
import { ReceiptModal } from './modals/ReceiptModal.js';
import { ProductSearchModal } from './modals/ProductSearchModal.js';
import { CashMovementModal } from './modals/CashMovementModal.js';
import { HelpModal } from './modals/HelpModal.js';
import { CashStatusModal } from './modals/CashStatusModal.js';
import { OnboardingWizardModal } from '../onboarding/OnboardingWizardModal.js';
import { VisualCustomizerModal } from './modals/VisualCustomizerModal.js';
import { ConfigOperacaoModal } from './modals/ConfigOperacaoModal.js';
import { FoodTablesModal } from '../food/FoodTablesModal.js';
import { IdentificarClienteModal } from './modals/IdentificarClienteModal.js';
import { PesagemAoVivoModal } from './PesagemAoVivoModal.js';
import { FiscalDiagnosticModal } from './modals/FiscalDiagnosticModal.js';
import { useOperacao } from '../../context/OperacaoContext.js';
import { api } from '../../services/api.js';

export interface PdvModalsContainerProps {
  activeModal: ActiveModal;
  fecharModal: () => void;
  supervisorAction: { motivo: string; onAprovar: () => void } | null;
  setSupervisorAction: (v: { motivo: string; onAprovar: () => void } | null) => void;
  operadorId: string;
  setMensagemStatus: (msg: string) => void;
  totalLiquido: number;
  itens: ItemCarrinho[];
  caixa: CaixaStatus | null;
  cancelarVenda: () => void;
  cupomDanfe: { texto: string; chave: string; vendaId?: string } | null;
  setCupomDanfe: (c: { texto: string; chave: string; vendaId?: string } | null) => void;
  adicionarProdutoPorBarcode: (code: string) => void;
  recarregarStatusCaixa: () => void;
  showOnboarding: boolean;
  setShowOnboarding: (v: boolean) => void;
  showCustomizer: boolean;
  setShowCustomizer: (v: boolean) => void;
  showConfigOperacao: boolean;
  setShowConfigOperacao: (v: boolean) => void;
  showFoodTables: boolean;
  setShowFoodTables: (v: boolean) => void;
  carregarItensExternos: (itens: ItemCarrinho[], nome: string) => void;
  clienteIdentificado?: any | null;
  identificarCliente?: (cliente: any | null) => void;
  onVendaSucesso?: () => void;
  modoFiscalAtivo?: boolean;
  produtoPesagemAoVivo?: Produto | null;
  confirmarPesagemAoVivo?: (peso: number) => void;
  cancelarPesagemAoVivo?: () => void;
}

export const PdvModalsContainer: React.FC<PdvModalsContainerProps> = ({
  activeModal,
  fecharModal,
  supervisorAction,
  setSupervisorAction,
  operadorId,
  setMensagemStatus,
  totalLiquido,
  itens,
  caixa,
  cancelarVenda,
  cupomDanfe,
  setCupomDanfe,
  adicionarProdutoPorBarcode,
  recarregarStatusCaixa,
  showOnboarding,
  setShowOnboarding,
  showCustomizer,
  setShowCustomizer,
  showConfigOperacao,
  setShowConfigOperacao,
  showFoodTables,
  setShowFoodTables,
  carregarItensExternos,
  clienteIdentificado,
  identificarCliente,
  onVendaSucesso,
  modoFiscalAtivo = false,
  produtoPesagemAoVivo,
  confirmarPesagemAoVivo,
  cancelarPesagemAoVivo,
}) => {
  const { config } = useOperacao();
  const [alertaFiscal, setAlertaFiscal] = React.useState<{ diagnostico: string; erro?: string } | null>(null);

  return (
    <>
      <SupervisorAuthModal
        isOpen={supervisorAction !== null}
        motivo={supervisorAction?.motivo || ''}
        operadorId={operadorId}
        onClose={() => setSupervisorAction(null)}
        onAutorizado={(supervisorNome) => {
          setMensagemStatus(`✓ Operação autorizada por: ${supervisorNome}`);
          supervisorAction?.onAprovar();
          setSupervisorAction(null);
        }}
      />

      <PaymentModal
        isOpen={activeModal === 'PAYMENT'}
        totalPagar={totalLiquido}
        itens={itens}
        caixaId={caixa?.id || ''}
        operadorId={operadorId}
        cpfInicial={clienteIdentificado?.cpf_cnpj || clienteIdentificado?.cpf || ''}
        onClose={fecharModal}
        onSuccess={async (troco, vendaId) => {
          fecharModal();
          cancelarVenda();
          onVendaSucesso?.();
          setMensagemStatus(`✓ Venda Finalizada (${modoFiscalAtivo ? 'NFC-e' : 'Não Fiscal'})! Troco: R$ ${troco.toFixed(2)}`);

          if (modoFiscalAtivo) {
            const resEmissao = await api.emitirNfce(vendaId);
            if (!resEmissao.success && resEmissao.diagnostico_ia) {
              setAlertaFiscal({
                diagnostico: resEmissao.diagnostico_ia,
                erro: resEmissao.error,
              });
            }
          }

          if (config.comportamento_impressao === 'NAO_IMPRIMIR') return;
          const resCupom = await api.obterDanfeCupom(vendaId);
          if (resCupom.success && resCupom.data) {
            setCupomDanfe({
              texto: resCupom.data.cupom.textoFormatado,
              chave: resCupom.data.cupom.chaveFormatada,
              vendaId,
            });
            if (config.comportamento_impressao === 'SEMPRE') {
              api.imprimirDireto(vendaId).catch(() => {});
            }
          } else if (resCupom.diagnostico_ia) {
            setAlertaFiscal({
              diagnostico: resCupom.diagnostico_ia,
              erro: resCupom.error,
            });
          }
        }}
      />

      <FiscalDiagnosticModal
        isOpen={alertaFiscal !== null}
        onClose={() => setAlertaFiscal(null)}
        diagnostico={alertaFiscal?.diagnostico || ''}
        erroOriginal={alertaFiscal?.erro}
      />

      <ReceiptModal
        isOpen={cupomDanfe !== null}
        cupomTexto={cupomDanfe?.texto || ''}
        chaveFormatada={cupomDanfe?.chave}
        vendaId={cupomDanfe?.vendaId}
        onClose={() => setCupomDanfe(null)}
      />

      <ProductSearchModal
        isOpen={activeModal === 'SEARCH'}
        onClose={fecharModal}
        onSelectProduct={(barcode) => {
          fecharModal();
          adicionarProdutoPorBarcode(barcode);
        }}
      />

      <CashMovementModal
        isOpen={activeModal === 'SANGRIA' || activeModal === 'SUPRIMENTO'}
        tipo={activeModal === 'SANGRIA' ? 'SANGRIA' : 'SUPRIMENTO'}
        caixaId={caixa?.id || ''}
        operadorId={operadorId}
        onClose={fecharModal}
        onSuccess={(msg) => {
          fecharModal();
          setMensagemStatus(`✓ ${msg}`);
          recarregarStatusCaixa();
        }}
      />

      <HelpModal isOpen={activeModal === 'HELP'} onClose={fecharModal} />

      <CashStatusModal
        isOpen={activeModal === 'CAIXA_STATUS' || activeModal === 'CLOSE_CAIXA'}
        caixa={caixa}
        operadorId={operadorId}
        isFechamento={activeModal === 'CLOSE_CAIXA'}
        onClose={fecharModal}
        onCaixaFechado={() => {
          recarregarStatusCaixa();
          setMensagemStatus('✓ Caixa fechado com sucesso');
        }}
      />

      <OnboardingWizardModal
        isOpen={showOnboarding}
        onConcluir={() => {
          localStorage.setItem('clickstorm_onboarded', 'true');
          setShowOnboarding(false);
        }}
      />

      <VisualCustomizerModal isOpen={showCustomizer} onClose={() => setShowCustomizer(false)} />
      <ConfigOperacaoModal
        isOpen={showConfigOperacao}
        onClose={() => setShowConfigOperacao(false)}
        onOpenVisualCustomizer={() => setShowCustomizer(true)}
      />
      <FoodTablesModal
        isOpen={showFoodTables}
        onClose={() => setShowFoodTables(false)}
        onCarregarMesaNoCaixa={(itensMesa, nome) => carregarItensExternos(itensMesa, nome)}
      />
      <IdentificarClienteModal
        isOpen={activeModal === 'CLIENTE'}
        clienteAtual={clienteIdentificado}
        onClose={fecharModal}
        onSelectCliente={(c) => {
          identificarCliente?.(c);
          fecharModal();
        }}
      />
      <PesagemAoVivoModal
        isOpen={Boolean(produtoPesagemAoVivo)}
        produto={produtoPesagemAoVivo || null}
        onConfirmar={confirmarPesagemAoVivo || (() => {})}
        onCancelar={cancelarPesagemAoVivo || (() => {})}
      />
    </>
  );
};
