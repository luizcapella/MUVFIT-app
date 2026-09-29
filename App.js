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

  const [weightHistoryList, setWeightHistoryList] = useState([]);
  const [targetWeightValue, setTargetWeightValue] = useState('75.0');
  const [isWeightChartModalOpen, setIsWeightChartModalOpen] = useState(false);
  const [newWeightValueInput, setNewWeightValueInput] = useState('');
  const [newWeightDateInput, setNewWeightDateInput] = useState('Set/2026');
  const [isDeleteModeActive, setIsDeleteModeActive] = useState(false);

  const [chartStartDateFilter, setChartStartDateFilter] = useState('Mar/2026');
  const [chartEndDateFilter, setChartEndDateFilter] = useState('Out/2026');

  const [isModalityRadarModalOpen, setIsModalityRadarModalOpen] = useState(false);
  const [selectedModalityPeriod, setSelectedModalityPeriod] = useState('Todos');

  const [isKmChartModalOpen, setIsKmChartModalOpen] = useState(false);
  const [selectedKmFilterActivity, setSelectedKmFilterActivity] = useState('Todos');
  const [selectedKmPeriod, setSelectedKmPeriod] = useState('Todos');

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

  const [workoutDate, setWorkoutDate] = useState(getTodayISO());
  const [startHour, setStartHour] = useState('07');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('08');
  const [endMinute, setEndMinute] = useState('00');

  const [kmInput, setKmInput] = useState('');
  const [workoutCaption, setWorkoutCaption] = useState('');

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
      .select('*');

    if (!challengesError && challengesData) {
      // Força a conversão do ID para texto comum para manter compatibilidade absoluta com o app
      const mappedChallenges = challengesData.map(liga => ({
        ...liga,
        id: String(liga.id),
        created_by: liga.creator_id || liga.created_by,
        creator_id: liga.creator_id || liga.created_by
      }));

      setChallenges(mappedChallenges);

      // CORREÇÃO: Define a primeira liga ativa lendo o índice zero corretamente sem erros de sintaxe
      if (mappedChallenges.length > 0 && !activeChallengeId) {
        setActiveChallengeId(mappedChallenges[0].id);
      }
    } else {
      setChallenges([]);
    }

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
          <CustomPicker
            label="🎯 Selecione o Desafio:"
            selectedValue={activeChallengeId}
            onValueChange={(val) => setActiveChallengeId(val)}
            options={challenges.map(c => ({ label: String(c?.title || 'Desafio'), value: String(c?.id || '') }))}
          />
        ) : (
          <View style={{ padding: 10, backgroundColor: '#1e40af', borderRadius: 6, marginTop: 8 }}>
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: 'bold' }}>⏳ Carregando desafios disponíveis...</Text>
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
          pendingWorkouts={pendingWorkouts}
          setPendingWorkouts={setPendingWorkouts}
          fetchDataFromSupabase={fetchDataFromSupabase}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
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
  topHeader: { padding: 16, backgroundColor: '#1e3a8a' },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  brandTitle: { fontSize: 22, fontWeight: '900', color: '#f97316' },
  brandSubtitle: { fontSize: 11, fontWeight: 'bold', color: '#ffffff' },
  logoutBtn: { backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  logoutBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' }
});
