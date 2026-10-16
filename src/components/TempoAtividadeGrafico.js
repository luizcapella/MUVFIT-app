import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { obterMesesDinamicos, obterOpcoesTemporadas, NOMES_MESES_COMPLETOS } from '../utils/dateHelpers';

export default function TempoAtividadeGrafico({ isOpen, onClose, dadosSupabase = [], temporadasLiga = [] }) {
  const dataAtual = new Date();
  const anoAtual = dataAtual.getFullYear();

  // 🔘 CONTROLE DOS CHECKBOXES REDONDOS EXCLUSIVOS ('meses' ou 'temporada')
  const [tipoFiltroAtivo, setTipoFiltroAtivo] = useState('meses');

  // Estados dos Filtros do Período Customizado
  const [anoSelecionado, setAnoSelecionado] = useState(String(anoAtual));
  const [mesDe, setMesDe] = useState(String(dataAtual.getMonth() + 1));
  const [mesAte, setMesAte] = useState(String(dataAtual.getMonth() + 1));
  
  // Estado do Seletor de Temporadas
  const [temporadaSelecionada, setTemporadaSelecionada] = useState('atual');

  const totalTemporadasRegistradas = temporadasLiga.length > 0 ? temporadasLiga.length : 3;

  // 🔄 GATILHO INTELIGENTE: REAJUSTA OS MESES AUTOMATICAMENTE QUANDO A TEMPORADA MUDA
  useEffect(() => {
    if (tipoFiltroAtivo === 'temporada') {
      if (temporadaSelecionada === 'atual') {
        setAnoSelecionado(String(anoAtual));
        setMesDe(String(dataAtual.getMonth() + 1));
        setMesAte(String(dataAtual.getMonth() + 1));
      } else if (temporadaSelecionada === 'temp-1') {
        setAnoSelecionado(String(anoAtual));
        setMesDe('1'); setMesAte('3');
      } else if (temporadaSelecionada === 'temp-2') {
        setAnoSelecionado(String(anoAtual));
        setMesDe('4'); setMesAte('6');
      }
    }
  }, [temporadaSelecionada, tipoFiltroAtivo, anoAtual]);

  if (!isOpen) return null;

  const opcoesTemporadas = obterOpcoesTemporadas(temporadasLiga);
  // Filtragem estrita dos dados reais do Supabase com base no intervalo de tempo selecionado
  const treinosFiltrados = dadosSupabase.filter((t) => {
    if (!t.activity || !t.date || !t.duration) return false;
    
    // Filtra todas as atividades válidas (incluindo Passos se houver tempo computado)
    if (t.activity.includes('Passos Diários')) return false;

    const [anoTreino, mesTreino] = t.date.split('-');
    if (anoTreino !== anoSelecionado) return false;
    const mTreino = parseInt(mesTreino);
    return mTreino >= parseInt(mesDe) && mTreino <= parseInt(mesAte);
  });

  // Somatório bruto para o indicador numérico superior do painel (Igual ao seu modelo de 765 minutos)
  const totalMinutosGeral = treinosFiltrados.reduce((acc, t) => acc + (parseInt(t.duration) || 0), 0);

  // Mapeamento estrutural das semanas (Clean Slate para produção, começando zerado)
  const dadosSemanas = [
    { label: 'Sem. 1', minutos: 0, cor: '#3B82F6' },
    { label: 'Sem. 2', minutos: 0, cor: '#22C55E' },
    { label: 'Sem. 3', minutos: 0, cor: '#EAB308' },
    { label: 'Sem. 4', minutos: 0, cor: '#EF4444' },
  ];

  // Acumula os minutos reais dentro de cada bloco de semana
  treinosFiltrados.forEach((t) => {
    const diaTreino = new Date(t.date).getDate() || 1;
    let indexSemana = Math.floor((diaTreino - 1) / 7);
    if (indexSemana > 3) indexSemana = 3;

    dadosSemanas[indexSemana].minutos += parseInt(t.duration) || 0;
  });

  const maiorMinutoDaLista = Math.max(...dadosSemanas.map(s => s.minutos), 1);
  return (
    <Modal transparent={true} visible={isOpen} onRequestClose={onClose} animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 420, padding: 16, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20 }}>
          
          {/* CABEÇALHO */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2563EB', padding: 12, borderRadius: 8, marginBottom: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>⏱️ Tempo de Atividade</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 🔘 FILTRO 1: POR MÊS / ANO PERSONALIZADO */}
          <View style={{ backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: tipoFiltroAtivo === 'meses' ? '#F97316' : '#E2E8F0', marginBottom: 10, opacity: tipoFiltroAtivo === 'meses' ? 1 : 0.6 }}>
            <TouchableOpacity onPress={() => setTipoFiltroAtivo('meses')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#1E3A8A', justifyContent: 'center', alignItems: 'center', marginRight: 8, backgroundColor: '#FFFFFF' }}>
                {tipoFiltroAtivo === 'meses' && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F97316' }} />}
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>📆 Filtrar por Mês / Ano Personalizado:</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <select disabled={tipoFiltroAtivo !== 'meses'} value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)} style={{ flex: 1, height: '28px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: '700', color: '#334155', backgroundColor: tipoFiltroAtivo === 'meses' ? '#FFFFFF' : '#F1F5F9', outline: 'none' }}>
                <option value={String(anoAtual)}>{anoAtual}</option>
                <option value={String(anoAtual - 1)}>{anoAtual - 1}</option>
              </select>
              <select disabled={tipoFiltroAtivo !== 'meses'} value={mesDe} onChange={(e) => setMesDe(e.target.value)} style={{ flex: 1.2, height: '28px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: '600', color: '#334155', backgroundColor: tipoFiltroAtivo === 'meses' ? '#FFFFFF' : '#F1F5F9', outline: 'none' }}>
                {NOMES_MESES_COMPLETOS.map((nome, i) => <option key={`t-de-${i}`} value={String(i + 1)}>De: {nome}</option>)}
              </select>
              <select disabled={tipoFiltroAtivo !== 'meses'} value={mesAte} onChange={(e) => { if (parseInt(e.target.value) >= parseInt(mesDe)) setMesAte(e.target.value); }} style={{ flex: 1.2, height: '28px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: '600', color: '#334155', backgroundColor: tipoFiltroAtivo === 'meses' ? '#FFFFFF' : '#F1F5F9', outline: 'none' }}>
                {NOMES_MESES_COMPLETOS.map((nome, i) => <option key={`t-ate-${i}`} value={String(i + 1)} disabled={i + 1 < parseInt(mesDe)}>Até: {nome}</option>)}
              </select>
            </View>
          </View>

          {/* 🔘 FILTRO 2: POR TEMPORADA DA LIGA */}
          <View style={{ backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: tipoFiltroAtivo === 'temporada' ? '#1E3A8A' : '#E2E8F0', marginBottom: 12, opacity: tipoFiltroAtivo === 'temporada' ? 1 : 0.6 }}>
            <TouchableOpacity onPress={() => setTipoFiltroAtivo('temporada')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#1E3A8A', justifyContent: 'center', alignItems: 'center', marginRight: 8, backgroundColor: '#FFFFFF' }}>
                {tipoFiltroAtivo === 'temporada' && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#1E3A8A' }} />}
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>🏆 Filtrar por Temporada da Liga:</Text>
            </TouchableOpacity>
            <select disabled={tipoFiltroAtivo !== 'temporada'} value={temporadaSelecionada} onChange={(e) => setTemporadaSelecionada(e.target.value)} style={{ width: '100%', height: '28px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: '700', color: '#1E3A8A', backgroundColor: tipoFiltroAtivo === 'temporada' ? '#FFFFFF' : '#F1F5F9', outline: 'none' }}>
              {opcoesTemporadas.map((opt) => <option key={opt.valor} value={opt.valor}>{opt.label}</option>)}
            </select>
          </View>

          {/* BOX MODELO: INDICADOR RESUMO EM MINUTOS */}
          <View style={{ backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', padding: 8, borderRadius: 8, alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 13, color: '#1E3A8A', fontWeight: '700' }}>Tempo em atividade período atual: {totalMinutosGeral} minutos</Text>
          </View>

          {/* 📊 INTERFACE GRÁFICA: COLUNAS VERTICAIS FLATS MISTAS */}
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', textAlign: 'center', marginBottom: 6 }}>Progresso Mensal (min)</Text>
          <View style={{ height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', borderBottomWidth: 2, borderBottomColor: '#CBD5E1', paddingBottom: 2, marginBottom: 6 }}>
            {dadosSemanas.map((semana, idx) => {
              const alturaPercentual = (semana.minutos / maiorMinutoDaLista) * 100;
              return (
                <View key={`t-sem-${idx}`} style={{ alignItems: 'center', width: '20%', height: '100%', justifyContent: 'flex-end' }}>
                  {semana.minutos > 0 && (
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#1E3A8A', marginBottom: 2 }}>{semana.minutos}</Text>
                  )}
                  <View style={{
                    width: '70%',
                    height: `${semana.minutos > 0 ? alturaPercentual : 4}%`,
                    backgroundColor: semana.minutos > 0 ? semana.cor : '#E2E8F0',
                    borderRadius: 4
                  }} />
                  <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700', marginTop: 4 }}>{semana.label}</Text>
                </View>
              );
            })}
          </View>

        </View>
      </View>
    </Modal>
  );
}
