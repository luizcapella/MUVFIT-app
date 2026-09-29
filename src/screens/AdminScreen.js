// src/screens/AdminScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function AdminScreen({ pendingWorkouts, setPendingWorkouts, fetchDataFromSupabase, challenges, currentUser, profiles }) {
  
  // 1. ESTADOS PARA CONTROLE VISUAL DA SANFONA E REQUISITOS
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [leagueRequests, setLeagueRequests] = useState([]);
  const [challengeRequests, setChallengeRequests] = useState([]);
  const [leagueMembers, setLeagueMembers] = useState([]);

  // 2. FUNÇÃO EFEITO: CARREGA AS SOLICITAÇÕES DA LIGA DO ADMIN EM TEMPO REAL
  useEffect(() => {
    if (currentUser?.is_admin || currentUser?.isAdmin) {
      loadManagementData();
    }
  }, [challenges, currentUser]);

  async function loadManagementData() {
    try {
      const { data: memData } = await supabase.from('league_memberships').select('*');
      const { data: chalData } = await supabase.from('challenge_applications').select('*');

      if (memData) {
        const requests = memData.filter(m => m.status === 'Aguardando Aprovação do Admin');
        const approved = memData.filter(m => m.status !== 'Aguardando Aprovação do Admin');

        setLeagueRequests(requests);
        setLeagueMembers(approved);
      }
      if (chalData) {
        setChallengeRequests(chalData.filter(c => c.status === 'Pendente'));
      }
    } catch (err) {
      console.log('Erro ao carregar moderação de ligas:', err);
    }
  }

  // 3. DECISÃO: ADMINISTRADOR ACEITA OU REJEITA MEMBRO NA LIGA (Aba A)
  async function handleLeagueDecision(requestId, userId, leagueId, accept) {
    try {
      if (accept) {
        const { error } = await supabase
          .from('league_memberships')
          .update({ status: 'TELESPECTADOR' })
          .eq('id', requestId);

        if (error) throw error;
        alert('Usuário aceito como TELESPECTADOR 👀 com sucesso!');
      } else {
        const { error } = await supabase
          .from('league_memberships')
          .delete()
          .eq('id', requestId);

        if (error) throw error;
        alert('Solicitação de entrada na liga recusada.');
      }
      await loadManagementData();
      if (fetchDataFromSupabase) await fetchDataFromSupabase();
    } catch (err) {
      alert('Erro ao processar decisão da liga: ' + err.message);
    }
  }

  // 4. DECISÃO: ADMINISTRADOR ACEITA OU RECUSA ATLETA NO DESAFIO (Aba B)
  async function handleChallengeDecision(applicationId, userId, leagueId, accept) {
    try {
      if (accept) {
        await supabase.from('challenge_applications').update({ status: 'Aceito' }).eq('id', applicationId);
        await supabase.from('league_memberships').update({ status: 'ATLETA ATIVO' }).eq('league_id', leagueId).eq('user_id', userId);
        alert('Atleta aprovado com sucesso! Agora ele é um ATLETA ATIVO ⚡');
      } else {
        await supabase.from('challenge_applications').update({ status: 'Recusado' }).eq('id', applicationId);
        await supabase.from('league_memberships').update({ status: 'TELESPECTADOR' }).eq('league_id', leagueId).eq('user_id', userId);
        alert('Inscrição no desafio recusada.');
      }
      await loadManagementData();
      if (fetchDataFromSupabase) await fetchDataFromSupabase();
    } catch (err) {
      alert('Erro ao processar decisão do desafio: ' + err.message);
    }
  }

  // 5. FUNÇÃO ORIGINAL MANTIDA: MODERAÇÃO DE TREINOS FISICAIS
  async function handleModerateWorkout(workoutId, newStatus) {
    try {
      const { error } = await supabase
        .from('pending_workouts')
        .update({ status: newStatus })
        .eq('id', workoutId);

      if (error) {
        alert('Erro ao atualizar status do treino.');
        return;
      }

      alert(newStatus === 'approved' ? 'Treino aprovado com sucesso! 🎉' : 'Treino rejeitado.');
      if (setPendingWorkouts) {
        setPendingWorkouts(prev => prev.filter(w => w.id !== workoutId));
      }
      if (fetchDataFromSupabase) await fetchDataFromSupabase();
    } catch (err) {
      console.log(err);
    }
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* 1º NOVA ABA COLAPSÁVEL: GERENCIAMENTO DA LIGA/DESAFIO DA LIGA */}
      <TouchableOpacity 
        style={styles.accordionHeader} 
        onPress={() => setIsManagementOpen(!isManagementOpen)}
      >
        <Text style={styles.accordionTitle}>⚙️ Gerenciamento da Liga/Desafio da Liga</Text>
        <Text style={styles.accordionArrow}>{isManagementOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isManagementOpen && (
        <View style={styles.accordionContent}>
          
          {/* a. Solicitação de Entradas de Novos Membros na Liga */}
          <Text style={styles.subSectionTitle}>📩 Solicitação de Entradas de Novos Membros na Liga:</Text>
          {leagueRequests.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma solicitação de entrada na liga pendente.</Text>
          ) : (
            leagueRequests.map((req) => {
              const prof = profiles?.find(p => p.id === req.user_id);
              return (
                <View key={req.id} style={styles.requestRow}>
                  <View style={styles.userInfo}>
                    <Image 
                      source={{ uri: prof?.avatar_url || 'https://placeholder.com' }} 
                      style={styles.userAvatar} 
                    />
                    <Text style={styles.userNickname}>{prof?.nickname || 'Atleta Anônimo'}</Text>
                  </View>
                  <View style={styles.btnRow}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.btnAccept]} 
                      onPress={() => handleLeagueDecision(req.id, req.user_id, req.league_id, true)}
                    >
                      <Text style={styles.btnText}>ACEITAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.btnReject]} 
                      onPress={() => handleLeagueDecision(req.id, req.user_id, req.league_id, false)}
                    >
                      <Text style={styles.btnText}>REJEITAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

                   {/* b. Solicitação Para Atletas Ativos */}
          <Text style={[styles.subSectionTitle, { marginTop: 14 }]}>⚡ Solicitação Para Atletas Ativos:</Text>
          {challengeRequests.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma solicitação de inscrição no desafio pendente.</Text>
          ) : (
            challengeRequests.map(function(req) {
              var prof = profiles ? profiles.find(function(p) { return p.id === req.user_id; }) : null;
              return (
                <View key={req.id} style={styles.requestRow}>
                  <View style={styles.userInfo}>
                    <Image 
                      source={{ uri: (prof && prof.avatar_url) ? prof.avatar_url : 'https://placeholder.com' }} 
                      style={styles.userAvatar} 
                    />
                    <Text style={styles.userNickname}>{(prof && prof.nickname) ? prof.nickname : 'Atleta Anônimo'}</Text>
                  </View>

                  <View style={styles.btnRow}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.btnAccept]} 
                      onPress={() => handleChallengeDecision(req.id, req.user_id, req.league_id, true)}
                    >
                      <Text style={styles.btnText}>ACEITAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.btnReject]} 
                      onPress={() => handleChallengeDecision(req.id, req.user_id, req.league_id, false)}
                    >
                      <Text style={styles.btnText}>RECUSAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* c. Membros */}
          <Text style={[styles.subSectionTitle, { marginTop: 14 }]}>👥 Membros:</Text>
          {leagueMembers.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum membro aprovado nesta liga ainda.</Text>
          ) : (
            leagueMembers.map((member) => {
              const userProf = profiles?.find(p => p.id === member.user_id);
              return (
                <View key={member.id} style={styles.memberRow}>
                  <View style={styles.userInfo}>
                    <Image 
                      source={{ uri: userProf?.avatar_url || 'https://placeholder.com' }} 
                      style={styles.userAvatar} 
                    />
                    <Text style={styles.userNickname}>{userProf?.nickname || 'Atleta Anônimo'}</Text>
                  </View>
                  <Text style={styles.memberStatusTag}>{member.status}</Text>
                </View>
              );
            })
          )}

        </View>
      )}

      {/* 2º SEÇÃO MANTIDA INTEGRALMENTE: PAINEL DE MODERAÇÃO ADMINISTRATIVA */}
      <Text style={styles.pageTitle}>🛡️ Painel de Moderação Administrativa</Text>
      <Text style={styles.pageSubtitle}>Fiscalize as evidências de imagem para liberar a pontuação oficial.</Text>

      {pendingWorkouts.length === 0 ? (
        <Text style={styles.emptyText}>Não há treinos aguardando validação no momento. Bom descanso!</Text>
      ) : (
        pendingWorkouts.map((workout) => {
          const userProfile = profiles?.find(p => p.id === workout.user_id);
          return (
            <View key={workout.id} style={styles.adminCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.userLabel}>Atleta ID:</Text>
                <Text style={styles.userValue}>
                  {userProfile?.nickname || workout.user_id.substring(0, 8)}...
                </Text>
              </View>

              <Text style={styles.workoutInfo}><Text style={styles.boldText}>Atividade:</Text> {workout.activity}</Text>
              <Text style={styles.workoutInfo}>
                <Text style={styles.boldText}>Distância:</Text> {workout.km_distance} Km / <Text style={styles.boldText}>Tempo:</Text> {workout.time_spent ? `${workout.time_spent} min` : 'N/A'}
              </Text>

              <Text style={styles.labelMandatory}>📸 EVIDÊNCIA DA FOTO OBRIGATÓRIA:</Text>
              {workout.evidence_image_url ? (
                <Image source={{ uri: workout.evidence_image_url }} style={styles.evidenceImage} resizeMode="cover" />
              ) : (
                <Text style={styles.alertText}>⚠️ Treino enviado sem foto de evidência!</Text>
              )}

              <Text style={styles.pointsEarned}><Text style={styles.boldText}>🔥 Pontos:</Text> {workout.points_computed || 0} pts</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.btn, styles.btnRejectOld]} onPress={() => handleModerateWorkout(workout.id, 'rejected')}>
                  <Text style={styles.btnText}>❌ Rejeitar Treino</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, styles.btnApproveOld]} onPress={() => handleModerateWorkout(workout.id, 'approved')}>
                  <Text style={styles.btnText}>✅ Aprovar Treino</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#FAF9F6', paddingBottom: 60 },
  pageTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E3A8A', marginTop: 14, marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: '#64748B', marginBottom: 16 },
  adminCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 16, borderHorizontalWidth: 1, borderColor: '#E2E8F0' },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  userLabel: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  userValue: { fontSize: 12, color: '#0F172A', fontWeight: '500' },
  workoutInfo: { fontSize: 13, color: '#334155', marginBottom: 4 },
  boldText: { fontWeight: 'bold', color: '#1E3A8A' },
  labelMandatory: { fontSize: 11, fontWeight: 'bold', color: '#F97316', marginTop: 10, marginBottom: 6 },
  evidenceImage: { width: '100%', height: 180, borderRadius: 8, marginTop: 4, marginBottom: 10 },
  alertText: { fontSize: 12, color: '#EF4444', fontStyle: 'italic', marginVertical: 8 },
  pointsEarned: { fontSize: 14, fontWeight: 'bold', color: '#16A34A', marginTop: 6, marginBottom: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnRejectOld: { backgroundColor: '#EF4444' },
  btnApproveOld: { backgroundColor: '#22C55E' },
  btnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  emptyText: { fontSize: 12, color: '#64748B', fontStyle: 'italic', padding: 6 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e2e8f0', padding: 12, borderRadius: 8, marginBottom: 14, borderWidth: 1, borderColor: '#cbd5e1' },
  accordionTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a' },
  accordionArrow: { fontSize: 11, color: '#475569' },
  accordionContent: { backgroundColor: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 14 },
  subSectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, paddingBottom: 2, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  requestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#cbd5e1' },
  userNickname: { fontSize: 13, fontWeight: '500', color: '#334155' },
  btnRow: { flexDirection: 'row', gap: 6 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  btnAccept: { backgroundColor: '#22c55e' },
  btnReject: { backgroundColor: '#ef4444' },
  memberStatusTag: { fontSize: 11, fontWeight: 'bold', color: '#f97316', backgroundColor: '#ffedd5', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 }
});
