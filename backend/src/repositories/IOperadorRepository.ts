export interface OperadorRecord {
  id: string;
  matricula: string;
  nome: string;
  pin_hash: string;
  perfil: 'OPERADOR' | 'SUPERVISOR';
  ativo: number;
}

export interface IOperadorRepository {
  buscarPorMatricula(matricula: string): OperadorRecord | null;
  buscarPorPin(pin: string): OperadorRecord | null;
  listarSupervisores(): OperadorRecord[];
  salvarOperadoresSync(operadores: OperadorRecord[]): void;
}
