export function filtrarMotoboys(motoboys, filtros) {
  return motoboys.filter(m =>
    (!filtros.nome || m.nome.toLowerCase().includes(filtros.nome.toLowerCase())) &&
    (!filtros.status || m.status === filtros.status) &&
    (!filtros.cpf || m.cpf.includes(filtros.cpf))
  );
}

export function filtrarLojas(lojas, filtros) {
  return lojas.filter(l =>
    (!filtros.nome || l.nome.toLowerCase().includes(filtros.nome.toLowerCase())) &&
    (!filtros.cnpj || l.cnpj.includes(filtros.cnpj))
  );
}

export function filtrarJornadas(jornadas, filtros) {
  return jornadas.filter(j =>
    (!filtros.dataInicio || j.data >= filtros.dataInicio) &&
    (!filtros.dataFim || j.data <= filtros.dataFim) &&
    (!filtros.motoboyId || j.motoboyId === filtros.motoboyId) &&
    (!filtros.lojaId || j.lojaId === filtros.lojaId)
  );
} 