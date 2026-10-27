import { CaixaPretaRepository, CaixaPretaRegistro } from '../repositories/CaixaPretaRepository.js';

export class AiDiagnosticService {
  private static GROQ_API_KEY =
    process.env.GROQ_API_KEY ||
    Buffer.from('Z3NrX3YydXFWUVpCQ0xFR2JNR3kxTWVmV0dkeWJvRllmSnNsdkNNRUFoYUc3Tjh1dUFBWldUVnQ=', 'base64').toString('utf-8');
  private static GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
  private static MODEL = 'llama-3.1-8b-instant';
  private static repo = new CaixaPretaRepository();

  private static fallbackLocal(codigoOuErro: string): string {
    const txt = String(codigoOuErro || '').toUpperCase();
    if (txt.includes('539') || txt.includes('204')) {
      return 'Duplicidade de NFC-e: este número já foi usado. Ajuste a numeração sequencial nas configurações fiscais.';
    }
    if (txt.includes('703') || txt.includes('DATA-HORA') || txt.includes('HORÁRIO')) {
      return 'Relógio desalinhado: a data e hora do computador estão adiantadas em relação à SEFAZ. Ajuste o relógio do Windows.';
    }
    if (txt.includes('215') || txt.includes('225') || txt.includes('SCHEMA')) {
      return 'Cadastro fiscal inválido: confira NCM, CFOP e tributos dos itens desta venda.';
    }
    if (txt.includes('778') || txt.includes('NCM')) {
      return 'NCM inexistente: corrija o código NCM de 8 dígitos dos produtos no cadastro.';
    }
    if (txt.includes('CERTIFICADO') || txt.includes('EXPIRADO')) {
      return 'Certificado digital vencido ou inválido: atualize o arquivo A1 nas configurações.';
    }
    if (txt.includes('BALANCA') || txt.includes('BALANÇA')) {
      return 'Balança desconectada: verifique o cabo USB/Serial e selecione a porta correta.';
    }
    return 'Falha na comunicação fiscal. Verifique a internet e o cadastro dos produtos antes de tentar novamente.';
  }

  public static async analisarErroCritico(
    erroOriginal: string,
    contexto?: Record<string, any>
  ): Promise<string> {
    const promptTexto = [
      `Erro: ${erroOriginal}`,
      contexto ? `Contexto: ${JSON.stringify(contexto)}` : ''
    ].filter(Boolean).join(' | ');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(this.GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: this.MODEL,
          messages: [
            {
              role: 'system',
              content:
                'Você é o assistente técnico interno do ERP ClickStorm. Traduza este erro técnico/fiscal em uma instrução de uma linha, direta e amigável para um lojista. Diga o que causou e como resolver. Máximo 2 frases.'
            },
            {
              role: 'user',
              content: promptTexto
            }
          ],
          max_tokens: 80,
          temperature: 0.2
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return this.fallbackLocal(erroOriginal);
      }

      const data = (await response.json()) as any;
      const conteudo = data?.choices?.[0]?.message?.content?.trim();
      return conteudo || this.fallbackLocal(erroOriginal);
    } catch {
      return this.fallbackLocal(erroOriginal);
    }
  }

  public static async analisarERegistrar(
    tipoEvento: string,
    erroOriginal: string | object,
    contexto?: Record<string, any>
  ): Promise<CaixaPretaRegistro> {
    const erroFormatado = typeof erroOriginal === 'string'
      ? erroOriginal
      : JSON.stringify(erroOriginal);

    const diagnostico = await this.analisarErroCritico(erroFormatado, contexto);

    return this.repo.registrarErro(
      tipoEvento,
      erroFormatado,
      diagnostico
    );
  }
}
