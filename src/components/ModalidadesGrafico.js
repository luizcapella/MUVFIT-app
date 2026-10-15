import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export default function ModalidadesGrafico({ isOpen, onClose, dadosSupabase = [] }) {
  const dataAtual = new Date();
  const anoAtual = dataAtual.getFullYear();

  // 🎛️ CONTROLES INTERATIVOS DO SEU PERÍODO CUSTOMIZADO
  const [anoSelecionado, setAnoSelecionado] = useState(String(anoAtual));
  const [mesDe, setMesDe] = useState(String(dataAtual.getMonth() + 1)); // Mês atual automático
  const [mesAte, setMesAte] = useState(String(dataAtual.getMonth() + 1));

  if (!isOpen) return null;

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Lista mestre com todas as 8 modalidades oficiais com seus emojis preservados
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

  // Filtragem estrita baseada nas datas reais dos treinos e no intervalo selecionado
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

  // Montagem da lista final de exibição com as 8 modalidades marcando 0% se vazio
  const distribuicaoPraticas = mapaModalidadesOficiais.map((item) => {
    const qtd = contagemModalidades[item.nome] || 0;
    const porc = totalTreinos > 0 ? Math.round((qtd / totalTreinos) * 100) : 0;
    return {
      nome: item.nome,
      porcentagem: porc,
      cor: item.cor
    };
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
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 999999999, padding: '16px', boxSizing: 'border-box'
    }}>
      {/* CORPO DO MODAL */}
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 420, padding: 16, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 15 }}>
        
        {/* CABEÇALHO */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E3A8A', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>📊 Resumo de Exercícios</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 🎛️ FILTROS INTERATIVOS COMBINADOS (MATANDO A LISTA GIGANTE) */}
        <View style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#F97316', marginBottom: 20 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#F97316', marginBottom: 6 }}>📆 Selecione o Período Customizado:</Text>
          
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {/* Filtro de Ano */}
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(e.target.value)}
              style={{ flex: 1, height: '32px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '4px', fontSize: '12px', fontWeight: '700', color: '#334155', outline: 'none', cursor: 'pointer' }}
            >
              <option value={String(anoAtual)}>{anoAtual}</option>
              <option value={String(anoAtual - 1)}>{anoAtual - 1}</option>
            </select>

            {/* Filtro Mês DE */}
            <select
              value={mesDe}
              onChange={(e) => setMesDe(e.target.value)}
              style={{ flex: 1.2, height: '32px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '4px', fontSize: '11px', fontWeight: '600', color: '#334155', outline: 'none', cursor: 'pointer' }}
            >
              {nomesMeses.map((nome, i) => (
                <option key={`de-${i}`} value={String(i + 1)}>De: {nome}</option>
              ))}
            </select>

            {/* Filtro Mês ATÉ */}
            <select
              value={mesAte}
              onChange={(e) => {
                if (parseInt(e.target.value) >= parseInt(mesDe)) {
                  setMesAte(e.target.value);
                }
              }}
              style={{ flex: 1.2, height: '32px', borderRadius: '4px', border: '1px solid #CBD5E1', padding: '4px', fontSize: '11px', fontWeight: '600', color: '#334155', outline: 'none', cursor: 'pointer' }}
            >
              {nomesMeses.map((nome, i) => (
                <option key={`ate-${i}`} value={String(i + 1)} disabled={i + 1 < parseInt(mesDe)}>
                  Até: {nome}
                </option>
              ))}
            </select>
          </View>
        </View>

        <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155', textAlign: 'center', marginBottom: 16 }}>
          Distribuição de Práticas
        </Text>

        {/* GRÁFICO PIZZA */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <div style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            backgroundImage: `conic-gradient(${gradientePizza})`,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05), 0 4px 6px -1px rgba(0,0,0,0.1)'
          }} />
        </View>

        {/* LEGENDAS COLORIDAS FIXAS COM 0% */}
        <ScrollView style={{ maxHeight: 160 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 }}>
            {distribuicaoPraticas.map((fatia, index) => (
              <View key={`leg-${index}`} style={{ flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 6 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: fatia.cor, marginRight: 6 }} />
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }} numberOfLines={1}>
                  {fatia.nome} ({fatia.porcentagem}%)
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

      </View>
    </div>
  );
}
