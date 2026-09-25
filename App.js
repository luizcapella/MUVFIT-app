import { supabase } from './supabaseClient';
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Image, Modal, Alert, Share, Platform, ActivityIndicator, Linking
} from 'react-native';
import { styles } from './styles';

function calculateAge(birthDateString) {
  if (!birthDateString || birthDateString.length < 10) return null;
  const parts = birthDateString.split('/');
  if (parts.length !== 3) return null;
  const birthDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return isNaN(age) ? null : age;
}

function formatDateBR(dateObj) {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return `${d}/${m}/${y}`;
}

function calculateSeasonDates(periodType, isRenewal = false, referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  let startDateObj = new Date(referenceDate);
  let endDateObj = new Date(referenceDate);

  if (periodType === 'Weekly') {
    if (isRenewal) startDateObj.setDate(referenceDate.getDate() - referenceDate.getDay());
    endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + (6 - startDateObj.getDay()));
  } else if (periodType === 'Yearly') {
    if (isRenewal) startDateObj = new Date(year, 0, 1);
    endDateObj = new Date(year, 11, 31);
  } else {
    if (isRenewal) startDateObj = new Date(year, month, 1);
    endDateObj = new Date(year, month + 1, 0);
  }
  return { startDateStr: formatDateBR(startDateObj), endDateStr: formatDateBR(endDateObj), startDateObj, endDateObj };
}

function getChampionTitle(goldCount) {
  if (goldCount <= 0) return '';
  if (goldCount === 1) return 'Campeão';
  if (goldCount === 2) return 'Bi-campeão';
  if (goldCount === 3) return 'Tri-campeão';
  if (goldCount === 4) return 'Tetra-campeão';
  if (goldCount === 5) return 'Penta-campeão';
  if (goldCount === 6) return 'Hexa-campeão';
  return `${goldCount}x Campeão`;
}

