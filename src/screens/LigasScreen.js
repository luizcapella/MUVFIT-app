// src/screens/LigasScreen.js (Parte 1 de 3)
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Share } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function LigasScreen({ challenges, memberships, currentUser, handleSignOut, fetchDataFromSupabase, setSelectedLeagueFilter }) {
  const [isAdminSectionOpen, setIsAdminSectionOpen] = useState(true);
  const [isParticipantSectionOpen, setIsParticipantSectionOpen] = useState(true);
  const [isInvitesSectionOpen, setIsInvitesSectionOpen] = useState(true);

  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [invitesReceived, setInvitesReceived] = useState([]);

  // 1. FUNÇÃO: CRIAR DESAFIO / LIGA REAL CONECTADA
  async function handleCreateChallenge() {
    if (!newTitle.trim()) {
      Alert.alert('Atenção', 'Por favor, digite o nome da liga.');
      return;
    }
    setIsCreating(true);
    try {
      // Aciona o gatilho RPC puro criado no banco de dados, ignorando travas de outras tabelas
      const { error } = await supabase.rpc('criar_desafio_direto', {
        nome_liga: newTitle.trim(),
        criador_id: currentUser?.id
      });

      if (error) {
        Alert.alert('Erro ao criar liga', error.message);
        return;
      }

      Alert.alert('Sucesso! 🏆', `A liga "${newTitle}" foi criada com sucesso!`);
      setNewTitle('');
      if (fetchDataFromSupabase) {
        await fetchDataFromSupabase();
      }
    } catch (err) {
      console.log('Erro interno na gravação:', err);
    } finally {
      setIsCreating(false);
    }
  }


  // 2. FUNÇÃO: ALTERAR STATUS DE INSCRIÇÃO (ABERTO / FECHADO) REAL CONECTADA
  async function handleToggleInscription(challengeId, currentStatus) {
    const nextStatus = currentStatus === 'Fechado' ? 'Aberto' : 'Fechado';
    try {
      const { error } = await supabase
        .from('challenges_v2')
        .update({ status_inscription: nextStatus })
        .eq('id', challengeId);

      if (error) {
        Alert.alert('Erro ao mudar status', error.message);
        return;
      }

      Alert.alert('Status Alterado! ⚙️', `As inscrições para esta liga agora estão: ${nextStatus}`);
      if (fetchDataFromSupabase) await fetchDataFromSupabase();
    } catch (err) {
      console.log(err);
    }
  }
  // 3. FUNÇÃO: REMOVER LIGA DEFINITIVAMENTE DO BANCO DE DADOS
  async function handleRemoveChallenge(challengeId) {
    Alert.alert(
      'Excluir Liga 🗑️',
      'Tem certeza de que deseja deletar permanentemente esta liga da base de dados do MuvFit?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir de Vez',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('challenges').delete().eq('id', challengeId);
              if (error) {
                Alert.alert('Erro ao remover', error.message);
                return;
              }
              Alert.alert('Removida!', 'A liga foi excluída com sucesso do banco de dados.');
              if (fetchDataFromSupabase) await fetchDataFromSupabase();
            } catch (err) {
              console.log(err);
            }
          }
        }
      ]
    );
  }

  // 4. FUNÇÃO: COMPARTILHAR LINK DE CONVITE NATIVO
  async function handleInviteShare(challengeTitle, challengeId) {
    try {
      await Share.share({
        message: `Venha participar da minha liga "${challengeTitle}" no MuvFit! Acesse o app pelo link oficial: https://vercel.app{challengeId}`,
      });
    } catch (error) {
      console.log(error.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* BOX: CRIAR NOVO DESAFIO */}
      <View style={styles.createCard}>
        <Text style={styles.cardHeader}>🟩 Criar Novo Desafio</Text>
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
      <TouchableOpacity style={styles.accordionHeader} onPress={() => setIsAdminSectionOpen(!isAdminSectionOpen)}>
        <Text style={styles.accordionTitle}>🔑 Ligas Que Administra</Text>
        <Text style={styles.accordionArrow}>{isAdminSectionOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isAdminSectionOpen && (
        <View style={styles.accordionContent}>
                    {(!challenges || challenges.filter(c => (c.creator_id === currentUser?.id || c.created_by === currentUser?.id)).length === 0) ? (
            <Text style={styles.emptyText}>Você não administra nenhuma liga atualmente.</Text>
          ) : (
          challenges.filter(c => (c.creator_id === currentUser?.id || c.created_by === currentUser?.id)).map((liga) => {
              const isOpen = (liga.status_inscription || 'Aberto') === 'Aberto';
              return (
                <View key={liga.id} style={styles.ligaRow}>
                  <View style={styles.ligaMeta}>
                    <TouchableOpacity onPress={() => {
                      if (setSelectedLeagueFilter) setSelectedLeagueFilter(liga.id);
                      Alert.alert('MuvFit Ligas 🏆', `Você ativou a visualização da liga: ${liga.title}. O desempenho detalhado dela já foi carregado na aba Atleta!`);
                    }}>
                      <Text style={styles.ligaTitleLink}>{liga.title}</Text>
                    </TouchableOpacity>
                    <Text style={styles.ligaDate}>Criada em: {liga.created_at ? liga.created_at.substring(0, 10) : '2026-09-28'}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    <TouchableOpacity 
                      style={[styles.statusBtn, isOpen ? styles.btnOpen : styles.btnClose]}
                      onPress={() => handleToggleInscription(liga.id, liga.status_inscription || 'Aberto')}
                    >
                      <Text style={styles.statusBtnText}>{isOpen ? 'Aberto' : 'Fechado'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleInviteShare(liga.title, liga.id)}>
                      <Text style={styles.iconText}>🔗</Text>
                    </TouchableOpacity>

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
      <TouchableOpacity style={styles.accordionHeader} onPress={() => setIsParticipantSectionOpen(!isParticipantSectionOpen)}>
        <Text style={styles.accordionTitle}>⚡ Ligas em que Participo</Text>
        <Text style={styles.accordionArrow}>{isParticipantSectionOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isParticipantSectionOpen && (
        <View style={styles.accordionContent}>
                   {(!challenges || challenges.filter(c => (c.creator_id !== currentUser?.id && c.created_by !== currentUser?.id)).length === 0) ? (
            <Text style={styles.emptyText}>Você não está participando de outras ligas ainda.</Text>
          ) : (
            challenges.filter(c => (c.creator_id !== currentUser?.id && c.created_by !== currentUser?.id)).map((liga) => {
              const isOpen = (liga.status_inscription || 'Aberto') === 'Aberto';
              return (
                <View key={liga.id} style={styles.ligaRow}>
                  <View style={styles.ligaMeta}>
                    <TouchableOpacity onPress={() => {
                      if (setSelectedLeagueFilter) setSelectedLeagueFilter(liga.id);
                      Alert.alert('MuvFit Ligas 🏆', `Você ativou a visualização da liga: ${liga.title}. O desempenho detalhado dela já foi carregado na aba Atleta!`);
                    }}>
                      <Text style={styles.ligaTitleLink}>{liga.title}</Text>
                    </TouchableOpacity>
                    <Text style={styles.ligaDate}>Criada em: {liga.created_at ? liga.created_at.substring(0, 10) : '2026-09-28'}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    <View style={[styles.statusFeedback, isOpen ? styles.feedbackOpen : styles.feedbackClose]}>
                      <Text style={styles.statusBtnText}>{isOpen ? 'Aberto' : 'Fechado'}</Text>
                    </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc', paddingBottom: 100 },
  headerTopBarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, backgroundColor: '#1e3a8a', padding: 12, borderRadius: 8 },
  headerTopBarTitle: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  signOutTopBtn: { backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  signOutTopBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  createCard: { backgroundColor: '#ffffff', padding: 14, borderRadius: 10, marginBottom: 16, borderWidth: 1, borderColor: '#cbd5e1' },
  cardHeader: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 10, height: 40, fontSize: 13, color: '#0f172a' },
  createBtn: { backgroundColor: '#f97316', paddingHorizontal: 18, borderRadius: 6, justifyContent: 'center' },
  createBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e2e8f0', padding: 12, borderRadius: 8, marginTop: 12 },
  accordionTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a' },
  accordionArrow: { fontSize: 11, color: '#475569' },
  accordionContent: { backgroundColor: '#ffffff', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', borderTopWidth: 0 },
  emptyText: { fontSize: 12, color: '#64748b', fontStyle: 'italic', padding: 6 },
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
  iconText: { fontSize: 13 }
});
