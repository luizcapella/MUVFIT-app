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
    // --- ESTADOS DA JANELA DE PESQUISA FLUTUANTE ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('Todos'); // 'Todos', 'Usuários', 'Ligas'
  const [allUsersList, setAllUsersList] = useState([]);
  const [searchResults, setSearchResults] = useState({ users: [], leagues: [] });

  // Busca inicial de usuários cadastrados no app para o filtro de pesquisa
  React.useEffect(() => {
    async function fetchUsers() {
      try {
        const { data } = await supabase.from('profiles').select('id, nickname, avatar_url');
        if (data) setAllUsersList(data);
      } catch (err) {
        console.log('Erro ao carregar usuários para busca:', err);
      }
    }
    fetchUsers();
  }, []);

  // Função dinâmica que processa a digitação e aplica os filtros escolhidos
  const handleSearchTextChange = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults({ users: [], leagues: [] });
      return;
    }

    const term = text.toLowerCase();

    // Filtra Usuários (da tabela profiles carregada na inicialização)
    const filteredUsers = allUsersList.filter(u => 
      u.nickname?.toLowerCase().includes(term)
    );

    // Filtra Ligas (puxando da propriedade global de desafios recebida pelo App.js)
    const filteredLeagues = (desafios || []).filter(l => 
      l.name?.toLowerCase().includes(term) || l.titulo?.toLowerCase().includes(term)
    );

    setSearchResults({
      users: searchFilter === 'Ligas' ? [] : filteredUsers,
      leagues: searchFilter === 'Usuários' ? [] : filteredLeagues
    });
  };


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
            {/* 🚀 JANELA FLUTUANTE DE PESQUISA AVANÇADA (OVERLAY SOBREPOSTO) */}
      <View style={styles.searchHeaderSection}>
        <TouchableOpacity 
          style={styles.triggerSearchBtn} 
          onPress={() => setIsSearchOpen(!isSearchOpen)}
        >
          <Text style={styles.triggerSearchBtnText}>🔍 Pesquisar no App (Ligas e Usuários)</Text>
        </TouchableOpacity>

        {isSearchOpen && (
          <View style={styles.floatingSearchOverlay}>
            <View style={styles.searchBoxHeader}>
              <Text style={styles.searchBoxTitle}>Pesquisa Avançada</Text>
              <TouchableOpacity 
                style={styles.closeSearchBtn} 
                onPress={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                  setSearchResults({ users: [], leagues: [] });
                }}
              >
                <Text style={styles.closeSearchBtnText}>Fechar ❌</Text>
              </TouchableOpacity>
            </View>

            {/* Entrada de Texto */}
            <TextInput
              style={styles.searchInputField}
              placeholder="Digite a liga ou o apelido do atleta..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={handleSearchTextChange}
            />

            {/* Filtros em Abas */}
            <View style={styles.filterTabsRow}>
              {['Todos', 'Usuários', 'Ligas'].map((filterName) => (
                <TouchableOpacity
                  key={filterName}
                  style={[
                    styles.filterTabItem,
                    searchFilter === filterName && styles.filterTabItemActive
                  ]}
                  onPress={() => setSearchFilter(filterName)}
                >
                  <Text style={[
                    styles.filterTabText,
                    searchFilter === filterName && styles.filterTabTextActive
                  ]}>
                    {filterName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Resultados em Rolagem Interna Segura */}
            <ScrollView style={styles.searchResultsScroll} nestedScrollEnabled={true}>
              {searchResults.leagues.map((liga) => (
                <View key={liga.id || liga.eu_ia} style={styles.resultRowItem}>
                  <Text style={styles.resultItemName}>🏆 {liga.name || liga.titulo}</Text>
                  <TouchableOpacity style={styles.resultActionBtn}>
                    <Text style={styles.resultActionBtnText}>Ver Liga</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {searchResults.users.map((user) => (
                <View key={user.id} style={styles.resultRowItem}>
                  <View style={styles.userResultInfo}>
                    <Image source={{ uri: user.avatar_url || 'https://placeholder.com' }} style={styles.userResultAvatar} />
                    <Text style={styles.resultItemName}>👤 {user.nickname || 'Atleta'}</Text>
                  </View>
                  <TouchableOpacity style={[styles.resultActionBtn, { backgroundColor: '#1e3a8a' }]}>
                    <Text style={styles.resultActionBtnText}>Ver Perfil</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {searchQuery.trim() !== '' && searchResults.users.length === 0 && searchResults.leagues.length === 0 && (
                <Text style={styles.noResultsText}>Nenhum resultado encontrado.</Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>

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
  iconText: { fontSize: 13 },
    searchHeaderSection: { width: '100%', marginBottom: 16, zIndex: 999 },
  triggerSearchBtn: { width: '100%', backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  triggerSearchBtnText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  floatingSearchOverlay: { position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: '#ffffff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#cbd5e1', zIndex: 1000, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
  searchBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  searchBoxTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  closeSearchBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  closeSearchBtnText: { fontSize: 12, color: '#ef4444', fontWeight: 'bold' },
  searchInputField: { width: '100%', height: 40, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 12, fontSize: 13, color: '#1e293b', backgroundColor: '#f8fafc', marginBottom: 12 },
  filterTabsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterTabItem: { flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: '#f1f5f9', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  filterTabItemActive: { backgroundColor: '#1e3a8a', borderColor: '#1e3a8a' },
  filterTabText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  filterTabTextActive: { color: '#ffffff' },
  searchResultsScroll: { maxHeight: 200, width: '100%' },
  resultRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  resultItemName: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  userResultInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userResultAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#cbd5e1' },
  resultActionBtn: { backgroundColor: '#f97316', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  resultActionBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  noResultsText: { fontSize: 12, color: '#64748b', fontStyle: 'italic', textAlign: 'center', marginTop: 10 }
});
