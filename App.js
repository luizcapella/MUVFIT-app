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

  // MODAIS SELETORAS
  const [isHeaderSelectOpen, setIsHeaderSelectOpen] = useState(false);
  const [isPerfScopeSelectOpen, setIsPerfScopeSelectOpen] = useState(false);
  const [isManualAthleteSelectOpen, setIsManualAthleteSelectOpen] = useState(false);
  const [isManualActivitySelectOpen, setIsManualActivitySelectOpen] = useState(false);
  const [isEditingChallengeSelectOpen, setIsEditingChallengeSelectOpen] = useState(false);
  const [isRuleTabSelectOpen, setIsRuleTabSelectOpen] = useState(false);

  // LIGAS E DESAFIOS
  const [challenges, setChallenges] = useState([]);
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [isAdminContext, setIsAdminContext] = useState(false);

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0] || null;

  // PARTICIPANTES E DADOS
  const [pendingInvites, setPendingInvites] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [pendingParticipants, setPendingParticipants] = useState([]);
  const [dailySubmissions, setDailySubmissions] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [pendingWorkouts, setPendingWorkouts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});

  // MODAL DE REGISTRO DE TREINO
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('musculacao');
  const [durationInput, setDurationInput] = useState('');
  const [distanceInput, setDistanceInput] = useState('');
  const [stepsInput, setStepsInput] = useState('');
  const [workoutDate, setWorkoutDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [workoutCaption, setWorkoutCaption] = useState('');

  // FOTOS DE COMPROVAÇÃO DE TREINO
  const [photoStart, setPhotoStart] = useState(null);
  const [photoEnd, setPhotoEnd] = useState(null);
  const [photoEvidence, setPhotoEvidence] = useState(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // PERFIL E OBJETIVOS
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // STORIES
  const [stories, setStories] = useState([]);
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [newStoryMedia, setNewStoryMedia] = useState(null);
  const [newStoryType, setNewStoryType] = useState('image');
  
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);

  // SOLICITAR PERMISSÕES E VERIFICAR SESSÃO
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

  // FUNÇÕES NATIVAS DE CÂMERA E GALERIA
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
        if (setMediaType) {
          setMediaType(asset.type === 'video' ? 'video' : 'image');
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível acessar a galeria de fotos.');
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
        if (setMediaType) {
          setMediaType('image');
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir a câmera do dispositivo.');
    }
  }

  // PUBLICAR E APAGAR STORIES
  function handleAddStory() {
    if (!newStoryMedia) {
      Alert.alert('Aviso', 'Selecione uma foto ou vídeo para o Story.');
      return;
    }

    const newStory = {
      id: `st_${Date.now()}`,
      userId: currentUser.id,
      type: newStoryType,
      uri: newStoryMedia,
      createdAt: Date.now(),
      timestamp: 'Agora'
    };

    setStories([newStory, ...stories]);
    setNewStoryMedia(null);
    setIsAddStoryOpen(false);
    Alert.alert('Story Publicado!', 'Seu story ficará visível por 24 horas.');
  }

  function handleDeleteStory(storyId) {
    Alert.alert('Excluir Story', 'Deseja remover este story?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          setStories(stories.filter(s => s.id !== storyId));
          setSelectedStory(null);
        }
      }
    ]);
  }

  // COMPONENTE DE SELEÇÃO DE MÍDIA COM PREVIEW E BOTOES
  const MediaPickerField = ({ label, photoState, setPhotoState, setMediaType = null }) => (
    <View style={styles.mediaFieldBox}>
      <Text style={styles.mediaLabel}>{label}</Text>
      <View style={styles.mediaButtonsRow}>
        <TouchableOpacity 
          style={styles.cameraBtn} 
          onPress={() => takePhotoWithCamera(setPhotoState, setMediaType)}
        >
          <Text style={styles.mediaBtnText}>📷 TIKAR FOTO</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.galleryBtn} 
          onPress={() => pickImageFromGallery(setPhotoState, setMediaType)}
        >
          <Text style={styles.mediaBtnText}>🖼️ GALERIA</Text>
        </TouchableOpacity>
      </View>

      {photoState ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: photoState }} style={styles.previewImage} />
          <View style={{ flex: 1 }}>
            <Text style={styles.previewSuccessText}>✅ Imagem Selecionada</Text>
            <TouchableOpacity 
              style={styles.deleteMediaBtn}
              onPress={() => setPhotoState(null)}
            >
              <Text style={styles.deleteMediaBtnText}>🗑️ APAGAR / TROCAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.previewPendingText}>Pendente (Nenhuma mídia anexada)</Text>
      )}
    </View>
  );

  // FILTRAR STORIES DE ÚLTIMAS 24H
  const activeUserStories = stories.filter(st => {
    const isOwner = st.userId === viewedUser?.id;
    const isRecent = !st.createdAt || (Date.now() - st.createdAt < 24 * 60 * 60 * 1000);
    return isOwner && isRecent;
  });

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
            <Text style={styles.authTitle}>
              {authMode === 'login' ? '🔑 Entrar no Aplicativo' : '📝 Criar Conta de Atleta'}
            </Text>

            {authMode === 'signup' && (
              <>
                <Text style={styles.inputLabel}>Nome Completo:</Text>
                <TextInput style={styles.input} placeholder="Ex: Luiz Capella" value={authName} onChangeText={setAuthName} />
                <Text style={styles.inputLabel}>Apelido (Nickname):</Text>
                <TextInput style={styles.input} placeholder="Ex: Poke" value={authNickname} onChangeText={setAuthNickname} />
              </>
            )}

            <Text style={styles.inputLabel}>E-mail:</Text>
            <TextInput style={styles.input} placeholder="seuemail@exemplo.com" keyboardType="email-address" autoCapitalize="none" value={authEmail} onChangeText={setAuthEmail} />
            <Text style={styles.inputLabel}>Senha:</Text>
            <TextInput style={styles.input} placeholder="••••••••" secureTextEntry value={authPassword} onChangeText={setAuthPassword} />

            <TouchableOpacity style={styles.primaryBtn} onPress={() => {}} disabled={authSubmitting}>
              {authSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>{authMode === 'login' ? 'ENTRAR' : 'CRIAR MINHA CONTA'}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* CABEÇALHO */}
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
        </View>

        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
          {/* CENTRAL DO ATLETA */}
          {currentScreen === 'athlete_center' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.profileHeaderCard}>
                <Image source={{ uri: viewedUser?.avatar }} style={styles.avatarLarge} />
                <Text style={styles.profileName}>{viewedUser?.name}</Text>
                <Text style={styles.profileMeta}>{viewedUser?.age || 34} anos | {viewedUser?.gender || 'Masculino'}</Text>

                {/* CARROSSEL DE STORIES (BOTÃO + PERMANENTE) */}
                <View style={styles.storiesBox}>
                  <Text style={styles.boxTitle}>Stories do Atleta (Últimas 24h)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 6 }}>
                    {viewedUser?.id === currentUser?.id && (
                      <TouchableOpacity style={styles.addStoryBtn} onPress={() => setIsAddStoryOpen(true)}>
                        <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: 'bold' }}>+</Text>
                      </TouchableOpacity>
                    )}

                    {activeUserStories.length === 0 ? (
                      <Text style={{ fontSize: 9, color: '#94a3b8', fontStyle: 'italic', alignSelf: 'center', marginLeft: 6 }}>Nenhum story ativo.</Text>
                    ) : (
                      activeUserStories.map((st) => (
                        <TouchableOpacity key={st.id} onPress={() => setSelectedStory(st)} style={{ position: 'relative' }}>
                          <Image source={{ uri: st.uri }} style={styles.storyImg} />
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* MODAL ADICIONAR STORY */}
      <Modal visible={isAddStoryOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Postar Story no MUVFIT</Text>
            
            <MediaPickerField 
              label="Selecione Foto ou Vídeo Curto:" 
              photoState={newStoryMedia} 
              setPhotoState={setNewStoryMedia} 
              setMediaType={setNewStoryType}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddStory}>
              <Text style={styles.primaryBtnText}>PUBLICAR STORY (24H)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddStoryOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* VISUALIZADOR DE STORY */}
      <Modal visible={!!selectedStory} animationType="fade" transparent>
        <View style={styles.storyViewerOverlay}>
          <View style={styles.storyViewerHeader}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>{viewedUser?.name}</Text>
              
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                {selectedStory?.userId === currentUser?.id && (
                  <TouchableOpacity onPress={() => handleDeleteStory(selectedStory.id)}>
                    <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: 'bold' }}>🗑️ EXCLUIR</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setSelectedStory(null)}>
                  <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold' }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.storyMediaContainer}>
            <Image source={{ uri: selectedStory?.uri }} style={styles.storyFullImg} resizeMode="contain" />
          </View>
        </View>
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
  profileHeaderCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, marginBottom: 6, borderWidth: 2, borderColor: '#f97316' },
  profileName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  profileMeta: { fontSize: 10, color: '#64748b', marginBottom: 4 },

  storiesBox: { width: '100%', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 8 },
  boxTitle: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' },
  addStoryBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  storyImg: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#f97316', marginRight: 8 },

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
  modalContent: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14 },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 10, textAlign: 'center' },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#475569', marginVertical: 4 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 8, fontSize: 11, marginBottom: 8 },

  primaryBtn: { backgroundColor: '#f97316', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  cancelBtn: { marginTop: 6, paddingVertical: 4, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' },

  storyViewerOverlay: { flex: 1, backgroundColor: '#000000', justifyContent: 'space-between', paddingVertical: 20 },
  storyViewerHeader: { paddingHorizontal: 16 },
  storyMediaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  storyFullImg: { width: '100%', height: '80%' }
});
  // ESTADOS DA BARRA DE PESQUISA FUNCIONAL
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // CONTROLADORES DE MODAIS SELETORAS
  const [isHeaderSelectOpen, setIsHeaderSelectOpen] = useState(false);
  const [isPerfScopeSelectOpen, setIsPerfScopeSelectOpen] = useState(false);
  const [isManualAthleteSelectOpen, setIsManualAthleteSelectOpen] = useState(false);
  const [isManualActivitySelectOpen, setIsManualActivitySelectOpen] = useState(false);
  const [isEditingChallengeSelectOpen, setIsEditingChallengeSelectOpen] = useState(false);
  const [isRuleTabSelectOpen, setIsRuleTabSelectOpen] = useState(false);

  // REGRAS E ESTRUTURA DAS LIGAS
  const [challenges, setChallenges] = useState([]);
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [isAdminContext, setIsAdminContext] = useState(false);

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0] || null;
  const [editingChallengeId, setEditingChallengeId] = useState(null);

  // CONVITES E PARTICIPANTES
  const [pendingInvites, setPendingInvites] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [pendingParticipants, setPendingParticipants] = useState([]);
  const [dailySubmissions, setDailySubmissions] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [pendingWorkouts, setPendingWorkouts] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [evidences, setEvidences] = useState([]);

  // MODAIS E FORMULÁRIOS
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('musculacao');
  const [durationInput, setDurationInput] = useState('');
  const [distanceInput, setDistanceInput] = useState('');
  const [stepsInput, setStepsInput] = useState('');
  const [workoutDate, setWorkoutDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [workoutCaption, setWorkoutCaption] = useState('');

  const [photoStart, setPhotoStart] = useState(null);
  const [photoEnd, setPhotoEnd] = useState(null);
  const [photoEvidence, setPhotoEvidence] = useState(null);

  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeCode, setNewChallengeCode] = useState('');
  const [hasCapToggle, setHasCapToggle] = useState(false);
  const [newChallengeCap, setNewChallengeCap] = useState('22000');

  const [isEditRulesOpen, setIsEditRulesOpen] = useState(false);
  const [selectedRuleTab, setSelectedRuleTab] = useState('musculacao');
  const [editingRules, setEditingRules] = useState({});
  const [bonusInquebravelActive, setBonusInquebravelActive] = useState(true);
  const [bonusInquebravelDays, setBonusInquebravelDays] = useState('7');
  const [bonusInquebravelPoints, setBonusInquebravelPoints] = useState('5000');

  const [bonusDespertaActive, setBonusDespertaActive] = useState(true);
  const [bonusDespertaTime, setBonusDespertaTime] = useState('07:00');
  const [bonusDespertaPoints, setBonusDespertaPoints] = useState('3000');

  const [tiebreakerEnabled, setTiebreakerEnabled] = useState(true);
  const [tiebreakersConfig, setTiebreakersConfig] = useState([
    { id: 'tb1', name: 'Passos Diários', enabled: true },
    { id: 'tb2', name: 'Banco de Pontos', enabled: true },
    { id: 'tb3', name: 'KM Total Percorrido', enabled: false },
    { id: 'tb4', name: 'Dias em Atividade', enabled: false }
  ]);

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteTargetChallenge, setInviteTargetChallenge] = useState(null);
  const [inputInviteCode, setInputInviteCode] = useState('');
  const [athletePerfScope, setAthletePerfScope] = useState('overall');

  const [manualAthleteId, setManualAthleteId] = useState('');
  const [manualActivity, setManualActivity] = useState('musculacao');
  const [manualRankingPointsInput, setManualRankingPointsInput] = useState('');
  const [manualBankPointsInput, setManualBankPointsInput] = useState('');
  const [manualStepsInput, setManualStepsInput] = useState('');
  const [manualInquebravelCheck, setManualInquebravelCheck] = useState(false);
  const [manualDespertaCheck, setManualDespertaCheck] = useState(false);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const [userGoals, setUserGoals] = useState([]);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');

  const [stories, setStories] = useState([]);
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [newStoryMedia, setNewStoryMedia] = useState(null);
  const [newStoryType, setNewStoryType] = useState('image');
  
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);

  // CHECAGEM DE SESSÃO DO SUPABASE AO ABRIR O APP
  useEffect(() => {
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

  // CARREGAR OU CRIAR PERFIL DO ATLETA LOGADO
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

  // FUNÇÕES DE AUTENTICAÇÃO
  async function handleAuthSubmit() {
    if (!authEmail.trim() || !authPassword.trim()) {
      Alert.alert('Atenção', 'Informe e-mail e senha para prosseguir.');
      return;
    }

    setAuthSubmitting(true);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword.trim()
        });
        if (error) Alert.alert('Falha no Login', error.message);
      } else {
        if (!authName.trim()) {
          Alert.alert('Atenção', 'Informe seu nome completo.');
          setAuthSubmitting(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword.trim(),
          options: {
            data: {
              name: authName.trim(),
              nickname: authNickname.trim() || authName.split(' ')[0]
            }
          }
        });
        if (error) {
          Alert.alert('Falha no Cadastro', error.message);
        } else {
          Alert.alert('Conta Criada!', 'Cadastro efetuado com sucesso.');
        }
      }
    } catch (err) {
      Alert.alert('Erro de Conexão', 'Não foi possível se comunicar com o servidor.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  // FUNÇÃO DE LOGOUT
  async function handleLogout() {
    Alert.alert(
      'Sair da Conta',
      'Deseja realmente encerrar sua sessão?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          style: 'destructive', 
          onPress: async () => {
            await supabase.auth.signOut();
            setCurrentUser(null);
            setViewedUser(null);
            setSession(null);
          } 
        }
      ]
    );
  }

  // TIMER DOS STORIES
  useEffect(() => {
    let timer = null;
    if (selectedStory) {
      setStoryProgress(0);
      const intervalTime = 100;
      const totalDuration = 30000;
      const stepIncrement = (intervalTime / totalDuration) * 100;

      timer = setInterval(() => {
        setStoryProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setSelectedStory(null);
            return 0;
          }
          return prev + stepIncrement;
        });
      }, intervalTime);
    } else {
      setStoryProgress(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [selectedStory]);

  if (loadingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Conectando ao MUVFIT...</Text>
      </View>
    );
  }

  // TELA DE AUTENTICAÇÃO QUANDO NÃO HOUVER SESSÃO ATIVA
  if (!session || !currentUser) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <ScrollView contentContainerStyle={styles.authContent}>
          <Text style={styles.authBrandTitle}>MUVFIT</Text>
          <Text style={styles.authBrandSubtitle}>Mizan Soluções Técnicas</Text>

          <View style={styles.authCard}>
            <Text style={styles.authTitle}>
              {authMode === 'login' ? '🔑 Entrar no Aplicativo' : '📝 Criar Conta de Atleta'}
            </Text>

            {authMode === 'signup' && (
              <>
                <Text style={styles.inputLabel}>Nome Completo:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Luiz Capella"
                  value={authName}
                  onChangeText={setAuthName}
                />

                <Text style={styles.inputLabel}>Apelido (Nickname):</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Poke"
                  value={authNickname}
                  onChangeText={setAuthNickname}
                />
              </>
            )}

            <Text style={styles.inputLabel}>E-mail:</Text>
            <TextInput
              style={styles.input}
              placeholder="seuemail@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={authEmail}
              onChangeText={setAuthEmail}
            />

            <Text style={styles.inputLabel}>Senha:</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry
              value={authPassword}
              onChangeText={setAuthPassword}
            />

            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={handleAuthSubmit}
              disabled={authSubmitting}
            >
              {authSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {authMode === 'login' ? 'ENTRAR' : 'CRIAR MINHA CONTA'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={{ marginTop: 14, alignItems: 'center' }}
              onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            >
              <Text style={{ fontSize: 11, color: '#1e3a8a', fontWeight: 'bold' }}>
                {authMode === 'login' 
                  ? 'Não possui uma conta? Cadastre-se aqui' 
                  : 'Já tem uma conta? Clique para fazer login'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const userMembershipsAll = memberships.filter(m => m.userId === currentUser.id);
  const hasUserAnyCommunity = userMembershipsAll.length > 0;
  const adminChallenges = challenges.filter(c => c.creator_id === currentUser.id);
  const participantChallenges = challenges.filter(c => {
    return memberships.some(m => m.challengeId === c.id && m.userId === currentUser.id) && c.creator_id !== currentUser.id;
  });

  const handleShareInvite = async (challenge) => {
    const inviteUrl = `https://muvfit.vercel.app/convite?codigo=${challenge.invite_code}`;
    const message = 
      `🏃‍♂️ *Convite MuvFit* 🏃‍♀️\n\n` +
      `Você foi convidado para participar da *${challenge.title}*!\n\n` +
      `Acesse o link abaixo para entrar na liga e baixar o aplicativo:\n${inviteUrl}`;

    try {
      await Share.share({
        message: message,
        url: inviteUrl,
        title: `Convite para ${challenge.title}`,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível disparar o compartilhamento.');
    }
  };

  function selectChallengeContext(challenge, asAdmin) {
    setActiveChallengeId(challenge.id);
    setIsAdminContext(asAdmin);
    setEditingChallengeId(challenge.id);
    setEditingRules(JSON.parse(JSON.stringify(challenge.rules || {})));
    setCurrentScreen('feed');
  }

  function handleOpenUserProfile(userId) {
    const found = memberships.find(m => m.userId === userId);
    if (found) {
      setViewedUser(found);
    } else {
      setViewedUser(currentUser);
    }
    setCurrentScreen('athlete_center');
  }

  const searchResultsAthletes = memberships.filter(m => {
    if (searchFilter === 'challenge') return false;
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return m.name.toLowerCase().includes(term) || m.nickname.toLowerCase().includes(term);
  }).reduce((acc, current) => {
    const exists = acc.find(item => item.userId === current.userId);
    if (!exists) acc.push(current);
    return acc;
  }, []);

  const searchResultsChallenges = challenges.filter(c => {
    if (searchFilter === 'athlete') return false;
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return c.title.toLowerCase().includes(term) || c.invite_code.toLowerCase().includes(term);
  });

  const currentChallengeMembers = memberships.filter(m => m.challengeId === activeChallengeId);
  const activeMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'active');
  const spectatorMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'spectator');

  let displayedPerf = {
    rankingPoints: 0,
    bankPoints: 0,
    totalSteps: 0,
    goldMedals: viewedUser?.goldMedals || 0,
    silverMedals: viewedUser?.silverMedals || 0,
    bronzeMedals: viewedUser?.bronzeMedals || 0,
    insigniaInquebravelCount: viewedUser?.insigniaInquebravelCount || 0,
    insigniaDespertaCount: viewedUser?.insigniaDespertaCount || 0
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* CABEÇALHO */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>MUVFIT</Text>
          <Text style={styles.brandSubtitle}>Mizan Soluções Técnicas</Text>
        </View>

        {hasUserAnyCommunity && selectedChallenge && (
          <View style={styles.activeChallengeSelectorBar}>
            <Text style={styles.activeChallengeSelectorLabel}>🎯 Desafio Selecionado:</Text>
            <TouchableOpacity 
              style={styles.nativeSelectButton} 
              onPress={() => setIsHeaderSelectOpen(true)}
            >
              <Text style={styles.nativeSelectButtonText}>
                {selectedChallenge.title} ({selectedChallenge.creator_id === currentUser.id ? '🔑 Administrador' : '⚡ Atleta Ativo'}) ▼
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ width: '100%' }}>
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
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* BARRA LATERAL DE NAVEGAÇÃO */}
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

              {isAdminContext && (
                <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'admin' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('admin')}>
                  <Text style={styles.sidebarIcon}>⚙️</Text>
                  <Text style={[styles.sidebarText, currentScreen === 'admin' && styles.sidebarTextActive]}>Admin</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* BOTÃO DE LOGOUT NA SIDEBAR */}
          <TouchableOpacity style={[styles.sidebarBtn, { marginTop: 'auto', borderTopWidth: 1, borderTopColor: '#e2e8f0' }]} onPress={handleLogout}>
            <Text style={styles.sidebarIcon}>🚪</Text>
            <Text style={[styles.sidebarText, { color: '#dc2626' }]}>Sair</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
          {/* TELA 1: DASHBOARD */}
          {currentScreen === 'dashboard' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={styles.pageTitle}>Painel Geral de Ligas</Text>
                <TouchableOpacity style={styles.createChallengeBtnHeader} onPress={() => setIsCreateChallengeOpen(true)}>
                  <Text style={styles.createChallengeBtnText}>+ NOVO DESAFIO</Text>
                </TouchableOpacity>
              </View>

              {!hasUserAnyCommunity && (
                <View style={styles.restrictedNoticeBox}>
                  <Text style={styles.restrictedNoticeText}>
                    ✨ Bem-vindo ao MUVFIT! Crie um novo desafio no botão acima para iniciar a sua liga no aplicativo.
                  </Text>
                </View>
              )}
            </ScrollView>
          )}

          {/* TELA 2: CENTRAL DO ATLETA */}
          {currentScreen === 'athlete_center' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.profileHeaderCard}>
                <TouchableOpacity style={styles.logoutBtnProfile} onPress={handleLogout}>
                  <Text style={styles.logoutBtnProfileText}>🚪 SAIR</Text>
                </TouchableOpacity>

                <Image source={{ uri: viewedUser?.avatar }} style={styles.avatarLarge} />
                <Text style={styles.profileName}>{viewedUser?.name}</Text>
                <Text style={styles.profileMeta}>{viewedUser?.age || 34} anos | {viewedUser?.gender || 'Masculino'}</Text>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  loadingText: { marginTop: 10, fontSize: 12, fontWeight: 'bold', color: '#1e3a8a' },

  authContainer: { flex: 1, backgroundColor: '#1e3a8a' },
  authContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  authBrandTitle: { fontSize: 32, fontWeight: '900', color: '#f97316', textAlign: 'center' },
  authBrandSubtitle: { fontSize: 12, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 20 },
  authCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 18, elevation: 5 },
  authTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 14, textAlign: 'center' },

  topHeader: { padding: 12, backgroundColor: '#1e3a8a', position: 'relative' },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  brandTitle: { fontSize: 20, fontWeight: '900', color: '#f97316' },
  brandSubtitle: { fontSize: 10, fontWeight: 'bold', color: '#ffffff' },
  
  activeChallengeSelectorBar: { backgroundColor: '#172554', padding: 6, borderRadius: 6, marginBottom: 6 },
  activeChallengeSelectorLabel: { fontSize: 9, color: '#f97316', fontWeight: 'bold', marginBottom: 2 },

  nativeSelectButton: { backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6 },
  nativeSelectButtonText: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },

  searchInput: { backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 8 : 4, fontSize: 11, color: '#0f172a', borderWidth: 1, borderColor: '#cbd5e1' },

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

  primaryBtn: { backgroundColor: '#f97316', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },

  restrictedNoticeBox: { backgroundColor: '#eff6ff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#1e3a8a', marginBottom: 12 },
  restrictedNoticeText: { fontSize: 10, color: '#1e3a8a', fontWeight: 'bold' },

  profileHeaderCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', position: 'relative', marginBottom: 10 },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, marginBottom: 6, borderWidth: 2, borderColor: '#f97316' },
  profileName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  profileMeta: { fontSize: 10, color: '#64748b', marginBottom: 4 },

  logoutBtnProfile: { position: 'absolute', top: 10, right: 10, backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#fca5a5' },
  logoutBtnProfileText: { color: '#dc2626', fontSize: 9, fontWeight: 'bold' },

  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#475569', marginVertical: 4 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 8, fontSize: 11, marginBottom: 8 }
});
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  
  // ESTADOS DA BARRA DE PESQUISA FUNCIONAL
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // CONTROLADORES DE MODAIS SELETORAS
  const [isHeaderSelectOpen, setIsHeaderSelectOpen] = useState(false);
  const [isPerfScopeSelectOpen, setIsPerfScopeSelectOpen] = useState(false);
  const [isManualAthleteSelectOpen, setIsManualAthleteSelectOpen] = useState(false);
  const [isManualActivitySelectOpen, setIsManualActivitySelectOpen] = useState(false);
  const [isEditingChallengeSelectOpen, setIsEditingChallengeSelectOpen] = useState(false);
  const [isRuleTabSelectOpen, setIsRuleTabSelectOpen] = useState(false);

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
        musculacao: { enabled: true, mode: 'steps', minMinutes: 30, minPoints: 5000, minKm: '', minKmPoints: '', steps: [{ min: '30', max: '59', pts: '5000' }, { min: '60', max: '120', pts: '10000' }], stepsKm: [] },
        crossfit: { enabled: true, mode: 'tempo', minMinutes: 40, minPoints: 12000, minKm: '', minKmPoints: '', steps: [], stepsKm: [] },
        aerobico: { enabled: true, mode: 'tempo', minMinutes: 45, minPoints: 10000, minKm: '', minKmPoints: '', steps: [], stepsKm: [] },
        corrida: { enabled: true, mode: 'steps', minMinutes: '', minPoints: '', minKm: 3, minKmPoints: 5000, steps: [{ min: '20', max: '40', pts: '4000' }], stepsKm: [{ min: '3', max: '6', pts: '5000' }] },
        caminhada: { enabled: true, mode: 'km', minMinutes: '', minPoints: '', minKm: 3, minKmPoints: 3000, steps: [], stepsKm: [] },
        bike: { enabled: true, mode: 'km', minMinutes: '', minPoints: '', minKm: 10, minKmPoints: 5000, steps: [], stepsKm: [] },
        esporte_coletivo: { enabled: true, mode: 'tempo', minMinutes: 60, points: 5000 },
        esporte_individual: { enabled: true, mode: 'tempo', minMinutes: 45, points: 8000 },
        passos_diarios: { enabled: true }
      }
    },
    {
      id: 'c2',
      title: 'Desafio Reta Final MuvFit',
      invite_code: 'RETA2026',
      creator_id: 'usr_rafa',
      has_daily_cap: false,
      daily_cap: null,
      registrations_closed: false,
      is_finished: false,
      startDate: '10/09/2026',
      endDate: '10/10/2026',
      tiebreakerEnabled: false,
      tiebreakersConfig: [],
      bonuses: {
        inquebravel: { active: false, days: 7, points: 0 },
        desperta: { active: true, limitTime: '06:00', points: 4000 }
      },
      rules: {
        musculacao: { enabled: true, mode: 'tempo', minMinutes: 45, minPoints: 6000, steps: [], stepsKm: [] },
        corrida: { enabled: true, mode: 'km', minKm: 5, minKmPoints: 8000, steps: [], stepsKm: [] },
        passos_diarios: { enabled: true }
      }
    }
  ]);

  // CONTROLADORES DE SELEÇÃO DE DESAFIO E PERMISSÕES
  const [activeChallengeId, setActiveChallengeId] = useState(challenges[0].id);
  const [isAdminContext, setIsAdminContext] = useState(true);

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0];
  const [editingChallengeId, setEditingChallengeId] = useState(selectedChallenge.id);

  // CONVITES PENDENTES
  const [pendingInvites, setPendingInvites] = useState([
    {
      id: 'inv_1',
      challengeId: 'c2',
      challengeTitle: 'Desafio Reta Final MuvFit',
      inviterName: 'Rafael Souza'
    }
  ]);

  // PARTICIPANTES VINCULADOS
  const [memberships, setMemberships] = useState([
    { challengeId: 'c1', userId: 'usr_capella', name: 'Luiz Capella', nickname: 'Poke', role: 'active', rankingPoints: 22000, bankPoints: 15400, totalSteps: 42350, avatar: 'https://picsum.photos/seed/poke/200/200', goldMedals: 3, silverMedals: 1, bronzeMedals: 0, age: 34, gender: 'Masculino', insigniaInquebravelCount: 3, insigniaDespertaCount: 1 },
    { challengeId: 'c1', userId: 'm_usr2', name: 'Rafael Souza', nickname: 'Rafa', role: 'active', rankingPoints: 14000, bankPoints: 2000, totalSteps: 31000, avatar: 'https://picsum.photos/seed/rafa/100/100', goldMedals: 2, silverMedals: 2, bronzeMedals: 1, age: 29, gender: 'Masculino', insigniaInquebravelCount: 1, insigniaDespertaCount: 0 },
    { challengeId: 'c1', userId: 'm_usr4', name: 'Carlos Eduardo', nickname: 'Cadu', role: 'active', rankingPoints: 8000, bankPoints: 0, totalSteps: 12000, avatar: 'https://picsum.photos/seed/cadu/100/100', goldMedals: 1, silverMedals: 0, bronzeMedals: 0, age: 31, gender: 'Masculino', insigniaInquebravelCount: 0, insigniaDespertaCount: 0 },
    { challengeId: 'c1', userId: 'm_usr3', name: 'Beatriz Lima', nickname: 'Bia', role: 'spectator', rankingPoints: 0, bankPoints: 0, totalSteps: 5000, avatar: 'https://picsum.photos/seed/bia/100/100', goldMedals: 0, silverMedals: 0, bronzeMedals: 0, age: 26, gender: 'Feminino', insigniaInquebravelCount: 0, insigniaDespertaCount: 0 },
    { challengeId: 'c2', userId: 'usr_capella', name: 'Luiz Capella', nickname: 'Poke', role: 'active', rankingPoints: 18000, bankPoints: 0, totalSteps: 25000, avatar: 'https://picsum.photos/seed/poke/200/200', goldMedals: 3, silverMedals: 0, bronzeMedals: 0, age: 34, gender: 'Masculino', insigniaInquebravelCount: 1, insigniaDespertaCount: 1 },
    { challengeId: 'c2', userId: 'usr_rafa', name: 'Rafael Souza', nickname: 'Rafa', role: 'active', rankingPoints: 25000, bankPoints: 0, totalSteps: 38000, avatar: 'https://picsum.photos/seed/rafa/100/100', goldMedals: 2, silverMedals: 0, bronzeMedals: 0, age: 29, gender: 'Masculino', insigniaInquebravelCount: 2, insigniaDespertaCount: 2 }
  ]);

  const [pendingParticipants, setPendingParticipants] = useState([
    { challengeId: 'c1', id: 'p_usr3', name: 'Lucas Mendes', nickname: 'Luquinhas', avatar: 'https://picsum.photos/seed/lucas/100/100', age: 25, gender: 'Masculino' }
  ]);

  const [dailySubmissions, setDailySubmissions] = useState([
    { challengeId: 'c1', userId: 'usr_capella', activity: 'musculacao', dateStr: new Date().toLocaleDateString() }
  ]);

  // FEED
  const [feedPosts, setFeedPosts] = useState([
    {
      id: 'p1',
      challengeId: 'c1',
      user_id: 'usr_capella',
      user_name: 'Luiz Capella',
      user_nickname: 'Poke',
      user_avatar: 'https://picsum.photos/seed/poke/200/200',
      activity_type: 'MUSCULAÇÃO',
      caption: 'Treino de perna finalizado na Liga Anti-Inércia! 🦵',
      photo_evidence: 'https://picsum.photos/seed/w1/400/300',
      points_to_ranking: 10000,
      points_to_bank: 0,
      status: 'approved',
      created_at: 'Há 2h',
      likes: 5,
      isLiked: false,
      comments: [{ id: 'c1', user: 'Cadu', text: 'Boa monstro! 👏' }]
    }
  ]);

  // SOLICITAÇÕES PENDENTES
  const [pendingWorkouts, setPendingWorkouts] = useState([
    {
      id: 'pw_1',
      challengeId: 'c1',
      user_id: 'm_usr2',
      user_name: 'Rafael Souza',
      user_nickname: 'Rafa',
      user_avatar: 'https://picsum.photos/seed/rafa/100/100',
      activity_type: 'MUSCULAÇÃO',
      caption: 'Treino de superiores concluído!',
      dateStr: '17/09/2026',
      startTime: '08:00',
      endTime: '09:00',
      photo_start: 'https://picsum.photos/seed/s1/200/200',
      photo_end: 'https://picsum.photos/seed/e1/200/200',
      photo_evidence: 'https://picsum.photos/seed/ev1/200/200',
      points_to_ranking: 10000,
      points_to_bank: 0,
      created_at: 'Agora'
    }
  ]);

  const [commentInputs, setCommentInputs] = useState({});
  const [evidences, setEvidences] = useState([
    { id: 'e1', title: 'Força / Perna', date: '17/09/2026', image: 'https://picsum.photos/seed/ev1/200/200' },
    { id: 'e2', title: 'Corrida 8km', date: '15/09/2026', image: 'https://picsum.photos/seed/ev2/200/200' },
  ]);

  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('musculacao');
  const [durationInput, setDurationInput] = useState('');
  const [distanceInput, setDistanceInput] = useState('');
  const [stepsInput, setStepsInput] = useState('');
  const [workoutDate, setWorkoutDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [workoutCaption, setWorkoutCaption] = useState('');

  const [photoStart, setPhotoStart] = useState(null);
  const [photoEnd, setPhotoEnd] = useState(null);
  const [photoEvidence, setPhotoEvidence] = useState(null);

  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeCode, setNewChallengeCode] = useState('');
  const [hasCapToggle, setHasCapToggle] = useState(false);
  const [newChallengeCap, setNewChallengeCap] = useState('22000');

  const [isEditRulesOpen, setIsEditRulesOpen] = useState(false);
  const [selectedRuleTab, setSelectedRuleTab] = useState('musculacao');

  const [editingRules, setEditingRules] = useState(selectedChallenge.rules);
  const [bonusInquebravelActive, setBonusInquebravelActive] = useState(true);
  const [bonusInquebravelDays, setBonusInquebravelDays] = useState('7');
  const [bonusInquebravelPoints, setBonusInquebravelPoints] = useState('5000');

  const [bonusDespertaActive, setBonusDespertaActive] = useState(true);
  const [bonusDespertaTime, setBonusDespertaTime] = useState('07:00');
  const [bonusDespertaPoints, setBonusDespertaPoints] = useState('3000');

  const [tiebreakerEnabled, setTiebreakerEnabled] = useState(true);
  const [tiebreakersConfig, setTiebreakersConfig] = useState([
    { id: 'tb1', name: 'Passos Diários', enabled: true },
    { id: 'tb2', name: 'Banco de Pontos', enabled: true },
    { id: 'tb3', name: 'KM Total Percorrido', enabled: false },
    { id: 'tb4', name: 'Dias em Atividade', enabled: false }
  ]);

  // ESTADOS DE CONVITE E ENTRADA EM DESAFIO
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteTargetChallenge, setInviteTargetChallenge] = useState(null);
  const [inputInviteCode, setInputInviteCode] = useState('');

  // ESTADO DO FILTRO DA CENTRAL DO ATLETA
  const [athletePerfScope, setAthletePerfScope] = useState('overall');

  // ESTADOS DO LANÇAMENTO MANUAL
  const [manualAthleteId, setManualAthleteId] = useState('');
  const [manualActivity, setManualActivity] = useState('musculacao');
  const [manualRankingPointsInput, setManualRankingPointsInput] = useState('');
  const [manualBankPointsInput, setManualBankPointsInput] = useState('');
  const [manualStepsInput, setManualStepsInput] = useState('');
  const [manualInquebravelCheck, setManualInquebravelCheck] = useState(false);
  const [manualDespertaCheck, setManualDespertaCheck] = useState(false);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser.name);
  const [editAge, setEditAge] = useState(String(currentUser.age));
  const [editGender, setEditGender] = useState(currentUser.gender);
  const [editAvatar, setEditAvatar] = useState(currentUser.avatar);

  // ESTADOS DE OBJETIVOS
  const [userGoals, setUserGoals] = useState([
    { id: 'g1', title: 'Perder Peso', completed: true },
    { id: 'g2', title: 'Ganhar Massa Magra', completed: true },
    { id: 'g3', title: 'Correr 10 km', completed: true },
    { id: 'g4', title: 'Participar de Maratona', completed: false },
  ]);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');

  // SISTEMA DE STORIES (VÍDEO 30S OU FOTO)
  const [stories, setStories] = useState([
    { id: 's1', userId: 'usr_capella', type: 'image', uri: 'https://picsum.photos/seed/s1/300/500', timestamp: 'Há 10m' },
    { id: 's2', userId: 'usr_capella', type: 'image', uri: 'https://picsum.photos/seed/s2/300/500', timestamp: 'Há 1h' }
  ]);
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [newStoryMedia, setNewStoryMedia] = useState(null);
  const [newStoryType, setNewStoryType] = useState('image');
  
  // STORY EM EXIBIÇÃO TELA CHEIA
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);

  // CORREÇÃO DO TIMER NATIVO (PREVINE TRAVAMENTO NO DISPOSITIVO FÍSICO)
  useEffect(() => {
    let timer = null;
    if (selectedStory) {
      setStoryProgress(0);
      const intervalTime = 100;
      const totalDuration = 30000;
      const stepIncrement = (intervalTime / totalDuration) * 100;

      timer = setInterval(() => {
        setStoryProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setSelectedStory(null);
            return 0;
          }
          return prev + stepIncrement;
        });
      }, intervalTime);
    } else {
      setStoryProgress(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [selectedStory]);

  const userMembershipsAll = memberships.filter(m => m.userId === currentUser.id);
  const hasUserAnyCommunity = userMembershipsAll.length > 0;

  const adminChallenges = challenges.filter(c => c.creator_id === currentUser.id);
  const participantChallenges = challenges.filter(c => {
    return memberships.some(m => m.challengeId === c.id && m.userId === currentUser.id) && c.creator_id !== currentUser.id;
  });

  const handleShareInvite = async (challenge) => {
    const inviteUrl = `https://muvfit.vercel.app/convite?codigo=${challenge.invite_code}`;
    const message = 
      `🏃‍♂️ *Convite MuvFit* 🏃‍♀️\n\n` +
      `Você foi convidado para participar da *${challenge.title}*!\n\n` +
      `Acesse o link abaixo para entrar na liga e baixar o aplicativo:\n${inviteUrl}`;

    try {
      await Share.share({
        message: message,
        url: inviteUrl,
        title: `Convite para ${challenge.title}`,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível disparar o compartilhamento.');
    }
  };

  function selectChallengeContext(challenge, asAdmin) {
    setActiveChallengeId(challenge.id);
    setIsAdminContext(asAdmin);
    setEditingChallengeId(challenge.id);
    setEditingRules(JSON.parse(JSON.stringify(challenge.rules || {})));
    setCurrentScreen('feed');
  }

  function handleOpenUserProfile(userId) {
    const found = memberships.find(m => m.userId === userId);
    if (found) {
      setViewedUser(found);
    } else {
      setViewedUser(currentUser);
    }
    setCurrentScreen('athlete_center');
  }

  function handleToggleLike(postId) {
    setFeedPosts(feedPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  }

  function handleAddComment(postId) {
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    setFeedPosts(feedPosts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [
            ...post.comments,
            { id: `c_${Date.now()}`, user: currentUser.nickname, text: commentText.trim() }
          ]
        };
      }
      return post;
    }));

    setCommentInputs({ ...commentInputs, [postId]: '' });
  }

  function handleCreateChallenge() {
    if (!newChallengeTitle.trim() || !newChallengeCode.trim()) {
      Alert.alert('Erro', 'Preencha o Nome e o Código do Desafio.');
      return;
    }

    const newId = `c_${Date.now()}`;
    const newObj = {
      id: newId,
      title: newChallengeTitle.trim(),
      invite_code: newChallengeCode.trim().toUpperCase(),
      creator_id: currentUser.id,
      has_daily_cap: hasCapToggle,
      daily_cap: hasCapToggle ? (parseInt(newChallengeCap) || 22000) : null,
      registrations_closed: false,
      is_finished: false,
      startDate: '01/10/2026',
      endDate: '31/10/2026',
      tiebreakerEnabled: true,
      tiebreakersConfig: JSON.parse(JSON.stringify(tiebreakersConfig)),
      bonuses: {
        inquebravel: { active: bonusInquebravelActive, days: parseInt(bonusInquebravelDays) || 7, points: parseInt(bonusInquebravelPoints) || 5000 },
        desperta: { active: bonusDespertaActive, limitTime: bonusDespertaTime, points: parseInt(bonusDespertaPoints) || 3000 }
      },
      rules: JSON.parse(JSON.stringify(selectedChallenge.rules || {}))
    };

    setChallenges([newObj, ...challenges]);
    
    setMemberships([
      ...memberships,
      { challengeId: newId, userId: currentUser.id, name: currentUser.name, nickname: currentUser.nickname, role: 'active', rankingPoints: 0, bankPoints: 0, totalSteps: 0, avatar: currentUser.avatar, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, age: currentUser.age, gender: currentUser.gender, insigniaInquebravelCount: 0, insigniaDespertaCount: 0 }
    ]);

    selectChallengeContext(newObj, true);
    setIsCreateChallengeOpen(false);
    setNewChallengeTitle('');
    setNewChallengeCode('');
    Alert.alert('Sucesso', 'Novo desafio criado com sucesso!');
  }

  function handleAcceptInvite() {
    if (!inviteTargetChallenge) return;
    if (inputInviteCode.trim().toUpperCase() !== inviteTargetChallenge.invite_code) {
      Alert.alert('Código Incorreto', 'O código digitado não corresponde a este desafio.');
      return;
    }

    const alreadyMember = memberships.some(m => m.challengeId === inviteTargetChallenge.id && m.userId === currentUser.id);
    if (alreadyMember) {
      Alert.alert('Aviso', 'Você já é participante deste desafio!');
      setIsInviteModalOpen(false);
      return;
    }

    setMemberships([
      ...memberships,
      { challengeId: inviteTargetChallenge.id, userId: currentUser.id, name: currentUser.name, nickname: currentUser.nickname, role: 'active', rankingPoints: 0, bankPoints: 0, totalSteps: 0, avatar: currentUser.avatar, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, age: currentUser.age, gender: currentUser.gender, insigniaInquebravelCount: 0, insigniaDespertaCount: 0 }
    ]);

    setPendingInvites(pendingInvites.filter(inv => inv.challengeId !== inviteTargetChallenge.id));
    setIsInviteModalOpen(false);
    selectChallengeContext(inviteTargetChallenge, false);
    Alert.alert('🎉 Bem-vindo ao Desafio!', `Sua entrada foi confirmada.`);
  }

  function handleAcceptDashboardInvite(invite) {
    const ch = challenges.find(c => c.id === invite.challengeId);
    if (!ch) return;

    setMemberships([
      ...memberships,
      { challengeId: ch.id, userId: currentUser.id, name: currentUser.name, nickname: currentUser.nickname, role: 'active', rankingPoints: 0, bankPoints: 0, totalSteps: 0, avatar: currentUser.avatar, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, age: currentUser.age, gender: currentUser.gender, insigniaInquebravelCount: 0, insigniaDespertaCount: 0 }
    ]);

    setPendingInvites(pendingInvites.filter(inv => inv.id !== invite.id));
    selectChallengeContext(ch, false);
    Alert.alert('🎉 Convite Aceito!', `Você entrou no desafio "${ch.title}".`);
  }

  function handleDeclineDashboardInvite(inviteId) {
    setPendingInvites(pendingInvites.filter(inv => inv.id !== inviteId));
    Alert.alert('Convite Recusado', 'O convite foi removido.');
  }

  function handleDeleteChallenge(challengeId) {
    if (challenges.length <= 1) {
      Alert.alert('Atenção', 'Você não pode excluir o único desafio ativo.');
      return;
    }
    const filtered = challenges.filter(c => c.id !== challengeId);
    setChallenges(filtered);
    selectChallengeContext(filtered[0], filtered[0].creator_id === currentUser.id);
    Alert.alert('Desafio Excluído', 'A liga foi removida com sucesso.');
  }

  function handleFinishChallenge(challengeId) {
    setChallenges(challenges.map(c => c.id === challengeId ? { ...c, is_finished: true, registrations_closed: true } : c));
    Alert.alert('Desafio Encerrado', 'O pódio foi gerado no Feed.');
  }

  function toggleChallengeRegistrations() {
    const updatedStatus = !selectedChallenge.registrations_closed;
    setChallenges(challenges.map(c => c.id === selectedChallenge.id ? { ...c, registrations_closed: updatedStatus } : c));
    Alert.alert(
      'Status Atualizado',
      updatedStatus ? 'Inscrições ENCERRADAS.' : 'Inscrições ABERTAS.'
    );
  }

  function handleApproveWorkout(workoutId) {
    const workoutToApprove = pendingWorkouts.find(w => w.id === workoutId);
    if (!workoutToApprove) return;

    setPendingWorkouts(pendingWorkouts.filter(w => w.id !== workoutId));

    if (workoutToApprove.activity_type !== 'PASSOS DIÁRIOS') {
      setMemberships(memberships.map(m => {
        if (m.challengeId === workoutToApprove.challengeId && m.userId === workoutToApprove.user_id) {
          return {
            ...m,
            rankingPoints: m.rankingPoints + workoutToApprove.points_to_ranking,
            bankPoints: m.bankPoints + workoutToApprove.points_to_bank
          };
        }
        return m;
      }));
    }

    setFeedPosts([
      {
        id: `p_${Date.now()}`,
        challengeId: workoutToApprove.challengeId,
        user_id: workoutToApprove.user_id,
        user_name: workoutToApprove.user_name,
        user_nickname: workoutToApprove.user_nickname,
        user_avatar: workoutToApprove.user_avatar,
        activity_type: workoutToApprove.activity_type,
        caption: workoutToApprove.caption,
        photo_evidence: workoutToApprove.photo_evidence,
        points_to_ranking: workoutToApprove.points_to_ranking,
        points_to_bank: workoutToApprove.points_to_bank,
        status: 'approved',
        created_at: 'Agora',
        likes: 0,
        isLiked: false,
        comments: []
      },
      ...feedPosts
    ]);

    Alert.alert('Treino Aprovado!', 'O treino foi publicado no Feed.');
  }

  function handleRejectWorkout(workoutId) {
    setPendingWorkouts(pendingWorkouts.filter(w => w.id !== workoutId));
    Alert.alert('Treino Rejeitado', 'O registro foi removido.');
  }

  function handlePromoteToActive(memberId) {
    setMemberships(memberships.map(m => (m.challengeId === activeChallengeId && m.userId === memberId) ? { ...m, role: 'active' } : m));
    Alert.alert('Atleta Aprovado!', 'O participante agora é um Atleta Ativo.');
  }

  function handleApprovePending(participant, targetRole) {
    setPendingParticipants(pendingParticipants.filter(p => p.id !== participant.id));
    setMemberships([
      ...memberships,
      { challengeId: activeChallengeId, userId: participant.id, name: participant.name, nickname: participant.nickname, role: targetRole, rankingPoints: 0, bankPoints: 0, totalSteps: 0, avatar: participant.avatar, goldMedals: 0, silverMedals: 0, bronzeMedals: 0, age: participant.age, gender: participant.gender, insigniaInquebravelCount: 0, insigniaDespertaCount: 0 }
    ]);
    Alert.alert('Solicitação Aprovada', `Participante adicionado.`);
  }

  function handleDemoteToSpectator(memberId) {
    setMemberships(memberships.map(m => (m.challengeId === activeChallengeId && m.userId === memberId) ? { ...m, role: 'spectator' } : m));
    Alert.alert('Status Alterado', 'O participante agora é Torcedor.');
  }

  function handleRemoveFromChallenge(memberId) {
    setMemberships(memberships.filter(m => !(m.challengeId === activeChallengeId && m.userId === memberId)));
    Alert.alert('Participante Removido', 'O participante foi retirado do desafio.');
  }

  function toggleRuleModalidadEnabled(tabKey) {
    setEditingRules(prev => ({
      ...prev,
      [tabKey]: {
        ...prev[tabKey],
        enabled: !prev[tabKey]?.enabled
      }
    }));
  }

  function setRuleMode(tabKey, selectedMode) {
    setEditingRules(prev => ({
      ...prev,
      [tabKey]: {
        ...prev[tabKey],
        mode: selectedMode,
        steps: prev[tabKey]?.steps && prev[tabKey].steps.length > 0 ? prev[tabKey].steps : [{ min: '', max: '', pts: '' }],
        stepsKm: prev[tabKey]?.stepsKm && prev[tabKey].stepsKm.length > 0 ? prev[tabKey].stepsKm : [{ min: '', max: '', pts: '' }]
      }
    }));
  }

  function handleAddStep(tabKey, stepType = 'time') {
    const targetKey = stepType === 'km' ? 'stepsKm' : 'steps';
    const currentSteps = editingRules[tabKey]?.[targetKey] || [];
    const updatedSteps = [...currentSteps, { min: '', max: '', pts: '' }];
    setEditingRules(prev => ({
      ...prev,
      [tabKey]: {
        ...prev[tabKey],
        [targetKey]: updatedSteps
      }
    }));
  }

  function handleRemoveStep(tabKey, index, stepType = 'time') {
    const targetKey = stepType === 'km' ? 'stepsKm' : 'steps';
    const currentSteps = editingRules[tabKey]?.[targetKey] || [];
    if (currentSteps.length <= 1) {
      Alert.alert('Atenção', 'Mantenha pelo menos 1 Step.');
      return;
    }
    const updatedSteps = currentSteps.filter((_, i) => i !== index);
    setEditingRules(prev => ({
      ...prev,
      [tabKey]: {
        ...prev[tabKey],
        [targetKey]: updatedSteps
      }
    }));
  }

  function handleUpdateStepField(tabKey, index, field, value, stepType = 'time') {
    const targetKey = stepType === 'km' ? 'stepsKm' : 'steps';
    const currentSteps = editingRules[tabKey]?.[targetKey] || [];
    const updatedSteps = currentSteps.map((step, i) => {
      if (i === index) {
        return { ...step, [field]: value };
      }
      return step;
    });
    setEditingRules(prev => ({
      ...prev,
      [tabKey]: {
        ...prev[tabKey],
        [targetKey]: updatedSteps
      }
    }));
  }

  function handleSaveRules() {
    setChallenges(challenges.map(c => {
      if (c.id === editingChallengeId) {
        return {
          ...c,
          rules: editingRules,
          tiebreakerEnabled: tiebreakerEnabled,
          tiebreakersConfig: tiebreakersConfig,
          bonuses: {
            inquebravel: { active: bonusInquebravelActive, days: parseInt(bonusInquebravelDays) || 7, points: parseInt(bonusInquebravelPoints) || 5000 },
            desperta: { active: bonusDespertaActive, limitTime: bonusDespertaTime, points: parseInt(bonusDespertaPoints) || 3000 }
          }
        };
      }
      return c;
    }));

    setIsEditRulesOpen(false);
    Alert.alert('Regras Salvas', 'As regras foram atualizadas!');
  }

  function handleAdminAddPointsManual() {
    if (!manualAthleteId) {
      Alert.alert('Erro', 'Selecione um Atleta Ativo.');
      return;
    }

    const addedRankingPts = parseInt(manualRankingPointsInput) || 0;
    const addedBankPts = parseInt(manualBankPointsInput) || 0;
    const addedSteps = parseInt(manualStepsInput) || 0;

    if (addedRankingPts <= 0 && addedBankPts <= 0 && addedSteps <= 0 && !manualInquebravelCheck && !manualDespertaCheck) {
      Alert.alert('Erro', 'Informe pelo menos um valor ou bônus.');
      return;
    }

    const targetChallenge = challenges.find(c => c.id === activeChallengeId) || selectedChallenge;
    let extraInquebravelPts = (manualInquebravelCheck && targetChallenge.bonuses?.inquebravel?.active) ? targetChallenge.bonuses.inquebravel.points : 0;
    let extraDespertaPts = (manualDespertaCheck && targetChallenge.bonuses?.desperta?.active) ? targetChallenge.bonuses.desperta.points : 0;

    const totalToRanking = addedRankingPts + extraInquebravelPts + extraDespertaPts;

    setMemberships(memberships.map(m => {
      if (m.challengeId === activeChallengeId && m.userId === manualAthleteId) {
        return {
          ...m,
          rankingPoints: m.rankingPoints + totalToRanking,
          bankPoints: m.bankPoints + addedBankPts,
          totalSteps: m.totalSteps + addedSteps,
          insigniaInquebravelCount: m.insigniaInquebravelCount + (manualInquebravelCheck ? 1 : 0),
          insigniaDespertaCount: m.insigniaDespertaCount + (manualDespertaCheck ? 1 : 0)
        };
      }
      return m;
    }));

    setManualRankingPointsInput('');
    setManualBankPointsInput('');
    setManualStepsInput('');
    setManualInquebravelCheck(false);
    setManualDespertaCheck(false);
    Alert.alert('Lançamento Concluído!', `Créditos aplicados ao atleta.`);
  }

  function calculatePoints(type, durStr) {
    if (type === 'passos_diarios') return 0;
    const dur = parseInt(durStr) || 0;
    const rawPts = dur >= 60 ? 10000 : 5000;
    return Math.max(1000, rawPts);
  }

  function handleSubmitWorkout() {
    const currentMemberRecord = memberships.find(m => m.challengeId === activeChallengeId && m.userId === currentUser.id);
    if (!currentMemberRecord || currentMemberRecord.role !== 'active') {
      Alert.alert('Acesso Restrito', 'Apenas Atletas Ativos podem submeter treinos.');
      return;
    }

    const todayStr = new Date().toLocaleDateString();
    const alreadyDoneToday = dailySubmissions.some(
      sub => sub.challengeId === activeChallengeId && sub.userId === currentUser.id && sub.activity === selectedActivity && sub.dateStr === todayStr
    );

    if (alreadyDoneToday) {
      Alert.alert(
        '🔒 Trava Diária Excedida',
        `Você já registrou ${selectedActivity.toUpperCase()} hoje.`
      );
      return;
    }

    const is3PhotosRequired = ['musculacao', 'crossfit', 'aerobico'].includes(selectedActivity);
    if (is3PhotosRequired && (!photoStart || !photoEnd || !photoEvidence)) {
      Alert.alert('Comprovação Incompleta', 'Envie as 3 fotos requeridas para esta modalidade.');
      return;
    }

    if (!is3PhotosRequired && !photoEvidence) {
      Alert.alert('Comprovante Obrigatório', 'Envie a foto comprovando a atividade.');
      return;
    }

    const points = calculatePoints(selectedActivity, durationInput);
    let ptsRanking = points;
    let ptsBank = 0;

    if (selectedActivity === 'passos_diarios') {
      ptsRanking = 0;
    } else if (selectedChallenge?.has_daily_cap && selectedChallenge?.daily_cap) {
      ptsRanking = Math.min(points, selectedChallenge.daily_cap);
      ptsBank = Math.max(0, points - selectedChallenge.daily_cap);
    }

    const stepsVal = parseInt(stepsInput) || (selectedActivity === 'passos_diarios' ? parseInt(distanceInput) || 5000 : 0);

    setDailySubmissions([...dailySubmissions, { challengeId: activeChallengeId, userId: currentUser.id, activity: selectedActivity, dateStr: todayStr }]);

    if (selectedActivity === 'passos_diarios') {
      setMemberships(memberships.map(m => {
        if (m.challengeId === activeChallengeId && m.userId === currentUser.id) {
          return { ...m, totalSteps: m.totalSteps + stepsVal };
        }
        return m;
      }));
    }

    setPendingWorkouts([
      {
        id: `pw_${Date.now()}`,
        challengeId: activeChallengeId,
        user_id: currentUser.id,
        user_name: currentUser.name,
        user_nickname: currentUser.nickname,
        user_avatar: currentUser.avatar,
        activity_type: selectedActivity.toUpperCase(),
        caption: workoutCaption || `Atividade de ${selectedActivity}`,
        dateStr: workoutDate,
        startTime: startTime,
        endTime: endTime,
        photo_start: photoStart,
        photo_end: photoEnd,
        photo_evidence: photoEvidence,
        points_to_ranking: ptsRanking,
        points_to_bank: ptsBank,
        created_at: 'Agora'
      },
      ...pendingWorkouts
    ]);

    setIsWorkoutModalOpen(false);
    resetForm();
    Alert.alert('Sucesso', 'Treino submetido! Aguardando aprovação.');
  }

  function resetForm() {
    setDurationInput('');
    setDistanceInput('');
    setStepsInput('');
    setWorkoutDate('');
    setStartTime('');
    setEndTime('');
    setWorkoutCaption('');
    setPhotoStart(null);
    setPhotoEnd(null);
    setPhotoEvidence(null);
  }

  // PESQUISA
  const searchResultsAthletes = memberships.filter(m => {
    if (searchFilter === 'challenge') return false;
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return m.name.toLowerCase().includes(term) || m.nickname.toLowerCase().includes(term);
  }).reduce((acc, current) => {
    const exists = acc.find(item => item.userId === current.userId);
    if (!exists) acc.push(current);
    return acc;
  }, []);

  const searchResultsChallenges = challenges.filter(c => {
    if (searchFilter === 'athlete') return false;
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return c.title.toLowerCase().includes(term) || c.invite_code.toLowerCase().includes(term);
  });

  const MediaPickerField = ({ label, photoState, setPhotoState, acceptVideo = false, setMediaType = null }) => (
    <View style={styles.mediaFieldBox}>
      <Text style={styles.mediaLabel}>{label}</Text>
      <View style={styles.mediaButtonsRow}>
        <TouchableOpacity 
          style={styles.cameraBtn} 
          onPress={() => {
            const mockUri = 'https://picsum.photos/seed/' + Math.random() + '/400/300';
            setPhotoState(mockUri);
            if (setMediaType) setMediaType('image');
          }}
        >
          <Text style={styles.mediaBtnText}>📷 Foto Exemplo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.galleryBtn} 
          onPress={() => {
            const mockUri = 'https://picsum.photos/seed/' + Math.random() + '/400/300';
            setPhotoState(mockUri);
            if (setMediaType) setMediaType('image');
          }}
        >
          <Text style={styles.mediaBtnText}>🖼️ Galeria Exemplo</Text>
        </TouchableOpacity>
      </View>

      {photoState ? (
        <View style={styles.previewContainer}>
          {newStoryType === 'video' ? (
            <Text style={{ fontSize: 14, color: '#ffffff' }}>🎥 Vídeo Anexado</Text>
          ) : (
            <Image source={{ uri: photoState }} style={styles.previewImage} />
          )}
          <Text style={styles.previewSuccessText}>✅ Pronto para Enviar</Text>
        </View>
      ) : (
        <Text style={styles.previewPendingText}>Pendente</Text>
      )}
    </View>
  );

  const currentChallengeMembers = memberships.filter(m => m.challengeId === activeChallengeId);
  const activeMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'active');
  const spectatorMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'spectator');
  const top3Ranked = [...activeMembersInChallenge].sort((a,b) => b.rankingPoints - a.rankingPoints).slice(0, 3);
  const currentFeedPosts = feedPosts.filter(p => p.challengeId === activeChallengeId);
  const currentPendingParticipants = pendingParticipants.filter(p => p.challengeId === activeChallengeId);
  const currentPendingWorkouts = pendingWorkouts.filter(w => w.challengeId === activeChallengeId);

  const top3Winners = [...currentChallengeMembers]
    .sort((a, b) => (b.goldMedals || 0) - (a.goldMedals || 0))
    .slice(0, 3)
    .map((m) => {
      const g = m.goldMedals || 0;
      let label = 'Campeão';
      if (g === 3) label = 'Tricampeão';
      else if (g === 2) label = 'Bicampeão';
      else if (g > 3) label = `${g}x Campeão`;
      return `${m.name} - ${label}`;
    });

  const currentTabRule = (editingRules && editingRules[selectedRuleTab]) || {
    enabled: true,
    mode: 'tempo',
    minMinutes: '',
    minPoints: '',
    minKm: '',
    minKmPoints: '',
    steps: [],
    stepsKm: []
  };

  let displayedPerf = {
    rankingPoints: 0,
    bankPoints: 0,
    totalSteps: 0,
    goldMedals: viewedUser.goldMedals || 0,
    silverMedals: viewedUser.silverMedals || 0,
    bronzeMedals: viewedUser.bronzeMedals || 0,
    insigniaInquebravelCount: viewedUser.insigniaInquebravelCount || 0,
    insigniaDespertaCount: viewedUser.insigniaDespertaCount || 0
  };

  if (athletePerfScope === 'overall') {
    displayedPerf.rankingPoints = userMembershipsAll.reduce((acc, curr) => acc + (curr.rankingPoints || 0), 0);
    displayedPerf.bankPoints = userMembershipsAll.reduce((acc, curr) => acc + (curr.bankPoints || 0), 0);
    displayedPerf.totalSteps = userMembershipsAll.reduce((acc, curr) => acc + (curr.totalSteps || 0), 0);
  } else {
    const specific = userMembershipsAll.find(m => m.challengeId === athletePerfScope);
    if (specific) {
      displayedPerf.rankingPoints = specific.rankingPoints || 0;
      displayedPerf.bankPoints = specific.bankPoints || 0;
      displayedPerf.totalSteps = specific.totalSteps || 0;
    }
  }

  const currentMemberState = currentChallengeMembers.find(m => m.userId === currentUser.id);
  const userStories = stories.filter(st => st.userId === viewedUser.id);

  return (
    <SafeAreaView style={styles.container}>
      {/* CABEÇALHO */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>MUVFIT</Text>
          <Text style={styles.brandSubtitle}>Mizan Soluções Técnicas</Text>
        </View>

        {hasUserAnyCommunity && (
          <View style={styles.activeChallengeSelectorBar}>
            <Text style={styles.activeChallengeSelectorLabel}>🎯 Desafio Selecionado:</Text>
            <TouchableOpacity 
              style={styles.nativeSelectButton} 
              onPress={() => setIsHeaderSelectOpen(true)}
            >
              <Text style={styles.nativeSelectButtonText}>
                {selectedChallenge.title} ({selectedChallenge.creator_id === currentUser.id ? '🔑 Administrador' : '⚡ Atleta Ativo'}) ▼
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ width: '100%' }}>
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
                <Text style={styles.searchHeaderTitle}>🔎 Pesquisa Geral no App</Text>
                <TouchableOpacity onPress={() => setIsSearchOpen(false)} style={styles.closeSearchBtn}>
                  <Text style={styles.closeSearchText}>✕ FECHAR</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.searchFilterRow}>
                <TouchableOpacity style={[styles.searchFilterChip, searchFilter === 'all' && styles.searchFilterChipActive]} onPress={() => setSearchFilter('all')}>
                  <Text style={[styles.searchFilterChipText, searchFilter === 'all' && styles.searchFilterChipTextActive]}>Todos</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.searchFilterChip, searchFilter === 'athlete' && styles.searchFilterChipActive]} onPress={() => setSearchFilter('athlete')}>
                  <Text style={[styles.searchFilterChipText, searchFilter === 'athlete' && styles.searchFilterChipTextActive]}>🏃 Atletas</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.searchFilterChip, searchFilter === 'challenge' && styles.searchFilterChipActive]} onPress={() => setSearchFilter('challenge')}>
                  <Text style={[styles.searchFilterChipText, searchFilter === 'challenge' && styles.searchFilterChipTextActive]}>🏆 Desafios</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
                {(searchFilter === 'all' || searchFilter === 'athlete') && (
                  <View style={{ marginBottom: 6 }}>
                    <Text style={styles.searchSectionHeader}>🏃 ATLETAS CADASTRADOS ({searchResultsAthletes.length})</Text>
                    {searchResultsAthletes.length === 0 ? (
                      <Text style={styles.emptySearchText}>Nenhum atleta encontrado.</Text>
                    ) : (
                      searchResultsAthletes.map((athlete) => (
                        <TouchableOpacity
                          key={athlete.userId}
                          style={styles.searchResultItem}
                          onPress={() => {
                            handleOpenUserProfile(athlete.userId);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <Image source={{ uri: athlete.avatar }} style={styles.avatarMini} />
                          <View style={{ marginLeft: 8, flex: 1 }}>
                            <Text style={styles.searchResultTitle}>{athlete.name} ({athlete.nickname})</Text>
                            <Text style={styles.searchResultSub}>Acessar Central do Atleta ➔</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}

                {(searchFilter === 'all' || searchFilter === 'challenge') && (
                  <View>
                    <Text style={styles.searchSectionHeader}>🏆 DESAFIOS / LIGAS ({searchResultsChallenges.length})</Text>
                    {searchResultsChallenges.length === 0 ? (
                      <Text style={styles.emptySearchText}>Nenhum desafio encontrado.</Text>
                    ) : (
                      searchResultsChallenges.map((ch) => (
                        <TouchableOpacity
                          key={ch.id}
                          style={styles.searchResultItem}
                          onPress={() => {
                            selectChallengeContext(ch, ch.creator_id === currentUser.id);
                            setCurrentScreen('ranking');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <Text style={{ fontSize: 16, marginRight: 6 }}>🏆</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.searchResultTitle}>{ch.title}</Text>
                            <Text style={styles.searchResultSub}>Código: {ch.invite_code} | Ver Ranking ➔</Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* BARRA LATERAL DE NAVEGAÇÃO */}
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

              {isAdminContext && (
                <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'admin' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('admin')}>
                  <Text style={styles.sidebarIcon}>⚙️</Text>
                  <Text style={[styles.sidebarText, currentScreen === 'admin' && styles.sidebarTextActive]}>Admin</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
          {/* TELA 1: DASHBOARD */}
          {currentScreen === 'dashboard' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={styles.pageTitle}>Painel Geral de Ligas</Text>
                {currentUser.isAdmin && (
                  <TouchableOpacity style={styles.createChallengeBtnHeader} onPress={() => setIsCreateChallengeOpen(true)}>
                    <Text style={styles.createChallengeBtnText}>+ NOVO DESAFIO</Text>
                  </TouchableOpacity>
                )}
              </View>

              {pendingInvites.length > 0 && (
                <View style={styles.inviteNoticeBox}>
                  <Text style={styles.inviteNoticeTitle}>📩 Convites Pendentes</Text>
                  {pendingInvites.map((inv) => (
                    <View key={inv.id} style={styles.inviteItemCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inviteChallengeName}>{inv.challengeTitle}</Text>
                        <Text style={styles.inviteSubText}>Convidado por: {inv.inviterName}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity style={styles.acceptInviteBtn} onPress={() => handleAcceptDashboardInvite(inv)}>
                          <Text style={styles.btnMiniText}>✅ ACEITAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.declineInviteBtn} onPress={() => handleDeclineDashboardInvite(inv.id)}>
                          <Text style={styles.btnMiniText}>❌ RECUSAR</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {!hasUserAnyCommunity && (
                <View style={styles.restrictedNoticeBox}>
                  <Text style={styles.restrictedNoticeText}>
                    ✨ Bem-vindo ao MuvFit! Crie um novo desafio no botão acima ou aceite um convite para liberar as abas da comunidade.
                  </Text>
                </View>
              )}

              <Text style={styles.sectionHeaderTitle}>🔑 Ligas que Você Administra</Text>
              {adminChallenges.length === 0 ? (
                <Text style={styles.emptyNoticeText}>Você ainda não criou nenhum desafio.</Text>
              ) : (
                adminChallenges.map((c) => (
                  <View key={c.id} style={[styles.cardBox, { borderColor: '#f97316', borderWidth: 1.5 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.cardBoxTitle}>{c.title}</Text>
                      <Text style={c.is_finished ? styles.tagClosed : c.registrations_closed ? styles.tagClosed : styles.tagOpen}>
                        {c.is_finished ? '🏆 ENCERRADO' : c.registrations_closed ? '🔒 FECHADO' : '🟢 ABERTO'}
                      </Text>
                    </View>
                    <Text style={styles.cardBoxSub}>
                      Código: {c.invite_code} | {c.startDate} até {c.endDate}
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                      <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={() => selectChallengeContext(c, true)}>
                        <Text style={styles.primaryBtnText}>ENTRAR COMO ADMIN ➔</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.inviteBtn} onPress={() => handleShareInvite(c)}>
                        <Text style={styles.btnMiniText}>🔗 CONVIDAR</Text>
                      </TouchableOpacity>

                      {!c.is_finished && (
                        <TouchableOpacity style={styles.finishChallengeBtn} onPress={() => handleFinishChallenge(c.id)}>
                          <Text style={styles.btnMiniText}>🏆 ENCERRAR</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.deleteChallengeBtn} onPress={() => handleDeleteChallenge(c.id)}>
                        <Text style={styles.btnMiniText}>🗑️ EXCLUIR</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              <Text style={[styles.sectionHeaderTitle, { marginTop: 16 }]}>⚡ Ligas em que Você é Participante</Text>
              {participantChallenges.length === 0 ? (
                <Text style={styles.emptyNoticeText}>Você não está inscrito em outros desafios.</Text>
              ) : (
                participantChallenges.map((c) => (
                  <View key={c.id} style={styles.cardBox}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.cardBoxTitle}>{c.title}</Text>
                      <Text style={c.is_finished ? styles.tagClosed : c.registrations_closed ? styles.tagClosed : styles.tagOpen}>
                        {c.is_finished ? '🏆 ENCERRADO' : c.registrations_closed ? '🔒 FECHADO' : '🟢 ABERTO'}
                      </Text>
                    </View>
                    <Text style={styles.cardBoxSub}>
                      Código: {c.invite_code} | {c.startDate} até {c.endDate}
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                      <TouchableOpacity style={[styles.actionBtn, { flex: 1, marginBottom: 0 }]} onPress={() => selectChallengeContext(c, false)}>
                        <Text style={styles.actionBtnText}>ACESSAR COMO ATLETA ➔</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.inviteBtn} onPress={() => handleShareInvite(c)}>
                        <Text style={styles.btnMiniText}>🔗 CONVIDAR</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* TELA 2: FEED */}
          {currentScreen === 'feed' && hasUserAnyCommunity && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.pageTitle}>Feed — {selectedChallenge.title}</Text>
                <TouchableOpacity style={styles.inviteBtn} onPress={() => handleShareInvite(selectedChallenge)}>
                  <Text style={styles.btnMiniText}>🔗 CONVIDAR</Text>
                </TouchableOpacity>
              </View>

              {selectedChallenge.is_finished && top3Ranked.length >= 3 && (
                <View style={styles.podiumContainer}>
                  <Text style={styles.podiumHeaderTitle}>🏆 PÓDIO FINAL DO DESAFIO 🏆</Text>
                  <View style={styles.podiumRow}>
                    <View style={styles.podiumCard2nd}>
                      <Text style={styles.podiumMedal}>🥈 2º LUGAR</Text>
                      <Image source={{ uri: top3Ranked[1].avatar }} style={styles.avatarMini} />
                      <Text style={styles.podiumName}>{top3Ranked[1].name}</Text>
                      <Text style={styles.podiumPts}>{top3Ranked[1].rankingPoints.toLocaleString()} pts</Text>
                    </View>

                    <View style={styles.podiumCard1st}>
                      <Text style={styles.podiumMedal}>🥇 CAMPEÃO</Text>
                      <Image source={{ uri: top3Ranked[0].avatar }} style={styles.avatarLargePodium} />
                      <Text style={styles.podiumName1st}>{top3Ranked[0].name}</Text>
                      <Text style={styles.podiumPts1st}>{top3Ranked[0].rankingPoints.toLocaleString()} pts</Text>
                    </View>

                    <View style={styles.podiumCard3rd}>
                      <Text style={styles.podiumMedal}>🥉 3º LUGAR</Text>
                      <Image source={{ uri: top3Ranked[2].avatar }} style={styles.avatarMini} />
                      <Text style={styles.podiumName}>{top3Ranked[2].name}</Text>
                      <Text style={styles.podiumPts}>{top3Ranked[2].rankingPoints.toLocaleString()} pts</Text>
                    </View>
                  </View>
                </View>
              )}

              {currentMemberState?.role === 'active' ? (
                <TouchableOpacity style={styles.actionBtn} onPress={() => setIsWorkoutModalOpen(true)}>
                  <Text style={styles.actionBtnText}>+ REGISTRAR NOVO TREINO / PASSOS</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.restrictedNoticeBox}>
                  <Text style={styles.restrictedNoticeText}>
                    👀 Perfil de Torcedor: Modo de leitura.
                  </Text>
                </View>
              )}

              {currentFeedPosts.length === 0 ? (
                <Text style={styles.emptyNoticeText}>Nenhum treino aprovado no feed ainda.</Text>
              ) : (
                currentFeedPosts.map((post) => (
                  <View key={post.id} style={styles.postCard}>
                    <TouchableOpacity style={styles.postHeader} onPress={() => handleOpenUserProfile(post.user_id)}>
                      <Image source={{ uri: post.user_avatar }} style={styles.avatarMini} />
                      <View style={{ marginLeft: 8 }}>
                        <Text style={[styles.postAuthor, { textDecorationLine: 'underline' }]}>{post.user_name} ({post.user_nickname})</Text>
                        <Text style={styles.postTime}>{post.created_at} • ✅ Aprovado</Text>
                      </View>
                    </TouchableOpacity>

                    <Image source={{ uri: post.photo_evidence }} style={styles.postImg} />
                    
                    <View style={{ padding: 10 }}>
                      <Text style={styles.postCaption}>{post.caption}</Text>
                      <Text style={styles.badgePts}>+{post.points_to_ranking} pts (Ranking)</Text>

                      <View style={styles.socialBar}>
                        <TouchableOpacity style={styles.socialBtn} onPress={() => handleToggleLike(post.id)}>
                          <Text style={[styles.socialBtnText, post.isLiked && { color: '#dc2626' }]}>
                            {post.isLiked ? '❤️' : '🤍'} {post.likes} Curtidas
                          </Text>
                        </TouchableOpacity>
                        <Text style={styles.socialBtnText}>💬 {post.comments.length} Comentários</Text>
                      </View>

                      {post.comments.length > 0 && (
                        <View style={styles.commentsListContainer}>
                          {post.comments.map(cm => (
                            <Text key={cm.id} style={styles.commentItemText}>
                              <Text style={{ fontWeight: 'bold', color: '#1e3a8a' }}>{cm.user}: </Text>
                              {cm.text}
                            </Text>
                          ))}
                        </View>
                      )}

                      <View style={styles.addCommentRow}>
                        <TextInput
                          style={styles.commentInput}
                          placeholder="Comentar..."
                          value={commentInputs[post.id] || ''}
                          onChangeText={(txt) => setCommentInputs({ ...commentInputs, [post.id]: txt })}
                        />
                        <TouchableOpacity style={styles.sendCommentBtn} onPress={() => handleAddComment(post.id)}>
                          <Text style={styles.sendCommentBtnText}>Enviar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* TELA 3: RANKING */}
          {currentScreen === 'ranking' && hasUserAnyCommunity && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={styles.pageTitle}>🏆 Ranking — {selectedChallenge.title}</Text>
              
              <View style={styles.topWinnersBannerBox}>
                <Text style={styles.topWinnersBannerTitle}>🥇 MAIORES VENCEDORES DO DESAFIO</Text>
                <Text style={styles.topWinnersBannerList}>
                  {top3Winners.length > 0 ? top3Winners.join('; ') : 'Nenhum campeão registrado ainda'}
                </Text>
              </View>

              {activeMembersInChallenge.sort((a,b) => b.rankingPoints - a.rankingPoints).map((member, index) => (
                <TouchableOpacity key={member.userId} style={styles.rankingRowCard} onPress={() => handleOpenUserProfile(member.userId)}>
                  <Text style={styles.rankingPosNumber}>#{index + 1}</Text>
                  <Image source={{ uri: member.avatar }} style={styles.avatarMini} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.rankingMemberName}>{member.name} ({member.nickname})</Text>
                    <Text style={styles.rankingMemberSub}>{member.totalSteps.toLocaleString()} passos</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.rankingMemberPts}>{member.rankingPoints.toLocaleString()} pts</Text>
                    {selectedChallenge.has_daily_cap && (
                      <Text style={styles.rankingMemberBank}>Banco: {member.bankPoints.toLocaleString()} pts</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              <Text style={[styles.pageTitle, { marginTop: 16 }]}>👀 Torcedores</Text>
              {spectatorMembersInChallenge.length === 0 ? (
                <Text style={styles.emptyNoticeText}>Nenhum torcedor cadastrado neste desafio.</Text>
              ) : (
                spectatorMembersInChallenge.map((spectator) => (
                  <TouchableOpacity key={spectator.userId} style={styles.spectatorRowCard} onPress={() => handleOpenUserProfile(spectator.userId)}>
                    <Image source={{ uri: spectator.avatar }} style={styles.avatarMini} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.spectatorName}>{spectator.name} ({spectator.nickname})</Text>
                      <Text style={styles.spectatorSub}>Torcedor / Espectador</Text>
                    </View>
                    <Text style={styles.spectatorBadge}>👀 Torcedor</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}

          {/* TELA 4: CENTRAL DO ATLETA */}
          {currentScreen === 'athlete_center' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.profileHeaderCard}>
                {viewedUser.id === currentUser.id && (
                  <TouchableOpacity style={styles.editBtnBadge} onPress={() => setIsEditProfileOpen(true)}>
                    <Text style={styles.editBtnBadgeText}>✏️ EDITAR PERFIL</Text>
                  </TouchableOpacity>
                )}

                <Image source={{ uri: viewedUser.avatar }} style={styles.avatarLarge} />
                <Text style={styles.profileName}>{viewedUser.name}</Text>
                <Text style={styles.profileMeta}>{viewedUser.age || 34} anos | {viewedUser.gender || 'Masculino'}</Text>

                <View style={styles.statusBadgeRow}>
                  <Text style={styles.statusActiveTag}>⚡ ATLETA ATIVO</Text>
                </View>

                {hasUserAnyCommunity && (
                  <View style={styles.perfScopeBox}>
                    <Text style={styles.inputLabel}>Visualizar Desempenho Por:</Text>
                    <TouchableOpacity 
                      style={styles.nativeSelectButton}
                      onPress={() => setIsPerfScopeSelectOpen(true)}
                    >
                      <Text style={styles.nativeSelectButtonText}>
                        {athletePerfScope === 'overall' 
                          ? '🌐 Somatório Geral (Todos os Desafios)' 
                          : `🎯 ${(challenges.find(c => c.id === athletePerfScope) || {}).title || 'Desafio'}`
                        } ▼
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.scoreRowContainer}>
                  <View style={styles.scoreBoxItem}>
                    <Text style={styles.scoreNumber}>{displayedPerf.rankingPoints.toLocaleString()}</Text>
                    <Text style={styles.scoreLabel}>🏆 PONTOS</Text>
                  </View>

                  <View style={styles.scoreBoxItem}>
                    <Text style={styles.scoreNumber}>{displayedPerf.bankPoints.toLocaleString()}</Text>
                    <Text style={styles.scoreLabel}>🏦 BANCO</Text>
                  </View>

                  <View style={styles.scoreBoxItem}>
                    <Text style={styles.scoreNumber}>{displayedPerf.totalSteps.toLocaleString()}</Text>
                    <Text style={styles.scoreLabel}>🚶 PASSOS</Text>
                  </View>
                </View>

                {/* CARROSSEL DE STORIES */}
                <View style={styles.storiesBox}>
                  <Text style={styles.boxTitle}>Stories do Atleta (Clique para abrir)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 6 }}>
                    {viewedUser.id === currentUser.id && (
                      <TouchableOpacity style={styles.addStoryBtn} onPress={() => setIsAddStoryOpen(true)}>
                        <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: 'bold' }}>+</Text>
                      </TouchableOpacity>
                    )}
                    {userStories.length === 0 ? (
                      <Text style={{ fontSize: 9, color: '#94a3b8', fontStyle: 'italic', alignSelf: 'center', marginLeft: 6 }}>Nenhum story publicado.</Text>
                    ) : (
                      userStories.map((st) => (
                        <TouchableOpacity key={st.id} onPress={() => setSelectedStory(st)} style={{ position: 'relative' }}>
                          <Image source={{ uri: st.uri }} style={styles.storyImg} />
                          {st.type === 'video' && (
                            <View style={styles.videoBadgeTag}>
                              <Text style={{ fontSize: 8, color: '#ffffff' }}>▶</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.cardBox}>
                <Text style={styles.boxTitle}>Insígnias de Bônus & Troféus do Pódio</Text>
                <View style={styles.medalsRow}>
                  <Text style={styles.medalText}>🥇 {displayedPerf.goldMedals} Ouros</Text>
                  <Text style={styles.medalText}>🥈 {displayedPerf.silverMedals} Pratas</Text>
                  <Text style={styles.medalText}>🥉 {displayedPerf.bronzeMedals} Bronzes</Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                  <Text style={styles.insigniaTag}>🪨 O Inquebrável ({displayedPerf.insigniaInquebravelCount}x)</Text>
                  <Text style={styles.insigniaTagBlue}>⏰ O Desperta ({displayedPerf.insigniaDespertaCount}x)</Text>
                </View>
              </View>

              <Text style={styles.pageTitle}>Evolução & Estatísticas do Atleta</Text>
              <View style={styles.chartsGrid}>
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>📊 Evolução de Peso (kg)</Text>
                  <View style={styles.chartBarMock}><Text style={styles.chartBarText}>82kg ➔ 79kg (Setembro)</Text></View>
                </View>

                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>📊 Atividades Mais Praticadas</Text>
                  <Text style={styles.chartSubText}>1º Musculação (45%) | 2º Corrida (35%) | 3º Bike (20%)</Text>
                </View>

                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>🏃 KM Percorrido Acumulado</Text>
                  <Text style={styles.chartSubText}>128,5 km totais no MuvFit</Text>
                </View>

                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>⏱️ Tempo Total em Atividade</Text>
                  <Text style={styles.chartSubText}>42 horas registradas</Text>
                </View>
              </View>

              <Text style={styles.pageTitle}>Últimas Evidências de Atividades</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginBottom: 12 }}>
                {evidences.map((ev) => (
                  <View key={ev.id} style={styles.evidenceCard}>
                    <Image source={{ uri: ev.image }} style={styles.evidenceImg} />
                    <Text style={styles.evidenceTitle}>{ev.title}</Text>
                    <Text style={styles.evidenceDate}>{ev.date}</Text>
                  </View>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <Text style={styles.pageTitle}>Checklist de Objetivos Pessoais</Text>
                {viewedUser.id === currentUser.id && (
                  <TouchableOpacity style={styles.smallAddBtn} onPress={() => setIsAddGoalOpen(true)}>
                    <Text style={styles.smallAddBtnText}>+ OBJETIVO</Text>
                  </TouchableOpacity>
                )}
              </View>
              {userGoals.map((g) => (
                <TouchableOpacity 
                  key={g.id} 
                  style={styles.goalItem}
                  onPress={() => {
                    if (viewedUser.id === currentUser.id) {
                      setUserGoals(userGoals.map(i => i.id === g.id ? { ...i, completed: !i.completed } : i));
                    }
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{g.completed ? '✅' : '⬜'}</Text>
                  <Text style={[styles.goalText, g.completed && styles.goalDone]}>{g.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* TELA 5: MODERAÇÃO ADMIN */}
          {currentScreen === 'admin' && isAdminContext && hasUserAnyCommunity && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>🎯 Gerenciando: {selectedChallenge.title}</Text>
                <Text style={styles.adminCardSub}>Todas as alterações feitas afetam esta liga.</Text>
              </View>

              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>📋 Aprovação de Treinos Pendentes ({currentPendingWorkouts.length})</Text>
                {currentPendingWorkouts.length === 0 ? (
                  <Text style={styles.emptyNoticeText}>Nenhum treino aguardando aprovação.</Text>
                ) : (
                  currentPendingWorkouts.map((w) => (
                    <View key={w.id} style={styles.participantRow}>
                      <Image source={{ uri: w.photo_evidence }} style={styles.avatarMini} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.participantName}>{w.user_name} ({w.activity_type})</Text>
                        <Text style={styles.participantSub}>{w.caption}</Text>
                        <Text style={styles.tagActiveText}>Recompensa: +{w.points_to_ranking} pts</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveWorkout(w.id)}>
                          <Text style={styles.btnMiniText}>✅ APROVAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.banBtn} onPress={() => handleRejectWorkout(w.id)}>
                          <Text style={styles.btnMiniText}>❌ REJEITAR</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>

              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>🔒 Controle de Inscrições</Text>
                <Text style={styles.adminCardSub}>Status: {selectedChallenge.registrations_closed ? 'ENCERRADAS' : 'ABERTAS'}</Text>
                <TouchableOpacity style={styles.toggleRegBtn} onPress={toggleChallengeRegistrations}>
                  <Text style={styles.toggleRegBtnText}>
                    {selectedChallenge.registrations_closed ? '🔓 REABRIR CANDIDATURAS' : '🔒 ENCERRAR CANDIDATURA'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>➕ Lançamento Manual de Pontos & Passos</Text>

                <Text style={styles.inputLabel}>Selecione o Atleta Ativo:</Text>
                <TouchableOpacity 
                  style={styles.nativeSelectButton}
                  onPress={() => setIsManualAthleteSelectOpen(true)}
                >
                  <Text style={styles.nativeSelectButtonText}>
                    {manualAthleteId 
                      ? (activeMembersInChallenge.find(m => m.userId === manualAthleteId) || {}).name || 'Atleta Selecionado'
                      : '-- Escolha o Atleta Ativo --'
                    } ▼
                  </Text>
                </TouchableOpacity>

                <Text style={styles.inputLabel}>Modalidade Realizada:</Text>
                <TouchableOpacity 
                  style={styles.nativeSelectButton}
                  onPress={() => setIsManualActivitySelectOpen(true)}
                >
                  <Text style={styles.nativeSelectButtonText}>
                    {manualActivity.toUpperCase()} ▼
                  </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', gap: 6, marginVertical: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Pontos Ranking:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 5000"
                      keyboardType="numeric"
                      value={manualRankingPointsInput}
                      onChangeText={setManualRankingPointsInput}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Banco de Pontos:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 2000"
                      keyboardType="numeric"
                      value={manualBankPointsInput}
                      onChangeText={setManualBankPointsInput}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Passos:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 10000"
                      keyboardType="numeric"
                      value={manualStepsInput}
                      onChangeText={setManualStepsInput}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Conceder Bônus (Opcional):</Text>
                {selectedChallenge.bonuses?.inquebravel?.active && (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4 }}
                    onPress={() => setManualInquebravelCheck(!manualInquebravelCheck)}
                  >
                    <Text style={{ fontSize: 16 }}>{manualInquebravelCheck ? '☑️' : '⬜'}</Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#c2410c' }}>
                      🪨 Bônus "O Inquebrável" (+{selectedChallenge.bonuses.inquebravel.points} pts)
                    </Text>
                  </TouchableOpacity>
                )}

                {selectedChallenge.bonuses?.desperta?.active && (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4 }}
                    onPress={() => setManualDespertaCheck(!manualDespertaCheck)}
                  >
                    <Text style={{ fontSize: 16 }}>{manualDespertaCheck ? '☑️' : '⬜'}</Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' }}>
                      ⏰ Bônus "O Desperta" (+{selectedChallenge.bonuses.desperta.points} pts)
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.primaryBtn} onPress={handleAdminAddPointsManual}>
                  <Text style={styles.primaryBtnText}>CREDITAR VALORES AO ATLETA</Text>
                </TouchableOpacity>
              </View>

              {currentPendingParticipants.length > 0 && (
                <View style={styles.adminControlCard}>
                  <Text style={styles.adminCardTitle}>📩 Atletas Pendentes ({currentPendingParticipants.length})</Text>
                  {currentPendingParticipants.map((p) => (
                    <View key={p.id} style={styles.participantRow}>
                      <Image source={{ uri: p.avatar }} style={styles.avatarMini} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.participantName}>{p.name} ({p.nickname})</Text>
                        <Text style={styles.participantSub}>Aguardando Aprovação</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
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

              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>👥 Gerenciamento de Membros</Text>
                {currentChallengeMembers.map((m) => (
                  <View key={m.userId} style={styles.participantRow}>
                    <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                    <View style={styles.participantInfoBox}>
                      <Text style={styles.participantName}>{m.name} ({m.nickname})</Text>
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

              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>✏️ Configuração Avançada de Pontos</Text>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsEditRulesOpen(true)}>
                  <Text style={styles.primaryBtnText}>EDITAR REGRAS DETALHADAS DA LIGA</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* MODAIS DA APLICAÇÃO */}
      <Modal visible={!!selectedStory} animationType="fade" transparent>
        <View style={styles.storyViewerOverlay}>
          <View style={styles.storyViewerHeader}>
            <View style={styles.storyProgressBarBg}>
              <View style={[styles.storyProgressBarFill, { width: `${storyProgress}%` }]} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={{ uri: viewedUser.avatar }} style={styles.avatarMini} />
                <Text style={{ color: '#ffffff', fontWeight: 'bold', marginLeft: 8, fontSize: 12 }}>{viewedUser.name}</Text>
                <Text style={{ color: '#cbd5e1', fontSize: 10, marginLeft: 6 }}>{selectedStory?.timestamp}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedStory(null)}>
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold', padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.storyMediaContainer}>
            <Image source={{ uri: selectedStory?.uri }} style={styles.storyFullImg} resizeMode="contain" />
          </View>
        </View>
      </Modal>

      <Modal visible={isAddStoryOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Postar Story no MuvFit</Text>
            <MediaPickerField 
              label="Selecione Foto ou Vídeo Curto (30s):" 
              photoState={newStoryMedia} 
              setPhotoState={setNewStoryMedia} 
              acceptVideo={true}
              setMediaType={setNewStoryType}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={() => {
              if (newStoryMedia) {
                setStories([
                  { id: `st_${Date.now()}`, userId: currentUser.id, type: newStoryType, uri: newStoryMedia, timestamp: 'Agora' },
                  ...stories
                ]);
                setNewStoryMedia(null);
                setIsAddStoryOpen(false);
                Alert.alert('Story Publicado!', 'Seu story está visível para os atletas.');
              }
            }}>
              <Text style={styles.primaryBtnText}>PUBLICAR STORY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddStoryOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isInviteModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎉 Convite para o Desafio</Text>
            <Text style={{ fontSize: 12, color: '#1e3a8a', fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>
              {inviteTargetChallenge?.title}
            </Text>

            <View style={styles.inviteBoxHighlight}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#0f172a' }}>📱 Novo Cadastro no MuvFit?</Text>
              <Text style={{ fontSize: 8, color: '#475569', marginBottom: 6 }}>1. Baixe o app MuvFit na Store {"\n"}2. Crie seu cadastro {"\n"}3. Digite o código abaixo para entrar no desafio!</Text>
            </View>

            <Text style={styles.inputLabel}>Digite o Código de Acesso do Desafio:</Text>
            <TextInput
              style={styles.input}
              placeholder={`Código do Desafio (Ex: ${inviteTargetChallenge?.invite_code})`}
              value={inputInviteCode}
              onChangeText={setInputInviteCode}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAcceptInvite}>
              <Text style={styles.primaryBtnText}>ACEITAR CONVITE & ENTRAR NO DESAFIO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsInviteModalOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isCreateChallengeOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Novo Desafio / Liga</Text>
            <TextInput style={styles.input} placeholder="Nome do Desafio (Ex: Desafio Outubro 2026)" value={newChallengeTitle} onChangeText={setNewChallengeTitle} />
            <TextInput style={styles.input} placeholder="Código de Convite (Ex: OUT2026)" value={newChallengeCode} onChangeText={setNewChallengeCode} />

            <TouchableOpacity 
              style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8, gap: 8 }}
              onPress={() => setHasCapToggle(!hasCapToggle)}
            >
              <Text style={{ fontSize: 16 }}>{hasCapToggle ? '☑️' : '⬜'}</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' }}>Ativar Teto Diário de Pontos (Opcional)</Text>
            </TouchableOpacity>

            {hasCapToggle && (
              <TextInput 
                style={styles.input} 
                placeholder="Teto Diário em Pontos (Ex: 22000)" 
                keyboardType="numeric" 
                value={newChallengeCap} 
                onChangeText={setNewChallengeCap} 
              />
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateChallenge}>
              <Text style={styles.primaryBtnText}>CRIAR DESAFIO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreateChallengeOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isEditRulesOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Configuração Avançada de Pontuação</Text>
            
            <Text style={styles.inputLabel}>Selecione o Desafio para Configurar:</Text>
            <TouchableOpacity 
              style={styles.nativeSelectButton}
              onPress={() => setIsEditingChallengeSelectOpen(true)}
            >
              <Text style={styles.nativeSelectButtonText}>
                {(challenges.find(c => c.id === editingChallengeId) || {}).title || 'Desafio'} ▼
              </Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 9, color: '#f97316', fontWeight: 'bold', textAlign: 'center', marginVertical: 6 }}>
              ⚠️ Escolha 1 ÚNICO MODO DE PONTUAÇÃO por modalidade habilitada.
            </Text>

            <Text style={styles.inputLabel}>Selecione a Modalidade para Configurar:</Text>
            <TouchableOpacity 
              style={styles.nativeSelectButton}
              onPress={() => setIsRuleTabSelectOpen(true)}
            >
              <Text style={styles.nativeSelectButtonText}>
                {selectedRuleTab.toUpperCase()} ▼
              </Text>
            </TouchableOpacity>

            {selectedRuleTab !== 'bonuses_desempate' && (
              <TouchableOpacity
                style={styles.toggleModalidadeBox}
                onPress={() => toggleRuleModalidadEnabled(selectedRuleTab)}
              >
                <Text style={{ fontSize: 16 }}>{currentTabRule.enabled ? '☑️' : '⬜'}</Text>
                <Text style={styles.toggleModalidadeText}>
                  {currentTabRule.enabled ? 'Modalidade Habilitada neste Desafio' : 'Modalidade Desabilitada'}
                </Text>
              </TouchableOpacity>
            )}

            {selectedRuleTab !== 'bonuses_desempate' && currentTabRule.enabled && (
              <View style={styles.ruleSectionBox}>
                <Text style={styles.ruleSectionTitle}>Selecione o Modo Exclusivo de Pontuação:</Text>

                <TouchableOpacity
                  style={[styles.modeCardOption, currentTabRule.mode === 'tempo' && styles.modeCardOptionActive]}
                  onPress={() => setRuleMode(selectedRuleTab, 'tempo')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 14 }}>{currentTabRule.mode === 'tempo' ? '🔘' : '⚪'}</Text>
                    <Text style={styles.modeCardTitle}>1ª Opção: Pontuação por Tempo Mínimo</Text>
                  </View>
                  {currentTabRule.mode === 'tempo' ? (
                    <View style={{ marginTop: 8 }}>
                      <TextInput
                        style={styles.input}
                        placeholder="Minutos Mínimos (Ex: 30 min)"
                        keyboardType="numeric"
                        value={String(currentTabRule.minMinutes || '')}
                        onChangeText={(txt) => setEditingRules(prev => ({ ...prev, [selectedRuleTab]: { ...prev[selectedRuleTab], minMinutes: txt } }))}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Pontos Mínimos (Ex: 5000 pts)"
                        keyboardType="numeric"
                        value={String(currentTabRule.minPoints || '')}
                        onChangeText={(txt) => setEditingRules(prev => ({ ...prev, [selectedRuleTab]: { ...prev[selectedRuleTab], minPoints: txt } }))}
                      />
                    </View>
                  ) : (
                    <Text style={styles.modeCardDisabledText}>Opção indisponível (Selecione para ativar)</Text>
                  )}
                </TouchableOpacity>

                {['corrida', 'caminhada', 'bike'].includes(selectedRuleTab) && (
                  <TouchableOpacity
                    style={[styles.modeCardOption, currentTabRule.mode === 'km' && styles.modeCardOptionActive]}
                    onPress={() => setRuleMode(selectedRuleTab, 'km')}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 14 }}>{currentTabRule.mode === 'km' ? '🔘' : '⚪'}</Text>
                      <Text style={styles.modeCardTitle}>2ª Opção: Pontuação por KM Mínimo</Text>
                    </View>
                    {currentTabRule.mode === 'km' ? (
                      <View style={{ marginTop: 8 }}>
                        <TextInput
                          style={styles.input}
                          placeholder="KM Mínimo (Ex: 5 km)"
                          keyboardType="numeric"
                          value={String(currentTabRule.minKm || '')}
                          onChangeText={(txt) => setEditingRules(prev => ({ ...prev, [selectedRuleTab]: { ...prev[selectedRuleTab], minKm: txt } }))}
                        />
                        <TextInput
                          style={styles.input}
                          placeholder="Pontos Mínimos (Ex: 5000 pts)"
                          keyboardType="numeric"
                          value={String(currentTabRule.minKmPoints || '')}
                          onChangeText={(txt) => setEditingRules(prev => ({ ...prev, [selectedRuleTab]: { ...prev[selectedRuleTab], minKmPoints: txt } }))}
                        />
                      </View>
                    ) : (
                      <Text style={styles.modeCardDisabledText}>Opção indisponível (Selecione para ativar)</Text>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.modeCardOption, currentTabRule.mode === 'steps' && styles.modeCardOptionActive]}
                  onPress={() => setRuleMode(selectedRuleTab, 'steps')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 14 }}>{currentTabRule.mode === 'steps' ? '🔘' : '⚪'}</Text>
                    <Text style={styles.modeCardTitle}>
                      {['corrida', 'caminhada', 'bike'].includes(selectedRuleTab) ? '3ª Opção: Steps Progressivos' : '2ª Opção: Steps Progressivos'}
                    </Text>
                  </View>
                  
                  {currentTabRule.mode === 'steps' ? (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ fontSize: 10, color: '#1e3a8a', fontWeight: 'bold', marginBottom: 4 }}>
                        ⏱️ Steps por TEMPO (minutos):
                      </Text>

                      {(currentTabRule.steps || []).map((step, idx) => (
                        <View key={idx} style={styles.stepBoxRow}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={styles.stepBoxLabel}>Step Tempo {idx + 1}:</Text>
                            {(currentTabRule.steps || []).length > 1 && (
                              <TouchableOpacity onPress={() => handleRemoveStep(selectedRuleTab, idx, 'time')}>
                                <Text style={styles.stepRemoveText}>🗑️ Remover</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                            <TextInput
                              style={[styles.input, { flex: 1 }]}
                              placeholder="Mín min"
                              keyboardType="numeric"
                              value={step.min}
                              onChangeText={(txt) => handleUpdateStepField(selectedRuleTab, idx, 'min', txt, 'time')}
                            />
                            <TextInput
                              style={[styles.input, { flex: 1 }]}
                              placeholder="Máx min"
                              keyboardType="numeric"
                              value={step.max}
                              onChangeText={(txt) => handleUpdateStepField(selectedRuleTab, idx, 'max', txt, 'time')}
                            />
                            <TextInput
                              style={[styles.input, { flex: 1 }]}
                              placeholder="Pontos"
                              keyboardType="numeric"
                              value={step.pts}
                              onChangeText={(txt) => handleUpdateStepField(selectedRuleTab, idx, 'pts', txt, 'time')}
                            />
                          </View>
                        </View>
                      ))}

                      <TouchableOpacity style={styles.addStepBtn} onPress={() => handleAddStep(selectedRuleTab, 'time')}>
                        <Text style={styles.addStepBtnText}>+ ADICIONAR STEP DE TEMPO</Text>
                      </TouchableOpacity>

                      {['corrida', 'caminhada', 'bike'].includes(selectedRuleTab) && (
                        <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#fed7aa' }}>
                          <Text style={{ fontSize: 10, color: '#c2410c', fontWeight: 'bold', marginBottom: 4 }}>
                            🏃 Steps por QUILOMETRAGEM (KM):
                          </Text>

                          {(currentTabRule.stepsKm || []).map((step, idx) => (
                            <View key={idx} style={styles.stepBoxRow}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text style={styles.stepBoxLabel}>Step KM {idx + 1}:</Text>
                                {(currentTabRule.stepsKm || []).length > 1 && (
                                  <TouchableOpacity onPress={() => handleRemoveStep(selectedRuleTab, idx, 'km')}>
                                    <Text style={styles.stepRemoveText}>🗑️ Remover</Text>
                                  </TouchableOpacity>
                                )}
                              </View>
                              
                              <View style={{ flexDirection: 'row', gap: 4 }}>
                                <TextInput
                                  style={[styles.input, { flex: 1 }]}
                                  placeholder="Mín km"
                                  keyboardType="numeric"
                                  value={step.min}
                                  onChangeText={(txt) => handleUpdateStepField(selectedRuleTab, idx, 'min', txt, 'km')}
                                />
                                <TextInput
                                  style={[styles.input, { flex: 1 }]}
                                  placeholder="Máx km"
                                  keyboardType="numeric"
                                  value={step.max}
                                  onChangeText={(txt) => handleUpdateStepField(selectedRuleTab, idx, 'max', txt, 'km')}
                                />
                                <TextInput
                                  style={[styles.input, { flex: 1 }]}
                                  placeholder="Pontos"
                                  keyboardType="numeric"
                                  value={step.pts}
                                  onChangeText={(txt) => handleUpdateStepField(selectedRuleTab, idx, 'pts', txt, 'km')}
                                />
                              </View>
                            </View>
                          ))}

                          <TouchableOpacity style={[styles.addStepBtn, { backgroundColor: '#c2410c' }]} onPress={() => handleAddStep(selectedRuleTab, 'km')}>
                            <Text style={styles.addStepBtnText}>+ ADICIONAR STEP DE KM</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.modeCardDisabledText}>Opção indisponível (Selecione para ativar)</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {selectedRuleTab === 'bonuses_desempate' && (
              <View style={styles.ruleSectionBox}>
                <Text style={styles.ruleSectionTitle}>Bônus Individuais</Text>

                <View style={styles.bonusConfigCard}>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => setBonusInquebravelActive(!bonusInquebravelActive)}>
                    <Text style={{ fontSize: 16 }}>{bonusInquebravelActive ? '☑️' : '⬜'}</Text>
                    <Text style={styles.bonusTitleText}>🪨 Bônus "O Inquebrável"</Text>
                  </TouchableOpacity>
                  <Text style={styles.bonusDescText}>Premia X dias consecutivos de atividade.</Text>
                  {bonusInquebravelActive && (
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                      <TextInput style={[styles.input, { flex: 1 }]} placeholder="Qtd Dias" keyboardType="numeric" value={bonusInquebravelDays} onChangeText={setBonusInquebravelDays} />
                      <TextInput style={[styles.input, { flex: 1 }]} placeholder="Pontos" keyboardType="numeric" value={bonusInquebravelPoints} onChangeText={setBonusInquebravelPoints} />
                    </View>
                  )}
                </View>

                <View style={styles.bonusConfigCard}>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => setBonusDespertaActive(!bonusDespertaActive)}>
                    <Text style={{ fontSize: 16 }}>{bonusDespertaActive ? '☑️' : '⬜'}</Text>
                    <Text style={styles.bonusTitleText}>⏰ Bônus "O Desperta"</Text>
                  </TouchableOpacity>
                  <Text style={styles.bonusDescText}>Premia comprovante enviado até horário limite.</Text>
                  {bonusDespertaActive && (
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                      <TextInput style={[styles.input, { flex: 1 }]} placeholder="Hora Limite" value={bonusDespertaTime} onChangeText={setBonusDespertaTime} />
                      <TextInput style={[styles.input, { flex: 1 }]} placeholder="Pontos" keyboardType="numeric" value={bonusDespertaPoints} onChangeText={setBonusDespertaPoints} />
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.toggleModalidadeBox}
                  onPress={() => setTiebreakerEnabled(!tiebreakerEnabled)}
                >
                  <Text style={{ fontSize: 16 }}>{tiebreakerEnabled ? '☑️' : '⬜'}</Text>
                  <Text style={styles.toggleModalidadeText}>
                    {tiebreakerEnabled ? 'Habilitar Critérios de Desempate' : 'Desabilitar Critérios de Desempate'}
                  </Text>
                </TouchableOpacity>

                {tiebreakerEnabled && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.ruleSectionTitle}>Critérios de Desempate Ativos:</Text>
                    {tiebreakersConfig.map((tb, idx) => (
                      <TouchableOpacity
                        key={tb.id}
                        style={styles.tiebreakerCheckRow}
                        onPress={() => {
                          const updated = tiebreakersConfig.map(item => item.id === tb.id ? { ...item, enabled: !item.enabled } : item);
                          setTiebreakersConfig(updated);
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>{tb.enabled ? '☑️' : '⬜'}</Text>
                        <Text style={styles.tiebreakerCheckLabel}>{idx + 1}º Critério: {tb.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveRules}>
              <Text style={styles.primaryBtnText}>SALVAR REGRAS DO DESAFIO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditRulesOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={isWorkoutModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Treino ({selectedChallenge?.title || 'Desafio'})</Text>

            <View style={styles.rulesInfoBox}>
              <Text style={styles.rulesInfoTitle}>📜 Regras Ativas:</Text>
              <Text style={styles.rulesInfoText}>• Musculação: 30m ({selectedChallenge?.rules?.musculacao?.minPoints || 5000}pts) | 1h+ (10000pts)</Text>
              <Text style={styles.rulesInfoText}>• Corrida: Mín {selectedChallenge?.rules?.corrida?.minKm || 3}km</Text>
              <Text style={styles.rulesInfoText}>• Trava: Máximo 1 envio por modalidade ao dia</Text>
            </View>

            <Text style={styles.inputLabel}>Selecione a Modalidade:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {[
                { id: 'musculacao', label: 'Musculação' },
                { id: 'crossfit', label: 'CrossFit / Funcional' },
                { id: 'corrida', label: 'Corrida' },
                { id: 'caminhada', label: 'Caminhada' },
                { id: 'bike', label: 'Bike' },
                { id: 'esporte_coletivo', label: 'Esporte Coletivo' },
                { id: 'esporte_individual', label: 'Esporte Individual' },
                { id: 'aerobico', label: 'Aeróbico' },
                { id: 'passos_diarios', label: '🚶 Passos Diários' },
              ].filter(opt => opt.id === 'passos_diarios' || selectedChallenge?.rules?.[opt.id]?.enabled !== false).map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.chipBtn, selectedActivity === opt.id && styles.chipBtnActive]}
                  onPress={() => setSelectedActivity(opt.id)}
                >
                  <Text style={[styles.chipText, selectedActivity === opt.id && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {['musculacao', 'crossfit', 'aerobico'].includes(selectedActivity) && (
              <TextInput style={styles.input} placeholder="Duração em minutos (ex: 60)" keyboardType="numeric" value={durationInput} onChangeText={setDurationInput} />
            )}

            {['corrida', 'caminhada', 'bike'].includes(selectedActivity) && (
              <>
                <TextInput style={styles.input} placeholder="Distância (km) ou Duração (min)" keyboardType="numeric" value={distanceInput} onChangeText={setDistanceInput} />
                <TextInput style={styles.input} placeholder="Duração em minutos (opcional)" keyboardType="numeric" value={durationInput} onChangeText={setDurationInput} />
              </>
            )}

            {selectedActivity === 'passos_diarios' && (
              <TextInput style={styles.input} placeholder="Quantidade de passos" keyboardType="numeric" value={stepsInput} onChangeText={setStepsInput} />
            )}

            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Data (DD/MM)" value={workoutDate} onChangeText={setWorkoutDate} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Início (08:00)" value={startTime} onChangeText={setStartTime} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Fim (09:00)" value={endTime} onChangeText={setEndTime} />
            </View>

            <Text style={styles.inputLabel}>
              {['musculacao', 'crossfit', 'aerobico'].includes(selectedActivity)
                ? '3 Fotos Obrigatórias (Início, Fim e Evidência):'
                : 'Comprovante da Atividade:'}
            </Text>

            {['musculacao', 'crossfit', 'aerobico'].includes(selectedActivity) ? (
              <>
                <MediaPickerField label="1. Foto Horário Inicial:" photoState={photoStart} setPhotoState={setPhotoStart} />
                <MediaPickerField label="2. Foto Horário Final:" photoState={photoEnd} setPhotoState={setPhotoEnd} />
                <MediaPickerField label="3. Foto Evidência do Treino:" photoState={photoEvidence} setPhotoState={setPhotoEvidence} />
              </>
            ) : (
              <MediaPickerField label="Comprovante (Print / Foto):" photoState={photoEvidence} setPhotoState={setPhotoEvidence} />
            )}

            <TextInput style={styles.inputArea} placeholder="Legenda / Comentário (Opcional)..." multiline value={workoutCaption} onChangeText={setWorkoutCaption} />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitWorkout}>
              <Text style={styles.primaryBtnText}>SUBMETER TREINO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsWorkoutModalOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={isEditProfileOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil do Atleta</Text>
            <MediaPickerField label="Foto de Perfil (Avatar):" photoState={editAvatar} setPhotoState={setEditAvatar} />
            <TextInput style={styles.input} placeholder="Nome Completo" value={editName} onChangeText={setEditName} />
            <TextInput style={styles.input} placeholder="Idade" keyboardType="numeric" value={editAge} onChangeText={setEditAge} />
            <TextInput style={styles.input} placeholder="Sexo" value={editGender} onChangeText={setEditGender} />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => {
              const updated = { ...currentUser, name: editName, age: parseInt(editAge) || currentUser.age, gender: editGender, avatar: editAvatar };
              setCurrentUser(updated);
              setViewedUser(updated);
              setIsEditProfileOpen(false);
            }}>
              <Text style={styles.primaryBtnText}>SALVAR ALTERAÇÕES</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditProfileOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isAddGoalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Objetivo Pessoal</Text>
            <TextInput style={styles.input} placeholder="Ex: Correr 15km sem parar" value={newGoalTitle} onChangeText={setNewGoalTitle} />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => {
              if (newGoalTitle.trim()) {
                setUserGoals([...userGoals, { id: `g_${Date.now()}`, title: newGoalTitle.trim(), completed: false }]);
                setNewGoalTitle('');
                setIsAddGoalOpen(false);
              }
            }}>
              <Text style={styles.primaryBtnText}>SALVAR OBJETIVO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddGoalOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAIS NATIVAS DE SELEÇÃO */}
      <Modal visible={isHeaderSelectOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsHeaderSelectOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Desafio Ativo</Text>
            {challenges.map(c => (
              <TouchableOpacity 
                key={c.id} 
                style={styles.selectOptionRow}
                onPress={() => {
                  selectChallengeContext(c, c.creator_id === currentUser.id);
                  setIsHeaderSelectOpen(false);
                }}
              >
                <Text style={styles.selectOptionText}>{c.title} ({c.creator_id === currentUser.id ? '🔑 Admin' : '⚡ Atleta'})</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isPerfScopeSelectOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsPerfScopeSelectOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Visualizar Desempenho Por:</Text>
            <TouchableOpacity 
              style={styles.selectOptionRow}
              onPress={() => { setAthletePerfScope('overall'); setIsPerfScopeSelectOpen(false); }}
            >
              <Text style={styles.selectOptionText}>🌐 Somatório Geral (Todos os Desafios)</Text>
            </TouchableOpacity>
            {userMembershipsAll.map(m => {
              const ch = challenges.find(c => c.id === m.challengeId);
              return (
                <TouchableOpacity 
                  key={m.challengeId} 
                  style={styles.selectOptionRow}
                  onPress={() => { setAthletePerfScope(m.challengeId); setIsPerfScopeSelectOpen(false); }}
                >
                  <Text style={styles.selectOptionText}>🎯 {ch ? ch.title : 'Desafio'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isManualAthleteSelectOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsManualAthleteSelectOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escolha o Atleta Ativo</Text>
            {activeMembersInChallenge.map(m => (
              <TouchableOpacity 
                key={m.userId} 
                style={styles.selectOptionRow}
                onPress={() => { setManualAthleteId(m.userId); setIsManualAthleteSelectOpen(false); }}
              >
                <Text style={styles.selectOptionText}>{m.name} ({m.nickname})</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isManualActivitySelectOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsManualActivitySelectOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione a Modalidade</Text>
            {['musculacao', 'crossfit', 'corrida', 'caminhada', 'bike', 'esporte_coletivo', 'esporte_individual', 'aerobico'].map(act => (
              <TouchableOpacity 
                key={act} 
                style={styles.selectOptionRow}
                onPress={() => { setManualActivity(act); setIsManualActivitySelectOpen(false); }}
              >
                <Text style={styles.selectOptionText}>{act.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isEditingChallengeSelectOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsEditingChallengeSelectOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Desafio para Configurar</Text>
            {adminChallenges.map(c => (
              <TouchableOpacity 
                key={c.id} 
                style={styles.selectOptionRow}
                onPress={() => {
                  setEditingChallengeId(c.id);
                  setEditingRules(JSON.parse(JSON.stringify(c.rules || {})));
                  setTiebreakerEnabled(c.tiebreakerEnabled ?? true);
                  if (c.tiebreakersConfig) setTiebreakersConfig(c.tiebreakersConfig);
                  setIsEditingChallengeSelectOpen(false);
                }}
              >
                <Text style={styles.selectOptionText}>{c.title} ({c.invite_code})</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={isRuleTabSelectOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsRuleTabSelectOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione a Modalidade</Text>
            {[
              { id: 'musculacao', label: '💪 MUSCULAÇÃO' },
              { id: 'crossfit', label: '🏋️ CROSSFIT / FUNCIONAL' },
              { id: 'aerobico', label: '🧘 AERÓBICO' },
              { id: 'corrida', label: '🏃 CORRIDA' },
              { id: 'caminhada', label: '🚶 CAMINHADA' },
              { id: 'bike', label: '🚴 BIKE' },
              { id: 'esporte_coletivo', label: '⚽ ESPORTE COLETIVO' },
              { id: 'esporte_individual', label: '🎾 ESPORTE INDIVIDUAL' },
              { id: 'bonuses_desempate', label: '🏆 BÔNUS & DESEMPATE' },
            ].map(tab => (
              <TouchableOpacity 
                key={tab.id} 
                style={styles.selectOptionRow}
                onPress={() => { setSelectedRuleTab(tab.id); setIsRuleTabSelectOpen(false); }}
              >
                <Text style={styles.selectOptionText}>{tab.label}</Text>
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
  topHeader: { padding: 12, backgroundColor: '#1e3a8a', position: 'relative' },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  brandTitle: { fontSize: 20, fontWeight: '900', color: '#f97316' },
  brandSubtitle: { fontSize: 10, fontWeight: 'bold', color: '#ffffff' },
  
  activeChallengeSelectorBar: { backgroundColor: '#172554', padding: 6, borderRadius: 6, marginBottom: 6 },
  activeChallengeSelectorLabel: { fontSize: 9, color: '#f97316', fontWeight: 'bold', marginBottom: 2 },

  nativeSelectButton: { backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6 },
  nativeSelectButtonText: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },
  selectOptionRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  selectOptionText: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },

  searchInput: { backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 8 : 4, fontSize: 11, color: '#0f172a', borderWidth: 1, borderColor: '#cbd5e1' },
  
  // Z-INDEX CORRIGIDO PARA NATIVO
  searchResultsDropdown: { position: 'absolute', top: 40, left: 0, right: 0, backgroundColor: '#ffffff', borderRadius: 8, padding: 10, borderWidth: 2, borderColor: '#f97316', elevation: 5 },
  searchHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
  searchHeaderTitle: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' },
  closeSearchBtn: { backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  closeSearchText: { fontSize: 8, color: '#dc2626', fontWeight: 'bold' },

  searchFilterRow: { flexDirection: 'row', gap: 6, marginBottom: 8, paddingBottom: 6 },
  searchFilterChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  searchFilterChipActive: { backgroundColor: '#1e3a8a' },
  searchFilterChipText: { fontSize: 9, fontWeight: 'bold', color: '#475569' },
  searchFilterChipTextActive: { color: '#ffffff' },
  searchSectionHeader: { fontSize: 9, fontWeight: 'bold', color: '#f97316', marginBottom: 4, marginTop: 4 },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#ffffff', borderRadius: 4, marginBottom: 2 },
  searchResultTitle: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },
  searchResultSub: { fontSize: 8, color: '#16a34a', fontWeight: 'bold' },
  emptySearchText: { fontSize: 9, color: '#94a3b8', fontStyle: 'italic', padding: 6, textAlign: 'center' },

  topWinnersBannerBox: { backgroundColor: '#fef3c7', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#d97706', marginBottom: 10 },
  topWinnersBannerTitle: { fontSize: 10, fontWeight: '900', color: '#b45309', marginBottom: 2 },
  topWinnersBannerList: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },

  sidebar: { width: 110, backgroundColor: '#f8fafc', borderRightWidth: 1, borderRightColor: '#cbd5e1', paddingVertical: 10 },
  sidebarBtn: { paddingVertical: 12, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  sidebarBtnActive: { backgroundColor: '#ffffff', borderLeftWidth: 4, borderLeftColor: '#f97316' },
  sidebarIcon: { fontSize: 12 },
  sidebarText: { fontSize: 9, fontWeight: 'bold', color: '#64748b' },
  sidebarTextActive: { color: '#f97316' },

  mainContent: { padding: 12 },
  pageTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginVertical: 8 },
  sectionHeaderTitle: { fontSize: 12, fontWeight: 'bold', color: '#f97316', marginVertical: 6 },
  emptyNoticeText: { fontSize: 10, color: '#94a3b8', fontStyle: 'italic', marginBottom: 8 },

  createChallengeBtnHeader: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  createChallengeBtnText: { color: '#ffffff', fontSize: 9, fontWeight: 'bold' },

  cardBox: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  cardBoxTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  cardBoxSub: { fontSize: 10, color: '#64748b', marginVertical: 2 },

  tagOpen: { backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: 9, fontWeight: 'bold', padding: 4, borderRadius: 4 },
  tagClosed: { backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 9, fontWeight: 'bold', padding: 4, borderRadius: 4 },

  podiumContainer: { backgroundColor: '#fff7ed', borderRadius: 10, padding: 12, borderWidth: 2, borderColor: '#f97316', marginBottom: 14, alignItems: 'center' },
  podiumHeaderTitle: { fontSize: 14, fontWeight: '900', color: '#c2410c', marginBottom: 10 },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, width: '100%' },
  podiumCard1st: { backgroundColor: '#fef3c7', padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: '#d97706', width: '36%' },
  podiumCard2nd: { backgroundColor: '#f1f5f9', padding: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#94a3b8', width: '30%' },
  podiumCard3rd: { backgroundColor: '#fff7ed', padding: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#f97316', width: '30%' },
  podiumMedal: { fontSize: 9, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 4 },
  avatarLargePodium: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#d97706', marginBottom: 4 },
  podiumName1st: { fontSize: 11, fontWeight: 'bold', color: '#92400e' },
  podiumPts1st: { fontSize: 11, fontWeight: '900', color: '#d97706' },
  podiumName: { fontSize: 9, fontWeight: 'bold', color: '#334155' },
  podiumPts: { fontSize: 9, fontWeight: 'bold', color: '#16a34a' },

  adminControlCard: { backgroundColor: '#fff7ed', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#f97316', marginBottom: 12 },
  adminCardTitle: { fontSize: 12, fontWeight: 'bold', color: '#c2410c', marginBottom: 4 },
  adminCardSub: { fontSize: 10, color: '#475569', marginBottom: 8 },

  toggleRegBtn: { backgroundColor: '#1e3a8a', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  toggleRegBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },

  participantRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#fed7aa', marginTop: 6 },
  participantInfoBox: { flex: 1, marginLeft: 8 },
  participantName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  tagActiveText: { fontSize: 9, color: '#16a34a', fontWeight: 'bold' },
  tagSpectatorText: { fontSize: 9, color: '#1e3a8a', fontWeight: 'bold' },
  participantSub: { fontSize: 9, color: '#64748b' },

  actionButtonsRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  approveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  demoteBtn: { backgroundColor: '#d97706', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  banBtn: { backgroundColor: '#dc2626', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  inviteBtn: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, justifyContent: 'center' },
  deleteChallengeBtn: { backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, justifyContent: 'center' },
  finishChallengeBtn: { backgroundColor: '#d97706', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, justifyContent: 'center' },
  btnMiniText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },

  rankingRowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6 },
  rankingPosNumber: { fontSize: 14, fontWeight: '900', color: '#f97316', width: 30 },
  rankingMemberName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  rankingMemberSub: { fontSize: 9, color: '#64748b' },
  rankingMemberPts: { fontSize: 12, fontWeight: 'bold', color: '#16a34a' },
  rankingMemberBank: { fontSize: 8, color: '#64748b' },

  spectatorRowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 6 },
  spectatorName: { fontSize: 10, fontWeight: 'bold', color: '#334155' },
  spectatorSub: { fontSize: 8, color: '#94a3b8' },
  spectatorBadge: { backgroundColor: '#eff6ff', color: '#1e3a8a', fontSize: 8, fontWeight: 'bold', padding: 4, borderRadius: 4 },

  primaryBtn: { backgroundColor: '#f97316', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },

  actionBtn: { backgroundColor: '#1e3a8a', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginBottom: 12 },
  actionBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },

  restrictedNoticeBox: { backgroundColor: '#eff6ff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#1e3a8a', marginBottom: 12 },
  restrictedNoticeText: { fontSize: 10, color: '#1e3a8a', fontWeight: 'bold' },

  inviteNoticeBox: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#16a34a', marginBottom: 12 },
  inviteNoticeTitle: { fontSize: 11, fontWeight: 'bold', color: '#16a34a', marginBottom: 6 },
  inviteItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  inviteChallengeName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  inviteSubText: { fontSize: 9, color: '#64748b' },
  acceptInviteBtn: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  declineInviteBtn: { backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },

  postCard: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 12, overflow: 'hidden' },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#f8fafc' },
  avatarMini: { width: 32, height: 32, borderRadius: 16 },
  postAuthor: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  postTime: { fontSize: 9, color: '#64748b' },
  postImg: { width: '100%', height: 180 },
  postCaption: { fontSize: 11, color: '#334155', marginBottom: 4 },
  badgePts: { backgroundColor: '#fff7ed', color: '#c2410c', fontSize: 9, fontWeight: 'bold', padding: 4, borderRadius: 4, alignSelf: 'flex-start' },

  socialBar: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8, marginTop: 8 },
  socialBtn: {},
  socialBtnText: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
  commentsListContainer: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 6, marginTop: 6 },
  commentItemText: { fontSize: 9, color: '#334155', marginBottom: 2 },
  addCommentRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  commentInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, paddingHorizontal: 6, fontSize: 9 },
  sendCommentBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 8, justifyContent: 'center', borderRadius: 4 },
  sendCommentBtnText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },

  profileHeaderCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', position: 'relative', marginBottom: 10 },
  editBtnBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: '#1e3a8a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  editBtnBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: 'bold' },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, marginBottom: 6, borderWidth: 2, borderColor: '#f97316' },
  profileName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  profileMeta: { fontSize: 10, color: '#64748b', marginBottom: 4 },

  perfScopeBox: { width: '100%', marginVertical: 6 },

  statusBadgeRow: { marginBottom: 8 },
  statusActiveTag: { backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },

  scoreRowContainer: { flexDirection: 'row', gap: 8, width: '100%', marginVertical: 8, justifyContent: 'center' },
  scoreBoxItem: { flex: 1, backgroundColor: '#ffffff', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  scoreNumber: { fontSize: 14, fontWeight: '900', color: '#f97316' },
  scoreLabel: { fontSize: 8, fontWeight: 'bold', color: '#1e3a8a', marginTop: 2 },

  storiesBox: { width: '100%', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 },
  boxTitle: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' },
  addStoryBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  storyImg: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#f97316', marginRight: 8 },
  videoBadgeTag: { position: 'absolute', bottom: 2, right: 10, backgroundColor: '#1e3a8a', borderRadius: 8, width: 14, height: 14, justifyContent: 'center', alignItems: 'center' },

  // PLAYER STORIES
  storyViewerOverlay: { flex: 1, backgroundColor: '#000000', justifyContent: 'space-between', paddingVertical: 20 },
  storyViewerHeader: { paddingHorizontal: 16 },
  storyProgressBarBg: { width: '100%', height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  storyProgressBarFill: { height: '100%', backgroundColor: '#ffffff' },
  storyMediaContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  storyFullImg: { width: '100%', height: '80%' },

  medalsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 6 },
  medalText: { fontSize: 10, fontWeight: 'bold', color: '#334155' },
  insigniaTag: { backgroundColor: '#fff7ed', color: '#c2410c', fontSize: 9, fontWeight: 'bold', padding: 3, borderRadius: 4 },
  insigniaTagBlue: { backgroundColor: '#eff6ff', color: '#1e3a8a', fontSize: 9, fontWeight: 'bold', padding: 3, borderRadius: 4 },

  chartsGrid: { gap: 6, marginBottom: 10 },
  chartCard: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  chartTitle: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },
  chartBarMock: { backgroundColor: '#eff6ff', borderRadius: 4, padding: 6, marginTop: 4 },
  chartBarText: { fontSize: 10, color: '#1e3a8a', fontWeight: 'bold' },
  chartSubText: { fontSize: 10, color: '#475569', marginTop: 2 },

  evidenceCard: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 6, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 6, width: 100 },
  evidenceImg: { width: '100%', height: 75, borderRadius: 4, marginBottom: 4 },
  evidenceTitle: { fontSize: 9, fontWeight: 'bold', color: '#0f172a' },
  evidenceDate: { fontSize: 8, color: '#94a3b8' },

  smallAddBtn: { backgroundColor: '#f97316', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  smallAddBtnText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },

  goalItem: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 4 },
  goalText: { fontSize: 10, color: '#0f172a', fontWeight: 'bold' },
  goalDone: { textDecorationLine: 'line-through', color: '#94a3b8' },

  rulesInfoBox: { backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#f97316', borderRadius: 8, padding: 10, marginBottom: 12 },
  rulesInfoTitle: { fontSize: 11, fontWeight: 'bold', color: '#c2410c', marginBottom: 4 },
  rulesInfoText: { fontSize: 9, color: '#334155', marginBottom: 2 },

  ruleSectionBox: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10 },
  ruleSectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 6 },

  toggleModalidadeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#1e3a8a', marginBottom: 10 },
  toggleModalidadeText: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },

  modeCardOption: { backgroundColor: '#ffffff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  modeCardOptionActive: { borderColor: '#f97316', borderWidth: 2, backgroundColor: '#fff7ed' },
  modeCardTitle: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  modeCardDisabledText: { fontSize: 9, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 },

  stepBoxRow: { backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6 },
  stepBoxLabel: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },
  stepRemoveText: { fontSize: 9, color: '#dc2626', fontWeight: 'bold' },
  addStepBtn: { backgroundColor: '#1e3a8a', paddingVertical: 6, borderRadius: 6, alignItems: 'center', marginTop: 4 },
  addStepBtnText: { color: '#ffffff', fontSize: 9, fontWeight: 'bold' },

  tiebreakerCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 4 },
  tiebreakerCheckLabel: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },

  bonusConfigCard: { backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#fed7aa', marginBottom: 6 },
  bonusTitleText: { fontSize: 10, fontWeight: 'bold', color: '#c2410c' },
  bonusDescText: { fontSize: 8, color: '#64748b', marginTop: 2 },

  inviteBoxHighlight: { backgroundColor: '#eff6ff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#1e3a8a', marginBottom: 10 },

  mediaFieldBox: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 8, marginBottom: 8 },
  mediaLabel: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 6 },
  mediaButtonsRow: { flexDirection: 'row', gap: 8 },
  cameraBtn: { flex: 1, backgroundColor: '#f97316', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  galleryBtn: { flex: 1, backgroundColor: '#1e3a8a', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  mediaBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  previewContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  previewImage: { width: 36, height: 36, borderRadius: 6, borderWidth: 1, borderColor: '#16a34a' },
  previewSuccessText: { color: '#16a34a', fontSize: 9, fontWeight: 'bold' },
  previewPendingText: { color: '#94a3b8', fontSize: 9, fontStyle: 'italic', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 14 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, maxHeight: '90%' },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 10, textAlign: 'center' },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#475569', marginVertical: 4 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 6, fontSize: 11, marginBottom: 6 },
  inputArea: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 6, fontSize: 11, height: 50, textAlignVertical: 'top', marginBottom: 8 },

  chipBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  chipBtnActive: { backgroundColor: '#f97316' },
  chipText: { fontSize: 9, fontWeight: 'bold', color: '#475569' },
  chipTextActive: { color: '#ffffff' },

  cancelBtn: { marginTop: 6, paddingVertical: 4, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' }
});
