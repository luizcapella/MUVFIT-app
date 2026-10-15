import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export default function ModalidadesGrafico({ isOpen, onClose }) {
  if (!isOpen) return null;

  // Dados estáticos temporários (Esqueleto visual idêntico ao seu print de exemplo)
  // Serão substituídos futuramente pelos dados reais vindos do Supabase
  const distribuicaoPraticas = [
    { nome: 'Musculação', porcentagem: 25, cor: '#3B82F6', emoji: '💪' },
    { nome: 'Crossfit/Funcional', porcentagem: 18, cor: '#22C55E', emoji: '🏋️' },
    { nome: 'Aeróbico', porcentagem: 12, cor: '#EAB308', emoji: '🔥' },
    { nome: 'Corrida', porcentagem: 15, cor: '#EF4444', emoji: '🏃' },
    { nome: 'Caminhada', porcentagem: 10, cor: '#F97316', emoji: '🚶' },
    { nome: 'Bike', porcentagem: 8, cor: '#A855F7', emoji: '🚴' },
    { nome: 'Lutas/Individuais', porcentagem: 7, cor: '#0D9488', emoji: '🥋' },
    { nome: 'Esportes Coletivos', porcentagem: 5, cor: '#78350F', emoji: '⚽' },
  ];

  // Engenharia CSS para gerar o gráfico de pizza web usando conic-gradient baseado nas fatias
  let acumulado = 0;
  const gradientePizza = distribuicaoPraticas.map((fatia) => {
    const inicio = acumulado;
    acumulado += fatia.porcentagem;
    return `${fatia.cor} ${inicio}% ${acumulado}%`;
  }).join(', ');

  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: 16
    }}>
      {/* CORPO DO MODAL FLUTUANTE */}
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 420, padding: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10 }}>
        
        {/* CABEÇALHO COM BOTÃO FECHAR X */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2563EB', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>Resumo de Exercícios</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 1. SELETOR DE PERÍODO DESIGN MODELO */}
        <View style={{ borderWidth: 1, borderColor: '#F97316', borderRadius: 8, padding: 8, position: 'relative', marginBottom: 20 }}>
          <Text style={{ position: 'absolute', top: -8, left: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 4, fontSize: 10, color: '#F97316', fontWeight: '700' }}>
            Selecione o Período
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
            <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600' }}>📅 Período: Atual da Liga</Text>
            <Text style={{ fontSize: 10, color: '#F97316' }}>▼</Text>
          </View>
        </View>

        <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155', textAlign: 'center', marginBottom: 16 }}>
          Distribuição de Práticas
        </Text>

        {/* 2. O GRÁFICO PIZZA EM FORMATO WEB CSS */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <div style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            backgroundImage: `conic-gradient(${gradientePizza})`,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }} />
        </View>

        {/* 3. LEGENDAS COLORIDAS EM EM PAR (2 COLUNAS) */}
        <ScrollView style={{ maxHeight: 150 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 }}>
            {distribuicaoPraticas.map((fatia, index) => (
              <View key={`leg-${index}`} style={{ flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: fatia.cor, marginRight: 6 }} />
                <Text style={{ fontSize: 11, color: '#475569', fontWeight: '600' }} numberOfLines={1}>
                  {fatia.emoji} {fatia.nome} ({fatia.porcentagem}%)
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

      </View>
    </View>
  );
}
