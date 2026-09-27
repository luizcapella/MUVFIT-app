// src/screens/DashboardScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function DashboardScreen({
  currentUser,
  athletePerfScope,
  setAthletePerfScope,
  tiebreakers,
  setIsWeightChartModalOpen,
  setIsKmChartModalOpen,
  setIsTimeChartModalOpen,
  setIsModalityRadarModalOpen,
  personalGoals,
  setIsGoalModalOpen
}) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* CARD DO ATLETA */}
      <View style={styles.profileCard}>
        <Text style={styles.welcomeText}>👋 Olá, {currentUser?.nickname || 'Atleta'}!</Text>
        <Text style={styles.rankText}>🏆 Medalhas: {currentUser?.goldMedals || 0}🥇 | {currentUser?.silverMedals || 0}🥈 | {currentUser?.bronzeMedals || 0}🥉</Text>
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

      {/* CRITÉRIOS DE DESEMPATE ATIVOS */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>⚖️ Critérios de Desempate Ativos</Text>
        {tiebreakers.filter(t => t.enabled).map((crit, idx) => (
          <Text key={crit.id} style={styles.critText}>{idx + 1}º - {crit.label}</Text>
        ))}
      </View>

      {/* BLOCO DE GRÁFICOS E EVOLUÇÃO (NATIVOS) */}
      <Text style={styles.sectionHeader}>📈 Minha Evolução</Text>
      <View style={styles.gridContainer}>
        <TouchableOpacity style={styles.gridCard} onPress={() => setIsWeightChartModalOpen(true)}>
          <Text style={styles.gridEmoji}>⚖️</Text>
          <Text style={styles.gridTitle}>Histórico de Peso</Text>
          <Text style={styles.gridSub}>Acompanhar metas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => setIsKmChartModalOpen(true)}>
          <Text style={styles.gridEmoji}>🏃</Text>
          <Text style={styles.gridTitle}>Gráfico de Km</Text>
          <Text style={styles.gridSub}>Corridas e pedais</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => setIsTimeChartModalOpen(true)}>
          <Text style={styles.gridEmoji}>⏱️</Text>
          <Text style={styles.gridTitle}>Tempo Dedicado</Text>
          <Text style={styles.gridSub}>Total de minutos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.gridCard} onPress={() => setIsModalityRadarModalOpen(true)}>
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
        {personalGoals.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma meta definida para esta liga ainda.</Text>
        ) : (
          personalGoals.map((goal, index) => (
            <Text key={index} style={styles.goalItem}>• {goal.text || goal}</Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc' },
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
  goalItem: { fontSize: 13, color: '#334155', marginBottom: 4 }
});
