export function formatarCpfCnpj(valor: string): string {
  const limpo = valor.replace(/\D/g, '');
  if (limpo.length <= 11) {
    return limpo
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return limpo
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function validarCpf(cpf: string): boolean {
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo[i], 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(limpo[9], 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo[i], 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(limpo[10], 10);
}

export function validarCpfCnpj(doc: string): { valido: boolean; tipo: 'CPF' | 'CNPJ' | 'INVALIDO' } {
  const limpo = doc.replace(/\D/g, '');
  if (!limpo) return { valido: false, tipo: 'INVALIDO' };
  if (limpo.length === 11) {
    return { valido: validarCpf(limpo), tipo: 'CPF' };
  }
  if (limpo.length === 14) {
    return { valido: true, tipo: 'CNPJ' };
  }
  return { valido: false, tipo: 'INVALIDO' };
}
