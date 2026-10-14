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
