// src/components/WorkoutModal.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import CustomPicker from './CustomPicker';
import RegrasAtivasPapiro from './RegrasAtivasPapiro';

export default function WorkoutModal({
  isOpen,
  onClose,
  selectedActivity,
  setSelectedActivity,
  workoutDate,
  setWorkoutDate,
  workoutCaption,
  setWorkoutCaption,
  kmInput,
  setKmInput,
  handleTriggerPhoto,
  photoEvidence,
  setPhotoEvidence,
  onSubmit,
  submitting
}) {
  const showKmInput = selectedActivity.includes('🏃') || selectedActivity.includes('🚴');
  const [showDatePicker, setShowDatePicker] = useState(false);
    // ⏱️ MEMÓRIA LOCAL: HORÁRIOS DE INÍCIO E FIM DO TREINO
  const [startHour, setStartHour] = useState('08');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('09');
  const [endMinute, setEndMinute] = useState('00');
  // 🧮 CALCULO AUTOMÁTICO DE TEMPO TOTAL EM MINUTOS
  const calcularTempoTotal = () => {
    const inicioAbsoluto = (parseInt(startHour) * 60) + parseInt(startMinute);
    const fimAbsoluto = (parseInt(endHour) * 60) + parseInt(endMinute);
    let diferenca = fimAbsoluto - inicioAbsoluto;
    if (diferenca <= 0) diferenca += 1440; // Trava automática de virada de dia (24h)
    return diferenca;
  };

  // Matrizes de opções para as roletas
  const listaHoras = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const listaMinutos = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  return (
    <Modal visible={isOpen} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* CABEÇALHO DO MODAL */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>REGISTRAR TREINO NA LIGA [NOME DA LIGA]</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Fechar ✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
              <RegrasAtivasPapiro selectedActivity={selectedActivity} />
          {/* SELETOR DE MODALIDADE */}
          <CustomPicker
            label="💪 Escolha a Atividade:"
            selectedValue={selectedActivity}
            onValueChange={(val) => setSelectedActivity(val)}
            options={[
          { label: '💪 Musculação', value: '💪 Musculação' },
          { label: '🏋️ Crossfit / Funcional', value: '🏋️ Crossfit / Funcional' },
          { label: '🔥 Aeróbico', value: '🔥 Aeróbico' },
          { label: '🏃 Corrida', value: '🏃 Corrida' },
          { label: '🚶 Caminhada', value: '🚶 Caminhada' },
          { label: '🚴 Bike', value: '🚴 Bike' },
          { label: '🥋 Lutas / Esportes Individuais', value: '🥋 Lutas / Esportes Individuais' },
          { label: '⚽ Esportes Coletivos', value: '⚽ Esportes Coletivos' },
          { label: '👣 Passos Diários', value: '👣 Passos Diários' }
            ]}
          />

                    {/* 📅 SELETOR DE DATA VISUAL NATIVO (CALENDÁRIO CLICÁVEL) */}
          <Text style={styles.label}>📅 Data do Treino (AAAA-MM-DD):</Text>
          <View style={{ marginBottom: 12, height: 40, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, backgroundColor: '#FFFFFF', justifyContent: 'center', paddingHorizontal: 8 }}>
            <input
              type="date"
              value={workoutDate}
              onChange={(e) => {
                if (e.target.value) {
                  setWorkoutDate(e.target.value);
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '13px',
                fontFamily: 'sans-serif',
                fontWeight: '700',
                color: '#1E3A8A',
                cursor: 'pointer'
              }}
            />
          </View>

          {/* ⏱️ BLOCO DE HORÁRIOS E CÁLCULO DE TEMPO (OCULTO EM PASSOS DIÁRIOS) */}
          {selectedActivity !== 'Passos Diários' && (
            <View style={{ marginBottom: 12, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={[styles.label, { marginBottom: 8, fontSize: 13 }]}>⏰ Horário de Início e Fim da Atividade:</Text>
              
              {/* INTERFACE DE SELEÇÃO: HORÁRIO INÍCIO */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>Horário de Início:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    style={{ height: 30, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 4, fontSize: 12, fontWeight: '700', color: '#1E3A8A', outline: 'none' }}
                  >
                    {listaHoras.map(h => <option key={`sh-${h}`} value={h}>{h}</option>)}
                  </select>
                  <Text style={{ marginHorizontal: 4, fontWeight: 'bold', color: '#64748B' }}>:</Text>
                  <select
                    value={startMinute}
                    onChange={(e) => setStartMinute(e.target.value)}
                    style={{ height: 30, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 4, fontSize: 12, fontWeight: '700', color: '#1E3A8A', outline: 'none' }}
                  >
                    {listaMinutos.map(m => <option key={`sm-${m}`} value={m}>{m}</option>)}
                  </select>
                </View>
              </View>

              {/* INTERFACE DE SELEÇÃO: HORÁRIO TÉRMINO */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>Horário de Término:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    style={{ height: 30, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 4, fontSize: 12, fontWeight: '700', color: '#1E3A8A', outline: 'none' }}
                  >
                    {listaHoras.map(h => <option key={`eh-${h}`} value={h}>{h}</option>)}
                  </select>
                  <Text style={{ marginHorizontal: 4, fontWeight: 'bold', color: '#64748B' }}>:</Text>
                  <select
                    value={endMinute}
                    onChange={(e) => setEndMinute(e.target.value)}
                    style={{ height: 30, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 4, fontSize: 12, fontWeight: '700', color: '#1E3A8A', outline: 'none' }}
                  >
                                        {listaMinutos.map(m => <option key={`em-${m}`} value={m}>{m}</option>)}
                  </select>
                </View>
              </View>

              {/* ⏳ AMPULHETA: TEMPO TOTAL CALCULADO */}
              <View style={{ marginTop: 4, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#CBD5E1', flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: '#16A34A', fontWeight: '700' }}>
                  ⏳ Tempo total Calculado: {calcularTempoTotal()} minutos
                </Text>
              </View>
            </View>
          )}

          {/* CAMPO DE KM (SE FOR CORRIDA OU PEDAL) */}
          {showKmInput && (
            <>
              <Text style={styles.label}>🏃 Distância Percorrida (Km):</Text>
              <TextInput
                style={styles.input}
                value={kmInput}
                onChangeText={setKmInput}
                keyboardType="numeric"
                placeholder="Ex: 5.2"
              />
            </>
          )}

          {/* COMENTÁRIOS ADICIONAIS */}
          <Text style={styles.label}>📝 Legenda / Observações:</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={workoutCaption}
            onChangeText={setWorkoutCaption}
            placeholder="Conta um pouco como foi o treino hoje!"
            multiline
            numberOfLines={3}
          />

          {/* SEÇÃO DA FOTO OBRIGATÓRIA (EVIDÊNCIA) */}
          <Text style={styles.label}>📸 Comprovante do Exercício (Obrigatório):</Text>
          <TouchableOpacity 
            style={[styles.photoBtn, photoEvidence && styles.photoBtnSuccess]} 
            onPress={() => handleTriggerPhoto('camera', setPhotoEvidence)}
          >
            <Text style={styles.photoBtnText}>
              {photoEvidence ? '✅ Foto Carregada com Sucesso!' : '📷 Tirar Foto / Enviar Evidência'}
            </Text>
          </TouchableOpacity>

          {/* BOTÃO FINAL DE SALVAR */}
          <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>🏆 ENVIAR TREINO PARA VALIDAÇÃO</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { padding: 16, backgroundColor: '#1e3a8a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  closeBtn: { backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  closeBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  scrollContent: { padding: 16 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 10, fontSize: 14, color: '#0f172a' },
  textArea: { height: 80, textAlignVertical: 'top' },
  photoBtn: { backgroundColor: '#f97316', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  photoBtnSuccess: { backgroundColor: '#22c55e' },
  photoBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  submitBtn: { backgroundColor: '#1e3a8a', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }
});
