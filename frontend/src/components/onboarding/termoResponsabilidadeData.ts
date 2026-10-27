export interface ClausulaTermo {
  numero: string;
  titulo: string;
  icone: string;
  conteudo: string;
}

export const CLAUSULAS_TERMO: ClausulaTermo[] = [
  {
    numero: '1',
    titulo: 'Arquitetura Local-First e Integridade dos Dados',
    icone: '💾',
    conteudo: `O sistema ClickStorm opera sob a arquitetura "Local-First / Offline-First", processando e persistindo dados em bancos SQLite físicos diretamente no dispositivo do Lojista, visando operação ininterrupta sem dependência de internet.
Por se tratar de armazenamento físico local na pasta de dados (/data), a ClickStorm Systems não se responsabiliza sob nenhuma hipótese por perdas de dados decorrentes de: falhas de disco rígido (HD/SSD), queima de equipamentos, furtos de computadores, formatações acidentais, ou infecções por vírus e ransomwares.
O Lojista compreende que é o único responsável por manter rotinas de backup físico ou em nuvem para arquivos sensíveis e bancos de dados locais.`,
  },
  {
    numero: '2',
    titulo: 'Responsabilidade Fiscal, Tributária e Contábil (Emissão de NFC-e)',
    icone: '🧾',
    conteudo: `O sistema possui um motor fiscal para a emissão de cupons (NFC-e Modelo 65) nos padrões da SEFAZ 4.00, incluindo campos para preenchimento de NCM, CFOP, CSOSN, CEST e unidade de medida.
O Lojista e seu respectivo contador são inteiramente responsáveis pela parametrização tributária correta de cada produto cadastrado.
A ClickStorm Systems está integralmente isenta de responsabilidade civil, penal ou financeira sobre multas aplicadas pela SEFAZ, autuações fiscais, rejeições de notas, bitributação, ou cálculos incorretos de impostos decorrentes do uso de alíquotas fixas, ausência de códigos CEST, uso incorreto de CSOSN (ex: venda de produtos ST com código genérico), ou emissão indevida de itens fracionados e serviços.
O Lojista assume o dever de arquivar e guardar os arquivos XML gerados pelo sistema, conforme os prazos estipulados pela legislação vigente.`,
  },
  {
    numero: '3',
    titulo: 'Controle de Acesso e Prevenção contra Fraudes Internas',
    icone: '🔒',
    conteudo: `O sistema oferece a opção de controle de acesso estrito com papéis definidos (Administrador, Gerente, Operador) e uso de senhas ou PINs de 4 dígitos.
O Lojista tem a liberdade de ativar o modo "Porteira Aberta" (bypassing total de login para agilidade), o que inativa a exigência de autenticação.
A ClickStorm Systems não possui nenhuma responsabilidade sobre furtos no caixa físico, descontos indevidos, desvios de estoque ou operações fraudulentas realizadas pelos funcionários do estabelecimento. A trilha imutável logs_auditoria que registra cancelamentos e sangrias é fornecida como ferramenta gerencial, mas não constitui garantia contra ações maliciosas internas.`,
  },
  {
    numero: '4',
    titulo: 'Infraestrutura de Rede e Multi-Terminais',
    icone: '🌐',
    conteudo: `Para estabelecimentos que utilizam a topologia Multi-Terminal em Rede Local (LAN), onde terminais secundários se conectam a um Servidor Master, a ClickStorm não garante estabilidade se a infraestrutura do cliente for inadequada.
Oscilações de Wi-Fi, mudanças dinâmicas de IP pelo roteador local, ou perda de conexão com o banco de dados Master são problemas de infraestrutura física do cliente.`,
  },
  {
    numero: '5',
    titulo: 'Sincronização em Nuvem, Renovação de Licença e Bloqueio',
    icone: '☁️',
    conteudo: `O sistema realiza comunicação em segundo plano (telemetria e heartbeat) a cada 10 segundos com a API Cloud da ClickStorm para validação do licenciamento.
Obrigatoriedade de Conexão Periódica: Embora a operação diária de vendas (PDV) funcione totalmente offline, é obrigatório que a máquina principal (Servidor Master) seja conectada à internet em período próximo à data de vencimento da mensalidade. Esta conexão é estritamente necessária para que o sistema sincronize com os servidores centrais e receba a liberação/renovação do próximo ciclo de uso. A ausência prolongada de conexão com a internet na data limite resultará no bloqueio preventivo do sistema, requerendo restabelecimento de rede para o desbloqueio.
O Lojista concorda expressamente que, em caso de inadimplência na cobrança recorrente (Stripe) ou falha na validação da licença vigente, o sistema receberá o comando remoto para alterar o status para BLOQUEADA, travando automaticamente a tela do PDV e interrompendo as vendas até a regularização.
A ClickStorm Systems não arcará com lucros cessantes, perdas de vendas ou danos morais em razão de bloqueios sistêmicos decorrentes de atrasos de pagamento ou ausência prolongada de comunicação com a internet para renovação da licença.`,
  },
  {
    numero: '6',
    titulo: 'Limitação Geral de Responsabilidades',
    icone: '⚖️',
    conteudo: `Em nenhuma circunstância a ClickStorm Systems, seus desenvolvedores ou parceiros serão responsabilizados por danos diretos, indiretos, incidentais ou lucros cessantes resultantes do uso inadequado do software, interrupções de hardware, ou falhas na transmissão de notas fiscais devido a instabilidades dos WebServices estaduais da SEFAZ.`,
  },
  {
    numero: '7',
    titulo: 'Privacidade e Proteção de Dados (LGPD - Lei nº 13.709/2018)',
    icone: '🛡️',
    conteudo: `O Lojista atua como Controlador dos dados cadastrais e fiscais de seus clientes e colaboradores. Em razão da arquitetura Local-First, os dados residem sob custódia física do Lojista, cabendo a este zelar pelo sigilo, segurança e conformidade perante a Autoridade Nacional de Proteção de Dados (ANPD).`,
  },
  {
    numero: '8',
    titulo: 'Propriedade Intelectual e Validade do Aceite Digital',
    icone: '📜',
    conteudo: `O software ClickStorm PDV & ERP é de propriedade intelectual exclusiva da ClickStorm Systems. O aceite registrado eletronicamente mediante autenticação ou confirmação nesta tela constitui título com plena validade jurídica e eficácia probatória entre as partes.`,
  },
];
