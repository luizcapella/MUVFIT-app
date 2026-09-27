// src/screens/AdminScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function AdminScreen({ pendingWorkouts, setPendingWorkouts, fetchDataFromSupabase }) {
  
  // Lógica para validar ou rejeitar o treino diretamente no Supabase
  async function handleModerateWorkout(workoutId, newStatus) {
    try {
      const { error } = await supabase
        .from('pending_workouts')
        .update({ status: newStatus })
        .eq('id', workoutId);

      if (error) {
        alert('Erro ao moderar treino: ' + error.message);
        return;
      }

      alert(newStatus === 'approved' ? '🎯 Treino aprovado! Pontos computados.' : '❌ Treino rejeitado.');
      
      // Remove da lista pendente local imediatamente
      setPendingWorkouts(pendingWorkouts.filter(w => w.id !== workoutId));
      
      // Atualiza os dados gerais da liga para computar os novos pontos no Ranking/Feed
      if (fetchDataFromSupabase) await fetchDataFromSupabase();
    } catch (err) {
      console.log('Erro na moderação:', err);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>🛡️ Painel de Moderação Administrativa</Text>
      <Text style={styles.pageSubtitle}>Fiscalize as evidências de imagem para liberar a pontuação oficial.</Text>

      {pendingWorkouts.length === 0 ? (
        <Text style={styles.emptyText}>Não há treinos aguardando validação no momento. Bom descanso!</Text>
      ) : (
        pendingWorkouts.map((workout) => (
          <View key={workout.id} style={styles.adminCard}>
            <View style={styles.metaRow}>
              <Text style={styles.userLabel}>Atleta ID: <Text style={styles.boldText}>{workout.user_id?.substring(0, 8)}...</Text></Text>
              <Text style={styles.dateLabel}>{workout.workout_date}</Text>
            </View>

            <Text style={styles.workoutInfo}>Atividade: <Text style={styles.activityText}>{workout.activity}</Text></Text>
            {workout.km_distance > 0 && <Text style={styles.workoutInfo}>Distância: {workout.km_distance} Km</Text>}
            {workout.caption ? <Text style={styles.captionText}>" {workout.caption} "</Text> : null}

            {/* EXIBIÇÃO DA FOTO OBRIGATÓRIA */}
            {workout.evidence_url ? (
              <Image source={{ uri: workout.evidence_url }} style={styles.evidenceImage} resizeMode="cover" />
            ) : (
              <View style={styles.alertBox}><Text style={styles.alertText}>⚠️ Treino enviado sem foto de evidência!</Text></View>
            )}

            <Text style={styles.pointsWorth}>Valor: 🔥 {workout.points_computed || 0} pts</Text>

            {/* BOTÕES DE DECISÃO */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.btn, styles.rejectBtn]} 
                onPress={() => handleModerateWorkout(workout.id, 'rejected')}
              >
                <Text style={styles.btnText}>❌ Rejeitar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btn, styles.approveBtn]} 
                onPress={() => handleModerateWorkout(workout.id, 'approved')}
              >
                <Text style={styles.btnText}>✅ Aprovar Treino</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc' },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  emptyText: { fontSize: 13, color: '#64748b', fontStyle: 'italic', textAlign: 'center', marginTop: 24 },
  adminCard: { backgroundColor: '#ffffff', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#cbd5e1', elevation: 1 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  userLabel: { fontSize: 12, color: '#475569' },
  boldText: { fontWeight: 'bold', color: '#1e3a8a' },
  dateLabel: { fontSize: 11, color: '#64748b' },
  workoutInfo: { fontSize: 13, color: '#334155', marginBottom: 2 },
  activityText: { color: '#f97316', fontWeight: 'bold' },
  captionText: { fontSize: 12, color: '#475569', fontStyle: 'italic', marginVertical: 6 },
  evidenceImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 8, backgroundColor: '#e2e8f0' },
  alertBox: { backgroundColor: '#fee2e2', padding: 12, borderRadius: 6, marginTop: 6, alignItems: 'center' },
  alertText: { color: '#b91c1c', fontSize: 12, fontWeight: 'bold' },
  pointsWorth: { fontSize: 14, fontWeight: 'bold', color: '#16a34a', marginTop: 10 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  approveBtn: { backgroundColor: '#16a34a' },
  rejectBtn: { backgroundColor: '#dc2626' },
  btnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' }
});
