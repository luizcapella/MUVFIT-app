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

  // SELETORES DE HORÁRIO NATIVOS (ETAPA 3)
  const [isStartHourSelectOpen, setIsStartHourSelectOpen] = useState(false);
  const [isStartMinSelectOpen, setIsStartMinSelectOpen] = useState(false);
  const [isEndHourSelectOpen, setIsEndHourSelectOpen] = useState(false);
  const [isEndMinSelectOpen, setIsEndMinSelectOpen] = useState(false);

  // REGRAS E ESTRUTURA COMPLETA DAS LIGAS
  const [challenges, setChallenges] = useState([
    {
      id: 'c1',
      title: 'Liga Anti-Inércia 2026',
      invite_code: 'ANTI2026',
      creator_id: 'usr_capella',
      has_daily_cap: true,
      daily_cap: 22000,
      registrations_closed: false,
      is_finished: false,
      startDate: '01/09/2026',
      endDate: '30/09/2026',
      tiebreakerEnabled: true,
      tiebreakersConfig: [
        { id: 'tb1', name: 'Passos Diários', enabled: true },
        { id: 'tb2', name: 'Banco de Pontos', enabled: true },
        { id: 'tb3', name: 'KM Total Percorrido', enabled: false },
        { id: 'tb4', name: 'Dias em Atividade', enabled: false }
      ],
      bonuses: {
        inquebravel: { active: true, days: 7, points: 5000 },
        desperta: { active: true, limitTime: '07:00', points: 3000 }
      },
      rules: {
        musculacao: { enabled: true, mode: 'steps', minMinutes: 30, minPoints: 5000, steps: [{ min: '30', max: '59', pts: '5000' }, { min: '60', max: '120', pts: '10000' }] },
        crossfit: { enabled: true, mode: 'tempo', minMinutes: 40, minPoints: 12000 },
        corrida: { enabled: true, mode: 'steps', minKm: 3, minKmPoints: 5000, stepsKm: [{ min: '3', max: '6', pts: '5000' }] }
      }
    }
  ]);

  const [activeChallengeId, setActiveChallengeId] = useState('c1');
  const [isAdminContext, setIsAdminContext] = useState(true);

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0];
  const [editingChallengeId, setEditingChallengeId] = useState(selectedChallenge ? selectedChallenge.id : 'c1');

  // CONVITES E PARTICIPANTES
  const [pendingInvites, setPendingInvites] = useState([]);
  const [memberships, setMemberships] = useState([
    { challengeId: 'c1', userId: 'usr_capella', name: 'Luiz Capella', nickname: 'Poke', role: 'active', rankingPoints: 22000, bankPoints: 15400, totalSteps: 42350, avatar: 'https://picsum.photos/seed/poke/200/200', goldMedals: 3, silverMedals: 1, bronzeMedals: 0, age: 34, gender: 'Masculino', insigniaInquebravelCount: 3, insigniaDespertaCount: 1 }
  ]);
  const [pendingParticipants, setPendingParticipants] = useState([]);
  const [dailySubmissions, setDailySubmissions] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [pendingWorkouts, setPendingWorkouts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [evidences, setEvidences] = useState([]);

  // FORMULÁRIO DE TREINO (COM DATA HOJE AUTOMÁTICA E SELECTS DE HORA)
  const getTodayFormatted = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('musculacao');
  const [durationInput, setDurationInput] = useState('');
  const [distanceInput, setDistanceInput] = useState('');
  const [stepsInput, setStepsInput] = useState('');
  const [workoutDate, setWorkoutDate] = useState(getTodayFormatted());
  const [startHour, setStartHour] = useState('08');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('09');
  const [endMin, setEndMin] = useState('00');
  const [workoutCaption, setWorkoutCaption] = useState('');

  // FOTOS DO TREINO
  const [photoStart, setPhotoStart] = useState(null);
  const [photoEnd, setPhotoEnd] = useState(null);
  const [photoEvidence, setPhotoEvidence] = useState(null);

  // MODAIS DE REGRAS E DESAFIO
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeCode, setNewChallengeCode] = useState('');
  const [hasCapToggle, setHasCapToggle] = useState(false);
  const [newChallengeCap, setNewChallengeCap] = useState('22000');

  const [isEditRulesOpen, setIsEditRulesOpen] = useState(false);
  const [selectedRuleTab, setSelectedRuleTab] = useState('musculacao');
  const [editingRules, setEditingRules] = useState(selectedChallenge ? selectedChallenge.rules : {});

  // PERFIL E STORIES
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const [stories, setStories] = useState([]);
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [newStoryMedia, setNewStoryMedia] = useState(null);
  const [newStoryType, setNewStoryType] = useState('image');
  const [selectedStory, setSelectedStory] = useState(null);

  // GERENCIAMENTO DE SESSÃO
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
        member_status: 'active',
        goldMedals: 0,
        silverMedals: 0,
        bronzeMedals: 0,
        insigniaInquebravelCount: 0,
        insigniaDespertaCount: 0
      };
      setCurrentUser(userObj);
      setViewedUser(userObj);
      setEditName(userObj.name);
      setEditAge(String(userObj.age));
      setEditGender(userObj.gender);
      setEditAvatar(userObj.avatar);
    } catch (err) {
      console.log('Erro ao carregar perfil:', err);
    } finally {
      setLoadingSession(false);
    }
  }

  // CÂMERA E GALERIA
  async function pickImageFromGallery(setPhotoState, setMediaType = null) {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhotoState(asset.uri);
        if (setMediaType) setMediaType(asset.type === 'video' ? 'video' : 'image');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível acessar a galeria.');
    }
  }

  async function takePhotoWithCamera(setPhotoState, setMediaType = null) {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setPhotoState(asset.uri);
        if (setMediaType) setMediaType('image');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir a câmera.');
    }
  }

  // COMPONENTE DE SELEÇÃO DE MÍDIA COM PREVIEW E BOTÃO APAGAR
  const MediaPickerField = ({ label, photoState, setPhotoState, setMediaType = null }) => (
    <View style={styles.mediaFieldBox}>
      <Text style={styles.mediaLabel}>{label}</Text>
      <View style={styles.mediaButtonsRow}>
        <TouchableOpacity style={styles.cameraBtn} onPress={() => takePhotoWithCamera(setPhotoState, setMediaType)}>
          <Text style={styles.mediaBtnText}>📷 TIRAR FOTO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryBtn} onPress={() => pickImageFromGallery(setPhotoState, setMediaType)}>
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
      {/* TOP HEADER */}
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

          {hasUserAnyCommunity && (
            <>
              <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'feed' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('feed')}>
                <Text style={styles.sidebarIcon}>📷</Text>
                <Text style={[styles.sidebarText, currentScreen === 'feed' && styles.sidebarTextActive]}>Feed</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'ranking' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('ranking')}>
                <Text style={styles.sidebarIcon}>🏆</Text>
                <Text style={[styles.sidebarText, currentScreen === 'ranking' && styles.sidebarTextActive]}>Ranking</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
          {currentScreen === 'dashboard' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={styles.pageTitle}>Painel Geral de Ligas</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setIsWorkoutModalOpen(true)}>
                <Text style={styles.actionBtnText}>+ REGISTRAR TREINO / PASSOS</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>

      {/* MODAL DE TREINO COM ROLAGEM, DATA DINÂMICA E SELECTS DE HORA (ETAPA 3) */}
      <Modal visible={isWorkoutModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={true}>
            <Text style={styles.modalTitle}>Registrar Treino ({selectedChallenge?.title || 'Desafio'})</Text>

            <Text style={styles.inputLabel}>Selecione a Data da Atividade:</Text>
            <TextInput
              style={styles.input}
              placeholder="AAAA-MM-DD"
              value={workoutDate}
              onChangeText={setWorkoutDate}
            />

            <Text style={styles.inputLabel}>Horário de Início (Hora / Minuto):</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              <TouchableOpacity style={[styles.nativeSelectButton, { flex: 1 }]} onPress={() => setIsStartHourSelectOpen(true)}>
                <Text style={styles.nativeSelectButtonText}>Hora: {startHour}h ▼</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.nativeSelectButton, { flex: 1 }]} onPress={() => setIsStartMinSelectOpen(true)}>
                <Text style={styles.nativeSelectButtonText}>Min: {startMin}m ▼</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Horário de Fim (Hora / Minuto):</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              <TouchableOpacity style={[styles.nativeSelectButton, { flex: 1 }]} onPress={() => setIsEndHourSelectOpen(true)}>
                <Text style={styles.nativeSelectButtonText}>Hora: {endHour}h ▼</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.nativeSelectButton, { flex: 1 }]} onPress={() => setIsEndMinSelectOpen(true)}>
                <Text style={styles.nativeSelectButtonText}>Min: {endMin}m ▼</Text>
              </TouchableOpacity>
            </View>

            <MediaPickerField label="Foto do Comprovante do Treino:" photoState={photoEvidence} setPhotoState={setPhotoEvidence} />

            <TextInput style={styles.inputArea} placeholder="Legenda ou Comentários (opcional)..." multiline value={workoutCaption} onChangeText={setWorkoutCaption} />

            <TouchableOpacity style={styles.primaryBtn} onPress={() => {
              Alert.alert('Treino Registrado!', `Atividade gravada para ${workoutDate} de ${startHour}:${startMin} até ${endHour}:${endMin}`);
              setIsWorkoutModalOpen(false);
            }}>
              <Text style={styles.primaryBtnText}>SUBMETER TREINO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsWorkoutModalOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAIS NATIVOS DE SELEÇÃO DE HORAS E MINUTOS */}
      <Modal visible={isStartHourSelectOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsStartHourSelectOpen(false)}>
          <View style={styles.modalContentSelect}>
            <Text style={styles.modalTitle}>Hora de Início</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {hoursList.map(h => (
                <TouchableOpacity key={h} style={styles.selectOptionRow} onPress={() => { setStartHour(h); setIsStartHourSelectOpen(false); }}>
                  <Text style={styles.selectOptionText}>{h} horas</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isStartMinSelectOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsStartMinSelectOpen(false)}>
          <View style={styles.modalContentSelect}>
            <Text style={styles.modalTitle}>Minuto de Início</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {minsList.map(m => (
                <TouchableOpacity key={m} style={styles.selectOptionRow} onPress={() => { setStartMin(m); setIsStartMinSelectOpen(false); }}>
                  <Text style={styles.selectOptionText}>{m} minutos</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isEndHourSelectOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsEndHourSelectOpen(false)}>
          <View style={styles.modalContentSelect}>
            <Text style={styles.modalTitle}>Hora de Termínio</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {hoursList.map(h => (
                <TouchableOpacity key={h} style={styles.selectOptionRow} onPress={() => { setEndHour(h); setIsEndHourSelectOpen(false); }}>
                  <Text style={styles.selectOptionText}>{h} horas</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isEndMinSelectOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsEndMinSelectOpen(false)}>
          <View style={styles.modalContentSelect}>
            <Text style={styles.modalTitle}>Minuto de Termínio</Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {minsList.map(m => (
                <TouchableOpacity key={m} style={styles.selectOptionRow} onPress={() => { setEndMin(m); setIsEndMinSelectOpen(false); }}>
                  <Text style={styles.selectOptionText}>{m} minutos</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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

  nativeSelectButton: { backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' },
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
  inputArea: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 6, fontSize: 11, height: 50, textAlignVertical: 'top', marginBottom: 8 },

  primaryBtn: { backgroundColor: '#f97316', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  actionBtn: { backgroundColor: '#1e3a8a', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginBottom: 12 },
  actionBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  cancelBtn: { marginTop: 6, paddingVertical: 4, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' }
});