// FUNÇÃO GENÉRICA UNIFICADA PARA CÁLCULO DE PONTUAÇÕES DE MODALIDADES (Removeu código repetido)
const calculateGenericWorkoutPoints = (config, durationMins, kmDistance) => {
  if (!config || config.enabled === false) return 0;
  let pts = 0;
  const mode = config.scoringMode || 'simple';

  if (mode === 'simple') {
    const reqMin = parseFloat(config.simplePerMin) || 0;
    const awardPts = parseFloat(config.simplePts) || 0;
    if (reqMin > 0 && durationMins >= reqMin) pts = awardPts;
  } else if (mode === 'timeSteps') {
    for (let st of (config.timeSteps || [])) {
      const minT = parseFloat(st.minTime) || 0;
      const maxT = st.modeType === 'Acima' ? Infinity : (parseFloat(st.maxTime) || Infinity);
      if (durationMins >= minT && durationMins <= maxT) { pts = parseFloat(st.pts) || 0; break; }
    }
  } else if (mode === 'kmSimple') {
    const reqKm = parseFloat(config.kmPerX) || 0;
    const awardPts = parseFloat(config.kmSimplePts) || 0;
    if (reqKm > 0 && kmDistance >= reqKm) pts = awardPts;
  } else if (mode === 'kmSteps') {
    for (let st of (config.kmSteps || [])) {
      const minK = parseFloat(st.minKm) || 0;
      const maxK = st.modeType === 'Acima' ? Infinity : (parseFloat(st.maxKm) || Infinity);
      if (kmDistance >= minK && kmDistance <= maxK) { pts = parseFloat(st.pts) || 0; break; }
    }
  }
  return pts;
};

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
  const [athleteStories, setAthleteStories] = useState([]);
  const [activeStoryView, setActiveStoryView] = useState(null);

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
    id: '', name: '', nickname: '', birth_date: '', age: 0, gender: 'Masculino', avatar: 'https://picsum.photos/seed/poke/200/200', isAdmin: true, goldMedals: 0, silverMedals: 0, bronzeMedals: 0
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
  const [, setIsAdminContext] = useState(true);

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0] || {};
  const [commentInputs, setCommentInputs] = useState({});

  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('💪 Musculação');

  const getTodayISO = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
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
  const [expandedSec5, setExpandedSec5] = useState(false);

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
    inquebravelEnabled: true, inquebravelDays: '3', inquebravelPts: '5000', despertaEnabled: true, despertaLimitTime: '08:00', despertaPts: '3000'
  });

  const defaultModalityRule = { enabled: true, scoringMode: 'simple', simplePts: '10000', simplePerMin: '60', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }] };
  const [modalitySettings, setModalitySettings] = useState({
    '💪 Musculação': defaultModalityRule,
    '🏋️ Crossfit / Treino Funcional': defaultModalityRule,
    '🫀 Treino Aeróbico': defaultModalityRule,
    '⚽ Esportes Coletivos': defaultModalityRule,
    '🥋 Lutas / Esportes Individuais': defaultModalityRule,
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

  const hoursArray = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const formatBirthDateMask = (text) => {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    if (cleaned.length >= 5) cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
    else if (cleaned.length >= 3) cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) { fetchUserProfile(session.user.id, session.user.email); fetchDataFromSupabase(); }
      setLoadingAuth(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) { fetchUserProfile(session.user.id, session.user.email); fetchDataFromSupabase(); }
      else { setCurrentUser({ id: '', name: '', nickname: '' }); }
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
            const parsedWeights = typeof data.weight_history === 'string' ? JSON.parse(data.weight_history) : data.weight_history;
            if (Array.isArray(parsedWeights)) setWeightHistoryList(parsedWeights);
          } catch (e) { console.log('Erro weight_history:', e); }
        }
        if (data.target_weight != null) setTargetWeightValue(String(data.target_weight));

        const loadedUser = {
          id: data.id, name: data.full_name || userEmail.split('@')[0], nickname: data.nickname || data.full_name || userEmail.split('@')[0],
          birth_date: formattedDate, age: computedAge, gender: data.gender || 'Masculino', avatar: data.avatar_url || `https://picsum.photos/seed/${data.id}/200/200`,
          isAdmin: true, goldMedals: data.gold_medals || 0, silverMedals: data.silver_medals || 0, bronzeMedals: data.bronze_medals || 0
        };
        setCurrentUser(loadedUser); setViewedUser(loadedUser);
      } else {
        const fallbackName = userEmail ? userEmail.split('@')[0] : 'Atleta';
        const loadedUser = { id: userId, name: fallbackName, nickname: fallbackName, birth_date: '', age: 0, gender: 'Masculino', avatar: `https://picsum.photos/seed/${userId}/200/200`, isAdmin: true, goldMedals: 0, silverMedals: 0, bronzeMedals: 0 };
        setCurrentUser(loadedUser); setViewedUser(loadedUser);
      }
    } catch (err) { console.log('Erro perfil:', err); }
  }

  async function saveWeightDataToSupabase(updatedList, newTarget) {
    if (!currentUser.id) return;
    try {
      const targetVal = (newTarget === '' || isNaN(newTarget)) ? null : parseFloat(newTarget);
      await supabase.from('profiles').update({ weight_history: updatedList, target_weight: targetVal }).eq('id', currentUser.id);
    } catch (err) { console.log('Erro peso:', err); }
  }

  async function handleAuthAction() {
    if (!emailInput.trim() || !passwordInput.trim()) { Alert.alert('Atenção', 'Preencha E-mail e Senha.'); return; }
    setAuthSubmitting(true);
    try {
      if (isSignUp) {
        if (!fullNameInput.trim()) { Alert.alert('Obrigatório', 'Preencha o Nome Completo.'); setAuthSubmitting(false); return; }
        const cleanName = fullNameInput.trim();
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailInput.trim(), password: passwordInput.trim(), options: { data: { full_name: cleanName, nickname: cleanName, gender: genderInput } }
        });
        if (authError) { Alert.alert('Erro no Cadastro', authError.message); setAuthSubmitting(false); return; }
        if (authData?.session) { setSession(authData.session); await fetchUserProfile(authData.session.user.id, authData.session.user.email); await fetchDataFromSupabase(); setAuthSubmitting(false); return; }
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: emailInput.trim(), password: passwordInput.trim() });
      if (error) { Alert.alert('Erro no Login', error.message.includes('Invalid login') ? 'E-mail ou senha incorretos.' : error.message); }
      else if (data.session) { setSession(data.session); await fetchUserProfile(data.session.user.id, data.session.user.email); await fetchDataFromSupabase(); }
    } catch (err) { Alert.alert('Erro', err.message || 'Erro de conexão.'); } finally { setAuthSubmitting(false); }
  }

  function handleOpenEditProfile() {
    setEditFullName(currentUser.name || ''); setEditNickname(currentUser.nickname || ''); setEditBirthDate(currentUser.birth_date || ''); setEditGender(currentUser.gender || 'Masculino'); setEditAvatar(currentUser.avatar || '');
    setIsEditProfileOpen(true);
  }

  async function handleSaveProfile() {
    if (!editNickname.trim() || !editFullName.trim()) { Alert.alert('Atenção', 'Nome e Apelido não podem ficar vazios.'); return; }
    setSavingProfile(true);
    try {
      let finalAvatarUrl = editAvatar;
      if (editAvatar && editAvatar.startsWith('data:image')) {
        const fileExt = editAvatar.substring('data:image/'.length, editAvatar.indexOf(';base64')) || 'jpeg';
        const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
        const response = await fetch(editAvatar);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, blob, { contentType: `image/${fileExt}`, upsert: true });
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          finalAvatarUrl = publicUrlData.publicUrl;
        }
      }
      let dbBirthDate = null; let computedAge = 0;
      if (editBirthDate && editBirthDate.length === 10) {
        const parts = editBirthDate.split('/');
        if (parts.length === 3) { dbBirthDate = `${parts[2]}-${parts[1]}-${parts[0]}`; computedAge = calculateAge(editBirthDate) || 0; }
      }
      const profilePayload = { id: currentUser.id, full_name: editFullName.trim(), nickname: editNickname.trim(), gender: editGender, avatar_url: finalAvatarUrl };
      if (dbBirthDate) profilePayload.birth_date = dbBirthDate;

      await supabase.from('profiles').upsert([profilePayload], { onConflict: 'id' });
      await supabase.from('memberships').update({ name: editFullName.trim(), nickname: editNickname.trim(), avatar: finalAvatarUrl, age: computedAge, gender: editGender }).eq('user_id', currentUser.id);

      const updatedUser = { ...currentUser, name: editFullName.trim(), nickname: editNickname.trim(), birth_date: editBirthDate, age: computedAge, gender: editGender, avatar: finalAvatarUrl };
      setCurrentUser(updatedUser); setViewedUser(updatedUser); setIsEditProfileOpen(false);
      await fetchDataFromSupabase();
      Alert.alert('Sucesso', 'Perfil atualizado!');
    } catch (err) { Alert.alert('Erro', err.message); } finally { setSavingProfile(false); }
  }

  async function handleSignOut() { await supabase.auth.signOut(); setSession(null); }

  async function handleChangePassword() {
    if (!accountNewPassword.trim()) { Alert.alert('Atenção', 'Digite a nova senha.'); return; }
    const { error } = await supabase.auth.updateUser({ password: accountNewPassword });
    if (error) Alert.alert('Erro', error.message); else { Alert.alert('Sucesso', 'Senha alterada!'); setAccountNewPassword(''); }
  }

  function handleDeleteAccountConfirmation() {
    Alert.alert("Desativar Conta", "Tem certeza que deseja desativar ou deletar sua conta?", [
      { text: "NÃO", style: "cancel" },
      { text: "SIM", style: "destructive", onPress: () => { handleSignOut(); } }
    ]);
  }

  function handleSendEmailRequest(subject, bodyText) {
    const mailtoUrl = `mailto:muvfit.mizansolucoes@outlook.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
    if (Platform.OS === 'web') window.open(mailtoUrl, '_blank');
    else Linking.openURL(mailtoUrl).catch(() => Alert.alert('Erro', 'Não foi possível abrir o e-mail.'));
  }

  async function fetchDataFromSupabase() {
    try {
      const { data: challengesData } = await supabase.from('challenges').select('*');
      if (challengesData && challengesData.length > 0) {
        const formattedChallenges = challengesData.map(c => ({ ...c, startDate: c.start_date, endDate: c.end_date, tiebreakerEnabled: c.tiebreaker_enabled }));
        setChallenges(formattedChallenges);
        const currentSelectedId = activeChallengeId || formattedChallenges[0].id;
        if (!activeChallengeId) setActiveChallengeId(formattedChallenges[0].id);
        if (!selectedConfigChallengeId) setSelectedConfigChallengeId(formattedChallenges[0].id);
        const activeCh = formattedChallenges.find(c => c.id === currentSelectedId) || formattedChallenges[0];
        if (activeCh && activeCh.rules_config) {
          if (activeCh.rules_config.modalitySettings) setModalitySettings(activeCh.rules_config.modalitySettings);
          if (activeCh.rules_config.bonusConfig) setBonusConfig(activeCh.rules_config.bonusConfig);
          if (activeCh.rules_config.dailyStepsConfig) setDailyStepsConfig(activeCh.rules_config.dailyStepsConfig);
          if (activeCh.rules_config.tiebreakers) setTiebreakers(activeCh.rules_config.tiebreakers);
          if (activeCh.rules_config.leaguePeriod) setLeaguePeriod(activeCh.rules_config.leaguePeriod);
        }
      } else { setChallenges([]); setActiveChallengeId(null); }

      const { data: membersData } = await supabase.from('memberships').select('*');
      if (membersData) {
        setMemberships(membersData.map(m => ({
          ...m, challengeId: m.challenge_id, userId: m.user_id, rankingPoints: m.ranking_points || 0, bankPoints: m.bank_points || 0, totalSteps: m.total_steps || 0, totalKm: m.total_km || 0, activeDays: m.active_days || 0
        })));
      }
      const { data: feedData } = await supabase.from('feed_posts').select('*');
      if (feedData) setFeedPosts(feedData);
      const { data: pendingData } = await supabase.from('pending_workouts').select('*');
      if (pendingData) setPendingWorkouts(pendingData);
    } catch (err) { console.log('Erro fetch:', err); }
  }

  const userMembershipsAll = memberships.filter(m => m.userId === currentUser.id);
  const adminChallenges = challenges.filter(c => c.creator_id === currentUser.id);
  const participantChallenges = challenges.filter(c => memberships.some(m => m.challengeId === c.id && m.userId === currentUser.id) && c.creator_id !== currentUser.id);
  const currentUserMembershipInActiveChallenge = memberships.find(m => m.challengeId === activeChallengeId && m.userId === currentUser.id);
  const hasUserAnyCommunity = userMembershipsAll.length > 0 || adminChallenges.length > 0;

  const handleShareInvite = async (challenge) => {
    const inviteUrl = `https://muvfit.vercel.app/convite?codigo=${challenge.invite_code}`;
    try { await Share.share({ message: `Convite MuvFit: Participe da liga ${challenge.title}! Acesse: ${inviteUrl}`, url: inviteUrl, title: `Convite ${challenge.title}` }); } catch (e) { Alert.alert('Erro', 'Não foi possível partilhar.'); }
  };

  function selectChallengeContext(challenge, asAdmin) {
    setActiveChallengeId(challenge.id); setIsAdminContext(asAdmin);
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
    setViewedUser(found ? found : currentUser);
    setAthletePerfScope('global'); setCurrentScreen('athlete_center');
  }

  async function handleRequestCommunityEntry(challenge) {
    const existing = memberships.find(m => m.challengeId === challenge.id && m.userId === currentUser.id);
    if (existing) { Alert.alert('Atenção', 'Já possui solicitação ou inscrição.'); return; }
    await supabase.from('memberships').insert([{ challenge_id: challenge.id, user_id: currentUser.id, name: currentUser.name, nickname: currentUser.nickname, role: 'pending_community', avatar: currentUser.avatar, age: currentUser.age, gender: currentUser.gender }]);
    fetchDataFromSupabase(); setIsSearchOpen(false); setSearchQuery('');
    Alert.alert('Solicitação Enviada', `Pedido para entrar em ${challenge.title} enviado ao Administrador.`);
  }

  async function handleRequestAthleteActive() {
    if (!activeChallengeId || !selectedChallenge?.id) return;
    try {
      const { data: existingMember } = await supabase.from('memberships').select('id, role').eq('challenge_id', selectedChallenge.id).eq('user_id', currentUser.id).maybeSingle();
      const payload = { role: 'pending_athlete', name: currentUser.name, nickname: currentUser.nickname, avatar: currentUser.avatar, age: currentUser.age || 0, gender: currentUser.gender || 'Masculino' };
      if (existingMember?.id) await supabase.from('memberships').update(payload).eq('id', existingMember.id);
      else await supabase.from('memberships').insert([{ challenge_id: selectedChallenge.id, user_id: currentUser.id, ...payload, ranking_points: 0, bank_points: 0, total_steps: 0 }]);
      await fetchDataFromSupabase();
      Alert.alert('Pendente', 'Sua solicitação de Atleta Ativo foi enviada.');
    } catch (err) { Alert.alert('Erro', err.message); }
  }

  async function handleToggleLike(postId) {
    const post = feedPosts.find(p => p.id === postId);
    if (!post) return;
    const updatedLikes = post.isLiked ? post.likes - 1 : post.likes + 1;
    const isLiked = !post.isLiked;
    setFeedPosts(feedPosts.map(p => p.id === postId ? { ...p, likes: updatedLikes, isLiked } : p));
    await supabase.from('feed_posts').update({ likes: updatedLikes }).eq('id', postId);
  }

  async function handleAddComment(postId) {
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;
    const post = feedPosts.find(p => p.id === postId);
    if (!post) return;
    const newComments = [...(post.comments || []), { id: `c_${Date.now()}`, user: currentUser.nickname, text: commentText.trim() }];
    setFeedPosts(feedPosts.map(p => p.id === postId ? { ...p, comments: newComments } : p));
    setCommentInputs({ ...commentInputs, [postId]: '' });
    await supabase.from('feed_posts').update({ comments: newComments }).eq('id', postId);
  }

  async function handleCreateChallenge() {
    if (!newChallengeTitle.trim() || !newChallengeCode.trim()) { Alert.alert('Erro', 'Preencha o Nome e Código.'); return; }
    const newId = `c_${Date.now()}`;
    const initialRulesConfig = { modalitySettings, bonusConfig, dailyStepsConfig, tiebreakers, leaguePeriod: newChallengePeriod };
    const dates = calculateSeasonDates(newChallengePeriod, false, new Date());
    await supabase.from('challenges').insert([{
      id: newId, title: newChallengeTitle.trim(), invite_code: newChallengeCode.trim().toUpperCase(), creator_id: currentUser.id,
      has_daily_cap: hasCapToggle, daily_cap: hasCapToggle ? (parseInt(newChallengeCap, 10) || 22000) : null,
      registrations_closed: false, is_finished: false, start_date: dates.startDateStr, end_date: dates.endDateStr, tiebreaker_enabled: true, rules_config: initialRulesConfig
    }]);
    await supabase.from('memberships').insert([{
      challenge_id: newId, user_id: currentUser.id, name: currentUser.name, nickname: currentUser.nickname, role: 'spectator',
      ranking_points: 0, bank_points: 0, total_steps: 0, avatar: currentUser.avatar, age: currentUser.age, gender: currentUser.gender
    }]);
    fetchDataFromSupabase(); setIsCreateChallengeOpen(false); setNewChallengeTitle(''); setNewChallengeCode('');
    setActiveChallengeId(newId); setSelectedConfigChallengeId(newId); setCurrentScreen('admin');
    Alert.alert('Sucesso', 'Liga criada com sucesso!');
  }

  async function handleDeleteChallenge(challengeId) {
    const challengeToDelete = challenges.find(c => c.id === challengeId);
    if (!challengeToDelete) return;
    try {
      await supabase.from('pending_workouts').delete().eq('challenge_id', challengeId);
      await supabase.from('feed_posts').delete().eq('challenge_id', challengeId);
      await supabase.from('memberships').delete().eq('challenge_id', challengeId);
      await supabase.from('challenges').delete().eq('id', challengeId);
      await fetchDataFromSupabase(); setCurrentScreen('dashboard');
      Alert.alert('Excluído', 'A liga foi removida.');
    } catch (err) { Alert.alert('Erro', 'Não foi possível excluir.'); }
  }

  async function handleFinishChallenge(challengeId) {
    const targetChallenge = challenges.find(c => c.id === challengeId);
    if (!targetChallenge) return;
    const challengeMembers = memberships.filter(m => m.challengeId === challengeId && m.role === 'active');
    const sorted = [...challengeMembers].sort((a, b) => (b.rankingPoints || 0) - (a.rankingPoints || 0));
    if (sorted[0]) await supabase.from('memberships').update({ gold_medals: (sorted[0].goldMedals || 0) + 1 }).eq('id', sorted[0].id);
    if (sorted[1]) await supabase.from('memberships').update({ silver_medals: (sorted[1].silverMedals || 0) + 1 }).eq('id', sorted[1].id);
    if (sorted[2]) await supabase.from('memberships').update({ bronze_medals: (sorted[2].bronzeMedals || 0) + 1 }).eq('id', sorted[2].id);

    await supabase.from('memberships').update({ role: 'spectator', ranking_points: 0, bank_points: 0, total_steps: 0, total_km: 0, active_days: 0 }).eq('challenge_id', challengeId);
    const period = targetChallenge.rules_config?.leaguePeriod || 'Monthly';
    const nextDayDate = new Date(); nextDayDate.setDate(nextDayDate.getDate() + 1);
    const newSeasonDates = calculateSeasonDates(period, true, nextDayDate);
    await supabase.from('challenges').update({ is_finished: false, registrations_closed: false, start_date: newSeasonDates.startDateStr, end_date: newSeasonDates.endDateStr }).eq('id', challengeId);
    fetchDataFromSupabase();
    Alert.alert('Temporada Encerrada', 'Medalhas distribuídas e nova época iniciada!');
  }

  async function toggleChallengeRegistrations() {
    const newStatus = !selectedChallenge.registrations_closed;
    await supabase.from('challenges').update({ registrations_closed: newStatus }).eq('id', selectedChallenge.id);
    fetchDataFromSupabase();
    Alert.alert('Status', newStatus ? 'Inscrições encerradas.' : 'Inscrições abertas.');
  }

  async function handleUpdateAthleteStatus(memberId, newRole) {
    await supabase.from('memberships').update({ role: newRole }).eq('id', memberId);
    fetchDataFromSupabase();
    Alert.alert('Atualizado', 'Status do participante atualizado.');
  }

  async function handleApproveCommunityMember(memberId) {
    await supabase.from('memberships').update({ role: 'spectator' }).eq('id', memberId);
    fetchDataFromSupabase(); Alert.alert('Aprovado', 'Membro aceito na comunidade.');
  }

  async function handleRejectCommunityMember(memberId) {
    await supabase.from('memberships').delete().eq('id', memberId);
    fetchDataFromSupabase(); Alert.alert('Recusado', 'Solicitação removida.');
  }

  async function handleRemoveMemberFromCommunity(memberId) {
    await supabase.from('memberships').delete().eq('id', memberId);
    fetchDataFromSupabase(); Alert.alert('Removido', 'Participante removido.');
  }

  async function handleManualPointsSubmit() {
    if (!manualSelectedAthleteId) { Alert.alert('Atenção', 'Selecione um Atleta.'); return; }
    const rPts = parseInt(manualRankingPts, 10) || 0;
    const bPts = parseInt(manualBankPts, 10) || 0;
    const sPts = parseInt(manualSteps, 10) || 0;
    let bonusTotal = 0;
    if (checkBonusInquebravel) bonusTotal += parseInt(bonusConfig.inquebravelPts, 10) || 5000;
    if (checkBonusDesperta) bonusTotal += parseInt(bonusConfig.despertaPts, 10) || 3000;

    const member = memberships.find(m => m.id === manualSelectedAthleteId);
    if (!member) return;

    await supabase.from('memberships').update({
      ranking_points: (member.rankingPoints || 0) + rPts + bonusTotal,
      bank_points: (member.bankPoints || 0) + bPts,
      total_steps: (member.totalSteps || 0) + sPts
    }).eq('id', manualSelectedAthleteId);

    fetchDataFromSupabase();
    setManualRankingPts(''); setManualBankPts(''); setManualSteps(''); setCheckBonusInquebravel(false); setCheckBonusDesperta(false);
    Alert.alert('Sucesso', 'Valores creditados com sucesso!');
  }

  async function handleApproveWorkout(workoutId) {
    const workout = pendingWorkouts.find(w => w.id === workoutId);
    if (!workout) return;
    await supabase.from('pending_workouts').delete().eq('id', workoutId);
    const parsedKm = parseFloat(workout.distance_km) || 0;
    const parsedDuration = parseInt(workout.duration_minutes, 10) || 0;

    const { data: currentMem } = await supabase.from('memberships').select('*').eq('challenge_id', workout.challengeId).eq('user_id', workout.user_id).single();
    if (currentMem) {
      await supabase.from('memberships').update({
        ranking_points: (currentMem.ranking_points || 0) + (workout.points_to_ranking || 0),
        bank_points: (currentMem.bank_points || 0) + (workout.points_to_bank || 0),
        total_km: (currentMem.total_km || 0) + parsedKm,
        active_days: (currentMem.active_days || 0) + parsedDuration
      }).eq('challenge_id', workout.challengeId).eq('user_id', workout.user_id);
    }
    fetchDataFromSupabase(); Alert.alert('Aprovado', 'Treino aprovado e somado!');
  }

  async function handleRejectWorkout(workoutId) {
    await supabase.from('pending_workouts').delete().eq('id', workoutId);
    fetchDataFromSupabase(); Alert.alert('Rejeitado', 'Registro removido.');
  }

  const handleTriggerPhoto = (mode, setter) => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      if (mode === 'camera') input.setAttribute('capture', 'environment');
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => setter(reader.result);
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else { Alert.alert('Câmera', 'Recurso nativo simulado.'); }
  };

  async function handleSubmitWorkout() {
    if (!currentUserMembershipInActiveChallenge || currentUserMembershipInActiveChallenge.role !== 'active') {
      Alert.alert('Acesso Restrito', 'Apenas Atletas Ativos podem submeter treinos.'); return;
    }
    const cleanActType = selectedActivity.trim().toUpperCase();
    let formattedDateStr = new Date().toLocaleDateString('pt-BR');
    if (workoutDate) { const p = workoutDate.split('-'); if (p.length === 3) formattedDateStr = `${p[2]}/${p[1]}/${p[0]}`; }

    let dur = 0; let kmValue = 0;
    if (selectedActivity !== '🚶‍♂️ Passos Diários') {
      const startM = (parseInt(startHour, 10) * 60) + parseInt(startMinute, 10);
      const endM = (parseInt(endHour, 10) * 60) + parseInt(endMinute, 10);
      dur = endM - startM; if (dur <= 0) dur += 1440;
    }
    if (['🏃 Corrida', '🚶 Caminhada', '🚴 Bike'].includes(selectedActivity)) kmValue = parseFloat(kmInput) || 0;

    let calculatedPts = selectedActivity === '🚶‍♂️ Passos Diários' ? Math.round((parseFloat(dailyStepsConfig.manualStepsInput) || 0) * (parseFloat(dailyStepsConfig.multiplier) || 0)) : calculateGenericWorkoutPoints(modalitySettings[selectedActivity], dur, kmValue);

    let ptsRanking = calculatedPts; let ptsBank = 0;
    if (selectedChallenge?.has_daily_cap && selectedChallenge?.daily_cap) {
      ptsRanking = Math.min(calculatedPts, selectedChallenge.daily_cap);
      ptsBank = Math.max(0, calculatedPts - selectedChallenge.daily_cap);
    }

    await supabase.from('pending_workouts').insert([{
      id: `pw_${Date.now()}`, challenge_id: activeChallengeId, user_id: currentUser.id, user_name: currentUser.name, user_nickname: currentUser.nickname, user_avatar: currentUser.avatar,
      activity_type: cleanActType, caption: workoutCaption || `Atividade de ${selectedActivity}`, photo_evidence: photoEvidence || 'https://picsum.photos/seed/ev/400/300',
      duration_minutes: dur, distance_km: kmValue, workout_date: formattedDateStr, points_to_ranking: ptsRanking, points_to_bank: ptsBank, created_at: formattedDateStr
    }]);
    fetchDataFromSupabase(); setIsWorkoutModalOpen(false); setKmInput(''); setWorkoutCaption(''); setPhotoEvidence(null);
    Alert.alert('Sucesso', 'Treino enviado para aprovação do Administrador.');
  }

  async function handleSaveAdvancedRules() {
    if (!selectedConfigChallengeId) return;
    const fullRulesObject = { modalitySettings, bonusConfig, dailyStepsConfig, tiebreakers, leaguePeriod };
    try {
      await supabase.from('challenges').update({ rules_config: fullRulesObject }).eq('id', selectedConfigChallengeId);
      setIsAdvancedRulesModalOpen(false); fetchDataFromSupabase();
      Alert.alert('Sucesso', 'Regras salvas permanentemente!');
    } catch (err) { Alert.alert('Erro', err.message); }
  }

  // FUNÇÕES DE GERENCIAMENTO DE STEPS UNIFICADAS (Evita duplicação)
  const handleUpdateModalityProp = (modName, prop, val) => {
    setModalitySettings(prev => ({ ...prev, [modName]: { ...(prev[modName] || {}), [prop]: val } }));
  };

  const handleUpdateStepArrayItem = (modName, stepKey, updatedSteps) => {
    setModalitySettings(prev => ({ ...prev, [modName]: { ...prev[modName], [stepKey]: updatedSteps } }));
  };

  const searchResultsAthletes = memberships.filter(m => searchFilter !== 'challenge' && ((m.name || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) || (m.nickname || '').toLowerCase().includes(searchQuery.toLowerCase().trim())));
  const searchResultsChallenges = challenges.filter(c => searchFilter !== 'athlete' && ((c.title || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) || (c.invite_code || '').toLowerCase().includes(searchQuery.toLowerCase().trim())));

  const currentChallengeMembers = memberships.filter(m => m.challengeId === activeChallengeId);
  const activeMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'active');
  const spectatorMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'spectator' || m.role === 'pending_athlete');
  const pendingCommunityMembers = currentChallengeMembers.filter(m => m.role === 'pending_community');
  const pendingAthleteMembers = currentChallengeMembers.filter(m => m.role === 'pending_athlete');
  const currentFeedPosts = feedPosts.filter(p => p.challenge_id === activeChallengeId);
  const currentPendingWorkouts = pendingWorkouts.filter(w => w.challenge_id === activeChallengeId);

  const rankedAthletes = [...activeMembersInChallenge].sort((a, b) => (b.rankingPoints || 0) - (a.rankingPoints || 0)).map((athlete, index) => ({ ...athlete, rankDisplay: `#${index + 1}` }));

  const athleteMembershipsAll = memberships.filter(m => m.userId === viewedUser.id);
  const athleteChallengesList = challenges.filter(c => athleteMembershipsAll.some(m => m.challengeId === c.id));

  let displayedPerf = { rankingPoints: 0, bankPoints: 0, totalSteps: 0, totalKm: 0, activeDays: 0, goldMedals: viewedUser.goldMedals || 0, silverMedals: viewedUser.silverMedals || 0, bronzeMedals: viewedUser.bronzeMedals || 0, athleteStatusText: 'Múltiplas Ligas' };
  if (athletePerfScope === 'global') {
    displayedPerf.rankingPoints = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.rankingPoints || 0), 0);
    displayedPerf.bankPoints = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.bankPoints || 0), 0);
    displayedPerf.totalSteps = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.totalSteps || 0), 0);
    displayedPerf.totalKm = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.totalKm || 0), 0);
    displayedPerf.activeDays = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.activeDays || 0), 0);
  }

  const athleteFeedPostsAll = feedPosts.filter(p => p.user_id === viewedUser.id);
  const calculatedStepsPoints = Math.round((parseFloat(dailyStepsConfig.manualStepsInput) || 0) * (parseFloat(dailyStepsConfig.multiplier) || 0));

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
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center', marginBottom: 16 }}>{isSignUp ? 'Criar Nova Conta' : 'Aceder à Plataforma'}</Text>
            {isSignUp && (
              <TextInput style={styles.input} placeholder="Nome Completo" value={fullNameInput} onChangeText={setFullNameInput} />
            )}
            <TextInput style={styles.input} placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" value={emailInput} onChangeText={setEmailInput} />
            <TextInput style={styles.input} placeholder="Palavra-passe" secureTextEntry value={passwordInput} onChangeText={setPasswordInput} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleAuthAction} disabled={authSubmitting}>
              {authSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>{isSignUp ? 'CADASTRAR' : 'ENTRAR'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 14, alignItems: 'center' }} onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' }}>{isSignUp ? 'Já tem conta? Faça Login' : 'Registe-se gratuitamente'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, highContrast && { backgroundColor: '#000000' }]}>
      <View style={[styles.topHeader, highContrast && { backgroundColor: '#000000' }]}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brandTitle}>MUVFIT</Text>
            <Text style={styles.brandSubtitle}>Mizan Soluções Técnicas</Text>
          </View>
          <TouchableOpacity style={{ backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }} onPress={handleSignOut}>
            <Text style={{ color: '#ffffff', fontSize: 9 * fontSizeScale, fontWeight: 'bold' }}>🚪 SAIR</Text>
          </TouchableOpacity>
        </View>

        {hasUserAnyCommunity && (
          <View style={styles.activeChallengeSelectorBar}>
            <Text style={styles.activeChallengeSelectorLabel}>🎯 Desafio Selecionado:</Text>
            <select style={styles.htmlHeaderSelect} value={activeChallengeId || ''} onChange={(e) => {
              const foundCh = challenges.find(c => c.id === e.target.value);
              if (foundCh) selectChallengeContext(foundCh, foundCh.creator_id === currentUser.id);
            }}>
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>{c.title} ({c.creator_id === currentUser.id ? 'Admin' : 'Membro'})</option>
              ))}
            </select>
          </View>
        )}

        <TextInput style={styles.searchInput} placeholder="🔍 Pesquisar Atletas ou Ligas..." value={searchQuery} onFocus={() => setIsSearchOpen(true)} onChangeText={(txt) => { setSearchQuery(txt); if (!isSearchOpen) setIsSearchOpen(true); }} />
        {isSearchOpen && (
          <View style={styles.searchResultsDropdown}>
            <View style={styles.searchHeaderTop}>
              <Text style={styles.searchHeaderTitle}>Resultados</Text>
              <TouchableOpacity onPress={() => setIsSearchOpen(false)}><Text style={styles.closeSearchText}>✕ FECHAR</Text></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 180 }}>
              {searchResultsAthletes.map(a => (
                <TouchableOpacity key={a.userId} style={styles.searchResultItem} onPress={() => { handleOpenUserProfile(a.userId); setIsSearchOpen(false); }}>
                  <Text style={styles.searchResultTitle}>{a.nickname || a.name}</Text>
                </TouchableOpacity>
              ))}
              {searchResultsChallenges.map(ch => (
                <TouchableOpacity key={ch.id} style={styles.searchResultItem} onPress={() => { selectChallengeContext(ch, ch.creator_id === currentUser.id); setIsSearchOpen(false); }}>
                  <Text style={styles.searchResultTitle}>🏆 {ch.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'dashboard' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('dashboard')}><Text style={styles.sidebarText}>Painel</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'athlete_center' && styles.sidebarBtnActive]} onPress={() => { setViewedUser(currentUser); setCurrentScreen('athlete_center'); }}><Text style={styles.sidebarText}>Atleta</Text></TouchableOpacity>
          {hasUserAnyCommunity && (
            <>
              <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'feed' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('feed')}><Text style={styles.sidebarText}>Feed</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'ranking' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('ranking')}><Text style={styles.sidebarText}>Ranking</Text></TouchableOpacity>
              {selectedChallenge.creator_id === currentUser.id && (
                <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'admin' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('admin')}><Text style={styles.sidebarText}>Admin</Text></TouchableOpacity>
              )}
            </>
          )}
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'configuracao_conta' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('configuracao_conta')}><Text style={styles.sidebarText}>Config</Text></TouchableOpacity>
        </View>

        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
          {currentScreen === 'dashboard' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={styles.pageTitle}>Painel Geral de Ligas</Text>
                {currentUser.isAdmin && (
                  <TouchableOpacity style={styles.createChallengeBtnHeader} onPress={() => setIsCreateChallengeOpen(true)}><Text style={styles.createChallengeBtnText}>+ NOVO</Text></TouchableOpacity>
                )}
              </View>
              <Text style={styles.sectionHeaderTitle}>🔑 Ligas que Administra</Text>
              {adminChallenges.map(c => (
                <View key={c.id} style={styles.cardBox}>
                  <Text style={styles.cardBoxTitle}>{c.title}</Text>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => selectChallengeContext(c, true)}><Text style={styles.primaryBtnText}>ENTRAR COMO ADMIN</Text></TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {currentScreen === 'configuracao_conta' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={styles.pageTitle}>⚙️ Configuração de Conta</Text>
              <TextInput style={styles.input} placeholder="Nova Senha" secureTextEntry value={accountNewPassword} onChangeText={setAccountNewPassword} />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleChangePassword}><Text style={styles.primaryBtnText}>ALTERAR SENHA</Text></TouchableOpacity>
              <TouchableOpacity style={styles.dashboardActionBtnRed} onPress={handleDeleteAccountConfirmation}><Text style={styles.dashboardActionBtnText}>DELETAR CONTA</Text></TouchableOpacity>
            </ScrollView>
          )}

          {currentScreen === 'feed' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={styles.pageTitle}>Feed — {selectedChallenge.title}</Text>
              {currentUserMembershipInActiveChallenge?.role === 'active' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => setIsWorkoutModalOpen(true)}><Text style={styles.actionBtnText}>+ REGISTAR TREINO</Text></TouchableOpacity>
              )}
              {currentFeedPosts.map(post => (
                <View key={post.id} style={styles.postCard}>
                  <Image source={{ uri: post.photo_evidence }} style={styles.postImg} />
                  <Text style={styles.postCaption}>{post.caption}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {currentScreen === 'ranking' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={styles.pageTitle}>🏆 Ranking — {selectedChallenge.title}</Text>
              {rankedAthletes.map(member => (
                <View key={member.userId} style={styles.rankingRowCard}>
                  <Text style={styles.rankingPosNumber}>{member.rankDisplay}</Text>
                  <Text style={styles.rankingMemberName}>{member.nickname || member.name}</Text>
                  <Text style={styles.rankingMemberPts}>{(member.rankingPoints || 0).toLocaleString()} pts</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {currentScreen === 'athlete_center' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.profileHeaderCard}>
                <Image source={{ uri: viewedUser.avatar }} style={styles.avatarLarge} />
                <Text style={styles.profileNicknameDisplay}>{viewedUser.nickname || viewedUser.name}</Text>
                {viewedUser.id === currentUser.id && (
                  <TouchableOpacity style={styles.editProfileBtn} onPress={handleOpenEditProfile}><Text style={styles.editProfileBtnText}>✏️ EDITAR PERFIL</Text></TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}

          {currentScreen === 'admin' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={styles.pageTitle}>Central do Admin</Text>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setIsAdvancedRulesModalOpen(true)}><Text style={styles.actionBtnText}>⚙️ REGRAS AVANÇADAS DA LIGA</Text></TouchableOpacity>
              {currentPendingWorkouts.map(w => (
                <View key={w.id} style={styles.workoutPendingCard}>
                  <Text style={styles.participantName}>{w.user_nickname} - {w.activity_type}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveWorkout(w.id)}><Text style={styles.btnMiniText}>APROVAR</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.banBtn} onPress={() => handleRejectWorkout(w.id)}><Text style={styles.btnMiniText}>REJEITAR</Text></TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* MODAL DE REGRAS AVANÇADAS COM LÓGICA DE STEPS UNIFICADA */}
      <Modal visible={isAdvancedRulesModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>Configuração Avançada</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <select style={styles.htmlNativeSelect} value={selectedConfigActivity} onChange={(e) => setSelectedConfigActivity(e.target.value)}>
                {modalitiesList.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>

              {['💪 Musculação', '🏋️ Crossfit / Treino Funcional', '🫀 Treino Aeróbico'].includes(selectedConfigActivity) && (() => {
                const currentMod = modalitySettings[selectedConfigActivity] || defaultModalityRule;
                return (
                  <View style={styles.scoringModeBoxContainer}>
                    <Text style={styles.sectionHeaderTitle}>{selectedConfigActivity}</Text>
                    <Text style={styles.inputLabel}>Pontos Concedidos:</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={currentMod.simplePts || ''} onChangeText={(v) => handleUpdateModalityProp(selectedConfigActivity, 'simplePts', v)} />
                    <Text style={styles.inputLabel}>A cada X Minutos:</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={currentMod.simplePerMin || ''} onChangeText={(v) => handleUpdateModalityProp(selectedConfigActivity, 'simplePerMin', v)} />
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => {
                      const newSteps = [...(currentMod.timeSteps || []), { modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }];
                      handleUpdateStepArrayItem(selectedConfigActivity, 'timeSteps', newSteps);
                    }}><Text style={styles.primaryBtnText}>+ Adicionar Step</Text></TouchableOpacity>
                  </View>
                );
              })()}
            </ScrollView>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveAdvancedRules}><Text style={styles.primaryBtnText}>SALVAR REGRAS</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAdvancedRulesModalOpen(false)}><Text style={styles.cancelBtnText}>FECHAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE SUBMISSÃO DE TREINO */}
      <Modal visible={isWorkoutModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={{ maxHeight: 450 }}>
              <Text style={styles.modalTitle}>Registar Treino</Text>
              <select style={styles.htmlNativeSelect} value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)}>
                {modalitiesList.filter(m => m.value !== '🎁 Bônus e Critérios de Desempate' && m.value !== '🏛️ Base da Liga').map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <TextInput style={styles.input} placeholder="Legenda / Comentário" value={workoutCaption} onChangeText={setWorkoutCaption} />
              <TouchableOpacity style={styles.primaryBtn} onPress={() => handleTriggerPhoto('camera', setPhotoEvidence)}><Text style={styles.primaryBtnText}>📷 ADICIONAR FOTO</Text></TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitWorkout}><Text style={styles.primaryBtnText}>ENVIAR TREINO</Text></TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsWorkoutModalOpen(false)}><Text style={styles.cancelBtnText}>CANCELAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE EDIÇÃO DE PERFIL */}
      <Modal visible={isEditProfileOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Editar Perfil</Text>
            <TextInput style={styles.input} placeholder="Nome Completo" value={editFullName} onChangeText={setEditFullName} />
            <TextInput style={styles.input} placeholder="Apelido Público" value={editNickname} onChangeText={setEditNickname} />
            <TextInput style={styles.input} placeholder="Data Nascimento (DD/MM/AAAA)" value={editBirthDate} onChangeText={(txt) => setEditBirthDate(formatBirthDateMask(txt))} maxLength={10} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>SALVAR</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditProfileOpen(false)}><Text style={styles.cancelBtnText}>CANCELAR</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL DE CRIAR LIGA */}
      <Modal visible={isCreateChallengeOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>🏆 Criar Nova Liga</Text>
            <TextInput style={styles.input} placeholder="Nome do Desafio" value={newChallengeTitle} onChangeText={setNewChallengeTitle} />
            <TextInput style={styles.input} placeholder="Código de Convite" autoCapitalize="characters" value={newChallengeCode} onChangeText={setNewChallengeCode} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateChallenge}><Text style={styles.primaryBtnText}>CRIAR</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreateChallengeOpen(false)}><Text style={styles.cancelBtnText}>CANCELAR</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
