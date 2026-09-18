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
  
  // PESQUISA FUNCIONAL
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

  // SELETOR DE DURAÇÃO DO DESAFIO (ETAPA 4)
  const [isDurationSelectOpen, setIsDurationSelectOpen] = useState(false);
  const [newChallengeDuration, setNewChallengeDuration] = useState('Mensal');

  // REGRAS E ESTRUTURA COMPLETA DAS LIGAS COM DURAÇÃO E TEMPORADAS (ETAPA 4)
  const [challenges, setChallenges] = useState([
    {
      id: 'c1',
      title: 'Liga Anti-Inércia 2026',
      invite_code: 'ANTI2026',
      creator_id: 'usr_capella',
      duration_type: 'Mensal', // Semanal, Mensal, Semestral, Anual
      season_number: 1,
      has_daily_cap: true,
      daily_cap: 22000,
      registrations_closed: false,
      is_finished: false,
      season_ended_pending: true, // Notificação para o Admin se a temporada venceu
      startDate: '01/09/2026',
      endDate: '30/09/2026',
      hallOfFame: [
        { season: 'Temporada 0 (Piloto)', champions: ['Luiz Capella (1º)', 'Rafael Souza (2º)', 'Carlos Eduardo (3º)'] }
      ],
      rules: {
        musculacao: { enabled: true, mode: 'steps', minMinutes: 30, minPoints: 5000 },
        corrida: { enabled: true, mode: 'km', minKm: 3, minKmPoints: 5000 }
      }
    }
  ]);

  const [activeChallengeId, setActiveChallengeId] = useState('c1');
  const [isAdminContext, setIsAdminContext] = useState(true);

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0];

  // PARTICIPANTES E DADOS
  const [memberships, setMemberships] = useState([
    { challengeId: 'c1', userId: 'usr_capella', name: 'Luiz Capella', nickname: 'Poke', role: 'active', rankingPoints: 22000, bankPoints: 15400, totalSteps: 42350, avatar: 'https://picsum.photos/seed/poke/200/200', goldMedals: 3, silverMedals: 1, bronzeMedals: 0, age: 34, gender: 'Masculino', insigniaInquebravelCount: 3, insigniaDespertaCount: 1 }
  ]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [pendingWorkouts, setPendingWorkouts] = useState([]);

  // FORMULÁRIO DE TREINO
  const getTodayFormatted = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('musculacao');
  const [workoutDate, setWorkoutDate] = useState(getTodayFormatted());
  const [startHour, setStartHour] = useState('08');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('09');
  const [endMin, setEndMin] = useState('00');
  const [workoutCaption, setWorkoutCaption] = useState('');
  const [photoEvidence, setPhotoEvidence] = useState(null);

  // CRIAR NOVO DESAFIO
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeCode, setNewChallengeCode] = useState('');
  const [hasCapToggle, setHasCapToggle] = useState(false);
  const [newChallengeCap, setNewChallengeCap] = useState('22000');

  // STORIES
  const [stories, setStories] = useState([]);
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);

  // CHECAGEM DE SESSÃO
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
        isAdmin: true,
        goldMedals: 3,
        silverMedals: 1,
        bronzeMedals: 0
      };
      setCurrentUser(userObj);
      setViewedUser(userObj);
    } catch (err) {
      console.log('Erro ao carregar perfil:', err);
    } finally {
      setLoadingSession(false);
    }
  }

  // FUNÇÃO DE REINICIAR TEMPORADA (ETAPA 4)
  function handleStartNewSeason(challengeId) {
    const targetChallenge = challenges.find(c => c.id === challengeId);
    if (!targetChallenge) return;

    Alert.alert(
      '🏆 Iniciar Nova Temporada',
      `Deseja encerrar a Temporada ${targetChallenge.season_number || 1} e zerar a pontuação para a nova temporada?\n\n(Os campeões atuais serão registrados no Hall da Fama e as estatísticas acumuladas dos atletas permanecerão salvas).`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Iniciar Nova Temporada',
          onPress: () => {
            // 1. Salvar Top 3 Campeões no Hall da Fama
            const currentMembers = memberships.filter(m => m.challengeId === challengeId);
            const top3 = [...currentMembers].sort((a,b) => b.rankingPoints - a.rankingPoints).slice(0, 3);
            const championNames = top3.map((m, idx) => `${m.name} (${idx + 1}º lugar)`);

            const newHallEntry = {
              season: `Temporada ${targetChallenge.season_number || 1}`,
              champions: championNames.length > 0 ? championNames : ['Sem participantes']
            };

            // 2. Atualizar o Desafio (Incrementar Temporada e Limpar Notificação)
            setChallenges(challenges.map(c => {
              if (c.id === challengeId) {
                return {
                  ...c,
                  season_number: (c.season_number || 1) + 1,
                  season_ended_pending: false,
                  hallOfFame: [newHallEntry, ...(c.hallOfFame || [])]
                };
              }
              return c;
            }));

            // 3. Zerar apenas a pontuação do ranking e banco da liga atual para a nova temporada
            setMemberships(memberships.map(m => {
              if (m.challengeId === challengeId) {
                return {
                  ...m,
                  rankingPoints: 0,
                  bankPoints: 0
                };
              }
              return m;
            }));

            Alert.alert('🚀 Nova Temporada Iniciada!', `A Temporada ${(targetChallenge.season_number || 1) + 1} começou. A pontuação foi zerada e o histórico foi arquivado.`);
          }
        }
      ]
    );
  }

  // CÂMERA E GALERIA
  async function pickImageFromGallery(setPhotoState) {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoState(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível acessar a galeria.');
    }
  }

  async function takePhotoWithCamera(setPhotoState) {
    try {
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoState(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    }
  }

  const MediaPickerField = ({ label, photoState, setPhotoState }) => (
    <View style={styles.mediaFieldBox}>
      <Text style={styles.mediaLabel}>{label}</Text>
      <View style={styles.mediaButtonsRow}>
        <TouchableOpacity style={styles.cameraBtn} onPress={() => takePhotoWithCamera(setPhotoState)}>
          <Text style={styles.mediaBtnText}>📷 TIRAR FOTO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryBtn} onPress={() => pickImageFromGallery(setPhotoState)}>
          <Text style={styles.mediaBtnText}>🖼️ GALERIA</Text>
        </TouchableOpacity>
      </View>

      {photoState ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoState }} style={styles.previewImage} />
          <View style={{ flex: 1 }}>
            <Text style={styles.previewSuccessText}>✅ Imagem Selecionada</Text>
            <TouchableOpacity style={styles.deleteMediaBtn} onPress={() => setPhotoState(null)}>
              <Text style={styles.deleteMediaBtnText}>🗑️ APAGAR / TROCAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.previewPendingText}>Pendente</Text>
      )}
    </View>
  );

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minsList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

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
            <Text style={styles.authTitle}>{authMode === 'login' ? '🔑 Entrar no Aplicativo' : '📝 Criar Conta'}</Text>
            <Text style={styles.inputLabel}>E-mail:</Text>
            <TextInput style={styles.input} placeholder="seuemail@exemplo.com" value={authEmail} onChangeText={setAuthEmail} />
            <Text style={styles.inputLabel}>Senha:</Text>
            <TextInput style={styles.input} placeholder="••••••••" secureTextEntry value={authPassword} onChangeText={setAuthPassword} />

            <TouchableOpacity style={styles.primaryBtn} onPress={() => {}}>
              <Text style={styles.primaryBtnText}>{authMode === 'login' ? 'ENTRAR' : 'CRIAR MINHA CONTA'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const userMembershipsAll = memberships.filter(m => m.userId === currentUser.id);
  const hasUserAnyCommunity = userMembershipsAll.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>MUVFIT</Text>
          <Text style={styles.brandSubtitle}>Mizan Soluções Técnicas</Text>
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* SIDEBAR */}
        <View style={styles.sidebar}>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'dashboard' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('dashboard')}>
            <Text style={styles.sidebarIcon}>🏠</Text>
            <Text style={[styles.sidebarText, currentScreen === 'dashboard' && styles.sidebarTextActive]}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'athlete_center' && styles.sidebarBtnActive]} onPress={() => { setViewedUser(currentUser); setCurrentScreen('athlete_center'); }}>
            <Text style={styles.sidebarIcon}>👤</Text>
            <Text style={[styles.sidebarText, currentScreen === 'athlete_center' && styles.sidebarTextActive]}>Atleta</Text>
          </TouchableOpacity>

          {isAdminContext && (
            <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'admin' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('admin')}>
              <Text style={styles.sidebarIcon}>⚙️</Text>
              <Text style={[styles.sidebarText, currentScreen === 'admin' && styles.sidebarTextActive]}>Admin</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
          {currentScreen === 'dashboard' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={styles.pageTitle}>Painel Geral de Ligas</Text>
                <TouchableOpacity style={styles.createChallengeBtnHeader} onPress={() => setIsCreateChallengeOpen(true)}>
                  <Text style={styles.createChallengeBtnText}>+ NOVO DESAFIO</Text>
                </TouchableOpacity>
              </View>

              {challenges.map(c => (
                <View key={c.id} style={styles.cardBox}>
                  <Text style={styles.cardBoxTitle}>{c.title} (Temporada {c.season_number || 1})</Text>
                  <Text style={styles.cardBoxSub}>Duração: {c.duration_type || 'Mensal'} | Código: {c.invite_code}</Text>
                  
                  {c.hallOfFame && c.hallOfFame.length > 0 && (
                    <View style={styles.hallOfFameBox}>
                      <Text style={styles.hallOfFameTitle}>🏛️ HALL DA FAMA (Campeões Anteriores):</Text>
                      {c.hallOfFame.map((hf, idx) => (
                        <Text key={idx} style={styles.hallOfFameText}>• {hf.season}: {hf.champions.join(', ')}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          {/* TELA ADMIN COM NOTIFICAÇÃO DE NOVA TEMPORADA (ETAPA 4) */}
          {currentScreen === 'admin' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={styles.pageTitle}>⚙️ Painel de Administração — {selectedChallenge.title}</Text>

              {/* PAINEL DESTACADO DE NOVA TEMPORADA */}
              <View style={styles.seasonNoticeBox}>
                <Text style={styles.seasonNoticeTitle}>🏆 Fim de Temporada / Ciclo da Liga</Text>
                <Text style={styles.seasonNoticeSub}>
                  Temporada Atual: {selectedChallenge.season_number || 1} ({selectedChallenge.duration_type || 'Mensal'})
                </Text>
                <TouchableOpacity 
                  style={styles.startSeasonBtn} 
                  onPress={() => handleStartNewSeason(selectedChallenge.id)}
                >
                  <Text style={styles.startSeasonBtnText}>🚀 INICIAR NOVA TEMPORADA (RESETA PONTOS & ARQUIVA PÓDIO)</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* MODAL CRIAR DESAFIO COM SELETOR DE DURAÇÃO (ETAPA 4) */}
      <Modal visible={isCreateChallengeOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Novo Desafio / Liga</Text>
            <TextInput style={styles.input} placeholder="Nome do Desafio" value={newChallengeTitle} onChangeText={setNewChallengeTitle} />
            <TextInput style={styles.input} placeholder="Código (Ex: OUT2026)" value={newChallengeCode} onChangeText={setNewChallengeCode} />

            <Text style={styles.inputLabel}>Selecione a Duração do Desafio:</Text>
            <TouchableOpacity style={styles.nativeSelectButton} onPress={() => setIsDurationSelectOpen(true)}>
              <Text style={styles.nativeSelectButtonText}>Duração: {newChallengeDuration} ▼</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => {
              if (newChallengeTitle && newChallengeCode) {
                const newId = `c_${Date.now()}`;
                setChallenges([...challenges, {
                  id: newId,
                  title: newChallengeTitle,
                  invite_code: newChallengeCode.toUpperCase(),
                  creator_id: currentUser.id,
                  duration_type: newChallengeDuration,
                  season_number: 1,
                  has_daily_cap: false,
                  hallOfFame: []
                }]);
                setIsCreateChallengeOpen(false);
                setNewChallengeTitle('');
                setNewChallengeCode('');
                Alert.alert('Sucesso', 'Novo desafio criado com sucesso!');
              }
            }}>
              <Text style={styles.primaryBtnText}>CRIAR DESAFIO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreateChallengeOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL NATIVO SELETOR DE DURAÇÃO */}
      <Modal visible={isDurationSelectOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsDurationSelectOpen(false)}>
          <View style={styles.modalContentSelect}>
            <Text style={styles.modalTitle}>Escolha a Duração do Desafio</Text>
            {['Semanal', 'Mensal', 'Semestral', 'Anual'].map(dur => (
              <TouchableOpacity key={dur} style={styles.selectOptionRow} onPress={() => { setNewChallengeDuration(dur); setIsDurationSelectOpen(false); }}>
                <Text style={styles.selectOptionText}>📆 Desafio {dur}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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

  topHeader: { padding: 12, backgroundColor: '#1e3a8a' },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandTitle: { fontSize: 20, fontWeight: '900', color: '#f97316' },
  brandSubtitle: { fontSize: 10, fontWeight: 'bold', color: '#ffffff' },

  sidebar: { width: 110, backgroundColor: '#f8fafc', borderRightWidth: 1, borderRightColor: '#cbd5e1', paddingVertical: 10 },
  sidebarBtn: { paddingVertical: 12, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  sidebarBtnActive: { backgroundColor: '#ffffff', borderLeftWidth: 4, borderLeftColor: '#f97316' },
  sidebarIcon: { fontSize: 12 },
  sidebarText: { fontSize: 9, fontWeight: 'bold', color: '#64748b' },
  sidebarTextActive: { color: '#f97316' },

  mainContent: { padding: 12 },
  pageTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginVertical: 8 },

  createChallengeBtnHeader: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  createChallengeBtnText: { color: '#ffffff', fontSize: 9, fontWeight: 'bold' },

  cardBox: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  cardBoxTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  cardBoxSub: { fontSize: 10, color: '#64748b', marginVertical: 2 },

  hallOfFameBox: { backgroundColor: '#fef3c7', borderRadius: 6, padding: 8, marginTop: 6, borderWidth: 1, borderColor: '#f59e0b' },
  hallOfFameTitle: { fontSize: 10, fontWeight: 'bold', color: '#92400e', marginBottom: 2 },
  hallOfFameText: { fontSize: 9, color: '#78350f' },

  seasonNoticeBox: { backgroundColor: '#fff7ed', borderRadius: 10, padding: 12, borderWidth: 2, borderColor: '#f97316', marginBottom: 12 },
  seasonNoticeTitle: { fontSize: 13, fontWeight: 'bold', color: '#c2410c' },
  seasonNoticeSub: { fontSize: 10, color: '#475569', marginVertical: 4 },
  startSeasonBtn: { backgroundColor: '#16a34a', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  startSeasonBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },

  nativeSelectButton: { backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 8 },
  nativeSelectButtonText: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },
  selectOptionRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  selectOptionText: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },

  mediaFieldBox: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 8, marginBottom: 8 },
  mediaLabel: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 6 },
  mediaButtonsRow: { flexDirection: 'row', gap: 8 },
  cameraBtn: { flex: 1, backgroundColor: '#f97316', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  galleryBtn: { flex: 1, backgroundColor: '#1e3a8a', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  mediaBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  previewContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  previewImage: { width: 40, height: 40, borderRadius: 6, borderWidth: 1, borderColor: '#16a34a' },
  previewSuccessText: { color: '#16a34a', fontSize: 9, fontWeight: 'bold' },
  deleteMediaBtn: { backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, marginTop: 2, alignSelf: 'flex-start' },
  deleteMediaBtnText: { color: '#dc2626', fontSize: 8, fontWeight: 'bold' },
  previewPendingText: { color: '#94a3b8', fontSize: 9, fontStyle: 'italic', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 14 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, maxHeight: '85%' },
  modalContentSelect: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, maxHeight: 300 },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 10, textAlign: 'center' },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#475569', marginVertical: 4 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 8, fontSize: 11, marginBottom: 8 },

  primaryBtn: { backgroundColor: '#f97316', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  cancelBtn: { marginTop: 6, paddingVertical: 4, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' }
});
