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

// --- UTILITÁRIOS GLOBAIS ---
const calculateAge = (b) => {
  if (!b || b.length < 10) return null;
  const p = b.split('/');
  if (p.length !== 3) return null;
  const d = new Date(parseInt(p[2], 10), parseInt(p[1], 10) - 1, parseInt(p[0], 10));
  const t = new Date();
  let a = t.getFullYear() - d.getFullYear();
  const m = t.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < d.getDate())) a--;
  return isNaN(a) ? null : a;
};

const formatDateBR = (o) => `${String(o.getDate()).padStart(2, '0')}/${String(o.getMonth() + 1).padStart(2, '0')}/${o.getFullYear()}`;

const calculateSeasonDates = (type, isRen = false, ref = new Date()) => {
  let s = new Date(ref), e = new Date(ref), y = ref.getFullYear(), m = ref.getMonth();
  if (type === 'Weekly') {
    if (isRen) s.setDate(ref.getDate() - ref.getDay());
    e = new Date(s);
    e.setDate(s.getDate() + (6 - s.getDay()));
  } else if (type === 'Yearly') {
    if (isRen) s = new Date(y, 0, 1);
    e = new Date(y, 11, 31);
  } else {
    if (isRen) s = new Date(y, m, 1);
    e = new Date(y, m + 1, 0);
  }
  return { startDateStr: formatDateBR(s), endDateStr: formatDateBR(e), startDateObj: s, endDateObj: e };
};

const getChampionTitle = (g) => {
  if (g <= 0) return '';
  const titles = ['', 'Campeão', 'Bi-campeão', 'Tri-campeão', 'Tetra-campeão', 'Penta-campeão', 'Hexa-campeão'];
  return titles[g] || `${g}x Campeão`;
};

const formatBirthDateMask = (t) => {
  let c = t.replace(/\D/g, '').slice(0, 8);
  if (c.length >= 5) c = `${c.slice(0, 2)}/${c.slice(2, 4)}/${c.slice(4)}`;
  else if (c.length >= 3) c = `${c.slice(0, 2)}/${c.slice(2)}`;
  return c;
};

