import { supabase } from './supabaseClient.js';

// Motoboys
export async function getMotoboys() {
  const { data, error } = await supabase
    .from('motoboys')
    .select('*')
    .order('nome');
  
  if (error) throw error;
  return data || [];
}

export async function createMotoboy(motoboy) {
  const { data, error } = await supabase
    .from('motoboys')
    .insert([{
      id: crypto.randomUUID(),
      nome: motoboy.nome,
      cpf: motoboy.cpf,
      telefone: motoboy.telefone,
      status: motoboy.status || 'ativo'
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateMotoboy(id, motoboy) {
  const { data, error } = await supabase
    .from('motoboys')
    .update({
      nome: motoboy.nome,
      cpf: motoboy.cpf,
      telefone: motoboy.telefone,
      status: motoboy.status
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteMotoboy(id) {
  const { error } = await supabase
    .from('motoboys')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Lojas
export async function getLojas() {
  const { data, error } = await supabase
    .from('lojas')
    .select('*')
    .order('nome');
  
  if (error) throw error;
  return data || [];
}

export async function createLoja(loja) {
  const { data, error } = await supabase
    .from('lojas')
    .insert([{
      id: crypto.randomUUID(),
      nome: loja.nome,
      cnpj: loja.cnpj,
      contato: loja.contato,
      valor_hora_seg_sab: loja.valorHoraSegSab || 12.00,
      valor_hora_dom_feriado: loja.valorHoraDomFeriado || 13.33,
      valor_corrida_ate_5km: loja.valorCorridaAte5km || 5.00,
      valor_corrida_acima_5km: loja.valorCorridaAcima5km || 8.00,
      taxa_administrativa: loja.taxaAdministrativa || 350.00,
      taxa_supervisao: loja.taxaSupervisao || 50.00
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateLoja(id, loja) {
  const { data, error } = await supabase
    .from('lojas')
    .update({
      nome: loja.nome,
      cnpj: loja.cnpj,
      contato: loja.contato,
      valor_hora_seg_sab: loja.valorHoraSegSab,
      valor_hora_dom_feriado: loja.valorHoraDomFeriado,
      valor_corrida_ate_5km: loja.valorCorridaAte5km,
      valor_corrida_acima_5km: loja.valorCorridaAcima5km,
      taxa_administrativa: loja.taxaAdministrativa,
      taxa_supervisao: loja.taxaSupervisao
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteLoja(id) {
  const { error } = await supabase
    .from('lojas')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Jornadas
export async function getJornadas() {
  const { data, error } = await supabase
    .from('jornadas')
    .select(`
      *,
      motoboys(nome),
      lojas(nome)
    `)
    .order('data', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createJornada(jornada) {
  const { data, error } = await supabase
    .from('jornadas')
    .insert([{
      id: crypto.randomUUID(),
      data: jornada.data,
      motoboy_id: jornada.motoboyId,
      loja_id: jornada.lojaId,
      valor_diaria: jornada.valorDiaria || 120.00,
      corridas_ate_5km: jornada.corridasAte5km || 0,
      corridas_acima_5km: jornada.corridasAcima5km || 0,
      comissoes: jornada.comissoes || 0.00,
      missoes: jornada.missoes || 0.00,
      descontos: jornada.descontos || 0.00,
      e_feriado: jornada.eFeriado || false,
      observacoes: jornada.observacoes
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateJornada(id, jornada) {
  const { data, error } = await supabase
    .from('jornadas')
    .update({
      data: jornada.data,
      motoboy_id: jornada.motoboyId,
      loja_id: jornada.lojaId,
      valor_diaria: jornada.valorDiaria,
      corridas_ate_5km: jornada.corridasAte5km,
      corridas_acima_5km: jornada.corridasAcima5km,
      comissoes: jornada.comissoes,
      missoes: jornada.missoes,
      descontos: jornada.descontos,
      e_feriado: jornada.eFeriado,
      observacoes: jornada.observacoes
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteJornada(id) {
  const { error } = await supabase
    .from('jornadas')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Adiantamentos
export async function getAdiantamentos() {
  const { data, error } = await supabase
    .from('adiantamentos')
    .select(`
      *,
      motoboys(nome),
      lojas(nome)
    `)
    .order('data', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createAdiantamento(adiantamento) {
  const { data, error } = await supabase
    .from('adiantamentos')
    .insert([{
      id: crypto.randomUUID(),
      motoboy_id: adiantamento.motoboyId,
      loja_id: adiantamento.lojaId,
      valor: adiantamento.valor,
      data: adiantamento.data,
      observacao: adiantamento.observacao
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateAdiantamento(id, adiantamento) {
  const { data, error } = await supabase
    .from('adiantamentos')
    .update({
      motoboy_id: adiantamento.motoboyId,
      loja_id: adiantamento.lojaId,
      valor: adiantamento.valor,
      data: adiantamento.data,
      observacao: adiantamento.observacao
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteAdiantamento(id) {
  const { error } = await supabase
    .from('adiantamentos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Colaboradores
export async function getColaboradores() {
  const { data, error } = await supabase
    .from('colaboradores')
    .select('*')
    .order('nome');
  
  if (error) throw error;
  return data || [];
}

export async function createColaborador(colaborador) {
  const { data, error } = await supabase
    .from('colaboradores')
    .insert([{
      id: crypto.randomUUID(),
      nome: colaborador.nome,
      email: colaborador.email,
      senha: colaborador.senha,
      tipo: colaborador.tipo,
      loja_id: colaborador.lojaId,
      ativo: colaborador.ativo !== false,
      data_criacao: new Date().toISOString().split('T')[0]
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateColaborador(id, colaborador) {
  const { data, error } = await supabase
    .from('colaboradores')
    .update({
      nome: colaborador.nome,
      email: colaborador.email,
      senha: colaborador.senha,
      tipo: colaborador.tipo,
      loja_id: colaborador.lojaId,
      ativo: colaborador.ativo
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteColaborador(id) {
  const { error } = await supabase
    .from('colaboradores')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// Débitos Pendentes
export async function getDebitosPendentes() {
  const { data, error } = await supabase
    .from('debitos_pendentes')
    .select(`
      *,
      lojas(nome)
    `)
    .order('data_vencimento');
  
  if (error) throw error;
  return data || [];
}

export async function createDebitoPendente(debito) {
  const { data, error } = await supabase
    .from('debitos_pendentes')
    .insert([{
      id: crypto.randomUUID(),
      loja_id: debito.lojaId,
      descricao: debito.descricao,
      valor: debito.valor,
      data_vencimento: debito.dataVencimento,
      status: debito.status || 'pendente',
      data_criacao: new Date().toISOString().split('T')[0]
    }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateDebitoPendente(id, debito) {
  const { data, error } = await supabase
    .from('debitos_pendentes')
    .update({
      loja_id: debito.lojaId,
      descricao: debito.descricao,
      valor: debito.valor,
      data_vencimento: debito.dataVencimento,
      status: debito.status
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteDebitoPendente(id) {
  const { error } = await supabase
    .from('debitos_pendentes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}