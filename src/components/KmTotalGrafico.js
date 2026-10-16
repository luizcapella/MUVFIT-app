import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { obterMesesDinamicos, obterOpcoesTemporadas, NOMES_MESES_COMPLETOS } from '../utils/dateHelpers';

export default function KmTotalGrafico({ isOpen, onClose, dadosSupabase = [], temporadasLiga = [] }) {
  const dataAtual = new Date();
  const anoAtual = dataAtual.getFullYear();

  // 🔘 CONTROLE DOS CHECKBOXES REDONDOS EXCLUSIVOS ('meses' ou 'temporada')
  const [tipoFiltroAtivo, setTipoFiltroAtivo] = useState('meses');

  // 🎛️ FILTRO SUPERIOR DE ATIVIDADES INDIVIDUALIZADAS
  const [atividadeSelecionada, setAtividadeSelecionada] = useState('Todos');

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
        setMesDe('1'); setMesAte('3'); // Sincroniza Janeiro a Março
      } else if (temporadaSelecionada === 'temp-2') {
        setAnoSelecionado(String(anoAtual));
        setMesDe('4'); setMesAte('6'); // Sincroniza Abril a Junho
      }
    }
  }, [temporadaSelecionada, tipoFiltroAtivo, anoAtual]);

  if (!isOpen) return null;

  const opcoesTemporadas = obterOpcoesTemporadas(temporadasLiga);
  // Filtragem estrita dos dados reais do Supabase com base no intervalo de tempo selecionado
  const treinosFiltrados = dadosSupabase.filter((t) => {
    if (!t.activity || !t.date || !t.km_distance) return false;
    
    // Filtra por modalidade caso o usuário escolha individualizar no dropdown
    if (atividadeSelecionada !== 'Todos' && !t.activity.includes(atividadeSelecionada)) return false;
    
    // Garante que apenas Corrida, Caminhada e Bike entrem no somatório de distância
    const eKmValido = t.activity.includes('Corrida') || t.activity.includes('Caminhada') || t.activity.includes('Bike');
    if (!eKmValido) return false;

    const [anoTreino, mesTreino] = t.date.split('-');
    if (anoTreino !== anoSelecionado) return false;
    const mTreino = parseInt(mesTreino);
    return mTreino >= parseInt(mesDe) && mTreino <= parseInt(mesAte);
  });

  // Somatório bruto para o indicador numérico do painel
  const totalKmGeral = treinosFiltrados.reduce((acc, t) => acc + (parseFloat(t.km_distance) || 0), 0);

  // Mapeamento de dados estruturais das semanas. Começa em 0% (Clean Slate para produção)
  const dadosSemanas = [
    { label: 'Sem. 1', corrida: 0, caminhada: 0, bike: 0 },
    { label: 'Sem. 2', corrida: 0, caminhada: 0, bike: 0 },
    { label: 'Sem. 3', corrida: 0, caminhada: 0, bike: 0 },
    { label: 'Sem. 4', corrida: 0, caminhada: 0, bike: 0 },
  ];

  // Varre os treinos reais para empilhar os KMs nas colunas paralelas corretas
  treinosFiltrados.forEach((t) => {
    const diaTreino = new Date(t.date).getDate() || 1;
    let indexSemana = Math.floor((diaTreino - 1) / 7);
    if (indexSemana > 3) indexSemana = 3;

    const km = parseFloat(t.km_distance) || 0;
    if (t.activity.includes('Corrida')) dadosSemanas[indexSemana].corrida += km;
    if (t.activity.includes('Caminhada')) dadosSemanas[indexSemana].caminhada += km;
    if (t.activity.includes('Bike')) dadosSemanas[indexSemana].bike += km;
  });

  const obterMaiorKm = () => {
    let maior = 1;
    dadosSemanas.forEach(s => {
      if (s.corrida > maior) maior = s.corrida;
      if (s.caminhada > maior) maior = s.caminhada;
      if (s.bike > maior) maior = s.bike;
    });
    return maior;
  };
  const tetoMaximoKm = obterMaiorKm();
  return (
    <Modal transparent={true} visible={isOpen} onRequestClose={onClose} animationType="fade">
      <View style={{
        flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 16
      }}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 420, padding: 16, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20 }}>
          
          {/* CABEÇALHO */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F97316', padding: 12, borderRadius: 8, marginBottom: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>🏃 Distância Percorrida (KM)</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 🎛️ SELETOR DE ATIVIDADE INDIVIDUALIZADA */}
          <View style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 4, marginBottom: 12, backgroundColor: '#FFFFFF' }}>
            <select
              value={atividadeSelecionada}
              onChange={(e) => setAtividadeSelecionada(e.target.value)}
              style={{ width: '100%', border: 'none', backgroundColor: 'transparent', fontSize: '13px', fontWeight: '700', color: '#1E3A8A', outline: 'none', cursor: 'pointer' }}
            >
              <option value="Todos">👥 Filtrar Atividade: Todos</option>
              <option value="Corrida">🏃 Somente Corrida</option>
              <option value="Caminhada">🚶 Somente Caminhada</option>
              <option value="Bike">🚴 Somente Bike</option>
            </select>
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
                {NOMES_MESES_COMPLETOS.map((nome, i) => <option key={`km-de-${i}`} value={String(i + 1)}>De: {nome}</option>)}
              </select>
              <select disabled={tipoFiltroAtivo !== 'meses'} value={mesAte} onChange={(e) => { if (parseInt(e.target.value) >= parseInt(mesDe)) setMesAte(e.target.value); }} style={{ flex: 1.2, height: '28px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: '600', color: '#334155', backgroundColor: tipoFiltroAtivo === 'meses' ? '#FFFFFF' : '#F1F5F9', outline: 'none' }}>
                {NOMES_MESES_COMPLETOS.map((nome, i) => <option key={`km-ate-${i}`} value={String(i + 1)} disabled={i + 1 < parseInt(mesDe)}>Até: {nome}</option>)}
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

          {/* INDICADOR RESUMO ACUMULADO */}
          <View style={{ backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#FFEDD5', padding: 6, borderRadius: 6, alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 18, color: '#EA580C', fontWeight: '800' }}>{totalKmGeral.toFixed(1)} KM</Text>
          </View>

          {/* 📊 GRÁFICO DE COLUNAS PARALELAS FLATS NATIVAS */}
          <View style={{ height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', borderBottomWidth: 2, borderBottomColor: '#64748B', paddingBottom: 2, marginBottom: 14 }}>
            {dadosSemanas.map((semana, idx) => (
              <View key={`sem-${idx}`} style={{ alignItems: 'center', width: '22%', height: '100%', justifyContent: 'flex-end' }}>
                
                {/* Fileira Tripla de Barras Nativas */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: '85%', width: '100%', justifyContent: 'center' }}>
                  {(atividadeSelecionada === 'Todos' || atividadeSelecionada === 'Corrida') && (
                    <View style={{ width: 6, height: `${semana.corrida > 0 ? (semana.corrida / tetoMaximoKm) * 100 : 4}%`, backgroundColor: '#EF4444', borderRadius: 2 }} />
                  )}
                  {(atividadeSelecionada === 'Todos' || atividadeSelecionada === 'Caminhada') && (
                    <View style={{ width: 6, height: `${semana.caminhada > 0 ? (semana.caminhada / tetoMaximoKm) * 100 : 4}%`, backgroundColor: '#F97316', borderRadius: 2 }} />
                  )}
                  {(atividadeSelecionada === 'Todos' || activitySeleccionada === 'Bike' || atividadeSelecionada === 'Bike') && (
                    <View style={{ width: 6, height: `${semana.bike > 0 ? (semana.bike / tetoMaximoKm) * 100 : 4}%`, backgroundColor: '#A855F7', borderRadius: 2 }} />
                  )}
                </View>
                
                <Text style={{ fontSize: 10, color: '#64748B', fontWeight: '700', marginTop: 4 }}>{semana.label}</Text>
              </View>
            ))}
          </View>

          {/* CAPTION COLOR COMPACTA */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 8, height: 8, backgroundColor: '#EF4444', borderRadius: 2, marginRight: 4 }} /><Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>Corrida</Text></View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 8, height: 8, backgroundColor: '#F97316', borderRadius: 2, marginRight: 4 }} /><Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>Caminhada</Text></View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ width: 8, height: 8, backgroundColor: '#A855F7', borderRadius: 2, marginRight: 4 }} /><Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>Bike</Text></View>
          </View>

        </View>
      </View>
    </Modal>
  );
}
