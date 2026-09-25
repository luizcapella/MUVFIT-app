import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Image, Modal, SafeAreaView, ActivityIndicator, Alert, Platform, Dimensions } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sua-url-aqui.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-aqui';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const calculateAge = (b) => { if (!b || b.length !== 10) return ''; const [d, m, y] = b.split('/').map(Number); const bd = new Date(y, m - 1, d), t = new Date(); let a = t.getFullYear() - bd.getFullYear(); const mo = t.getMonth() - bd.getMonth(); if (mo < 0 || (mo === 0 && t.getDate() < bd.getDate())) a--; return isNaN(a) ? '' : `${a} anos`; };
const formatDateBR = (i) => { if (!i) return ''; const d = new Date(i); if (isNaN(d.getTime())) return i; return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };
const formatBirthDateMask = (v) => { const c = v.replace(/\D/g, ''); if (c.length <= 2) return c; if (c.length <= 4) return `${c.slice(0, 2)}/${c.slice(2)}`; return `${c.slice(0, 2)}/${c.slice(2, 4)}/${c.slice(4, 8)}`; };
const calculateSeasonDates = (p) => { const n = new Date(); if (p === 'Weekly') { const d = new Date(n); d.setDate(d.getDate() - d.getDay() + 6); return { start: formatDateBR(n), end: formatDateBR(d) }; } if (p === 'Monthly') { const ed = new Date(n.getFullYear(), n.getMonth() + 1, 0); return { start: `01/${String(n.getMonth() + 1).padStart(2, '0')}/${n.getFullYear()}`, end: formatDateBR(ed) }; } return { start: `01/01/${n.getFullYear()}`, end: `31/12/${n.getFullYear()}` }; };
const getChampionTitle = (g) => { if (!g || g === 0) return 'Atleta'; if (g === 1) return '🏆 Campeão'; if (g === 2) return '🏆🏆 Bi-campeão'; if (g === 3) return '🏆🏆🏆 Tri-campeão'; return `🏆x${g} Multicampeão`; };

