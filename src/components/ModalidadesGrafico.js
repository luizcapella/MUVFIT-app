import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export default function ModalidadesGrafico({ isOpen, onClose, dadosSupabase = [] }) {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('atual');

  if (!isOpen) return null;

  // Filtragem estrita: Remove 'Passos Diários' e garante apenas modalidades válidas
  const treinosValidos = dadosSupabase.filter(
    t => t.activity && !t.activity.includes('Passos Diários')
  );

  // Agrupamento real de dados (Começa completamente zerado e limpo!)
  const totalTreinos = treinosValidos.length;
  const contagemModalidades = {};

   // Mapeamento dinâmico contendo todas as 8 modalidades oficiais com os emojis mantidos
  const mapaCores = {
    '💪 Musculação': '#3B82F6',
    '🏋️ Crossfit/Funcional': '#22C55E',
    '🔥 Aeróbico': '#EAB308',
    '🏃 Corrida': '#EF4444',
    '🚶 Caminhada': '#F97316',
    '🚴 Bike': '#A855F7',
    '🥋 Lutas/Individuais': '#0D9488',
    '⚽ Esportes Coletivos': '#78350F',
  };

  treinosValidos.forEach((t) => {
    const nomeModalidade = t.activity ? t.activity.trim() : '';
    if (nomeModalidade) {
      contagemModalidades[nomeModalidade] = (contagemModalidades[nomeModalidade] || 0) + 1;
    }
  });

  const distribuicaoPraticas = Object.keys(contagemModalidades).map((nome) => {
    const qtd = contagemModalidades[nome];
    const porc = totalTreinos > 0 ? Math.round((qtd / totalTreinos) * 100) : 0;
    return {
      nome,
      porcentagem: porc,
      cor: mapaCores[nome] || '#64748B'
    };
  });

  // Geração da Pizza Dinâmica: Se estiver vazio, exibe o círculo cinza de espera
  let gradientePizza = '#CBD5E1 0% 100%';
  if (totalTreinos > 0) {
    let acumulado = 0;
    gradientePizza = distribuicaoPraticas.map((fatia) => {
      const inicio = acumulado;
      acumulado += fatia.porcentagem;
      return `${fatia.cor} ${inicio}% ${acumulado}%`;
    }).join(', ');
  }

  return (
    <View style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', 
      zIndex: 999999, padding: 16 // zIndex ultra elevado para cobrir as barras azuis nativas
    }}>
      {/* CORPO DO MODAL */}
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 420, padding: 16, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12 }}>
        
        {/* CABEÇALHO */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E3A8A', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>📊 Resumo de Exercícios</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 1. SELETOR DE PERÍODO FUNCIONAL E CLICÁVEL */}
        <View style={{ borderWidth: 1, borderColor: '#F97316', borderRadius: 8, padding: 4, marginBottom: 20, backgroundColor: '#FFFFFF' }}>
          <Text style={{ position: 'absolute', top: -8, left: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 4, fontSize: 10, color: '#F97316', fontWeight: '700', zIndex: 10 }}>
            Selecione o Período
          </Text>
          <select
            value={periodoSelecionado}
            onChange={(e) => setPeriodoSelecionado(e.target.value)}
            style={{ width: '100%', border: 'none', backgroundColor: 'transparent', padding: '6px', fontSize: '13px', fontWeight: '600', color: '#334155', outline: 'none', cursor: 'pointer' }}
          >
            <option value="atual">📅 Período: Atual da Liga</option>
            <option value="anterior">📅 Período: Liga Anterior</option>
            <option value="historico">📅 Histórico Completo</option>
          </select>
        </View>

        <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155', textAlign: 'center', marginBottom: 16 }}>
          Distribuição de Práticas
        </Text>

        {/* 2. O GRÁFICO PIZZA SE ADAPTA SE ESTIVER VAZIO */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <div style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            backgroundImage: `conic-gradient(${gradientePizza})`,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05), 0 4px 6px -1px rgba(0,0,0,0.1)'
          }} />
        </View>

        {/* 3. LEGENDAS TOTALMENTE LIMPAS E REAIS */}
        <ScrollView style={{ maxHeight: 150 }}>
          {totalTreinos === 0 ? (
            <Text style={{ padding: 12, fontSize: 13, color: '#64748B', textAlign: 'center', fontStyle: 'italic' }}>
              Nenhum registro de treino efetuado neste período. 🏋️
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 }}>
              {distribuicaoPraticas.map((fatia, index) => (
                <View key={`leg-${index}`} style={{ flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: fatia.cor, marginRight: 6 }} />
                  <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600' }} numberOfLines={1}>
                    {fatia.nome} ({fatia.porcentagem}%)
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

      </View>
    </View>
  );
}
