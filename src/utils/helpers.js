export function calcularTotalJornadas(jornadas) {
  return jornadas.reduce((sum, j) => sum + (j.valorDiaria || 0) + (j.valorCorridas || 0) + (j.comissoes || 0) + (j.missoes || 0) - (j.descontos || 0), 0);
}

export function calcularTotalMotoboys(motoboys) {
  return motoboys.length;
} 