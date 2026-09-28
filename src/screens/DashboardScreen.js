// src/screens/DashboardScreen.js (Parte 1 de 2)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, FlatList } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function DashboardScreen({
  currentUser,
  athletePerfScope,
  setAthletePerfScope,
  tiebreakers,
  personalGoals,
  setIsGoalModalOpen
}) {
  // Estados para controle de abertura dos Modais de Evolução
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isKmModalOpen, setIsKmModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isRadarModalOpen, setIsRadarModalOpen] = useState(false);

  // Estados para entrada de novos dados de evolução
  const [inputWeight, setInputWeight] = useState('');
  const [inputWeightDate, setInputWeightDate] = useState(new Date().toISOString().substring(0, 10));
  const [submittingWeight, setSubmittingWeight] = useState(false);

  // Histórico local fictício (Mock) para visualização rápida antes do carregamento completo do Supabase
  const [weightHistory, setWeightHistory] = useState([
    { id: 'w1', weight: 82.5, date: '2026-09-10' },
    { id: 'w2', weight: 81.8, date: '2026-09-17' },
    { id: 'w3', weight: 80.9, date: '2026-09-24' }
  ]);

  const renderName = () => {
    if (!currentUser) return 'Atleta';
    if (typeof currentUser.nickname === 'string') return currentUser.nickname;
    if (typeof currentUser.name === 'string') return currentUser.name;
    return 'Atleta';
  };

  // FUNÇÃO: REGISTRAR NOVO PESO NO SUPABASE
  async function handleAddWeight() {
    if (!inputWeight.trim() || isNaN(parseFloat(inputWeight))) {
      Alert.alert('Atenção', 'Por favor, insira um valor numérico válido para o peso.');
      return;
    }
    setSubmittingWeight(true);
    try {
      const { error } = await supabase.from('weight_history').insert([
        {
          user_id: currentUser?.id,
          weight: parseFloat(inputWeight),
          recorded_at: inputWeightDate
        }
      ]);

      if (error) {
        Alert.alert('Erro', 'Não foi possível salvar o registro de peso.');
        return;
      }

      Alert.alert('Sucesso!', 'Peso registrado com sucesso!');
      setWeightHistory([
        { id: Math.random().toString(), weight: parseFloat(inputWeight), date: inputWeightDate },
        ...weightHistory
      ]);
      setInputWeight('');
    } catch (err) {
      console.log(err);
    } finally {
      setSubmittingWeight(false);
    }
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* CARD DO ATLETA */}
      <View style={styles.profileCard}>
        <Text style={styles.welcomeText}>👋 Olá, {renderName()}!</Text>
        <Text style={styles.rankText}>
          🏆 Medalhas: {Number(currentUser?.goldMedals || 0)}🥇 | {Number(currentUser?.silverMedals || 0)}🥈 | {Number(currentUser?.bronzeMedals || 0)}🥉
        </Text>
      </View>

      {/* FILTRO DE ESCOPO */}
      <View style={styles.scopeContainer}>
        <TouchableOpacity 
          style={[styles.scopeBtn, athletePerfScope === 'global' && styles.scopeBtnActive]}
          onPress={() => setAthletePerfScope('global')}
        >
          <Text style={[styles.scopeBtnText, athletePerfScope === 'global' && styles.scopeBtnTextActive]}>Filtro Global</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.scopeBtn, athletePerfScope === 'challenge' && styles.scopeBtnActive]}
          onPress={() => setAthletePerfScope('challenge')}
        >
          <Text style={[styles.scopeBtnText, athletePerfScope === 'challenge' && styles.scopeBtnTextActive]}>Apenas a Liga</Text>
        </TouchableOpacity>
      </View>

      {/* CRITÉRIRE DE DESEMPATE ATIVOS */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>⚖️ Critérios de Desempate Ativos</Text>
        {Array.isArray(tiebreakers) && tiebreakers.filter(t => t && t.enabled).map((crit, idx) => (
          <Text key={crit.id || idx} style={styles.critText}>{idx + 1}º - {String(crit.label)}</Text>
        ))}
      </View>

      {/* BLOCO DE GRÁFICOS E EVOLUÇÃO (INTERATIVOS) */}
      <Text style={styles.sectionHeader}>📈 Minha Evolução</Text>
      <View style={styles.gridContainer}>
        <TouchableOpacity style={styles.gridCard} onPress={() => setIsWeightChartModalOpen(true)}>
          <Text style={styles.gridEmoji}>⚖️</Text>
          <Text style={styles.gridTitle}>Histórico de Peso</Text>
          <Text style={styles.gridSub}>Acompanhar metas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => setIsKmModalOpen(true)}>
          <Text style={styles.gridEmoji}>🏃</Text>
          <Text style={styles.gridTitle}>Gráfico de Km</Text>
          <Text style={styles.gridSub}>Corridas e pedais</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => setIsTimeModalOpen(true)}>
          <Text style={styles.gridEmoji}>⏱️</Text>
          <Text style={styles.gridTitle}>Tempo Dedicado</Text>
          <Text style={styles.gridSub}>Total de minutos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => setIsRadarModalOpen(true)}>
          <Text style={styles.gridEmoji}>📊</Text>
          <Text style={styles.gridTitle}>Radar de Modalidades</Text>
          <Text style={styles.gridSub}>Equilíbrio de treino</Text>
        </TouchableOpacity>
      </View>

      {/* METAS PESSOAIS */}
      <View style={styles.sectionCard}>
        <View style={styles.rowJustify}>
          <Text style={styles.sectionTitle}>🎯 Meus Objetivos</Text>
          <TouchableOpacity style={styles.addGoalBtn} onPress={() => setIsGoalModalOpen(true)}>
            <Text style={styles.addGoalText}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>
        {!personalGoals || personalGoals.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma meta definida para esta liga ainda.</Text>
        ) : (
          personalGoals.map((goal, index) => (
            <Text key={index} style={styles.goalItem}>• {typeof goal === 'object' ? String(goal.text || '') : String(goal)}</Text>
          ))
        )}
      </View>

      {/* MODAL 1: HISTÓRICO DE PESO */}
      <Modal visible={isWeightModalOpen} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>⚖️ Registro e Histórico de Peso</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsWeightModalOpen(false)}>
              <Text style={styles.closeBtnText}>Fechar ✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.modalLabel}>Novo Peso (Kg):</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="Ex: 78.5" 
                keyboardType="numeric"
                value={inputWeight}
                onChangeText={setInputWeight}
              />
              <Text style={styles.modalLabel}>Data do Registro:</Text>
              <TextInput 
                style={styles.modalInput} 
                placeholder="AAAA-MM-DD" 
                value={inputWeightDate}
                onChangeText={setInputWeightDate}
              />
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAddWeight} disabled={submittingWeight}>
                <Text style={styles.modalSubmitBtnText}>{submittingWeight ? 'A guardar...' : 'Registrar Peso'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.historyTitle}>📋 Pesagens Anteriores</Text>
            {weightHistory.map((item) => (
              <View key={item.id} style={styles.historyRow}>
                <Text style={styles.historyTextDate}>📅 {item.date}</Text>
                <Text style={styles.historyTextWeight}>{item.weight} Kg</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
      {/* MODAL 2: GRÁFICO DE KM */}
      <Modal visible={isKmModalOpen} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>🏃 Quilometragem Acumulada</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsKmModalOpen(false)}>
              <Text style={styles.closeBtnText}>Fechar ✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.infoTitle}>Evolução de Distância</Text>
            <Text style={styles.infoSub}>Aqui serão exibidos os gráficos de linha resumindo os seus treinos de corrida e ciclismo assim que as validações forem concluídas.</Text>
            <View style={styles.placeholderChartBox}>
              <Text style={styles.placeholderChartText}>📊 [Gráfico de Linhas Otimizado]</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 3: TEMPO DEDICADO */}
      <Modal visible={isTimeModalOpen} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>⏱️ Tempo de Dedicação</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsTimeModalOpen(false)}>
              <Text style={styles.closeBtnText}>Fechar ✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.infoTitle}>Minutos de Exercício</Text>
            <Text style={styles.infoSub}>Acompanhamento total do tempo investido na sua saúde nesta liga.</Text>
            <View style={styles.placeholderChartBox}>
              <Text style={styles.placeholderChartText}>📊 [Gráfico de Barras de Tempo]</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL 4: RADAR DE MODALIDADES */}
      <Modal visible={isRadarModalOpen} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>📊 Proporção de Treinos</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsRadarModalOpen(false)}>
              <Text style={styles.closeBtnText}>Fechar ✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            <Text style={styles.infoTitle}>Radar de Equilíbrio</Text>
            <Text style={styles.infoSub}>Verifique se os seus treinos estão equilibrados entre musculação, aeróbicos e funcionais.</Text>
            <View style={styles.placeholderChartBox}>
              <Text style={styles.placeholderChartText}>🕸️ [Gráfico de Radar / Pizza]</Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc', paddingBottom: 100 },
  profileCard: { backgroundColor: '#1e3a8a', padding: 16, borderRadius: 12, marginBottom: 16 },
  welcomeText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  rankText: { color: '#f97316', fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  scopeContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  scopeBtn: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center', backgroundColor: '#e2e8f0' },
  scopeBtnActive: { backgroundColor: '#f97316' },
  scopeBtnText: { color: '#475569', fontWeight: 'bold', fontSize: 13 },
  scopeBtnTextActive: { color: '#ffffff' },
  sectionCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 8 },
  critText: { fontSize: 13, color: '#334155', marginBottom: 4 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 12, marginTop: 8 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  gridCard: { width: '48%', backgroundColor: '#ffffff', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  gridEmoji: { fontSize: 24, marginBottom: 6 },
  gridTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center' },
  gridSub: { fontSize: 11, color: '#64748b', marginTop: 2 },
  rowJustify: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addGoalBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  addGoalText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  emptyText: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
  goalItem: { fontSize: 13, color: '#334155', marginBottom: 4 },
  modalContainer: { flex: 1, backgroundColor: '#ffffff' },
  modalHeader: { padding: 16, backgroundColor: '#1e3a8a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalHeaderTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  closeBtn: { backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  closeBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  modalBody: { padding: 16 },
  formGroup: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 20 },
  modalLabel: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 4, marginTop: 8 },
  modalInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 10, height: 40, fontSize: 14, color: '#0f172a' },
  modalSubmitBtn: { backgroundColor: '#f97316', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 14 },
  modalSubmitBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  historyTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 10 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  historyTextDate: { fontSize: 13, color: '#475569' },
  historyTextWeight: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  infoTitle: { fontSize: 15, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 4 },
  infoSub: { fontSize: 12, color: '#64748b', lineHeight: 16, marginBottom: 16 },
  placeholderChartBox: { height: 180, backgroundColor: '#f1f5f9', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderStyle: 'dashed' },
  placeholderChartText: { color: '#64748b', fontSize: 13, fontWeight: '500' }
});
