export function formatCPF(value) {
  const cleanValue = value.replace(/\D/g, '');
  const match = cleanValue.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
  }
  return value;
}

export function formatTelefone(value) {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length === 11) {
    return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (cleanValue.length === 10) {
    return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return value;
}

export function formatarDataParaSalvar(dataInput) {
  // Implemente a lógica de formatação de datas
  return dataInput;
} 