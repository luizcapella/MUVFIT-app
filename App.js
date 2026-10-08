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
  ActivityIndicator,
  Linking
} from 'react-native';

// Importações dos novos módulos otimizados
import { calculateAge, formatDateBR, calculateSeasonDates, formatBirthDateMask } from './src/utils/dateHelpers';
import { calculateWorkoutPoints } from './services/pointsEngine';
import { handleTriggerPhoto } from './src/components/ImageService';
import CustomPicker from './src/components/CustomPicker';
import DashboardScreen from './src/screens/DashboardScreen';
import WorkoutModal from './src/components/WorkoutModal';
import FeedScreen from './src/screens/FeedScreen';
import RankingScreen from './src/screens/RankingScreen';
import AdminScreen from './src/screens/AdminScreen';
import LigasScreen from './src/screens/LigasScreen';
import ConfigScreen from './src/screens/ConfigScreen';

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [isSignUp, setIsSignUp] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [genderInput, setGenderInput] = useState('Masculino');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editGender, setEditGender] = useState('Masculino');
  const [editAvatar, setEditAvatar] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [athletePerfScope, setAthletePerfScope] = useState('global');
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [weightHistoryList, setWeightHistoryList] = useState([]);
  const [targetWeightValue, setTargetWeightValue] = useState('75.0');
  const [isWeightChartModalOpen, setIsWeightChartModalOpen] = useState(false);
  const [newWeightValueInput, setNewWeightValueInput] = useState('');
  const [newWeightDateInput, setNewWeightDateInput] = useState('Set/2026');
  const [isDeleteModeActive, setIsDeleteModeActive] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [chartStartDateFilter, setChartStartDateFilter] = useState('Mar/2026');
  const [chartEndDateFilter, setChartEndDateFilter] = useState('Out/2026');
  const [isModalityRadarModalOpen, setIsModalityRadarModalOpen] = useState(false);
  const [selectedModalityPeriod, setSelectedModalityPeriod] = useState('Todos');
  const [isKmChartModalOpen, setIsKmChartModalOpen] = useState(false);
  const [selectedKmFilterActivity, setSelectedKmFilterActivity] = useState('Todos');
  const [selectedKmPeriod, setSelectedKmPeriod] = useState('Todos');
  const [globalSearchFilter, setGlobalSearchFilter] = useState('Todos'); // 'Todos', 'Usuários', 'Ligas'
  const [globalSearchActive, setGlobalSearchActive] = useState(false);
  const [globalUsersList, setGlobalUsersList] = useState([]);
  const [globalSearchResults, setGlobalSearchResults] = useState({ users: [], leagues: [] });

  // Pré-carrega os atletas do Supabase para viabilizar a busca por apelido
  useEffect(() => {
    async function loadUsersForSearch() {
      try {
        const { data } = await supabase.from('profiles').select('id, nickname, avatar_url');
        if (data) setGlobalUsersList(data);
      } catch (err) {
        console.log('Erro ao buscar atletas para pesquisa global:', err);
      }
    }
    loadUsersForSearch();
  }, []);

  // Executa os filtros de busca assim que o usuário digita na barra fixa
  const executeGlobalSearch = (text, currentFilter = globalSearchFilter) => {
    if (!text.trim()) {
      setGlobalSearchResults({ users: [], leagues: [] });
      setGlobalSearchActive(false);
      return;
    }

    setGlobalSearchActive(true);
    const term = text.toLowerCase();

    const matchedUsers = globalUsersList.filter(u => 
      u.nickname?.toLowerCase().includes(term)
    );

    // Busca compatível tanto com 'challenges' quanto com qualquer variável de ligas do app
    const leaguesSource = typeof challenges !== 'undefined' ? challenges : [];
    const matchedLeagues = leaguesSource.filter(l => 
      l.name?.toLowerCase().includes(term) || l.title?.toLowerCase().includes(term)
    );

    setGlobalSearchResults({
      users: currentFilter === 'Ligas' ? [] : matchedUsers,
      leagues: currentFilter === 'Usuários' ? [] : matchedLeagues
    });
  };

  // Força a atualização dos resultados se o usuário alternar as abas de filtro
  useEffect(() => {
    if (globalSearchQuery.trim()) {
      executeGlobalSearch(globalSearchQuery, globalSearchFilter);
    }
  }, [globalSearchFilter]);

  const [isTimeChartModalOpen, setIsTimeChartModalOpen] = useState(false);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('Todos');
  const [personalGoals, setPersonalGoals] = useState([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const [isAllEvidencesModalOpen, setIsAllEvidencesModalOpen] = useState(false);
  const [subAbaConfig, setSubAbaConfig] = useState('conta');
  const [accountPhone, setAccountPhone] = useState('');
  const [accountNewPassword, setAccountNewPassword] = useState('');
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [appLanguage, setAppLanguage] = useState('pt-BR');
  const [ratingStars, setRatingStars] = useState(5);
  const [feedbackSuggestion, setFeedbackSuggestion] = useState('');
  const [helpMessage, setHelpMessage] = useState('');

  const [currentUser, setCurrentUser] = useState({
    id: '', name: '', nickname: '', birth_date: '', age: 0, gender: 'Masculino',
    avatar: 'https://picsum.photos', isAdmin: true,
    goldMedals: 0, silverMedals: 0, bronzeMedals: 0
  });

  const [viewedUser, setViewedUser] = useState('');
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [challenges, setChallenges] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [pendingWorkouts, setPendingWorkouts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState('all');
  const [isAdminContext, setIsAdminContext] = useState(true);
  const [dashSectionAdmin, setDashSectionAdmin] = useState(true);
  const [dashSectionInvites, setDashSectionInvites] = useState(true);
  const [dashSectionParticipant, setDashSectionParticipant] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('💪 Musculação');

  const getTodayISO = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const handleRegisterWeight = async () => {
    if (!newWeightValueInput || !newWeightValueInput.trim()) {
      alert('Por favor, insira o valor do seu peso atual (kg) para realizar o registro.');
      return;
    }

    const weightNum = parseFloat(newWeightValueInput);
    if (isNaN(weightNum) || weightNum <= 0) {
      alert('Por favor, digite um número válido e maior que zero para o peso.');
      return;
    }

    const metaNum = weightMetaInput && weightMetaInput.trim() ? parseFloat(weightMetaInput) : null;
    const targetPeriod = selectedWeightPeriod || new Date().toISOString().substring(0, 7);
    const userId = currentUser?.id;

    if (!userId) {
      alert('Sessão do usuário não encontrada. Por favor, faça login novamente.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('athlete_weights')
        .insert([
          {
            user_id: userId,
            weight: weightNum,
            period: targetPeriod,
            meta: metaNum
          }
        ])
        .select();

      if (error) throw error;

      const novoRegistro = {
        id: data?.[0]?.id || Date.now(),
        weight: weightNum,
        period: targetPeriod,
        meta: metaNum
      };

      const historicoAtualizado = [...(weightHistoryList || []), novoRegistro].sort(
        (a, b) => new Date(a.period + '-01') - new Date(b.period + '-01')
      );

      setWeightHistoryList(historicoAtualizado);
      setNewWeightValueInput('');
      alert('Histórico de peso e evolução salvos com sucesso no Supabase!');

    } catch (err) {
      console.error('Falha na persistência de dados:', err);
      alert('Ocorreu um erro ao salvar no banco de dados. Tente novamente mais tarde.');
    }
  };

  const [workoutDate, setWorkoutDate] = useState(getTodayISO());
  const [startHour, setStartHour] = useState('07');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('08');
  const [endMinute, setEndMinute] = useState('00');
  const [kmInput, setKmInput] = useState('');
  const [workoutCaption, setWorkoutCaption] = useState('');
  const [selectedWeightPeriod, setSelectedWeightPeriod] = useState(new Date().toISOString().substring(0, 7));
  const [weightMetaInput, setWeightMetaInput] = useState('');
  const [photoStart, setPhotoStart] = useState(null);
  const [photoEvidence, setPhotoEvidence] = useState(null);
  const [photoEnd, setPhotoEnd] = useState(null);

  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeCode, setNewChallengeCode] = useState('');
  const [hasCapToggle, setHasCapToggle] = useState(false);
  const [newChallengeCap, setNewChallengeCap] = useState('22000');
  const [newChallengePeriod, setNewChallengePeriod] = useState('Monthly');

  const [expandedSec1, setExpandedSec1] = useState(true);
  const [expandedSec2, setExpandedSec2] = useState(false);
  const [expandedSec3, setExpandedSec3] = useState(false);
  const [expandedSec4, setExpandedSec4] = useState(false);

  const [manualSelectedAthleteId, setManualSelectedAthleteId] = useState('');
  const [manualActivity, setManualActivity] = useState('💪 Musculação');
  const [manualRankingPts, setManualRankingPts] = useState('');
  const [manualBankPts, setManualBankPts] = useState('');
  const [manualSteps, setManualSteps] = useState('');
  const [checkBonusInquebravel, setCheckBonusInquebravel] = useState(false);
  const [checkBonusDesperta, setCheckBonusDesperta] = useState(false);

  const [isAdvancedRulesModalOpen, setIsAdvancedRulesModalOpen] = useState(false);
  const [selectedConfigChallengeId, setSelectedConfigChallengeId] = useState(null);
  const [selectedConfigActivity, setSelectedConfigActivity] = useState('🏛️ Base da Liga');

  const [leaguePeriod, setLeaguePeriod] = useState('Monthly');

  const [dailyStepsConfig, setDailyStepsConfig] = useState({
    enabled: true, enableRankingScore: true, manualStepsInput: '10000', multiplier: '0.5'
  });

  const [bonusConfig, setBonusConfig] = useState({
    inquebravelEnabled: true, inquebravelDays: '3', inquebravelPts: '5000',
    despertaEnabled: true, despertaLimitTime: '08:00', despertaPts: '3000'
  });

  const [modalitySettings, setModalitySettings] = useState({
    '💪 Musculação': { enabled: true, scoringMode: 'simple', simplePts: '10000', simplePerMin: '60' },
    '🏋️ Crossfit / Treino Funcional': { enabled: true, scoringMode: 'simple', simplePts: '10000', simplePerMin: '60' },
    '🫀 Treino Aeróbico': { enabled: true, scoringMode: 'simple', simplePts: '10000', simplePerMin: '60' },
    '🏃 Corrida': { enabled: true, scoringMode: 'kmSimple', kmSimplePts: '1000', kmPerX: '1' }
  });

  const [tiebreakers, setTiebreakers] = useState([
    { id: 'dailySteps', label: 'Passos Diários', enabled: true, order: 1 },
    { id: 'bankPoints', label: 'Banco de Pontos', enabled: true, order: 2 }
  ]);
  useEffect(() => {
    let isMounted = true;
    async function initApp() {
      try {
        if (!supabase || !supabase.auth) {
          if (isMounted) setLoadingAuth(false);
          return;
        }
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (isMounted) {
          setSession(currentSession);
          if (currentSession) {
            await fetchUserProfile(currentSession.user.id, currentSession.user.email);
            await fetchDataFromSupabase();
          }
          setLoadingAuth(false);
        }

        supabase.auth.onAuthStateChange(async (_event, newSession) => {
          if (isMounted) {
            setSession(newSession);
            if (newSession) {
              await fetchUserProfile(newSession.user.id, newSession.user.email);
              await fetchDataFromSupabase();
            } else {
              setCurrentUser({ id: '', name: '', nickname: '' });
            }
          }
        });
      } catch (e) {
        console.log('Erro na inicialização:', e);
        if (isMounted) setLoadingAuth(false);
      }
    }
    initApp();
    return () => { isMounted = false; };
  }, []);

  async function fetchUserProfile(userId, userEmail) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      const fallbackStringName = userEmail && typeof userEmail === 'string' ? userEmail.split('@')[0] : 'Atleta';

      if (data) {
        let formattedDate = '';
        if (data.birth_date) {
          const parts = data.birth_date.split('-');
          if (parts.length === 3) formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        const computedAge = formattedDate ? calculateAge(formattedDate) : 0;
        const loadedUser = {
          id: String(data.id),
          name: String(data.full_name || fallbackStringName),
          nickname: String(data.nickname || data.full_name || fallbackStringName),
          birth_date: formattedDate,
          age: computedAge,
          gender: String(data.gender || 'Masculino'),
          avatar: String(data.avatar_url || `https://picsum.photos{data.id}/200/200`),
          isAdmin: true,
          goldMedals: 0, silverMedals: 0, bronzeMedals: 0
        };
        setCurrentUser(loadedUser);
      } else {
        const fallbackUser = {
          id: String(userId),
          name: String(fallbackStringName),
          nickname: String(fallbackStringName),
          birth_date: '',
          age: 0,
          gender: 'Masculino',
          avatar: `https://picsum.photos{userId}/200/200`,
          isAdmin: true,
          goldMedals: 0, silverMedals: 0, bronzeMedals: 0
        };
        setCurrentUser(fallbackUser);
      }
    } catch (err) {
      console.log('Erro ao buscar perfil:', err);
    }
  }

  async function fetchDataFromSupabase() {
    try {
           // Busca em tempo real da tabela nova challenges_v2
       const { data: challengesData, error: challengesError } = await supabase
      .from('challenges_v2')
      .select('*')
      .order('created_at', { ascending: true });

    if (!challengesError && challengesData) {
      // Força a conversão do ID para texto comum para manter compatibilidade absoluta com o app
      const mappedChallenges = challengesData.map(liga => ({
        ...liga,
        id: String(liga.id),
        created_by: liga.creator_id || liga.created_by,
        creator_id: liga.creator_id || liga.created_by
      }));
            // 🔄 CARREGAMENTO AUTOMÁTICO DO HISTÓRICO DE PESOS DO ATLETA (REAL-TIME)
         if (currentUser?.id) {
        const { data: weightData, error: weightError } = await supabase
          .from('athlete_weights')
          .select('*')
          .eq('user_id', currentUser.id);

        if (!weightError && weightData) {
          // Ordena cronologicamente os períodos para a linha do gráfico traçar corretamente
          const historicoOrdenado = weightData.sort(
            (a, b) => new Date(a.period + '-01') - new Date(b.period + '-01')
          );
          setWeightHistoryList(historicoOrdenado);

          // Puxa automaticamente a última meta cadastrada pelo usuário para preencher o campo
          const registroComMeta = [...weightData].reverse().find(w => w.meta !== null);
          if (registroComMeta) {
            setWeightMetaInput(String(registroComMeta.meta));
          }
        }
      }

      setChallenges(mappedChallenges);

      if (mappedChallenges.length > 0 && !activeChallengeId) {
        setActiveChallengeId(mappedChallenges[0].id);
      }
    } else {
      setChallenges([]);
    }

    // DOWNLOAD EM TEMPO REAL: Busca as solicitações de membros de liras
    const { data: reqMembersData } = await supabase
      .from('league_memberships')
      .select('*');
    
    // DOWNLOAD EM TEMPO REAL: Busca as solicitações de atletas para os desafios
    const { data: reqChallengesData } = await supabase
      .from('challenge_applications')
      .select('*');


      const { data: membersData } = await supabase.from('memberships').select('*');
      if (membersData) setMemberships(membersData);
      const { data: feedData } = await supabase.from('feed_posts').select('*');
      if (feedData) setFeedPosts(feedData);
    } catch (err) {
      console.log('Erro ao carregar do Supabase:', err);
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      setSession(null);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível fechar a sessão.');
    }
  }

  const [workoutSubmitting, setWorkoutSubmitting] = useState(false);

  async function handleSaveWorkout() {
    if (!photoEvidence) {
      Alert.alert('Erro', 'É obrigatório tirar uma foto como evidência do seu exercício!');
      return;
    }
    setWorkoutSubmitting(true);
    try {
      const calculatedPoints = calculateWorkoutPoints(selectedActivity, kmInput);
      const { error } = await supabase.from('pending_workouts').insert([
        {
          user_id: currentUser.id,
          challenge_id: activeChallengeId,
          activity: selectedActivity,
          workout_date: workoutDate,
          caption: workoutCaption,
          km_distance: kmInput ? parseFloat(kmInput) : 0,
          evidence_url: photoEvidence,
          points_computed: calculatedPoints,
          status: 'pending'
        }
      ]);

      if (error) {
        Alert.alert('Erro ao Salvar', error.message);
        return;
      }

      Alert.alert('Sucesso!', `Treino enviado com sucesso! Aguardando validação.`);
      setWorkoutCaption('');
      setKmInput('');
      setPhotoEvidence(null);
      setIsWorkoutModalOpen(false);
      await fetchDataFromSupabase();
    } catch (err) {
      Alert.alert('Erro Inesperado', 'Não foi possível salvar o seu exercício.');
    } finally {
      setWorkoutSubmitting(false);
    }
  }

  async function handleLikePost(postId) {
    try {
      const post = feedPosts.find(p => p.id === postId);
      if (!post) return;
      const newLikesCount = (post.likes_count || 0) + 1;
      const { error } = await supabase.from('feed_posts').update({ likes_count: newLikesCount }).eq('id', postId);
      if (!error) {
        setFeedPosts(feedPosts.map(p => p.id === postId ? { ...p, likes_count: newLikesCount } : p));
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function handleAddComment(postId, commentText) {
    try {
      const post = feedPosts.find(p => p.id === postId);
      if (!post) return;
      const newCommentObj = {
        user_name: String(currentUser.nickname || currentUser.name || 'Atleta'),
        text: commentText.trim(),
        created_at: new Date().toISOString()
      };
      const updatedComments = [...(post.comments || []), newCommentObj];
      const { error } = await supabase.from('feed_posts').update({ comments: updatedComments }).eq('id', postId);
      if (!error) {
        setFeedPosts(feedPosts.map(p => p.id === postId ? { ...p, comments: updatedComments } : p));
      }
    } catch (err) {
      console.log(err);
    }
  }
  async function handleAuthAction() {
    if (!emailInput.trim() || !passwordInput.trim()) {
      Alert.alert('Atenção', 'Preencha E-mail e Senha para continuar.');
      return;
    }
    setAuthSubmitting(true);
    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailInput.trim(),
          password: passwordInput.trim(),
        });
        if (authError) {
          Alert.alert('Erro no Cadastro', authError.message);
          return;
        }
        Alert.alert('Sucesso!', 'Conta criada. Faça o login para acessar.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailInput.trim(),
          password: passwordInput.trim(),
        });
        if (error) {
          Alert.alert('Erro no Login', 'E-mail ou senha incorretos.');
        } else if (data.session) {
          setSession(data.session);
          await fetchUserProfile(data.session.user.id, data.session.user.email);
          await fetchDataFromSupabase();
        }
      }
    } catch (err) {
      Alert.alert('Erro Inesperado', 'Ocorreu um erro de conexão.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  if (loadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>A carregar MuvFit...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <ScrollView contentContainerStyle={styles.authScroll}>
          <Text style={styles.brandTitleCenter}>MUVFIT</Text>
          <Text style={styles.brandSubtitleCenter}>Mizan Soluções Técnicas</Text>

          <View style={styles.authCard}>
            <Text style={styles.authCardTitle}>
              {isSignUp ? 'Criar Nova Conta' : 'Aceder à Plataforma'}
            </Text>

            {isSignUp && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nome Completo"
                  value={fullNameInput}
                  onChangeText={setFullNameInput}
                />
                <View style={styles.genderRow}>
                  <TouchableOpacity
                    style={[styles.genderChip, genderInput === 'Masculino' && styles.genderChipActive]}
                    onPress={() => setGenderInput('Masculino')}
                  >
                    <Text style={[styles.genderText, genderInput === 'Masculino' && styles.genderTextActive]}>Masculino</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.genderChip, genderInput === 'Feminino' && styles.genderChipActive]}
                    onPress={() => setGenderInput('Feminino')}
                  >
                    <Text style={[styles.genderText, genderInput === 'Feminino' && styles.genderTextActive]}>Feminino</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="E-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              value={emailInput}
              onChangeText={setEmailInput}
            />
            <TextInput
              style={styles.input}
              placeholder="Palavra-passe"
              secureTextEntry
              value={passwordInput}
              onChangeText={setPasswordInput}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAuthAction} disabled={authSubmitting}>
              {authSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>{isSignUp ? 'CADASTRAR CONTA' : 'ENTRAR NO MUVFIT'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggleAuthBtn} onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.toggleAuthText}>
                {isSignUp ? 'Já tem conta? Faça Login' : 'Não tem conta? Registe-se gratuitamente'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brandTitle}>MUVFIT</Text>
            <Text style={styles.brandSubtitle}>Mizan Soluções Técnicas</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
            <Text style={styles.logoutBtnText}>🚪 SAIR</Text>
          </TouchableOpacity>
        </View>

             {Array.isArray(challenges) && challenges.length > 0 ? (
        <>
          <CustomPicker
            label="🎯 Selecione o Desafio:"
            selectedValue={activeChallengeId}
            onValueChange={(val) => {
              setActiveChallengeId(val);
              setGlobalSearchQuery('');
              setGlobalSearchActive(false);
            }}
            options={challenges.map(c => ({
              label: String(c?.title || c?.name || 'Desafio'),
              value: String(c?.id || '')
            }))}
          />

          {/* 🔍 BARRA FIXA COM JANELA FLUTUANTE DE RESULTADOS SOBREPOSTA (DENTRO DO AZUL) */}
          <TextInput
            style={{
              width: '100%',
              height: 38,
              backgroundColor: '#FFFFFF',
              borderRadius: 8,
              paddingHorizontal: 12,
              marginTop: 12,
              fontSize: 13,
              color: '#1E293B',
              borderWidth: 1,
              borderColor: '#CBD5E1',
            }}
            placeholder="🔍 Pesquisar Atletas ou Ligas..."
            placeholderTextColor="#94a3b8"
            value={globalSearchQuery}
            onChangeText={(text) => {
              setGlobalSearchQuery(text);
              if (typeof executeGlobalSearch === 'function') {
                executeGlobalSearch(text, globalSearchFilter);
              }
            }}
          />

        </>
      ) : (
        <View style={{ padding: 10, backgroundColor: '#1e40af', borderRadius: 6, marginTop: 8 }}>
          <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>⏳ Carregando desafios disponíveis...</Text>
        </View>
      )}
                        {globalSearchActive && (
            <View style={{
              position: 'fixed',
              top: 145, // Fixa a altura milimétrica abaixo da barra branca
              left: 16,
              right: 16,
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              zIndex: 999999, // Força o empilhamento máximo sobre qualquer tela branca
              elevation: 99, // Projeta sombra master no Android
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 6.68,
            }}>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1E3A8A' }}>Resultados Encontrados</Text>
                <TouchableOpacity 
                  style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                  onPress={() => {
                    setGlobalSearchQuery('');
                    setGlobalSearchActive(false);
                  }}
                >
                  <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: 'bold' }}>Fechar X</Text>
                </TouchableOpacity>
              </View>

              {/* Abas de Filtros de Tags */}
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                {['Todos', 'Usuários', 'Ligas'].map((filterName) => (
                  <TouchableOpacity
                    key={filterName}
                    style={{
                      flex: 1,
                      paddingVertical: 6,
                      borderRadius: 6,
                      backgroundColor: globalSearchFilter === filterName ? '#1E3A8A' : '#F1F5F9',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#E2E8F0'
                    }}
                    onPress={() => setGlobalSearchFilter(filterName)}
                  >
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: globalSearchFilter === filterName ? '#FFFFFF' : '#64748B' }}>
                      {filterName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Resultados Roláveis */}
              <ScrollView style={{ maxHeight: 200, width: '100%' }} nestedScrollEnabled={true}>
                {(globalSearchResults?.leagues || []).map((liga) => (
                  <TouchableOpacity 
                    key={liga.id} 
                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                    onPress={() => {
                      setActiveChallengeId(liga.id);
                      setCurrentScreen('ranking');
                      setGlobalSearchQuery('');
                      setGlobalSearchActive(false);
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#334155' }}>🏆 {liga.name || liga.title}</Text>
                    <Text style={{ fontSize: 11, color: '#F97316', fontWeight: 'bold' }}>Ver Ranking →</Text>
                  </TouchableOpacity>
                ))}

                {(globalSearchResults?.users || []).map((user) => (
                  <TouchableOpacity 
                    key={user.id} 
                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                    onPress={() => {
                      setSelectedProfileId(user.id);
                      setCurrentScreen('atleta');
                      setGlobalSearchQuery('');
                      setGlobalSearchActive(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Image source={{ uri: user.avatar_url || 'https://placeholder.com' }} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#CBD5E1' }} />
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#334155' }}> {user.nickname || 'Atleta'}</Text>
                    </View>
                    <Text style={{ fontSize: 11, color: '#1E3A8A', fontWeight: 'bold' }}>Ver Perfil →</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

           {currentScreen === 'dashboard' && (
        <DashboardScreen
          currentUser={currentUser}
          athletePerfScope={athletePerfScope}
          setAthletePerfScope={setAthletePerfScope}
          tiebreakers={tiebreakers}
          setIsWeightChartModalOpen={setIsWeightChartModalOpen}
          setIsKmChartModalOpen={setIsKmChartModalOpen}
          setIsTimeChartModalOpen={setIsTimeChartModalOpen}
          setIsModalityRadarModalOpen={setIsModalityRadarModalOpen}
          personalGoals={personalGoals}
          setIsGoalModalOpen={setIsGoalModalOpen}
          challenges={challenges}
          selectedLeagueFilter={selectedLeagueFilter}
          setSelectedLeagueFilter={setSelectedLeagueFilter}
        />
      )}

      {currentScreen === 'feed' && (
        <FeedScreen
          feedPosts={feedPosts}
          currentUser={currentUser}
          commentInputs={commentInputs}
          setCommentInputs={setCommentInputs}
          handleLikePost={handleLikePost}
          handleAddComment={handleAddComment}
        />
      )}
           {currentScreen === 'ranking' && (
          <RankingScreen
            memberships={memberships}
            currentUser={currentUser}
            onNavigateToProfile={(targetUserId) => {
              setSelectedProfileId(targetUserId);
              setCurrentScreen("atleta");
            }}
          />
      )}
          {currentScreen === 'atleta' && (
            <DashboardScreen
              currentUser={currentUser}
              athletePerfScope={athletePerfScope}
              setAthletePerfScope={setAthletePerfScope}
              setIsWeightChartModalOpen={setIsWeightChartModalOpen}
              setNewWeightValueInput={setNewWeightValueInput}
              setIsModalityRadarModalOpen={setIsModalityRadarModalOpen}
              setSelectedModalityPeriod={setSelectedModalityPeriod}
              setIsKmChartModalOpen={setIsKmChartModalOpen}
              setSelectedKmFilterActivity={setSelectedKmFilterActivity}
              setSelectedKmPeriod={setSelectedKmPeriod}
              setIsTimeChartModalOpen={setIsTimeChartModalOpen}
              setSelectedTimePeriod={setSelectedTimePeriod}
              fetchDataFromSupabase={fetchDataFromSupabase}
              selectedProfileId={selectedProfileId}
            />
          )}

      {currentScreen === 'ligas' && (
        <LigasScreen
          challenges={challenges}
          memberships={memberships}
          currentUser={currentUser}
          setChallenges={setChallenges}
          handleSignOut={handleSignOut}
          fetchDataFromSupabase={fetchDataFromSupabase}
          setSelectedLeagueFilter={setSelectedLeagueFilter}
        />
      )}

                 {currentScreen === 'admin' && currentUser?.isAdmin && (
               <AdminScreen
          challenges={challenges}
          currentUser={currentUser}
          handleSignOut={handleSignOut}
          fetchDataFromSupabase={fetchDataFromSupabase}
          pendingWorkouts={pendingWorkouts}
          setPendingWorkouts={setPendingWorkouts}
        />
      )}

      {currentScreen === 'config' && (
        <ConfigScreen
          currentUser={currentUser}
          fetchDataFromSupabase={fetchDataFromSupabase}
        />
      )}

      {/* BOTÃO FLUTUANTE DE REGISTRO DE TREINO */}
      <TouchableOpacity 
        style={{
          position: 'absolute', bottom: 85, right: 20, backgroundColor: '#f97316',
          paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, elevation: 5, shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, zIndex: 10
        }}
        onPress={() => setIsWorkoutModalOpen(true)}
      >
        <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>🏋️ MUVFIT TREINO</Text>
      </TouchableOpacity>

        {/* BARRA DE NAVEGAÇÃO DE ABAS NO RODAPÉ ATUALIZADA (6 BOTÕES) */}
      <View style={{
        flexDirection: 'row', height: 65, backgroundColor: '#1e3a8a', 
        borderTopWidth: 1, borderTopColor: '#3b82f6', alignItems: 'center', justifyContent: 'space-around'
      }}>
        <TouchableOpacity style={{ alignItems: 'center', flex: 1, paddingVertical: 10 }} onPress={() => setCurrentScreen('dashboard')}>
          <Text style={{ fontSize: 16, marginBottom: 2 }}>👤</Text>
          <Text style={{ color: currentScreen === 'dashboard' ? '#f97316' : '#ffffff', fontSize: 10, fontWeight: 'bold' }}>Atleta</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ alignItems: 'center', flex: 1, paddingVertical: 10 }} onPress={() => setCurrentScreen('ligas')}>
          <Text style={{ fontSize: 16, marginBottom: 2 }}>🏆</Text>
          <Text style={{ color: currentScreen === 'ligas' ? '#f97316' : '#ffffff', fontSize: 10, fontWeight: 'bold' }}>Ligas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ alignItems: 'center', flex: 1, paddingVertical: 10 }} onPress={() => setCurrentScreen('feed')}>
          <Text style={{ fontSize: 16, marginBottom: 2 }}>🔥</Text>
          <Text style={{ color: currentScreen === 'feed' ? '#f97316' : '#ffffff', fontSize: 10, fontWeight: 'bold' }}>Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ alignItems: 'center', flex: 1, paddingVertical: 10 }} onPress={() => setCurrentScreen('ranking')}>
          <Text style={{ fontSize: 16, marginBottom: 2 }}>🏅</Text>
          <Text style={{ color: currentScreen === 'ranking' ? '#f97316' : '#ffffff', fontSize: 10, fontWeight: 'bold' }}>Classificação</Text>
        </TouchableOpacity>

        {currentUser?.isAdmin && (
          <TouchableOpacity style={{ alignItems: 'center', flex: 1, paddingVertical: 10 }} onPress={() => setCurrentScreen('admin')}>
            <Text style={{ fontSize: 16, marginBottom: 2 }}>🛡️</Text>
            <Text style={{ color: currentScreen === 'admin' ? '#f97316' : '#ffffff', fontSize: 10, fontWeight: 'bold' }}>Admin</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={{ alignItems: 'center', flex: 1, paddingVertical: 10 }} onPress={() => setCurrentScreen('config')}>
          <Text style={{ fontSize: 16, marginBottom: 2 }}>⚙️</Text>
          <Text style={{ color: currentScreen === 'config' ? '#f97316' : '#ffffff', fontSize: 10, fontWeight: 'bold' }}>Config</Text>
        </TouchableOpacity>
      </View>



      <WorkoutModal
        isOpen={isWorkoutModalOpen}
        onClose={() => setIsWorkoutModalOpen(false)}
        selectedActivity={selectedActivity}
        setSelectedActivity={setSelectedActivity}
        workoutDate={workoutDate}
        setWorkoutDate={setWorkoutDate}
        workoutCaption={workoutCaption}
        setWorkoutCaption={setWorkoutCaption}
        kmInput={kmInput}
        setKmInput={setKmInput}
        handleTriggerPhoto={handleTriggerPhoto}
        photoEvidence={photoEvidence}
        setPhotoEvidence={setPhotoEvidence}
        onSubmit={handleSaveWorkout}
        submitting={workoutSubmitting}
      />
                  {/* ⚖️ MODAL ROBUSTO: EVOLUÇÃO DE PESO ATLETA */}
          {isWeightChartModalOpen && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 999999,
            }}>
              <View style={{
                width: '90%',
                maxWidth: 600,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                overflow: 'hidden',
                elevation: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
              }}>
                {/* Cabeçalho / Título */}
                <View style={{
                  backgroundColor: '#1E3A8A',
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>⚖️ Evolução de Peso</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}
                    onPress={() => setIsWeightChartModalOpen(false)}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' }}>Fechar X</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ padding: 20, maxHeight: 550 }}>
                  {/* TRAVA DE PRIVACIDADE: Só exibe inputs se for o Dono do Perfil (selectedProfileId nulo ou igual ao atual) */}
                  {(!selectedProfileId || selectedProfileId === currentUser?.id) ? (
                    <View style={{ marginBottom: 20 }}>
                      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                        {/* Bloco Peso Atual */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 4 }}>Peso Atual (kg)</Text>
                          <TextInput
                            style={{ height: 42, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC' }}
                            placeholder="0.0"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={newWeightValueInput || ''}
                            onChangeText={(val) => setNewWeightValueInput(val.replace(',', '.'))}
                          />
                        </View>

                        {/* Bloco Período Mês/Ano */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 4 }}>Período (Mês/Ano)</Text>
                          {/* Input tipo 'month' nativo web - abre o seletor limpo do navegador sem quebrar */}
                          <input
                            type="month"
                            style={{ height: '42px', width: '100%', borderWidth: '1px', borderStyle: 'solid', borderColor: '#CBD5E1', borderRadius: '8px', paddingLeft: '12px', paddingRight: '12px', fontSize: '14px', color: '#1E293B', backgroundColor: '#F8FAFC', boxSizing: 'border-box' }}
                            value={selectedWeightPeriod || new Date().toISOString().substring(0, 7)}
                            onChange={(e) => setSelectedWeightPeriod(e.target.value)}
                          />
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end', marginBottom: 8 }}>
                        {/* Bloco Meta */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 4 }}>Meta de Peso (kg)</Text>
                          <TextInput
                            style={{ height: 42, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, fontSize: 14, color: '#1E293B', backgroundColor: '#F8FAFC' }}
                            placeholder="Definir meta"
                            placeholderTextColor="#94a3b8"
                            keyboardType="numeric"
                            value={weightMetaInput || ''}
                            onChangeText={(val) => setWeightMetaInput(val.replace(',', '.'))}
                          />
                        </View>

                        {/* Botão Registrar */}
                        <TouchableOpacity
                          style={{ backgroundColor: '#10B981', height: 42, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}
                          onPress={() => {
                            if (typeof handleRegisterWeight === 'function') {
                              handleRegisterWeight();
                            }
                          }}
                        >
                          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 }}>💾 Registrar Peso</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    /* Exibição modo leitura para Visitantes */
                    <View style={{ padding: 12, backgroundColor: '#F1F5F9', borderRadius: 8, marginBottom: 20 }}>
                      <Text style={{ fontSize: 12, color: '#64748B', fontWeight: 'bold' }}>👤 Modo de Visualização (Perfil de Visitante)</Text>
                    </View>
                  )}

                  {/* 📊 GRÁFICO DE LINHAS ROLÁVEL (SVG INTEGRADO) */}
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1E3A8A', marginBottom: 8 }}>Linha de Evolução Histórica</Text>
                            <View style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF', padding: 10 }}>
            {(!weightHistoryList || weightHistoryList.length === 0) ? (
              /* 📭 CENÁRIO VAZIO: O gráfico nasce 100% limpo, sem dados automáticos */
              <View style={{ height: 200, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 8 }}>
                <Text style={{ fontSize: 24, marginBottom: 6 }}>⚖️</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#64748B' }}>Nenhum peso registrado ainda</Text>
                <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Use os campos acima para iniciar seu histórico</Text>
              </View>
            ) : (
              /* 📊 CENÁRIO DINÂMICO: Só renderiza os nós caso o usuário cadastre informações reais */
              <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={{ width: '100%' }}>
                <View style={{ width: Math.max(500, weightHistoryList.length * 90), height: 200, paddingRight: 20, justifyContent: 'center', position: 'relative' }}>
                  
                  {/* Linhas de Grade de Fundo */}
                  <View style={{ position: 'absolute', left: 30, right: 0, top: 20, bottom: 30, justifyContent: 'space-between' }}>
                    {[1, 2, 3, 4].map((i) => <View key={i} style={{ height: 1, backgroundColor: '#F1F5F9', width: '100%' }} />)}
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, paddingHorizontal: 10, position: 'relative' }}>
                    {weightHistoryList.slice(-5).map((item, index) => {
                      const minW = Math.min(...weightHistoryList.map(w => w.weight)) - 5;
                      const maxW = Math.max(...weightHistoryList.map(w => w.weight)) + 5;
                      const range = maxW - minW || 1;
                      const pct = ((item.weight - minW) / range) * 80;

                      return (
                        <View key={item.id || index} style={{ alignItems: 'center', width: 60 }}>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#334155', marginBottom: 2 }}>
                            {parseFloat(item.weight).toFixed(1)}
                          </Text>
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1E3A8A', borderWidth: 2, borderColor: '#FFFFFF', marginBottom: pct }} />
                          <Text style={{ color: '#64748B', fontSize: 10, position: 'absolute', bottom: -28 }}>
                            {item.period ? item.period.split('-').reverse().join('/') : ''}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </ScrollView>
            )}
          </View>

          {/* 🎯 RODAPÉ COM CÁLCULOS TOTALMENTE AUTOMÁTICOS EM TEMPO REAL */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
            <Text style={{ fontSize: 13, color: '#334155', fontWeight: 'bold' }}>
              🎯 Meta: <Text style={{ color: '#1E3A8A' }}>{weightMetaInput ? `${weightMetaInput} kg` : 'Não definida'}</Text>
            </Text>
            <Text style={{ fontSize: 13, color: '#334155', fontWeight: 'bold' }}>
              📈 Progresso Total: {' '}
              <Text style={{ 
                color: (!weightHistoryList || weightHistoryList.length < 2) ? '#64748B' : 
                       (weightHistoryList[weightHistoryList.length - 1].weight <= weightHistoryList[0].weight ? '#10B981' : '#EF4444')
              }}>
                {(() => {
                  if (!weightHistoryList || weightHistoryList.length < 2) return '0.0 kg';
                  const diff = weightHistoryList[weightHistoryList.length - 1].weight - weightHistoryList[0].weight;
                  return `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg`;
                })()}
              </Text>
            </Text>
          </View>
                </ScrollView>
              </View>
            </View>
          )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff', overflow: 'visible', zIndex: 9999 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e3a8a' },
  loadingText: { color: '#ffffff', marginTop: 12, fontWeight: 'bold' },
  authContainer: { flex: 1, backgroundColor: '#1e3a8a' },
  authScroll: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  brandTitleCenter: { fontSize: 36, fontWeight: '900', color: '#f97316', textAlign: 'center' },
  brandSubtitleCenter: { fontSize: 12, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 24 },
  authCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, elevation: 5 },
  authCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center', marginBottom: 16 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 10, fontSize: 14, marginBottom: 12, color: '#0f172a' },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  genderChip: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center', backgroundColor: '#f1f5f9' },
  genderChipActive: { backgroundColor: '#f97316' },
  genderText: { color: '#475569', fontWeight: 'bold', fontSize: 13 },
  genderTextActive: { color: '#ffffff' },
  primaryBtn: { backgroundColor: '#f97316', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  toggleAuthBtn: { marginTop: 14, alignItems: 'center' },
  toggleAuthText: { fontSize: 12, fontWeight: 'bold', color: '#1e3a8a' },
  topHeader: { padding: 16, backgroundColor: '#1e3a8a', overflow: 'visible', zIndex: 9999 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  brandTitle: { fontSize: 22, fontWeight: '900', color: '#f97316' },
  brandSubtitle: { fontSize: 11, fontWeight: 'bold', color: '#ffffff' },
  logoutBtn: { backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  logoutBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' }
});