export default function App() {
  const [session, setSession] = useState(null);
  const [authData, setAuthData] = useState({ email: '', password: '', isSignUp: false });
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  
  const [currentUser, setCurrentUser] = useState({ id: '', name: 'Atleta', nickname: 'Atleta', avatar: 'https://via.placeholder.com/150', role: 'member', status: 'pending' });
  const [viewedUser, setViewedUser] = useState(null);
  const [profileModal, setProfileModal] = useState({ open: false, saving: false, fullName: '', nickname: '', birthDate: '', gender: 'Masculino', avatar: '' });

  const [challenges, setChallenges] = useState([]);
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [athleteFeedPosts, setAthleteFeedPosts] = useState([]);
  const [athleteFeedPostsAll, setAthleteFeedPostsAll] = useState([]);
  const [pendingWorkouts, setPendingWorkouts] = useState([]);

  const [searchState, setSearchState] = useState({ query: '', active: false, filterType: 'all' });
  const [modals, setModals] = useState({ workout: false, rules: false, challenge: false, weight: false, radar: false, km: false, time: false, evidences: false, goal: false, editProfile: false });

  const [workoutForm, setWorkoutForm] = useState({ activity: '🚶‍♂️ Passos Diários', date: new Date().toISOString().split('T')[0], startH: '07', startM: '00', endH: '08', endM: '00', km: '', caption: '', photoStart: null, photoEvidence: null, photoEnd: null });
  const [weightData, setWeightData] = useState({ list: [], newInputValue: '', newDateInput: formatDateBR(new Date()), targetValue: '', deleteMode: false });
  const [goalsState, setGoalsState] = useState({ list: [], newText: '' });
  const [challengeForm, setChallengeForm] = useState({ title: '', code: '', period: 'Weekly', hasCap: false, capValue: '22000' });

  const [adminConfig, setAdminConfig] = useState({
    selectedChallengeId: null,
    selectedActivity: '🏛️ Base da Liga',
    leaguePeriod: 'Weekly',
    dailySteps: { enabled: true, enableRankingScore: true, manualStepsInput: '', multiplier: '1.0' },
    modalitySettings: {},
    bonus: { inquebravelEnabled: false, inquebravelDays: '5', inquebravelPts: '500', despertaEnabled: false, despertaLimitTime: '08:00', despertaPts: '300' },
    tiebreakers: [
      { id: 't1', label: 'Tempo em Atividade', enabled: true, order: 1 },
      { id: 't2', label: 'Total de Treinos', enabled: true, order: 2 },
      { id: 't3', label: 'Menor Peso Atingido', enabled: false, order: 3 },
      { id: 't4', label: 'Ordem de Cadastro', enabled: false, order: 4 }
    ]
  });

  const modalitiesList = [
    { label: 'Passos Diários', value: '🚶‍♂️ Passos Diários' },
    { label: 'Musculação', value: '💪 Musculação' },
    { label: 'Crossfit / Treino Funcional', value: '🏋️ Crossfit / Treino Funcional' },
    { label: 'Treino Aeróbico', value: '🫀 Treino Aeróbico' },
    { label: 'Corrida', value: '🏃 Corrida' },
    { label: 'Caminhada', value: '🚶 Caminhada' },
    { label: 'Bike', value: '🚴 Bike' },
    { label: 'Esportes Coletivos', value: '⚽ Esportes Coletivos' },
    { label: 'Lutas / Esportes Individuais', value: '🥋 Lutas / Esportes Individuais' },
    { label: 'Bônus e Desempate', value: '🎁 Bônus e Critérios de Desempate' },
    { label: 'Base da Liga', value: '🏛️ Base da Liga' }
  ];

  const hoursArray = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesArray = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0] || {};
  const isStepsActive = workoutForm.activity === '🚶‍♂️ Passos Diários';
  const isKmGroupActive = ['🏃 Corrida', '🚶 Caminhada', '🚴 Bike'].includes(workoutForm.activity);
  const isThreePhotosGroupActive = ['💪 Musculação', '🏋️ Crossfit / Treino Funcional', '🫀 Treino Aeróbico', '⚽ Esportes Coletivos', '🥋 Lutas / Esportes Individuais'].includes(workoutForm.activity);

  const getDynamicActiveRulesText = () => {
    if (isStepsActive) return ['Cada 1.000 passos convertidos conforme multiplicador da liga.', 'Obrigatório o envio de print do painel de passos diário.'];
    if (isKmGroupActive) return ['Pontuação contabilizada com base na distância percorrida em KM.', 'Necessário evidência de mapa ou painel do aplicativo de trajeto.'];
    return ['Pontuação baseada no tempo total de atividade executada.', 'Obrigatório o envio das 3 fotos (Início, Evidência e Fim) para validação.'];
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session) fetchDataFromSupabase(session.user.id); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => { setSession(session); if (session) fetchDataFromSupabase(session.user.id); });
    return () => subscription.unsubscribe();
  }, []);

  const fetchDataFromSupabase = async (userId) => {
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (profile) setCurrentUser(profile);
      const { data: chList } = await supabase.from('challenges').select('*');
      if (chList && chList.length > 0) { setChallenges(chList); setActiveChallengeId(chList[0].id); }
    } catch (e) { console.log('Erro ao carregar dados:', e); }
  };

  const fetchUserProfile = async (userId) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) setViewedUser(data);
    } catch (e) { console.log('Erro ao buscar perfil:', e); }
  };

  const saveWeightDataToSupabase = async (list, target) => {
    try {
      await supabase.from('profiles').update({ weight_history: list, target_weight: target }).eq('id', currentUser.id);
    } catch (e) { console.log('Erro ao salvar peso:', e); }
  };

  const handleAuthAction = async () => {
    if (!authData.email || !authData.password) return Alert.alert('Atenção', 'Preencha e-mail e senha.');
    try {
      if (authData.isSignUp) {
        const { error } = await supabase.auth.signUp({ email: authData.email, password: authData.password });
        if (error) throw error;
        Alert.alert('Sucesso', 'Conta criada com sucesso!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authData.email, password: authData.password });
        if (error) throw error;
      }
    } catch (error) { Alert.alert('Erro', error.message); }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); setSession(null); setCurrentUser({ id: '', name: 'Atleta', nickname: 'Atleta', avatar: 'https://via.placeholder.com/150', role: 'member', status: 'pending' }); };

  const handleChangePassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authData.email);
      if (error) throw error;
      Alert.alert('E-mail enviado', 'Verifique sua caixa de entrada para redefinir a senha.');
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  const handleDeleteAccountConfirmation = async () => {
    Alert.alert('Atenção', 'Deseja realmente excluir sua conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => { Alert.alert('Aviso', 'Solicitação enviada.'); } }
    ]);
  };

  const handleSendEmailRequest = () => { Alert.alert('Suporte', 'Solicitação de suporte enviada por e-mail.'); };

  const handleSaveProfile = async () => {
    setProfileModal(prev => ({ ...prev, saving: true }));
    try {
      const updates = { name: profileModal.fullName, nickname: profileModal.nickname, birth_date: profileModal.birthDate, gender: profileModal.gender, avatar: profileModal.avatar };
      const { error } = await supabase.from('profiles').update(updates).eq('id', currentUser.id);
      if (error) throw error;
      setCurrentUser(prev => ({ ...prev, ...updates }));
      setModals(prev => ({ ...prev, editProfile: false }));
      Alert.alert('Sucesso', 'Perfil atualizado!');
    } catch (e) { Alert.alert('Erro', e.message); } finally { setProfileModal(prev => ({ ...prev, saving: false })); }
  };

  const selectChallengeContext = (id) => setActiveChallengeId(id);
  const handleShareInvite = () => { Alert.alert('Código da Liga', `Compartilhe o código: ${selectedChallenge.code || 'MUV2026'}`); };
  const handleOpenUserProfile = (user) => { setViewedUser(user); setIsProfileModalOpen(true); };

  const handleRequestCommunityEntry = async () => { Alert.alert('Sucesso', 'Solicitação enviada para a comunidade!'); };
  const handleRequestAthleteActive = async () => { Alert.alert('Sucesso', 'Solicitação para status ativo enviada!'); };

  const handleToggleLike = async (postId) => {
    setAthleteFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
  };

  const handleAddComment = async (postId, text) => {
    if (!text.trim()) return;
    setAthleteFeedPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), { id: Date.now(), user_name: currentUser.nickname, text }] } : p));
  };

  const handleCreateChallenge = async () => {
    if (!challengeForm.title || !challengeForm.code) return Alert.alert('Atenção', 'Preencha o nome e o código do desafio.');
    try {
      const newCh = { id: `ch_${Date.now()}`, title: challengeForm.title, code: challengeForm.code.toUpperCase(), period: challengeForm.period, status: 'open', has_daily_cap: challengeForm.hasCap, daily_cap: parseInt(challengeForm.capValue, 10) || 22000 };
      setChallenges(prev => [...prev, newCh]);
      setActiveChallengeId(newCh.id);
      setModals(prev => ({ ...prev, challenge: false }));
      Alert.alert('Sucesso', 'Desafio criado com sucesso!');
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  const handleDeleteChallenge = async (chId) => {
    setChallenges(prev => prev.filter(c => c.id !== chId));
    Alert.alert('Sucesso', 'Desafio excluído.');
  };

  const handleFinishChallenge = async (chId) => {
    setChallenges(prev => prev.map(c => c.id === chId ? { ...c, status: 'closed' } : c));
    Alert.alert('Sucesso', 'Temporada encerrada.');
  };

  const toggleChallengeRegistrations = async (chId) => {
    setChallenges(prev => prev.map(c => c.id === chId ? { ...c, registrations_locked: !c.registrations_locked } : c));
  };

  const handleUpdateAthleteStatus = async (memberId, newStatus) => {
    setMemberships(prev => prev.map(m => m.id === memberId ? { ...m, status: newStatus } : m));
    Alert.alert('Sucesso', 'Status do atleta atualizado.');
  };

  const handleApproveCommunityMember = async (memberId) => { handleUpdateAthleteStatus(memberId, 'active'); };
  const handleRejectCommunityMember = async (memberId) => { handleUpdateAthleteStatus(memberId, 'rejected'); };
  const handleRemoveMemberFromCommunity = async (memberId) => {
    setMemberships(prev => prev.filter(m => m.id !== memberId));
    Alert.alert('Sucesso', 'Membro removido.');
  };

  const handleManualPointsSubmit = async () => { Alert.alert('Sucesso', 'Pontos manuais lançados!'); };
  const handleTriggerPhoto = (type, setter) => { setter('https://via.placeholder.com/300'); };

  const calculateWorkoutPoints = () => {
    if (isStepsActive) return 100;
    if (isKmGroupActive) return parseFloat(workoutForm.km || '0') * 50;
    const startM = (parseInt(workoutForm.startH, 10) * 60) + parseInt(workoutForm.startM, 10);
    const endM = (parseInt(workoutForm.endH, 10) * 60) + parseInt(workoutForm.endM, 10);
    let diff = endM - startM; if (diff <= 0) diff += 1440;
    return diff * 10;
  };

  const handleSubmitWorkout = async () => {
    if (isThreePhotosGroupActive && (!workoutForm.photoStart || !workoutForm.photoEvidence || !workoutForm.photoEnd)) {
      return Alert.alert('Atenção', 'É obrigatório o envio das 3 fotos (Início, Evidência e Fim).');
    }
    if (!workoutForm.photoEvidence && !isThreePhotosGroupActive) {
      return Alert.alert('Atenção', 'Insira a foto de comprovação.');
    }
    try {
      const pts = calculateWorkoutPoints();
      const newPost = { id: `w_${Date.now()}`, user_id: currentUser.id, challenge_id: activeChallengeId, activity_type: workoutForm.activity, caption: workoutForm.caption, photo_evidence: workoutForm.photoEvidence, points: pts, created_at: new Date().toISOString() };
      setPendingWorkouts(prev => [newPost, ...prev]);
      setModals(prev => ({ ...prev, workout: false }));
      Alert.alert('Sucesso', 'Treino enviado para aprovação!');
    } catch (e) { Alert.alert('Erro', e.message); }
  };

  const handleApproveWorkout = async (postId) => {
    const post = pendingWorkouts.find(p => p.id === postId);
    if (!post) return;
    setPendingWorkouts(prev => prev.filter(p => p.id !== postId));
    setAthleteFeedPosts(prev => [post, ...prev]);
    Alert.alert('Sucesso', 'Treino aprovado com sucesso!');
  };

  const handleRejectWorkout = async (postId) => {
    setPendingWorkouts(prev => prev.filter(p => p.id !== postId));
    Alert.alert('Aviso', 'Treino rejeitado.');
  };

  const handleUpdateModalityProp = (activityName, propName, value) => {
    setAdminConfig(prev => ({
      ...prev,
      modalitySettings: {
        ...prev.modalitySettings,
        [activityName]: { ...(prev.modalitySettings[activityName] || {}), [propName]: value }
      }
    }));
  };

  const handleAddTimeStep = (activityName) => {
    setAdminConfig(prev => {
      const current = prev.modalitySettings[activityName] || {};
      const steps = current.timeSteps || current.kmSteps || [];
      const newSteps = [...steps, { modeType: 'De', minTime: '', maxTime: '', pts: '', minKm: '', maxKm: '' }];
      const key = activityName.includes('Corrida') || activityName.includes('Caminhada') || activityName.includes('Bike') ? 'kmSteps' : 'timeSteps';
      return {
        ...prev,
        modalitySettings: { ...prev.modalitySettings, [activityName]: { ...current, [key]: newSteps } }
      };
    });
  };

  const handleRemoveTimeStep = (activityName, index) => {
    setAdminConfig(prev => {
      const current = prev.modalitySettings[activityName] || {};
      const key = activityName.includes('Corrida') || activityName.includes('Caminhada') || activityName.includes('Bike') ? 'kmSteps' : 'timeSteps';
      const steps = [...(current[key] || [])];
      steps.splice(index, 1);
      return {
        ...prev,
        modalitySettings: { ...prev.modalitySettings, [activityName]: { ...current, [key]: steps } }
      };
    });
  };

  const handleSaveAdvancedRules = () => {
    setModals(prev => ({ ...prev, rules: false }));
    Alert.alert('Sucesso', 'Regras avançadas salvas!');
  };
  const handleAddKmStep = (modName) => {
    setModalitySettings(prev => ({
      ...prev,
      [modName]: { ...prev[modName], kmSteps: [...(prev[modName]?.kmSteps || []), { modeType: 'De', minKm: '0', maxKm: '5', pts: '5000' }] }
    }));
  };

  const handleRemoveKmStep = (modName, index) => {
    setModalitySettings(prev => {
      const currentSteps = [...(prev[modName]?.kmSteps || [])];
      currentSteps.splice(index, 1);
      return { ...prev, [modName]: { ...prev[modName], kmSteps: currentSteps } };
    });
  };

  const getDynamicActiveRulesText = () => {
    const ruleLines = [`• ${selectedActivity}: Modalidade Selecionada`];
    if (selectedChallenge?.has_daily_cap && selectedChallenge?.daily_cap) ruleLines.push(`• Teto Diário: Máx ${selectedChallenge.daily_cap.toLocaleString()} pts/dia`);
    if (bonusConfig?.inquebravelEnabled) ruleLines.push(`• Bônus Inquebrável: +${bonusConfig.inquebravelPts} pts`);
    if (bonusConfig?.despertaEnabled) ruleLines.push(`• Bônus Desperta: +${bonusConfig.despertaPts} pts`);
    ruleLines.push('• Trava: Máximo 1 envio por modalidade ao dia');
    return ruleLines;
  };

  const searchResultsAthletes = memberships.filter(m => searchFilter !== 'challenge' && (!searchQuery.trim() || (m.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) || (m.nickname || '').toLowerCase().includes(searchQuery.toLowerCase().trim()))).reduce((acc, current) => {
    if (!acc.find(item => item.userId === current.userId)) acc.push(current);
    return acc;
  }, []);

  const searchResultsChallenges = challenges.filter(c => searchFilter !== 'athlete' && (!searchQuery.trim() || (c.title || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) || (c.invite_code || '').toLowerCase().includes(searchQuery.toLowerCase().trim())));

  const currentChallengeMembers = memberships.filter(m => m.challengeId === activeChallengeId);
  const activeMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'active');
  const spectatorMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'spectator' || m.role === 'pending_athlete');
  const pendingCommunityMembers = currentChallengeMembers.filter(m => m.role === 'pending_community');
  const pendingAthleteMembers = currentChallengeMembers.filter(m => m.role === 'pending_athlete');
  const currentFeedPosts = feedPosts.filter(p => p.challenge_id === activeChallengeId);
  const currentPendingWorkouts = pendingWorkouts.filter(w => w.challenge_id === activeChallengeId);

  const sortedAthletes = [...activeMembersInChallenge].sort((a, b) => (b.rankingPoints || 0) !== (a.rankingPoints || 0) ? (b.rankingPoints || 0) - (a.rankingPoints || 0) : (b.activeDays || 0) - (a.activeDays || 0));
  const rankedAthletes = sortedAthletes.map((athlete, index) => ({ ...athlete, rankDisplay: `#${index + 1}` }));
  const top3Winners = [...currentChallengeMembers].filter(m => (m.goldMedals || 0) > 0).sort((a, b) => (b.goldMedals || 0) - (a.goldMedals || 0)).slice(0, 3).map(m => `${m.nickname || m.name} - ${getChampionTitle(m.goldMedals)} (${m.goldMedals}x)`);

  const athleteMembershipsAll = memberships.filter(m => m.userId === viewedUser.id);
  const athleteChallengesList = challenges.filter(c => athleteMembershipsAll.some(m => m.challengeId === c.id));
  const selectedMembershipForAthlete = athletePerfScope !== 'global' ? athleteMembershipsAll.find(m => String(m.challengeId) === String(athletePerfScope)) : null;

  let displayedPerf = { rankingPoints: 0, bankPoints: 0, totalSteps: 0, totalKm: 0, activeDays: 0, goldMedals: viewedUser.goldMedals || 0, silverMedals: viewedUser.silverMedals || 0, bronzeMedals: viewedUser.bronzeMedals || 0, athleteStatusText: 'N/A' };
  if (athletePerfScope === 'global') {
    displayedPerf.rankingPoints = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.rankingPoints || 0), 0);
    displayedPerf.bankPoints = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.bankPoints || 0), 0);
    displayedPerf.totalSteps = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.totalSteps || 0), 0);
    displayedPerf.totalKm = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.totalKm || 0), 0);
    displayedPerf.activeDays = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.activeDays || 0), 0);
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
  const calculatedStepsPoints = Math.round((parseFloat(dailyStepsConfig?.manualStepsInput) || 0) * (parseFloat(dailyStepsConfig?.multiplier) || 0));

  const allAvailableModalities = [
    { label: 'Musculação', color: '#3b82f6' }, { label: 'Crossfit / Treino Funcional', color: '#22c55e' },
    { label: 'Aeróbico', color: '#eab308' }, { label: 'Corrida', color: '#ef4444' },
    { label: 'Caminhada', color: '#f97316' }, { label: 'Bike', color: '#a855f7' },
    { label: 'Lutas / Esportes Individuais', color: '#14b8a6' }, { label: 'Esportes Coletivos', color: '#92400e' }
  ];

  const filteredPostsByModalityPeriod = athleteFeedPostsAll.filter(p => selectedModalityPeriod === 'Todos' || (p.created_at || '').includes(selectedModalityPeriod));
  const modalityCountsMap = {};
  allAvailableModalities.forEach(m => { modalityCountsMap[m.label] = 0; });
  filteredPostsByModalityPeriod.forEach(p => {
    const actTypeUpper = (p.activity_type || '').toUpperCase();
    allAvailableModalities.forEach(m => { if (actTypeUpper.includes(m.label.toUpperCase())) modalityCountsMap[m.label]++; });
  });

  const totalModalityExecutions = Object.values(modalityCountsMap).reduce((acc, curr) => acc + curr, 0);
  const modalityPercentagesList = allAvailableModalities.map(m => ({ ...m, count: modalityCountsMap[m.label] || 0, percentage: totalModalityExecutions > 0 ? Math.round((modalityCountsMap[m.label] / totalModalityExecutions) * 100) : 0 }));

  const kmFilteredPosts = athleteFeedPostsAll.filter(p => { const act = (p.activity_type || '').toUpperCase(); return act.includes('CORRIDA') || act.includes('CAMINHADA') || act.includes('BIKE'); });
  const totalKmAccumulated = kmFilteredPosts.reduce((acc, curr) => acc + (parseFloat(curr.distance_km || 0) || 0), 0) + athleteMembershipsAll.reduce((acc, curr) => acc + (curr.totalKm || 0), 0);
  let kmButtonSubtitleText = `${totalKmAccumulated.toFixed(1)} km acumulados`;

  const totalMinutesAccumulated = athleteFeedPostsAll.reduce((acc, curr) => acc + (parseInt(curr.duration_minutes || 0, 10) || 0), 0) + athleteMembershipsAll.reduce((acc, curr) => acc + (curr.activeDays || 0), 0);
  let timeButtonSubtitleText = `${(totalMinutesAccumulated / 60).toFixed(1)} horas registradas`;

  const isThreePhotosGroupActive = ['💪 Musculação', '🏋️ Crossfit / Treino Funcional', '🫀 Treino Aeróbico'].includes(selectedActivity);
  const isKmGroupActive = ['🏃 Corrida', '🚶 Caminhada', '🚴 Bike'].includes(selectedActivity);
  const isStepsActive = selectedActivity === '🚶‍♂️ Passos Diários';

  if (loadingAuth) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e3a8a' }}><ActivityIndicator size="large" color="#f97316" /><Text style={{ color: '#fff', marginTop: 12, fontWeight: 'bold' }}>A carregar MuvFit...</Text></View>;

  if (!session) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1e3a8a' }}>
      <ScrollView contentContainerStyle={{ padding: 24, justifyContent: 'center', flexGrow: 1 }}>
        <Text style={{ fontSize: 36, fontWeight: '900', color: '#f97316', textAlign: 'center' }}>MUVFIT</Text>
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 24 }}>Mizan Soluções Técnicas</Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 5 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center', marginBottom: 16 }}>{isSignUp ? 'Criar Nova Conta' : 'Aceder à Plataforma'}</Text>
          {isSignUp && (
            <>
              <TextInput style={styles.input} placeholder="Nome Completo" value={fullNameInput} onChangeText={setFullNameInput} />
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <TouchableOpacity style={[styles.chipBtn, genderInput === 'Masculino' && styles.chipBtnActive, { flex: 1, alignItems: 'center' }]} onPress={() => setGenderInput('Masculino')}><Text style={[styles.chipText, genderInput === 'Masculino' && styles.chipTextActive]}>Masculino</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.chipBtn, genderInput === 'Feminino' && styles.chipBtnActive, { flex: 1, alignItems: 'center' }]} onPress={() => setGenderInput('Feminino')}><Text style={[styles.chipText, genderInput === 'Feminino' && styles.chipTextActive]}>Feminino</Text></TouchableOpacity>
              </View>
            </>
          )}
          <TextInput style={styles.input} placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" value={emailInput} onChangeText={setEmailInput} />
          <TextInput style={styles.input} placeholder="Palavra-passe" secureTextEntry value={passwordInput} onChangeText={setPasswordInput} />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleAuthAction} disabled={authSubmitting}>{authSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{isSignUp ? 'CADASTRAR CONTA' : 'ENTRAR NO MUVFIT'}</Text>}</TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 14, alignItems: 'center' }} onPress={() => setIsSignUp(!isSignUp)}><Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' }}>{isSignUp ? 'Já tem conta? Faça Login' : 'Não tem conta? Registe-se gratuitamente'}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.container, highContrast && { backgroundColor: '#000' }]}>
      <View style={[styles.topHeader, highContrast && { backgroundColor: '#000', borderBottomWidth: 2, borderBottomColor: '#f97316' }]}>
        <View style={styles.brandRow}>
          <View><Text style={styles.brandTitle}>MUVFIT</Text><Text style={styles.brandSubtitle}>Mizan Soluções Técnicas</Text></View>
          <TouchableOpacity style={{ backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }} onPress={handleSignOut}><Text style={{ color: '#fff', fontSize: 9 * fontSizeScale, fontWeight: 'bold' }}>🚪 SAIR</Text></TouchableOpacity>
        </View>
        {hasUserAnyCommunity && (
          <View style={styles.activeChallengeSelectorBar}>
            <Text style={styles.activeChallengeSelectorLabel}>🎯 Desafio Selecionado:</Text>
            <div style={{ marginBottom: 2 }}>
              <select style={styles.htmlHeaderSelect} value={activeChallengeId || ''} onChange={(e) => { const f = challenges.find(c => c.id === e.target.value); if (f) selectChallengeContext(f, f.creator_id === currentUser.id); }}>
                {challenges.map(c => <option key={c.id} value={c.id}>{c.title} ({c.creator_id === currentUser.id ? '🔑 Admin' : '⚡ Atleta'})</option>)}
              </select>
            </div>
          </View>
        )}
        <View style={{ width: '100%' }}>
          <TextInput style={styles.searchInput} placeholder="🔍 Pesquisar Atletas ou Ligas..." placeholderTextColor="#94a3b8" value={searchQuery} onFocus={() => setIsSearchOpen(true)} onChangeText={(txt) => { setSearchQuery(txt); if (!isSearchOpen) setIsSearchOpen(true); }} />
          {isSearchOpen && (
            <View style={styles.searchResultsDropdown}>
              <View style={styles.searchHeaderTop}><Text style={styles.searchHeaderTitle}>🔎 Pesquisa Geral</Text><TouchableOpacity onPress={() => setIsSearchOpen(false)} style={styles.closeSearchBtn}><Text style={styles.closeSearchText}>✕ FECHAR</Text></TouchableOpacity></View>
              <View style={styles.searchFilterRow}>
                <TouchableOpacity style={[styles.searchFilterChip, searchFilter === 'all' && styles.searchFilterChipActive]} onPress={() => setSearchFilter('all')}><Text style={[styles.searchFilterChipText, searchFilter === 'all' && styles.searchFilterChipTextActive]}>Todos</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.searchFilterChip, searchFilter === 'athlete' && styles.searchFilterChipActive]} onPress={() => setSearchFilter('athlete')}><Text style={[styles.searchFilterChipText, searchFilter === 'athlete' && styles.searchFilterChipTextActive]}>🏃 Atletas</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.searchFilterChip, searchFilter === 'challenge' && styles.searchFilterChipActive]} onPress={() => setSearchFilter('challenge')}><Text style={[styles.searchFilterChipText, searchFilter === 'challenge' && styles.searchFilterChipTextActive]}>🏆 Desafios</Text></TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
                {(searchFilter === 'all' || searchFilter === 'athlete') && searchResultsAthletes.map(a => (
                  <TouchableOpacity key={a.userId} style={styles.searchResultItem} onPress={() => { handleOpenUserProfile(a.userId); setIsSearchOpen(false); setSearchQuery(''); }}>
                    <Image source={{ uri: a.avatar }} style={styles.avatarMini} /><View style={{ marginLeft: 8, flex: 1 }}><Text style={styles.searchResultTitle}>{a.nickname || a.name}</Text><Text style={styles.searchResultSub}>Aceder ao Perfil ➔</Text></View>
                  </TouchableOpacity>
                ))}
                {(searchFilter === 'all' || searchFilter === 'challenge') && searchResultsChallenges.map(ch => {
                  const isM = memberships.some(m => m.challengeId === ch.id && m.userId === currentUser.id);
                  return (
                    <View key={ch.id} style={styles.searchResultItem}>
                      <Text style={{ fontSize: 16, marginRight: 6 }}>🏆</Text>
                      <View style={{ flex: 1 }}><Text style={styles.searchResultTitle}>{ch.title}</Text><Text style={styles.searchResultSub}>Código: {ch.invite_code}</Text></View>
                      {!isM ? <TouchableOpacity style={styles.requestCommunityBtn} onPress={() => handleRequestCommunityEntry(ch)}><Text style={styles.btnMiniText}>Solicitar</Text></TouchableOpacity> : <TouchableOpacity style={styles.alreadyMemberBtn} onPress={() => { selectChallengeContext(ch, ch.creator_id === currentUser.id); setIsSearchOpen(false); setSearchQuery(''); }}><Text style={styles.btnMiniText}>Aceder ➔</Text></TouchableOpacity>}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={[styles.sidebar, highContrast && { backgroundColor: '#111' }]}>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'dashboard' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('dashboard')}><Text style={styles.sidebarIcon}>🏠</Text><Text style={[styles.sidebarText, { fontSize: 9 * fontSizeScale }]}>Painel</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'athlete_center' && styles.sidebarBtnActive]} onPress={() => { setViewedUser(currentUser); setAthletePerfScope('global'); setCurrentScreen('athlete_center'); }}><Text style={styles.sidebarIcon}>👤</Text><Text style={[styles.sidebarText, { fontSize: 9 * fontSizeScale }]}>Atleta</Text></TouchableOpacity>
          {hasUserAnyCommunity && (
            <>
              <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'feed' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('feed')}><Text style={styles.sidebarIcon}>📷</Text><Text style={[styles.sidebarText, { fontSize: 9 * fontSizeScale }]}>Feed</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'ranking' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('ranking')}><Text style={styles.sidebarIcon}>🏆</Text><Text style={[styles.sidebarText, { fontSize: 9 * fontSizeScale }]}>Ranking</Text></TouchableOpacity>
              {(selectedChallenge.creator_id === currentUser.id || adminChallenges.length > 0) && <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'admin' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('admin')}><Text style={styles.sidebarIcon}>⚙️</Text><Text style={[styles.sidebarText, { fontSize: 9 * fontSizeScale }]}>Admin</Text></TouchableOpacity>}
            </>
          )}
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'configuracao_conta' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('configuracao_conta')}><Text style={styles.sidebarIcon}>☰</Text><Text style={[styles.sidebarText, { fontSize: 9 * fontSizeScale }]}>Config</Text></TouchableOpacity>
        </View>

        <View style={[{ flex: 1, backgroundColor: '#fff' }, highContrast && { backgroundColor: '#000' }]}>
          {currentScreen === 'dashboard' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={[styles.pageTitle, { fontSize: 14 * fontSizeScale }, highContrast && { color: '#fff' }]}>Painel Geral de Ligas</Text>
                {currentUser.isAdmin && <TouchableOpacity style={styles.createChallengeBtnHeader} onPress={() => setIsCreateChallengeOpen(true)}><Text style={styles.createChallengeBtnText}>+ NOVO</Text></TouchableOpacity>}
              </View>
              {!hasUserAnyCommunity && <View style={styles.restrictedNoticeBox}><Text style={styles.restrictedNoticeText}>✨ Bem-vindo ao MuvFit! Pesquise uma liga no topo para solicitar entrada.</Text></View>}
              <Text style={styles.sectionHeaderTitle}>🔑 Ligas que Administra</Text>
              {adminChallenges.map(c => (
                <View key={c.id} style={[styles.cardBox, { borderColor: '#f97316', borderWidth: 1.5 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={styles.cardBoxTitle}>{c.title}</Text><Text style={c.is_finished ? styles.tagClosed : styles.tagOpen}>{c.is_finished ? 'ENCERRADO' : 'ABERTO'}</Text></View>
                  <TouchableOpacity style={[styles.primaryBtn, { marginVertical: 6 }]} onPress={() => selectChallengeContext(c, true)}><Text style={styles.primaryBtnText}>ENTRAR COMO ADMIN ➔</Text></TouchableOpacity>
                  <View style={{ flexDirection: 'row', gap: 6 }}><TouchableOpacity style={[styles.dashboardActionBtnGreen, { flex: 1 }]} onPress={() => handleShareInvite(c)}><Text style={styles.dashboardActionBtnText}>CONVIDAR</Text></TouchableOpacity><TouchableOpacity style={[styles.dashboardActionBtnRed, { flex: 1 }]} onPress={() => handleDeleteChallenge(c.id)}><Text style={styles.dashboardActionBtnText}>ELIMINAR</Text></TouchableOpacity></View>
                </View>
              ))}
              <Text style={[styles.sectionHeaderTitle, { marginTop: 16 }]}>⚡ Ligas Participantes</Text>
              {participantChallenges.map(c => (
                <View key={c.id} style={styles.cardBox}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={styles.cardBoxTitle}>{c.title}</Text><Text style={styles.tagOpen}>ABERTO</Text></View>
                  <TouchableOpacity style={[styles.actionBtn, { marginTop: 6 }]} onPress={() => selectChallengeContext(c, false)}><Text style={styles.actionBtnText}>ACEDER À LIGA ➔</Text></TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {currentScreen === 'configuracao_conta' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={[styles.pageTitle, { fontSize: 16 * fontSizeScale }]}>⚙️ Configuração de Conta</Text>
              <View style={[styles.cardBox, highContrast && { backgroundColor: '#111', borderColor: '#f97316' }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {['conta', 'acessibilidade', 'avaliacoes', 'ajuda', 'versao'].map((aba, idx) => (
                      <TouchableOpacity key={aba} style={[styles.searchFilterChip, subAbaConfig === aba && styles.searchFilterChipActive]} onPress={() => setSubAbaConfig(aba)}>
                        <Text style={[styles.searchFilterChipText, subAbaConfig === aba && styles.searchFilterChipTextActive]}>{idx + 1}º {aba.charAt(0).toUpperCase() + aba.slice(1)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {subAbaConfig === 'conta' && (
                  <View>
                    <Text style={styles.inputLabel}>E-mail Cadastrado:</Text><TextInput style={[styles.input, { backgroundColor: '#e2e8f0' }]} editable={false} value={session?.user?.email || ''} />
                    <Text style={styles.inputLabel}>Palavra-passe:</Text><TextInput style={styles.input} placeholder="Nova senha" secureTextEntry value={accountNewPassword} onChangeText={setAccountNewPassword} />
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleChangePassword}><Text style={styles.primaryBtnText}>ATUALIZAR SENHA</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.dashboardActionBtnRed, { marginTop: 12 }]} onPress={handleDeleteAccountConfirmation}><Text style={styles.dashboardActionBtnText}>DELETAR CONTA</Text></TouchableOpacity>
                  </View>
                )}
                {subAbaConfig === 'acessibilidade' && (
                  <View>
                    <Text style={styles.inputLabel}>Contraste e Fonte:</Text>
                    <TouchableOpacity style={styles.checkboxRow} onPress={() => setHighContrast(!highContrast)}><Text style={[styles.checkboxLabel, highContrast && { color: '#fff' }]}>Ativar Alto Contraste</Text></TouchableOpacity>
                  </View>
                )}
                {subAbaConfig === 'avaliacoes' && (
                  <View>
                    <Text style={styles.inputLabel}>Avaliação:</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginVertical: 6, justifyContent: 'center' }}>{[1,2,3,4,5].map(s => <TouchableOpacity key={s} onPress={() => setRatingStars(s)}><Text style={{ fontSize: 24 }}>{s <= ratingStars ? '⭐' : '☆'}</Text></TouchableOpacity>)}</View>
                    <TextInput style={[styles.input, { height: 70 }]} placeholder="Sugestão..." multiline value={feedbackSuggestion} onChangeText={setFeedbackSuggestion} />
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => handleSendEmailRequest("Avaliação MuvFit", feedbackSuggestion)}><Text style={styles.primaryBtnText}>ENVIAR</Text></TouchableOpacity>
                  </View>
                )}
                {subAbaConfig === 'ajuda' && <View><TextInput style={[styles.input, { height: 60 }]} placeholder="Dúvida..." multiline value={helpMessage} onChangeText={setHelpMessage} /><TouchableOpacity style={styles.actionBtn} onPress={() => handleSendEmailRequest("Suporte", helpMessage)}><Text style={styles.actionBtnText}>ENVIAR AO SUPORTE</Text></TouchableOpacity></View>}
                {subAbaConfig === 'versao' && <View style={{ alignItems: 'center', paddingVertical: 12 }}><Text style={{ fontSize: 24, fontWeight: '900', color: '#f97316' }}>MUVFIT</Text><Text style={{ fontSize: 10, color: '#64748b', marginTop: 8 }}>Versão 2.6.0-Nuvem</Text></View>}
              </View>
            </ScrollView>
          )}

          {currentScreen === 'athlete_center' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.profileHeaderCard}>
                <Image source={{ uri: viewedUser.avatar }} style={styles.avatarLarge} />
                <Text style={styles.profileNicknameDisplay}>{viewedUser.nickname || viewedUser.name}</Text>
                <View style={styles.scoreRowContainer}>
                  <View style={styles.scoreBoxItem}><Text style={styles.scoreNumber}>{displayedPerf.rankingPoints.toLocaleString()}</Text><Text style={styles.scoreLabel}>🏆 PTS</Text></View>
                  <View style={styles.scoreBoxItem}><Text style={styles.scoreNumber}>{displayedPerf.totalSteps.toLocaleString()}</Text><Text style={styles.scoreLabel}>🚶 PASSOS</Text></View>
                </View>
              </View>
              <View style={styles.sectionContainerBox}>
                <Text style={styles.sectionHeaderTitle}>Estatísticas</Text>
                <TouchableOpacity style={styles.statsCardItemButton} onPress={() => setIsWeightChartModalOpen(true)}><Text style={styles.statsCardTitle}>📈 Evolução de Peso (kg)</Text></TouchableOpacity>
                <TouchableOpacity style={styles.statsCardItemButton} onPress={() => setIsModalityRadarModalOpen(true)}><Text style={styles.statsCardTitle}>📊 Modalidades</Text></TouchableOpacity>
                <TouchableOpacity style={styles.statsCardItemButton} onPress={() => setIsKmChartModalOpen(true)}><Text style={styles.statsCardTitle}>🚶 KM Total</Text></TouchableOpacity>
                <TouchableOpacity style={styles.statsCardItemButton} onPress={() => setIsTimeChartModalOpen(true)}><Text style={styles.statsCardTitle}>⏱️ Tempo Total</Text></TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {currentScreen === 'feed' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.pageTitle}>Feed — {selectedChallenge.title}</Text>
                <TouchableOpacity style={styles.inviteBtn} onPress={() => handleShareInvite(selectedChallenge)}><Text style={styles.btnMiniText}>🔗 CONVIDAR</Text></TouchableOpacity>
              </View>
              {currentUserMembershipInActiveChallenge?.role === 'active' ? (
                <TouchableOpacity style={styles.actionBtn} onPress={() => setIsWorkoutModalOpen(true)}><Text style={styles.actionBtnText}>+ REGISTRAR NOVO TREINO / PASSOS</Text></TouchableOpacity>
              ) : (
                <View style={styles.restrictedNoticeBox}><Text style={styles.restrictedNoticeText}>🔒 Acompanha como Torcedor. Solicite participação como Atleta Ativo no Ranking!</Text></View>
              )}
              {currentFeedPosts.map(post => (
                <View key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <Image source={{ uri: post.user_avatar }} style={styles.avatarMini} />
                    <View style={{ marginLeft: 8 }}><Text style={styles.postAuthor}>{post.user_nickname || post.user_name}</Text><Text style={styles.postTime}>{post.created_at}</Text></View>
                  </View>
                  <Image source={{ uri: post.photo_evidence }} style={styles.postImg} />
                  <View style={{ padding: 10 }}>
                    <Text style={styles.postCaption}>{post.caption}</Text>
                    <Text style={styles.badgePts}>+{post.points_to_ranking} pts</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {currentScreen === 'ranking' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <Text style={styles.pageTitle}>🏆 Ranking — {selectedChallenge.title}</Text>
                {currentUserMembershipInActiveChallenge?.role !== 'active' && (
                  <TouchableOpacity style={styles.blueRequestAthleteBtn} onPress={handleRequestAthleteActive}><Text style={styles.btnMiniText}>SOLICITAR PARTICIPAÇÃO</Text></TouchableOpacity>
                )}
              </View>
              <View style={styles.topWinnersBannerBox}><Text style={styles.topWinnersBannerTitle}>👑 HALL DA FAMA</Text>{top3Winners.map((w, i) => <Text key={i} style={styles.topWinnersBannerList}>🥇 {w}</Text>)}</View>
              <Text style={styles.sectionHeaderTitle}>⚡ Atletas Ativos</Text>
              {rankedAthletes.map(m => (
                <TouchableOpacity key={m.userId} style={styles.rankingRowCard} onPress={() => handleOpenUserProfile(m.userId)}>
                  <Text style={styles.rankingPosNumber}>{m.rankDisplay}</Text><Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                  <View style={{ flex: 1, marginLeft: 8 }}><Text style={styles.rankingMemberName}>{m.nickname || m.name}</Text></View>
                  <Text style={styles.rankingMemberPts}>{(m.rankingPoints || 0).toLocaleString()} pts</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {currentScreen === 'admin' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>🎯 Central do Administrador: {selectedChallenge.title}</Text>
              </View>

              <View style={styles.accordionCard}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedSec1(!expandedSec1)}><Text style={styles.accordionTitle}>1. APROVAÇÃO DE TREINOS ({currentPendingWorkouts.length})</Text><Text>{expandedSec1 ? '▲' : '▼'}</Text></TouchableOpacity>
                {expandedSec1 && (
                  <View style={styles.accordionBody}>
                    {currentPendingWorkouts.map(w => (
                      <View key={w.id} style={styles.workoutPendingCard}>
                        <Text style={styles.participantName}>{w.user_nickname || w.user_name} - {w.activity_type}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                          <TouchableOpacity style={[styles.approveBtn, { flex: 1, alignItems: 'center' }]} onPress={() => handleApproveWorkout(w.id)}><Text style={styles.btnMiniText}>✅ APROVAR</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.banBtn, { flex: 1, alignItems: 'center' }]} onPress={() => handleRejectWorkout(w.id)}><Text style={styles.btnMiniText}>❌ REJEITAR</Text></TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.accordionCard}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedSec2(!expandedSec2)}><Text style={styles.accordionTitle}>2 & 4. GESTÃO DE MEMBROS E INSCRIÇÕES</Text><Text>{expandedSec2 ? '▲' : '▼'}</Text></TouchableOpacity>
                {expandedSec2 && (
                  <View style={styles.accordionBody}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' }}>Inscrições: {selectedChallenge.registrations_closed ? '🔒 FECHADO' : '🟢 ABERTO'}</Text>
                      <TouchableOpacity style={styles.lockBtn} onPress={() => toggleChallengeRegistrations(selectedChallenge.id)}><Text style={styles.btnMiniText}>{selectedChallenge.registrations_closed ? 'Abrir' : 'Fechar'}</Text></TouchableOpacity>
                    </View>
                    {currentChallengeMembers.map(m => (
                      <View key={m.id} style={styles.participantRow}>
                        <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.participantName}>{m.nickname || m.name}</Text>
                          <Text style={{ fontSize: 9, color: '#64748b' }}>Cargo: {m.role}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          {m.role !== 'active' && <TouchableOpacity style={styles.approveBtn} onPress={() => handleUpdateAthleteStatus(m.id, 'active')}><Text style={styles.btnMiniText}>⚡ Ativar</Text></TouchableOpacity>}
                          {m.role !== 'spectator' && <TouchableOpacity style={styles.spectatorBtn} onPress={() => handleUpdateAthleteStatus(m.id, 'spectator')}><Text style={styles.btnMiniText}>👀 Torcer</Text></TouchableOpacity>}
                          <TouchableOpacity style={styles.banBtn} onPress={() => handleRemoveMemberFromCommunity(m.id)}><Text style={styles.btnMiniText}>🗑️</Text></TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.accordionCard}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedSec3(!expandedSec3)}><Text style={styles.accordionTitle}>3. LANÇAMENTO MANUAL DE PONTOS</Text><Text>{expandedSec3 ? '▲' : '▼'}</Text></TouchableOpacity>
                {expandedSec3 && (
                  <View style={styles.accordionBody}>
                    <TextInput style={styles.input} placeholder="Pontos Ranking" keyboardType="numeric" value={manualRankingPts} onChangeText={setManualRankingPts} />
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleManualPointsSubmit}><Text style={styles.primaryBtnText}>CREDITAR</Text></TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.accordionCard}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedSec5(!expandedSec5)}><Text style={styles.accordionTitle}>5. REGRAS AVANÇADAS</Text><Text>{expandedSec5 ? '▲' : '▼'}</Text></TouchableOpacity>
                {expandedSec5 && (
                  <View style={styles.accordionBody}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setIsAdvancedRulesModalOpen(true)}><Text style={styles.actionBtnText}>⚙️ EDITAR REGRAS DA LIGA</Text></TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      <Modal visible={isWeightChartModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 6, marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#c2410c' }}>Gráfico de Peso</Text>
              <TouchableOpacity onPress={() => setIsWeightChartModalOpen(false)}><Text style={{ fontSize: 16, fontWeight: 'bold' }}>✕</Text></TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <View style={{ flex: 1, borderWidth: 1.5, borderColor: '#f97316', borderRadius: 8, padding: 8, backgroundColor: '#fff7ed' }}>
                <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#c2410c', textAlign: 'center' }}>Novo Registo (kg)</Text>
                <input type="number" step="0.1" placeholder="78.2" value={newWeightValueInput} onChange={(e) => setNewWeightValueInput(e.target.value)} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#1e3a8a', outline: 'none' }} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
<Modal visible={isWeightChartModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 6, marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#c2410c' }}>Gráfico de Peso</Text>
              <TouchableOpacity onPress={() => setIsWeightChartModalOpen(false)}><Text style={{ fontSize: 16, fontWeight: 'bold' }}>✕</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsDeleteModeActive(!isDeleteModeActive)}>
              <div style={{ width: '16px', height: '16px', border: '1.5px solid #dc2626', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isDeleteModeActive ? '#dc2626' : '#ffffff' }}>
                {isDeleteModeActive && <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
              </div>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#dc2626' }}>Apagar dados de peso</Text>
            </TouchableOpacity>
            <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10 }}>
              <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', borderBottom: '1px solid #cbd5e1', borderLeft: '1px solid #cbd5e1', paddingBottom: '10px' }}>
                {weightHistoryList.length === 0 ? (
                  <Text style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' }}>Nenhum dado de peso inserido.</Text>
                ) : (
                  weightHistoryList.map((item) => (
                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1 }}>
                      {isDeleteModeActive && (
                        <TouchableOpacity style={{ position: 'absolute', top: -22, backgroundColor: '#dc2626', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', zIndex: 5 }} onPress={() => {
                          const updatedList = weightHistoryList.filter(w => w.id !== item.id);
                          setWeightHistoryList(updatedList);
                          const safeTarget = targetWeightValue.trim() === '' ? null : parseFloat(targetWeightValue);
                          saveWeightDataToSupabase(updatedList, isNaN(safeTarget) ? null : safeTarget);
                        }}>
                          <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold', lineHeight: 10 }}>-</Text>
                        </TouchableOpacity>
                      )}
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#f97316', marginBottom: '4px' }}>{item.weight}</span>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316', border: '2px solid #ffffff', boxShadow: '0 0 0 1px #f97316' }}></div>
                      <span style={{ fontSize: '8px', color: '#64748b', position: 'absolute', bottom: '-16px' }}>{item.period}</span>
                    </div>
                  ))
                )}
              </div>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' }}>Meta: {targetWeightValue || '0.0'} kg</Text>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#16a34a' }}>Atual: {weightHistoryList.length > 0 ? `${weightHistoryList[weightHistoryList.length - 1].weight} kg` : '0.0 kg'}</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={async () => {
              if (newWeightValueInput.trim()) {
                const wNum = parseFloat(newWeightValueInput) || 0;
                const updatedList = [...weightHistoryList, { id: `w_${Date.now()}`, period: newWeightDateInput || 'Hoje', weight: wNum }];
                setWeightHistoryList(updatedList);
                setNewWeightValueInput('');
                const safeTarget = targetWeightValue.trim() === '' ? null : parseFloat(targetWeightValue);
                await saveWeightDataToSupabase(updatedList, isNaN(safeTarget) ? null : safeTarget);
                Alert.alert('Sucesso', 'Registo de peso adicionado!');
              }
            }}>
              <Text style={styles.primaryBtnText}>ADICIONAR REGISTO AO GRÁFICO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cancelBtn, { marginTop: 6 }]} onPress={() => setIsWeightChartModalOpen(false)}><Text style={styles.cancelBtnText}>FECHAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isModalityRadarModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 6 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#c2410c' }}>Resumo de Exercícios</Text>
              <TouchableOpacity onPress={() => setIsModalityRadarModalOpen(false)}><Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' }}>✕</Text></TouchableOpacity>
            </View>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#c2410c', marginBottom: 4 }}>Selecione o Período</Text>
              <select style={styles.htmlNativeSelect} value={selectedModalityPeriod} onChange={(e) => setSelectedModalityPeriod(e.target.value)}>
                {availablePeriodsList.map(periodOpt => <option key={periodOpt} value={periodOpt}>{periodOpt === 'Todos' ? '🌐 Todos (Somatório Geral)' : periodOpt}</option>)}
              </select>
            </View>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center', marginBottom: 8 }}>Distribuição de Práticas</Text>
            <View style={{ backgroundColor: '#ffffff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: totalModalityExecutions === 0 ? '#e2e8f0' : `conic-gradient(${modalityPercentagesList.reduce((acc, curr, idx, arr) => {
                const prevSum = arr.slice(0, idx).reduce((s, prev) => s + prev.percentage, 0);
                return `${acc}${curr.color} ${prevSum}\%${prevSum + curr.percentage}%,`;
              }, '').slice(0, -1)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                {totalModalityExecutions === 0 && <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold' }}>0% (Sem treinos)</span>}
              </div>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 4 }}>
                {modalityPercentagesList.map((modItem) => (
                  <View key={modItem.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, width: '46%' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: modItem.color }}></div>
                    <Text style={styles.checkboxLabel} numberOfLines={1}>{modItem.label} ({modItem.percentage}%)</Text>
                  </View>
                ))}
              </View>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsModalityRadarModalOpen(false)}><Text style={styles.primaryBtnText}>FECHAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isKmChartModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 6 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#c2410c' }}>Distância Percorrida</Text>
              <TouchableOpacity onPress={() => setIsKmChartModalOpen(false)}><Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' }}>✕</Text></TouchableOpacity>
            </View>
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#c2410c', marginBottom: 4 }}>Filtrar Atividade</Text>
              <select style={styles.htmlNativeSelect} value={selectedKmFilterActivity} onChange={(e) => setSelectedKmFilterActivity(e.target.value)}>
                <option value="Todos">👥 Todos</option><option value="Corrida">🏃 Corrida</option><option value="Caminhada">🚶 Caminhada</option><option value="Bike">🚴 Bike</option>
              </select>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsKmChartModalOpen(false)}><Text style={styles.primaryBtnText}>FECHAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isTimeChartModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 6 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#c2410c' }}>Tempo de Atividade</Text>
              <TouchableOpacity onPress={() => setIsTimeChartModalOpen(false)}><Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' }}>✕</Text></TouchableOpacity>
            </View>
            <View style={{ backgroundColor: '#e0f2fe', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#38bdf8', marginBottom: 10, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0369a1' }}>Tempo total: {totalHoursAccumulated} horas ({totalMinutesAccumulated} minutos)</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsTimeChartModalOpen(false)}><Text style={styles.primaryBtnText}>FECHAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isAllEvidencesModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>📸 Histórico Completo de Evidências</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {athleteFeedPostsAll.length === 0 ? <Text style={styles.emptyNoticeText}>Nenhuma evidência registada.</Text> : athleteFeedPostsAll.map(post => (
                <View key={post.id} style={{ marginBottom: 12, backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' }}>
                  <Image source={{ uri: post.photo_evidence }} style={{ width: '100%', height: 180, borderRadius: 6, marginBottom: 4 }} />
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' }}>{post.activity_type}</Text>
                  <Text style={{ fontSize: 10, color: '#334155' }}>{post.caption}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 10 }]} onPress={() => setIsAllEvidencesModalOpen(false)}><Text style={styles.primaryBtnText}>FECHAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isAdvancedRulesModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>⚙️ Configuração Avançada de Pontos</Text>
            <ScrollView style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.inputLabel}>1 - Selecione o Desafio:</Text>
              <select style={styles.htmlNativeSelect} value={selectedConfigChallengeId || ''} onChange={(e) => setSelectedConfigChallengeId(e.target.value)}>
                {adminChallenges.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <Text style={styles.inputLabel}>2 - Selecione a Categoria:</Text>
              <select style={styles.htmlNativeSelect} value={selectedConfigActivity} onChange={(e) => setSelectedConfigActivity(e.target.value)}>
                {modalitiesList.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleSaveAdvancedRules}><Text style={styles.primaryBtnText}>SALVAR REGRAS</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { flex: 1, justifyContent: 'center' }]} onPress={() => setIsAdvancedRulesModalOpen(false)}><Text style={styles.cancelBtnText}>CANCELAR</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isEditProfileOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Editar Perfil do Atleta</Text>
            <TextInput style={styles.input} placeholder="Nome Completo" value={editFullName} onChangeText={setEditFullName} />
            <TextInput style={styles.input} placeholder="Apelido Público" value={editNickname} onChangeText={setEditNickname} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>SALVAR ALTERAÇÕES</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditProfileOpen(false)}><Text style={styles.cancelBtnText}>CANCELAR</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={isCreateChallengeOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>🏆 Criar Novo Desafio / Liga</Text>
            <TextInput style={styles.input} placeholder="Nome do Desafio" value={newChallengeTitle} onChangeText={setNewChallengeTitle} />
            <TextInput style={styles.input} placeholder="Código de Convite" autoCapitalize="characters" value={newChallengeCode} onChangeText={setNewChallengeCode} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateChallenge}><Text style={styles.primaryBtnText}>CRIAR E SALVAR</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreateChallengeOpen(false)}><Text style={styles.cancelBtnText}>CANCELAR</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={isWorkoutModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={{ width: '100%', maxHeight: 540 }} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Registar Treino ({selectedChallenge?.title || 'MuvFit'})</Text>
              <select style={styles.htmlNativeSelect} value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)}>
                {modalitiesList.filter(m => m.value !== '🎁 Bônus e Critérios de Desempate' && m.value !== '🏛️ Base da Liga').map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <TextInput style={[styles.input, { height: 60, marginTop: 8 }]} placeholder="Legenda / Comentário..." multiline value={workoutCaption} onChangeText={setWorkoutCaption} />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitWorkout}><Text style={styles.primaryBtnText}>ENVIAR PARA APROVAÇÃO</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsWorkoutModalOpen(false)}><Text style={styles.cancelBtnText}>CANCELAR</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  topHeader: { padding: 12, backgroundColor: '#1e3a8a', position: 'relative', zIndex: 10 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  brandTitle: { fontSize: 20, fontWeight: '900', color: '#f97316' },
  brandSubtitle: { fontSize: 10, fontWeight: 'bold', color: '#ffffff' },
  activeChallengeSelectorBar: { backgroundColor: '#172554', padding: 6, borderRadius: 6, marginBottom: 6 },
  activeChallengeSelectorLabel: { fontSize: 9, color: '#f97316', fontWeight: 'bold', marginBottom: 2 },
  htmlHeaderSelect: { width: '100%', padding: 8, fontSize: 10, fontWeight: 'bold', color: '#1e3a8a', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' },
  searchInput: { backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 8 : 4, fontSize: 11, color: '#0f172a', borderWidth: 1, borderColor: '#cbd5e1' },
  searchResultsDropdown: { position: 'absolute', top: 40, left: 0, right: 0, backgroundColor: '#ffffff', borderRadius: 8, padding: 10, borderWidth: 2, borderColor: '#f97316', elevation: 10, zIndex: 9999 },
  searchHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
  searchHeaderTitle: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' },
  closeSearchBtn: { backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  closeSearchText: { fontSize: 8, color: '#dc2626', fontWeight: 'bold' },
  searchFilterRow: { flexDirection: 'row', gap: 6, marginBottom: 8, paddingBottom: 6 },
  searchFilterChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  searchFilterChipActive: { backgroundColor: '#1e3a8a' },
  searchFilterChipText: { fontSize: 9, fontWeight: 'bold', color: '#475569' },
  searchFilterChipTextActive: { color: '#ffffff' },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#ffffff', borderRadius: 4, marginBottom: 2 },
  searchResultTitle: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },
  searchResultSub: { fontSize: 8, color: '#64748b' },
  requestCommunityBtn: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4 },
  alreadyMemberBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4 },
  blueRequestAthleteBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  topWinnersBannerBox: { backgroundColor: '#fef3c7', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#d97706', marginBottom: 10 },
  topWinnersBannerTitle: { fontSize: 10, fontWeight: '900', color: '#b45309', marginBottom: 2 },
  topWinnersBannerList: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a', marginTop: 2 },
  sidebar: { width: 110, backgroundColor: '#f8fafc', borderRightWidth: 1, borderRightColor: '#cbd5e1', paddingVertical: 10 },
  sidebarBtn: { paddingVertical: 12, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  sidebarBtnActive: { backgroundColor: '#ffffff', borderLeftWidth: 4, borderLeftColor: '#f97316' },
  sidebarIcon: { fontSize: 12 },
  sidebarText: { fontSize: 9, fontWeight: 'bold', color: '#64748b' },
  mainContent: { padding: 12 },
  pageTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginVertical: 8 },
  sectionHeaderTitle: { fontSize: 12, fontWeight: 'bold', color: '#f97316', marginVertical: 6 },
  emptyNoticeText: { fontSize: 10, color: '#94a3b8', fontStyle: 'italic', marginBottom: 8 },
  createChallengeBtnHeader: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  createChallengeBtnText: { color: '#ffffff', fontSize: 9, fontWeight: 'bold' },
  cardBox: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  cardBoxTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  tagOpen: { backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: 9, fontWeight: 'bold', padding: 4, borderRadius: 4 },
  tagClosed: { backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 9, fontWeight: 'bold', padding: 4, borderRadius: 4 },
  dashboardActionBtnGreen: { backgroundColor: '#16a34a', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  dashboardActionBtnRed: { backgroundColor: '#dc2626', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  dashboardActionBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  adminControlCard: { backgroundColor: '#fff7ed', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#f97316', marginBottom: 12 },
  accordionCard: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1.5, borderColor: '#cbd5e1', marginBottom: 10, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  accordionTitle: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', flex: 1 },
  accordionBody: { padding: 12, backgroundColor: '#ffffff' },
  workoutPendingCard: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  participantRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#fed7aa', marginTop: 6 },
  participantName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  htmlNativeSelect: { width: '100%', padding: 10, fontSize: 11, fontWeight: 'bold', color: '#0f172a', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' },
  lockBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4 },
  spectatorBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  approveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  banBtn: { backgroundColor: '#dc2626', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  inviteBtn: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, justifyContent: 'center' },
  btnMiniText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },
  rankingRowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6 },
  rankingPosNumber: { fontSize: 14, fontWeight: '900', color: '#f97316', width: 32 },
  rankingMemberName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  rankingMemberPts: { fontSize: 12, fontWeight: 'bold', color: '#16a34a' },
  primaryBtn: { backgroundColor: '#f97316', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  actionBtn: { backgroundColor: '#1e3a8a', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginBottom: 12 },
  actionBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  restrictedNoticeBox: { backgroundColor: '#eff6ff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#1e3a8a', marginBottom: 12 },
  restrictedNoticeText: { fontSize: 10, color: '#1e3a8a', fontWeight: 'bold' },
  postCard: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 12, overflow: 'hidden' },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#f8fafc' },
  avatarMini: { width: 32, height: 32, borderRadius: 16 },
  postAuthor: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  postTime: { fontSize: 9, color: '#64748b' },
  postImg: { width: '100%', height: 180 },
  postCaption: { fontSize: 11, color: '#334155', marginBottom: 4 },
  badgePts: { backgroundColor: '#fff7ed', color: '#c2410c', fontSize: 9, fontWeight: 'bold', padding: 4, borderRadius: 4, alignSelf: 'flex-start' },
  profileHeaderCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', position: 'relative', marginBottom: 10 },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, marginBottom: 6, borderWidth: 2, borderColor: '#f97316' },
  profileNicknameDisplay: { fontSize: 16, fontWeight: '900', color: '#1e3a8a', marginBottom: 2 },
  scoreRowContainer: { flexDirection: 'row', gap: 8, width: '100%', marginVertical: 8, justifyContent: 'center' },
  scoreBoxItem: { flex: 1, backgroundColor: '#ffffff', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  scoreNumber: { fontSize: 14, fontWeight: '900', color: '#f97316' },
  scoreLabel: { fontSize: 8, fontWeight: 'bold', color: '#1e3a8a', marginTop: 2 },
  sectionContainerBox: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  statsCardItemButton: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 14 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, maxHeight: '90%' },
  modalContentLarge: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, maxHeight: '95%', width: '95%', alignSelf: 'center' },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 10, textAlign: 'center' },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#475569', marginVertical: 4 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 6, fontSize: 11, marginBottom: 6 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 8 },
  checkboxLabel: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },
  cancelBtn: { marginTop: 6, paddingVertical: 4, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' }
});
