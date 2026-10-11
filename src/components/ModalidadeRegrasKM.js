import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

export default function ModalidadeRegrasKM({ selectedRuleTab, states }) {
  // Controle local para os dropdowns de tipo ("Entre" / "Acima") das duas seções de Steps
  const [openTimeDropdownId, setOpenTimeDropdownId] = useState(null);
  const [openKmDropdownId, setOpenKmDropdownId] = useState(null);

  // Se a aba selecionada atual não for de KM, o componente fica invisível por segurança
  if (!['Corrida', 'Caminhada', 'Bike'].includes(selectedRuleTab) || !states) {
    return null;
  }

  // 🛑 Trava de Segurança: Adicionar Step de Tempo (Item B)
  const handleAddStepTime = () => {
    if (states.timeStepsList.length >= 5) {
      alert("Você já utilizou o limite de 5 steps");
      return;
    }
    if (states.timeStepsList.some(s => s.type === 'Acima')) {
      alert("Você já determinou o fim dos Steps");
      return;
    }
    const novoId = states.timeStepsList.length > 0 ? Math.max(...states.timeStepsList.map(s => s.id)) + 1 : 1;
    states.setTimeStepsList([...states.timeStepsList, { id: novoId, type: 'Entre', t1: '', t2: '', pts: '' }]);
  };

  // 🛑 Trava de Segurança: Adicionar Step de KM (Item D)
  const handleAddStepKm = () => {
    if (states.kmStepsList.length >= 5) {
      alert("Você já utilizou o limite de 5 steps");
      return;
    }
    if (states.kmStepsList.some(s => s.type === 'Acima')) {
      alert("Você já determinou o fim dos Steps");
      return;
    }
    const novoId = states.kmStepsList.length > 0 ? Math.max(...states.kmStepsList.map(s => s.id)) + 1 : 1;
    states.setKmStepsList([...states.kmStepsList, { id: novoId, type: 'Entre', k1: '', k2: '', pts: '' }]);
  };

  return (
    <View style={{ marginTop: 16, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E3A8A', marginBottom: 12, textTransform: 'uppercase' }}>
        Regras de Pontuação: {selectedRuleTab}
      </Text>

      {/* ⏱️ ITEM A: TEMPO MÍNIMO PROPORCIONAL */}
      <View style={{ marginBottom: 12, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              states.setTempoMinEnabled(!states.tempoMinEnabled);
              if (!states.tempoMinEnabled) {
                states.setStepTempoEnabled(false); states.setKmMinEnabled(false); states.setStepKmEnabled(false);
              }
            }}
            style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: '#1E3A8A', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: states.tempoMinEnabled ? '#1E3A8A' : 'transparent' }}
          >
            {states.tempoMinEnabled && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
          </TouchableOpacity>
          <Text style={{ fontSize: 13, color: '#334155', marginLeft: 8, fontWeight: '600' }}>a. Por Tempo Mínimo Proporcional</Text>
        </View>
        {states.tempoMinEnabled && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#E2E8F0' }}>
            <TextInput value={states.tempoMinMinutes} onChangeText={states.setTempoMinMinutes} placeholder="Tempo (min)" keyboardType="numeric" style={{ flex: 0.45, height: 34, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 8, fontSize: 12, textAlign: 'center', backgroundColor: '#FFFFFF', color: '#334155' }} />
            <Text style={{ fontSize: 14, color: '#64748B', fontWeight: 'bold' }}>=</Text>
            <TextInput value={states.tempoMinPoints} onChangeText={states.setTempoMinPoints} placeholder="Pontos" keyboardType="numeric" style={{ flex: 0.45, height: 34, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 8, fontSize: 12, textAlign: 'center', backgroundColor: '#FFFFFF', color: '#334155' }} />
          </View>
        )}
      </View>

      {/* 📊 ITEM B: STEP PROGRESSIVO DE TEMPO */}
      <View style={{ marginBottom: 12, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              states.setStepTempoEnabled(!states.stepTempoEnabled);
              if (!states.stepTempoEnabled) {
                states.setTempoMinEnabled(false); states.setKmMinEnabled(false); states.setStepKmEnabled(false);
              }
            }}
            style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: '#1E3A8A', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: states.stepTempoEnabled ? '#1E3A8A' : 'transparent' }}
          >
            {states.stepTempoEnabled && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
          </TouchableOpacity>
          <Text style={{ fontSize: 13, color: '#334155', marginLeft: 8, fontWeight: '600' }}>b. Por Step Progressivo de Tempo</Text>
        </View>
        {states.stepTempoEnabled && (
          <View style={{ marginTop: 10, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#E2E8F0' }}>
            {states.timeStepsList.map((step, idx) => (
              <View key={step.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, zIndex: openTimeDropdownId === step.id ? 9999 : 1 }}>
                <View style={{ width: 75, marginRight: 6, position: 'relative' }}>
                  <TouchableOpacity onPress={() => setOpenTimeDropdownId(openTimeDropdownId === step.id ? null : step.id)} style={{ height: 32, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1E3A8A' }}>{step.type}</Text></TouchableOpacity>
                  {openTimeDropdownId === step.id && (
                    <View style={{ position: 'absolute', top: 34, left: 0, width: 75, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, elevation: 4, zIndex: 99999 }}>
                      {['Entre', 'Acima'].map((op) => (
                        <TouchableOpacity key={op} onPress={() => { const u = [...states.timeStepsList]; u[idx].type = op; if (op === 'Acima') u[idx].t2 = ''; states.setTimeStepsList(u); setOpenTimeDropdownId(null); }} style={{ paddingVertical: 6, alignItems: 'center' }}><Text style={{ fontSize: 11, color: '#334155' }}>{op}</Text></TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <TextInput value={step.t1} onChangeText={(v) => { const u = [...states.timeStepsList]; u[idx].t1 = v; states.setTimeStepsList(u); }} placeholder="Min" keyboardType="numeric" style={{ width: 42, height: 32, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, textAlign: 'center', fontSize: 11, marginRight: 4, backgroundColor: '#FFFFFF' }} />
                {step.type === 'Entre' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#64748B', marginRight: 4 }}>e</Text>
                    <TextInput value={step.t2} onChangeText={(v) => { const u = [...states.timeStepsList]; u[idx].t2 = v; states.setTimeStepsList(u); }} placeholder="Min" keyboardType="numeric" style={{ width: 42, height: 32, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, textAlign: 'center', fontSize: 11, marginRight: 4, backgroundColor: '#FFFFFF' }} />
                  </View>
                )}
                <Text style={{ fontSize: 11, color: '#64748B', marginRight: 4 }}>=</Text>
                <TextInput value={step.pts} onChangeText={(v) => { const u = [...states.timeStepsList]; u[idx].pts = v; states.setTimeStepsList(u); }} placeholder="Pts" keyboardType="numeric" style={{ flex: 1, height: 32, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, textAlign: 'center', fontSize: 11, backgroundColor: '#FFFFFF' }} />
                <TouchableOpacity onPress={() => states.setTimeStepsList(states.timeStepsList.filter(s => s.id !== step.id))} style={{ marginLeft: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', marginTop: -2 }}>×</Text></TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={handleAddStepTime} style={{ backgroundColor: '#1E3A8A', paddingVertical: 6, borderRadius: 4, alignItems: 'center', marginTop: 4 }}><Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>+ Add Step Tempo</Text></TouchableOpacity>
          </View>
        )}
      </View>
      {/* 📏 ITEM C: QUILOMETRAGEM MÍNIMA PROPORCIONAL */}
      <View style={{ marginBottom: 12, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              states.setKmMinEnabled(!states.kmMinEnabled);
              if (!states.kmMinEnabled) {
                states.setTempoMinEnabled(false); states.setStepTempoEnabled(false); states.setStepKmEnabled(false);
              }
            }}
            style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: '#1E3A8A', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: states.kmMinEnabled ? '#1E3A8A' : 'transparent' }}
          >
            {states.kmMinEnabled && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
          </TouchableOpacity>
          <Text style={{ fontSize: 13, color: '#334155', marginLeft: 8, fontWeight: '600' }}>c. Por Quilometragem (KM) Mínima</Text>
        </View>
        {states.kmMinEnabled && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#E2E8F0' }}>
            <TextInput value={states.kmMinDistance} onChangeText={states.setKmMinDistance} placeholder="Distância (KM)" keyboardType="numeric" style={{ flex: 0.45, height: 34, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 8, fontSize: 12, textAlign: 'center', backgroundColor: '#FFFFFF', color: '#334155' }} />
            <Text style={{ fontSize: 14, color: '#64748B', fontWeight: 'bold' }}>=</Text>
            <TextInput value={states.kmMinPoints} onChangeText={states.setKmMinPoints} placeholder="Pontos" keyboardType="numeric" style={{ flex: 0.45, height: 34, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 8, fontSize: 12, textAlign: 'center', backgroundColor: '#FFFFFF', color: '#334155' }} />
          </View>
        )}
      </View>

      {/* 🗺️ ITEM D: STEP DE QUILOMETRAGEM (KM) */}
      <View style={{ backgroundColor: '#FFFFFF', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => {
              states.setStepKmEnabled(!states.stepKmEnabled);
              if (!states.stepKmEnabled) {
                states.setTempoMinEnabled(false); states.setStepTempoEnabled(false); states.setKmMinEnabled(false);
              }
            }}
            style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: '#1E3A8A', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: states.stepKmEnabled ? '#1E3A8A' : 'transparent' }}
          >
            {states.stepKmEnabled && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
          </TouchableOpacity>
          <Text style={{ fontSize: 13, color: '#334155', marginLeft: 8, fontWeight: '600' }}>d. Por Step de Quilometragem (KM)</Text>
        </View>
        {states.stepKmEnabled && (
          <View style={{ marginTop: 10, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#E2E8F0' }}>
            {states.kmStepsList.map((step, idx) => (
              <View key={step.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, zIndex: openKmDropdownId === step.id ? 9999 : 1 }}>
                <View style={{ width: 75, marginRight: 6, position: 'relative' }}>
                  <TouchableOpacity onPress={() => setOpenKmDropdownId(openKmDropdownId === step.id ? null : step.id)} style={{ height: 32, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}><Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1E3A8A' }}>{step.type}</Text></TouchableOpacity>
                  {openKmDropdownId === step.id && (
                    <View style={{ position: 'absolute', top: 34, left: 0, width: 75, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, elevation: 4, zIndex: 99999 }}>
                      {['Entre', 'Acima'].map((op) => (
                        <TouchableOpacity key={op} onPress={() => { const u = [...states.kmStepsList]; u[idx].type = op; if (op === 'Acima') u[idx].k2 = ''; states.setKmStepsList(u); setOpenKmDropdownId(null); }} style={{ paddingVertical: 6, alignItems: 'center' }}><Text style={{ fontSize: 11, color: '#334155' }}>{op}</Text></TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <TextInput value={step.k1} onChangeText={(v) => { const u = [...states.kmStepsList]; u[idx].k1 = v; states.setKmStepsList(u); }} placeholder="KM" keyboardType="numeric" style={{ width: 42, height: 32, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, textAlign: 'center', fontSize: 11, marginRight: 4, backgroundColor: '#FFFFFF' }} />
                {step.type === 'Entre' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: '#64748B', marginRight: 4 }}>e</Text>
                    <TextInput value={step.k2} onChangeText={(v) => { const u = [...states.kmStepsList]; u[idx].k2 = v; states.setKmStepsList(u); }} placeholder="KM" keyboardType="numeric" style={{ width: 42, height: 32, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, textAlign: 'center', fontSize: 11, marginRight: 4, backgroundColor: '#FFFFFF' }} />
                  </View>
                )}
                <Text style={{ fontSize: 11, color: '#64748B', marginRight: 4 }}>=</Text>
                <TextInput value={step.pts} onChangeText={(v) => { const u = [...states.kmStepsList]; u[idx].pts = v; states.setKmStepsList(u); }} placeholder="Pts" keyboardType="numeric" style={{ flex: 1, height: 32, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, textAlign: 'center', fontSize: 11, backgroundColor: '#FFFFFF' }} />
                <TouchableOpacity onPress={() => states.setKmStepsList(states.kmStepsList.filter(s => s.id !== step.id))} style={{ marginLeft: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', marginTop: -2 }}>×</Text></TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={handleAddStepKm} style={{ backgroundColor: '#1E3A8A', paddingVertical: 6, borderRadius: 4, alignItems: 'center', marginTop: 4 }}><Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>+ Add Step KM</Text></TouchableOpacity>
          </View>
        )}
      </View>

    </View>
  );
}