// Função centralizada para extrair o período (Mês/Ano ou Mês/AnoCurto)
const extractPeriodKey = (dateText) => {
  const parts = (dateText || '').split('/');
  if (parts.length >= 3) {
    const monthsMap = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mIdx = parseInt(parts[1], 10) - 1;
    if (monthsMap[mIdx]) return `${monthsMap[mIdx]}/${parts[2]}`;
  }
  return 'Atual';
};

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Estados de Autenticação e Perfil
  const [authForm, setAuthForm] = useState({ isSignUp: false, email: '', password: '', fullName: '', gender: 'Masculino', submitting: false });
  const [profileEdit, setProfileEdit] = useState({ isOpen: false, fullName: '', nickname: '', birthDate: '', gender: 'Masculino', avatar: '', saving: false });

  // Estados de Navegação e Contexto
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState({ id: '', name: '', nickname: '', birth_date: '', age: 0, gender: 'Masculino', avatar: 'https://picsum.photos/seed/poke/200/200', isAdmin: true, goldMedals: 0, silverMedals: 0, bronzeMedals: 0 });
  const [viewedUser, setViewedUser] = useState(currentUser);
  const [athletePerfScope, setAthletePerfScope] = useState('global');

  // Listas de Dados Principais
  const [challenges, setChallenges] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [pendingWorkouts, setPendingWorkouts] = useState([]);
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  [, setIsAdminContext] = useState(true);

  // Estados de Pesquisa e Modais
  const [searchState, setSearchState] = useState({ query: '', filter: 'all', isOpen: false });
  const [activeStoryView, setActiveStoryView] = useState(null);
  const [athleteStories, setAthleteStories] = useState([]);

  // Estados de Gráficos e Estatísticas
  const [weightState, setWeightState] = useState({ history: [], target: '75.0', isModalOpen: false, valueInput: '', dateInput: 'Set/2026', deleteMode: false, startFilter: 'Mar/2026', endFilter: 'Out/2026' });
  const [chartFilters, setChartFilters] = useState({ modalityPeriod: 'Todos', modalityModalOpen: false, kmModalOpen: false, kmActivity: 'Todos', kmPeriod: 'Todos', timeModalOpen: false, timePeriod: 'Todos' });

  // Objetivos e Ajustes
  const [personalGoals, setPersonalGoals] = useState([]);
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');
  const [allEvidencesModalOpen, setAllEvidencesModalOpen] = useState(false);

  const [configState, setConfigState] = useState({ subTab: 'conta', phone: '', newPassword: '', fontSize: 1, highContrast: false, language: 'pt-BR', rating: 5, feedback: '', helpMsg: '' });

  // Registo de Treinos
  const [workoutModal, setWorkoutModal] = useState({ isOpen: false, activity: '💪 Musculação', date: '', startH: '07', startM: '00', endH: '08', endM: '00', km: '', caption: '', photoStart: null, photoEvidence: null, photoEnd: null });

  // Administração e Regras
  const [adminModals, setAdminModals] = useState({ createChallenge: false, newTitle: '', newCode: '', hasCap: false, capValue: '22000', period: 'Monthly', advancedRules: false, configChallengeId: null, configActivity: '🏛️ Base da Liga' });
  const [accordionState, setAccordionState] = useState({ sec1: true, sec2: false, sec3: false, sec4: false, sec5: false });
  const [manualPoints, setManualPoints] = useState({ athleteId: '', activity: '💪 Musculação', rankingPts: '', bankPts: '', steps: '', bonusInquebravel: false, bonusDesperta: false });

  // Configurações da Liga
  const [leaguePeriod, setLeaguePeriod] = useState('Monthly');
  const [dailyStepsConfig, setDailyStepsConfig] = useState({ enabled: true, enableRankingScore: true, manualStepsInput: '10000', multiplier: '0.5' });
  const [bonusConfig, setBonusConfig] = useState({ inquebravelEnabled: true, inquebravelDays: '3', inquebravelPts: '5000', despertaEnabled: true, despertaLimitTime: '08:00', despertaPts: '3000' });

  const [modalitySettings, setModalitySettings] = useState({
    '💪 Musculação': { enabled: true, scoringMode: 'simple', simplePts: '10000', simplePerMin: '60', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }] },
    '🏋️ Crossfit / Treino Funcional': { enabled: true, scoringMode: 'simple', simplePts: '10000', simplePerMin: '60', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }] },
    '🫀 Treino Aeróbico': { enabled: true, scoringMode: 'simple', simplePts: '10000', simplePerMin: '60', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }] },
    '⚽ Esportes Coletivos': { enabled: true, scoringMode: 'simple', simplePts: '10000', simplePerMin: '60', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }] },
    '🥋 Lutas / Esportes Individuais': { enabled: true, scoringMode: 'simple', simplePts: '10000', simplePerMin: '60', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }] },
    '🏃 Corrida': { enabled: true, scoringMode: 'kmSimple', kmSimplePts: '1000', kmPerX: '1', simplePts: '1000', simplePerMin: '30', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }], kmSteps: [{ modeType: 'De', minKm: '0', maxKm: '5', pts: '5000' }] },
    '🚶 Caminhada': { enabled: true, scoringMode: 'kmSimple', kmSimplePts: '500', kmPerX: '1', simplePts: '500', simplePerMin: '30', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '3000' }], kmSteps: [{ modeType: 'De', minKm: '0', maxKm: '3', pts: '3000' }] },
    '🚴 Bike': { enabled: true, scoringMode: 'kmSimple', kmSimplePts: '1000', kmPerX: '5', simplePts: '1000', simplePerMin: '45', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '45', pts: '5000' }], kmSteps: [{ modeType: 'De', minKm: '0', maxKm: '15', pts: '8000' }] }
  });

  const [tiebreakers, setTiebreakers] = useState([
    { id: 'dailySteps', label: 'Passos Diários', enabled: true, order: 1 },
    { id: 'bankPoints', label: 'Banco de Pontos', enabled: true, order: 2 },
    { id: 'totalKm', label: 'Km Total Percorrido', enabled: true, order: 3 },
    { id: 'activeDays', label: 'Tempo em Atividade', enabled: true, order: 4 }
  ]);

  const modalitiesList = [
    { label: '🏛️ Base da Liga', value: '🏛️ Base da Liga' },
    { label: '🚶‍♂️ Passos Diários', value: '🚶‍♂️ Passos Diários' },
    { label: '💪 Musculação', value: '💪 Musculação' },
    { label: '🏋️ Crossfit / Treino Funcional', value: '🏋️ Crossfit / Treino Funcional' },
    { label: '🫀 Treino Aeróbico', value: '🫀 Treino Aeróbico' },
    { label: '🏃 Corrida', value: '🏃 Corrida' },
    { label: '🚶 Caminhada', value: '🚶 Caminhada' },
    { label: '🚴 Bike', value: '🚴 Bike' },
    { label: '⚽ Esportes Coletivos', value: '⚽ Esportes Coletivos' },
    { label: '🥋 Lutas / Esportes Individuais', value: '🥋 Lutas / Esportes Individuais' },
    { label: '🎁 Bônus e Critérios de Desempate', value: '🎁 Bônus e Critérios de Desempate' }
  ];

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0] || {};

  // Efeitos de Inicialização
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id, session.user.email);
        fetchDataFromSupabase();
      }
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id, session.user.email);
        fetchDataFromSupabase();
      } else {
        setCurrentUser({ id: '', name: '', nickname: '' });
      }
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId, userEmail) {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (data) {
        let formattedDate = '';
        if (data.birth_date) {
          const parts = data.birth_date.split('-');
          if (parts.length === 3) formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        const computedAge = formattedDate ? calculateAge(formattedDate) : 0;
        if (data.weight_history) {
          try {
            const parsed = typeof data.weight_history === 'string' ? JSON.parse(data.weight_history) : data.weight_history;
            if (Array.isArray(parsed)) setWeightState(prev => ({ ...prev, history: parsed }));
          } catch (e) { console.log(e); }
        }
        if (data.target_weight != null) setWeightState(prev => ({ ...prev, target: String(data.target_weight) }));

        const loadedUser = {
          id: data.id,
          name: data.full_name || userEmail.split('@')[0],
          nickname: data.nickname || data.full_name || userEmail.split('@')[0],
          birth_date: formattedDate,
          age: computedAge,
          gender: data.gender || 'Masculino',
          avatar: data.avatar_url || `https://picsum.photos/seed/${data.id}/200/200`,
          isAdmin: true,
          goldMedals: data.gold_medals || 0,
          silverMedals: data.silver_medals || 0,
          bronzeMedals: data.bronze_medals || 0
        };
        setCurrentUser(loadedUser);
        setViewedUser(loadedUser);
      }
    } catch (err) { console.log(err); }
  }

  async function fetchDataFromSupabase() {
    try {
      const { data: challengesData } = await supabase.from('challenges').select('*');
      if (challengesData && challengesData.length > 0) {
        const formatted = challengesData.map(c => ({ ...c, startDate: c.start_date, endDate: c.end_date, tiebreakerEnabled: c.tiebreaker_enabled }));
        setChallenges(formatted);
        const currentSelId = activeChallengeId || formatted[0].id;
        if (!activeChallengeId) setActiveChallengeId(formatted[0].id);
        if (!adminModals.configChallengeId) setAdminModals(prev => ({ ...prev, configChallengeId: formatted[0].id }));

        const activeCh = formatted.find(c => c.id === currentSelId) || formatted[0];
        if (activeCh?.rules_config) {
          if (activeCh.rules_config.modalitySettings) setModalitySettings(activeCh.rules_config.modalitySettings);
          if (activeCh.rules_config.bonusConfig) setBonusConfig(activeCh.rules_config.bonusConfig);
          if (activeCh.rules_config.dailyStepsConfig) setDailyStepsConfig(activeCh.rules_config.dailyStepsConfig);
          if (activeCh.rules_config.tiebreakers) setTiebreakers(activeCh.rules_config.tiebreakers);
          if (activeCh.rules_config.leaguePeriod) setLeaguePeriod(activeCh.rules_config.leaguePeriod);
        }
      }

      const { data: membersData } = await supabase.from('memberships').select('*');
      if (membersData) {
        setMemberships(membersData.map(m => ({
          ...m,
          challengeId: m.challenge_id,
          userId: m.user_id,
          rankingPoints: m.ranking_points || 0,
          bankPoints: m.bank_points || 0,
          totalSteps: m.total_steps || 0,
          totalKm: m.total_km || 0,
          activeDays: m.active_days || 0,
          goldMedals: m.gold_medals || 0,
          silverMedals: m.silver_medals || 0,
          bronzeMedals: m.bronze_medals || 0
        })));
      }

      const { data: feedData } = await supabase.from('feed_posts').select('*');
      if (feedData) setFeedPosts(feedData);

      const { data: pendingData } = await supabase.from('pending_workouts').select('*');
      if (pendingData) setPendingWorkouts(pendingData);
    } catch (err) { console.log(err); }
  }

  // Funções de Autenticação
  async function handleAuthAction() {
    if (!authForm.email.trim() || !authForm.password.trim()) {
      Alert.alert('Atenção', 'Preencha E-mail e Palavra-passe.');
      return;
    }
    setAuthForm(prev => ({ ...prev, submitting: true }));
    try {
      if (authForm.isSignUp) {
        if (!authForm.fullName.trim()) {
          Alert.alert('Atenção', 'Preencha o Nome Completo.');
          setAuthForm(prev => ({ ...prev, submitting: false }));
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email.trim(),
          password: authForm.password.trim(),
          options: { data: { full_name: authForm.fullName.trim(), nickname: authForm.fullName.trim(), gender: authForm.gender } }
        });
        if (error) { Alert.alert('Erro', error.message); setAuthForm(prev => ({ ...prev, submitting: false })); return; }
        if (data?.session) {
          setSession(data.session);
          await fetchUserProfile(data.session.user.id, data.session.user.email);
          await fetchDataFromSupabase();
        } else {
          Alert.alert('Conta Criada!', 'Faça login com as suas credenciais.');
          setAuthForm(prev => ({ ...prev, isSignUp: false }));
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: authForm.email.trim(), password: authForm.password.trim() });
        if (error) Alert.alert('Erro no Login', error.message);
        else if (data.session) {
          setSession(data.session);
          await fetchUserProfile(data.session.user.id, data.session.user.email);
          await fetchDataFromSupabase();
        }
      }
    } catch (err) { Alert.alert('Erro', err.message); }
    finally { setAuthForm(prev => ({ ...prev, submitting: false })); }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  // Funções de Perfil e Desafios
  function selectChallengeContext(challenge, asAdmin) {
    setActiveChallengeId(challenge.id);
    setIsAdminContext(asAdmin);
    if (challenge.rules_config) {
      if (challenge.rules_config.modalitySettings) setModalitySettings(challenge.rules_config.modalitySettings);
      if (challenge.rules_config.bonusConfig) setBonusConfig(challenge.rules_config.bonusConfig);
      if (challenge.rules_config.dailyStepsConfig) setDailyStepsConfig(challenge.rules_config.dailyStepsConfig);
      if (challenge.rules_config.tiebreakers) setTiebreakers(challenge.rules_config.tiebreakers);
      if (challenge.rules_config.leaguePeriod) setLeaguePeriod(challenge.rules_config.leaguePeriod);
    }
    setCurrentScreen(asAdmin ? 'admin' : 'feed');
  }

  function handleOpenUserProfile(userId) {
    const found = memberships.find(m => m.userId === userId);
    setViewedUser(found || currentUser);
    setAthletePerfScope('global');
    setCurrentScreen('athlete_center');
  }

  // Cálculos de Desempenho e Filtros do Atleta
  const athleteMembershipsAll = memberships.filter(m => m.userId === viewedUser.id);
  const athleteChallengesList = challenges.filter(c => athleteMembershipsAll.some(m => m.challengeId === c.id));
  const selectedMembershipForAthlete = athletePerfScope !== 'global' ? athleteMembershipsAll.find(m => String(m.challengeId) === String(athletePerfScope)) : null;

  let displayedPerf = { rankingPoints: 0, bankPoints: 0, totalSteps: 0, totalKm: 0, activeDays: 0, goldMedals: viewedUser.goldMedals || 0, silverMedals: viewedUser.silverMedals || 0, bronzeMedals: viewedUser.bronzeMedals || 0, athleteStatusText: 'N/A' };
  if (athletePerfScope === 'global') {
    displayedPerf.rankingPoints = athleteMembershipsAll.reduce((a, c) => a + (c.rankingPoints || 0), 0);
    displayedPerf.bankPoints = athleteMembershipsAll.reduce((a, c) => a + (c.bankPoints || 0), 0);
    displayedPerf.totalSteps = athleteMembershipsAll.reduce((a, c) => a + (c.totalSteps || 0), 0);
    displayedPerf.totalKm = athleteMembershipsAll.reduce((a, c) => a + (c.totalKm || 0), 0);
    displayedPerf.activeDays = athleteMembershipsAll.reduce((a, c) => a + (c.activeDays || 0), 0);
    displayedPerf.athleteStatusText = 'Múltiplas Ligas';
  } else if (selectedMembershipForAthlete) {
    displayedPerf.rankingPoints = selectedMembershipForAthlete.rankingPoints || 0;
    displayedPerf.bankPoints = selectedMembershipForAthlete.bankPoints || 0;
    displayedPerf.totalSteps = selectedMembershipForAthlete.totalSteps || 0;
    displayedPerf.totalKm = selectedMembershipForAthlete.totalKm || 0;
    displayedPerf.activeDays = selectedMembershipForAthlete.activeDays || 0;
    displayedPerf.goldMedals = selectedMembershipForAthlete.goldMedals || 0;
    displayedPerf.silverMedals = selectedMembershipForAthlete.silverMedals || 0;
    displayedPerf.bronzeMedals = selectedMembershipForAthlete.bronzeMedals || 0;
    displayedPerf.athleteStatusText = selectedMembershipForAthlete.role === 'active' ? '⚡ Atleta Ativo' : selectedMembershipForAthlete.role === 'pending_athlete' ? '⏳ Atleta Pendente' : '👀 Torcedor';
  }

  const athleteFeedPostsAll = feedPosts.filter(p => p.user_id === viewedUser.id);
  const calculatedStepsPoints = Math.round((parseFloat(dailyStepsConfig.manualStepsInput) || 0) * (parseFloat(dailyStepsConfig.multiplier) || 0));

  // Renderização Visual Reduzida e Organizada
  if (loadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e3a8a' }}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ color: '#ffffff', marginTop: 12, fontWeight: 'bold' }}>A carregar MuvFit...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#1e3a8a' }}>
        <ScrollView contentContainerStyle={{ padding: 24, justifyContent: 'center', flexGrow: 1 }}>
          <Text style={{ fontSize: 36, fontWeight: '900', color: '#f97316', textAlign: 'center' }}>MUVFIT</Text>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 24 }}>Mizan Soluções Técnicas</Text>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center', marginBottom: 16 }}>
              {authForm.isSignUp ? 'Criar Nova Conta' : 'Aceder à Plataforma'}
            </Text>

            {authForm.isSignUp && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nome Completo"
                  value={authForm.fullName}
                  onChangeText={(txt) => setAuthForm(prev => ({ ...prev, fullName: txt }))}
                />
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TouchableOpacity
                    style={[styles.chipBtn, authForm.gender === 'Masculino' && styles.chipBtnActive, { flex: 1, alignItems: 'center' }]}
                    onPress={() => setAuthForm(prev => ({ ...prev, gender: 'Masculino' }))}
                  >
                    <Text style={[styles.chipText, authForm.gender === 'Masculino' && styles.chipTextActive]}>Masculino</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chipBtn, authForm.gender === 'Feminino' && styles.chipBtnActive, { flex: 1, alignItems: 'center' }]}
                    onPress={() => setAuthForm(prev => ({ ...prev, gender: 'Feminino' }))}
                  >
                    <Text style={[styles.chipText, authForm.gender === 'Feminino' && styles.chipTextActive]}>Feminino</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TextInput
              style={styles.input}
              placeholder="E-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              value={authForm.email}
              onChangeText={(txt) => setAuthForm(prev => ({ ...prev, email: txt }))}
            />
            <TextInput
              style={styles.input}
              placeholder="Palavra-passe"
              secureTextEntry
              value={authForm.password}
              onChangeText={(txt) => setAuthForm(prev => ({ ...prev, password: txt }))}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleAuthAction} disabled={authForm.submitting}>
              {authForm.submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>{authForm.isSignUp ? 'CADASTRAR CONTA' : 'ENTRAR NO MUVFIT'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 14, alignItems: 'center' }} onPress={() => setAuthForm(prev => ({ ...prev, isSignUp: !prev.isSignUp }))}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' }}>
                {authForm.isSignUp ? 'Já tem conta? Faça Login' : 'Não tem conta? Registe-se gratuitamente'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, configState.highContrast && { backgroundColor: '#000000' }]}>
      {/* Cabeçalho Superior */}
      <View style={[styles.topHeader, configState.highContrast && { backgroundColor: '#000000', borderBottomWidth: 2, borderBottomColor: '#f97316' }]}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brandTitle}>MUVFIT</Text>
            <Text style={styles.brandSubtitle}>Mizan Soluções Técnicas</Text>
          </View>
          <TouchableOpacity style={{ backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }} onPress={handleSignOut}>
            <Text style={{ color: '#ffffff', fontSize: 9 * configState.fontSize, fontWeight: 'bold' }}>🚪 SAIR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo Principal / Barra de Navegação */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={[styles.sidebar, configState.highContrast && { backgroundColor: '#111111' }]}>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'dashboard' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('dashboard')}>
            <Text style={styles.sidebarIcon}>🏠</Text>
            <Text style={[styles.sidebarText, currentScreen === 'dashboard' && styles.sidebarTextActive]}>Painel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'athlete_center' && styles.sidebarBtnActive]} onPress={() => { setViewedUser(currentUser); setAthletePerfScope('global'); setCurrentScreen('athlete_center'); }}>
            <Text style={styles.sidebarIcon}>👤</Text>
            <Text style={[styles.sidebarText, currentScreen === 'athlete_center' && styles.sidebarTextActive]}>Atleta</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'configuracao_conta' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('configuracao_conta')}>
            <Text style={styles.sidebarIcon}>☰</Text>
            <Text style={[styles.sidebarText, currentScreen === 'configuracao_conta' && styles.sidebarTextActive]}>Config. Conta</Text>
          </TouchableOpacity>
        </View>

        <View style={[{ flex: 1, backgroundColor: '#ffffff' }, configState.highContrast && { backgroundColor: '#000000' }]}>
          {currentScreen === 'dashboard' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={[styles.pageTitle, configState.highContrast && { color: '#ffffff' }]}>Painel Geral de Ligas (Nuvem)</Text>
              <Text style={styles.emptyNoticeText}>Selecione uma opção na barra lateral para navegar pelas funcionalidades do MuvFit.</Text>
            </ScrollView>
          )}

          {currentScreen === 'configuracao_conta' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={[styles.pageTitle, configState.highContrast && { color: '#ffffff' }]}>⚙️ Configuração de Conta</Text>
              <View style={[styles.cardBox, configState.highContrast && { backgroundColor: '#111111', borderColor: '#f97316' }]}>
                <Text style={styles.inputLabel}>E-mail Cadastrado:</Text>
                <TextInput style={[styles.input, { backgroundColor: '#e2e8f0' }]} editable={false} value={session?.user?.email || ''} />
              </View>
            </ScrollView>
          )}

          {currentScreen === 'athlete_center' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.profileHeaderCard}>
                <Image source={{ uri: viewedUser.avatar }} style={styles.avatarLarge} />
                <Text style={styles.profileNicknameDisplay}>{viewedUser.nickname || viewedUser.name}</Text>
                <Text style={styles.profileMeta}>{viewedUser.age ? `${viewedUser.age} anos` : 'Idade não informada'} | {viewedUser.gender || 'Masculino'}</Text>
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
  topHeader: { padding: 12, backgroundColor: '#1e3a8a', position: 'relative', zIndex: 10 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
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
  emptyNoticeText: { fontSize: 10, color: '#94a3b8', fontStyle: 'italic', marginBottom: 8 },
  cardBox: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 6, fontSize: 11, marginBottom: 6 },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#475569', marginVertical: 4 },
  primaryBtn: { backgroundColor: '#f97316', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  chipBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  chipBtnActive: { backgroundColor: '#f97316' },
  chipText: { fontSize: 9, fontWeight: 'bold', color: '#475569' },
  chipTextActive: { color: '#ffffff' },
  profileHeaderCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10 },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, marginBottom: 6, borderWidth: 2, borderColor: '#f97316' },
  profileNicknameDisplay: { fontSize: 16, fontWeight: '900', color: '#1e3a8a', marginBottom: 2 },
  profileMeta: { fontSize: 10, color: '#64748b', marginBottom: 4 }
});
