import { supabase } from './supabaseClient';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  Modal,
  Alert,
  Share,
  Platform,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  // GERENCIAMENTO DE SESSÃO REAL DO SUPABASE
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // ESTADOS DE AUTENTICAÇÃO
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authNickname, setAuthNickname] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // ATLETA CONECTADO
  const [currentUser, setCurrentUser] = useState(null);
  const [viewedUser, setViewedUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  
  // PESQUISA FUNCIONAL COM OVERLAY CORRIGIDO (Z-INDEX 9999)
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // MODAIS SELETORAS NATIVAS
  const [isHeaderSelectOpen, setIsHeaderSelectOpen] = useState(false);
  const [isPerfScopeSelectOpen, setIsPerfScopeSelectOpen] = useState(false);
  const [isManualAthleteSelectOpen, setIsManualAthleteSelectOpen] = useState(false);
  const [isManualActivitySelectOpen, setIsManualActivitySelectOpen] = useState(false);
  const [isEditingChallengeSelectOpen, setIsEditingChallengeSelectOpen] = useState(false);
  const [isRuleTabSelectOpen, setIsRuleTabSelectOpen] = useState(false);

  // SELETORES DE HORÁRIO NATIVOS
  const [isStartHourSelectOpen, setIsStartHourSelectOpen] = useState(false);
  const [isStartMinSelectOpen, setIsStartMinSelectOpen] = useState(false);
  const [isEndHourSelectOpen, setIsEndHourSelectOpen] = useState(false);
  const [isEndMinSelectOpen, setIsEndMinSelectOpen] = useState(false);

  // SELETOR DE DURAÇÃO
  const [isDurationSelectOpen, setIsDurationSelectOpen] = useState(false);
  const [newChallengeDuration, setNewChallengeDuration] = useState('Mensal');

  // LIGAS E ESTRUTURA
  const [challenges, setChallenges] = useState([
    {
      id: 'c1',
      title: 'Liga Anti-Inércia 2026',
      invite_code: 'ANTI2026',
      creator_id: 'usr_capella',
      duration_type: 'Mensal',
      season_number: 1,
      has_daily_cap: true,
      daily_cap: 22000,
      registrations_closed: false,
      is_finished: false,
      season_ended_pending: false,
      startDate: '01/09/2026',
      endDate: '30/09/2026',
      hallOfFame: [],
      rules: {
        musculacao: { enabled: true, mode: 'steps', minMinutes: 30, minPoints: 5000 },
        corrida: { enabled: true, mode: 'km', minKm: 3, minKmPoints: 5000 }
      }
    }
  ]);

  const [activeChallengeId, setActiveChallengeId] = useState('c1');
  const [isAdminContext, setIsAdminContext] = useState(true);

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0];

  // PARTICIPANTES (FORMATADOS EM LINHA HORIZONTAL LIMPA)
  const [memberships, setMemberships] = useState([
    { challengeId: 'c1', userId: 'usr_capella', name: 'Luiz Capella', nickname: 'Poke', role: 'active', rankingPoints: 22000, bankPoints: 15400, totalSteps: 42350, avatar: 'https://picsum.photos/seed/poke/200/200', goldMedals: 3, silverMedals: 1, bronzeMedals: 0, age: 34, gender: 'Masculino' },
    { challengeId: 'c1', userId: 'm_usr2', name: 'Rafael Souza', nickname: 'Rafa', role: 'active', rankingPoints: 14000, bankPoints: 2000, totalSteps: 31000, avatar: 'https://picsum.photos/seed/rafa/100/100', goldMedals: 2, silverMedals: 2, bronzeMedals: 1, age: 29, gender: 'Masculino' }
  ]);

  const [pendingParticipants, setPendingParticipants] = useState([
    { challengeId: 'c1', id: 'p_usr3', name: 'Lucas Mendes', nickname: 'Luquinhas', avatar: 'https://picsum.photos/seed/lucas/100/100', age: 25, gender: 'Masculino' }
  ]);

  // CHECAGEM DE SESSÃO DO SUPABASE
  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        await ImagePicker.requestCameraPermissionsAsync();
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
    })();

    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      setSession(activeSession);
      if (activeSession) {
        loadUserProfile(activeSession.user);
      } else {
        setLoadingSession(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      setSession(activeSession);
      if (activeSession) {
        loadUserProfile(activeSession.user);
      } else {
        setCurrentUser(null);
        setViewedUser(null);
        setLoadingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(user) {
    try {
      const userObj = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        nickname: user.user_metadata?.nickname || 'Atleta',
        age: 34,
        gender: 'Masculino',
        avatar: user.user_metadata?.avatar || 'https://picsum.photos/seed/' + user.id + '/200/200',
        isAdmin: true
      };
      setCurrentUser(userObj);
      setViewedUser(userObj);
    } catch (err) {
      console.log('Erro ao carregar perfil:', err);
    } finally {
      setLoadingSession(false);
    }
  }

  function handleApprovePending(participant, targetRole) {
    setPendingParticipants(pendingParticipants.filter(p => p.id !== participant.id));
    setMemberships([
      ...memberships,
      { challengeId: activeChallengeId, userId: participant.id, name: participant.name, nickname: participant.nickname, role: targetRole, rankingPoints: 0, bankPoints: 0, totalSteps: 0, avatar: participant.avatar }
    ]);
    Alert.alert('Aprovado!', `${participant.name} adicionado como ${targetRole === 'active' ? 'Atleta Ativo' : 'Torcedor'}.`);
  }

  function handleDemoteToSpectator(memberId) {
    setMemberships(memberships.map(m => (m.challengeId === activeChallengeId && m.userId === memberId) ? { ...m, role: 'spectator' } : m));
  }

  function handlePromoteToActive(memberId) {
    setMemberships(memberships.map(m => (m.challengeId === activeChallengeId && m.userId === memberId) ? { ...m, role: 'active' } : m));
  }

  function handleRemoveFromChallenge(memberId) {
    setMemberships(memberships.filter(m => !(m.challengeId === activeChallengeId && m.userId === memberId)));
  }

  if (loadingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Conectando ao MUVFIT...</Text>
      </View>
    );
  }

  if (!session || !currentUser) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <ScrollView contentContainerStyle={styles.authContent}>
          <Text style={styles.authBrandTitle}>MUVFIT</Text>
          <Text style={styles.authBrandSubtitle}>Mizan Soluções Técnicas</Text>
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>🔑 Entrar no Aplicativo</Text>
            <Text style={styles.inputLabel}>E-mail:</Text>
            <TextInput style={styles.input} placeholder="seuemail@exemplo.com" value={authEmail} onChangeText={setAuthEmail} />
            <Text style={styles.inputLabel}>Senha:</Text>
            <TextInput style={styles.input} placeholder="••••••••" secureTextEntry value={authPassword} onChangeText={setAuthPassword} />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => {}}>
              <Text style={styles.primaryBtnText}>ENTRAR</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentChallengeMembers = memberships.filter(m => m.challengeId === activeChallengeId);
  const currentPendingParticipants = pendingParticipants.filter(p => p.challengeId === activeChallengeId);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER E OVERLAY DE BUSCA Z-INDEX 9999 */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>MUVFIT</Text>
          <Text style={styles.brandSubtitle}>Mizan Soluções Técnicas</Text>
        </View>

        <View style={{ width: '100%', zIndex: 9999 }}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Pesquisar Atletas ou Ligas..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChangeText={(txt) => {
              setSearchQuery(txt);
              if (!isSearchOpen) setIsSearchOpen(true);
            }}
          />

          {isSearchOpen && (
            <View style={styles.searchResultsDropdown}>
              <View style={styles.searchHeaderTop}>
                <Text style={styles.searchHeaderTitle}>🔎 Pesquisa Geral no MUVFIT</Text>
                <TouchableOpacity onPress={() => setIsSearchOpen(false)} style={styles.closeSearchBtn}>
                  <Text style={styles.closeSearchText}>✕ FECHAR</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 200 }}>
                {memberships.map((m) => (
                  <TouchableOpacity key={m.userId} style={styles.searchResultItem} onPress={() => setIsSearchOpen(false)}>
                    <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                    <View style={{ marginLeft: 8, flex: 1 }}>
                      <Text style={styles.searchResultTitle}>{m.name} ({m.nickname})</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* SIDEBAR */}
        <View style={styles.sidebar}>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'dashboard' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('dashboard')}>
            <Text style={styles.sidebarIcon}>🏠</Text>
            <Text style={[styles.sidebarText, currentScreen === 'dashboard' && styles.sidebarTextActive]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'admin' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('admin')}>
            <Text style={styles.sidebarIcon}>⚙️</Text>
            <Text style={[styles.sidebarText, currentScreen === 'admin' && styles.sidebarTextActive]}>Admin</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
          {/* PAINEL ADMIN COM CORREÇÃO VISUAL EM LINHA HORIZONTAL DOS INTEGRANTES */}
          {currentScreen === 'admin' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={styles.pageTitle}>⚙️ Administração de Membros</Text>

              {/* CARDS DE ATLETAS PENDENTES EM LINHA HORIZONTAL */}
              {currentPendingParticipants.length > 0 && (
                <View style={styles.adminControlCard}>
                  <Text style={styles.adminCardTitle}>📩 Atletas Pendentes ({currentPendingParticipants.length})</Text>
                  {currentPendingParticipants.map((p) => (
                    <View key={p.id} style={styles.participantRow}>
                      <Image source={{ uri: p.avatar }} style={styles.avatarMini} />
                      <View style={styles.participantInfoBox}>
                        <Text style={styles.participantName} numberOfLines={1}>{p.name}</Text>
                        <Text style={styles.participantSub}>({p.nickname}) • Aguardando</Text>
                      </View>
                      <View style={styles.actionButtonsRow}>
                        <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprovePending(p, 'active')}>
                          <Text style={styles.btnMiniText}>⚡ ATLETA</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.demoteBtn} onPress={() => handleApprovePending(p, 'spectator')}>
                          <Text style={styles.btnMiniText}>👀 TORCEDOR</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* CARDS DE GERENCIAMENTO DE MEMBROS CORRIGIDOS NA HORIZONTAL */}
              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>👥 Gerenciamento de Membros</Text>
                {currentChallengeMembers.map((m) => (
                  <View key={m.userId} style={styles.participantRow}>
                    <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                    <View style={styles.participantInfoBox}>
                      <Text style={styles.participantName} numberOfLines={1}>{m.name} ({m.nickname})</Text>
                      <Text style={m.role === 'active' ? styles.tagActiveText : styles.tagSpectatorText}>
                        {m.role === 'active' ? '⚡ Atleta Ativo' : '👀 Torcedor'}
                      </Text>
                    </View>

                    <View style={styles.actionButtonsRow}>
                      {m.role === 'spectator' ? (
                        <TouchableOpacity style={styles.approveBtn} onPress={() => handlePromoteToActive(m.userId)}>
                          <Text style={styles.btnMiniText}>⚡ ATLETA</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={styles.demoteBtn} onPress={() => handleDemoteToSpectator(m.userId)}>
                          <Text style={styles.btnMiniText}>👀 TORCEDOR</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.banBtn} onPress={() => handleRemoveFromChallenge(m.userId)}>
                        <Text style={styles.btnMiniText}>❌ REMOVER</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 12, fontWeight: 'bold', color: '#1e3a8a' },

  authContainer: { flex: 1, backgroundColor: '#1e3a8a' },
  authContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  authBrandTitle: { fontSize: 32, fontWeight: '900', color: '#f97316', textAlign: 'center' },
  authBrandSubtitle: { fontSize: 12, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 20 },
  authCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 18 },
  authTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 14, textAlign: 'center' },

  topHeader: { padding: 12, backgroundColor: '#1e3a8a', zIndex: 9999, elevation: 10 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  brandTitle: { fontSize: 20, fontWeight: '900', color: '#f97316' },
  brandSubtitle: { fontSize: 10, fontWeight: 'bold', color: '#ffffff' },

  searchInput: { backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 8 : 4, fontSize: 11, color: '#0f172a', borderWidth: 1, borderColor: '#cbd5e1' },
  searchResultsDropdown: { position: 'absolute', top: 40, left: 0, right: 0, backgroundColor: '#ffffff', borderRadius: 8, padding: 10, borderWidth: 2, borderColor: '#f97316', elevation: 10, zIndex: 9999 },
  searchHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
  searchHeaderTitle: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' },
  closeSearchBtn: { backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  closeSearchText: { fontSize: 8, color: '#dc2626', fontWeight: 'bold' },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchResultTitle: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },

  sidebar: { width: 110, backgroundColor: '#f8fafc', borderRightWidth: 1, borderRightColor: '#cbd5e1', paddingVertical: 10 },
  sidebarBtn: { paddingVertical: 12, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  sidebarBtnActive: { backgroundColor: '#ffffff', borderLeftWidth: 4, borderLeftColor: '#f97316' },
  sidebarIcon: { fontSize: 12 },
  sidebarText: { fontSize: 9, fontWeight: 'bold', color: '#64748b' },
  sidebarTextActive: { color: '#f97316' },

  mainContent: { padding: 12 },
  pageTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginVertical: 8 },

  adminControlCard: { backgroundColor: '#fff7ed', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#f97316', marginBottom: 12 },
  adminCardTitle: { fontSize: 12, fontWeight: 'bold', color: '#c2410c', marginBottom: 6 },

  // ESTRUTURA HORIZONTAL DOS MEMBROS (CORRIGE TEXTO VERTICAL)
  participantRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#fed7aa', marginTop: 6 },
  avatarMini: { width: 34, height: 34, borderRadius: 17 },
  participantInfoBox: { flex: 1, marginLeft: 8, paddingRight: 4 },
  participantName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  participantSub: { fontSize: 9, color: '#64748b' },
  tagActiveText: { fontSize: 9, color: '#16a34a', fontWeight: 'bold' },
  tagSpectatorText: { fontSize: 9, color: '#1e3a8a', fontWeight: 'bold' },

  actionButtonsRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  approveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  demoteBtn: { backgroundColor: '#d97706', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  banBtn: { backgroundColor: '#dc2626', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  btnMiniText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },

  primaryBtn: { backgroundColor: '#f97316', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#475569', marginVertical: 4 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 8, fontSize: 11, marginBottom: 8 }
});
