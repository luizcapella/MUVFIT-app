import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

export default function ModalidadeRegras({ selectedRuleTab, states }) {
  // Controle local para saber qual dropdown de tipo ("Entre" / "Acima") está aberto na linha
  const [openStepDropdownId, setOpenStepDropdownId] = useState(null);

  // Se a aba atual não for de treinos por tempo, o componente fica invisível por segurança
  if (!['Musculação', 'Crossfit', 'Aeróbico'].includes(selectedRuleTab) || !states) {
    return null;
  }

  // 🛑 Função interna isolada para gerenciar a adição de novos Steps com travas de segurança
  const handleAddStepClick = () => {
    if (states.stepsList.length >= 5) {
      alert("Você já utilizou o limite de 5 steps");
      return;
    }
    const possuiAcima = states.stepsList.some(s => s.type === 'Acima');
    if (possuiAcima) {
      alert("Você já determinou o fim dos Steps");
      return;
    }
    const novoId = states.stepsList.length > 0 ? Math.max(...states.stepsList.map(s => s.id)) + 1 : 1;
    states.setStepsList([...states.stepsList, { id: novoId, type: 'Entre', t1: '', t2: '', pts: '' }]);
  };

  return (
    <View style={{ marginTop: 16, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E3A8A', marginBottom: 12, textTransform: 'uppercase' }}>
        Regras de Pontuação: {selectedRuleTab === 'Crossfit' ? 'Crossfit / Funcional' : selectedRuleTab}
      </Text>

      {/* ITEM A: TEMPO MÍNIMO (PROPORCIONAL / SUCESSIVO) */}
      <View style={{ marginBottom: 16, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              states.setTempoMinEnabled(!states.tempoMinEnabled);
              if (!states.tempoMinEnabled) states.setStepEnabled(false); // 🔄 Dança das cadeiras: Desmarca o outro na hora
            }}
            style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: '#1E3A8A', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: states.tempoMinEnabled ? '#1E3A8A' : 'transparent' }}
          >
            {states.tempoMinEnabled && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
          </TouchableOpacity>
          <Text style={{ fontSize: 13, color: '#334155', marginLeft: 8, fontWeight: '600' }}>a. Tempo Mínimo Proporcional</Text>
        </View>

        {/* Detalhes do Item A (Só abre se estiver habilitado) */}
        {states.tempoMinEnabled && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#E2E8F0' }}>
            <TextInput
              value={states.tempoMinMinutes}
              onChangeText={states.setTempoMinMinutes}
              placeholder="Tempo (min)"
              keyboardType="numeric"
              style={{ flex: 0.45, height: 34, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 8, fontSize: 12, color: '#334155', textAlign: 'center', backgroundColor: '#FFFFFF' }}
            />
            <Text style={{ fontSize: 14, color: '#64748B', fontWeight: 'bold' }}>=</Text>
            <TextInput
              value={states.tempoMinPoints}
              onChangeText={states.setTempoMinPoints}
              placeholder="Pontos (W)"
              keyboardType="numeric"
              style={{ flex: 0.45, height: 34, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 8, fontSize: 12, color: '#334155', textAlign: 'center', backgroundColor: '#FFFFFF' }}
            />
          </View>
        )}
      </View>
      {/* ITEM B: STEP DE TEMPO (FAIXAS DE MINUTOS PROGRESSIVOS) */}
      <View style={{ backgroundColor: '#FFFFFF', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              states.setStepEnabled(!states.stepEnabled);
              if (!states.stepEnabled) states.setTempoMinEnabled(false); // 🔄 Dança das cadeiras: Desmarca o outro na hora
            }}
            style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: '#1E3A8A', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: states.stepEnabled ? '#1E3A8A' : 'transparent' }}
          >
            {states.stepEnabled && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
          </TouchableOpacity>
          <Text style={{ fontSize: 13, color: '#334155', marginLeft: 8, fontWeight: '600' }}>b. Step de Tempo Progressivo</Text>
        </View>

        {/* Detalhes do Item B (Só abre se estiver habilitado) */}
        {states.stepEnabled && (
          <View style={{ marginTop: 10, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#E2E8F0' }}>
            {states.stepsList.map((step, idx) => (
              <View key={step.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, zIndex: openStepDropdownId === step.id ? 9999 : 1 }}>
                
                {/* DROPDOWN INTERNO DA LINHA: Entre ou Acima */}
                <View style={{ width: 75, marginRight: 6, position: 'relative' }}>
                  <TouchableOpacity
                    onPress={() => setOpenStepDropdownId(openStepDropdownId === step.id ? null : step.id)}
                    style={{ height: 32, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1E3A8A' }}>{step.type}</Text>
                  </TouchableOpacity>
                  {openStepDropdownId === step.id && (
                    <View style={{ position: 'absolute', top: 34, left: 0, width: 75, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, elevation: 4, zIndex: 99999 }}>
                      {['Entre', 'Acima'].map((op) => (
                        <TouchableOpacity
                          key={op}
                          onPress={() => {
                            const updated = [...states.stepsList];
                            updated[idx].type = op;
                            if (op === 'Acima') updated[idx].t2 = ''; // Limpa t2 imediatamente se fechar a faixa
                            states.setStepsList(updated);
                            setOpenStepDropdownId(null);
                          }}
                          style={{ paddingVertical: 6, alignItems: 'center', backgroundColor: step.type === op ? '#F0F5FF' : 'transparent' }}
                        >
                          <Text style={{ fontSize: 11, color: '#334155', fontWeight: step.type === op ? '700' : '400' }}>{op}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* CAIXA DE MINUTOS 1 */}
                <TextInput
                  value={step.t1}
                  onChangeText={(v) => { const u = [...states.stepsList]; u[idx].t1 = v; states.setStepsList(u); }}
                  placeholder="Min"
                  keyboardType="numeric"
                  style={{ width: 45, height: 32, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, textAlign: 'center', fontSize: 11, marginRight: 4, backgroundColor: '#FFFFFF', color: '#334155' }}
                />

                {/* CAIXA CONDICIONAL DE MINUTOS 2 (SÓ ABRE SE FOR "Entre") */}
                {step.type === 'Entre' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#64748B', marginRight: 4 }}>e</Text>
                    <TextInput
                      value={step.t2}
                      onChangeText={(v) => { const u = [...states.stepsList]; u[idx].t2 = v; states.setStepsList(u); }}
                      placeholder="Min"
                      keyboardType="numeric"
                      style={{ width: 45, height: 32, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, textAlign: 'center', fontSize: 11, marginRight: 4, backgroundColor: '#FFFFFF', color: '#334155' }}
                    />
                  </View>
                )}

                <Text style={{ fontSize: 11, color: '#64748B', marginRight: 4 }}>=</Text>

                {/* CAIXA DE PONTOS DA FAIXA */}
                <TextInput
                  value={step.pts}
                  onChangeText={(v) => { const u = [...states.stepsList]; u[idx].pts = v; states.setStepsList(u); }}
                  placeholder="Pontos"
                  keyboardType="numeric"
                  style={{ flex: 1, height: 32, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, textAlign: 'center', fontSize: 11, backgroundColor: '#FFFFFF', color: '#334155' }}
                />

                {/* BOTÃO REMOVER LINHA DE STEP */}
                <TouchableOpacity
                  onPress={() => states.setStepsList(states.stepsList.filter(s => s.id !== step.id))}
                  style={{ marginLeft: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginTop: -2 }}>×</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* BOTÃO DINÂMICO DE ADIÇÃO DE STEP */}
            <TouchableOpacity
              onPress={handleAddStepClick}
              style={{ backgroundColor: '#1E3A8A', paddingVertical: 8, borderRadius: 4, alignItems: 'center', marginTop: 6 }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>+ Add Step</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

    </View>
  );
}
