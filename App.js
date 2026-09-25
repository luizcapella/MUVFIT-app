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

// --- UTILITÁRIOS E CÁLCULOS OTIMIZADOS ---
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
  if (g === 1) return 'Campeão';
  if (g === 2) return 'Bi-campeão';
  if (g === 3) return 'Tri-campeão';
  if (g === 4) return 'Tetra-campeão';
  if (g === 5) return 'Penta-campeão';
  if (g === 6) return 'Hexa-campeão';
  return `${g}x Campeão`;
};

const formatBirthDateMask = (t) => {
  let c = t.replace(/\D/g, '').slice(0, 8);
  if (c.length >= 5) c = `${c.slice(0, 2)}/${c.slice(2, 4)}/${c.slice(4)}`;
  else if (c.length >= 3) c = `${c.slice(0, 2)}/${c.slice(2)}`;
  return c;
};

const calcWorkoutPts = (act, dur, km, settings) => {
  const cfg = settings[act];
  if (!cfg || cfg.enabled === false) return 0;
  let pts = 0, mode = cfg.scoringMode || 'simple';
  if (mode === 'simple' && dur >= (parseFloat(cfg.simplePerMin) || 0)) pts = parseFloat(cfg.simplePts) || 0;
  else if (mode === 'timeSteps') {
    for (let st of (cfg.timeSteps || [])) {
      if (dur >= (parseFloat(st.minTime) || 0) && dur <= (st.modeType === 'Acima' ? Infinity : (parseFloat(st.maxTime) || Infinity))) {
        pts = parseFloat(st.pts) || 0; break;
      }
    }
  } else if (mode === 'kmSimple' && km >= (parseFloat(cfg.kmPerX) || 0)) pts = parseFloat(cfg.kmSimplePts) || 0;
  else if (mode === 'kmSteps') {
    for (let st of (cfg.kmSteps || [])) {
      if (km >= (parseFloat(st.minKm) || 0) && km <= (st.modeType === 'Acima' ? Infinity : (parseFloat(st.maxKm) || Infinity))) {
        pts = parseFloat(st.pts) || 0; break;
      }
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

  const [currentUser, setCurrentUser] = useState({ id: '', name: '', nickname: '', birth_date: '', age: 0, gender: 'Masculino', avatar: 'https://picsum.photos/seed/poke/200/200', isAdmin: true, goldMedals: 0, silverMedals: 0, bronzeMedals: 0 });
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
  const getTodayISO = () => { const t = new Date(); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
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

  const hoursArray = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) { fetchUserProfile(session.user.id, session.user.email); fetchDataFromSupabase(); }
      setLoadingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) { fetchUserProfile(session.user.id, session.user.email); fetchDataFromSupabase(); }
      else setCurrentUser({ id: '', name: '', nickname: '' });
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
          const p = data.birth_date.split('-');
          if (p.length === 3) formattedDate = `${p[2]}/${p[1]}/${p[0]}`;
        }
        const computedAge = formattedDate ? calculateAge(formattedDate) : 0;
        if (data.weight_history) {
          try {
            const parsed = typeof data.weight_history === 'string' ? JSON.parse(data.weight_history) : data.weight_history;
            if (Array.isArray(parsed)) setWeightHistoryList(parsed);
          } catch (e) { console.log(e); }
        }
        if (data.target_weight !== null && data.target_weight !== undefined) setTargetWeightValue(String(data.target_weight));

        const loadedUser = {
          id: data.id, name: data.full_name || userEmail.split('@')[0], nickname: data.nickname || data.full_name || userEmail.split('@')[0],
          birth_date: formattedDate, age: computedAge, gender: data.gender || 'Masculino', avatar: data.avatar_url || `https://picsum.photos/seed/${data.id}/200/200`,
          isAdmin: true, goldMedals: data.gold_medals || 0, silverMedals: data.silver_medals || 0, bronzeMedals: data.bronze_medals || 0
        };
        setCurrentUser(loadedUser); setViewedUser(loadedUser);
      } else {
        const fallback = userEmail ? userEmail.split('@')[0] : 'Atleta';
        const loadedUser = { id: userId, name: fallback, nickname: fallback, birth_date: '', age: 0, gender: 'Masculino', avatar: `https://picsum.photos/seed/${userId}/200/200`, isAdmin: true, goldMedals: 0, silverMedals: 0, bronzeMedals: 0 };
        setCurrentUser(loadedUser); setViewedUser(loadedUser);
      }
    } catch (err) { console.log(err); }
  }

  async function saveWeightDataToSupabase(updatedList, newTarget) {
    if (!currentUser.id) return;
    try {
      const targetVal = (newTarget === '' || newTarget === null || isNaN(newTarget)) ? null : parseFloat(newTarget);
      await supabase.from('profiles').update({ weight_history: updatedList, target_weight: targetVal }).eq('id', currentUser.id);
    } catch (err) { console.log(err); }
  }

  async function handleAuthAction() {
    if (!emailInput.trim() || !passwordInput.trim()) { Alert.alert('Atenção', 'Preencha E-mail e Senha.'); return; }
    setAuthSubmitting(true);
    try {
      if (isSignUp) {
        if (!fullNameInput.trim()) { Alert.alert('Atenção', 'Preencha o Nome Completo.'); setAuthSubmitting(false); return; }
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailInput.trim(), password: passwordInput.trim(),
          options: { data: { full_name: fullNameInput.trim(), nickname: fullNameInput.trim(), gender: genderInput } }
        });
        if (authError) { Alert.alert('Erro', authError.message); setAuthSubmitting(false); return; }
        if (authData?.session) { setSession(authData.session); await fetchUserProfile(authData.session.user.id, authData.session.user.email); await fetchDataFromSupabase(); setAuthSubmitting(false); return; }
        if (authData?.user) {
          await supabase.from('profiles').upsert([{ id: authData.user.id, full_name: fullNameInput.trim(), nickname: fullNameInput.trim(), gender: genderInput }], { onConflict: 'id' }).catch(() => {});
        }
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email: emailInput.trim(), password: passwordInput.trim() });
        if (loginError) { Alert.alert('Conta Criada!', 'Faça o login com sua senha.'); setIsSignUp(false); }
        else if (loginData.session) { setSession(loginData.session); await fetchUserProfile(loginData.session.user.id, loginData.session.user.email); await fetchDataFromSupabase(); }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: emailInput.trim(), password: passwordInput.trim() });
        if (error) Alert.alert('Erro no Login', error.message);
        else if (data.session) { setSession(data.session); await fetchUserProfile(data.session.user.id, data.session.user.email); await fetchDataFromSupabase(); }
      }
    } catch (err) { Alert.alert('Erro', err.message); } finally { setAuthSubmitting(false); }
  }

  function handleOpenEditProfile() {
    setEditFullName(currentUser.name || ''); setEditNickname(currentUser.nickname || '');
    setEditBirthDate(currentUser.birth_date || ''); setEditGender(currentUser.gender || 'Masculino');
    setEditAvatar(currentUser.avatar || ''); setIsEditProfileOpen(true);
  }

  async function handleSaveProfile() {
    if (!editNickname.trim() || !editFullName.trim()) { Alert.alert('Atenção', 'Nome e Apelido obrigatórios.'); return; }
    setSavingProfile(true);
    try {
      let finalAvatarUrl = editAvatar;
      if (editAvatar && editAvatar.startsWith('data:image')) {
        try {
          const ext = editAvatar.substring('data:image/'.length, editAvatar.indexOf(';base64')) || 'jpeg';
          const fileName = `${currentUser.id}_${Date.now()}.${ext}`;
          const res = await fetch(editAvatar);
          const blob = await res.blob();
          const { error: upErr } = await supabase.storage.from('avatars').upload(fileName, blob, { contentType: `image/${ext}`, upsert: true });
          if (!upErr) {
            const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(fileName);
            finalAvatarUrl = pubData.publicUrl;
          }
        } catch (e) { console.log(e); }
      }
      let dbBirthDate = null, computedAge = 0;
      if (editBirthDate && editBirthDate.length === 10) {
        const p = editBirthDate.split('/');
        if (p.length === 3) { dbBirthDate = `${p[2]}-${p[1]}-${p[0]}`; computedAge = calculateAge(editBirthDate) || 0; }
      }
      const payload = { id: currentUser.id, full_name: editFullName.trim(), nickname: editNickname.trim(), gender: editGender, avatar_url: finalAvatarUrl };
      if (dbBirthDate) payload.birth_date = dbBirthDate;
      await supabase.from('profiles').upsert([payload], { onConflict: 'id' });
      await supabase.from('memberships').update({ name: editFullName.trim(), nickname: editNickname.trim(), avatar: finalAvatarUrl, age: computedAge, gender: editGender }).eq('user_id', currentUser.id);

      const updated = { ...currentUser, name: editFullName.trim(), nickname: editNickname.trim(), birth_date: editBirthDate, age: computedAge, gender: editGender, avatar: finalAvatarUrl };
      setCurrentUser(updated); setViewedUser(updated); setIsEditProfileOpen(false);
      await fetchDataFromSupabase();
      Alert.alert('Sucesso!', 'Perfil atualizado!');
    } catch (err) { Alert.alert('Erro', err.message); } finally { setSavingProfile(false); }
  }

  async function handleSignOut() { await supabase.auth.signOut(); setSession(null); }
  async function handleChangePassword() {
    if (!accountNewPassword.trim()) { Alert.alert('Atenção', 'Digite a nova senha.'); return; }
    const { error } = await supabase.auth.updateUser({ password: accountNewPassword });
    if (error) Alert.alert('Erro', error.message); else { Alert.alert('Sucesso', 'Senha alterada!'); setAccountNewPassword(''); }
  }

  function handleDeleteAccountConfirmation() {
    if (Platform.OS === 'web') {
      if (window.confirm("TEM CERTEZA? Sua conta será desativada.")) { handleSignOut(); }
    } else {
      Alert.alert("Deletar Conta", "Deseja desativar permanentemente?", [{ text: "NÃO", style: "cancel" }, { text: "SIM", style: "destructive", onPress: handleSignOut }]);
    }
  }

  function handleSendEmailRequest(subject, bodyText) {
    const url = `mailto:muvfit.mizansolucoes@outlook.com.br?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
    if (Platform.OS === 'web') window.open(url, '_blank');
    else Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o e-mail.'));
  }

  async function fetchDataFromSupabase() {
    try {
      const { data: chData } = await supabase.from('challenges').select('*');
      if (chData && chData.length > 0) {
        const fmt = chData.map(c => ({ ...c, startDate: c.start_date, endDate: c.end_date, tiebreakerEnabled: c.tiebreaker_enabled }));
        setChallenges(fmt);
        if (!activeChallengeId) setActiveChallengeId(fmt[0].id);
        if (!selectedConfigChallengeId) setSelectedConfigChallengeId(fmt[0].id);
        const act = fmt.find(c => c.id === (activeChallengeId || fmt[0].id)) || fmt[0];
        if (act?.rules_config) {
          if (act.rules_config.modalitySettings) setModalitySettings(act.rules_config.modalitySettings);
          if (act.rules_config.bonusConfig) setBonusConfig(act.rules_config.bonusConfig);
          if (act.rules_config.dailyStepsConfig) setDailyStepsConfig(act.rules_config.dailyStepsConfig);
          if (act.rules_config.tiebreakers) setTiebreakers(act.rules_config.tiebreakers);
          if (act.rules_config.leaguePeriod) setLeaguePeriod(act.rules_config.leaguePeriod);
        }
      }
      const { data: memData } = await supabase.from('memberships').select('*');
      if (memData) setMemberships(memData.map(m => ({ ...m, challengeId: m.challenge_id, userId: m.user_id, rankingPoints: m.ranking_points || 0, bankPoints: m.bank_points || 0, totalSteps: m.total_steps || 0, totalKm: m.total_km || 0, activeDays: m.active_days || 0, goldMedals: m.gold_medals || 0, silverMedals: m.silver_medals || 0, bronzeMedals: m.bronze_medals || 0 })));
      const { data: fData } = await supabase.from('feed_posts').select('*');
      if (fData) setFeedPosts(fData);
      const { data: pData } = await supabase.from('pending_workouts').select('*');
      if (pData) setPendingWorkouts(pData);
    } catch (e) { console.log(e); }
  }

  const userMembershipsAll = memberships.filter(m => m.userId === currentUser.id);
  const adminChallenges = challenges.filter(c => c.creator_id === currentUser.id);
  const participantChallenges = challenges.filter(c => memberships.some(m => m.challengeId === c.id && m.userId === currentUser.id) && c.creator_id !== currentUser.id);
  const currentUserMembershipInActiveChallenge = memberships.find(m => m.challengeId === activeChallengeId && m.userId === currentUser.id);
  const hasUserAnyCommunity = userMembershipsAll.length > 0 || adminChallenges.length > 0;

  const handleShareInvite = async (ch) => {
    const url = `https://muvfit.vercel.app/convite?codigo=${ch.invite_code}`;
    try { await Share.share({ message: `Convite MuvFit para a liga *${ch.title}*:\n${url}`, url, title: ch.title }); } catch (e) { console.log(e); }
  };

  function selectChallengeContext(ch, asAdmin) {
    setActiveChallengeId(ch.id); setIsAdminContext(asAdmin);
    if (ch.rules_config) {
      if (ch.rules_config.modalitySettings) setModalitySettings(ch.rules_config.modalitySettings);
      if (ch.rules_config.bonusConfig) setBonusConfig(ch.rules_config.bonusConfig);
      if (ch.rules_config.dailyStepsConfig) setDailyStepsConfig(ch.rules_config.dailyStepsConfig);
      if (ch.rules_config.tiebreakers) setTiebreakers(ch.rules_config.tiebreakers);
      if (ch.rules_config.leaguePeriod) setLeaguePeriod(ch.rules_config.leaguePeriod);
    }
    setCurrentScreen(asAdmin ? 'admin' : 'feed');
  }

  function handleOpenUserProfile(userId) {
    const found = memberships.find(m => m.userId === userId);
    setViewedUser(found || currentUser); setAthletePerfScope('global'); setCurrentScreen('athlete_center');
  }

  async function handleRequestCommunityEntry(ch) {
    if (memberships.some(m => m.challengeId === ch.id && m.userId === currentUser.id)) { Alert.alert('Atenção', 'Já possui solicitação ou inscrição.'); return; }
    await supabase.from('memberships').insert([{ challenge_id: ch.id, user_id: currentUser.id, name: currentUser.name, nickname: currentUser.nickname, role: 'pending_community', ranking_points: 0, bank_points: 0, total_steps: 0, avatar: currentUser.avatar, age: currentUser.age, gender: currentUser.gender }]);
    fetchDataFromSupabase(); setIsSearchOpen(false); setSearchQuery('');
    Alert.alert('Solicitação Enviada!', `Entrada na comunidade "${ch.title}" enviada.`);
  }

  async function handleRequestAthleteActive() {
    if (!activeChallengeId || !selectedChallenge?.id) return;
    try {
      const { data: exist } = await supabase.from('memberships').select('id').eq('challenge_id', selectedChallenge.id).eq('user_id', currentUser.id).maybeSingle();
      const payload = { challenge_id: selectedChallenge.id, user_id: currentUser.id, name: currentUser.name, nickname: currentUser.nickname, avatar: currentUser.avatar, role: 'pending_athlete', ranking_points: 0, bank_points: 0, total_steps: 0, age: currentUser.age || 0, gender: currentUser.gender || 'Masculino' };
      if (exist?.id) await supabase.from('memberships').update({ role: 'pending_athlete' }).eq('id', exist.id);
      else await supabase.from('memberships').insert([payload]);
      fetchDataFromSupabase();
      Alert.alert('Pendente!', 'Solicitação para Atleta Ativo enviada.');
    } catch (e) { Alert.alert('Erro', e.message); }
  }

  async function handleToggleLike(postId) {
    const post = feedPosts.find(p => p.id === postId);
    if (!post) return;
    const l = post.isLiked ? post.likes - 1 : post.likes + 1, isLiked = !post.isLiked;
    setFeedPosts(feedPosts.map(p => p.id === postId ? { ...p, likes: l, isLiked } : p));
    await supabase.from('feed_posts').update({ likes: l }).eq('id', postId);
  }

  async function handleAddComment(postId) {
    const txt = commentInputs[postId];
    if (!txt || !txt.trim()) return;
    const post = feedPosts.find(p => p.id === postId);
    if (!post) return;
    const cm = [...(post.comments || []), { id: `c_${Date.now()}`, user: currentUser.nickname, text: txt.trim() }];
    setFeedPosts(feedPosts.map(p => p.id === postId ? { ...p, comments: cm } : p));
    setCommentInputs({ ...commentInputs, [postId]: '' });
    await supabase.from('feed_posts').update({ comments: cm }).eq('id', postId);
  }

  async function handleCreateChallenge() {
    if (!newChallengeTitle.trim() || !newChallengeCode.trim()) { Alert.alert('Erro', 'Preencha Título e Código.'); return; }
    const newId = `c_${Date.now()}`;
    const dates = calculateSeasonDates(newChallengePeriod, false, new Date());
    await supabase.from('challenges').insert([{
      id: newId, title: newChallengeTitle.trim(), invite_code: newChallengeCode.trim().toUpperCase(), creator_id: currentUser.id,
      has_daily_cap: hasCapToggle, daily_cap: hasCapToggle ? (parseInt(newChallengeCap, 10) || 22000) : null,
      registrations_closed: false, is_finished: false, start_date: dates.startDateStr, end_date: dates.endDateStr, tiebreaker_enabled: true,
      rules_config: { modalitySettings, bonusConfig, dailyStepsConfig, tiebreakers, leaguePeriod: newChallengePeriod }
    }]);
    await supabase.from('memberships').insert([{ challenge_id: newId, user_id: currentUser.id, name: currentUser.name, nickname: currentUser.nickname, role: 'spectator', ranking_points: 0, bank_points: 0, total_steps: 0, avatar: currentUser.avatar, gold_medals: 0, silver_medals: 0, bronze_medals: 0, age: currentUser.age, gender: currentUser.gender }]);
    fetchDataFromSupabase(); setIsCreateChallengeOpen(false); setNewChallengeTitle(''); setNewChallengeCode('');
    selectChallengeContext({ id: newId, title: newChallengeTitle.trim(), creator_id: currentUser.id }, true);
    Alert.alert('Sucesso', 'Liga criada!');
  }

  async function handleDeleteChallenge(id) {
    if (Platform.OS === 'web' && !window.confirm("Deseja EXCLUIR esta liga?")) return;
    await supabase.from('pending_workouts').delete().eq('challenge_id', id);
    await supabase.from('feed_posts').delete().eq('challenge_id', id);
    await supabase.from('memberships').delete().eq('challenge_id', id);
    await supabase.from('challenges').delete().eq('id', id);
    fetchDataFromSupabase(); setCurrentScreen('dashboard');
  }

  async function handleFinishChallenge(id) {
    const ch = challenges.find(c => c.id === id);
    if (!ch) return;
    const mems = memberships.filter(m => m.challengeId === id && m.role === 'active').sort((a, b) => (b.rankingPoints || 0) - (a.rankingPoints || 0));
    if (mems[0]) {
      const g = (mems[0].goldMedals || 0) + 1;
      await supabase.from('memberships').update({ gold_medals: g }).eq('id', mems[0].id);
      await supabase.from('profiles').update({ gold_medals: g }).eq('id', mems[0].userId);
    }
    if (mems[1]) {
      const s = (mems[1].silverMedals || 0) + 1;
      await supabase.from('memberships').update({ silver_medals: s }).eq('id', mems[1].id);
      await supabase.from('profiles').update({ silver_medals: s }).eq('id', mems[1].userId);
    }
    if (mems[2]) {
      const b = (mems[2].bronzeMedals || 0) + 1;
      await supabase.from('memberships').update({ bronze_medals: b }).eq('id', mems[2].id);
      await supabase.from('profiles').update({ bronze_medals: b }).eq('id', mems[2].userId);
    }
    await supabase.from('memberships').update({ role: 'spectator', ranking_points: 0, bank_points: 0, total_steps: 0, total_km: 0, active_days: 0 }).eq('challenge_id', id);
    const nDate = new Date(); nDate.setDate(nDate.getDate() + 1);
    const sd = calculateSeasonDates(ch.rules_config?.leaguePeriod || 'Monthly', true, nDate);
    await supabase.from('challenges').update({ is_finished: false, registrations_closed: false, start_date: sd.startDateStr, end_date: sd.endDateStr }).eq('id', id);
    fetchDataFromSupabase();
    Alert.alert('Encerrada!', `Temporada concluída. Nova vigência: ${sd.startDateStr} até ${sd.endDateStr}`);
  }

  async function toggleChallengeRegistrations() {
    const status = !selectedChallenge.registrations_closed;
    await supabase.from('challenges').update({ registrations_closed: status }).eq('id', selectedChallenge.id);
    fetchDataFromSupabase();
  }

  async function handleUpdateAthleteStatus(id, role) {
    await supabase.from('memberships').update({ role }).eq('id', id);
    fetchDataFromSupabase();
  }

  async function handleManualPointsSubmit() {
    if (!manualSelectedAthleteId) { Alert.alert('Atenção', 'Selecione um atleta.'); return; }
    const r = parseInt(manualRankingPts, 10) || 0, b = parseInt(manualBankPts, 10) || 0, s = parseInt(manualSteps, 10) || 0;
    let bonus = 0;
    if (checkBonusInquebravel) bonus += parseInt(bonusConfig.inquebravelPts, 10) || 5000;
    if (checkBonusDesperta) bonus += parseInt(bonusConfig.despertaPts, 10) || 3000;
    if (!r && !b && !s && !bonus) { Alert.alert('Atenção', 'Preencha algum valor.'); return; }

    const mem = memberships.find(m => m.id === manualSelectedAthleteId);
    if (!mem) return;
    await supabase.from('memberships').update({
      ranking_points: (mem.rankingPoints || 0) + r + bonus,
      bank_points: (mem.bankPoints || 0) + b,
      total_steps: (mem.totalSteps || 0) + s
    }).eq('id', manualSelectedAthleteId);

    const extras = [];
    if (checkBonusInquebravel) extras.push('Bônus Inquebrável');
    if (checkBonusDesperta) extras.push('Bônus Desperta');

    await supabase.from('feed_posts').insert([{
      id: `p_man_${Date.now()}`, challenge_id: selectedChallenge.id, user_id: mem.userId, user_name: mem.name, user_nickname: mem.nickname, user_avatar: mem.avatar,
      activity_type: manualActivity.toUpperCase(), caption: `Lançamento manual (${manualActivity})${extras.length ? ' | ' + extras.join(' | ') : ''}`,
      photo_evidence: 'https://picsum.photos/seed/admin/400/300', all_photos: ['https://picsum.photos/seed/admin/400/300'],
      points_to_ranking: r + bonus, points_to_bank: b, status: 'approved', created_at: 'Agora', likes: 0, comments: []
    }]);

    fetchDataFromSupabase();
    setManualRankingPts(''); setManualBankPts(''); setManualSteps(''); setCheckBonusInquebravel(false); setCheckBonusDesperta(false);
    Alert.alert('Sucesso', 'Pontos creditados!');
  }

  async function handleApproveWorkout(wId) {
    const w = pendingWorkouts.find(item => item.id === wId);
    if (!w) return;
    await supabase.from('pending_workouts').delete().eq('id', wId);
    const km = parseFloat(w.distance_km) || 0, dur = parseInt(w.duration_minutes, 10) || 0;
    const { data: cur } = await supabase.from('memberships').select('ranking_points, bank_points, total_steps, total_km, active_days').eq('challenge_id', w.challengeId).eq('user_id', w.user_id).single();
    if (cur) {
      await supabase.from('memberships').update({
        ranking_points: (cur.ranking_points || 0) + (w.points_to_ranking || 0),
        bank_points: (cur.bank_points || 0) + (w.points_to_bank || 0),
        total_km: (cur.total_km || 0) + (km > 0 ? km : 0),
        active_days: (cur.active_days || 0) + (dur > 0 ? dur : 0)
      }).eq('challenge_id', w.challengeId).eq('user_id', w.user_id);
    }
    const imgs = [w.photo_start, w.photo_evidence, w.photo_end].filter(Boolean);
    await supabase.from('feed_posts').insert([{
      id: `p_${Date.now()}`, challenge_id: w.challengeId, user_id: w.user_id, user_name: w.user_name, user_nickname: w.user_nickname, user_avatar: w.user_avatar,
      activity_type: w.activity_type, caption: w.caption, photo_evidence: w.photo_evidence, all_photos: imgs.length ? imgs : [w.photo_evidence],
      points_to_ranking: w.points_to_ranking, points_to_bank: w.points_to_bank, duration_minutes: dur, status: 'approved', created_at: w.created_at || 'Agora', likes: 0, comments: []
    }]);
    fetchDataFromSupabase();
    Alert.alert('Aprovado!', 'Treino adicionado ao feed.');
  }

  async function handleRejectWorkout(wId) {
    await supabase.from('pending_workouts').delete().eq('id', wId);
    fetchDataFromSupabase();
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
    } else {
      Alert.alert('Câmera', 'Abrindo dispositivo...');
    }
  };

  const calculatedStepsPoints = Math.round((parseFloat(dailyStepsConfig.manualStepsInput) || 0) * (parseFloat(dailyStepsConfig.multiplier) || 0));

  async function handleSubmitWorkout() {
    if (!currentUserMembershipInActiveChallenge || currentUserMembershipInActiveChallenge.role !== 'active') {
      Alert.alert('Restrito', 'Apenas Atletas Ativos podem submeter.'); return;
    }
    const isThree = ['💪 Musculação', '🏋️ Crossfit / Treino Funcional', '🫀 Treino Aeróbico'].includes(selectedActivity);
    const isKm = ['🏃 Corrida', '🚶 Caminhada', '🚴 Bike'].includes(selectedActivity);
    const isSteps = selectedActivity === '🚶‍♂️ Passos Diários';

    if (isThree && (!photoStart || !photoEvidence || !photoEnd)) { Alert.alert('Erro', 'Envie as 3 fotos obrigatórias.'); return; }
    else if (!isThree && !photoEvidence) { Alert.alert('Erro', 'Adicione a foto de comprovação.'); return; }

    let dtStr = new Date().toLocaleDateString('pt-BR');
    if (workoutDate) { const p = workoutDate.split('-'); if (p.length === 3) dtStr = `${p[2]}/${p[1]}/${p[0]}`; }

    let dur = 0, kmVal = 0;
    if (!isSteps) {
      const sM = (parseInt(startHour, 10) * 60) + parseInt(startMinute, 10);
      const eM = (parseInt(endHour, 10) * 60) + parseInt(endMinute, 10);
      dur = eM - sM; if (dur <= 0) dur += 1440;
    }
    if (isKm) { kmVal = parseFloat(kmInput) || 0; if (kmVal <= 0) { Alert.alert('Erro', 'Insira o KM.'); return; } }

    let calcPts = isSteps ? calculatedStepsPoints : calcWorkoutPts(selectedActivity, dur, kmVal, modalitySettings);
    let bonusMsg = '';
    const nowTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
    if (bonusConfig.despertaEnabled && nowTime <= bonusConfig.despertaLimitTime) { calcPts += parseInt(bonusConfig.despertaPts, 10) || 3000; bonusMsg += ' | ⏰ Bônus Desperta'; }
    if (bonusConfig.inquebravelEnabled) { calcPts += parseInt(bonusConfig.inquebravelPts, 10) || 5000; bonusMsg += ' | 🪨 Bônus Inquebrável'; }

    let ptsR = calcPts, ptsB = 0;
    if (selectedChallenge?.has_daily_cap && selectedChallenge?.daily_cap) {
      ptsR = Math.min(calcPts, selectedChallenge.daily_cap);
      ptsB = Math.max(0, calcPts - selectedChallenge.daily_cap);
    }

    await supabase.from('pending_workouts').insert([{
      id: `pw_${Date.now()}`, challenge_id: activeChallengeId, user_id: currentUser.id, user_name: currentUser.name, user_nickname: currentUser.nickname, user_avatar: currentUser.avatar,
      activity_type: selectedActivity.trim().toUpperCase(), caption: (workoutCaption || `Atividade de ${selectedActivity}`) + bonusMsg,
      photo_start: photoStart, photo_evidence: photoEvidence, photo_end: photoEnd, duration_minutes: dur, distance_km: kmVal, workout_date: dtStr,
      points_to_ranking: ptsR, points_to_bank: ptsB, created_at: `${dtStr} (!isSteps ? (${startHour}:${startMinute}) : '')`
    }]);

    fetchDataFromSupabase(); setIsWorkoutModalOpen(false); setKmInput(''); setWorkoutCaption(''); setPhotoStart(null); setPhotoEvidence(null); setPhotoEnd(null);
    Alert.alert('Sucesso', 'Treino enviado para aprovação!');
  }

  async function handleSaveAdvancedRules() {
    if (!selectedConfigChallengeId) return;
    const full = { modalitySettings, bonusConfig, dailyStepsConfig, tiebreakers, leaguePeriod };
    await supabase.from('challenges').update({ title: selectedChallenge.title, has_daily_cap: selectedChallenge.has_daily_cap, daily_cap: selectedChallenge.daily_cap, rules_config: full }).eq('id', selectedConfigChallengeId);
    setIsAdvancedRulesModalOpen(false); fetchDataFromSupabase();
    Alert.alert('Sucesso', 'Regras salvas!');
  }

  const handleUpdateModalityProp = (mod, prop, val) => setModalitySettings(prev => ({ ...prev, [mod]: { ...(prev[mod] || {}), [prop]: val } }));
  const handleAddTimeStep = (mod) => setModalitySettings(prev => ({ ...prev, [mod]: { ...prev[mod], timeSteps: [...(prev[mod]?.timeSteps || []), { modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }] } }));
  const handleRemoveTimeStep = (mod, idx) => setModalitySettings(prev => { const arr = [...(prev[mod]?.timeSteps || [])]; arr.splice(idx, 1); return { ...prev, [mod]: { ...prev[mod], timeSteps: arr } }; });
  const handleAddKmStep = (mod) => setModalitySettings(prev => ({ ...prev, [mod]: { ...prev[mod], kmSteps: [...(prev[mod]?.kmSteps || []), { modeType: 'De', minKm: '0', maxKm: '5', pts: '5000' }] } }));
  const handleRemoveKmStep = (mod, idx) => setModalitySettings(prev => { const arr = [...(prev[mod]?.kmSteps || [])]; arr.splice(idx, 1); return { ...prev, [mod]: { ...prev[mod], kmSteps: arr } }; });

  const getDynamicActiveRulesText = () => {
    const lines = [`• ${selectedActivity}: Modalidade Ativa`];
    if (selectedChallenge?.has_daily_cap) lines.push(`• Teto Diário: Máx ${selectedChallenge.daily_cap} pts`);
    if (bonusConfig.inquebravelEnabled) lines.push(`• Bônus Inquebrável: +${bonusConfig.inquebravelPts} pts`);
    if (bonusConfig.despertaEnabled) lines.push(`• Bônus Desperta: +${bonusConfig.despertaPts} pts (até ${bonusConfig.despertaLimitTime})`);
    return lines;
  };

  const searchResultsAthletes = memberships.filter(m => {
    if (searchFilter === 'challenge') return false;
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (m.name || '').toLowerCase().includes(term) || (m.nickname || '').toLowerCase().includes(term);
  }).reduce((acc, curr) => { if (!acc.find(i => i.userId === curr.userId)) acc.push(curr); return acc; }, []);

  const searchResultsChallenges = challenges.filter(c => {
    if (searchFilter === 'athlete') return false;
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (c.title || '').toLowerCase().includes(term) || (c.invite_code || '').toLowerCase().includes(term);
  });

  const currentChallengeMembers = memberships.filter(m => m.challengeId === activeChallengeId);
  const activeMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'active');
  const spectatorMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'spectator' || m.role === 'pending_athlete');
  const pendingCommunityMembers = currentChallengeMembers.filter(m => m.role === 'pending_community');
  const pendingAthleteMembers = currentChallengeMembers.filter(m => m.role === 'pending_athlete');
  const currentFeedPosts = feedPosts.filter(p => p.challenge_id === activeChallengeId);
  const currentPendingWorkouts = pendingWorkouts.filter(w => w.challenge_id === activeChallengeId);

  const rankedAthletes = [...activeMembersInChallenge].sort((a, b) => (b.rankingPoints || 0) - (a.rankingPoints || 0) || (b.activeDays || 0) - (a.activeDays || 0)).map((m, i) => ({ ...m, rankDisplay: `#${i + 1}` }));
  const top3Winners = [...currentChallengeMembers].filter(m => (m.goldMedals || 0) > 0).sort((a, b) => (b.goldMedals || 0) - (a.goldMedals || 0)).slice(0, 3).map(m => `${m.nickname || m.name} - ${getChampionTitle(m.goldMedals)} (${m.goldMedals}x)`);

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
    displayedPerf.silverMedals = athleteMembershipsAll.reduce((a, c) => a + (c.silverMedals || 0), 0);
    displayedPerf.bronzeMedals = athleteMembershipsAll.reduce((a, c) => a + (c.bronzeMedals || 0), 0);
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
  const countInquebravel = athleteFeedPostsAll.filter(p => (p.caption || '').toLowerCase().includes('inquebrável')).length;
  const countDesperta = athleteFeedPostsAll.filter(p => (p.caption || '').toLowerCase().includes('desperta')).length;

  const allAvailableModalities = [
    { label: 'Musculação', color: '#3b82f6' }, { label: 'Crossfit / Treino Funcional', color: '#22c55e' },
    { label: 'Aeróbico', color: '#eab308' }, { label: 'Corrida', color: '#ef4444' },
    { label: 'Caminhada', color: '#f97316' }, { label: 'Bike', color: '#a855f7' },
    { label: 'Lutas / Esportes Individuais', color: '#14b8a6' }, { label: 'Esportes Coletivos', color: '#92400e' }
  ];

  const filteredPostsByModalityPeriod = athleteFeedPostsAll.filter(p => selectedModalityPeriod === 'Todos' || (p.created_at || '').includes(selectedModalityPeriod));
  const modalityCountsMap = {};
  allAvailableModalities.forEach(m => modalityCountsMap[m.label] = 0);
  filteredPostsByModalityPeriod.forEach(p => {
    const act = (p.activity_type || '').toUpperCase();
    allAvailableModalities.forEach(m => { if (act.includes(m.label.toUpperCase())) modalityCountsMap[m.label]++; });
  });
  const totalModalityExecutions = Object.values(modalityCountsMap).reduce((a, b) => a + b, 0);
  const modalityPercentagesList = allAvailableModalities.map(m => ({ ...m, count: modalityCountsMap[m.label] || 0, percentage: totalModalityExecutions > 0 ? Math.round(((modalityCountsMap[m.label] || 0) / totalModalityExecutions) * 100) : 0 }));

  const availablePeriodsSet = new Set(['Todos']);
  athleteFeedPostsAll.forEach(p => {
    const parts = (p.created_at || '').split('/');
    if (parts.length >= 3) {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mIdx = parseInt(parts[1], 10) - 1;
      if (months[mIdx]) availablePeriodsSet.add(`${months[mIdx]}/${parts[2]}`);
    }
  });
  const availablePeriodsList = Array.from(availablePeriodsSet);

  const kmFilteredPosts = athleteFeedPostsAll.filter(p => { const a = (p.activity_type || '').toUpperCase(); return a.includes('CORRIDA') || a.includes('CAMINHADA') || a.includes('BIKE'); });
  const totalKmAccumulated = kmFilteredPosts.reduce((a, c) => a + (parseFloat(c.distance_km || 0) || 0), 0) + athleteMembershipsAll.reduce((a, c) => a + (c.totalKm || 0), 0);
  const kmButtonSubtitleText = `${totalKmAccumulated.toFixed(1)} km acumulados`;
  const kmActivitiesList = [{ label: 'Corrida', color: '#ef4444' }, { label: 'Caminhada', color: '#f97316' }, { label: 'Bike', color: '#a855f7' }];

  const kmByPeriodMap = {};
  kmFilteredPosts.forEach(p => {
    const parts = (p.created_at || '').split('/');
    let key = 'Atual';
    if (parts.length >= 3) {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mIdx = parseInt(parts[1], 10) - 1;
      if (months[mIdx]) key = `${months[mIdx]}/${parts[2].slice(-2)}`;
    }
    if (!kmByPeriodMap[key]) kmByPeriodMap[key] = { 'Corrida': 0, 'Caminhada': 0, 'Bike': 0 };
    const a = (p.activity_type || '').toUpperCase(), dist = parseFloat(p.distance_km || 0);
    if (a.includes('CORRIDA')) kmByPeriodMap[key]['Corrida'] += dist;
    else if (a.includes('CAMINHADA')) kmByPeriodMap[key]['Caminhada'] += dist;
    else if (a.includes('BIKE')) kmByPeriodMap[key]['Bike'] += dist;
  });
  const kmPeriodsArray = Object.keys(kmByPeriodMap).length > 0 ? Object.keys(kmByPeriodMap) : ['Set/26'];

  const totalMinutesAccumulated = athleteFeedPostsAll.reduce((a, c) => a + (parseInt(c.duration_minutes || 0, 10) || 0), 0) + athleteMembershipsAll.reduce((a, c) => a + (c.activeDays || 0), 0);
  const totalHoursAccumulated = (totalMinutesAccumulated / 60).toFixed(1);
  const timeButtonSubtitleText = `${totalHoursAccumulated} horas registradas`;

  const timeByPeriodMap = {};
  athleteFeedPostsAll.forEach(p => {
    const parts = (p.created_at || '').split('/');
    let key = 'Atual';
    if (parts.length >= 3) {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const mIdx = parseInt(parts[1], 10) - 1;
      if (months[mIdx]) key = `${months[mIdx]}/${parts[2].slice(-2)}`;
    }
    if (!timeByPeriodMap[key]) timeByPeriodMap[key] = 0;
    timeByPeriodMap[key] += parseInt(p.duration_minutes || 0, 10) || 0;
  });
  const timePeriodsArray = Object.keys(timeByPeriodMap).length > 0 ? Object.keys(timeByPeriodMap) : ['Set/26'];

  const isThreePhotosGroupActive = ['💪 Musculação', '🏋️ Crossfit / Treino Funcional', '🫀 Treino Aeróbico'].includes(selectedActivity);
  const isKmGroupActive = ['🏃 Corrida', '🚶 Caminhada', '🚴 Bike'].includes(selectedActivity);
  const isStepsActive = selectedActivity === '🚶‍♂️ Passos Diários';

  if (loadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e3a8a' }}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ color: '#ffffff', marginTop: 12, fontWeight: 'bold' }}>Carregando MuvFit...</Text>
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
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center', marginBottom: 16 }}>{isSignUp ? 'Criar Conta' : 'Login'}</Text>
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
            <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={passwordInput} onChangeText={setPasswordInput} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleAuthAction} disabled={authSubmitting}>
              {authSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>{isSignUp ? 'CADASTRAR' : 'ENTRAR'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 14, alignItems: 'center' }} onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' }}>{isSignUp ? 'Já tem conta? Faça Login' : 'Cadastre-se gratuitamente'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, highContrast && { backgroundColor: '#000000' }]}>
      <View style={[styles.topHeader, highContrast && { backgroundColor: '#000000', borderBottomWidth: 2, borderBottomColor: '#f97316' }]}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brandTitle}>MUVFIT</Text>
            <Text style={styles.brandSubtitle}>Mizan Soluções Técnicas</Text>
          </View>
          <TouchableOpacity style={{ backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }} onPress={handleSignOut}>
            <Text style={{ color: '#ffffff', fontSize: 9 * fontSizeScale, fontWeight: 'bold' }}>SAIR</Text>
          </TouchableOpacity>
        </View>

        {hasUserAnyCommunity && (
          <View style={styles.activeChallengeSelectorBar}>
            <Text style={styles.activeChallengeSelectorLabel}>Desafio Selecionado:</Text>
            <select style={styles.htmlHeaderSelect} value={activeChallengeId || ''} onChange={(e) => {
              const ch = challenges.find(item => item.id === e.target.value);
              if (ch) selectChallengeContext(ch, ch.creator_id === currentUser.id);
            }}>
              {challenges.map(c => (
                <option key={c.id} value={c.id}>{c.title} ({c.creator_id === currentUser.id ? 'Admin' : 'Membro'})</option>
              ))}
            </select>
          </View>
        )}

        <View style={{ width: '100%' }}>
          <TextInput style={styles.searchInput} placeholder="Pesquisar Atletas ou Ligas..." placeholderTextColor="#94a3b8" value={searchQuery} onFocus={() => setIsSearchOpen(true)} onChangeText={(t) => { setSearchQuery(t); if (!isSearchOpen) setIsSearchOpen(true); }} />
          {isSearchOpen && (
            <View style={styles.searchResultsDropdown}>
              <View style={styles.searchHeaderTop}>
                <Text style={styles.searchHeaderTitle}>Pesquisa Geral</Text>
                <TouchableOpacity onPress={() => setIsSearchOpen(false)} style={styles.closeSearchBtn}><Text style={styles.closeSearchText}>✕</Text></TouchableOpacity>
              </View>
              <View style={styles.searchFilterRow}>
                <TouchableOpacity style={[styles.searchFilterChip, searchFilter === 'all' && styles.searchFilterChipActive]} onPress={() => setSearchFilter('all')}><Text style={[styles.searchFilterChipText, searchFilter === 'all' && styles.searchFilterChipTextActive]}>Todos</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.searchFilterChip, searchFilter === 'athlete' && styles.searchFilterChipActive]} onPress={() => setSearchFilter('athlete')}><Text style={[styles.searchFilterChipText, searchFilter === 'athlete' && styles.searchFilterChipTextActive]}>Atletas</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.searchFilterChip, searchFilter === 'challenge' && styles.searchFilterChipActive]} onPress={() => setSearchFilter('challenge')}><Text style={[styles.searchFilterChipText, searchFilter === 'challenge' && styles.searchFilterChipTextActive]}>Ligas</Text></TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 200 }}>
                {(searchFilter === 'all' || searchFilter === 'athlete') && searchResultsAthletes.map(a => (
                  <TouchableOpacity key={a.userId} style={styles.searchResultItem} onPress={() => { handleOpenUserProfile(a.userId); setIsSearchOpen(false); setSearchQuery(''); }}>
                    <Image source={{ uri: a.avatar }} style={styles.avatarMini} />
                    <View style={{ marginLeft: 8 }}><Text style={styles.searchResultTitle}>{a.nickname || a.name}</Text></View>
                  </TouchableOpacity>
                ))}
                {(searchFilter === 'all' || searchFilter === 'challenge') && searchResultsChallenges.map(c => (
                  <View key={c.id} style={styles.searchResultItem}>
                    <View style={{ flex: 1 }}><Text style={styles.searchResultTitle}>{c.title}</Text></View>
                    {!memberships.some(m => m.challengeId === c.id && m.userId === currentUser.id) ? (
                      <TouchableOpacity style={styles.requestCommunityBtn} onPress={() => handleRequestCommunityEntry(c)}><Text style={styles.btnMiniText}>Entrar</Text></TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.alreadyMemberBtn} onPress={() => { selectChallengeContext(c, c.creator_id === currentUser.id); setIsSearchOpen(false); setSearchQuery(''); }}><Text style={styles.btnMiniText}>Aceder</Text></TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={[styles.sidebar, highContrast && { backgroundColor: '#111111' }]}>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'dashboard' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('dashboard')}><Text style={styles.sidebarIcon}>🏠</Text><Text style={[styles.sidebarText, currentScreen === 'dashboard' && styles.sidebarTextActive]}>Painel</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'athlete_center' && styles.sidebarBtnActive]} onPress={() => { setViewedUser(currentUser); setAthletePerfScope('global'); setCurrentScreen('athlete_center'); }}><Text style={styles.sidebarIcon}>👤</Text><Text style={[styles.sidebarText, currentScreen === 'athlete_center' && styles.sidebarTextActive]}>Atleta</Text></TouchableOpacity>
          {hasUserAnyCommunity && (
            <>
              <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'feed' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('feed')}><Text style={styles.sidebarIcon}>📷</Text><Text style={[styles.sidebarText, currentScreen === 'feed' && styles.sidebarTextActive]}>Feed</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'ranking' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('ranking')}><Text style={styles.sidebarIcon}>🏆</Text><Text style={[styles.sidebarText, currentScreen === 'ranking' && styles.sidebarTextActive]}>Ranking</Text></TouchableOpacity>
              {(selectedChallenge.creator_id === currentUser.id || adminChallenges.length > 0) && (
                <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'admin' && styles.sidebarBtnActive]} onPress={() => { setIsAdminContext(true); setCurrentScreen('admin'); }}><Text style={styles.sidebarIcon}>⚙️</Text><Text style={[styles.sidebarText, currentScreen === 'admin' && styles.sidebarTextActive]}>Admin</Text></TouchableOpacity>
              )}
            </>
          )}
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'configuracao_conta' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('configuracao_conta')}><Text style={styles.sidebarIcon}>☰</Text><Text style={[styles.sidebarText, currentScreen === 'configuracao_conta' && styles.sidebarTextActive]}>Ajustes</Text></TouchableOpacity>
        </View>

        <View style={[{ flex: 1, backgroundColor: '#ffffff' }, highContrast && { backgroundColor: '#000000' }]}>
          {currentScreen === 'dashboard' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={styles.pageTitle}>Painel Geral</Text>
                {currentUser.isAdmin && (
                  <TouchableOpacity style={styles.createChallengeBtnHeader} onPress={() => setIsCreateChallengeOpen(true)}><Text style={styles.createChallengeBtnText}>+ NOVO</Text></TouchableOpacity>
                )}
              </View>
              <Text style={styles.sectionHeaderTitle}>Suas Ligas (Admin)</Text>
              {adminChallenges.map(c => (
                <View key={c.id} style={styles.cardBox}>
                  <Text style={styles.cardBoxTitle}>{c.title}</Text>
                  <Text style={styles.cardBoxSub}>Código: {c.invite_code}</Text>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => selectChallengeContext(c, true)}><Text style={styles.primaryBtnText}>ACEDER ADMIN</Text></TouchableOpacity>
                </View>
              ))}
              <Text style={[styles.sectionHeaderTitle, { marginTop: 12 }]}>Participando</Text>
              {participantChallenges.map(c => (
                <View key={c.id} style={styles.cardBox}>
                  <Text style={styles.cardBoxTitle}>{c.title}</Text>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => selectChallengeContext(c, false)}><Text style={styles.primaryBtnText}>ACEDER LIGA</Text></TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {currentScreen === 'configuracao_conta' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={styles.pageTitle}>Configuração de Conta</Text>
              <View style={styles.cardBox}>
                <TextInput style={styles.input} editable={false} value={session?.user?.email || ''} />
                <TextInput style={styles.input} placeholder="Nova Senha" secureTextEntry value={accountNewPassword} onChangeText={setAccountNewPassword} />
                <TouchableOpacity style={styles.primaryBtn} onPress={handleChangePassword}><Text style={styles.primaryBtnText}>ALTERAR SENHA</Text></TouchableOpacity>
                <TouchableOpacity style={styles.dashboardActionBtnRed} onPress={handleDeleteAccountConfirmation}><Text style={styles.dashboardActionBtnText}>DELETAR CONTA</Text></TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {currentScreen === 'feed' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.pageTitle}>Feed — {selectedChallenge.title}</Text>
                <TouchableOpacity style={styles.inviteBtn} onPress={() => handleShareInvite(selectedChallenge)}><Text style={styles.btnMiniText}>CONVIDAR</Text></TouchableOpacity>
              </View>
              {currentUserMembershipInActiveChallenge?.role === 'active' ? (
                <TouchableOpacity style={styles.actionBtn} onPress={() => setIsWorkoutModalOpen(true)}><Text style={styles.actionBtnText}>+ REGISTRAR TREINO</Text></TouchableOpacity>
              ) : (
                <View style={styles.restrictedNoticeBox}><Text style={styles.restrictedNoticeText}>Acompanhando como Torcedor. Solicite participação como Atleta Ativo no Ranking.</Text></View>
              )}
              {currentFeedPosts.map(post => (
                <View key={post.id} style={styles.postCard}>
                  <TouchableOpacity style={styles.postHeader} onPress={() => handleOpenUserProfile(post.user_id)}>
                    <Image source={{ uri: post.user_avatar }} style={styles.avatarMini} />
                    <View style={{ marginLeft: 8 }}><Text style={styles.postAuthor}>{post.user_nickname || post.user_name}</Text><Text style={styles.postTime}>{post.created_at}</Text></View>
                  </TouchableOpacity>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.pageTitle}>Ranking</Text>
                {!currentUserMembershipInActiveChallenge && (
                  <TouchableOpacity style={styles.blueRequestAthleteBtn} onPress={handleRequestAthleteActive}><Text style={styles.btnMiniText}>SOLICITAR ATLETA</Text></TouchableOpacity>
                )}
              </View>
              {rankedAthletes.map(m => (
                <TouchableOpacity key={m.userId} style={styles.rankingRowCard} onPress={() => handleOpenUserProfile(m.userId)}>
                  <Text style={styles.rankingPosNumber}>{m.rankDisplay}</Text>
                  <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                  <View style={{ flex: 1, marginLeft: 8 }}><Text style={styles.rankingMemberName}>{m.nickname || m.name}</Text></View>
                  <Text style={styles.rankingMemberPts}>{(m.rankingPoints || 0).toLocaleString()} pts</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {currentScreen === 'athlete_center' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.profileHeaderCard}>
                <Image source={{ uri: viewedUser.avatar }} style={styles.avatarLarge} />
                <Text style={styles.profileNicknameDisplay}>{viewedUser.nickname || viewedUser.name}</Text>
                {viewedUser.id === currentUser.id && (
                  <TouchableOpacity style={styles.editProfileBtn} onPress={handleOpenEditProfile}><Text style={styles.editProfileBtnText}>EDITAR PERFIL</Text></TouchableOpacity>
                )}
                <View style={styles.scoreRowContainer}>
                  <View style={styles.scoreBoxItem}><Text style={styles.scoreNumber}>{displayedPerf.rankingPoints.toLocaleString()}</Text><Text style={styles.scoreLabel}>PONTOS</Text></View>
                  <View style={styles.scoreBoxItem}><Text style={styles.scoreNumber}>{displayedPerf.totalSteps.toLocaleString()}</Text><Text style={styles.scoreLabel}>PASSOS</Text></View>
                </View>
              </View>
            </ScrollView>
          )}

          {currentScreen === 'admin' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>Central Admin: {selectedChallenge.title}</Text>
              </View>
              <View style={styles.accordionCard}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedSec1(!expandedSec1)}><Text style={styles.accordionTitle}>Treinos Pendentes ({currentPendingWorkouts.length})</Text></TouchableOpacity>
                {expandedSec1 && currentPendingWorkouts.map(w => (
                  <View key={w.id} style={styles.workoutPendingCard}>
                    <Text>{w.user_nickname} - {w.activity_type}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveWorkout(w.id)}><Text style={styles.btnMiniText}>APROVAR</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.banBtn} onPress={() => handleRejectWorkout(w.id)}><Text style={styles.btnMiniText}>REJEITAR</Text></TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.accordionCard}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedSec5(!expandedSec5)}><Text style={styles.accordionTitle}>Configuração Avançada</Text></TouchableOpacity>
                {expandedSec5 && (
                  <View style={styles.accordionBody}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setIsAdvancedRulesModalOpen(true)}><Text style={styles.actionBtnText}>EDITAR REGRAS DA LIGA</Text></TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* MODAL DE TREINO */}
      <Modal visible={isWorkoutModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={{ maxHeight: 500 }}>
              <Text style={styles.modalTitle}>Registrar Treino</Text>
              <select style={styles.htmlNativeSelect} value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)}>
                {modalitiesList.filter(m => m.value !== '🎁 Bônus e Critérios de Desempate' && m.value !== '🏛️ Base da Liga').map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              {isKmGroupActive && <TextInput style={styles.input} placeholder="Distância (KM)" keyboardType="decimal-pad" value={kmInput} onChangeText={setKmInput} />}
              <TextInput style={styles.input} placeholder="Legenda..." value={workoutCaption} onChangeText={setWorkoutCaption} />
              <TouchableOpacity style={styles.photoBtn} onPress={() => handleTriggerPhoto('camera', setPhotoEvidence)}><Text style={styles.photoBtnText}>TIRAR FOTO</Text></TouchableOpacity>
              {photoEvidence && <Image source={{ uri: photoEvidence }} style={styles.photoPreviewMini} />}
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitWorkout}><Text style={styles.primaryBtnText}>ENVIAR</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsWorkoutModalOpen(false)}><Text style={styles.cancelBtnText}>CANCELAR</Text></TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL EDITAR PERFIL */}
      <Modal visible={isEditProfileOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <TextInput style={styles.input} placeholder="Nome Completo" value={editFullName} onChangeText={setEditFullName} />
            <TextInput style={styles.input} placeholder="Apelido" value={editNickname} onChangeText={setEditNickname} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile}><Text style={styles.primaryBtnText}>SALVAR</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditProfileOpen(false)}><Text style={styles.cancelBtnText}>CANCELAR</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL CRIAR LIGA */}
      <Modal visible={isCreateChallengeOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Liga</Text>
            <TextInput style={styles.input} placeholder="Nome do Desafio" value={newChallengeTitle} onChangeText={setNewChallengeTitle} />
            <TextInput style={styles.input} placeholder="Código" autoCapitalize="characters" value={newChallengeCode} onChangeText={setNewChallengeCode} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateChallenge}><Text style={styles.primaryBtnText}>CRIAR</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreateChallengeOpen(false)}><Text style={styles.cancelBtnText}>CANCELAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL REGRAS AVANÇADAS */}
      <Modal visible={isAdvancedRulesModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>Configuração Avançada</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveAdvancedRules}><Text style={styles.primaryBtnText}>SALVAR REGRAS</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAdvancedRulesModalOpen(false)}><Text style={styles.cancelBtnText}>FECHAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  topHeader: { padding: 12, backgroundColor: '#1e3a8a', zIndex: 10 },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  brandTitle: { fontSize: 20, fontWeight: '900', color: '#f97316' },
  brandSubtitle: { fontSize: 10, fontWeight: 'bold', color: '#ffffff' },
  activeChallengeSelectorBar: { backgroundColor: '#172554', padding: 6, borderRadius: 6, marginBottom: 6 },
  activeChallengeSelectorLabel: { fontSize: 9, color: '#f97316', fontWeight: 'bold', marginBottom: 2 },
  htmlHeaderSelect: { width: '100%', padding: 8, fontSize: 10, fontWeight: 'bold', color: '#1e3a8a', backgroundColor: '#ffffff', borderRadius: 6 },
  searchInput: { backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 11, color: '#0f172a', borderWidth: 1, borderColor: '#cbd5e1' },
  searchResultsDropdown: { position: 'absolute', top: 40, left: 0, right: 0, backgroundColor: '#ffffff', borderRadius: 8, padding: 10, borderWidth: 2, borderColor: '#f97316', zIndex: 999 },
  searchHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  searchHeaderTitle: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' },
  closeSearchBtn: { padding: 4 },
  closeSearchText: { fontSize: 10, color: '#dc2626', fontWeight: 'bold' },
  searchFilterRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  searchFilterChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  searchFilterChipActive: { backgroundColor: '#1e3a8a' },
  searchFilterChipText: { fontSize: 9, fontWeight: 'bold', color: '#475569' },
  searchFilterChipTextActive: { color: '#ffffff' },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  searchResultTitle: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },
  requestCommunityBtn: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  alreadyMemberBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  blueRequestAthleteBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  sidebar: { width: 110, backgroundColor: '#f8fafc', borderRightWidth: 1, borderRightColor: '#cbd5e1', paddingVertical: 10 },
  sidebarBtn: { paddingVertical: 12, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  sidebarBtnActive: { backgroundColor: '#ffffff', borderLeftWidth: 4, borderLeftColor: '#f97316' },
  sidebarIcon: { fontSize: 12 },
  sidebarText: { fontSize: 9, fontWeight: 'bold', color: '#64748b' },
  sidebarTextActive: { color: '#f97316' },
  mainContent: { padding: 12 },
  pageTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginVertical: 8 },
  sectionHeaderTitle: { fontSize: 12, fontWeight: 'bold', color: '#f97316', marginVertical: 6 },
  createChallengeBtnHeader: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  createChallengeBtnText: { color: '#ffffff', fontSize: 9, fontWeight: 'bold' },
  cardBox: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  cardBoxTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  cardBoxSub: { fontSize: 10, color: '#64748b', marginVertical: 2 },
  dashboardActionBtnRed: { backgroundColor: '#dc2626', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  dashboardActionBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  adminControlCard: { backgroundColor: '#fff7ed', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#f97316', marginBottom: 12 },
  adminCardTitle: { fontSize: 12, fontWeight: 'bold', color: '#c2410c' },
  accordionCard: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10, overflow: 'hidden' },
  accordionHeader: { backgroundColor: '#f8fafc', padding: 12 },
  accordionTitle: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' },
  accordionBody: { padding: 12 },
  workoutPendingCard: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  photoPreviewMini: { width: 80, height: 80, borderRadius: 4, marginVertical: 4 },
  photoBtn: { backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, alignItems: 'center', marginVertical: 4 },
  photoBtnText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },
  approveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  banBtn: { backgroundColor: '#dc2626', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  inviteBtn: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
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
  profileHeaderCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10 },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, marginBottom: 6, borderWidth: 2, borderColor: '#f97316' },
  profileNicknameDisplay: { fontSize: 16, fontWeight: '900', color: '#1e3a8a', marginBottom: 2 },
  editProfileBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginVertical: 6 },
  editProfileBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  scoreRowContainer: { flexDirection: 'row', gap: 8, width: '100%', marginVertical: 8, justifyContent: 'center' },
  scoreBoxItem: { flex: 1, backgroundColor: '#ffffff', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  scoreNumber: { fontSize: 14, fontWeight: '900', color: '#f97316' },
  scoreLabel: { fontSize: 8, fontWeight: 'bold', color: '#1e3a8a', marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 14 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, maxHeight: '90%' },
  modalContentLarge: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, maxHeight: '95%', width: '95%', alignSelf: 'center' },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 10, textAlign: 'center' },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 6, fontSize: 11, marginBottom: 6 },
  htmlNativeSelect: { width: '100%', padding: 10, fontSize: 11, fontWeight: 'bold', color: '#0f172a', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6 },
  cancelBtn: { marginTop: 6, paddingVertical: 4, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' },
  chipBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  chipBtnActive: { backgroundColor: '#f97316' },
  chipText: { fontSize: 9, fontWeight: 'bold', color: '#475569' },
  chipTextActive: { color: '#ffffff' }
});
