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

function calculateAge(birthDateString) {
  if (!birthDateString || birthDateString.length < 10) return null;
  const parts = birthDateString.split('/');
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);

  const birthDate = new Date(year, month, day);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

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
    if (isRenewal) {
      const dayOfWeek = referenceDate.getDay();
      startDateObj.setDate(referenceDate.getDate() - dayOfWeek);
    }
    const dayOfWeek = startDateObj.getDay();
    const distanceToSaturday = 6 - dayOfWeek;
    endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + distanceToSaturday);
  } else if (periodType === 'Yearly') {
    if (isRenewal) {
      startDateObj = new Date(year, 0, 1);
    }
    endDateObj = new Date(year, 11, 31);
  } else {
    if (isRenewal) {
      startDateObj = new Date(year, month, 1);
    }
    endDateObj = new Date(year, month + 1, 0);
  }

  return {
    startDateStr: formatDateBR(startDateObj),
    endDateStr: formatDateBR(endDateObj),
    startDateObj,
    endDateObj
  };
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

  // Histórico de peso iniciado vazio conforme solicitado pelo utilizador
  const [weightHistoryList, setWeightHistoryList] = useState([]);
  const [isWeightChartModalOpen, setIsWeightChartModalOpen] = useState(false);
  const [newWeightPeriodInput, setNewWeightPeriodInput] = useState('');
  const [newWeightValueInput, setNewWeightValueInput] = useState('');

  const [isModalityRadarModalOpen, setIsModalityRadarModalOpen] = useState(false);
  const [isKmChartModalOpen, setIsKmChartModalOpen] = useState(false);
  const [isTimeChartModalOpen, setIsTimeChartModalOpen] = useState(false);

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [newWeightInput, setNewWeightInput] = useState('');

  const [personalGoals, setPersonalGoals] = useState([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoalText, setNewGoalText] = useState('');

  const [isAllEvidencesModalOpen, setIsAllEvidencesModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState({
    id: '',
    name: '',
    nickname: '',
    birth_date: '',
    age: 0,
    gender: 'Masculino',
    avatar: 'https://picsum.photos/seed/poke/200/200',
    isAdmin: true,
    goldMedals: 0,
    silverMedals: 0,
    bronzeMedals: 0
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

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0] || {};

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
  const [stepsInput, setStepsInput] = useState('');
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
    enabled: true,
    enableRankingScore: true,
    manualStepsInput: '10000',
    multiplier: '0.5'
  });

  const [bonusConfig, setBonusConfig] = useState({
    inquebravelEnabled: true,
    inquebravelDays: '3',
    inquebravelPts: '5000',
    despertaEnabled: true,
    despertaLimitTime: '08:00',
    despertaPts: '3000'
  });

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
    { id: 'activeDays', label: 'Dias em atividade', enabled: true, order: 4 }
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

    if (cleaned.length >= 5) {
      cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
    } else if (cleaned.length >= 3) {
      cleaned = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    return cleaned;
  };

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

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      setAthleteStories(prev => prev.filter(st => now - st.createdAt < twentyFourHours));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let timer;
    if (activeStoryView) {
      timer = setTimeout(() => {
        setActiveStoryView(null);
      }, 30000);
    }
    return () => clearTimeout(timer);
  }, [activeStoryView]);

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
          avatar: data.avatar_url || `https://picsum.photos/seed/${data.id}/200/200`,
          isAdmin: true,
          goldMedals: data.gold_medals || 0,
          silverMedals: data.silver_medals || 0,
          bronzeMedals: data.bronze_medals || 0
        };
        setCurrentUser(loadedUser);
        setViewedUser(loadedUser);
      } else {
        const fallbackName = userEmail ? userEmail.split('@')[0] : 'Atleta';
        const loadedUser = {
          id: userId,
          name: fallbackName,
          nickname: fallbackName,
          birth_date: '',
          age: 0,
          gender: 'Masculino',
          avatar: `https://picsum.photos/seed/${userId}/200/200`,
          isAdmin: true,
          goldMedals: 0,
          silverMedals: 0,
          bronzeMedals: 0
        };
        setCurrentUser(loadedUser);
        setViewedUser(loadedUser);
      }
    } catch (err) {
      console.log('Erro ao buscar perfil:', err);
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
        if (!fullNameInput.trim()) {
          Alert.alert('Campo Obrigatório', 'Por favor, preencha o seu Nome Completo.');
          setAuthSubmitting(false);
          return;
        }

        const cleanName = fullNameInput.trim();

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailInput.trim(),
          password: passwordInput.trim(),
          options: {
            data: {
              full_name: cleanName,
              nickname: cleanName,
              gender: genderInput
            }
          }
        });

        if (authError) {
          Alert.alert('Erro no Cadastro', authError.message);
          setAuthSubmitting(false);
          return;
        }

        if (authData?.session) {
          setSession(authData.session);
          await fetchUserProfile(authData.session.user.id, authData.session.user.email);
          await fetchDataFromSupabase();
          setAuthSubmitting(false);
          return;
        }

        if (authData?.user) {
          await supabase.from('profiles').upsert([
            {
              id: authData.user.id,
              full_name: cleanName,
              nickname: cleanName,
              gender: genderInput
            }
          ], { onConflict: 'id' }).catch(err => console.log('Aviso profiles ignorado:', err));
        }

        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: emailInput.trim(),
          password: passwordInput.trim(),
        });

        if (loginError) {
          Alert.alert('Conta Criada!', 'Por favor, faça o login com seu e-mail e senha.');
          setIsSignUp(false);
        } else if (loginData.session) {
          setSession(loginData.session);
          await fetchUserProfile(loginData.session.user.id, loginData.session.user.email);
          await fetchDataFromSupabase();
        }
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
      Alert.alert('Erro Inesperado', err.message || 'Ocorreu um erro de conexão.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  function handleOpenEditProfile() {
    setEditFullName(currentUser.name || '');
    setEditNickname(currentUser.nickname || '');
    setEditBirthDate(currentUser.birth_date || '');
    setEditGender(currentUser.gender || 'Masculino');
    setEditAvatar(currentUser.avatar || '');
    setIsEditProfileOpen(true);
  }

  async function handleSaveProfile() {
    if (!editNickname.trim() || !editFullName.trim()) {
      Alert.alert('Atenção', 'Nome e Apelido não podem ficar vazios.');
      return;
    }

    setSavingProfile(true);

    try {
      let finalAvatarUrl = editAvatar;

      if (editAvatar && editAvatar.startsWith('data:image')) {
        try {
          const fileExt = editAvatar.substring("data:image/".length, editAvatar.indexOf(";base64")) || 'jpeg';
          const fileName = `${currentUser.id}_${Date.now()}.${fileExt}`;
          
          const response = await fetch(editAvatar);
          const blob = await response.blob();

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, blob, { contentType: `image/${fileExt}`, upsert: true });

          if (uploadError) {
            console.log('Erro no upload da imagem:', uploadError);
            finalAvatarUrl = currentUser.avatar;
          } else {
            const { data: publicUrlData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            
            finalAvatarUrl = publicUrlData.publicUrl;
          }
        } catch (imgErr) {
          console.log('Falha ao processar imagem:', imgErr);
          finalAvatarUrl = currentUser.avatar;
        }
      }

      let dbBirthDate = null;
      let computedAge = 0;

      if (editBirthDate && editBirthDate.length === 10) {
        const parts = editBirthDate.split('/');
        if (parts.length === 3) {
          dbBirthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          computedAge = calculateAge(editBirthDate) || 0;
        }
      }

      const profilePayload = {
        id: currentUser.id,
        full_name: editFullName.trim(),
        nickname: editNickname.trim(),
        gender: editGender,
        avatar_url: finalAvatarUrl
      };

      if (dbBirthDate) {
        profilePayload.birth_date = dbBirthDate;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([profilePayload], { onConflict: 'id' });

      if (profileError) {
        throw new Error('Erro na tabela profiles: ' + profileError.message);
      }

      await supabase
        .from('memberships')
        .update({
          name: editFullName.trim(),
          nickname: editNickname.trim(),
          avatar: finalAvatarUrl,
          age: computedAge,
          gender: editGender
        })
        .eq('user_id', currentUser.id);

      const updatedUser = {
        ...currentUser,
        name: editFullName.trim(),
        nickname: editNickname.trim(),
        birth_date: editBirthDate,
        age: computedAge,
        gender: editGender,
        avatar: finalAvatarUrl
      };

      setCurrentUser(updatedUser);
      setViewedUser(updatedUser);
      setIsEditProfileOpen(false);

      await fetchDataFromSupabase();
      Alert.alert('🎉 Sucesso!', 'Perfil atualizado com sucesso!');

    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      Alert.alert('Erro ao Salvar', err.message || 'Ocorreu um erro ao atualizar o perfil.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  async function fetchDataFromSupabase() {
    try {
      const { data: challengesData } = await supabase.from('challenges').select('*');
      if (challengesData && challengesData.length > 0) {
        const formattedChallenges = challengesData.map(c => ({
          ...c,
          startDate: c.start_date,
          endDate: c.end_date,
          tiebreakerEnabled: c.tiebreaker_enabled
        }));
        setChallenges(formattedChallenges);
        
        const currentSelectedId = activeChallengeId || formattedChallenges[0].id;
        if (!activeChallengeId) {
          setActiveChallengeId(formattedChallenges[0].id);
        }
        if (!selectedConfigChallengeId) {
          setSelectedConfigChallengeId(formattedChallenges[0].id);
        }

        const activeCh = formattedChallenges.find(c => c.id === currentSelectedId) || formattedChallenges[0];
        if (activeCh && activeCh.rules_config) {
          if (activeCh.rules_config.modalitySettings) setModalitySettings(activeCh.rules_config.modalitySettings);
          if (activeCh.rules_config.bonusConfig) setBonusConfig(activeCh.rules_config.bonusConfig);
          if (activeCh.rules_config.dailyStepsConfig) setDailyStepsConfig(activeCh.rules_config.dailyStepsConfig);
          if (activeCh.rules_config.tiebreakers) setTiebreakers(activeCh.rules_config.tiebreakers);
          if (activeCh.rules_config.leaguePeriod) setLeaguePeriod(activeCh.rules_config.leaguePeriod);
        }

      } else {
        setChallenges([]);
        setActiveChallengeId(null);
        setSelectedConfigChallengeId(null);
      }

      const { data: membersData } = await supabase.from('memberships').select('*');
      if (membersData) {
        const formattedMembers = membersData.map(m => ({
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
        }));
        setMemberships(formattedMembers);
      }

      const { data: feedData } = await supabase.from('feed_posts').select('*');
      if (feedData) setFeedPosts(feedData);

      const { data: pendingData } = await supabase.from('pending_workouts').select('*');
      if (pendingData) setPendingWorkouts(pendingData);

    } catch (err) {
      console.log('Erro ao carregar do Supabase:', err);
    }
  }

  const userMembershipsAll = memberships.filter(m => m.userId === currentUser.id);
  const adminChallenges = challenges.filter(c => c.creator_id === currentUser.id);
  const participantChallenges = challenges.filter(c => {
    return memberships.some(m => m.challengeId === c.id && m.userId === currentUser.id) && c.creator_id !== currentUser.id;
  });

  const currentUserMembershipInActiveChallenge = memberships.find(
    m => m.challengeId === activeChallengeId && m.userId === currentUser.id
  );

  const hasUserAnyCommunity = userMembershipsAll.length > 0 || adminChallenges.length > 0;

  const handleShareInvite = async (challenge) => {
    const inviteUrl = `https://muvfit.vercel.app/convite?codigo=${challenge.invite_code}`;
    const message = 
      `🏃‍♂️ *Convite MuvFit* 🏃‍♀️\n\n` +
      `Você foi convidado para participar da *${challenge.title}*!\n\n` +
      `Acesse o link abaixo para entrar na comunidade da liga:\n${inviteUrl}`;

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
    
    if (challenge.rules_config) {
      if (challenge.rules_config.modalitySettings) setModalitySettings(challenge.rules_config.modalitySettings);
      if (challenge.rules_config.bonusConfig) setBonusConfig(challenge.rules_config.bonusConfig);
      if (challenge.rules_config.dailyStepsConfig) setDailyStepsConfig(challenge.rules_config.dailyStepsConfig);
      if (challenge.rules_config.tiebreakers) setTiebreakers(challenge.rules_config.tiebreakers);
      if (challenge.rules_config.leaguePeriod) setLeaguePeriod(challenge.rules_config.leaguePeriod);
    }

    if (asAdmin) {
      setCurrentScreen('admin');
    } else {
      setCurrentScreen('feed');
    }
  }

  function handleOpenUserProfile(userId) {
    const found = memberships.find(m => m.userId === userId);
    if (found) {
      setViewedUser(found);
    } else {
      setViewedUser(currentUser);
    }
    setAthletePerfScope('global');
    setCurrentScreen('athlete_center');
  }

  async function handleRequestCommunityEntry(challenge) {
    const existing = memberships.find(m => m.challengeId === challenge.id && m.userId === currentUser.id);
    if (existing) {
      Alert.alert('Atenção', 'Você já possui uma solicitação ou inscrição nesta liga.');
      return;
    }

    const newMembership = {
      challenge_id: challenge.id,
      user_id: currentUser.id,
      name: currentUser.name,
      nickname: currentUser.nickname,
      role: 'pending_community',
      ranking_points: 0,
      bank_points: 0,
      total_steps: 0,
      avatar: currentUser.avatar,
      age: currentUser.age,
      gender: currentUser.gender
    };

    await supabase.from('memberships').insert([newMembership]);
    fetchDataFromSupabase();
    setIsSearchOpen(false);
    setSearchQuery('');

    Alert.alert(
      '📩 Solicitação Enviada!',
      `Sua solicitação de entrada na comunidade da liga "${challenge.title}" foi enviada para o Administrador.`
    );
  }

  async function handleRequestAthleteActive() {
    if (!activeChallengeId || !selectedChallenge?.id) {
      Alert.alert('Erro', 'Selecione um desafio válido antes de solicitar.');
      return;
    }

    try {
      const { data: existingMember, error: fetchErr } = await supabase
        .from('memberships')
        .select('id, role')
        .eq('challenge_id', selectedChallenge.id)
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (fetchErr) {
        console.log('Erro ao consultar membership:', fetchErr);
      }

      let error = null;

      if (existingMember && existingMember.id) {
        const res = await supabase
          .from('memberships')
          .update({
            role: 'pending_athlete',
            name: currentUser.name,
            nickname: currentUser.nickname,
            avatar: currentUser.avatar,
            age: currentUser.age || 0,
            gender: currentUser.gender || 'Masculino'
          })
          .eq('id', existingMember.id);
        
        error = res.error;
      } else {
        const res = await supabase
          .from('memberships')
          .insert([
            {
              challenge_id: selectedChallenge.id,
              user_id: currentUser.id,
              name: currentUser.name,
              nickname: currentUser.nickname,
              avatar: currentUser.avatar,
              role: 'pending_athlete',
              ranking_points: 0,
              bank_points: 0,
              total_steps: 0,
              age: currentUser.age || 0,
              gender: currentUser.gender || 'Masculino'
            }
          ]);

        error = res.error;
      }

      if (error) {
        Alert.alert('Erro ao solicitar', error.message || 'Não foi possível atualizar o status no Supabase.');
        return;
      }

      await fetchDataFromSupabase();

      Alert.alert(
        '⏳ Aprovação Pendente!',
        `Sua solicitação para ser Atleta Ativo no "${selectedChallenge.title}" foi enviada.`
      );
    } catch (err) {
      Alert.alert('Erro Inesperado', err.message || 'Não foi possível enviar a solicitação.');
    }
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

    const newComments = [
      ...(post.comments || []),
      { id: `c_${Date.now()}`, user: currentUser.nickname, text: commentText.trim() }
    ];

    setFeedPosts(feedPosts.map(p => p.id === postId ? { ...p, comments: newComments } : p));
    setCommentInputs({ ...commentInputs, [postId]: '' });

    await supabase.from('feed_posts').update({ comments: newComments }).eq('id', postId);
  }

  async function handleCreateChallenge() {
    if (!newChallengeTitle.trim() || !newChallengeCode.trim()) {
      Alert.alert('Erro', 'Preencha o Nome e o Código do Desafio.');
      return;
    }

    const newId = `c_${Date.now()}`;
    const initialRulesConfig = {
      modalitySettings,
      bonusConfig,
      dailyStepsConfig,
      tiebreakers,
      leaguePeriod: newChallengePeriod
    };

    const dates = calculateSeasonDates(newChallengePeriod, false, new Date());

    const newObj = {
      id: newId,
      title: newChallengeTitle.trim(),
      invite_code: newChallengeCode.trim().toUpperCase(),
      creator_id: currentUser.id,
      has_daily_cap: hasCapToggle,
      daily_cap: hasCapToggle ? (parseInt(newChallengeCap, 10) || 22000) : null,
      registrations_closed: false,
      is_finished: false,
      start_date: dates.startDateStr,
      end_date: dates.endDateStr,
      tiebreaker_enabled: true,
      rules_config: initialRulesConfig
    };

    await supabase.from('challenges').insert([newObj]);

    const newMembership = {
      challenge_id: newId,
      user_id: currentUser.id,
      name: currentUser.name,
      nickname: currentUser.nickname,
      role: 'spectator',
      ranking_points: 0,
      bank_points: 0,
      total_steps: 0,
      avatar: currentUser.avatar,
      gold_medals: 0,
      silver_medals: 0,
      bronze_medals: 0,
      age: currentUser.age,
      gender: currentUser.gender
    };

    await supabase.from('memberships').insert([newMembership]);

    fetchDataFromSupabase();
    setIsCreateChallengeOpen(false);
    setNewChallengeTitle('');
    setNewChallengeCode('');
    
    setActiveChallengeId(newId);
    setSelectedConfigChallengeId(newId);
    setIsAdminContext(true);
    setCurrentScreen('admin');

    Alert.alert('Sucesso', `Liga criada com sucesso! Vigência inicial: ${dates.startDateStr} até ${dates.endDateStr}`);
  }

  async function handleDeleteChallenge(challengeId) {
    const challengeToDelete = challenges.find(c => c.id === challengeId);
    if (!challengeToDelete) return;

    const confirmDelete = Platform.OS === 'web'
      ? window.confirm(`Tem certeza de que deseja EXCLUIR definitivamente a liga "${challengeToDelete.title}"?`)
      : true;

    if (!confirmDelete) return;

    try {
      await supabase.from('pending_workouts').delete().eq('challenge_id', challengeId);
      await supabase.from('feed_posts').delete().eq('challenge_id', challengeId);
      await supabase.from('memberships').delete().eq('challenge_id', challengeId);

      const { error } = await supabase.from('challenges').delete().eq('id', challengeId);

      if (error) {
        Alert.alert('Erro ao Excluir', error.message);
        return;
      }

      await fetchDataFromSupabase();
      setCurrentScreen('dashboard');

      if (Platform.OS === 'web') {
        window.alert(`Liga "${challengeToDelete.title}" excluída com sucesso!`);
      } else {
        Alert.alert('Desafio Excluído', `A liga "${challengeToDelete.title}" foi removida.`);
      }
    } catch (err) {
      Alert.alert('Erro Inesperado', 'Não foi possível excluir o desafio.');
    }
  }

  async function handleFinishChallenge(challengeId) {
    const targetChallenge = challenges.find(c => c.id === challengeId);
    if (!targetChallenge) return;

    const challengeMembers = memberships.filter(m => m.challengeId === challengeId && m.role === 'active');
    const sorted = [...challengeMembers].sort((a, b) => (b.rankingPoints || 0) - (a.rankingPoints || 0));

    if (sorted[0]) {
      const newGold = (sorted[0].goldMedals || 0) + 1;
      await supabase.from('memberships').update({ gold_medals: newGold }).eq('id', sorted[0].id);
      await supabase.from('profiles').update({ gold_medals: newGold }).eq('id', sorted[0].userId);
    }
    if (sorted[1]) {
      const newSilver = (sorted[1].silverMedals || 0) + 1;
      await supabase.from('memberships').update({ silver_medals: newSilver }).eq('id', sorted[1].id);
      await supabase.from('profiles').update({ silver_medals: newSilver }).eq('id', sorted[1].userId);
    }
    if (sorted[2]) {
      const newBronze = (sorted[2].bronzeMedals || 0) + 1;
      await supabase.from('memberships').update({ bronze_medals: newBronze }).eq('id', sorted[2].id);
      await supabase.from('profiles').update({ bronze_medals: newBronze }).eq('id', sorted[2].userId);
    }

    await supabase.from('memberships').update({ 
      role: 'spectator', 
      ranking_points: 0, 
      bank_points: 0,
      total_steps: 0,
      total_km: 0
    }).eq('challenge_id', challengeId);

    const period = targetChallenge.rules_config?.leaguePeriod || 'Monthly';
    const nextDayDate = new Date();
    nextDayDate.setDate(nextDayDate.getDate() + 1);

    const newSeasonDates = calculateSeasonDates(period, true, nextDayDate);

    await supabase.from('challenges').update({ 
      is_finished: false, 
      registrations_closed: false,
      start_date: newSeasonDates.startDateStr,
      end_date: newSeasonDates.endDateStr
    }).eq('id', challengeId);

    fetchDataFromSupabase();
    Alert.alert(
      '🏆 Temporada Encerrada!', 
      `As medalhas foram distribuídas! Nova Época Iniciada: ${newSeasonDates.startDateStr} até ${newSeasonDates.endDateStr}`
    );
  }

  async function toggleChallengeRegistrations() {
    const newStatus = !selectedChallenge.registrations_closed;
    await supabase.from('challenges').update({ registrations_closed: newStatus }).eq('id', selectedChallenge.id);
    fetchDataFromSupabase();
    Alert.alert('Status Atualizado', newStatus ? 'Inscrições/Candidaturas ENCERRADAS!' : 'Inscrições/Candidaturas ABERTAS!');
  }

  async function handleUpdateAthleteStatus(memberId, newRole) {
    await supabase.from('memberships').update({ role: newRole }).eq('id', memberId);
    fetchDataFromSupabase();
    
    if (newRole === 'active') {
      Alert.alert('Aprovação Efetuada', 'O participante agora é um ⚡ Atleta Ativo na liga!');
    } else if (newRole === 'spectator') {
      Alert.alert('Status Atualizado', 'O participante agora é um 👀 Torcedor.');
    } else {
      Alert.alert('Solicitação Recusada', 'A candidatura a Atleta Ativo foi rejeitada.');
    }
  }

  async function handleApproveCommunityMember(memberId) {
    await supabase.from('memberships').update({ role: 'spectator' }).eq('id', memberId);
    fetchDataFromSupabase();
    Alert.alert('Membro Aprovado!', 'O participante foi aceito na Comunidade da Liga como Torcedor.');
  }

  async function handleRejectCommunityMember(memberId) {
    await supabase.from('memberships').delete().eq('id', memberId);
    fetchDataFromSupabase();
    Alert.alert('Entrada Recusada', 'A solicitação de entrada na comunidade foi recusada.');
  }

  async function handleRemoveMemberFromCommunity(memberId) {
    await supabase.from('memberships').delete().eq('id', memberId);
    fetchDataFromSupabase();
    Alert.alert('Removido', 'O participante foi removido da comunidade.');
  }

  async function handleManualPointsSubmit() {
    if (!manualSelectedAthleteId) {
      Alert.alert('Atenção', 'Selecione um Atleta Ativo.');
      return;
    }

    const rPts = parseInt(manualRankingPts, 10) || 0;
    const bPts = parseInt(manualBankPts, 10) || 0;
    const sPts = parseInt(manualSteps, 10) || 0;

    let bonusTotal = 0;
    if (checkBonusInquebravel) bonusTotal += parseInt(bonusConfig.inquebravelPts, 10) || 5000;
    if (checkBonusDesperta) bonusTotal += parseInt(bonusConfig.despertaPts, 10) || 3000;

    if (rPts === 0 && bPts === 0 && sPts === 0 && bonusTotal === 0) {
      Alert.alert('Preencha ao menos um valor', 'Insira pontos de ranking, banco, passos ou selecione um bônus.');
      return;
    }

    const member = memberships.find(m => m.id === manualSelectedAthleteId);
    if (!member) return;

    const newRankingTotal = (member.rankingPoints || 0) + rPts + bonusTotal;
    const newBankTotal = (member.bankPoints || 0) + bPts;
    const newStepsTotal = (member.totalSteps || 0) + sPts;

    await supabase.from('memberships').update({
      ranking_points: newRankingTotal,
      bank_points: newBankTotal,
      total_steps: newStepsTotal
    }).eq('id', manualSelectedAthleteId);

    let captionExtras = [];
    if (checkBonusInquebravel) captionExtras.push('Bônus O Inquebrável');
    if (checkBonusDesperta) captionExtras.push('Bônus O Desperta');

    const newPost = {
      id: `p_man_${Date.now()}`,
      challenge_id: selectedChallenge.id,
      user_id: member.userId,
      user_name: member.name,
      user_nickname: member.nickname,
      user_avatar: member.avatar,
      activity_type: manualActivity.toUpperCase(),
      caption: `Lançamento manual de pontos pelo Administrador (${manualActivity})${captionExtras.length ? ' | ' + captionExtras.join(' | ') : ''}`,
      photo_evidence: 'https://picsum.photos/seed/admin/400/300',
      all_photos: ['https://picsum.photos/seed/admin/400/300'],
      points_to_ranking: rPts + bonusTotal,
      points_to_bank: bPts,
      status: 'approved',
      created_at: 'Agora',
      likes: 0,
      comments: []
    };

    await supabase.from('feed_posts').insert([newPost]);

    fetchDataFromSupabase();

    setManualRankingPts('');
    setManualBankPts('');
    setManualSteps('');
    setCheckBonusInquebravel(false);
    setCheckBonusDesperta(false);

    Alert.alert('🎉 Valores Creditados!', `Valores e bônus aplicados com sucesso para ${member.nickname}!`);
  }

  async function handleApproveWorkout(workoutId) {
    const workout = pendingWorkouts.find(w => w.id === workoutId);
    if (!workout) return;

    await supabase.from('pending_workouts').delete().eq('id', workoutId);

    const parsedKm = parseFloat(workout.distance_km) || 0;

    const { data: currentMem } = await supabase.from('memberships')
      .select('ranking_points, bank_points, total_steps, total_km')
      .eq('challenge_id', workout.challengeId)
      .eq('user_id', workout.user_id)
      .single();

    if (currentMem) {
      let updatedObj = {
        ranking_points: (currentMem.ranking_points || 0) + (workout.points_to_ranking || 0),
        bank_points: (currentMem.bank_points || 0) + (workout.points_to_bank || 0)
      };

      if (parsedKm > 0) {
        updatedObj.total_km = (currentMem.total_km || 0) + parsedKm;
      }

      await supabase.from('memberships').update(updatedObj).eq('challenge_id', workout.challengeId).eq('user_id', workout.user_id);
    }

    const imagesList = [];
    if (workout.photo_start) imagesList.push(workout.photo_start);
    if (workout.photo_evidence) imagesList.push(workout.photo_evidence);
    if (workout.photo_end) imagesList.push(workout.photo_end);

    const newPost = {
      id: `p_${Date.now()}`,
      challenge_id: workout.challengeId,
      user_id: workout.user_id,
      user_name: workout.user_name,
      user_nickname: workout.user_nickname,
      user_avatar: workout.user_avatar,
      activity_type: workout.activity_type,
      caption: workout.caption,
      photo_evidence: workout.photo_evidence,
      all_photos: imagesList.length > 0 ? imagesList : [workout.photo_evidence],
      points_to_ranking: workout.points_to_ranking,
      points_to_bank: workout.points_to_bank,
      status: 'approved',
      created_at: workout.created_at || 'Agora',
      likes: 0,
      comments: []
    };

    await supabase.from('feed_posts').insert([newPost]);
    fetchDataFromSupabase();
    Alert.alert('Treino Aprovado!', 'O treino foi aprovado, pontuação somada e publicado no Feed!');
  }

  async function handleRejectWorkout(workoutId) {
    await supabase.from('pending_workouts').delete().eq('id', workoutId);
    fetchDataFromSupabase();
    Alert.alert('Treino Rejeitado', 'O registro foi removido.');
  }

  const handleTriggerPhoto = (mode, setter) => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      
      if (mode === 'camera') {
        input.capture = 'environment';
      }

      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setter(reader.result);
          };
          reader.readAsDataURL(file);
        }
      };

      input.click();
    } else {
      Alert.alert(
        '📷 Câmera / Mídia',
        'Abra a câmera do seu dispositivo para capturar a foto ou vídeo.'
      );
    }
  };

  const handleAddStory = () => {
    handleTriggerPhoto('camera', (base64Img) => {
      if (base64Img) {
        const newStory = {
          id: `st_${Date.now()}`,
          uri: base64Img,
          createdAt: Date.now()
        };

        setAthleteStories(prev => [...prev, newStory]);

        if (Platform.OS === 'web') {
          const downloadLink = document.createElement('a');
          downloadLink.href = base64Img;
          downloadLink.download = `story_muvfit_${Date.now()}.jpg`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }

        Alert.alert('Story Publicado!', 'Seu story foi adicionado com sucesso (exibição por 24h e salvo no dispositivo).');
      }
    });
  };

  function calculateWorkoutPoints(activity, durationMins, kmDistance) {
    const config = modalitySettings[activity];
    if (!config || config.enabled === false) return 0;

    let pts = 0;
    const mode = config.scoringMode || 'simple';

    if (mode === 'simple') {
      const reqMin = parseFloat(config.simplePerMin) || 0;
      const awardPts = parseFloat(config.simplePts) || 0;
      if (reqMin > 0 && durationMins >= reqMin) {
        pts = awardPts;
      }
    } else if (mode === 'timeSteps') {
      const steps = config.timeSteps || [];
      for (let st of steps) {
        const minT = parseFloat(st.minTime) || 0;
        const maxT = st.modeType === 'Acima' ? Infinity : (parseFloat(st.maxTime) || Infinity);
        if (durationMins >= minT && durationMins <= maxT) {
          pts = parseFloat(st.pts) || 0;
          break;
        }
      }
    } else if (mode === 'kmSimple') {
      const reqKm = parseFloat(config.kmPerX) || 0;
      const awardPts = parseFloat(config.kmSimplePts) || 0;
      if (reqKm > 0 && kmDistance >= reqKm) {
        pts = awardPts;
      }
    } else if (mode === 'kmSteps') {
      const steps = config.kmSteps || [];
      for (let st of steps) {
        const minK = parseFloat(st.minKm) || 0;
        const maxK = st.modeType === 'Acima' ? Infinity : (parseFloat(st.maxKm) || Infinity);
        if (kmDistance >= minK && kmDistance <= maxK) {
          pts = parseFloat(st.pts) || 0;
          break;
        }
      }
    }

    return pts;
  }

  async function handleSubmitWorkout() {
    if (!currentUserMembershipInActiveChallenge || currentUserMembershipInActiveChallenge.role !== 'active') {
      Alert.alert('Acesso Restrito', 'Apenas Atletas Ativos com candidatura aprovada podem submeter treinos nesta liga.');
      return;
    }

    const isThreePhotosGroup = ['💪 Musculação', '🏋️ Crossfit / Treino Funcional', '🫀 Treino Aeróbico'].includes(selectedActivity);
    const isKmGroup = ['🏃 Corrida', '🚶 Caminhada', '🚴 Bike'].includes(selectedActivity);
    const isSteps = selectedActivity === '🚶‍♂️ Passos Diários';

    if (isThreePhotosGroup) {
      if (!photoStart || !photoEvidence || !photoEnd) {
        Alert.alert('Comprovantes Obrigatórios', 'Para esta modalidade, envie as 3 fotos obrigatórias: Foto Horário Inicial, Foto Evidência e Foto Horário Final.');
        return;
      }
    } else {
      if (!photoEvidence) {
        Alert.alert('Comprovante Obrigatório', 'Adicione a foto/imagem de comprovação da atividade.');
        return;
      }
    }

    const cleanActType = selectedActivity.trim().toUpperCase();
    
    let formattedDateStr = new Date().toLocaleDateString('pt-BR');
    if (workoutDate) {
      const parts = workoutDate.split('-');
      if (parts.length === 3) {
        formattedDateStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    let dur = 0;
    let kmValue = 0;

    if (!isSteps) {
      const startMins = (parseInt(startHour, 10) * 60) + parseInt(startMinute, 10);
      const endMins = (parseInt(endHour, 10) * 60) + parseInt(endMinute, 10);
      dur = endMins - startMins;
      if (dur <= 0) dur += 1440;
    }

    if (isKmGroup) {
      kmValue = parseFloat(kmInput) || 0;
      if (kmValue <= 0) {
        Alert.alert('Distância Inválida', 'Insira a distância percorrida em KM.');
        return;
      }
    }

    let calculatedPts = 0;
    if (isSteps) {
      calculatedPts = calculatedStepsPoints;
    } else {
      calculatedPts = calculateWorkoutPoints(selectedActivity, dur, kmValue);
    }

    let bonusAppliedMsg = '';
    let bonusNamesArray = [];
    if (bonusConfig.despertaEnabled) {
      const submissionCurrentTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
      if (submissionCurrentTime <= bonusConfig.despertaLimitTime) {
        calculatedPts += parseInt(bonusConfig.despertaPts, 10) || 3000;
        bonusAppliedMsg += ' | ⏰ Bônus "O Desperta"';
        bonusNamesArray.push('Bônus O Desperta');
      }
    }

    if (bonusConfig.inquebravelEnabled) {
      calculatedPts += parseInt(bonusConfig.inquebravelPts, 10) || 5000;
      bonusAppliedMsg += ' | 🪨 Bônus "O Inquebrável"';
      bonusNamesArray.push('Bônus O Inquebrável');
    }

    let ptsRanking = calculatedPts;
    let ptsBank = 0;

    if (selectedChallenge?.has_daily_cap && selectedChallenge?.daily_cap) {
      ptsRanking = Math.min(calculatedPts, selectedChallenge.daily_cap);
      ptsBank = Math.max(0, calculatedPts - selectedChallenge.daily_cap);
    }

    const timeWindowStr = !isSteps ? `${startHour}:${startMinute} às ${endHour}:${endMinute}` : '';

    const newPendingWorkout = {
      id: `pw_${Date.now()}`,
      challenge_id: activeChallengeId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_nickname: currentUser.nickname,
      user_avatar: currentUser.avatar,
      activity_type: cleanActType,
      caption: (workoutCaption || `Atividade de ${selectedActivity}`) + bonusAppliedMsg,
      photo_start: photoStart,
      photo_evidence: photoEvidence,
      photo_end: photoEnd,
      duration_minutes: dur,
      distance_km: kmValue,
      workout_date: formattedDateStr,
      points_to_ranking: ptsRanking,
      points_to_bank: ptsBank,
      created_at: `${formattedDateStr} ${timeWindowStr ? `(${timeWindowStr})` : ''}`
    };

    await supabase.from('pending_workouts').insert([newPendingWorkout]);
    fetchDataFromSupabase();
    
    setIsWorkoutModalOpen(false);
    setKmInput('');
    setStepsInput('');
    setWorkoutCaption('');
    setPhotoStart(null);
    setPhotoEvidence(null);
    setPhotoEnd(null);
    
    Alert.alert('Sucesso', 'Treino enviado com sucesso! Aguardando aprovação do Administrador.');
  }

  async function handleSaveAdvancedRules() {
    if (!selectedConfigChallengeId) return;

    const fullRulesObject = {
      modalitySettings,
      bonusConfig,
      dailyStepsConfig,
      tiebreakers,
      leaguePeriod
    };

    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          title: selectedChallenge.title,
          has_daily_cap: selectedChallenge.has_daily_cap,
          daily_cap: selectedChallenge.daily_cap,
          rules_config: fullRulesObject
        })
        .eq('id', selectedConfigChallengeId);

      if (error) {
        Alert.alert('Erro ao Salvar no Banco', error.message);
        return;
      }

      setIsAdvancedRulesModalOpen(false);
      fetchDataFromSupabase();
      Alert.alert('🎉 Sucesso!', 'As regras desta liga foram salvas permanentemente no banco de dados!');
    } catch (err) {
      Alert.alert('Erro Inesperado', err.message || 'Não foi possível gravar as regras.');
    }
  }

  const handleUpdateModalityProp = (modName, prop, val) => {
    setModalitySettings(prev => ({
      ...prev,
      [modName]: {
        ...(prev[modName] || {}),
        [prop]: val
      }
    }));
  };

  const handleAddTimeStep = (modName) => {
    setModalitySettings(prev => {
      const currentSteps = prev[modName]?.timeSteps || [];
      return {
        ...prev,
        [modName]: {
          ...prev[modName],
          timeSteps: [...currentSteps, { modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }]
        }
      };
    });
  };

  const handleRemoveTimeStep = (modName, index) => {
    setModalitySettings(prev => {
      const currentSteps = [...(prev[modName]?.timeSteps || [])];
      currentSteps.splice(index, 1);
      return {
        ...prev,
        [modName]: {
          ...prev[modName],
          timeSteps: currentSteps
        }
      };
    });
  };

  const handleAddKmStep = (modName) => {
    setModalitySettings(prev => {
      const currentSteps = prev[modName]?.kmSteps || [];
      return {
        ...prev,
        [modName]: {
          ...prev[modName],
          kmSteps: [...currentSteps, { modeType: 'De', minKm: '0', maxKm: '5', pts: '5000' }]
        }
      };
    });
  };

  const handleRemoveKmStep = (modName, index) => {
    setModalitySettings(prev => {
      const currentSteps = [...(prev[modName]?.kmSteps || [])];
      currentSteps.splice(index, 1);
      return {
        ...prev,
        [modName]: {
          ...prev[modName],
          kmSteps: currentSteps
        }
      };
    });
  };

  const getDynamicActiveRulesText = () => {
    const ruleLines = [];
    ruleLines.push(`• ${selectedActivity}: Modalidade Selecionada`);

    if (selectedChallenge?.has_daily_cap && selectedChallenge?.daily_cap) {
      ruleLines.push(`• Teto Diário de Pontos: Máximo ${selectedChallenge.daily_cap.toLocaleString()} pts/dia`);
    }

    if (bonusConfig.inquebravelEnabled) {
      ruleLines.push(`• Bônus Óleo/Rocha (O Inquebrável): +${bonusConfig.inquebravelPts} pts (${bonusConfig.inquebravelDays} dias seguidos)`);
    }

    if (bonusConfig.despertaEnabled) {
      ruleLines.push(`• Bônus Relógio (O Desperta): +${bonusConfig.despertaPts} pts (Postar até ${bonusConfig.despertaLimitTime})`);
    }

    ruleLines.push('• Trava: Máximo 1 envio por modalidade ao dia');

    return ruleLines;
  };

  const searchResultsAthletes = memberships.filter(m => {
    if (searchFilter === 'challenge') return false;
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (m.name || '').toLowerCase().includes(term) || (m.nickname || '').toLowerCase().includes(term);
  }).reduce((acc, current) => {
    const exists = acc.find(item => item.userId === current.userId);
    if (!exists) acc.push(current);
    return acc;
  }, []);

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

  const sortedAthletes = [...activeMembersInChallenge].sort((a, b) => {
    if ((b.rankingPoints || 0) !== (a.rankingPoints || 0)) {
      return (b.rankingPoints || 0) - (a.rankingPoints || 0);
    }
    return (b.activeDays || 0) - (a.activeDays || 0);
  });

  const rankedAthletes = sortedAthletes.map((athlete, index) => ({
    ...athlete,
    rankDisplay: `#${index + 1}`
  }));

  const top3Winners = [...currentChallengeMembers]
    .filter(m => (m.goldMedals || 0) > 0)
    .sort((a, b) => (b.goldMedals || 0) - (a.goldMedals || 0))
    .slice(0, 3)
    .map((m) => `${m.nickname || m.name} - ${getChampionTitle(m.goldMedals)} (${m.goldMedals}x)`);

  const athleteMembershipsAll = memberships.filter(m => m.userId === viewedUser.id);
  const athleteChallengesList = challenges.filter(c => 
    athleteMembershipsAll.some(m => m.challengeId === c.id)
  );

  let selectedMembershipForAthlete = null;
  if (athletePerfScope !== 'global') {
    selectedMembershipForAthlete = athleteMembershipsAll.find(m => String(m.challengeId) === String(athletePerfScope));
  }

  let displayedPerf = {
    rankingPoints: 0,
    bankPoints: 0,
    totalSteps: 0,
    totalKm: 0,
    goldMedals: viewedUser.goldMedals || 0,
    silverMedals: viewedUser.silverMedals || 0,
    bronzeMedals: viewedUser.bronzeMedals || 0,
    athleteStatusText: 'N/A'
  };

  if (athletePerfScope === 'global') {
    displayedPerf.rankingPoints = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.rankingPoints || 0), 0);
    displayedPerf.bankPoints = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.bankPoints || 0), 0);
    displayedPerf.totalSteps = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.totalSteps || 0), 0);
    displayedPerf.totalKm = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.totalKm || 0), 0);
    displayedPerf.goldMedals = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.silverMedals || 0), viewedUser.goldMedals || 0);
    displayedPerf.silverMedals = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.silverMedals || 0), viewedUser.silverMedals || 0);
    displayedPerf.bronzeMedals = athleteMembershipsAll.reduce((acc, curr) => acc + (curr.bronzeMedals || 0), viewedUser.bronzeMedals || 0);
    displayedPerf.athleteStatusText = 'Múltiplas Ligas';
  } else if (selectedMembershipForAthlete) {
    displayedPerf.rankingPoints = selectedMembershipForAthlete.rankingPoints || 0;
    displayedPerf.bankPoints = selectedMembershipForAthlete.bankPoints || 0;
    displayedPerf.totalSteps = selectedMembershipForAthlete.totalSteps || 0;
    displayedPerf.totalKm = selectedMembershipForAthlete.totalKm || 0;
    displayedPerf.goldMedals = selectedMembershipForAthlete.goldMedals || 0;
    displayedPerf.silverMedals = selectedMembershipForAthlete.silverMedals || 0;
    displayedPerf.bronzeMedals = selectedMembershipForAthlete.bronzeMedals || 0;
    
    if (selectedMembershipForAthlete.role === 'active') {
      displayedPerf.athleteStatusText = '⚡ Atleta Ativo';
    } else if (selectedMembershipForAthlete.role === 'pending_athlete') {
      displayedPerf.athleteStatusText = '⏳ Atleta Pendente';
    } else {
      displayedPerf.athleteStatusText = '👀 Torcedor';
    }
  }

  const athleteFeedPostsAll = feedPosts.filter(p => p.user_id === viewedUser.id);
  const athleteFilteredPosts = athletePerfScope === 'global' 
    ? athleteFeedPostsAll 
    : athleteFeedPostsAll.filter(p => String(p.challenge_id) === String(athletePerfScope));

  const countInquebravel = athleteFilteredPosts.filter(p => (p.caption || '').toLowerCase().includes('inquebrável')).length;
  const countDesperta = athleteFilteredPosts.filter(p => (p.caption || '').toLowerCase().includes('desperta')).length;

  const calculatedStepsPoints = Math.round(
    (parseFloat(dailyStepsConfig.manualStepsInput) || 0) * (parseFloat(dailyStepsConfig.multiplier) || 0)
  );

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
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 24 }}>
            Mizan Soluções Técnicas
          </Text>

          <View style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 16, elevation: 5 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center', marginBottom: 16 }}>
              {isSignUp ? 'Criar Nova Conta' : 'Acessar Plataforma'}
            </Text>

            {isSignUp && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Nome Completo"
                  value={fullNameInput}
                  onChangeText={setFullNameInput}
                />

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TouchableOpacity
                    style={[styles.chipBtn, genderInput === 'Masculino' && styles.chipBtnActive, { flex: 1, alignItems: 'center' }]}
                    onPress={() => setGenderInput('Masculino')}
                  >
                    <Text style={[styles.chipText, genderInput === 'Masculino' && styles.chipTextActive]}>Masculino</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.chipBtn, genderInput === 'Feminino' && styles.chipBtnActive, { flex: 1, alignItems: 'center' }]}
                    onPress={() => setGenderInput('Feminino')}
                  >
                    <Text style={[styles.chipText, genderInput === 'Feminino' && styles.chipTextActive]}>Feminino</Text>
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
              placeholder="Senha"
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

            <TouchableOpacity style={{ marginTop: 14, alignItems: 'center' }} onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' }}>
                {isSignUp ? 'Já tem uma conta? Faça Login' : 'Não tem conta? Cadastre-se gratuitamente'}
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

          <TouchableOpacity 
            style={{ backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }} 
            onPress={handleSignOut}
          >
            <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: 'bold' }}>🚪 SAIR</Text>
          </TouchableOpacity>
        </View>

        {hasUserAnyCommunity && (
          <View style={styles.activeChallengeSelectorBar}>
            <Text style={styles.activeChallengeSelectorLabel}>🎯 Desafio Selecionado:</Text>
            <div style={{ marginBottom: 2 }}>
              <select
                style={styles.htmlHeaderSelect}
                value={activeChallengeId || ''}
                onChange={(e) => {
                  const foundCh = challenges.find(c => c.id === e.target.value);
                  if (foundCh) {
                    selectChallengeContext(foundCh, foundCh.creator_id === currentUser.id);
                  }
                }}
              >
                {challenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.creator_id === currentUser.id ? '🔑 Administrador' : memberships.find(m => m.challengeId === c.id && m.userId === currentUser.id)?.role === 'active' ? '⚡ Atleta Ativo' : '👀 Torcedor / Pendente'})
                  </option>
                ))}
              </select>
            </div>
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

              <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled">
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
                            <Text style={styles.searchResultTitle}>{athlete.nickname || athlete.name}</Text>
                            <Text style={styles.searchResultSub}>Acessar Perfil ➔</Text>
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
                      searchResultsChallenges.map((ch) => {
                        const isMember = memberships.some(m => m.challengeId === ch.id && m.userId === currentUser.id);

                        return (
                          <View key={ch.id} style={styles.searchResultItem}>
                            <Text style={{ fontSize: 16, marginRight: 6 }}>🏆</Text>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.searchResultTitle}>{ch.title}</Text>
                              <Text style={styles.searchResultSub}>Código: {ch.invite_code}</Text>
                            </View>

                            {!isMember ? (
                              <TouchableOpacity 
                                style={styles.requestCommunityBtn} 
                                onPress={() => handleRequestCommunityEntry(ch)}
                              >
                                <Text style={styles.btnMiniText}>Solicitar Entrada - {ch.title}</Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity 
                                style={styles.alreadyMemberBtn}
                                onPress={() => {
                                  selectChallengeContext(ch, ch.creator_id === currentUser.id);
                                  setIsSearchOpen(false);
                                  setSearchQuery('');
                                }}
                              >
                                <Text style={styles.btnMiniText}>Acessar Liga ➔</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={styles.sidebar}>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'dashboard' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('dashboard')}>
            <Text style={styles.sidebarIcon}>🏠</Text>
            <Text style={[styles.sidebarText, currentScreen === 'dashboard' && styles.sidebarTextActive]}>Painel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'athlete_center' && styles.sidebarBtnActive]} onPress={() => { setViewedUser(currentUser); setAthletePerfScope('global'); setCurrentScreen('athlete_center'); }}>
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

              {(selectedChallenge.creator_id === currentUser.id || adminChallenges.length > 0) && (
                <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'admin' && styles.sidebarBtnActive]} onPress={() => { setIsAdminContext(true); setCurrentScreen('admin'); }}>
                  <Text style={styles.sidebarIcon}>⚙️</Text>
                  <Text style={[styles.sidebarText, currentScreen === 'admin' && styles.sidebarTextActive]}>Admin</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
          {currentScreen === 'dashboard' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={styles.pageTitle}>Painel Geral de Ligas (Nuvem)</Text>
                {currentUser.isAdmin && (
                  <TouchableOpacity style={styles.createChallengeBtnHeader} onPress={() => setIsCreateChallengeOpen(true)}>
                    <Text style={styles.createChallengeBtnText}>+ NOVO DESAFIO</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!hasUserAnyCommunity && (
                <View style={styles.restrictedNoticeBox}>
                  <Text style={styles.restrictedNoticeText}>
                    ✨ Bem-vindo ao MuvFit, {currentUser.nickname || currentUser.name}! Pesquise uma liga no topo para "Solicitar Entrada" ou crie um novo desafio.
                  </Text>
                </View>
              )}

              <Text style={styles.sectionHeaderTitle}>🔑 Ligas que Você Administra</Text>
              {adminChallenges.length === 0 ? (
                <Text style={styles.emptyNoticeText}>Você ainda não criou nenhum desafio no Supabase.</Text>
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
                      Código: {c.invite_code} | {c.startDate || c.start_date} até {c.endDate || c.end_date}
                    </Text>

                    <TouchableOpacity style={[styles.primaryBtn, { marginVertical: 6 }]} onPress={() => selectChallengeContext(c, true)}>
                      <Text style={styles.primaryBtnText}>ENTRAR COMO ADMIN ➔</Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      <TouchableOpacity style={styles.dashboardActionBtnGreen} onPress={() => handleShareInvite(c)}>
                        <Text style={styles.dashboardActionBtnText}>🔗 CONVIDAR</Text>
                      </TouchableOpacity>

                      {!c.is_finished && (
                        <TouchableOpacity style={styles.dashboardActionBtnOrange} onPress={() => handleFinishChallenge(c.id)}>
                          <Text style={styles.dashboardActionBtnText}>🏆 ENCERRAR TEMPORADA</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity style={styles.dashboardActionBtnRed} onPress={() => handleDeleteChallenge(c.id)}>
                        <Text style={styles.dashboardActionBtnText}>🗑️ DELETAR</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              <Text style={[styles.sectionHeaderTitle, { marginTop: 16 }]}>⚡ Ligas em que Você é Participante / Comunidade</Text>
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
                      Código: {c.invite_code} | {c.startDate || c.start_date} até {c.endDate || c.end_date}
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                      <TouchableOpacity style={[styles.actionBtn, { flex: 1, marginBottom: 0 }]} onPress={() => selectChallengeContext(c, false)}>
                        <Text style={styles.actionBtnText}>ACESSAR LIGA ➔</Text>
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

          {currentScreen === 'feed' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.pageTitle}>Feed — {selectedChallenge.title}</Text>
                <TouchableOpacity style={styles.inviteBtn} onPress={() => handleShareInvite(selectedChallenge)}>
                  <Text style={styles.btnMiniText}>🔗 CONVIDAR</Text>
                </TouchableOpacity>
              </View>

              {currentUserMembershipInActiveChallenge?.role === 'active' ? (
                <TouchableOpacity style={styles.actionBtn} onPress={() => setIsWorkoutModalOpen(true)}>
                  <Text style={styles.actionBtnText}>+ REGISTRAR NOVO TREINO / PASSOS</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.restrictedNoticeBox}>
                  <Text style={styles.restrictedNoticeText}>
                    🔒 Você está acompanhando como Torcedor/Atleta Pendente. Solicite participação como Atleta Ativo no topo do Ranking para enviar treinos!
                  </Text>
                </View>
              )}

              {currentFeedPosts.length === 0 ? (
                <Text style={styles.emptyNoticeText}>Nenhum treino aprovado no feed ainda.</Text>
              ) : (
                currentFeedPosts.map((post) => {
                  const photos = post.all_photos && post.all_photos.length > 0 ? post.all_photos : [post.photo_evidence];
                  
                  return (
                    <View key={post.id} style={styles.postCard}>
                      <TouchableOpacity style={styles.postHeader} onPress={() => handleOpenUserProfile(post.user_id)}>
                        <Image source={{ uri: post.user_avatar }} style={styles.avatarMini} />
                        <View style={{ marginLeft: 8 }}>
                          <Text style={[styles.postAuthor, { textDecorationLine: 'underline' }]}>{post.user_nickname || post.user_name}</Text>
                          <Text style={styles.postTime}>{post.created_at} • ✅ Aprovado</Text>
                        </View>
                      </TouchableOpacity>

                      {photos.length > 1 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 200 }}>
                          {photos.map((imgUri, idx) => (
                            <Image key={idx} source={{ uri: imgUri }} style={styles.postImgCarousel} />
                          ))}
                        </ScrollView>
                      ) : (
                        <Image source={{ uri: photos[0] }} style={styles.postImg} />
                      )}
                      
                      <View style={{ padding: 10 }}>
                        <Text style={styles.postCaption}>{post.caption}</Text>
                        <Text style={styles.badgePts}>+{post.points_to_ranking} pts (Ranking)</Text>

                        <View style={styles.socialBar}>
                          <TouchableOpacity style={styles.socialBtn} onPress={() => handleToggleLike(post.id)}>
                            <Text style={[styles.socialBtnText, post.isLiked && { color: '#dc2626' }]}>
                              {post.isLiked ? '❤️' : '🤍'} {post.likes} Curtidas
                            </Text>
                          </TouchableOpacity>
                          <Text style={styles.socialBtnText}>💬 {(post.comments || []).length} Comentários</Text>
                        </View>

                        {(post.comments || []).length > 0 && (
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
                  );
                })
              )}
            </ScrollView>
          )}

          {currentScreen === 'ranking' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <Text style={styles.pageTitle}>🏆 Ranking — {selectedChallenge.title}</Text>

                {currentUserMembershipInActiveChallenge?.role === 'active' ? (
                  <View style={styles.activeAthleteBadge}>
                    <Text style={styles.btnMiniText}>Atleta Ativo</Text>
                  </View>
                ) : currentUserMembershipInActiveChallenge?.role === 'pending_athlete' ? (
                  <View style={styles.pendingAthleteBadge}>
                    <Text style={styles.btnMiniText}>Aprovação Pendente</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.blueRequestAthleteBtn} 
                    onPress={handleRequestAthleteActive}
                  >
                    <Text style={styles.btnMiniText}>SOLICITAR PARTICIPAÇÃO - {selectedChallenge.title}</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.topWinnersBannerBox}>
                <Text style={styles.topWinnersBannerTitle}>👑 HALL DA FAMA - {selectedChallenge.title.toUpperCase()}</Text>
                {top3Winners.length > 0 ? (
                  top3Winners.map((winnerStr, idx) => (
                    <Text key={idx} style={styles.topWinnersBannerList}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'} {winnerStr}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.topWinnersBannerList}>Nenhum campeão registrado nesta liga ainda.</Text>
                )}
              </View>

              <Text style={styles.sectionHeaderTitle}>⚡ Atletas Ativos ({rankedAthletes.length})</Text>
              
              {rankedAthletes.length === 0 ? (
                <Text style={styles.emptyNoticeText}>Nenhum atleta ativo inscrito neste desafio.</Text>
              ) : (
                rankedAthletes.map((member) => (
                  <TouchableOpacity key={member.userId} style={styles.rankingRowCard} onPress={() => handleOpenUserProfile(member.userId)}>
                    <Text style={styles.rankingPosNumber}>{member.rankDisplay}</Text>
                    <Image source={{ uri: member.avatar }} style={styles.avatarMini} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.rankingMemberName}>{member.nickname || member.name}</Text>
                      <Text style={styles.rankingMemberSub}>{(member.totalSteps || 0).toLocaleString()} passos | {(member.totalKm || 0).toFixed(1)} km</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.rankingMemberPts}>{(member.rankingPoints || 0).toLocaleString()} pts</Text>
                      {selectedChallenge.has_daily_cap && (
                        <Text style={styles.rankingMemberBank}>Banco: {(member.bankPoints || 0).toLocaleString()} pts</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}

              <View style={{ marginTop: 24 }}>
                <Text style={[styles.sectionHeaderTitle, { color: '#64748b' }]}>👀 Lista de Torcedores / Pendentes ({spectatorMembersInChallenge.length})</Text>
                {spectatorMembersInChallenge.length === 0 ? (
                  <Text style={styles.emptyNoticeText}>Nenhum torcedor cadastrado nesta liga.</Text>
                ) : (
                  spectatorMembersInChallenge.map((spectator) => (
                    <TouchableOpacity key={spectator.userId} style={styles.spectatorRowCard} onPress={() => handleOpenUserProfile(spectator.userId)}>
                      <Image source={{ uri: spectator.avatar }} style={styles.avatarMini} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.rankingMemberName}>{spectator.nickname || spectator.name}</Text>
                        <Text style={{ fontSize: 9, color: '#64748b', fontStyle: 'italic' }}>
                          {spectator.role === 'pending_athlete' ? '⏳ Candidato a Atleta Ativo' : 'Acompanhando o desafio'}
                        </Text>
                      </View>
                      <Text style={styles.spectatorBadge}>
                        {spectator.role === 'pending_athlete' ? 'ATLETA PENDENTE' : 'TORCEDOR'}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </ScrollView>
          )}

          {currentScreen === 'athlete_center' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.profileHeaderCard}>
                <Image source={{ uri: viewedUser.avatar }} style={styles.avatarLarge} />
                
                <Text style={styles.profileNicknameDisplay}>{viewedUser.nickname || viewedUser.name}</Text>
                <Text style={styles.profileMeta}>
                  {viewedUser.age ? `${viewedUser.age} anos` : 'Idade não informada'} | {viewedUser.gender || 'Masculino'}
                </Text>

                {athletePerfScope !== 'global' && (
                  <View style={styles.athleteStatusBadgeContainer}>
                    <Text style={styles.athleteStatusBadgeText}>{displayedPerf.athleteStatusText}</Text>
                  </View>
                )}

                {viewedUser.id === currentUser.id && (
                  <TouchableOpacity style={styles.editProfileBtn} onPress={handleOpenEditProfile}>
                    <Text style={styles.editProfileBtnText}>✏️ EDITAR PERFIL</Text>
                  </TouchableOpacity>
                )}

                <View style={{ width: '100%', marginTop: 10 }}>
                  <Text style={styles.inputLabelMini}>Visualizar Desempenho Por:</Text>
                  <div style={{ marginBottom: 2 }}>
                    <select
                      style={styles.htmlNativeSelect}
                      value={athletePerfScope}
                      onChange={(e) => setAthletePerfScope(e.target.value)}
                    >
                      <option value="global">🌐 Somatório Geral (Suas Ligas)</option>
                      {athleteChallengesList.map(ch => (
                        <option key={ch.id} value={ch.id}>🏆 {ch.title}</option>
                      ))}
                    </select>
                  </div>
                </View>

                <View style={styles.medalsRowContainer}>
                  <View style={styles.medalBadgeItem}>
                    <Text style={{ fontSize: 16 }}>🥇</Text>
                    <Text style={styles.medalBadgeCount}>{displayedPerf.goldMedals}x Ouro</Text>
                  </View>
                  <View style={styles.medalBadgeItem}>
                    <Text style={{ fontSize: 16 }}>🥈</Text>
                    <Text style={styles.medalBadgeCount}>{displayedPerf.silverMedals}x Prata</Text>
                  </View>
                  <View style={styles.medalBadgeItem}>
                    <Text style={{ fontSize: 16 }}>🥉</Text>
                    <Text style={styles.medalBadgeCount}>{displayedPerf.bronzeMedals}x Bronze</Text>
                  </View>
                </View>

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
              </View>

              <View style={styles.sectionContainerBox}>
                <Text style={styles.sectionHeaderTitle}>Histórias de Atleta (24h)</Text>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 8, marginVertical: 4 }}>
                  {viewedUser.id === currentUser.id && (
                    <TouchableOpacity style={styles.storyAddBtnCircle} onPress={handleAddStory}>
                      <Text style={{ fontSize: 22, color: '#ffffff', fontWeight: 'bold' }}>+</Text>
                    </TouchableOpacity>
                  )}

                  {athleteStories.length === 0 ? (
                    <Text style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', alignSelf: 'center', marginLeft: 6 }}>
                      Nenhum story ativo. Clique em "+" para publicar.
                    </Text>
                  ) : (
                    athleteStories.map(st => (
                      <View key={st.id} style={{ position: 'relative', marginRight: 8 }}>
                        <TouchableOpacity onPress={() => setActiveStoryView(st)}>
                          <Image source={{ uri: st.uri }} style={styles.storyThumbnailCircle} />
                        </TouchableOpacity>
                        
                        {viewedUser.id === currentUser.id && (
                          <TouchableOpacity 
                            style={styles.storyDeleteBtn}
                            onPress={() => {
                              setAthleteStories(prev => prev.filter(item => item.id !== st.id));
                            }}
                          >
                            <Text style={{ fontSize: 8, color: '#ffffff', fontWeight: 'bold' }}>✕</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>

              <View style={styles.sectionContainerBox}>
                <Text style={styles.sectionHeaderTitle}>Insígnias de Bônus & Conquistas</Text>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' }}>
                    🪨 O Inquebrável ({countInquebravel}x)
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' }}>
                    ⏰ O Desperta ({countDesperta}x)
                  </Text>
                </View>
              </View>

              {/* Seção de Evolução & Estatísticas com dados dinâmicos baseados no input real */}
              <View style={styles.sectionContainerBox}>
                <Text style={styles.sectionHeaderTitle}>Evolução & Estatísticas do Atleta</Text>

                {/* 1. Evolução de Peso (Card com estado vazio ou último registro) */}
                <TouchableOpacity 
                  style={styles.statsCardItemButton}
                  onPress={() => setIsWeightChartModalOpen(true)}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' }}>📈 Evolução de Peso (kg)</Text>
                  <Text style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                    {weightHistoryList.length > 0
                      ? `${weightHistoryList[weightHistoryList.length - 1].weight}kg (${weightHistoryList[weightHistoryList.length - 1].period})`
                      : 'Nenhum registro de peso efetuado'}
                  </Text>
                </TouchableOpacity>

                {/* 2. Atividades Mais Praticadas */}
                <TouchableOpacity 
                  style={styles.statsCardItemButton}
                  onPress={() => setIsModalityRadarModalOpen(true)}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' }}>📊 Modalidades Mais Praticadas</Text>
                  <Text style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>1º Musculação (50%) | 2º Corrida (30%) | 3º Bicicleta (20%)</Text>
                </TouchableOpacity>

                {/* 3. KM Percorrido Acumulado */}
                <TouchableOpacity 
                  style={styles.statsCardItemButton}
                  onPress={() => setIsKmChartModalOpen(true)}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' }}>🚶 KM Total Percorrido</Text>
                  <Text style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{displayedPerf.totalKm.toFixed(1)} km acumulados</Text>
                </TouchableOpacity>

                {/* 4. Tempo Total em Atividade */}
                <TouchableOpacity 
                  style={styles.statsCardItemButton}
                  onPress={() => setIsTimeChartModalOpen(true)}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' }}>⏱️ Tempo Total em Atividade</Text>
                  <Text style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>Toque para visualizar o tempo investido</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sectionContainerBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.sectionHeaderTitle}>Últimas Evidências de Atividades</Text>
                  <TouchableOpacity onPress={() => setIsAllEvidencesModalOpen(true)}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#f97316' }}>Ver Mais &gt;</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ gap: 8 }}>
                  {athleteFilteredPosts.length === 0 ? (
                    <Text style={styles.emptyNoticeText}>Nenhuma evidência registrada neste filtro.</Text>
                  ) : (
                    athleteFilteredPosts.slice(0, 3).map(post => (
                      <View key={post.id} style={{ width: 120, marginRight: 8, backgroundColor: '#f8fafc', borderRadius: 6, padding: 4, borderWidth: 1, borderColor: '#cbd5e1' }}>
                        <Image source={{ uri: post.photo_evidence }} style={{ width: '100%', height: 100, borderRadius: 4 }} />
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#0f172a', marginTop: 2 }} numberOfLines={1}>{post.activity_type}</Text>
                        <Text style={{ fontSize: 8, color: '#64748b' }}>{post.created_at.slice(0, 10)}</Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>

              <View style={styles.sectionContainerBox}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={styles.sectionHeaderTitle}>Checklist de Objetivos Pessoais</Text>
                  {viewedUser.id === currentUser.id && (
                    <TouchableOpacity style={styles.goalAddHeaderBtn} onPress={() => setIsGoalModalOpen(true)}>
                      <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#ffffff' }}>+ OBJETIVO</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {personalGoals.length === 0 ? (
                  <Text style={styles.emptyNoticeText}>Nenhum objetivo cadastrado. Clique em "+ OBJETIVO" para adicionar.</Text>
                ) : (
                  personalGoals.map(goal => (
                    <View key={goal.id} style={styles.goalCheckboxRow}>
                      <TouchableOpacity 
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}
                        onPress={() => {
                          if (viewedUser.id === currentUser.id) {
                            setPersonalGoals(personalGoals.map(g => g.id === goal.id ? { ...g, completed: !g.completed } : g));
                          }
                        }}
                      >
                        <View style={[styles.goalCheckboxSquare, goal.completed && styles.goalCheckboxSquareActive]}>
                          {goal.completed && <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
                        </View>
                        <Text style={[styles.goalTextLabel, goal.completed && { textDecorationLine: 'line-through', color: '#94a3b8' }]}>
                          {goal.text}
                        </Text>
                      </TouchableOpacity>

                      {viewedUser.id === currentUser.id && (
                        <TouchableOpacity 
                          style={{ padding: 4 }}
                          onPress={() => {
                            setPersonalGoals(personalGoals.filter(g => g.id !== goal.id));
                          }}
                        >
                          <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: 'bold' }}>🗑️</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </View>

            </ScrollView>
          )}

          {currentScreen === 'admin' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>🎯 Central do Administrador: {selectedChallenge.title}</Text>
                <Text style={styles.adminCardSub}>Gerencie aprovações, inscrições de atletas ativos, lançamento manual, membros e configurações avançadas.</Text>
              </View>

              <View style={styles.accordionCard}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedSec1(!expandedSec1)}>
                  <Text style={styles.accordionTitle}>1. APROVAÇÃO DE TREINOS PENDENTES ({currentPendingWorkouts.length})</Text>
                  <Text style={styles.accordionArrow}>{expandedSec1 ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {expandedSec1 && (
                  <View style={styles.accordionBody}>
                    {currentPendingWorkouts.length === 0 ? (
                      <Text style={styles.emptyNoticeText}>Nenhum treino aguardando aprovação.</Text>
                    ) : (
                      currentPendingWorkouts.map((w) => {
                        const pendingImages = [];
                        if (w.photo_start) pendingImages.push({ title: 'Foto Início', uri: w.photo_start });
                        if (w.photo_evidence) pendingImages.push({ title: 'Foto Evidência', uri: w.photo_evidence });
                        if (w.photo_end) pendingImages.push({ title: 'Foto Fim', uri: w.photo_end });

                        return (
                          <View key={w.id} style={styles.workoutPendingCard}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                              <Image source={{ uri: w.user_avatar }} style={styles.avatarMini} />
                              <View style={{ marginLeft: 8, flex: 1 }}>
                                <Text style={styles.participantName}>{w.user_nickname || w.user_name}</Text>
                                <Text style={styles.participantSub}>Modalidade: {w.activity_type}</Text>
                                <Text style={{ fontSize: 9, color: '#1e3a8a', fontWeight: 'bold' }}>Data do Treino: {w.workout_date || w.created_at}</Text>
                              </View>
                              <Text style={styles.tagActiveText}>+{w.points_to_ranking} pts</Text>
                            </View>

                            <View style={{ backgroundColor: '#eff6ff', padding: 6, borderRadius: 6, marginVertical: 4 }}>
                              {w.duration_minutes > 0 && (
                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' }}>
                                  ⏱️ Tempo de Execução: {w.duration_minutes} minutos
                                </Text>
                              )}
                              {w.distance_km > 0 && (
                                <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' }}>
                                  🏃 Distância Percorrida: {w.distance_km} KM
                                </Text>
                              )}
                              {w.caption ? (
                                <Text style={{ fontSize: 10, color: '#334155', marginTop: 2, fontStyle: 'italic' }}>
                                  💬 Comentário: "{w.caption}"
                                </Text>
                              ) : null}
                            </View>

                            <Text style={[styles.inputLabelMini, { marginTop: 4 }]}>Imagens de Comprovação Anexadas:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                              {pendingImages.map((imgObj, idx) => (
                                <View key={idx} style={{ marginRight: 8, alignItems: 'center' }}>
                                  <Image source={{ uri: imgObj.uri }} style={{ width: 110, height: 110, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' }} />
                                  <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#475569', marginTop: 2 }}>{imgObj.title}</Text>
                                </View>
                              ))}
                            </ScrollView>

                            <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                              <TouchableOpacity style={[styles.approveBtn, { flex: 1, alignItems: 'center' }]} onPress={() => handleApproveWorkout(w.id)}>
                                <Text style={styles.btnMiniText}>✅ APROVAR</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.banBtn, { flex: 1, alignItems: 'center' }]} onPress={() => handleRejectWorkout(w.id)}>
                                <Text style={styles.btnMiniText}>❌ REJEITAR</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                )}
              </View>

              <View style={styles.accordionCard}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedSec2(!expandedSec2)}>
                  <Text style={styles.accordionTitle}>2. CONTROLE DE INSCRIÇÃO ({pendingAthleteMembers.length + activeMembersInChallenge.length})</Text>
                  <Text style={styles.accordionArrow}>{expandedSec2 ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {expandedSec2 && (
                  <View style={styles.accordionBody}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' }}>
                        Status das Inscrições: {selectedChallenge.registrations_closed ? '🔒 FECHADO' : '🟢 ABERTO'}
                      </Text>
                      <TouchableOpacity style={styles.lockBtn} onPress={toggleChallengeRegistrations}>
                        <Text style={styles.btnMiniText}>
                          {selectedChallenge.registrations_closed ? '🔓 INICIAR CANDIDATURAS' : '🔒 ENCERRAR CANDIDATURAS'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.inputLabel, { marginTop: 4, color: '#d97706' }]}>Solicitações para Atleta Ativo ({pendingAthleteMembers.length}):</Text>
                    {pendingAthleteMembers.length === 0 ? (
                      <Text style={styles.emptyNoticeText}>Nenhuma solicitação de Atleta Ativo pendente.</Text>
                    ) : (
                      pendingAthleteMembers.map((m) => (
                        <View key={m.id} style={styles.participantRow}>
                          <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.participantName}>{m.nickname || m.name}</Text>
                            <Text style={{ fontSize: 8, color: '#d97706', fontWeight: 'bold' }}>Solicitou participação no Ranking</Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                            <TouchableOpacity style={styles.approveBtn} onPress={() => handleUpdateAthleteStatus(m.id, 'active')}>
                              <Text style={styles.btnMiniText}>⚡ APROVAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.spectatorBtn} onPress={() => handleUpdateAthleteStatus(m.id, 'spectator')}>
                              <Text style={styles.btnMiniText}>👀 TORCEDOR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.banBtn} onPress={() => handleUpdateAthleteStatus(m.id, 'rejected')}>
                              <Text style={styles.btnMiniText}>❌ RECUSAR</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}

                    <Text style={[styles.inputLabel, { marginTop: 12, color: '#16a34a' }]}>
                      ⚡ Atletas Ativos na Liga ({activeMembersInChallenge.length}):
                    </Text>
                    {activeMembersInChallenge.length === 0 ? (
                      <Text style={styles.emptyNoticeText}>Nenum atleta ativo cadastrado nesta liga.</Text>
                    ) : (
                      activeMembersInChallenge.map((m) => (
                        <View key={m.id} style={styles.participantRow}>
                          <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.participantName}>{m.nickname || m.name}</Text>
                            <Text style={styles.tagActiveText}>⚡ Atleta Ativo</Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.spectatorBtn} 
                            onPress={() => handleUpdateAthleteStatus(m.id, 'spectator')}
                          >
                            <Text style={styles.btnMiniText}>👀 TORNAR TORCEDOR</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>

              <View style={styles.accordionCard}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedSec3(!expandedSec3)}>
                  <Text style={styles.accordionTitle}>3. LANÇAMENTO MANUAL DE PONTOS, BÔNUS E PASSOS</Text>
                  <Text style={styles.accordionArrow}>{expandedSec3 ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {expandedSec3 && (
                  <View style={styles.accordionBody}>
                    <Text style={styles.inputLabel}>Por Atleta Ativo:</Text>
                    
                    <div style={{ marginBottom: 8 }}>
                      <select
                        style={styles.htmlNativeSelect}
                        value={manualSelectedAthleteId}
                        onChange={(e) => setManualSelectedAthleteId(e.target.value)}
                      >
                        <option value="">Clique para selecionar um atleta...</option>
                        {activeMembersInChallenge.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nickname || m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <Text style={[styles.inputLabel, { marginTop: 8 }]}>Selecione a Modalidade Realizada:</Text>
                    <View style={styles.modalityGridContainer}>
                      {modalitiesList.filter(m => m.value !== '🏛️ Base da Liga' && m.value !== '🎁 Bônus e Critérios de Desempate').map((item) => {
                        const isSelected = manualActivity === item.value;
                        return (
                          <TouchableOpacity
                            key={item.value}
                            style={[styles.modalityChipBtn, isSelected && styles.modalityChipBtnActive]}
                            onPress={() => setManualActivity(item.value)}
                          >
                            <Text style={[styles.modalityChipText, isSelected && styles.modalityChipTextActive]}>
                              {item.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.inputLabel}>Pontos Ranking (Geral):</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 5000"
                      keyboardType="numeric"
                      value={manualRankingPts}
                      onChangeText={setManualRankingPts}
                    />

                    {selectedChallenge.has_daily_cap && (
                      <>
                        <Text style={styles.inputLabel}>Banco de Pontos (Excedente ao Teto):</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Ex: 2000"
                          keyboardType="numeric"
                          value={manualBankPts}
                          onChangeText={setManualBankPts}
                        />
                      </>
                    )}

                    <Text style={styles.inputLabel}>Passos Diários:</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ex: 10000"
                      keyboardType="numeric"
                      value={manualSteps}
                      onChangeText={setManualSteps}
                    />

                    <Text style={[styles.inputLabel, { marginTop: 6 }]}>Conceder Bônus:</Text>
                    
                    <TouchableOpacity 
                      style={styles.checkboxRow} 
                      onPress={() => setCheckBonusInquebravel(!checkBonusInquebravel)}
                    >
                      <View style={[styles.checkboxBoxCircle, checkBonusInquebravel && styles.checkboxBoxCircleActive]}>
                        {checkBonusInquebravel && <Text style={styles.checkboxCheckmark}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxLabel}>Bônus "🪨 O Inquebrável" ( +{bonusConfig.inquebravelPts} pts )</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.checkboxRow} 
                      onPress={() => setCheckBonusDesperta(!checkBonusDesperta)}
                    >
                      <View style={[styles.checkboxBoxCircle, checkBonusDesperta && styles.checkboxBoxCircleActive]}>
                        {checkBonusDesperta && <Text style={styles.checkboxCheckmark}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxLabel}>Bônus "⏰ O Desperta" ( +{bonusConfig.despertaPts} pts )</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.primaryBtn, { marginTop: 10 }]} onPress={handleManualPointsSubmit}>
                      <Text style={styles.primaryBtnText}>CREDITAR VALORES AO ATLETA</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.accordionCard}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedSec4(!expandedSec4)}>
                  <Text style={styles.accordionTitle}>4. GERENCIAMENTO DE MEMBROS DA COMUNIDADE ({currentChallengeMembers.length})</Text>
                  <Text style={styles.accordionArrow}>{expandedSec4 ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {expandedSec4 && (
                  <View style={styles.accordionBody}>
                    <Text style={[styles.inputLabel, { color: '#d97706' }]}>
                      📩 Entradas Pendentes na Comunidade ({pendingCommunityMembers.length}):
                    </Text>
                    
                    {pendingCommunityMembers.length === 0 ? (
                      <Text style={styles.emptyNoticeText}>Nenhum pedido de entrada na comunidade pendente.</Text>
                    ) : (
                      pendingCommunityMembers.map((p) => (
                        <View key={p.id} style={styles.participantRow}>
                          <Image source={{ uri: p.avatar }} style={styles.avatarMini} />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.participantName}>{p.nickname || p.name}</Text>
                            <Text style={{ fontSize: 8, color: '#64748b' }}>Solicitou entrar na comunidade da liga</Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                            <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveCommunityMember(p.id)}>
                              <Text style={styles.btnMiniText}>✅ ACEITAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.banBtn} onPress={() => handleRejectCommunityMember(p.id)}>
                              <Text style={styles.btnMiniText}>❌ RECUSAR</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}

                    <Text style={[styles.inputLabel, { marginTop: 10 }]}>Membros Atuais da Comunidade:</Text>
                    {currentChallengeMembers.filter(m => m.role !== 'pending_community').map((m) => (
                      <View key={m.id} style={styles.participantRow}>
                        <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.participantName}>{m.nickname || m.name}</Text>
                          <Text style={m.role === 'active' ? styles.tagActiveText : styles.participantSub}>
                            {m.role === 'active' ? '⚡ ATLETA ATIVO' : m.role === 'pending_athlete' ? '⏳ ATLETA PENDENTE' : '👀 TORCEDOR'}
                          </Text>
                        </View>
                        <TouchableOpacity style={styles.banBtn} onPress={() => handleRemoveMemberFromCommunity(m.id)}>
                          <Text style={styles.btnMiniText}>🗑️ REMOVER</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.accordionCard}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedSec5(!expandedSec5)}>
                  <Text style={styles.accordionTitle}>5. CONFIGURAÇÃO AVANÇADA DE PONTOS</Text>
                  <Text style={styles.accordionArrow}>{expandedSec5 ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {expandedSec5 && (
                  <View style={styles.accordionBody}>
                    <Text style={{ fontSize: 10, color: '#475569', marginBottom: 8 }}>
                      Configurar limites de classificação, critérios de desempate e regras específicas para os atletas.
                    </Text>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => setIsAdvancedRulesModalOpen(true)}>
                      <Text style={styles.actionBtnText}>⚙️ EDITAR REGRAS DETALHADAS DA LIGA</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

            </ScrollView>
          )}
        </View>
      </View>

      {/* Modal: Janela Detalhada de Evolução de Peso (Inspirada na Referência) */}
      <Modal visible={isWeightChartModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.modalTitle}>Gráfico de Peso</Text>
              <TouchableOpacity onPress={() => setIsWeightChartModalOpen(false)}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' }}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ marginVertical: 8, backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 6 }}>Histórico Registrado:</Text>
              {weightHistoryList.length === 0 ? (
                <Text style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', padding: 6, textAlign: 'center' }}>
                  Nenhum registro de peso efetuado.
                </Text>
              ) : (
                weightHistoryList.map(item => (
                  <View key={item.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
                    <Text style={{ fontSize: 10, color: '#334155', fontWeight: 'bold' }}>{item.period}</Text>
                    <Text style={{ fontSize: 10, color: '#f97316', fontWeight: 'bold' }}>{item.weight} kg</Text>
                  </View>
                ))
              )}
            </View>

            <Text style={styles.inputLabel}>Peso Atual (kg) / Data (Mês/Ano):</Text>
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
              <TextInput 
                style={[styles.input, { flex: 1, marginBottom: 0 }]} 
                placeholder="Ex: 78.2" 
                keyboardType="numeric"
                value={newWeightValueInput} 
                onChangeText={setNewWeightValueInput} 
              />
              <TextInput 
                style={[styles.input, { flex: 1, marginBottom: 0 }]} 
                placeholder="Ex: Set/2023" 
                value={newWeightPeriodInput} 
                onChangeText={newWeightPeriodInput => setNewWeightPeriodInput(newWeightPeriodInput)} 
              />
            </View>

            <TouchableOpacity 
              style={styles.primaryBtn} 
              onPress={() => {
                if (newWeightPeriodInput.trim() && newWeightValueInput.trim()) {
                  const wNum = parseFloat(newWeightValueInput) || 0;
                  setWeightHistoryList([...weightHistoryList, { id: `w_${Date.now()}`, period: newWeightPeriodInput.trim(), weight: wNum }]);
                  setNewWeightPeriodInput('');
                  setNewWeightValueInput('');
                  Alert.alert('Sucesso', 'Registro de peso adicionado!');
                }
              }}
            >
              <Text style={styles.primaryBtnText}>ADICIONAR REGISTRO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cancelBtn, { marginTop: 10 }]} onPress={() => setIsWeightChartModalOpen(false)}>
              <Text style={styles.cancelBtnText}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Gráfico Radar / Distribuição de Atividades */}
      <Modal visible={isModalityRadarModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>📊 Gráfico Radar: Atividades Mais Praticadas</Text>
            <View style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginVertical: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 6 }}>Top 3 Modalidades & Distribuição Percentual:</Text>
              <Text style={{ fontSize: 10, color: '#334155', marginBottom: 4 }}>🥇 1º Musculação - 50% das atividades</Text>
              <Text style={{ fontSize: 10, color: '#334155', marginBottom: 4 }}>🥈 2º Corrida - 30% das atividades</Text>
              <Text style={{ fontSize: 10, color: '#334155', marginBottom: 4 }}>🥉 3º Bicicleta - 20% das atividades</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsModalityRadarModalOpen(false)}>
              <Text style={styles.primaryBtnText}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Gráfico de KM Percorrido Acumulado */}
      <Modal visible={isKmChartModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>📊 Gráfico de Colunas: KM Percorrido Acumulado</Text>
            <View style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginVertical: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 6 }}>Filtrado por Liga e Modalidades de Deslocamento:</Text>
              <Text style={{ fontSize: 10, color: '#334155', marginBottom: 4 }}>🏃 Corrida: 45.0 KM</Text>
              <Text style={{ fontSize: 10, color: '#334155', marginBottom: 4 }}>🚶 Caminhada: 18.5 KM</Text>
              <Text style={{ fontSize: 10, color: '#334155', marginBottom: 4 }}>🚴 Bike: 120.0 KM</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#f97316', marginTop: 6 }}>Total Acumulado: {displayedPerf.totalKm.toFixed(1)} KM</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsKmChartModalOpen(false)}>
              <Text style={styles.primaryBtnText}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Gráfico de Tempo Total em Atividade */}
      <Modal visible={isTimeChartModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>⏱️ Gráfico de Colunas: Tempo Total em Atividade</Text>
            <View style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginVertical: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 6 }}>Tempo Investido por Horas / Minutos:</Text>
              <Text style={{ fontSize: 10, color: '#334155', marginBottom: 4 }}>💪 Musculação: 15h 30min</Text>
              <Text style={{ fontSize: 10, color: '#334155', marginBottom: 4 }}>🏃 Corrida: 8h 15min</Text>
              <Text style={{ fontSize: 10, color: '#334155', marginBottom: 4 }}>🚴 Bike: 6h 45min</Text>
            </View>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsTimeChartModalOpen(false)}>
              <Text style={styles.primaryBtnText}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para visualizar Story em Tela Cheia por 30 segundos */}
      <Modal visible={activeStoryView !== null} transparent animationType="fade">
        <View style={styles.storyModalOverlay}>
          <View style={styles.storyModalContainer}>
            <View style={styles.storyProgressBar}>
              <div style={{ width: '100%', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', backgroundColor: '#f97316', animation: 'shrink 30s linear forwards' }}></div>
              </div>
            </View>

            {activeStoryView && (
              <Image source={{ uri: activeStoryView.uri }} style={styles.storyFullscreenImage} />
            )}

            <TouchableOpacity 
              style={styles.storyCloseBtn}
              onPress={() => setActiveStoryView(null)}
            >
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>✕ Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isGoalModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎯 Novo Objetivo Pessoal</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Ex: Fazer 100 flexões seguidas" 
              value={newGoalText} 
              onChangeText={setNewGoalText} 
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => {
              if (newGoalText.trim()) {
                setPersonalGoals([...personalGoals, { id: `g_${Date.now()}`, text: newGoalText.trim(), completed: false }]);
                setIsGoalModalOpen(false);
                setNewGoalText('');
                Alert.alert('Adicionado!', 'O seu objetivo foi incluído na lista.');
              }
            }}>
              <Text style={styles.primaryBtnText}>ADICIONAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsGoalModalOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isAllEvidencesModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>📸 Histórico Completo de Evidências</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {athleteFilteredPosts.length === 0 ? (
                <Text style={styles.emptyNoticeText}>Nenhuma evidência registrada.</Text>
              ) : (
                athleteFilteredPosts.map(post => (
                  <View key={post.id} style={{ marginBottom: 12, backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' }}>
                    <Image source={{ uri: post.photo_evidence }} style={{ width: '100%', height: 180, borderRadius: 6, marginBottom: 4 }} />
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' }}>{post.activity_type}</Text>
                    <Text style={{ fontSize: 10, color: '#334155' }}>{post.caption}</Text>
                    <Text style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{post.created_at}</Text>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 10 }]} onPress={() => setIsAllEvidencesModalOpen(false)}>
              <Text style={styles.primaryBtnText}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isAdvancedRulesModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>⚙️ Configuração Avançada de Pontos</Text>

            <ScrollView style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled">
              
              <Text style={styles.inputLabel}>1 - Selecione o Desafio Para Configurar:</Text>
              <div style={{ marginBottom: 8 }}>
                <select
                  style={styles.htmlNativeSelect}
                  value={selectedConfigChallengeId || ''}
                  onChange={(e) => setSelectedConfigChallengeId(e.target.value)}
                >
                  {adminChallenges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <Text style={styles.inputLabel}>2 - Selecione a Categoria para Configurar:</Text>
              <div style={{ marginBottom: 8 }}>
                <select
                  style={styles.htmlNativeSelect}
                  value={selectedConfigActivity}
                  onChange={(e) => setSelectedConfigActivity(e.target.value)}
                >
                  {modalitiesList.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedConfigActivity === '🏛️ Base da Liga' && (
                <View style={styles.scoringModeBoxContainer}>
                  <Text style={styles.sectionHeaderTitle}>🏛️ Configurações Gerais da Liga</Text>

                  <Text style={styles.inputLabel}>Nome da Liga:</Text>
                  <TextInput
                    style={styles.input}
                    value={selectedChallenge.title || ''}
                    onChangeText={(txt) => {
                      setChallenges(challenges.map(c => c.id === selectedConfigChallengeId ? { ...c, title: txt } : c));
                    }}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 6 }]}>Período de Duração da Liga:</Text>
                  
                  <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginVertical: 4 }}>
                    <View style={{ minWidth: 260, gap: 8 }}>
                      <TouchableOpacity 
                        style={styles.checkboxRow} 
                        onPress={() => setLeaguePeriod('Weekly')}
                      >
                        <View style={[styles.checkboxBoxCircle, leaguePeriod === 'Weekly' && styles.checkboxBoxCircleActive]}>
                          {leaguePeriod === 'Weekly' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>Semanal (semana vigente)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.checkboxRow} 
                        onPress={() => setLeaguePeriod('Monthly')}
                      >
                        <View style={[styles.checkboxBoxCircle, leaguePeriod === 'Monthly' && styles.checkboxBoxCircleActive]}>
                          {leaguePeriod === 'Monthly' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>Mensal (mês vigente)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.checkboxRow} 
                        onPress={() => setLeaguePeriod('Yearly')}
                      >
                        <View style={[styles.checkboxBoxCircle, leaguePeriod === 'Yearly' && styles.checkboxBoxCircleActive]}>
                          {leaguePeriod === 'Yearly' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>Anual</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>

                  <TouchableOpacity 
                    style={[styles.checkboxRow, { marginTop: 8 }]} 
                    onPress={() => {
                      const currentVal = selectedChallenge.has_daily_cap;
                      setChallenges(challenges.map(c => c.id === selectedConfigChallengeId ? { ...c, has_daily_cap: !currentVal } : c));
                    }}
                  >
                    <View style={[styles.checkboxBoxCircle, selectedChallenge.has_daily_cap && styles.checkboxBoxCircleActive]}>
                      {selectedChallenge.has_daily_cap && <Text style={styles.checkboxCheckmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>Ativar Limite de Teto Diário de Pontos?</Text>
                  </TouchableOpacity>

                  {selectedChallenge.has_daily_cap && (
                    <View style={{ marginTop: 4, marginBottom: 8 }}>
                      <Text style={styles.inputLabel}>Valor Exato do Teto Diário (Pts):</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={String(selectedChallenge.daily_cap || '22000')}
                        onChangeText={(txt) => {
                          const num = parseInt(txt, 10) || 0;
                          setChallenges(challenges.map(c => c.id === selectedConfigChallengeId ? { ...c, daily_cap: num } : c));
                        }}
                      />
                    </View>
                  )}
                </View>
              )}

              {selectedConfigActivity === '🚶‍♂️ Passos Diários' && (
                <View style={styles.scoringModeBoxContainer}>
                  <Text style={styles.sectionHeaderTitle}>🚶‍♂️ Configuração de Passos Diários</Text>

                  <TouchableOpacity 
                    style={styles.checkboxRow} 
                    onPress={() => setDailyStepsConfig({ ...dailyStepsConfig, enabled: !dailyStepsConfig.enabled })}
                  >
                    <View style={[styles.checkboxBoxCircle, dailyStepsConfig.enabled && styles.checkboxBoxCircleActive]}>
                      {dailyStepsConfig.enabled && <Text style={styles.checkboxCheckmark}>✓</Text>}
                    </View>
                    <Text style={[styles.checkboxLabel, { color: dailyStepsConfig.enabled ? '#16a34a' : '#dc2626' }]}>
                      {dailyStepsConfig.enabled ? 'Modalidade Válida no Desafio' : 'Modalidade Desabilitada'}
                    </Text>
                  </TouchableOpacity>

                  {dailyStepsConfig.enabled && (
                    <>
                      <TouchableOpacity 
                        style={[styles.checkboxRow, { marginTop: 10 }]} 
                        onPress={() => setDailyStepsConfig({ ...dailyStepsConfig, enableRankingScore: !dailyStepsConfig.enableRankingScore })}
                      >
                        <View style={[styles.checkboxBoxCircle, dailyStepsConfig.enableRankingScore && styles.checkboxBoxCircleActive]}>
                          {dailyStepsConfig.enableRankingScore && <Text style={styles.checkboxCheckmark}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>Usar pontos da modalidade no Placar Geral (Ranking)</Text>
                      </TouchableOpacity>

                      {dailyStepsConfig.enableRankingScore && (
                        <View style={{ backgroundColor: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#cbd5e1', marginTop: 10 }}>
                          <Text style={[styles.inputLabel, { color: '#1e3a8a', fontWeight: 'bold' }]}>Inserção Manual de Passos Diários:</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ex: 10000"
                            keyboardType="numeric"
                            value={dailyStepsConfig.manualStepsInput}
                            onChangeText={(txt) => setDailyStepsConfig({ ...dailyStepsConfig, manualStepsInput: txt })}
                          />

                          <Text style={[styles.inputLabel, { color: '#1e3a8a', fontWeight: 'bold', marginTop: 6 }]}>
                            Multiplicador de Passos (de 0,1 à 1,0):
                          </Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Ex: 0.5"
                            keyboardType="decimal-pad"
                            value={dailyStepsConfig.multiplier}
                            onChangeText={(txt) => setDailyStepsConfig({ ...dailyStepsConfig, multiplier: txt })}
                          />

                          <View style={{ backgroundColor: '#fff7ed', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: '#f97316', marginTop: 8 }}>
                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#c2410c' }}>
                              🧮 Cálculo Resultante para o Ranking:
                            </Text>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', marginTop: 2 }}>
                              {dailyStepsConfig.manualStepsInput || '0'} passos × {dailyStepsConfig.multiplier || '0'} = {calculatedStepsPoints.toLocaleString()} Pontos no Placar Geral
                            </Text>
                          </View>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}

              {['💪 Musculação', '🏋️ Crossfit / Treino Funcional', '🫀 Treino Aeróbico', '⚽ Esportes Coletivos', '🥋 Lutas / Esportes Individuais'].includes(selectedConfigActivity) && (() => {
                const currentMod = modalitySettings[selectedConfigActivity] || {};
                const isEnabled = currentMod.enabled !== false;
                const scoringMode = currentMod.scoringMode || 'simple';

                return (
                  <View style={styles.scoringModeBoxContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={styles.sectionHeaderTitle}>{selectedConfigActivity}</Text>
                      <TouchableOpacity 
                        style={styles.checkboxRow} 
                        onPress={() => handleUpdateModalityProp(selectedConfigActivity, 'enabled', !isEnabled)}
                      >
                        <View style={[styles.checkboxBoxCircle, isEnabled && styles.checkboxBoxCircleActive]}>
                          {isEnabled && <Text style={styles.checkboxCheckmark}>✓</Text>}
                        </View>
                        <Text style={[styles.checkboxLabel, { color: isEnabled ? '#16a34a' : '#dc2626' }]}>
                          {isEnabled ? 'Habilitada' : 'Desabilitada'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {isEnabled && (
                      <>
                        <TouchableOpacity 
                          style={styles.checkboxRow} 
                          onPress={() => handleUpdateModalityProp(selectedConfigActivity, 'scoringMode', 'simple')}
                        >
                          <View style={[styles.checkboxBoxCircle, scoringMode === 'simple' && styles.checkboxBoxCircleActive]}>
                            {scoringMode === 'simple' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.checkboxLabel}>Opção 1: Por Taxa Simples (Tempo Mínimo em minutos)</Text>
                        </TouchableOpacity>

                        {scoringMode === 'simple' && (
                          <View style={{ paddingLeft: 24, marginBottom: 10 }}>
                            <Text style={styles.inputLabel}>Pontos Concedidos:</Text>
                            <TextInput 
                              style={styles.input} 
                              keyboardType="numeric" 
                              value={currentMod.simplePts || ''} 
                              onChangeText={(v) => handleUpdateModalityProp(selectedConfigActivity, 'simplePts', v)} 
                            />
                            <Text style={styles.inputLabel}>A cada Quantos Minutos (em minutos):</Text>
                            <TextInput 
                              style={styles.input} 
                              keyboardType="numeric" 
                              value={currentMod.simplePerMin || ''} 
                              onChangeText={(v) => handleUpdateModalityProp(selectedConfigActivity, 'simplePerMin', v)} 
                            />
                          </View>
                        )}

                        <TouchableOpacity 
                          style={styles.checkboxRow} 
                          onPress={() => handleUpdateModalityProp(selectedConfigActivity, 'scoringMode', 'timeSteps')}
                        >
                          <View style={[styles.checkboxBoxCircle, scoringMode === 'timeSteps' && styles.checkboxBoxCircleActive]}>
                            {scoringMode === 'timeSteps' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.checkboxLabel}>Opção 2: Por Step de tempo (em minutos)</Text>
                        </TouchableOpacity>

                        {scoringMode === 'timeSteps' && (
                          <View style={{ paddingLeft: 24, marginBottom: 10 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ paddingBottom: 6 }}>
                              <View style={{ minWidth: 280 }}>
                                {(currentMod.timeSteps || []).map((st, idx) => {
                                  const isAcima = st.modeType === 'Acima';
                                  return (
                                    <View key={idx} style={{ backgroundColor: '#f1f5f9', padding: 8, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: '#cbd5e1' }}>
                                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1e3a8a' }}>Step {idx + 1}</Text>
                                        <TouchableOpacity onPress={() => handleRemoveTimeStep(selectedConfigActivity, idx)}>
                                          <Text style={{ color: '#dc2626', fontSize: 10, fontWeight: 'bold' }}>Remover Step ✕</Text>
                                        </TouchableOpacity>
                                      </View>

                                      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginBottom: 4 }}>
                                        <div style={{ width: '60px' }}>
                                          <select
                                            style={styles.htmlNativeSelectSmall}
                                            value={st.modeType || 'De'}
                                            onChange={(e) => {
                                              const newArr = [...currentMod.timeSteps];
                                              newArr[idx].modeType = e.target.value;
                                              handleUpdateModalityProp(selectedConfigActivity, 'timeSteps', newArr);
                                            }}
                                          >
                                            <option value="De">De</option>
                                            <option value="Acima">Acima</option>
                                          </select>
                                        </div>

                                        <TextInput 
                                          style={styles.stepMiniInput} 
                                          placeholder="Min" 
                                          keyboardType="numeric" 
                                          value={st.minTime} 
                                          onChangeText={(v) => {
                                            const newArr = [...currentMod.timeSteps];
                                            newArr[idx].minTime = v;
                                            handleUpdateModalityProp(selectedConfigActivity, 'timeSteps', newArr);
                                          }} 
                                        />
                                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#64748b' }}>até</Text>
                                        <TextInput 
                                          style={[styles.stepMiniInput, { backgroundColor: isAcima ? '#e2e8f0' : '#ffffff' }]} 
                                          placeholder="Até" 
                                          keyboardType="numeric" 
                                          editable={!isAcima}
                                          value={isAcima ? '' : st.maxTime} 
                                          onChangeText={(v) => {
                                            const newArr = [...currentMod.timeSteps];
                                            newArr[idx].maxTime = v;
                                            handleUpdateModalityProp(selectedConfigActivity, 'timeSteps', newArr);
                                          }} 
                                        />
                                      </View>

                                      <Text style={styles.inputLabelMini}>Pontos deste Step:</Text>
                                      <TextInput 
                                        style={[styles.input, { marginBottom: 0 }]} 
                                        placeholder="Quanto valerá o Step (pts)" 
                                        keyboardType="numeric" 
                                        value={st.pts} 
                                        onChangeText={(v) => {
                                          const newArr = [...currentMod.timeSteps];
                                          newArr[idx].pts = v;
                                          handleUpdateModalityProp(selectedConfigActivity, 'timeSteps', newArr);
                                        }} 
                                      />
                                    </View>
                                  );
                                })}
                              </View>
                            </ScrollView>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingVertical: 6, marginTop: 4, backgroundColor: '#16a34a' }]} onPress={() => handleAddTimeStep(selectedConfigActivity)}>
                              <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>+ Step</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                );
              })()}

              {['🏃 Corrida', '🚶 Caminhada', '🚴 Bike'].includes(selectedConfigActivity) && (() => {
                const currentMod = modalitySettings[selectedConfigActivity] || {};
                const isEnabled = currentMod.enabled !== false;
                const scoringMode = currentMod.scoringMode || 'kmSimple';

                return (
                  <View style={styles.scoringModeBoxContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={styles.sectionHeaderTitle}>{selectedConfigActivity}</Text>
                      <TouchableOpacity 
                        style={styles.checkboxRow} 
                        onPress={() => handleUpdateModalityProp(selectedConfigActivity, 'enabled', !isEnabled)}
                      >
                        <View style={[styles.checkboxBoxCircle, isEnabled && styles.checkboxBoxCircleActive]}>
                          {isEnabled && <Text style={styles.checkboxCheckmark}>✓</Text>}
                        </View>
                        <Text style={[styles.checkboxLabel, { color: isEnabled ? '#16a34a' : '#dc2626' }]}>
                          {isEnabled ? 'Habilitada' : 'Desabilitada'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {isEnabled && (
                      <>
                        <TouchableOpacity 
                          style={styles.checkboxRow} 
                          onPress={() => handleUpdateModalityProp(selectedConfigActivity, 'scoringMode', 'kmSimple')}
                        >
                          <View style={[styles.checkboxBoxCircle, scoringMode === 'kmSimple' && styles.checkboxBoxCircleActive]}>
                            {scoringMode === 'kmSimple' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.checkboxLabel}>Opção 1: Por Distância mínima percorrida (em Km)</Text>
                        </TouchableOpacity>

                        {scoringMode === 'kmSimple' && (
                          <View style={{ paddingLeft: 24, marginBottom: 10 }}>
                            <Text style={styles.inputLabel}>Pontos Concedidos:</Text>
                            <TextInput 
                              style={styles.input} 
                              keyboardType="numeric" 
                              value={currentMod.kmSimplePts || ''} 
                              onChangeText={(v) => handleUpdateModalityProp(selectedConfigActivity, 'kmSimplePts', v)} 
                            />
                            <Text style={styles.inputLabel}>A cada X Distância (em KM):</Text>
                            <TextInput 
                              style={styles.input} 
                              keyboardType="numeric" 
                              value={currentMod.kmPerX || ''} 
                              onChangeText={(v) => handleUpdateModalityProp(selectedConfigActivity, 'kmPerX', v)} 
                            />
                          </View>
                        )}

                        <TouchableOpacity 
                          style={styles.checkboxRow} 
                          onPress={() => handleUpdateModalityProp(selectedConfigActivity, 'scoringMode', 'simple')}
                        >
                          <View style={[styles.checkboxBoxCircle, scoringMode === 'simple' && styles.checkboxBoxCircleActive]}>
                            {scoringMode === 'simple' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.checkboxLabel}>Opção 2: Por Taxa Simples (Tempo Mínimo em minutos)</Text>
                        </TouchableOpacity>

                        {scoringMode === 'simple' && (
                          <View style={{ paddingLeft: 24, marginBottom: 10 }}>
                            <Text style={styles.inputLabel}>Pontos Concedidos:</Text>
                            <TextInput 
                              style={styles.input} 
                              keyboardType="numeric" 
                              value={currentMod.simplePts || ''} 
                              onChangeText={(v) => handleUpdateModalityProp(selectedConfigActivity, 'simplePts', v)} 
                            />
                            <Text style={styles.inputLabel}>A cada Quantos Minutos (em minutos):</Text>
                            <TextInput 
                              style={styles.input} 
                              keyboardType="numeric" 
                              value={currentMod.simplePerMin || ''} 
                              onChangeText={(v) => handleUpdateModalityProp(selectedConfigActivity, 'simplePerMin', v)} 
                            />
                          </View>
                        )}

                        <TouchableOpacity 
                          style={styles.checkboxRow} 
                          onPress={() => handleUpdateModalityProp(selectedConfigActivity, 'scoringMode', 'kmSteps')}
                        >
                          <View style={[styles.checkboxBoxCircle, scoringMode === 'kmSteps' && styles.checkboxBoxCircleActive]}>
                            {scoringMode === 'kmSteps' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.checkboxLabel}>Opção 3: Por Step de Distância Percorrida (em KM)</Text>
                        </TouchableOpacity>

                        {scoringMode === 'kmSteps' && (
                          <View style={{ paddingLeft: 24, marginBottom: 10 }}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ paddingBottom: 6 }}>
                              <View style={{ minWidth: 280 }}>
                                {(currentMod.kmSteps || []).map((st, idx) => {
                                  const isAcima = st.modeType === 'Acima';
                                  return (
                                    <View key={idx} style={{ backgroundColor: '#f1f5f9', padding: 8, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: '#cbd5e1' }}>
                                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#1e3a8a' }}>Step KM {idx + 1}</Text>
                                        <TouchableOpacity onPress={() => handleRemoveKmStep(selectedConfigActivity, idx)}>
                                          <Text style={{ color: '#dc2626', fontSize: 10, fontWeight: 'bold' }}>Remover Step ✕</Text>
                                        </TouchableOpacity>
                                      </View>

                                      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginBottom: 4 }}>
                                        <div style={{ width: '60px' }}>
                                          <select
                                            style={styles.htmlNativeSelectSmall}
                                            value={st.modeType || 'De'}
                                            onChange={(e) => {
                                              const newArr = [...currentMod.kmSteps];
                                              newArr[idx].modeType = e.target.value;
                                              handleUpdateModalityProp(selectedConfigActivity, 'kmSteps', newArr);
                                            }}
                                          >
                                            <option value="De">De</option>
                                            <option value="Acima">Acima</option>
                                          </select>
                                        </div>

                                        <TextInput 
                                          style={styles.stepMiniInput} 
                                          placeholder="KM" 
                                          keyboardType="numeric" 
                                          value={st.minKm} 
                                          onChangeText={(v) => {
                                            const newArr = [...currentMod.kmSteps];
                                            newArr[idx].minKm = v;
                                            handleUpdateModalityProp(selectedConfigActivity, 'kmSteps', newArr);
                                          }} 
                                        />
                                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#64748b' }}>até</Text>
                                        <TextInput 
                                          style={[styles.stepMiniInput, { backgroundColor: isAcima ? '#e2e8f0' : '#ffffff' }]} 
                                          placeholder="Até" 
                                          keyboardType="numeric" 
                                          editable={!isAcima}
                                          value={isAcima ? '' : st.maxKm} 
                                          onChangeText={(v) => {
                                            const newArr = [...currentMod.kmSteps];
                                            newArr[idx].maxKm = v;
                                            handleUpdateModalityProp(selectedConfigActivity, 'kmSteps', newArr);
                                          }} 
                                        />
                                      </View>

                                      <Text style={styles.inputLabelMini}>Pontos deste Step:</Text>
                                      <TextInput 
                                        style={[styles.input, { marginBottom: 0 }]} 
                                        placeholder="Quanto valerá o Step (pts)" 
                                        keyboardType="numeric" 
                                        value={st.pts} 
                                        onChangeText={(v) => {
                                          const newArr = [...currentMod.kmSteps];
                                          newArr[idx].pts = v;
                                          handleUpdateModalityProp(selectedConfigActivity, 'kmSteps', newArr);
                                        }} 
                                      />
                                    </View>
                                  );
                                })}
                              </View>
                            </ScrollView>
                            <TouchableOpacity style={[styles.primaryBtn, { paddingVertical: 6, marginTop: 4, backgroundColor: '#16a34a' }]} onPress={() => handleAddKmStep(selectedConfigActivity)}>
                              <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>+ Step</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                );
              })()}

              {selectedConfigActivity === '🎁 Bônus e Critérios de Desempate' && (
                <View style={styles.scoringModeBoxContainer}>
                  <Text style={styles.sectionHeaderTitle}>🎁 Bônus e Critérios de Desempate</Text>

                  <TouchableOpacity 
                    style={styles.checkboxRow} 
                    onPress={() => setBonusConfig({ ...bonusConfig, inquebravelEnabled: !bonusConfig.inquebravelEnabled })}
                  >
                    <View style={[styles.checkboxBoxCircle, bonusConfig.inquebravelEnabled && styles.checkboxBoxCircleActive]}>
                      {bonusConfig.inquebravelEnabled && <Text style={styles.checkboxCheckmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>Bônus "🪨 O Inquebrável"</Text>
                  </TouchableOpacity>

                  {bonusConfig.inquebravelEnabled && (
                    <View style={{ paddingLeft: 24, marginBottom: 10 }}>
                      <Text style={styles.inputLabel}>Dias consecutivos exigidos para o bônus:</Text>
                      <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        value={bonusConfig.inquebravelDays} 
                        onChangeText={(v) => setBonusConfig({ ...bonusConfig, inquebravelDays: v })} 
                      />
                      <Text style={styles.inputLabel}>Pontos concedidos (Bônus O Inquebrável):</Text>
                      <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        value={bonusConfig.inquebravelPts} 
                        onChangeText={(v) => setBonusConfig({ ...bonusConfig, inquebravelPts: v })} 
                      />
                    </View>
                  )}

                  <TouchableOpacity 
                    style={styles.checkboxRow} 
                    onPress={() => setBonusConfig({ ...bonusConfig, despertaEnabled: !bonusConfig.despertaEnabled })}
                  >
                    <View style={[styles.checkboxBoxCircle, bonusConfig.despertaEnabled && styles.checkboxBoxCircleActive]}>
                      {bonusConfig.despertaEnabled && <Text style={styles.checkboxCheckmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>Bônus "⏰ O Desperta"</Text>
                  </TouchableOpacity>

                  {bonusConfig.despertaEnabled && (
                    <View style={{ paddingLeft: 24, marginBottom: 10 }}>
                      <Text style={styles.inputLabel}>Horário limite para postar o treino (formato 24h, ex: 08:00):</Text>
                      <TextInput 
                        style={styles.input} 
                        placeholder="08:00"
                        value={bonusConfig.despertaLimitTime} 
                        onChangeText={(v) => setBonusConfig({ ...bonusConfig, despertaLimitTime: v })} 
                      />
                      <Text style={styles.inputLabel}>Pontos concedidos (Bônus O Desperta):</Text>
                      <TextInput 
                        style={styles.input} 
                        keyboardType="numeric" 
                        value={bonusConfig.despertaPts} 
                        onChangeText={(v) => setBonusConfig({ ...bonusConfig, despertaPts: v })} 
                      />
                    </View>
                  )}

                  <Text style={[styles.sectionHeaderTitle, { marginTop: 12 }]}>Selecione os Critérios de Desempate:</Text>
                  <Text style={{ fontSize: 9, color: '#64748b', marginBottom: 6 }}>Marque para habilitar e defina a ordem de preferência:</Text>

                  {tiebreakers.map((tb, index) => (
                    <View key={tb.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: 8, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: '#cbd5e1' }}>
                      <TouchableOpacity 
                        style={styles.checkboxRow} 
                        onPress={() => {
                          const updated = [...tiebreakers];
                          updated[index].enabled = !updated[index].enabled;
                          setTiebreakers(updated);
                        }}
                      >
                        <View style={[styles.checkboxBoxCircle, tb.enabled && styles.checkboxBoxCircleActive]}>
                          {tb.enabled && <Text style={styles.checkboxCheckmark}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>{tb.label}</Text>
                      </TouchableOpacity>

                      <div style={{ width: '90px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#1e3a8a' }}>Ordem:</span>
                        <select
                          style={{ width: '45px', padding: '4px', fontSize: '10px', fontWeight: 'bold', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          value={tb.order}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            const updated = [...tiebreakers];
                            updated[index].order = val;
                            setTiebreakers(updated);
                          }}
                        >
                          <option value={1}>1º</option>
                          <option value={2}>2º</option>
                          <option value={3}>3º</option>
                          <option value={4}>4º</option>
                        </select>
                      </div>
                    </View>
                  ))}
                </View>
              )}

            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleSaveAdvancedRules}>
                <Text style={styles.primaryBtnText}>SALVAR REGRAS</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { flex: 1, justifyContent: 'center' }]} onPress={() => setIsAdvancedRulesModalOpen(false)}>
                <Text style={styles.cancelBtnText}>CANCELAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isEditProfileOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Editar Perfil do Atleta</Text>

            <Text style={styles.inputLabel}>Foto do Perfil:</Text>
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <Image source={{ uri: editAvatar || currentUser.avatar }} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#f97316', marginBottom: 8 }} />
              <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
                <TouchableOpacity style={styles.photoBtn} onPress={() => handleTriggerPhoto('camera', setEditAvatar)}>
                  <Text style={styles.photoBtnText}>📷 TIRAR FOTO</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoBtnSecondary} onPress={() => handleTriggerPhoto('gallery', setEditAvatar)}>
                  <Text style={styles.photoBtnTextSecondary}>🖼️ GALERIA</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.inputLabel}>Nome Completo:</Text>
            <TextInput style={styles.input} placeholder="Digite seu nome completo" value={editFullName} onChangeText={setEditFullName} />

            <Text style={styles.inputLabel}>Apelido (exibido na Central, Ranking e Hall da Fama):</Text>
            <TextInput style={styles.input} placeholder="Digite seu apelido público" value={editNickname} onChangeText={setEditNickname} />

            <Text style={styles.inputLabel}>Dados de Nascimento (DD/MM/AAAA):</Text>
            <TextInput style={styles.input} placeholder="Ex: 08/11/1997" keyboardType="numeric" maxLength={10} value={editBirthDate} onChangeText={(text) => setEditBirthDate(formatBirthDateMask(text))} />

            <Text style={styles.inputLabel}>Gênero:</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.chipBtn, editGender === 'Masculino' && styles.chipBtnActive, { flex: 1, alignItems: 'center' }]}
                onPress={() => setEditGender('Masculino')}
              >
                <Text style={[styles.chipText, editGender === 'Masculino' && styles.chipTextActive]}>masculino</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chipBtn, editGender === 'Feminino' && styles.chipBtnActive, { flex: 1, alignItems: 'center' }]}
                onPress={() => setEditGender('Feminino')}
              >
                <Text style={[styles.chipText, editGender === 'Feminino' && styles.chipTextActive]}>feminina</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>SALVAR ALTERAÇÕES</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditProfileOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={isCreateChallengeOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>🏆 Criar Novo Desafio / Liga</Text>

            <Text style={styles.inputLabel}>Nome do Desafio:</Text>
            <TextInput style={styles.input} placeholder="Ex: Desafio Verão 2026" value={newChallengeTitle} onChangeText={setNewChallengeTitle} />

            <Text style={styles.inputLabel}>Código de Acesso / Convite:</Text>
            <TextInput style={styles.input} placeholder="Ex: MUV2026" autoCapitalize="characters" value={newChallengeCode} onChangeText={setNewChallengeCode} />

            <Text style={styles.inputLabel}>Periodicidade da Temporada:</Text>
            <div style={{ marginBottom: 8 }}>
              <select
                style={styles.htmlNativeSelect}
                value={newChallengePeriod}
                onChange={(e) => setNewChallengePeriod(e.target.value)}
              >
                <option value="Weekly">Semanal (Até o sábado da semana)</option>
                <option value="Monthly">Mensal (Até o último dia do mês)</option>
                <option value="Yearly">Anual (Até 31/12 do ano corrente)</option>
              </select>
            </div>

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setHasCapToggle(!hasCapToggle)}>
              <View style={[styles.checkboxBoxCircle, hasCapToggle && styles.checkboxBoxCircleActive]}>{hasCapToggle && <Text style={styles.checkboxCheckmark}>✓</Text>}</View>
              <Text style={styles.checkboxLabel}>Ativar Teto Diário de Pontos?</Text>
            </TouchableOpacity>

            {hasCapToggle && (
              <View style={{ marginTop: 2, marginBottom: 8 }}>
                <Text style={styles.inputLabel}>Limite Diário (Pts):</Text>
                <TextInput style={styles.input} placeholder="Ex: 22000" keyboardType="numeric" value={newChallengeCap} onChangeText={setNewChallengeCap} />
              </View>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateChallenge}>
              <Text style={styles.primaryBtnText}>CRIAR E SALVAR NA NUVEM</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreateChallengeOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={isWorkoutModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={{ width: '100%', maxHeight: 540 }} keyboardShouldPersistTaps="handled">
              
              <Text style={styles.modalTitle}>Registrar Treino ({selectedChallenge?.title || 'MuvFit'})</Text>

              <View style={styles.rulesCardBox}>
                <Text style={styles.rulesCardTitle}>📜 Regras Ativas da Modalidade:</Text>
                {getDynamicActiveRulesText().map((ruleText, idx) => (
                  <Text key={idx} style={styles.rulesCardItem}>{ruleText}</Text>
                ))}
              </View>

              <Text style={styles.inputLabel}>Selecione a Modalidade:</Text>
              <div style={{ marginBottom: 8 }}>
                <select
                  style={styles.htmlNativeSelect}
                  value={selectedActivity}
                  onChange={(e) => setSelectedActivity(e.target.value)}
                >
                  {modalitiesList.filter(m => m.value !== '🎁 Bônus e Critérios de Desempate' && m.value !== '🏛️ Base da Liga').map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ margin: '6px 0' }}>
                <Text style={styles.inputLabel}>📅 Data do Treino:</Text>
                <input
                  type="date"
                  value={workoutDate}
                  onChange={(e) => setWorkoutDate(e.target.value)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#0f172a',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {!isStepsActive && (
                <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginVertical: 6 }}>
                  <Text style={[styles.inputLabel, { color: '#1e3a8a', fontWeight: 'bold' }]}>⏱️ Horário de Início e Fim da Atividade:</Text>
                  
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <Text style={styles.inputLabelMini}>Horário Início:</Text>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <select
                          style={styles.timeSelectNative}
                          value={startHour}
                          onChange={(e) => setStartHour(e.target.value)}
                        >
                          {hoursArray.map(h => <option key={h} value={h}>{h} h</option>)}
                        </select>
                        <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>:</span>
                        <select
                          style={styles.timeSelectNative}
                          value={startMinute}
                          onChange={(e) => setStartMinute(e.target.value)}
                        >
                          {minutesArray.map(m => <option key={m} value={m}>{m} min</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <Text style={styles.inputLabelMini}>Horário Término:</Text>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <select
                          style={styles.timeSelectNative}
                          value={endHour}
                          onChange={(e) => setEndHour(e.target.value)}
                        >
                          {hoursArray.map(h => <option key={h} value={h}>{h} h</option>)}
                        </select>
                        <span style={{ fontWeight: 'bold', color: '#1e3a8a' }}>:</span>
                        <select
                          style={styles.timeSelectNative}
                          value={endMinute}
                          onChange={(e) => setEndMinute(e.target.value)}
                        >
                          {minutesArray.map(m => <option key={m} value={m}>{m} min</option>)}
                        </select>
                      </div>
                    </div>
                  </View>

                  {(() => {
                    const startM = (parseInt(startHour, 10) * 60) + parseInt(startMinute, 10);
                    const endM = (parseInt(endHour, 10) * 60) + parseInt(endMinute, 10);
                    let diff = endM - startM;
                    if (diff <= 0) diff += 1440;
                    return (
                      <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: '#16a34a', marginTop: 6 }}>
                        ⏳ Tempo Total Calculado: {diff} minutos
                      </Text>
                    );
                  })()}
                </View>
              )}

              {isKmGroupActive && (
                <View style={{ marginVertical: 4 }}>
                  <Text style={styles.inputLabel}>🏃 Distância Percorrida (em KM):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 5.5"
                    keyboardType="decimal-pad"
                    value={kmInput}
                    onChangeText={setKmInput}
                  />
                </View>
              )}

              <Text style={styles.inputLabel}>Legenda / Comentário (Opcional):</Text>
              <TextInput 
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]} 
                placeholder="Escreva algo sobre o treino..." 
                multiline 
                value={workoutCaption} 
                onChangeText={setWorkoutCaption} 
              />

              <View style={{ marginVertical: 8 }}>
                <Text style={[styles.inputLabel, { color: '#1e3a8a' }]}>📷 Comprovante(s) em Foto da Atividade:</Text>

                {isThreePhotosGroupActive ? (
                  <View style={{ gap: 10 }}>
                    <View style={styles.photoUploadBox}>
                      <Text style={styles.inputLabelMini}>1. Foto Horário Inicial (Obrigatória):</Text>
                      {photoStart && <Image source={{ uri: photoStart }} style={styles.photoPreviewMini} />}
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <TouchableOpacity style={styles.photoBtn} onPress={() => handleTriggerPhoto('camera', setPhotoStart)}>
                          <Text style={styles.photoBtnText}>📷 TIRAR FOTO</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.photoBtnSecondary} onPress={() => handleTriggerPhoto('gallery', setPhotoStart)}>
                          <Text style={styles.photoBtnTextSecondary}>🖼️ GALERIA</Text>
                        </TouchableOpacity>
                        {photoStart && (
                          <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoStart(null)}>
                            <Text style={styles.removePhotoBtnText}>🗑️ REMOVER</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    <View style={styles.photoUploadBox}>
                      <Text style={styles.inputLabelMini}>2. Foto Evidência do Treino (Obrigatória):</Text>
                      {photoEvidence && <Image source={{ uri: photoEvidence }} style={styles.photoPreviewMini} />}
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <TouchableOpacity style={styles.photoBtn} onPress={() => handleTriggerPhoto('camera', setPhotoEvidence)}>
                          <Text style={styles.photoBtnText}>📷 TIRAR FOTO</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.photoBtnSecondary} onPress={() => handleTriggerPhoto('gallery', setPhotoEvidence)}>
                          <Text style={styles.photoBtnTextSecondary}>🖼️ GALERIA</Text>
                        </TouchableOpacity>
                        {photoEvidence && (
                          <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoEvidence(null)}>
                            <Text style={styles.removePhotoBtnText}>🗑️ REMOVER</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    <View style={styles.photoUploadBox}>
                      <Text style={styles.inputLabelMini}>3. Foto Horário Final (Obrigatória):</Text>
                      {photoEnd && <Image source={{ uri: photoEnd }} style={styles.photoPreviewMini} />}
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <TouchableOpacity style={styles.photoBtn} onPress={() => handleTriggerPhoto('camera', setPhotoEnd)}>
                          <Text style={styles.photoBtnText}>📷 TIRAR FOTO</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.photoBtnSecondary} onPress={() => handleTriggerPhoto('gallery', setPhotoEnd)}>
                          <Text style={styles.photoBtnTextSecondary}>🖼️ GALERIA</Text>
                        </TouchableOpacity>
                        {photoEnd && (
                          <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoEnd(null)}>
                            <Text style={styles.removePhotoBtnText}>🗑️ REMOVER</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.photoUploadBox}>
                    <Text style={styles.inputLabelMini}>Foto / Print de Comprovação (Obrigatória):</Text>
                    {photoEvidence && <Image source={{ uri: photoEvidence }} style={styles.photoPreviewMini} />}
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <TouchableOpacity style={styles.photoBtn} onPress={() => handleTriggerPhoto('camera', setPhotoEvidence)}>
                        <Text style={styles.photoBtnText}>📷 TIRAR FOTO</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.photoBtnSecondary} onPress={() => handleTriggerPhoto('gallery', setPhotoEvidence)}>
                        <Text style={styles.photoBtnTextSecondary}>🖼️ GALERIA</Text>
                      </TouchableOpacity>
                      {photoEvidence && (
                        <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhotoEvidence(null)}>
                          <Text style={styles.removePhotoBtnText}>🗑️ REMOVER</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitWorkout}>
                <Text style={styles.primaryBtnText}>ENVIAR PARA APROVAÇÃO</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsWorkoutModalOpen(false)}>
                <Text style={styles.cancelBtnText}>CANCELAR</Text>
              </TouchableOpacity>
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

  timeSelectNative: { backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '6px', fontSize: '11px', fontWeight: 'bold', color: '#0f172a', width: '100%' },

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
  searchSectionHeader: { fontSize: 9, fontWeight: 'bold', color: '#f97316', marginBottom: 4, marginTop: 4 },
  searchResultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#ffffff', borderRadius: 4, marginBottom: 2 },
  searchResultTitle: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },
  searchResultSub: { fontSize: 8, color: '#64748b' },
  emptySearchText: { fontSize: 9, color: '#94a3b8', fontStyle: 'italic', padding: 6, textAlign: 'center' },

  requestCommunityBtn: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4 },
  alreadyMemberBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 4 },

  blueRequestAthleteBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  pendingAthleteBadge: { backgroundColor: '#f97316', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  activeAthleteBadge: { backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },

  topWinnersBannerBox: { backgroundColor: '#fef3c7', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#d97706', marginBottom: 10 },
  topWinnersBannerTitle: { fontSize: 10, fontWeight: '900', color: '#b45309', marginBottom: 2 },
  topWinnersBannerList: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a', marginTop: 2 },

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

  dashboardActionBtnGreen: { backgroundColor: '#16a34a', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  dashboardActionBtnOrange: { backgroundColor: '#d97706', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  dashboardActionBtnRed: { backgroundColor: '#dc2626', paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  dashboardActionBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },

  adminControlCard: { backgroundColor: '#fff7ed', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#f97316', marginBottom: 12 },
  adminCardTitle: { fontSize: 12, fontWeight: 'bold', color: '#c2410c', marginBottom: 4 },
  adminCardSub: { fontSize: 10, color: '#475569', marginBottom: 8 },

  accordionCard: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1.5, borderColor: '#cbd5e1', marginBottom: 10, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  accordionTitle: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', flex: 1 },
  accordionArrow: { fontSize: 12, color: '#f97316', fontWeight: 'bold', marginLeft: 8 },
  accordionBody: { padding: 12, backgroundColor: '#ffffff' },

  workoutPendingCard: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },

  rulesCardBox: { backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: '#f97316', borderRadius: 8, padding: 10, marginBottom: 10 },
  rulesCardTitle: { fontSize: 11, fontWeight: '900', color: '#c2410c', marginBottom: 4 },
  rulesCardItem: { fontSize: 9.5, fontWeight: '600', color: '#431407', marginBottom: 2 },

  modalityGridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  modalityChipBtn: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, width: '48%' },
  modalityChipBtnActive: { backgroundColor: '#f97316', borderColor: '#c2410c' },
  modalityChipText: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center' },
  modalityChipTextActive: { color: '#ffffff' },

  photoUploadBox: { backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', marginBottom: 6 },
  photoPreviewMini: { width: '100%', height: 90, borderRadius: 4, marginBottom: 6 },
  photoBtn: { backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  photoBtnText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },
  photoBtnSecondary: { backgroundColor: '#1e3a8a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  photoBtnTextSecondary: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },
  removePhotoBtn: { backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  removePhotoBtnText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },

  htmlNativeSelect: { width: '100%', padding: 10, fontSize: 11, fontWeight: 'bold', color: '#0f172a', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' },
  htmlNativeSelectSmall: { width: '100%', padding: 5, fontSize: 9, fontWeight: 'bold', color: '#0f172a', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' },

  stepMiniInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, padding: 5, fontSize: 10, width: 55, textAlign: 'center', marginBottom: 0 },

  participantRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#fed7aa', marginTop: 6 },
  participantName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  tagActiveText: { fontSize: 9, color: '#16a34a', fontWeight: 'bold' },
  participantSub: { fontSize: 9, color: '#64748b' },

  lockBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4 },
  spectatorBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  approveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  banBtn: { backgroundColor: '#dc2626', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  inviteBtn: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, justifyContent: 'center' },
  btnMiniText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },

  rankingRowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6 },
  spectatorRowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 4 },
  spectatorBadge: { fontSize: 8, fontWeight: 'bold', color: '#64748b', backgroundColor: '#e2e8f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  
  rankingPosNumber: { fontSize: 14, fontWeight: '900', color: '#f97316', width: 32 },
  rankingMemberName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  rankingMemberSub: { fontSize: 9, color: '#64748b' },
  rankingMemberPts: { fontSize: 12, fontWeight: 'bold', color: '#16a34a' },
  rankingMemberBank: { fontSize: 8, color: '#64748b' },

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
  postImgCarousel: { width: 240, height: 180, marginRight: 6, borderRadius: 4 },
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
  avatarLarge: { width: 70, height: 70, borderRadius: 35, marginBottom: 6, borderWidth: 2, borderColor: '#f97316' },
  profileNicknameDisplay: { fontSize: 16, fontWeight: '900', color: '#1e3a8a', marginBottom: 2 },
  profileMeta: { fontSize: 10, color: '#64748b', marginBottom: 4 },

  editProfileBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginVertical: 6 },
  editProfileBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },

  athleteStatusBadgeContainer: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6, marginVertical: 4, borderWidth: 1, borderColor: '#16a34a' },
  athleteStatusBadgeText: { fontSize: 10, fontWeight: 'bold', color: '#16a34a' },

  medalsRowContainer: { flexDirection: 'row', gap: 12, marginVertical: 8, backgroundColor: '#ffffff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  medalBadgeItem: { alignItems: 'center' },
  medalBadgeCount: { fontSize: 9, fontWeight: 'bold', color: '#1e3a8a', marginTop: 2 },

  scoreRowContainer: { flexDirection: 'row', gap: 8, width: '100%', marginVertical: 8, justifyContent: 'center' },
  scoreBoxItem: { flex: 1, backgroundColor: '#ffffff', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  scoreNumber: { fontSize: 14, fontWeight: '900', color: '#f97316' },
  scoreLabel: { fontSize: 8, fontWeight: 'bold', color: '#1e3a8a', marginTop: 2 },

  sectionContainerBox: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },

  storyAddBtnCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  storyThumbnailCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#1e3a8a', marginRight: 8 },
  storyDeleteBtn: { position: 'absolute', top: -2, right: 4, backgroundColor: '#dc2626', width: 14, height: 14, borderRadius: 7, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ffffff' },

  storyModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  storyModalContainer: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  storyProgressBar: { position: 'absolute', top: 40, left: 16, right: 16, zIndex: 10 },
  storyFullscreenImage: { width: '100%', height: '80%', resizeMode: 'contain' },
  storyCloseBtn: { position: 'absolute', top: 60, right: 20, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, zIndex: 15 },

  statsCardItemButton: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6 },

  goalAddHeaderBtn: { backgroundColor: '#f97316', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  goalCheckboxRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 4, gap: 8 },
  goalCheckboxSquare: { width: 16, height: 16, borderWidth: 1.5, borderColor: '#1e3a8a', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  goalCheckboxSquareActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  goalTextLabel: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 14 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, maxHeight: '90%' },
  modalContentLarge: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, maxHeight: '95%', width: '95%', alignSelf: 'center' },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 10, textAlign: 'center' },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#475569', marginVertical: 4 },
  inputLabelMini: { fontSize: 9, fontWeight: 'bold', color: '#475569', marginVertical: 2 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 6, fontSize: 11, marginBottom: 6 },

  scoringModeBoxContainer: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', marginTop: 10 },

  chipBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  chipBtnActive: { backgroundColor: '#f97316' },
  chipText: { fontSize: 9, fontWeight: 'bold', color: '#475569' },
  chipTextActive: { color: '#ffffff' },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 8 },
  checkboxBoxCircle: { width: 18, height: 18, borderWidth: 2, borderColor: '#1e3a8a', borderRadius: 9, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  checkboxBoxCircleActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  checkboxCheckmark: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },

  cancelBtn: { marginTop: 6, paddingVertical: 4, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' }
});
