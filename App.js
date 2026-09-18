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
  // GERENCIAMENTO DE SESSÃO REAL DO SUPABASE (ETAPA 1)
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // ESTADOS DE AUTENTICAÇÃO
  const [authMode, setAuthMode] = useState('login'); // 'login' ou 'signup'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authNickname, setAuthNickname] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // ATLETA CONECTADO
  const [currentUser, setCurrentUser] = useState(null);
  const [viewedUser, setViewedUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  
  // BARRA DE PESQUISA (Z-INDEX 9999 - ETAPA 5)
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

  // SELETORES DE HORÁRIO NATIVOS (ETAPA 3)
  const [isStartHourSelectOpen, setIsStartHourSelectOpen] = useState(false);
  const [isStartMinSelectOpen, setIsStartMinSelectOpen] = useState(false);
  const [isEndHourSelectOpen, setIsEndHourSelectOpen] = useState(false);
  const [isEndMinSelectOpen, setIsEndMinSelectOpen] = useState(false);

  // DURAÇÃO DO DESAFIO (ETAPA 4)
  const [isDurationSelectOpen, setIsDurationSelectOpen] = useState(false);
  const [newChallengeDuration, setNewChallengeDuration] = useState('Mensal');

  // ESTRUTURA COMPLETA DAS LIGAS E TEMPORADAS
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
      hallOfFame: [],
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
      duration_type: 'Mensal',
      season_number: 1,
      has_daily_cap: false,
      daily_cap: null,
      registrations_closed: false,
      is_finished: false,
      season_ended_pending: false,
      startDate: '10/09/2026',
      endDate: '10/10/2026',
      tiebreakerEnabled: false,
      tiebreakersConfig: [],
      bonuses: {
        inquebravel: { active: false, days: 7, points: 0 },
        desperta: { active: true, limitTime: '06:00', points: 4000 }
      },
      hallOfFame: [],
      rules: {
        musculacao: { enabled: true, mode: 'tempo', minMinutes: 45, minPoints: 6000, steps: [], stepsKm: [] },
        corrida: { enabled: true, mode: 'km', minKm: 5, minKmPoints: 8000, steps: [], stepsKm: [] },
        passos_diarios: { enabled: true }
      }
    }
  ]);

  const [activeChallengeId, setActiveChallengeId] = useState('c1');
  const [isAdminContext, setIsAdminContext] = useState(true);

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0];
  const [editingChallengeId, setEditingChallengeId] = useState(selectedChallenge ? selectedChallenge.id : 'c1');

  // CONVITES PENDENTES
  const [pendingInvites, setPendingInvites] = useState([
    {
      id: 'inv_1',
      challengeId: 'c2',
      challengeTitle: 'Desafio Reta Final MuvFit',
      inviterName: 'Rafael Souza'
    }
  ]);

  // PARTICIPANTES
  const [memberships, setMemberships] = useState([
    { challengeId: 'c1', userId: 'usr_capella', name: 'Luiz Capella', nickname: 'Poke', role: 'active', rankingPoints: 22000, bankPoints: 15400, totalSteps: 42350, avatar: 'https://picsum.photos/seed/poke/200/200', goldMedals: 3, silverMedals: 1, bronzeMedals: 0, age: 34, gender: 'Masculino', insigniaInquebravelCount: 3, insigniaDespertaCount: 1 },
    { challengeId: 'c1', userId: 'm_usr2', name: 'Rafael Souza', nickname: 'Rafa', role: 'active', rankingPoints: 14000, bankPoints: 2000, totalSteps: 31000, avatar: 'https://picsum.photos/seed/rafa/100/100', goldMedals: 2, silverMedals: 2, bronzeMedals: 1, age: 29, gender: 'Masculino', insigniaInquebravelCount: 1, insigniaDespertaCount: 0 },
    { challengeId: 'c1', userId: 'm_usr4', name: 'Carlos Eduardo', nickname: 'Cadu', role: 'active', rankingPoints: 8000, bankPoints: 0, totalSteps: 12000, avatar: 'https://picsum.photos/seed/cadu/100/100', goldMedals: 1, silverMedals: 0, bronzeMedals: 0, age: 31, gender: 'Masculino', insigniaInquebravelCount: 0, insigniaDespertaCount: 0 },
    { challengeId: 'c1', userId: 'm_usr3', name: 'Beatriz Lima', nickname: 'Bia', role: 'spectator', rankingPoints: 0, bankPoints: 0, totalSteps: 5000, avatar: 'https://picsum.photos/seed/bia/100/100', goldMedals: 0, silverMedals: 0, bronzeMedals: 0, age: 26, gender: 'Feminino', insigniaInquebravelCount: 0, insigniaDespertaCount: 0 }
  ]);

  const [pendingParticipants, setPendingParticipants] = useState([
    { challengeId: 'c1', id: 'p_usr3', name: 'Lucas Mendes', nickname: 'Luquinhas', avatar: 'https://picsum.photos/seed/lucas/100/100', age: 25, gender: 'Masculino' }
  ]);

  const [dailySubmissions, setDailySubmissions] = useState([]);
  const [feedPosts, setFeedPosts] = useState([
    {
      id: 'p1',
      challengeId: 'c1',
      user_id: 'usr_capella',
      user_name: 'Luiz Capella',
      user_nickname: 'Poke',
      user_avatar: 'https://picsum.photos/seed/poke/200/200',
      activity_type: 'MUSCULAÇÃO',
      caption: 'Treino de perna concluído na Liga Anti-Inércia! 🦵',
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

  const [pendingWorkouts, setPendingWorkouts] = useState([
    {
      id: 'pw_1',
      challengeId: 'c1',
      user_id: 'm_usr2',
      user_name: 'Rafael Souza',
      user_nickname: 'Rafa',
      user_avatar: 'https://picsum.photos/seed/rafa/100/100',
      activity_type: 'MUSCULAÇÃO',
      caption: 'Treino de superiores finalizado!',
      dateStr: '18/09/2026',
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
    { id: 'e1', title: 'Força / Perna', date: '18/09/2026', image: 'https://picsum.photos/seed/ev1/200/200' },
    { id: 'e2', title: 'Corrida 8km', date: '15/09/2026', image: 'https://picsum.photos/seed/ev2/200/200' }
  ]);

  // FORMULÁRIO DE TREINO (ETAPA 3)
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

  // FOTOS DO TREINO COM APAGAR/TROCAR PRE-ENVIO (ETAPA 2)
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

  // LANÇAMENTO MANUAL ADMIN
  const [manualAthleteId, setManualAthleteId] = useState('');
  const [manualActivity, setManualActivity] = useState('musculacao');
  const [manualRankingPointsInput, setManualRankingPointsInput] = useState('');
  const [manualBankPointsInput, setManualBankPointsInput] = useState('');
  const [manualStepsInput, setManualStepsInput] = useState('');
  const [manualInquebravelCheck, setManualInquebravelCheck] = useState(false);
  const [manualDespertaCheck, setManualDespertaCheck] = useState(false);

  // PERFIL E OBJETIVOS COM X VERMELHO (ETAPA 6)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const [userGoals, setUserGoals] = useState([]);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');

  // HISTÓRICO DE PESO E MÉTRICAS CLICÁVEIS (ETAPA 6)
  const [currentWeight, setCurrentWeight] = useState('79');
  const [newWeightInput, setNewWeightInput] = useState('');
  const [isEditWeightOpen, setIsEditWeightOpen] = useState(false);
  const [weightHistory, setWeightHistory] = useState([
    { date: '01/09/2026', weight: '82.0 kg' },
    { date: '15/09/2026', weight: '79.0 kg' }
  ]);
  const [selectedMetricModal, setSelectedMetricModal] = useState(null);

  // STORIES (ETAPA 2)
  const [stories, setStories] = useState([]);
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [newStoryMedia, setNewStoryMedia] = useState(null);
  const [newStoryType, setNewStoryType] = useState('image');
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);

  // CHECAGEM DE SESSÃO DO SUPABASE AO ABRIR O APP (ETAPA 1)
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
        goldMedals: 3,
        silverMedals: 1,
        bronzeMedals: 0,
        insigniaInquebravelCount: 3,
        insigniaDespertaCount: 1
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

  // AUTENTICAÇÃO REAL (ETAPA 1)
  async function handleAuthSubmit() {
    if (!authEmail.trim() || !authPassword.trim()) {
      Alert.alert('Atenção', 'Informe e-mail e senha.');
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
        if (error) Alert.alert('Falha no Cadastro', error.message);
        else Alert.alert('Conta Criada!', 'Cadastro efetuado com sucesso.');
      }
    } catch (err) {
      Alert.alert('Erro', 'Falha ao conectar com o servidor.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Sair da Conta', 'Deseja encerrar sua sessão?', [
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
    ]);
  }

  // CÂMERA E GALERIA NATIVAS (ETAPA 2)
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

  // REINICIAR TEMPORADA E HALL DA FAMA (ETAPA 4)
  function handleStartNewSeason(challengeId) {
    const targetChallenge = challenges.find(c => c.id === challengeId);
    if (!targetChallenge) return;

    Alert.alert(
      '🏆 Iniciar Nova Temporada',
      `Deseja encerrar a Temporada ${targetChallenge.season_number || 1} e zerar a pontuação?\n\n(Os campeões serão arquivados no Hall da Fama e os dados da Central do Atleta permanecerão salvos).`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Iniciar Nova Temporada',
          onPress: () => {
            const currentMembers = memberships.filter(m => m.challengeId === challengeId);
            const top3 = [...currentMembers].sort((a,b) => b.rankingPoints - a.rankingPoints).slice(0, 3);
            const championNames = top3.map((m, idx) => `${m.name} (${idx + 1}º)`);

            const newHallEntry = {
              season: `Temporada ${targetChallenge.season_number || 1}`,
              champions: championNames.length > 0 ? championNames : ['Sem participantes']
            };

            setChallenges(challenges.map(c => c.id === challengeId ? {
              ...c,
              season_number: (c.season_number || 1) + 1,
              season_ended_pending: false,
              hallOfFame: [newHallEntry, ...(c.hallOfFame || [])]
            } : c));

            setMemberships(memberships.map(m => m.challengeId === challengeId ? { ...m, rankingPoints: 0, bankPoints: 0 } : m));
            Alert.alert('🚀 Nova Temporada Iniciada!', `A Temporada ${(targetChallenge.season_number || 1) + 1} começou.`);
          }
        }
      ]
    );
  }

  // COMPUTAÇÃO DE PONTOS
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
        startTime: `${startHour}:${startMin}`,
        endTime: `${endHour}:${endMin}`,
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
    resetWorkoutForm();
    Alert.alert('Sucesso', 'Treino submetido! Aguardando aprovação.');
  }

  function resetWorkoutForm() {
    setDurationInput('');
    setDistanceInput('');
    setStepsInput('');
    setWorkoutCaption('');
    setPhotoStart(null);
    setPhotoEnd(null);
    setPhotoEvidence(null);
  }

  // APROVAÇÃO ADMIN
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

  // OBJETIVOS: ADICIONAR E DELETAR COM X VERMELHO (ETAPA 6)
  function handleAddGoal() {
    if (!newGoalTitle.trim()) return;
    setUserGoals([...userGoals, { id: `g_${Date.now()}`, title: newGoalTitle.trim(), completed: false }]);
    setNewGoalTitle('');
    setIsAddGoalOpen(false);
  }

  function handleDeleteGoal(goalId) {
    setUserGoals(userGoals.filter(g => g.id !== goalId));
  }

  // SAIR DO DESAFIO (ETAPA 6)
  function handleLeaveChallenge(challengeId) {
    Alert.alert('Sair do Desafio', 'Deseja remover seu vínculo com esta liga?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair do Desafio',
        style: 'destructive',
        onPress: () => {
          setMemberships(memberships.filter(m => !(m.challengeId === challengeId && m.userId === currentUser.id)));
          Alert.alert('Sucesso', 'Você saiu do desafio.');
        }
      }
    ]);
  }

  // PESO EDITÁVEL (ETAPA 6)
  function handleSaveWeight() {
    if (!newWeightInput.trim()) return;
    const todayStr = new Date().toLocaleDateString();
    const newEntry = { date: todayStr, weight: `${newWeightInput.trim()} kg` };
    setCurrentWeight(newWeightInput.trim());
    setWeightHistory([newEntry, ...weightHistory]);
    setNewWeightInput('');
    setIsEditWeightOpen(false);
    Alert.alert('Peso Atualizado!', 'Registro salvo com sucesso.');
  }

  // COMPONENTE DE MÍDIA COM APAGAR/TROCAR PRE-ENVIO (ETAPA 2)
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

  // TELA DE LOGIN / CADASTRO SE NÃO HOUVER SESSÃO
  if (!session || !currentUser) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <ScrollView contentContainerStyle={styles.authContent}>
          <Text style={styles.authBrandTitle}>MUVFIT</Text>
          <Text style={styles.authBrandSubtitle}>Mizan Soluções Técnicas</Text>

          <View style={styles.authCard}>
            <Text style={styles.authTitle}>{authMode === 'login' ? '🔑 Entrar no Aplicativo' : '📝 Criar Conta'}</Text>
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

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAuthSubmit} disabled={authSubmitting}>
              {authSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>{authMode === 'login' ? 'ENTRAR' : 'CRIAR MINHA CONTA'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 14, alignItems: 'center' }} onPress={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
              <Text style={{ fontSize: 11, color: '#1e3a8a', fontWeight: 'bold' }}>
                {authMode === 'login' ? 'Não possui uma conta? Cadastre-se' : 'Já tem conta? Faça login'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const userMembershipsAll = memberships.filter(m => m.userId === currentUser.id);
  const hasUserAnyCommunity = userMembershipsAll.length > 0;
  const currentChallengeMembers = memberships.filter(m => m.challengeId === activeChallengeId);
  const activeMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'active');
  const spectatorMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'spectator');
  const top3Ranked = [...activeMembersInChallenge].sort((a,b) => b.rankingPoints - a.rankingPoints).slice(0, 3);
  const currentFeedPosts = feedPosts.filter(p => p.challengeId === activeChallengeId);
  const currentPendingParticipants = pendingParticipants.filter(p => p.challengeId === activeChallengeId);
  const currentPendingWorkouts = pendingWorkouts.filter(w => w.challengeId === activeChallengeId);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER E BARRA DE BUSCA Z-INDEX 9999 (ETAPA 5) */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>MUVFIT</Text>
          <Text style={styles.brandSubtitle}>Mizan Soluções Técnicas</Text>
        </View>

        {hasUserAnyCommunity && selectedChallenge && (
          <View style={styles.activeChallengeSelectorBar}>
            <Text style={styles.activeChallengeSelectorLabel}>🎯 Desafio Selecionado:</Text>
            <TouchableOpacity style={styles.nativeSelectButton} onPress={() => setIsHeaderSelectOpen(true)}>
              <Text style={styles.nativeSelectButtonText}>
                {selectedChallenge.title} ({selectedChallenge.creator_id === currentUser.id ? '🔑 Admin' : '⚡ Atleta'}) ▼
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ width: '100%', zIndex: 9999 }}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Pesquisar Atletas ou Ligas..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onChangeText={(txt) => { setSearchQuery(txt); if (!isSearchOpen) setIsSearchOpen(true); }}
          />

          {isSearchOpen && (
            <View style={styles.searchResultsDropdown}>
              <View style={styles.searchHeaderTop}>
                <Text style={styles.searchHeaderTitle}>🔎 Pesquisa Geral MUVFIT</Text>
                <TouchableOpacity onPress={() => setIsSearchOpen(false)} style={styles.closeSearchBtn}>
                  <Text style={styles.closeSearchText}>✕ FECHAR</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 200 }}>
                {memberships.map((m) => (
                  <TouchableOpacity key={m.userId} style={styles.searchResultItem} onPress={() => setIsSearchOpen(false)}>
                    <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                    <Text style={styles.searchResultTitle}>{m.name} ({m.nickname})</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* BARRA LATERAL */}
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

              {challenges.map(c => (
                <View key={c.id} style={styles.cardBox}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.cardBoxTitle}>{c.title} (Temporada {c.season_number || 1})</Text>
                    <TouchableOpacity style={styles.leaveChallengeBtn} onPress={() => handleLeaveChallenge(c.id)}>
                      <Text style={styles.btnMiniText}>🚪 SAIR</Text>
                    </TouchableOpacity>
                  </View>
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

          {/* TELA 2: FEED */}
          {currentScreen === 'feed' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.pageTitle}>Feed — {selectedChallenge.title}</Text>
              </View>

              <TouchableOpacity style={styles.actionBtn} onPress={() => setIsWorkoutModalOpen(true)}>
                <Text style={styles.actionBtnText}>+ REGISTRAR TREINO / PASSOS</Text>
              </TouchableOpacity>

              {currentFeedPosts.map((post) => (
                <View key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <Image source={{ uri: post.user_avatar }} style={styles.avatarMini} />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.postAuthor}>{post.user_name} ({post.user_nickname})</Text>
                      <Text style={styles.postTime}>{post.created_at} • ✅ Aprovado</Text>
                    </View>
                  </View>
                  <Image source={{ uri: post.photo_evidence }} style={styles.postImg} />
                  <View style={{ padding: 10 }}>
                    <Text style={styles.postCaption}>{post.caption}</Text>
                    <Text style={styles.badgePts}>+{post.points_to_ranking} pts (Ranking)</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* TELA 3: RANKING COM PÓDIO */}
          {currentScreen === 'ranking' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={styles.pageTitle}>🏆 Ranking — {selectedChallenge.title}</Text>

              {top3Ranked.length >= 3 && (
                <View style={styles.podiumContainer}>
                  <Text style={styles.podiumHeaderTitle}>🏆 PÓDIO ATUAL DA LIGA 🏆</Text>
                  <View style={styles.podiumRow}>
                    <View style={styles.podiumCard2nd}>
                      <Text style={styles.podiumMedal}>🥈 2º LUGAR</Text>
                      <Text style={styles.podiumName}>{top3Ranked[1].name}</Text>
                      <Text style={styles.podiumPts}>{top3Ranked[1].rankingPoints} pts</Text>
                    </View>

                    <View style={styles.podiumCard1st}>
                      <Text style={styles.podiumMedal}>🥇 CAMPEÃO</Text>
                      <Text style={styles.podiumName1st}>{top3Ranked[0].name}</Text>
                      <Text style={styles.podiumPts1st}>{top3Ranked[0].rankingPoints} pts</Text>
                    </View>

                    <View style={styles.podiumCard3rd}>
                      <Text style={styles.podiumMedal}>🥉 3º LUGAR</Text>
                      <Text style={styles.podiumName}>{top3Ranked[2].name}</Text>
                      <Text style={styles.podiumPts}>{top3Ranked[2].rankingPoints} pts</Text>
                    </View>
                  </View>
                </View>
              )}

              {activeMembersInChallenge.map((m, idx) => (
                <View key={m.userId} style={styles.rankingRowCard}>
                  <Text style={styles.rankingPosNumber}>#{idx + 1}</Text>
                  <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.rankingMemberName}>{m.name} ({m.nickname})</Text>
                    <Text style={styles.rankingMemberSub}>{m.totalSteps} passos</Text>
                  </View>
                  <Text style={styles.rankingMemberPts}>{m.rankingPoints} pts</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* TELA 4: CENTRAL DO ATLETA (CLICÁVEL + OBJETIVOS COM X VERMELHO) */}
          {currentScreen === 'athlete_center' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.profileHeaderCard}>
                <TouchableOpacity style={styles.logoutBtnProfile} onPress={handleLogout}>
                  <Text style={styles.logoutBtnProfileText}>🚪 SAIR</Text>
                </TouchableOpacity>

                <Image source={{ uri: viewedUser?.avatar }} style={styles.avatarLarge} />
                <Text style={styles.profileName}>{viewedUser?.name}</Text>
                <Text style={styles.profileMeta}>{viewedUser?.age} anos | {viewedUser?.gender}</Text>

                <View style={styles.storiesBox}>
                  <Text style={styles.boxTitle}>Stories do Atleta (Últimas 24h)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 6 }}>
                    {viewedUser?.id === currentUser?.id && (
                      <TouchableOpacity style={styles.addStoryBtn} onPress={() => setIsAddStoryOpen(true)}>
                        <Text style={{ color: '#ffffff', fontSize: 20, fontWeight: 'bold' }}>+</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              </View>

              <Text style={styles.pageTitle}>Evolução & Estatísticas (Clique para ver gráficos)</Text>
              
              <View style={styles.chartsGrid}>
                <TouchableOpacity style={styles.chartCard} onPress={() => setSelectedMetricModal('peso')}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.chartTitle}>📊 Evolução de Peso ({currentWeight} kg)</Text>
                    <TouchableOpacity style={styles.editBtnMini} onPress={() => setIsEditWeightOpen(true)}>
                      <Text style={styles.editBtnMiniText}>✏️ Editar</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.chartSubText}>Toque para ver a tabela e gráfico ➔</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.chartCard} onPress={() => setSelectedMetricModal('atividades')}>
                  <Text style={styles.chartTitle}>📊 Atividades Mais Praticadas</Text>
                  <Text style={styles.chartSubText}>Musculação (45%) | Corrida (35%) ➔</Text>
                </TouchableOpacity>
              </View>

              {/* OBJETIVOS PESSOAIS (INICIA ZERADO E COM X VERMELHO) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <Text style={styles.pageTitle}>Checklist de Objetivos Pessoais</Text>
                <TouchableOpacity style={styles.smallAddBtn} onPress={() => setIsAddGoalOpen(true)}>
                  <Text style={styles.smallAddBtnText}>+ OBJETIVO</Text>
                </TouchableOpacity>
              </View>

              {userGoals.length === 0 ? (
                <Text style={styles.emptyNoticeText}>Nenhum objetivo cadastrado. Adicione a sua meta acima.</Text>
              ) : (
                userGoals.map((g) => (
                  <View key={g.id} style={styles.goalItem}>
                    <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={() => setUserGoals(userGoals.map(i => i.id === g.id ? { ...i, completed: !i.completed } : i))}>
                      <Text style={{ fontSize: 16 }}>{g.completed ? '✅' : '⬜'}</Text>
                      <Text style={[styles.goalText, g.completed && styles.goalDone]}>{g.title}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.deleteGoalBtn} onPress={() => handleDeleteGoal(g.id)}>
                      <Text style={styles.deleteGoalBtnText}>✖</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* TELA 5: PAINEL ADMIN (MODERAÇÃO COM FOTOS REAIS + REGRAS AVANÇADAS) */}
          {currentScreen === 'admin' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={styles.pageTitle}>⚙️ Administração — {selectedChallenge.title}</Text>

              <View style={styles.seasonNoticeBox}>
                <Text style={styles.seasonNoticeTitle}>🏆 Fim de Temporada / Ciclo da Liga</Text>
                <Text style={styles.seasonNoticeSub}>Temporada Atual: {selectedChallenge.season_number || 1} ({selectedChallenge.duration_type || 'Mensal'})</Text>
                <TouchableOpacity style={styles.startSeasonBtn} onPress={() => handleStartNewSeason(selectedChallenge.id)}>
                  <Text style={styles.startSeasonBtnText}>🚀 INICIAR NOVA TEMPORADA (RESETAR PONTOS & SALVAR HALL DA FAMA)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>📋 Treinos Pendentes ({currentPendingWorkouts.length})</Text>
                {currentPendingWorkouts.map((w) => (
                  <View key={w.id} style={styles.participantRow}>
                    <Image source={{ uri: w.photo_evidence }} style={styles.avatarMini} />
                    <View style={styles.participantInfoBox}>
                      <Text style={styles.participantName}>{w.user_name} ({w.activity_type})</Text>
                      <Text style={styles.participantSub}>{w.caption}</Text>
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
                ))}
              </View>

              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>👥 Membros Cadastrados</Text>
                {currentChallengeMembers.map((m) => (
                  <View key={m.userId} style={styles.participantRow}>
                    <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                    <View style={styles.participantInfoBox}>
                      <Text style={styles.participantName} numberOfLines={1}>{m.name} ({m.nickname})</Text>
                      <Text style={styles.tagActiveText}>⚡ Atleta Ativo</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* MODAL REGISTRAR TREINO COM SELETOR DE HORAS E APAGAR/TROCAR PRE-ENVIO */}
      <Modal visible={isWorkoutModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar Treino ({selectedChallenge?.title})</Text>
            
            <Text style={styles.inputLabel}>Data da Atividade:</Text>
            <TextInput style={styles.input} value={workoutDate} onChangeText={setWorkoutDate} />

            <MediaPickerField label="Foto de Comprovação:" photoState={photoEvidence} setPhotoState={setPhotoEvidence} />
            
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitWorkout}>
              <Text style={styles.primaryBtnText}>SUBMETER TREINO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsWorkoutModalOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL PESO EDITÁVEL */}
      <Modal visible={isEditWeightOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Atualizar Peso (kg)</Text>
            <TextInput style={styles.input} placeholder="Ex: 78.5" keyboardType="numeric" value={newWeightInput} onChangeText={setNewWeightInput} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveWeight}><Text style={styles.primaryBtnText}>SALVAR PESO</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditWeightOpen(false)}><Text style={styles.cancelBtnText}>CANCELAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL ADICIONAR OBJETIVO */}
      <Modal visible={isAddGoalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Objetivo Pessoal</Text>
            <TextInput style={styles.input} placeholder="Ex: Correr 10km sem parar" value={newGoalTitle} onChangeText={setNewGoalTitle} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddGoal}><Text style={styles.primaryBtnText}>SALVAR</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddGoalOpen(false)}><Text style={styles.cancelBtnText}>CANCELAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL HISTÓRICO E GRÁFICOS */}
      <Modal visible={!!selectedMetricModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📊 Detalhes & Gráfico Histórico</Text>
            <View style={styles.graphContainer}>
              <View style={styles.graphBarRow}>
                <View style={[styles.graphBar, { height: '60%' }]} />
                <View style={[styles.graphBar, { height: '80%' }]} />
                <View style={[styles.graphBar, { height: '100%' }]} />
              </View>
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedMetricModal(null)}><Text style={styles.cancelBtnText}>FECHAR</Text></TouchableOpacity>
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

  topHeader: { padding: 12, backgroundColor: '#1e3a8a', zIndex: 9999, elevation: 10 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  brandTitle: { fontSize: 20, fontWeight: '900', color: '#f97316' },
  brandSubtitle: { fontSize: 10, fontWeight: 'bold', color: '#ffffff' },

  activeChallengeSelectorBar: { backgroundColor: '#172554', padding: 6, borderRadius: 6, marginBottom: 6 },
  activeChallengeSelectorLabel: { fontSize: 9, color: '#f97316', fontWeight: 'bold', marginBottom: 2 },
  nativeSelectButton: { backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' },
  nativeSelectButtonText: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },

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
  emptyNoticeText: { fontSize: 9, color: '#94a3b8', fontStyle: 'italic', marginVertical: 4 },

  createChallengeBtnHeader: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  createChallengeBtnText: { color: '#ffffff', fontSize: 9, fontWeight: 'bold' },

  cardBox: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  cardBoxTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  cardBoxSub: { fontSize: 10, color: '#64748b', marginVertical: 2 },
  leaveChallengeBtn: { backgroundColor: '#dc2626', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  btnMiniText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },

  hallOfFameBox: { backgroundColor: '#fef3c7', borderRadius: 6, padding: 8, marginTop: 6, borderWidth: 1, borderColor: '#f59e0b' },
  hallOfFameTitle: { fontSize: 10, fontWeight: 'bold', color: '#92400e', marginBottom: 2 },
  hallOfFameText: { fontSize: 9, color: '#78350f' },

  podiumContainer: { backgroundColor: '#fff7ed', borderRadius: 10, padding: 12, borderWidth: 2, borderColor: '#f97316', marginBottom: 14, alignItems: 'center' },
  podiumHeaderTitle: { fontSize: 12, fontWeight: '900', color: '#c2410c', marginBottom: 8 },
  podiumRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6, width: '100%' },
  podiumCard1st: { backgroundColor: '#fef3c7', padding: 8, borderRadius: 8, alignItems: 'center', borderWidth: 2, borderColor: '#d97706', width: '36%' },
  podiumCard2nd: { backgroundColor: '#f1f5f9', padding: 6, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#94a3b8', width: '30%' },
  podiumCard3rd: { backgroundColor: '#fff7ed', padding: 6, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#f97316', width: '30%' },
  podiumMedal: { fontSize: 8, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 2 },
  podiumName1st: { fontSize: 10, fontWeight: 'bold', color: '#92400e' },
  podiumPts1st: { fontSize: 10, fontWeight: '900', color: '#d97706' },
  podiumName: { fontSize: 8, fontWeight: 'bold', color: '#334155' },
  podiumPts: { fontSize: 8, fontWeight: 'bold', color: '#16a34a' },

  postCard: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 12, overflow: 'hidden' },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#f8fafc' },
  postAuthor: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  postTime: { fontSize: 9, color: '#64748b' },
  postImg: { width: '100%', height: 180 },
  postCaption: { fontSize: 11, color: '#334155', marginBottom: 4 },
  badgePts: { backgroundColor: '#fff7ed', color: '#c2410c', fontSize: 9, fontWeight: 'bold', padding: 4, borderRadius: 4, alignSelf: 'flex-start' },

  rankingRowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6 },
  rankingPosNumber: { fontSize: 14, fontWeight: '900', color: '#f97316', width: 30 },
  rankingMemberName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  rankingMemberSub: { fontSize: 9, color: '#64748b' },
  rankingMemberPts: { fontSize: 12, fontWeight: 'bold', color: '#16a34a' },

  seasonNoticeBox: { backgroundColor: '#fff7ed', borderRadius: 10, padding: 12, borderWidth: 2, borderColor: '#f97316', marginBottom: 12 },
  seasonNoticeTitle: { fontSize: 13, fontWeight: 'bold', color: '#c2410c' },
  seasonNoticeSub: { fontSize: 10, color: '#475569', marginVertical: 4 },
  startSeasonBtn: { backgroundColor: '#16a34a', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  startSeasonBtnText: { color: '#ffffff', fontSize: 9, fontWeight: 'bold' },

  profileHeaderCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10, position: 'relative' },
  logoutBtnProfile: { position: 'absolute', top: 10, right: 10, backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#fca5a5' },
  logoutBtnProfileText: { color: '#dc2626', fontSize: 9, fontWeight: 'bold' },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, marginBottom: 6, borderWidth: 2, borderColor: '#f97316' },
  profileName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  profileMeta: { fontSize: 10, color: '#64748b' },

  storiesBox: { width: '100%', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 8 },
  boxTitle: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' },
  addStoryBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center', marginRight: 8 },

  chartsGrid: { gap: 6, marginBottom: 10 },
  chartCard: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  chartTitle: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },
  chartSubText: { fontSize: 9, color: '#475569', marginTop: 2 },
  editBtnMini: { backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  editBtnMiniText: { fontSize: 8, color: '#1e3a8a', fontWeight: 'bold' },

  smallAddBtn: { backgroundColor: '#f97316', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  smallAddBtnText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },

  goalItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 4 },
  goalText: { fontSize: 10, color: '#0f172a', fontWeight: 'bold' },
  goalDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  deleteGoalBtn: { backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#fca5a5' },
  deleteGoalBtnText: { color: '#dc2626', fontSize: 10, fontWeight: 'bold' },

  graphContainer: { backgroundColor: '#eff6ff', borderRadius: 6, padding: 10, marginVertical: 8, height: 90 },
  graphBarRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 60 },
  graphBar: { width: 20, backgroundColor: '#f97316', borderRadius: 4 },

  adminControlCard: { backgroundColor: '#fff7ed', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#f97316', marginBottom: 12 },
  adminCardTitle: { fontSize: 12, fontWeight: 'bold', color: '#c2410c', marginBottom: 6 },
  participantRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#fed7aa', marginTop: 6 },
  avatarMini: { width: 34, height: 34, borderRadius: 17 },
  participantInfoBox: { flex: 1, marginLeft: 8, paddingRight: 4 },
  participantName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  participantSub: { fontSize: 9, color: '#64748b' },
  tagActiveText: { fontSize: 9, color: '#16a34a', fontWeight: 'bold' },
  approveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  banBtn: { backgroundColor: '#dc2626', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },

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

  actionBtn: { backgroundColor: '#1e3a8a', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginBottom: 12 },
  actionBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 14 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14 },
  modalTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a' },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#475569', marginVertical: 4 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 8, fontSize: 11, marginBottom: 8 },

  primaryBtn: { backgroundColor: '#f97316', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  cancelBtn: { marginTop: 6, paddingVertical: 4, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' }
});
