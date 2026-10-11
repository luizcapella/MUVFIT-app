import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

export default function ModalidadeRegrasTempo({ selectedRuleTab, states }) {
  
  // Trava de Segurança: Se a aba atual não pertencer a Lutas ou Coletivos, o componente fica invisível
  if (!['Lutas', 'Esportes Coletivos'].includes(selectedRuleTab) || !states) {
    return null;
  }

  return (
    <View style={{ marginTop: 16, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E3A8A', marginBottom: 12, textTransform: 'uppercase' }}>
        Regras de Pontuação: {selectedRuleTab === 'Lutas' ? 'Lutas / Esportes Individuais' : selectedRuleTab}
      </Text>

      {/* ⏱️ ITEM A: TEMPO MÍNIMO PROPORCIONAL */}
      <View style={{ backgroundColor: '#FFFFFF', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => states.setTempoMinEnabled(!states.tempoMinEnabled)}
            style={{ 
              width: 18, 
              height: 18, 
              borderWidth: 1.5, 
              borderColor: '#1E3A8A', 
              borderRadius: 4, 
              justifyContent: 'center', 
              alignItems: 'center', 
              backgroundColor: states.tempoMinEnabled ? '#1E3A8A' : 'transparent' 
            }}
          >
            {states.tempoMinEnabled && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
          </TouchableOpacity>
          <Text style={{ fontSize: 13, color: '#334155', marginLeft: 8, fontWeight: '600' }}>
            a. Por Tempo Mínimo Proporcional
          </Text>
        </View>

        {/* Detalhamento das caixas numéricas (Só se expande se a caixinha estiver marcada) */}
        {states.tempoMinEnabled && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginTop: 10, 
            paddingTop: 6, 
            borderTopWidth: 0.5, 
            borderTopColor: '#E2E8F0' 
          }}>
            <TextInput
              value={states.tempoMinMinutes}
              onChangeText={states.setTempoMinMinutes}
              placeholder="Tempo (min)"
              keyboardType="numeric"
              style={{ flex: 0.45, height: 34, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 8, fontSize: 12, textAlign: 'center', backgroundColor: '#FFFFFF', color: '#334155' }}
            />
            <Text style={{ fontSize: 14, color: '#64748B', fontWeight: 'bold' }}>=</Text>
            <TextInput
              value={states.tempoMinPoints}
              onChangeText={states.setTempoMinPoints}
              placeholder="Pontos"
              keyboardType="numeric"
              style={{ flex: 0.45, height: 34, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 8, fontSize: 12, textAlign: 'center', backgroundColor: '#FFFFFF', color: '#334155' }}
            />
          </View>
        )}
      </View>
    </View>
  );
}
