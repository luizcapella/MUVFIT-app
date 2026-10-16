import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';

export default function ModalidadesGrafico({ isOpen, onClose, dadosSupabase = [], temporadasLiga = [] }) {
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

  // 🔄 GATILHO INTELIGENTE: REAJUSTA OS MESES QUANDO A TEMPORADA É ALTERADA
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

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const opcoesTemporadas = [];
  for (let i = 1; i <= totalTemporadasRegistradas; i++) {
    if (i === totalTemporadasRegistradas) {
      opcoesTemporadas.push({ valor: 'atual', label: `🏆 Temporada Atual (${i}ª Temporada)` });
    } else {
      opcoesTemporadas.push({ valor: `temp-${i}`, label: `📜 ${i}ª Temporada (Histórico)` });
    }
  }

  const mapaModalidadesOficiais = [
    { nome: '💪 Musculação', cor: '#3B82F6' },
    { nome: '🏋️ Crossfit/Funcional', cor: '#22C55E' },
    { nome: '🔥 Aeróbico', cor: '#EAB308' },
    { nome: '🏃 Corrida', cor: '#EF4444' },
    { nome: '🚶 Caminhada', cor: '#F97316' },
    { nome: '🚴 Bike', cor: '#A855F7' },
    { nome: '🥋 Lutas/Individuais', cor: '#0D9488' },
    { nome: '⚽ Esportes Coletivos', cor: '#78350F' }
  ];

  const treinosValidos = dadosSupabase.filter((t) => {
    if (!t.activity || t.activity.includes('Passos Diários') || !t.date) return false;
    const [anoTreino, mesTreino] = t.date.split('-');
    if (anoTreino !== anoSelecionado) return false;
    const mTreino = parseInt(mesTreino);
    return mTreino >= parseInt(mesDe) && mTreino <= parseInt(mesAte);
  });

  const totalTreinos = treinosValidos.length;
  const contagemModalidades = {};

  treinosValidos.forEach((t) => {
    const nomeModalidade = t.activity ? t.activity.trim() : '';
    if (nomeModalidade) {
      contagemModalidades[nomeModalidade] = (contagemModalidades[nomeModalidade] || 0) + 1;
    }
  });

  const distribuicaoPraticas = mapaModalidadesOficiais.map((item) => {
    const qtd = contagemModalidades[item.nome] || 0;
    const porc = totalTreinos > 0 ? Math.round((qtd / totalTreinos) * 100) : 0;
    return { nome: item.nome, porcentagem: porc, cor: item.cor };
  });

  let gradientePizza = '#CBD5E1 0% 100%';
  if (totalTreinos > 0) {
    let acumulado = 0;
    gradientePizza = distribuicaoPraticas
      .filter(f => f.porcentagem > 0)
      .map((fatia) => {
        const inicio = acumulado;
        acumulado += fatia.porcentagem;
        return `${fatia.cor} ${inicio}% ${acumulado}%`;
      }).join(', ');
  }
  return (
    <Modal
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
      animationType="fade"
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16
      }}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 420, padding: 16, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20 }}>
          
          {/* CABEÇALHO */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E3A8A', padding: 12, borderRadius: 8, marginBottom: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>📊 Resumo de Exercícios</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 🔘 FILTRO 1: POR MÊS / ANO PERSONALIZADO */}
          <View style={{ backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: tipoFiltroAtivo === 'meses' ? '#F97316' : '#E2E8F0', marginBottom: 10, opacity: tipoFiltroAtivo === 'meses' ? 1 : 0.6 }}>
            <TouchableOpacity onPress={() => setTipoFiltroAtivo('meses')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#1E3A8A', justifyContent: 'center', alignItems: 'center', marginRight: 8, backgroundColor: '#FFFFFF' }}>
                {tipoFiltroAtivo === 'meses' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F97316' }} />}
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>📆 Filtrar por Mês / Ano Personalizado:</Text>
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <select disabled={tipoFiltroAtivo !== 'meses'} value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)} style={{ flex: 1, height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px', fontWeight: '700', color: '#334155', outline: 'none', backgroundColor: tipoFiltroAtivo === 'meses' ? '#FFFFFF' : '#F1F5F9' }}>
                <option value={String(anoAtual)}>{anoAtual}</option>
                <option value={String(anoAtual - 1)}>{anoAtual - 1}</option>
              </select>
              <select disabled={tipoFiltroAtivo !== 'meses'} value={mesDe} onChange={(e) => setMesDe(e.target.value)} style={{ flex: 1.2, height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: '600', color: '#334155', outline: 'none', backgroundColor: tipoFiltroAtivo === 'meses' ? '#FFFFFF' : '#F1F5F9' }}>
                {nomesMeses.map((nome, i) => <option key={`de-${i}`} value={String(i + 1)}>De: {nome}</option>)}
              </select>
              <select disabled={tipoFiltroAtivo !== 'meses'} value={mesAte} onChange={(e) => { if (parseInt(e.target.value) >= parseInt(mesDe)) setMesAte(e.target.value); }} style={{ flex: 1.2, height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '11px', fontWeight: '600', color: '#334155', outline: 'none', backgroundColor: tipoFiltroAtivo === 'meses' ? '#FFFFFF' : '#F1F5F9' }}>
                {nomesMeses.map((nome, i) => <option key={`ate-${i}`} value={String(i + 1)} disabled={i + 1 < parseInt(mesDe)}>Até: {nome}</option>)}
              </select>
            </View>
          </View>

          {/* 🔘 FILTRO 2: POR TEMPORADA DA LIGA */}
          <View style={{ backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: tipoFiltroAtivo === 'temporada' ? '#1E3A8A' : '#E2E8F0', marginBottom: 14, opacity: tipoFiltroAtivo === 'temporada' ? 1 : 0.6 }}>
            <TouchableOpacity onPress={() => setTipoFiltroAtivo('temporada')} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#1E3A8A', justifyContent: 'center', alignItems: 'center', marginRight: 8, backgroundColor: '#FFFFFF' }}>
                {tipoFiltroAtivo === 'temporada' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E3A8A' }} />}
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>🏆 Filtrar por Temporada da Liga:</Text>
            </TouchableOpacity>

            <select
              disabled={tipoFiltroAtivo !== 'temporada'}
              value={temporadaSelecionada}
              onChange={(e) => setTemporadaSelecionada(e.target.value)}
              style={{ width: '100%', height: '30px', borderRadius: '4px', border: '1px solid #CBD5E1', paddingHorizontal: '6px', fontSize: '12px', fontWeight: '700', color: '#1E3A8A', backgroundColor: tipoFiltroAtivo === 'temporada' ? '#FFFFFF' : '#F1F5F9', outline: 'none', cursor: tipoFiltroAtivo === 'temporada' ? 'pointer' : 'default' }}
            >
              {opcoesTemporadas.map((opt) => (
                <option key={opt.valor} value={opt.valor}>{opt.label}</option>
              ))}
            </select>
          </View>

          <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', textAlign: 'center', marginBottom: 12 }}>
            Distribuição de Práticas
          </Text>

          {/* PIZZA */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <div style={{
              width: '160px', height: '160px', borderRadius: '50%',
              backgroundImage: `conic-gradient(${gradientePizza})`,
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05), 0 4px 6px -1px rgba(0,0,0,0.1)'
            }} />
          </View>

          {/* LEGENDAS COLORIDAS */}
          <ScrollView style={{ maxHeight: 140 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4 }}>
              {distribuicaoPraticas.map((fatia, index) => (
                <View key={`leg-${index}`} style={{ flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: fatia.cor, marginRight: 6 }} />
                  <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }} numberOfLines={1}>
                    {fatia.nome} ({fatia.porcentagem}%)
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}
