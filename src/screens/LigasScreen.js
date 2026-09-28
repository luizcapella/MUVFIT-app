// src/screens/LigasScreen.js (Parte 1 de 2)
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Share } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function LigasScreen({ challenges, memberships, currentUser, setChallenges, fetchDataFromSupabase }) {
  // Controle de abas expansíveis / colapsáveis
  const [isAdminSectionOpen, setIsAdminSectionOpen] = useState(true);
  const [isParticipantSectionOpen, setIsParticipantSectionOpen] = useState(true);
  const [isInvitesSectionOpen, setIsInvitesSectionOpen] = useState(true);

  // Estados para criação de novo desafio
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Mock de convites recebidos para visualização da funcionalidade
    const [invitesReceived, setInvitesReceived] = useState([]);

  // FUNÇÃO: CRIAR NOVO DESAFIO / LIGA
  async function handleCreateChallenge() {
    if (!newTitle.trim()) {
      Alert.alert('Atenção', 'Por favor, digite o nome da liga.');
      return;
    }
    setIsCreating(true);
    try {
      const { error } = await supabase.from('challenges').insert([
        {
          title: newTitle.trim(),
          creator_id: currentUser?.id,
          status_inscription: 'Aberto' // Inicia aberta por padrão
        }
      ]);

      if (error) {
        Alert.alert('Erro', error.message);
        return;
      }

      Alert.alert('Sucesso!', 'Nova liga criada com sucesso!');
      setNewTitle('');
      if (fetchDataFromSupabase) await fetchDataFromSupabase();
    } catch (err) {
      console.log(err);
    } finally {
      setIsCreating(false);
    }
  }

  // FUNÇÃO: ALTERAR STATUS DE INSCRIÇÃO (ABERTO / FECHADO)
  async function handleToggleInscription(challengeId, currentStatus) {
    const nextStatus = currentStatus === 'Aberto' ? 'Fechado' : 'Aberto';
    try {
      const { error } = await supabase
        .from('challenges')
        .update({ status_inscription: nextStatus })
        .eq('id', challengeId);

      if (error) {
        Alert.alert('Erro', 'Não foi possível alterar o status de inscrição.');
        return;
      }

      if (fetchDataFromSupabase) await fetchDataFromSupabase();
    } catch (err) {
      console.log(err);
    }
  }

  // FUNÇÃO: REMOVER LIGA PERMANENTEMENTE
  async function handleRemoveChallenge(challengeId) {
    Alert.alert(
      'Remover Liga',
      'Tem certeza de que deseja excluir permanentemente esta liga? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('challenges').delete().eq('id', challengeId);
              if (error) {
                Alert.alert('Erro', 'Não foi possível remover a liga.');
                return;
              }
              Alert.alert('Sucesso', 'Liga excluída definitivamente.');
              if (fetchDataFromSupabase) await fetchDataFromSupabase();
            } catch (err) {
              console.log(err);
            }
          }
        }
      ]
    );
  }

  // FUNÇÃO: CONVIDAR VIA COMPARTILHAMENTO NATIVO (WHATSAPP, ETC.)
  async function handleInviteShare(challengeTitle, challengeId) {
    try {
      await Share.share({
        message: `Venha participar da minha liga "${challengeTitle}" no MuvFit! Acesse o app e use o link oficial de entrada: https://vercel.app{challengeId}`,
      });
    } catch (error) {
      console.log(error.message);
    }
  }
  // LÓGICA DE GERENCIAMENTO DE CONVITES RECEBIDOS
  function handleAcceptInvite(inviteId) {
    Alert.alert('Sucesso', 'Você aceitou o convite para a liga!');
    setInvitesReceived(invitesReceived.filter(inv => inv.id !== inviteId));
  }

  function handleRejectInvite(inviteId) {
    Alert.alert('Convite Rejeitado', 'O convite foi removido da sua lista.');
    setInvitesReceived(invitesReceived.filter(inv => inv.id !== inviteId));
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>🏆 Gerenciamento de Ligas</Text>

      {/* BLOCO: CRIAR DESAFIO */}
      <View style={styles.createCard}>
        <Text style={styles.cardHeader}>🆕 Criar Novo Desafio</Text>
        <View style={styles.row}>
          <TextInput
            style={styles.input}
            placeholder="Nome da Liga / Desafio"
            value={newTitle}
            onChangeText={setNewTitle}
          />
          <TouchableOpacity style={styles.createBtn} onPress={handleCreateChallenge} disabled={isCreating}>
            <Text style={styles.createBtnText}>{isCreating ? '...' : 'Criar'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ABA: LIGAS QUE ADMINISTRA */}
      <TouchableOpacity 
        style={styles.accordionHeader} 
        onPress={() => setIsAdminSectionOpen(!isAdminSectionOpen)}
      >
        <Text style={styles.accordionTitle}>🔑 Ligas Que Administra</Text>
        <Text style={styles.accordionArrow}>{isAdminSectionOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isAdminSectionOpen && (
        <View style={styles.accordionContent}>
          {challenges.filter(c => c.creator_id === currentUser?.id).length === 0 ? (
            <Text style={styles.emptyText}>Você não administra nenhuma liga atualmente.</Text>
          ) : (
            challenges.filter(c => c.creator_id === currentUser?.id).map((liga) => {
              const isOpen = (liga.status_inscription || 'Aberto') === 'Aberto';
              return (
                <View key={liga.id} style={styles.ligaRow}>
                  <View style={styles.ligaMeta}>
                    <TouchableOpacity onPress={() => Alert.alert('Navegação', `Entrando na liga: ${liga.title}`)}>
                      <Text style={styles.ligaTitleLink}>{liga.title}</Text>
                    </TouchableOpacity>
                    <Text style={styles.ligaDate}>Criada em: {liga.created_at ? liga.created_at.substring(0, 10) : '2026-09-28'}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    {/* Botão de Status Inscrição (Administrador abre/fecha) */}
                    <TouchableOpacity 
                      style={[styles.statusBtn, isOpen ? styles.btnOpen : styles.btnClose]}
                      onPress={() => handleToggleInscription(liga.id, liga.status_inscription || 'Aberto')}
                    >
                      <Text style={styles.statusBtnText}>{isOpen ? 'Aberto' : 'Fechado'}</Text>
                    </TouchableOpacity>

                    {/* Botão Convidar */}
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleInviteShare(liga.title, liga.id)}>
                      <Text style={styles.iconText}>🔗</Text>
                    </TouchableOpacity>

                    {/* Botão Remover */}
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleRemoveChallenge(liga.id)}>
                      <Text style={styles.iconText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}
      {/* ABA: LIGAS EM QUE PARTICIPO */}
      <TouchableOpacity 
        style={styles.accordionHeader} 
        onPress={() => setIsParticipantSectionOpen(!isParticipantSectionOpen)}
      >
        <Text style={styles.accordionTitle}>⚡ Ligas em que Participo</Text>
        <Text style={styles.accordionArrow}>{isParticipantSectionOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isParticipantSectionOpen && (
        <View style={styles.accordionContent}>
          {challenges.filter(c => c.creator_id !== currentUser?.id).length === 0 ? (
            <Text style={styles.emptyText}>Você não está participando de outras ligas ainda.</Text>
          ) : (
            challenges.filter(c => c.creator_id !== currentUser?.id).map((liga) => {
              const isOpen = (liga.status_inscription || 'Aberto') === 'Aberto';
              return (
                <View key={liga.id} style={styles.ligaRow}>
                  <View style={styles.ligaMeta}>
                    <TouchableOpacity onPress={() => Alert.alert('Navegação', `Entrando na liga: ${liga.title}`)}>
                      <Text style={styles.ligaTitleLink}>{liga.title}</Text>
                    </TouchableOpacity>
                    <Text style={styles.ligaDate}>Criada em: {liga.created_at ? liga.created_at.substring(0, 10) : '2026-09-28'}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    {/* Feedback visual de Status (Não clicável para participante) */}
                    <View style={[styles.statusFeedback, isOpen ? styles.feedbackOpen : styles.feedbackClose]}>
                      <Text style={styles.statusBtnText}>{isOpen ? 'Aberto' : 'Fechado'}</Text>
                    </View>

                    {/* Botão Convidar */}
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleInviteShare(liga.title, liga.id)}>
                      <Text style={styles.iconText}>🔗</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}

      {/* ABA: CONVITES RECEBIDOS */}
      <TouchableOpacity 
        style={styles.accordionHeader} 
        onPress={() => setIsInvitesSectionOpen(!isInvitesSectionOpen)}
      >
        <Text style={styles.accordionTitle}>📩 Convites Recebidos</Text>
        <Text style={styles.accordionArrow}>{isInvitesSectionOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isInvitesSectionOpen && (
        <View style={styles.accordionContent}>
          {invitesReceived.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum convite pendente por aqui.</Text>
          ) : (
            invitesReceived.map((invite) => {
              const isOpen = invite.status === 'Aberto';
              return (
                <View key={invite.id} style={styles.inviteCard}>
                  <View style={styles.ligaMeta}>
                    <TouchableOpacity onPress={() => Alert.alert('Pré-visualização', 'Como visitante, você pode ver o Feed e Ranking. Entre para interagir!')}>
                      <Text style={styles.ligaTitleLink}>{invite.title}</Text>
                    </TouchableOpacity>
                    <Text style={styles.ligaDate}>Criação: {invite.created_at}</Text>
                    <Text style={styles.ligaDate}>Status da Liga: <Text style={{fontWeight: 'bold', color: isOpen ? '#22c55e' : '#dc2626'}}>{invite.status}</Text></Text>
                  </View>

                  <View style={styles.inviteActionRow}>
                    <TouchableOpacity style={[styles.choiceBtn, styles.acceptBtn]} onPress={() => handleAcceptInvite(invite.id)}>
                      <Text style={styles.choiceBtnText}>✅ Aceitar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.choiceBtn, styles.rejectBtn]} onPress={() => handleRejectInvite(invite.id)}>
                      <Text style={styles.choiceBtnText}>❌ Rejeitar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc' },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 16 },
  createCard: { backgroundColor: '#ffffff', padding: 14, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: '#cbd5e1' },
  cardHeader: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 10, height: 40, fontSize: 14, color: '#0f172a' },
  createBtn: { backgroundColor: '#f97316', paddingHorizontal: 16, borderRadius: 6, justifyContent: 'center' },
  createBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e2e8f0', padding: 12, borderRadius: 8, marginTop: 12 },
  accordionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  accordionArrow: { fontSize: 12, color: '#475569' },
  accordionContent: { backgroundColor: '#ffffff', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', borderTopWidth: 0 },
  emptyText: { fontSize: 12, color: '#64748b', fontStyle: 'italic', padding: 8 },
  ligaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  ligaMeta: { flex: 1, gap: 2, marginRight: 8 },
  ligaTitleLink: { fontSize: 14, fontWeight: 'bold', color: '#f97316', textDecorationLine: 'underline' },
  ligaDate: { fontSize: 11, color: '#64748b' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, minWidth: 65, alignItems: 'center' },
  statusFeedback: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, minWidth: 65, alignItems: 'center' },
  btnOpen: { backgroundColor: '#22c55e' },
  btnClose: { backgroundColor: '#dc2626' },
  feedbackOpen: { backgroundColor: '#16a34a' },
  feedbackClose: { backgroundColor: '#b91c1c' },
  statusBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  iconBtn: { backgroundColor: '#f1f5f9', width: 32, height: 32, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  iconText: { fontSize: 14 },
  inviteCard: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 10, marginBottom: 10 },
  inviteActionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  choiceBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  acceptBtn: { backgroundColor: '#10b981' },
  rejectBtn: { backgroundColor: '#ef4444' },
  choiceBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' }
});
