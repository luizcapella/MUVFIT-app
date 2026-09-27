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

  const [viewedUser, setViewedUser] = useState(currentUser);
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  const [challenges, setChallenges] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [pendingWorkouts, setPendingWorkouts] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [isAdminContext, setIsAdminContext] = useState(true);

  const [dashSectionAdmin, setDashSectionAdmin] = useState(true);
  const [dashSectionInvites, setDashSectionInvites] = useState(true);
  const [dashSectionParticipant, setDashSectionParticipant] = useState(true);

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || {};
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
  // INICIALIZAÇÃO DE SESSÃO E MONITORAMENTO DO USUÁRIO
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

        // Monitora mudanças de estado (Login, Logout, Cadastro)
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
        console.log('Erro na inicialização do aplicativo:', e);
        if (isMounted) setLoadingAuth(false);
      }
    }

    initApp();
    return () => {
      isMounted = false;
    };
  }, []);

  // CARREGA INFORMAÇÕES PÚBLICAS DO ATLETA (PROFILES)
  async function fetchUserProfile(userId, userEmail) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        let formattedDate = '';
        if (data.birth_date) {
          const parts = data.birth_date.split('-');
          if (parts.length === 3) formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }

        const computedAge = formattedDate ? calculateAge(formattedDate) : 0;

        const loadedUser = {
          id: data.id,
          name: data.full_name || userEmail.split('@')[0],
          nickname: data.nickname || data.full_name || userEmail.split('@')[0],
          birth_date: formattedDate,
          age: computedAge,
          gender: data.gender || 'Masculino',
          avatar: data.avatar_url || `https://picsum.photos{data.id}/200/200`,
          isAdmin: true
        };

        setCurrentUser(loadedUser);
        setViewedUser(loadedUser);
      } else {
        const fallbackName = userEmail ? userEmail.split('@')[0] : 'Atleta';
        const fallbackUser = {
          id: userId,
          name: fallbackName,
          nickname: fallbackName,
          birth_date: '',
          age: 0,
          gender: 'Masculino',
          avatar: `https://picsum.photos{userId}/200/200`,
          isAdmin: true
        };
        setCurrentUser(fallbackUser);
        setViewedUser(fallbackUser);
      }
    } catch (err) {
      console.log('Erro inesperado ao buscar perfil:', err);
    }
  }

  // BUSCA DADOS DAS LIGAS, MEMBROS E FEED GERAL
  async function fetchDataFromSupabase() {
    try {
      const { data: challengesData } = await supabase.from('challenges').select('*');
      if (challengesData && challengesData.length > 0) {
        setChallenges(challengesData);
        if (!activeChallengeId) {
          setActiveChallengeId(challengesData[0].id);
        }
      }

      const { data: membersData } = await supabase.from('memberships').select('*');
      if (membersData) {
        setMemberships(membersData);
      }

      const { data: feedData } = await supabase.from('feed_posts').select('*');
      if (feedData) {
        setFeedPosts(feedData);
      }

    } catch (err) {
      console.log('Erro de sincronização com o banco de dados:', err);
    }
  }

  // LOGOUT (SAÍDA DO USUÁRIO)
  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      setSession(null);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível encerrar a sessão.');
    }
  }
    // LÓGICA DE SUBMISSÃO E SALVAMENTO DO TREINO NO SUPABASE
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

      Alert.alert('Sucesso!', `Treino enviado com sucesso! Aguardando validação para somar seus ${calculatedPoints} pontos.`);
      
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

  // GERENCIAMENTO DAS AÇÕES DE ENTRADA E REGISTRO
  async function handleAuthAction() {
    if (!emailInput.trim() || !passwordInput.trim()) {
      Alert.alert('Atenção', 'Preencha E-mail e Senha para continuar.');
      return;
    }
    if (isSignUp && !fullNameInput.trim()) {
      Alert.alert('Atenção', 'Por favor, preencha o seu Nome Completo.');
      return;
    }

    setAuthSubmitting(true);
    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailInput.trim(),
          password: passwordInput.trim(),
          options: {
            data: {
              full_name: fullNameInput.trim(),
              nickname: fullNameInput.trim(),
              gender: genderInput,
            }
          }
        });

        if (authError) {
          Alert.alert('Erro no Cadastro', authError.message);
          return;
        }

        // Criação automática na tabela pública de perfis
        if (authData?.user) {
          await supabase.from('profiles').upsert([
            {
              id: authData.user.id,
              full_name: fullNameInput.trim(),
              nickname: fullNameInput.trim(),
              gender: genderInput
            }
          ], { onConflict: 'id' });
        }

        Alert.alert('Sucesso!', 'Conta criada com sucesso! Faça o login para acessar.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailInput.trim(),
          password: passwordInput.trim(),
        });

        if (error) {
          Alert.alert('Erro no Login', error.message.includes('Invalid login credentials') ? 'E-mail ou senha incorretos.' : error.message);
        } else if (data.session) {
          setSession(data.session);
          await fetchUserProfile(data.session.user.id, data.session.user.email);
          await fetchDataFromSupabase();
        }
      }
    } catch (err) {
      Alert.alert('Erro de Conexão', err.message || 'Não foi possível comunicar com o servidor do Supabase.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  // EXIBIÇÃO DA TELA DE CARREGAMENTO INICIAL
  if (loadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>A carregar MuvFit...</Text>
      </View>
    );
  }

  // INTERFACE PARA USUÁRIOS NÃO AUTENTICADOS (LOGIN/CADASTRO)
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

                {/* SELETORES DE GÊNERO NATIVOS RESTAURADOS (COMPATÍVEIS COM WEB E APK) */}
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

  // INTERFACE PRINCIPAL DO APLICATIVO APÓS LOGIN
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

        <CustomPicker
          label="🎯 Selecione o Desafio:"
          selectedValue={activeChallengeId}
          onValueChange={(val) => setActiveChallengeId(val)}
          options={challenges.map(c => ({ label: c.title, value: c.id }))}
        />
      </View>

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
      />

      {/* BOTÃO FLUTUANTE DE REGISTRO DE TREINO */}
      <TouchableOpacity 
        style={{
          position: 'absolute', bottom: 20, right: 20, backgroundColor: '#f97316',
          paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, elevation: 5, shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84
        }}
        onPress={() => setIsWorkoutModalOpen(true)}
      >
        <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>🏋️ MUVFIT TREINO</Text>
      </TouchableOpacity>
      {/* MODAL DE REGISTRO DE TREINO CONECTADO */}
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

// FOLHA DE ESTILOS OTIMIZADA CROSS-PLATFORM
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
  logoutBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  mainContent: { padding: 16 },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 16 },
  actionBtn: { backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  actionBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' }
});
