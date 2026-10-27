# ClickStorm System - PDV & ERP Local-First Enterprise

> 📖 **DOCUMENTAÇÃO OFICIAL DO SISTEMA:**  
> O relatório técnico completo, histórico de decisões arquiteturais, manual de módulos e guia para IAs está disponível em:  
> 👉 **[`relatorio_completo_clickstorm.md`](./relatorio_completo_clickstorm.md)**

PDV & ERP SaaS de alta performance para automação comercial, desenvolvido com arquitetura **Local-First**, separação estrita de bancos de dados via **Dual SQLite**, e interface **100% operável por teclado**.

---

## 🏛️ Arquitetura e Decisões de Design

### 1. Dual SQLite (Local-First)
- **`catalogo_sync.db` (Apenas Leitura):** Produtos cadastrados, SKUs, códigos de barras, regras tributárias e fiscais. Atualizado via sincronização da nuvem.
- **`local_operacao.db` (Apenas Gravação / Operação):** Sessões de caixa, suprimentos, sangrias, transações de vendas com cupons, pagamentos e logs de auditoria. Sincronizado do local para a nuvem.

### 2. UX de Frente de Caixa (100% Teclado)
- **Cursor Travado:** O foco do cursor permanece perpetuamente travado no leitor de código de barras. Qualquer clique na tela ou tentativa de desfoque é imediatamente interceptada e refocada.
- **Sintaxe de Multiplicação de Balcão:** O operador pode registrar quantidades diretamente no leitor (exemplo: `3*7891000100103` adiciona 3 unidades daquele produto instantaneamente).
- **Atalhos Funcionais (F1 a F12):**
  - `F1`: Manual rápido de atalhos e ajuda
  - `F2`: Consulta rápida de produtos por descrição no catálogo local
  - `F4` ou `Del`: Cancela o item selecionado
  - `F5`: Sangria de caixa (retirada)
  - `F6`: Suprimento de caixa (fundo de troco / entrada)
  - `F7`: Conferência e saldo atual do caixa
  - `F8`: Fechamento do caixa com conferência cega
  - `F9`: Cancela toda a venda em andamento
  - `F10`: Finalização de pagamento (Dinheiro, PIX, Cartão Débito, Cartão Crédito)
  - `F12`: Limpar tela / Iniciar nova venda
  - `↑` / `↓`: Navega entre os itens da comanda
  - `ESC`: Fecha qualquer modal e volta imediatamente ao input do código de barras

### 3. Motor Fiscal (NFC-e Modelo 65) & Contingência Offline
- **Chave de Acesso SEFAZ:** Geração oficial de chave de 44 dígitos com cálculo de Dígito Verificador via **Módulo 11**.
- **Contingência Offline (`tpEmis = 9`):** Caso a SEFAZ ou internet esteja indisponível, a venda é emitida e gravada instantaneamente em `local_operacao.db` com o XML layout 4.00 completo para posterior autorização.
- **Desova Automática de Contingência:** O worker de segundo plano desova e autoriza automaticamente as notas pendentes na SEFAZ assim que a conexão estiver restabelecida.
- **Tributos Transparentes:** Cálculo automático de alíquotas aproximadas conforme Lei 12.741/2012 (IBPT).

### 4. Impressão Térmica ESC/POS (80mm / 58mm), Spooler & Gaveta
- **Gerador ESC/POS:** Emissão do DANFE NFC-e Simplificado formatado para 48 colunas (bobina térmica 80mm).
- **Comandos Nativos:** Acionamento de pulso de abertura de gaveta (`ESC p 0 25 250`), inicialização (`ESC @`) e corte automático de papel (`GS V 0`).
- **Driver de Impressão Direta:** Suporte a impressão via Socket TCP (Porta 9100), Spooler do Windows e simulador de spooler binário.

### 5. Segurança & Autorização de Supervisor
- **Prevenção de Perdas:** Operações restritas como cancelamento de item (<kbd>F4</kbd>), cancelamento de venda (<kbd>F9</kbd>) e sangria de caixa (<kbd>F5</kbd>) acionam o modal de supervisor, exigindo PIN e gerando log de auditoria em `local_operacao.db`.

### 6. Parser de Balança de Checkout (EAN-13 iniciado em '2')
- **Decodificação de Hortifrúti/Açougue:** Identificação automática de etiquetas pesáveis iniciadas em `2`, extraindo o PLU, calculando o peso e aplicando o valor fracionado na comanda de forma instantânea.

### 7. Padrão Clean Code & SOLID
- **Repository Pattern:** Abstração de persistência via interfaces `ICatalogoRepository` e `IOperacaoRepository`.
- **Arquivos < 300 Linhas:** Modularidade estrita, desacoplamento em camadas de Domínio, Repositório, Serviço e Controlador.
- **Contrato de API Padronizado:**
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null
  }
  ```

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js >= 22 (recomendado Node 24 com suporte nativo a `node:sqlite`)

### 1. Iniciar o Backend
```bash
cd backend
npm run seed   # Popula catálogo de demonstração e abre Caixa #01
npm run dev    # Inicia API na porta 3333
```

### 2. Iniciar o Frontend
```bash
cd frontend
npm run dev    # Inicia interface PDV no Vite (ex: http://localhost:5173 ou 5174)
```

---

## 🧪 Códigos de Teste Prontos no Catálogo
- `7891000100103` - Refrigerante Coca-Cola Lata 350ml (R$ 5,50)
- `7891000100110` - Água Mineral Cristal sem Gás 500ml (R$ 3,00)
- `7891000100127` - Batata Frita Lay's Clássica 80g (R$ 9,90)
- `7891000100134` - Chocolate Bis ao Leite Lacta 126g (R$ 6,49)
- `7891000100141` - Leite Integral Piracanjuba 1L (R$ 4,89)
- `7891000100158` - Biscoito Recheado Oreo 90g (R$ 4,25)
- `7891000100165` - Café Torrado e Moído Pilão 500g (R$ 18,90)
- `123` - Produto Teste Rápido Balcão (R$ 10,00)
