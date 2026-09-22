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

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // FORMULÁRIO DE AUTENTICAÇÃO
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [genderInput, setGenderInput] = useState('Masculino');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // EDIÇÃO DE PERFIL
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editGender, setEditGender] = useState('Masculino');
  const [editAvatar, setEditAvatar] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

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

  const [isHeaderSelectOpen, setIsHeaderSelectOpen] = useState(false);

  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [isAdminContext, setIsAdminContext] = useState(true);

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0] || {};

  const [commentInputs, setCommentInputs] = useState({});

  // ESTADOS DO FORMULÁRIO DE NOVO TREINO
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

  // FOTOS DE COMPROVAÇÃO
  const [photoStart, setPhotoStart] = useState(null);
  const [photoEvidence, setPhotoEvidence] = useState(null);
  const [photoEnd, setPhotoEnd] = useState(null);

  // CRIAR DESAFIO
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeCode, setNewChallengeCode] = useState('');
  const [hasCapToggle, setHasCapToggle] = useState(false);
  const [newChallengeCap, setNewChallengeCap] = useState('22000');

  // ESTADOS DO PAINEL DO ADMINISTRADOR
  const [expandedSec1, setExpandedSec1] = useState(true);
  const [expandedSec2, setExpandedSec2] = useState(false);
  const [expandedSec3, setExpandedSec3] = useState(false);
  const [expandedSec4, setExpandedSec4] = useState(false);
  const [expandedSec5, setExpandedSec5] = useState(false);

  // FORMULÁRIO DE LANÇAMENTO MANUAL DO ADMIN
  const [manualSelectedAthleteId, setManualSelectedAthleteId] = useState('');
  const [manualActivity, setManualActivity] = useState('💪 Musculação');
  const [manualRankingPts, setManualRankingPts] = useState('');
  const [manualBankPts, setManualBankPts] = useState('');
  const [manualSteps, setManualSteps] = useState('');
  const [checkBonusInquebravel, setCheckBonusInquebravel] = useState(false);
  const [checkBonusDesperta, setCheckBonusDesperta] = useState(false);

  const [isAthleteDropdownOpen, setIsAthleteDropdownOpen] = useState(false);

  // ESTADOS DO MODAL DE CONFIGURAÇÃO AVANÇADA DE PONTOS
  const [isAdvancedRulesModalOpen, setIsAdvancedRulesModalOpen] = useState(false);
  const [selectedConfigChallengeId, setSelectedConfigChallengeId] = useState(null);
  const [selectedConfigActivity, setSelectedConfigActivity] = useState('🏛️ Base da Liga');

  // CONFIGURAÇÕES AVANÇADAS LOCAIS
  const [leaguePeriod, setLeaguePeriod] = useState('Monthly'); // 'Weekly', 'Monthly', 'Yearly'
  
  // CONFIGURAÇÕES DE PASSOS DIÁRIOS
  const [dailyStepsConfig, setDailyStepsConfig] = useState({
    enabled: true,
    enableRankingScore: true,
    manualStepsInput: '10000',
    multiplier: '0.5'
  });

  // CONFIGURAÇÕES DE BÔNUS
  const [bonusConfig, setBonusConfig] = useState({
    inquebravelEnabled: true,
    inquebravelDays: '3',
    inquebravelPts: '5000',
    despertaEnabled: true,
    despertaLimitTime: '08:00',
    despertaPts: '3000'
  });

  const [modalitySettings, setModalitySettings] = useState({
    '💪 Musculação': { enabled: true, scoringMode: 'checkin', checkinPts: '10000', checkinMinTime: '60', simplePts: '5000', simplePerMin: '30', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }] },
    '🏋️ Crossfit / Treino Funcional': { enabled: true, scoringMode: 'checkin', checkinPts: '10000', checkinMinTime: '60', simplePts: '5000', simplePerMin: '30', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }] },
    '🫀 Treino Aeróbico': { enabled: true, scoringMode: 'checkin', checkinPts: '10000', checkinMinTime: '60', simplePts: '5000', simplePerMin: '30', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }] },
    '⚽ Esportes Coletivos': { enabled: true, scoringMode: 'checkin', checkinPts: '10000', checkinMinTime: '60', simplePts: '5000', simplePerMin: '30', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }] },
    '🥋 Lutas / Esportes Individuais': { enabled: true, scoringMode: 'checkin', checkinPts: '10000', checkinMinTime: '60', simplePts: '5000', simplePerMin: '30', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }] },
    '🏃 Corrida': { enabled: true, scoringMode: 'checkin', checkinPts: '10000', checkinMinTime: '30', simplePts: '1000', simplePerKm: '1', kmSimplePts: '1000', kmPerX: '1', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '5000' }], kmSteps: [{ modeType: 'De', minKm: '0', maxKm: '5', pts: '5000' }] },
    '🚶 Caminhada': { enabled: true, scoringMode: 'checkin', checkinPts: '5000', checkinMinTime: '30', simplePts: '500', simplePerKm: '1', kmSimplePts: '500', kmPerX: '1', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '30', pts: '3000' }], kmSteps: [{ modeType: 'De', minKm: '0', maxKm: '3', pts: '3000' }] },
    '🚴 Bike': { enabled: true, scoringMode: 'checkin', checkinPts: '8000', checkinMinTime: '45', simplePts: '1000', simplePerKm: '5', kmSimplePts: '1000', kmPerX: '5', timeSteps: [{ modeType: 'De', minTime: '0', maxTime: '45', pts: '5000' }], kmSteps: [{ modeType: 'De', minKm: '0', maxKm: '15', pts: '8000' }] }
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

        const computedAge = formattedDate ? calculateAge(formattedDate) : (data.age || 0);

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
    setEditNickname(currentUser.nickname || '');
    setEditBirthDate(currentUser.birth_date || '');
    setEditGender(currentUser.gender || 'Masculino');
    setEditAvatar(currentUser.avatar || '');
    setIsEditProfileOpen(true);
  }

  async function handleSaveProfile() {
    if (!editNickname.trim()) {
      Alert.alert('Atenção', 'O apelido não pode ficar vazio.');
      return;
    }

    setSavingProfile(true);

    try {
      const computedAge = calculateAge(editBirthDate);

      let dbBirthDate = null;
      if (editBirthDate && editBirthDate.length === 10) {
        const parts = editBirthDate.split('/');
        if (parts.length === 3) {
          dbBirthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .upsert([
          {
            id: currentUser.id,
            nickname: editNickname.trim(),
            birth_date: dbBirthDate,
            age: computedAge || 0,
            gender: editGender,
            avatar_url: editAvatar
          }
        ], { onConflict: 'id' });

      if (error) {
        Alert.alert('Erro', 'Não foi possível salvar o perfil: ' + error.message);
      } else {
        const updatedUser = {
          ...currentUser,
          nickname: editNickname.trim(),
          birth_date: editBirthDate,
          age: computedAge || 0,
          gender: editGender,
          avatar: editAvatar || currentUser.avatar
        };

        setCurrentUser(updatedUser);
        setViewedUser(updatedUser);
        setIsEditProfileOpen(false);

        Alert.alert('🎉 Sucesso!', 'Perfil atualizado com sucesso!');
      }
    } catch (err) {
      Alert.alert('Erro Inesperado', err.message || 'Ocorreu um erro ao salvar o perfil.');
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
        if (!activeChallengeId) {
          setActiveChallengeId(formattedChallenges[0].id);
        }
        if (!selectedConfigChallengeId) {
          setSelectedConfigChallengeId(formattedChallenges[0].id);
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
        `Sua solicitação para ser Atleta Ativo no "${selectedChallenge.title}" foi enviada. Acesse o menu Administrador ➔ 2. Controle de Inscrição para aprovar.`
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
    const newObj = {
      id: newId,
      title: newChallengeTitle.trim(),
      invite_code: newChallengeCode.trim().toUpperCase(),
      creator_id: currentUser.id,
      has_daily_cap: hasCapToggle,
      daily_cap: hasCapToggle ? (parseInt(newChallengeCap, 10) || 22000) : null,
      registrations_closed: false,
      is_finished: false,
      start_date: '01/10/2026',
      end_date: '31/10/2026',
      tiebreaker_enabled: true
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

    Alert.alert('Sucesso', 'Liga criada com sucesso! Para participar do ranking como atleta, solicite participação no topo da aba Ranking.');
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
    const challengeMembers = memberships.filter(m => m.challengeId === challengeId && m.role === 'active');
    const sorted = [...challengeMembers].sort((a, b) => (b.rankingPoints || 0) - (a.rankingPoints || 0));

    if (sorted[0]) {
      await supabase.from('memberships').update({ gold_medals: (sorted[0].goldMedals || 0) + 1 }).eq('id', sorted[0].id);
      await supabase.from('profiles').update({ gold_medals: (sorted[0].goldMedals || 0) + 1 }).eq('id', sorted[0].userId);
    }
    if (sorted[1]) {
      await supabase.from('memberships').update({ silver_medals: (sorted[1].silverMedals || 0) + 1 }).eq('id', sorted[1].id);
      await supabase.from('profiles').update({ silver_medals: (sorted[1].silverMedals || 0) + 1 }).eq('id', sorted[1].userId);
    }
    if (sorted[2]) {
      await supabase.from('memberships').update({ bronze_medals: (sorted[2].bronzeMedals || 0) + 1 }).eq('id', sorted[2].id);
      await supabase.from('profiles').update({ bronze_medals: (sorted[2].bronzeMedals || 0) + 1 }).eq('id', sorted[2].userId);
    }

    await supabase.from('memberships').update({ role: 'spectator', ranking_points: 0, bank_points: 0 }).eq('challenge_id', challengeId);
    await supabase.from('challenges').update({ is_finished: false, registrations_closed: false }).eq('id', challengeId);

    fetchDataFromSupabase();
    Alert.alert('🏆 Temporada Encerrada!', 'As medalhas foram atribuídas aos 3 primeiros colocados. Todos os atletas passaram para o status de Torcedor.');
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

    const newPost = {
      id: `p_man_${Date.now()}`,
      challenge_id: selectedChallenge.id,
      user_id: member.userId,
      user_name: member.name,
      user_nickname: member.nickname,
      user_avatar: member.avatar,
      activity_type: manualActivity.toUpperCase(),
      caption: `Lançamento manual de pontos pelo Administrador (${manualActivity})`,
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

    if (workout.activity_type !== 'PASSOS DIÁRIOS') {
      const { data: currentMem } = await supabase.from('memberships')
        .select('ranking_points, bank_points')
        .eq('challenge_id', workout.challengeId)
        .eq('user_id', workout.user_id)
        .single();

      if (currentMem) {
        await supabase.from('memberships').update({
          ranking_points: (currentMem.ranking_points || 0) + workout.points_to_ranking,
          bank_points: (currentMem.bank_points || 0) + workout.points_to_bank
        }).eq('challenge_id', workout.challengeId).eq('user_id', workout.user_id);
      }
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
    Alert.alert('Treino Aprovado!', 'O treino com todas as suas imagens foi publicado automaticamente no Feed!');
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
      input.accept = 'image/*';
      
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
        '📷 Seleção de Imagem',
        'Abra a câmera ou galeria do seu dispositivo para selecionar o comprovante.'
      );
    }
  };

  async function handleSubmitWorkout() {
    if (!currentUserMembershipInActiveChallenge || currentUserMembershipInActiveChallenge.role !== 'active') {
      Alert.alert('Acesso Restrito', 'Apenas Atletas Ativos com candidatura aprovada podem submeter treinos nesta liga.');
      return;
    }

    const isGymGroup = ['💪 Musculação', '🏋️ Crossfit / Treino Funcional', '🫀 Treino Aeróbico'].includes(selectedActivity);
    
    if (isGymGroup) {
      if (!photoStart || !photoEvidence || !photoEnd) {
        Alert.alert('Comprovante Incompleto', 'Envie as 3 fotos obrigatórias: Início, Evidência e Fim.');
        return;
      }
    } else {
      if (!photoEvidence) {
        Alert.alert('Comprovante Obrigatório', 'Adicione a foto de comprovação da atividade.');
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

    const hasAlreadySubmittedToday = 
      feedPosts.some(p => p.challenge_id === activeChallengeId && p.user_id === currentUser.id && (p.activity_type || '').toUpperCase() === cleanActType && p.created_at.includes(formattedDateStr)) ||
      pendingWorkouts.some(w => w.challenge_id === activeChallengeId && w.user_id === currentUser.id && (w.activity_type || '').toUpperCase() === cleanActType && w.created_at.includes(formattedDateStr));

    if (hasAlreadySubmittedToday) {
      Alert.alert(
        '🚫 Trava de Treino Diário',
        `Você já registrou um treino de "${selectedActivity}" na data selecionada (${formattedDateStr})!`
      );
      return;
    }

    const startMins = (parseInt(startHour, 10) * 60) + parseInt(startMinute, 10);
    const endMins = (parseInt(endHour, 10) * 60) + parseInt(endMinute, 10);
    let dur = endMins - startMins;
    if (dur <= 0) dur += 1440;

    let points = dur >= 60 ? 10000 : 5000;

    // APLICAÇÃO AUTOMÁTICA DOS BÔNUS SE ATENDIDOS
    let bonusAppliedMsg = '';
    if (bonusConfig.despertaEnabled) {
      const submissionCurrentTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
      if (submissionCurrentTime <= bonusConfig.despertaLimitTime) {
        points += parseInt(bonusConfig.despertaPts, 10) || 3000;
        bonusAppliedMsg += ' | ⏰ Bônus "O Desperta" aplicado automaticamente!';
      }
    }

    if (bonusConfig.inquebravelEnabled) {
      points += parseInt(bonusConfig.inquebravelPts, 10) || 5000;
      bonusAppliedMsg += ' | 🪨 Bônus "O Inquebrável" aplicado automaticamente!';
    }

    let ptsRanking = points;
    let ptsBank = 0;

    if (selectedChallenge?.has_daily_cap && selectedChallenge?.daily_cap) {
      ptsRanking = Math.min(points, selectedChallenge.daily_cap);
      ptsBank = Math.max(0, points - selectedChallenge.daily_cap);
    }

    const timeWindowStr = `${startHour}:${startMinute} às ${endHour}:${endMinute}`;

    const newPendingWorkout = {
      id: `pw_${Date.now()}`,
      challenge_id: activeChallengeId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_nickname: currentUser.nickname,
      user_avatar: currentUser.avatar,
      activity_type: cleanActType,
      caption: (workoutCaption || `Atividade de ${selectedActivity} (${dur} min)`) + bonusAppliedMsg,
      photo_start: photoStart,
      photo_evidence: photoEvidence,
      photo_end: photoEnd,
      points_to_ranking: ptsRanking,
      points_to_bank: ptsBank,
      created_at: `${formattedDateStr} (${timeWindowStr})`
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
    
    Alert.alert('Sucesso', 'Treino enviado para a nuvem com verificação automática de bônus! Aguardando aprovação do Admin.');
  }

  async function handleSaveAdvancedRules() {
    if (selectedConfigChallengeId && selectedChallenge) {
      await supabase.from('challenges').update({
        title: selectedChallenge.title,
        has_daily_cap: selectedChallenge.has_daily_cap,
        daily_cap: selectedChallenge.daily_cap
      }).eq('id', selectedConfigChallengeId);
    }

    setIsAdvancedRulesModalOpen(false);
    Alert.alert('Sucesso', 'Configurações de Regras salvas com sucesso!');
  }

  // HELPERS DE MANIPULAÇÃO DE STEPS DAS MODALIDADES
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
    ruleLines.push(`• ${selectedActivity}: Modalidade Padrão`);

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
    .sort((a, b) => (b.goldMedals || 0) - (a.goldMedals || 0))
    .slice(0, 3)
    .map((m) => `${m.name} - ${m.goldMedals || 0}x Ouro`);

  let displayedPerf = {
    rankingPoints: userMembershipsAll.reduce((acc, curr) => acc + (curr.rankingPoints || 0), 0),
    bankPoints: userMembershipsAll.reduce((acc, curr) => acc + (curr.bankPoints || 0), 0),
    totalSteps: userMembershipsAll.reduce((acc, curr) => acc + (curr.totalSteps || 0), 0),
    goldMedals: viewedUser.goldMedals || 0,
    silverMedals: viewedUser.silverMedals || 0,
    bronzeMedals: viewedUser.bronzeMedals || 0
  };

  const selectedAthleteObject = activeMembersInChallenge.find(m => m.id === manualSelectedAthleteId);

  // CÁLCULO DINÂMICO DE PONTOS DOS PASSOS DIÁRIOS
  const calculatedStepsPoints = Math.round(
    (parseFloat(dailyStepsConfig.manualStepsInput) || 0) * (parseFloat(dailyStepsConfig.multiplier) || 0)
  );

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
            <TouchableOpacity 
              style={styles.nativeSelectButton} 
              onPress={() => setIsHeaderSelectOpen(true)}
            >
              <Text style={styles.nativeSelectButtonText}>
                {selectedChallenge.title || 'Selecione um Desafio'} ({selectedChallenge.creator_id === currentUser.id ? '🔑 Administrador' : currentUserMembershipInActiveChallenge?.role === 'active' ? '⚡ Atleta Ativo' : '👀 Torcedor / Pendente'}) ▼
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PESQUISA DE LIGAS E ATLETAS */}
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
                      Código: {c.invite_code} | {c.startDate} até {c.endDate}
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

          {/* FEED */}
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
                          <Text style={[styles.postAuthor, { textDecorationLine: 'underline' }]}>{post.user_name} ({post.user_nickname})</Text>
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

          {/* TELA DE RANKING */}
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
                    <Text style={styles.btnMiniText}>Solicitação de Participação - {selectedChallenge.title}</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.topWinnersBannerBox}>
                <Text style={styles.topWinnersBannerTitle}>🥇 MAIORES VENCEDORES DA LIGA</Text>
                <Text style={styles.topWinnersBannerList}>
                  {top3Winners.length > 0 ? top3Winners.join('; ') : 'Nenhum campeão registrado ainda'}
                </Text>
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
                      <Text style={styles.rankingMemberName}>{member.name} ({member.nickname})</Text>
                      <Text style={styles.rankingMemberSub}>{(member.totalSteps || 0).toLocaleString()} passos</Text>
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
                        <Text style={styles.rankingMemberName}>{spectator.name} ({spectator.nickname})</Text>
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
                <Text style={styles.profileName}>{viewedUser.name} ({viewedUser.nickname})</Text>
                
                <Text style={styles.profileMeta}>
                  {viewedUser.age ? `${viewedUser.age} anos` : 'Idade não informada'} | {viewedUser.gender || 'Masculino'}
                </Text>

                {viewedUser.id === currentUser.id && (
                  <TouchableOpacity style={styles.editProfileBtn} onPress={handleOpenEditProfile}>
                    <Text style={styles.editProfileBtnText}>✏️ EDITAR PERFIL</Text>
                  </TouchableOpacity>
                )}

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
            </ScrollView>
          )}

          {/* PAINEL ADMINISTRADOR */}
          {currentScreen === 'admin' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>🎯 Central do Administrador: {selectedChallenge.title}</Text>
                <Text style={styles.adminCardSub}>Gerencie aprovações, inscrições de atletas ativos, lançamento manual, membros e configurações avançadas.</Text>
              </View>

              {/* 1. APROVAÇÃO DE TREINOS */}
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
                      currentPendingWorkouts.map((w) => (
                        <View key={w.id} style={styles.workoutPendingCard}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                            <Image source={{ uri: w.user_avatar }} style={styles.avatarMini} />
                            <View style={{ marginLeft: 8, flex: 1 }}>
                              <Text style={styles.participantName}>{w.user_name} ({w.user_nickname})</Text>
                              <Text style={styles.participantSub}>Exercício: {w.activity_type}</Text>
                            </View>
                            <Text style={styles.tagActiveText}>+{w.points_to_ranking} pts</Text>
                          </View>

                          <Text style={{ fontSize: 10, color: '#334155', marginBottom: 6 }}>{w.caption}</Text>

                          {w.photo_evidence && (
                            <Image source={{ uri: w.photo_evidence }} style={styles.evidenceImagePreview} />
                          )}

                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                            <TouchableOpacity style={[styles.approveBtn, { flex: 1, alignItems: 'center' }]} onPress={() => handleApproveWorkout(w.id)}>
                              <Text style={styles.btnMiniText}>✅ APROVAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.banBtn, { flex: 1, alignItems: 'center' }]} onPress={() => handleRejectWorkout(w.id)}>
                              <Text style={styles.btnMiniText}>❌ REJEITAR</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </View>

              {/* 2. CONTROLE DE INSCRIÇÃO */}
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

                    {/* SOLICITAÇÕES PENDENTES */}
                    <Text style={[styles.inputLabel, { marginTop: 4, color: '#d97706' }]}>Solicitações para Atleta Ativo ({pendingAthleteMembers.length}):</Text>
                    {pendingAthleteMembers.length === 0 ? (
                      <Text style={styles.emptyNoticeText}>Nenhuma solicitação de Atleta Ativo pendente.</Text>
                    ) : (
                      pendingAthleteMembers.map((m) => (
                        <View key={m.id} style={styles.participantRow}>
                          <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.participantName}>{m.name} ({m.nickname})</Text>
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

                    {/* ATLETAS ATIVOS CADASTRADOS */}
                    <Text style={[styles.inputLabel, { marginTop: 12, color: '#16a34a' }]}>
                      ⚡ Atletas Ativos na Liga ({activeMembersInChallenge.length}):
                    </Text>
                    {activeMembersInChallenge.length === 0 ? (
                      <Text style={styles.emptyNoticeText}>Nenhum atleta ativo cadastrado nesta liga.</Text>
                    ) : (
                      activeMembersInChallenge.map((m) => (
                        <View key={m.id} style={styles.participantRow}>
                          <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.participantName}>{m.name} ({m.nickname})</Text>
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

              {/* 3. LANÇAMENTO MANUAL DE PONTOS */}
              <View style={styles.accordionCard}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedSec3(!expandedSec3)}>
                  <Text style={styles.accordionTitle}>3. LANÇAMENTO MANUAL DE PONTOS, BÔNUS E PASSOS</Text>
                  <Text style={styles.accordionArrow}>{expandedSec3 ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {expandedSec3 && (
                  <View style={styles.accordionBody}>
                    <Text style={styles.inputLabel}>Selecionar Atleta Ativo:</Text>
                    <TouchableOpacity 
                      style={styles.dropdownSelectBox} 
                      onPress={() => setIsAthleteDropdownOpen(!isAthleteDropdownOpen)}
                    >
                      <Text style={styles.dropdownSelectText}>
                        {selectedAthleteObject ? `${selectedAthleteObject.name} (${selectedAthleteObject.nickname})` : 'Clique para selecionar um atleta...'} ▼
                      </Text>
                    </TouchableOpacity>

                    {isAthleteDropdownOpen && (
                      <View style={styles.floatingDropdownContainer}>
                        {activeMembersInChallenge.map((m) => (
                          <TouchableOpacity
                            key={m.id}
                            style={styles.dropdownOptionRow}
                            onPress={() => {
                              setManualSelectedAthleteId(m.id);
                              setIsAthleteDropdownOpen(false);
                            }}
                          >
                            <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                            <Text style={{ fontSize: 10, fontWeight: 'bold', marginLeft: 6 }}>{m.name} ({m.nickname})</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

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

              {/* 4. GERENCIAMENTO DE MEMBROS */}
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
                            <Text style={styles.participantName}>{p.name} ({p.nickname})</Text>
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
                          <Text style={styles.participantName}>{m.name} ({m.nickname})</Text>
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

              {/* 5. CONFIGURAÇÃO AVANÇADA DE PONTOS */}
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

      {/* MODAL CONFIGURAÇÃO AVANÇADA DE PONTOS E REGRAS DA LIGA */}
      <Modal visible={isAdvancedRulesModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>⚙️ Configuração Avançada de Pontos</Text>

            <ScrollView style={{ maxHeight: 520 }} keyboardShouldPersistTaps="handled">
              
              <Text style={styles.inputLabel}>1 - Selecione o Desafio Para Configurar:</Text>
              <View style={styles.nativeSelectWrapper}>
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
              </View>

              <Text style={styles.inputLabel}>2 - Selecione a Categoria para Configurar:</Text>
              <View style={styles.nativeSelectWrapper}>
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
              </View>

              {/* 1. BASE DA LIGA */}
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
                  
                  {/* BARRA DE ROLAGEM HORIZONTAL E OPÇÕES VERTICAIS (UMA EMBAIXO DA OUTRA) */}
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

              {/* PASSOS DIÁRIOS */}
              {selectedConfigActivity === '🚶‍♂️ Passos Diários' && (
                <View style={styles.scoringModeBoxContainer}>
                  <Text style={styles.sectionHeaderTitle}>🚶‍♂️ Configuração de Passos Diários</Text>

                  {/* CHECKBOX 1: HABILITAR MODALIDADE */}
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
                      {/* CHECKBOX 2: USAR NO PLACAR GERAL (RANKING) */}
                      <TouchableOpacity 
                        style={[styles.checkboxRow, { marginTop: 10 }]} 
                        onPress={() => setDailyStepsConfig({ ...dailyStepsConfig, enableRankingScore: !dailyStepsConfig.enableRankingScore })}
                      >
                        <View style={[styles.checkboxBoxCircle, dailyStepsConfig.enableRankingScore && styles.checkboxBoxCircleActive]}>
                          {dailyStepsConfig.enableRankingScore && <Text style={styles.checkboxCheckmark}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>Usar pontos da modalidade no Placar Geral (Ranking)</Text>
                      </TouchableOpacity>

                      {/* CAMPOS SE HABILITADO PARA O PLACAR GERAL */}
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

              {/* 1 - TREINOS SEM KM (Musculação, Crossfit, Aeróbico, Coletivos, Lutas) */}
              {['💪 Musculação', '🏋️ Crossfit / Treino Funcional', '🫀 Treino Aeróbico', '⚽ Esportes Coletivos', '🥋 Lutas / Esportes Individuais'].includes(selectedConfigActivity) && (() => {
                const currentMod = modalitySettings[selectedConfigActivity] || {};
                const isEnabled = currentMod.enabled !== false;
                const scoringMode = currentMod.scoringMode || 'checkin';

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
                        {/* OPÇÃO 1: TAXA SIMPLES */}
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

                        {/* OPÇÃO 2: STEP DE TEMPO */}
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
                                        <View style={styles.nativeSelectWrapperSmall}>
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
                                        </View>

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
                                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#64748b' }}>until</Text>
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

              {/* 2 - TREINOS COM KM (Corrida, Caminhada, Bike) */}
              {['🏃 Corrida', '🚶 Caminhada', '🚴 Bike'].includes(selectedConfigActivity) && (() => {
                const currentMod = modalitySettings[selectedConfigActivity] || {};
                const isEnabled = currentMod.enabled !== false;
                const scoringMode = currentMod.scoringMode || 'checkin';

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
                        {/* OPÇÃO 1: TAXA SIMPLES TEMPO */}
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

                        {/* OPÇÃO 2: POR DISTÂNCIA MÍNIMA PERCORRIDA (KM) */}
                        <TouchableOpacity 
                          style={styles.checkboxRow} 
                          onPress={() => handleUpdateModalityProp(selectedConfigActivity, 'scoringMode', 'kmSimple')}
                        >
                          <View style={[styles.checkboxBoxCircle, scoringMode === 'kmSimple' && styles.checkboxBoxCircleActive]}>
                            {scoringMode === 'kmSimple' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.checkboxLabel}>Opção 2: Por Distância mínima percorrida (em Km)</Text>
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

                        {/* OPÇÃO 3: STEP DE TEMPO */}
                        <TouchableOpacity 
                          style={styles.checkboxRow} 
                          onPress={() => handleUpdateModalityProp(selectedConfigActivity, 'scoringMode', 'timeSteps')}
                        >
                          <View style={[styles.checkboxBoxCircle, scoringMode === 'timeSteps' && styles.checkboxBoxCircleActive]}>
                            {scoringMode === 'timeSteps' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.checkboxLabel}>Opção 3: Por Step de tempo (em minutos)</Text>
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
                                        <View style={styles.nativeSelectWrapperSmall}>
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
                                        </View>

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
                                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#64748b' }}>until</Text>
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

                        {/* OPÇÃO 4: STEP DE DISTÂNCIA PERCORRIDA (KM) */}
                        <TouchableOpacity 
                          style={styles.checkboxRow} 
                          onPress={() => handleUpdateModalityProp(selectedConfigActivity, 'scoringMode', 'kmSteps')}
                        >
                          <View style={[styles.checkboxBoxCircle, scoringMode === 'kmSteps' && styles.checkboxBoxCircleActive]}>
                            {scoringMode === 'kmSteps' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.checkboxLabel}>Opção 4: Por Step de Distância Percorrida (em KM)</Text>
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
                                        <View style={styles.nativeSelectWrapperSmall}>
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
                                        </View>

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
                                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#64748b' }}>until</Text>
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

              {/* 3. BÔNUS E CRITÉRIOS DE DESEMPATE */}
              {selectedConfigActivity === '🎁 Bônus e Critérios de Desempate' && (
                <View style={styles.scoringModeBoxContainer}>
                  <Text style={styles.sectionHeaderTitle}>🎁 Bônus e Critérios de Desempate</Text>

                  {/* BÔNUS O INQUEBRÁVEL */}
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

                  {/* BÔNUS O DESPERTA */}
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

                      <View style={{ width: 90 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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

      {/* MODAL PERFIL */}
      <Modal visible={isEditProfileOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Editar Perfil do Atleta</Text>

            <Text style={styles.inputLabel}>Apelido (exibido no ranking):</Text>
            <TextInput style={styles.input} placeholder="Digite seu apelido" value={editNickname} onChangeText={setEditNickname} />

            <Text style={styles.inputLabel}>Data de Nascimento (DD/MM/AAAA):</Text>
            <TextInput style={styles.input} placeholder="Ex: 08/11/1997" keyboardType="numeric" maxLength={10} value={editBirthDate} onChangeText={(text) => setEditBirthDate(formatBirthDateMask(text))} />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>SALVAR ALTERAÇÕES</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditProfileOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL SELEÇÃO LIGA */}
      <Modal visible={isHeaderSelectOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsHeaderSelectOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione o Desafio Ativo</Text>
            <ScrollView>
              {challenges.map(c => (
                <TouchableOpacity 
                  key={c.id} 
                  style={styles.selectOptionRow}
                  onPress={() => {
                    selectChallengeContext(c, c.creator_id === currentUser.id);
                    setIsHeaderSelectOpen(false);
                  }}
                >
                  <Text style={styles.selectOptionText}>
                    {c.title} ({c.creator_id === currentUser.id ? '🔑 Admin' : '⚡ Atleta'})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* MODAL CRIAR DESAFIO */}
      <Modal visible={isCreateChallengeOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>🏆 Criar Novo Desafio / Liga</Text>

            <Text style={styles.inputLabel}>Nome do Desafio:</Text>
            <TextInput style={styles.input} placeholder="Ex: Desafio Verão 2026" value={newChallengeTitle} onChangeText={setNewChallengeTitle} />

            <Text style={styles.inputLabel}>Código de Acesso / Convite:</Text>
            <TextInput style={styles.input} placeholder="Ex: MUV2026" autoCapitalize="characters" value={newChallengeCode} onChangeText={setNewChallengeCode} />

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

      {/* MODAL REGISTRO TREINO */}
      <Modal visible={isWorkoutModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={{ width: '100%', maxHeight: 540 }} keyboardShouldPersistTaps="handled">
              
              <Text style={styles.modalTitle}>Registrar Treino ({selectedChallenge?.title || 'MuvFit'})</Text>

              <View style={styles.rulesCardBox}>
                <Text style={styles.rulesCardTitle}>📜 Regras Ativas & Bônus Automáticos:</Text>
                {getDynamicActiveRulesText().map((ruleText, idx) => (
                  <Text key={idx} style={styles.rulesCardItem}>{ruleText}</Text>
                ))}
              </View>

              <Text style={styles.inputLabel}>Selecione a Modalidade:</Text>
              <View style={styles.modalityGridContainer}>
                {modalitiesList.filter(m => m.value !== '🎁 Bônus e Critérios de Desempate' && m.value !== '🏛️ Base da Liga').map((item) => {
                  const isSelected = selectedActivity === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.modalityChipBtn, isSelected && styles.modalityChipBtnActive]}
                      onPress={() => setSelectedActivity(item.value)}
                    >
                      <Text style={[styles.modalityChipText, isSelected && styles.modalityChipTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Legenda / Comentário (Opcional):</Text>
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Escreva algo sobre o treino..." multiline value={workoutCaption} onChangeText={setWorkoutCaption} />

              <View style={{ marginVertical: 8 }}>
                <Text style={styles.inputLabelMini}>Comprovante de Treino (Foto / Print):</Text>
                <View style={styles.photoUploadBox}>
                  {photoEvidence && <Image source={{ uri: photoEvidence }} style={styles.photoPreviewMini} />}
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <TouchableOpacity style={styles.photoBtn} onPress={() => handleTriggerPhoto('camera', setPhotoEvidence)}>
                      <Text style={styles.photoBtnText}>📷 TIRAR FOTO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoBtnSecondary} onPress={() => handleTriggerPhoto('gallery', setPhotoEvidence)}>
                      <Text style={styles.photoBtnTextSecondary}>🖼️ GALERIA</Text>
                    </TouchableOpacity>
                  </View>
                </View>
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

  nativeSelectButton: { backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6 },
  nativeSelectButtonText: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },
  selectOptionRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  selectOptionText: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },

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

  adminControlCard: { backgroundColor: '#fff7ed', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#f97316', marginBottom: 12 },
  adminCardTitle: { fontSize: 12, fontWeight: 'bold', color: '#c2410c', marginBottom: 4 },
  adminCardSub: { fontSize: 10, color: '#475569', marginBottom: 8 },

  accordionCard: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1.5, borderColor: '#cbd5e1', marginBottom: 10, overflow: 'hidden' },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  accordionTitle: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a', flex: 1 },
  accordionArrow: { fontSize: 12, color: '#f97316', fontWeight: 'bold', marginLeft: 8 },
  accordionBody: { padding: 12, backgroundColor: '#ffffff' },

  workoutPendingCard: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  evidenceImagePreview: { width: '100%', height: 140, borderRadius: 6, marginVertical: 6 },

  dropdownSelectBox: { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#f97316', borderRadius: 6, padding: 10, marginBottom: 4 },
  dropdownSelectText: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },

  rulesCardBox: { backgroundColor: '#fff7ed', borderWidth: 1.5, borderColor: '#f97316', borderRadius: 8, padding: 10, marginBottom: 10 },
  rulesCardTitle: { fontSize: 11, fontWeight: '900', color: '#c2410c', marginBottom: 4 },
  rulesCardItem: { fontSize: 9.5, fontWeight: '600', color: '#431407', marginBottom: 2 },

  modalityGridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  modalityChipBtn: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, width: '48%' },
  modalityChipBtnActive: { backgroundColor: '#f97316', borderColor: '#c2410c' },
  modalityChipText: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center' },
  modalityChipTextActive: { color: '#ffffff' },

  photoUploadBox: { backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' },
  photoPreviewMini: { width: '100%', height: 90, borderRadius: 4, marginBottom: 6 },
  photoBtn: { backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  photoBtnText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },
  photoBtnSecondary: { backgroundColor: '#1e3a8a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  photoBtnTextSecondary: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },

  nativeSelectWrapper: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, marginBottom: 6, overflow: 'hidden' },
  htmlNativeSelect: { width: '100%', padding: 8, fontSize: 11, fontWeight: 'bold', color: '#0f172a', backgroundColor: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' },

  nativeSelectWrapperSmall: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, overflow: 'hidden', width: 60 },
  htmlNativeSelectSmall: { width: '100%', padding: 5, fontSize: 9, fontWeight: 'bold', color: '#0f172a', backgroundColor: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' },

  stepMiniInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, padding: 5, fontSize: 10, width: 55, textAlign: 'center', marginBottom: 0 },

  floatingDropdownContainer: { backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#f97316', borderRadius: 6, marginBottom: 8, elevation: 10 },
  dropdownOptionRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#ffffff' },

  participantRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#fed7aa', marginTop: 6 },
  participantName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  tagActiveText: { fontSize: 9, color: '#16a34a', fontWeight: 'bold' },
  participantSub: { fontSize: 9, color: '#64748b' },

  lockBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4 },
  spectatorBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  approveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  banBtn: { backgroundColor: '#dc2626', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  inviteBtn: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, justifyContent: 'center' },
  deleteChallengeBtn: { backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, justifyContent: 'center' },
  finishChallengeBtn: { backgroundColor: '#d97706', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, justifyContent: 'center' },
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
  profileName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  profileMeta: { fontSize: 10, color: '#64748b', marginBottom: 4 },

  editProfileBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginVertical: 6 },
  editProfileBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },

  medalsRowContainer: { flexDirection: 'row', gap: 12, marginVertical: 8, backgroundColor: '#ffffff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' },
  medalBadgeItem: { alignItems: 'center' },
  medalBadgeCount: { fontSize: 9, fontWeight: 'bold', color: '#1e3a8a', marginTop: 2 },

  scoreRowContainer: { flexDirection: 'row', gap: 8, width: '100%', marginVertical: 8, justifyContent: 'center' },
  scoreBoxItem: { flex: 1, backgroundColor: '#ffffff', borderRadius: 8, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  scoreNumber: { fontSize: 14, fontWeight: '900', color: '#f97316' },
  scoreLabel: { fontSize: 8, fontWeight: 'bold', color: '#1e3a8a', marginTop: 2 },

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
