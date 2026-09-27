// src/components/WorkoutModal.js
import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import CustomPicker from './CustomPicker';

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

  return (
    <Modal visible={isOpen} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* CABEÇALHO DO MODAL */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏋️ Registrar Novo Exercício</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Fechar ✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* SELETOR DE MODALIDADE */}
          <CustomPicker
            label="💪 Escolha a Atividade:"
            selectedValue={selectedActivity}
            onValueChange={(val) => setSelectedActivity(val)}
            options={[
              { label: '💪 Musculação', value: '💪 Musculação' },
              { label: '🏋️ Crossfit / Funcional', value: '🏋️ Crossfit / Treino Funcional' },
              { label: '🫀 Treino Aeróbico', value: '🫀 Treino Aeróbico' },
              { label: '🏃 Corrida / Caminhada', value: '🏃 Corrida' },
              { label: '🚴 Ciclismo', value: '🚴 Ciclismo' }
            ]}
          />

          {/* CAMPO DE DATA DO EXERCÍCIO */}
          <Text style={styles.label}>📅 Data do Exercício (AAAA-MM-DD):</Text>
          <TextInput
            style={styles.input}
            value={workoutDate}
            onChangeText={setWorkoutDate}
            placeholder="Ex: 2026-09-27"
          />

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
