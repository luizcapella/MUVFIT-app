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
    member_status: 'active',
    goldMedals: 0,
    silverMedals: 0,
    bronzeMedals: 0,
    insigniaInquebravelCount: 0,
    insigniaDespertaCount: 0
  });

  const [viewedUser, setViewedUser] = useState(currentUser);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  
  const [challenges, setChallenges] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [pendingWorkouts, setPendingWorkouts] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isHeaderSelectOpen, setIsHeaderSelectOpen] = useState(false);

  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [isAdminContext, setIsAdminContext] = useState(true);

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0] || {};

  const [commentInputs, setCommentInputs] = useState({});

  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('Musculação');
  const [durationInput, setDurationInput] = useState('');
  const [kmInput, setKmInput] = useState('');
  const [stepsInput, setStepsInput] = useState('');
  const [workoutCaption, setWorkoutCaption] = useState('');
  const [photoEvidence, setPhotoEvidence] = useState(null);

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
  const [manualActivity, setManualActivity] = useState('Musculação');
  const [manualRankingPts, setManualRankingPts] = useState('');
  const [manualBankPts, setManualBankPts] = useState('');
  const [manualSteps, setManualSteps] = useState('');
  const [checkBonusInquebravel, setCheckBonusInquebravel] = useState(false);
  const [checkBonusDesperta, setCheckBonusDesperta] = useState(false);

  const [isAthleteDropdownOpen, setIsAthleteDropdownOpen] = useState(false);
  const [isActivityDropdownOpen, setIsActivityDropdownOpen] = useState(false);

  // MODAL DE CONFIGURAÇÃO AVANÇADA DE PONTOS
  const [isAdvancedRulesModalOpen, setIsAdvancedRulesModalOpen] = useState(false);
  const [selectedConfigChallengeId, setSelectedConfigChallengeId] = useState(null);
  const [selectedConfigActivity, setSelectedConfigActivity] = useState('💪 Musculação');
  
  const [modalitiesConfig, setModalitiesConfig] = useState({});
  const [scoringRules, setScoringRules] = useState({});

  const [athletePerfScope] = useState('overall');

  const modalitiesList = [
    { label: '💪 Musculação', value: '💪 Musculação' },
    { label: '🏋️ Crossfit / Treino Funcional', value: '🏋️ Crossfit / Treino Funcional' },
    { label: '🫀 Treino Aeróbico', value: '🫀 Treino Aeróbico' },
    { label: '🏃 Corrida', value: '🏃 Corrida' },
    { label: '🚶 Caminhada', value: '🚶 Caminhada' },
    { label: '🚴 Bike', value: '🚴 Bike' },
    { label: '⚽ Esportes Coletivos', value: '⚽ Esportes Coletivos' },
    { label: '🥋 Lutas / Esportes Individuais', value: '🥋 Lutas / Esportes Individuais' },
    { label: '🎁 Bônus e Critérios de Desempate', value: '🎁 Bônus e Critérios de Desempate' },
    { label: '🚶‍♂️ Passos Diários', value: '🚶‍♂️ Passos Diários' }
  ];

  const isCurrentActivityEnabled = Boolean(
    selectedConfigChallengeId && 
    modalitiesConfig[selectedConfigChallengeId] && 
    modalitiesConfig[selectedConfigChallengeId][selectedConfigActivity] !== undefined
      ? modalitiesConfig[selectedConfigChallengeId][selectedConfigActivity]
      : true
  );

  const handleToggleCurrentActivityEnabled = () => {
    if (!selectedConfigChallengeId) return;
    const currentVal = isCurrentActivityEnabled;
    setModalitiesConfig(prev => ({
      ...prev,
      [selectedConfigChallengeId]: {
        ...(prev[selectedConfigChallengeId] || {}),
        [selectedConfigActivity]: !currentVal
      }
    }));
  };

  const currentRules = (selectedConfigChallengeId && scoringRules[selectedConfigChallengeId] && scoringRules[selectedConfigChallengeId][selectedConfigActivity]) || {
    selectedOption: null,
    minTime: '30',
    minTimePts: '5000',
    minKm: '3',
    minKmPts: '5000',
    stepsTime: [{ condition: 'De', time1: '30', time2: '60', points: '5000' }],
    stepsKm: [{ condition: 'De', km1: '1.5', km2: '4.5', points: '5000' }],
    enableStepsRanking: false,
    stepsMultiplier: '0.5',
    bonusInquebravel: { enabled: true, days: '7', points: '5000' },
    bonusDesperta: { enabled: true, limitTime: '07:00', points: '3000' },
    tiebreakers: { kmTotal: true, bankPoints: true, dailySteps: true, activeDays: true }
  };

  const updateCurrentRuleState = (updater) => {
    if (!selectedConfigChallengeId) return;
    setScoringRules(prev => {
      const challengeObj = prev[selectedConfigChallengeId] || {};
      const currentActObj = challengeObj[selectedConfigActivity] || currentRules;
      const updatedActObj = typeof updater === 'function' ? updater(currentActObj) : { ...currentActObj, ...updater };
      return {
        ...prev,
        [selectedConfigChallengeId]: {
          ...challengeObj,
          [selectedConfigActivity]: updatedActObj
        }
      };
    });
  };

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
          member_status: 'active',
          goldMedals: 0,
          silverMedals: 0,
          bronzeMedals: 0,
          insigniaInquebravelCount: 0,
          insigniaDespertaCount: 0
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
          member_status: 'active'
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
          tiebreakerEnabled: c.tiebreaker_enabled,
          tiebreakersConfig: c.tiebreakers_config
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
          rankingPoints: m.ranking_points,
          bankPoints: m.bank_points,
          totalSteps: m.total_steps,
          goldMedals: m.gold_medals,
          silverMedals: m.silver_medals,
          bronzeMedals: m.bronze_medals,
          insigniaInquebravelCount: m.insignia_inquebravel_count,
          insigniaDespertaCount: m.insignia_desperta_count
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

  const hasUserAnyCommunity = userMembershipsAll.length > 0 || adminChallenges.length > 0;

  const handleShareInvite = async (challenge) => {
    const inviteUrl = `https://muvfit.vercel.app/convite?codigo=${challenge.invite_code}`;
    const message = 
      `🏃‍♂️ *Convite MuvFit* 🏃‍♀️\n\n` +
      `Você foi convidado para participar da *${challenge.title}*!\n\n` +
      `Acesse o link abaixo para entrar na liga:\n${inviteUrl}`;

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
      tiebreaker_enabled: true,
      bonuses: {
        inquebravel: { active: true, points: 5000 },
        desperta: { active: true, points: 3000 }
      }
    };

    await supabase.from('challenges').insert([newObj]);

    const newMembership = {
      challenge_id: newId,
      user_id: currentUser.id,
      name: currentUser.name,
      nickname: currentUser.nickname,
      role: 'active',
      ranking_points: 0,
      bank_points: 0,
      total_steps: 0,
      avatar: currentUser.avatar,
      gold_medals: 0,
      silver_medals: 0,
      bronze_medals: 0,
      age: currentUser.age,
      gender: currentUser.gender,
      insignia_inquebravel_count: 0,
      insignia_desperta_count: 0
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

    Alert.alert('Sucesso', 'Novo desafio criado e salvo na nuvem!');
  }

  async function handleAcceptDashboardInvite(invite) {
    const ch = challenges.find(c => c.id === invite.challengeId);
    if (!ch) return;

    const newMember = {
      challenge_id: ch.id,
      user_id: currentUser.id,
      name: currentUser.name,
      nickname: currentUser.nickname,
      role: 'pending',
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

    await supabase.from('memberships').insert([newMember]);
    setPendingInvites(pendingInvites.filter(inv => inv.id !== invite.id));
    fetchDataFromSupabase();
    selectChallengeContext(ch, false);
    Alert.alert('🎉 Convite Aceito!', `Você entrou no desafio "${ch.title}". Aguardando aprovação para Atleta Ativo.`);
  }

  async function handleRejectDashboardInvite(invite) {
    setPendingInvites(pendingInvites.filter(inv => inv.id !== invite.id));
    Alert.alert('Convite Recusado', `Você recusou o convite para a liga "${invite.challengeTitle}".`);
  }

  async function handleDeleteChallenge(challengeId) {
    const challengeToDelete = challenges.find(c => c.id === challengeId);
    if (!challengeToDelete) return;

    const confirmDelete = Platform.OS === 'web'
      ? window.confirm(`Tem certeza de que deseja EXCLUIR definitivamente a liga "${challengeToDelete.title}"? Esta ação removerá todos os membros e treinos desta liga e não pode ser desfeita.`)
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
    await supabase.from('challenges').update({ is_finished: true, registrations_closed: true }).eq('id', challengeId);
    fetchDataFromSupabase();
    Alert.alert('Desafio Encerrado', 'O pódio foi gerado no Feed.');
  }

  async function toggleChallengeRegistrations() {
    const newStatus = !selectedChallenge.registrations_closed;
    await supabase.from('challenges').update({ registrations_closed: newStatus }).eq('id', selectedChallenge.id);
    fetchDataFromSupabase();
    Alert.alert('Status Atualizado', newStatus ? 'Inscrições/Candidaturas ENCERRADAS!' : 'Inscrições/Candidaturas ABERTAS!');
  }

  async function handleUpdateMemberRole(memberId, newRole) {
    await supabase.from('memberships').update({ role: newRole }).eq('id', memberId);
    fetchDataFromSupabase();
    Alert.alert('Status Atualizado', newRole === 'active' ? 'Atleta aprovado com sucesso!' : 'Participante mantido/definido como Torcedor.');
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
    if (checkBonusInquebravel) bonusTotal += 5000;
    if (checkBonusDesperta) bonusTotal += 3000;

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
      points_to_ranking: workout.points_to_ranking,
      points_to_bank: workout.points_to_bank,
      status: 'approved',
      created_at: 'Agora',
      likes: 0,
      comments: []
    };

    await supabase.from('feed_posts').insert([newPost]);
    fetchDataFromSupabase();
    Alert.alert('Treino Aprovado!', 'O treino foi publicado na nuvem e no Feed.');
  }

  async function handleRejectWorkout(workoutId) {
    await supabase.from('pending_workouts').delete().eq('id', workoutId);
    fetchDataFromSupabase();
    Alert.alert('Treino Rejeitado', 'O registro foi removido.');
  }

  async function handleSubmitWorkout() {
    const currentMemberRecord = memberships.find(m => m.challengeId === activeChallengeId && m.userId === currentUser.id);
    if (!currentMemberRecord && selectedChallenge.creator_id !== currentUser.id) {
      Alert.alert('Acesso Restrito', 'Apenas Atletas Ativos podem submeter treinos.');
      return;
    }

    if (!photoEvidence) {
      Alert.alert('Comprovante Obrigatório', 'Envie a foto comprovando a atividade.');
      return;
    }

    const cleanActType = selectedActivity.trim().toUpperCase();
    const todayStr = new Date().toLocaleDateString('pt-BR');

    const hasAlreadySubmittedToday = 
      feedPosts.some(p => p.challenge_id === activeChallengeId && p.user_id === currentUser.id && (p.activity_type || '').toUpperCase() === cleanActType && p.created_at.includes(todayStr)) ||
      pendingWorkouts.some(w => w.challenge_id === activeChallengeId && w.user_id === currentUser.id && (w.activity_type || '').toUpperCase() === cleanActType);

    if (hasAlreadySubmittedToday) {
      Alert.alert(
        '🚫 Trava de Treino Diário',
        `Você já registrou um treino de "${selectedActivity}" hoje! Não é permitido repetir a mesma modalidade no mesmo dia até as 23:59:59.`
      );
      return;
    }

    const dur = parseInt(durationInput, 10) || 0;
    const points = dur >= 60 ? 10000 : 5000;
    let ptsRanking = points;
    let ptsBank = 0;

    if (selectedChallenge?.has_daily_cap && selectedChallenge?.daily_cap) {
      ptsRanking = Math.min(points, selectedChallenge.daily_cap);
      ptsBank = Math.max(0, points - selectedChallenge.daily_cap);
    }

    const submissionTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newPendingWorkout = {
      id: `pw_${Date.now()}`,
      challenge_id: activeChallengeId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_nickname: currentUser.nickname,
      user_avatar: currentUser.avatar,
      activity_type: cleanActType,
      caption: workoutCaption || `Atividade de ${selectedActivity}`,
      photo_evidence: photoEvidence,
      points_to_ranking: ptsRanking,
      points_to_bank: ptsBank,
      created_at: `${todayStr} às ${submissionTime}`
    };

    await supabase.from('pending_workouts').insert([newPendingWorkout]);
    fetchDataFromSupabase();
    setIsWorkoutModalOpen(false);
    setDurationInput('');
    setKmInput('');
    setStepsInput('');
    setWorkoutCaption('');
    setPhotoEvidence(null);
    Alert.alert('Sucesso', 'Treino enviado para a nuvem! Aguardando aprovação do Admin.');
  }

  function handleSaveAdvancedRules() {
    setIsAdvancedRulesModalOpen(false);
    Alert.alert('Sucesso', 'Configurações de pontuação da modalidade salvas com sucesso!');
  }

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
  const pendingMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'pending');
  
  const currentFeedPosts = feedPosts.filter(p => p.challenge_id === activeChallengeId);
  const currentPendingWorkouts = pendingWorkouts.filter(w => w.challenge_id === activeChallengeId);

  const top3Winners = [...currentChallengeMembers]
    .sort((a, b) => (b.goldMedals || 0) - (a.goldMedals || 0))
    .slice(0, 3)
    .map((m) => {
      const g = m.goldMedals || 0;
      let label = 'Campeão';
      if (g === 3) label = 'Tricampeão';
      else if (g === 2) label = 'Bicampeão';
      else if (g > 3) label = `${g}x Campeão`;
      return `${m.name} - ${label}`;
    });

  let displayedPerf = {
    rankingPoints: 0,
    bankPoints: 0,
    totalSteps: 0,
    goldMedals: viewedUser.goldMedals || 0,
    silverMedals: viewedUser.silverMedals || 0,
    bronzeMedals: viewedUser.bronzeMedals || 0,
    insigniaInquebravelCount: viewedUser.insigniaInquebravelCount || 0,
    insigniaDespertaCount: viewedUser.insigniaDespertaCount || 0
  };

  if (athletePerfScope === 'overall') {
    displayedPerf.rankingPoints = userMembershipsAll.reduce((acc, curr) => acc + (curr.rankingPoints || 0), 0);
    displayedPerf.bankPoints = userMembershipsAll.reduce((acc, curr) => acc + (curr.bankPoints || 0), 0);
    displayedPerf.totalSteps = userMembershipsAll.reduce((acc, curr) => acc + (curr.totalSteps || 0), 0);
  } else {
    const specific = userMembershipsAll.find(m => m.challengeId === athletePerfScope);
    if (specific) {
      displayedPerf.rankingPoints = specific.rankingPoints || 0;
      displayedPerf.bankPoints = specific.bankPoints || 0;
      displayedPerf.totalSteps = specific.totalSteps || 0;
    }
  }

  const selectedAthleteObject = activeMembersInChallenge.find(m => m.id === manualSelectedAthleteId);

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
                {selectedChallenge.title || 'Selecione um Desafio'} ({selectedChallenge.creator_id === currentUser.id ? '🔑 Administrador' : '⚡ Atleta Ativo'}) ▼
              </Text>
            </TouchableOpacity>
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

              <ScrollView style={{ maxHeight: 200 }} keyboardShouldPersistTaps="handled">
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
                      searchResultsChallenges.map((ch) => (
                        <TouchableOpacity
                          key={ch.id}
                          style={styles.searchResultItem}
                          onPress={() => {
                            selectChallengeContext(ch, ch.creator_id === currentUser.id);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <Text style={{ fontSize: 16, marginRight: 6 }}>🏆</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.searchResultTitle}>{ch.title}</Text>
                            <Text style={styles.searchResultSub}>Código: {ch.invite_code} | Acessar Liga ➔</Text>
                          </View>
                        </TouchableOpacity>
                      ))
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

              {pendingInvites.length > 0 && (
                <View style={styles.inviteNoticeBox}>
                  <Text style={styles.inviteNoticeTitle}>📩 Convites Pendentes</Text>
                  {pendingInvites.map((inv) => (
                    <View key={inv.id} style={styles.inviteItemCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inviteChallengeName}>{inv.challengeTitle}</Text>
                        <Text style={styles.inviteSubText}>Convidado por: {inv.inviterName}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity style={styles.acceptInviteBtn} onPress={() => handleAcceptDashboardInvite(inv)}>
                          <Text style={styles.btnMiniText}>✅ ACEITAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.banBtn} onPress={() => handleRejectDashboardInvite(inv)}>
                          <Text style={styles.btnMiniText}>❌ RECUSAR</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {!hasUserAnyCommunity && (
                <View style={styles.restrictedNoticeBox}>
                  <Text style={styles.restrictedNoticeText}>
                    ✨ Bem-vindo ao MuvFit, {currentUser.nickname || currentUser.name}! Crie um novo desafio no botão acima ou aceite um convite para liberar as abas da comunidade.
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

              <Text style={[styles.sectionHeaderTitle, { marginTop: 16 }]}>⚡ Ligas em que Você é Participante</Text>
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
                        <Text style={styles.actionBtnText}>ACESSAR COMO ATLETA ➔</Text>
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

              <TouchableOpacity style={styles.actionBtn} onPress={() => setIsWorkoutModalOpen(true)}>
                <Text style={styles.actionBtnText}>+ REGISTRAR NOVO TREINO / PASSOS</Text>
              </TouchableOpacity>

              {currentFeedPosts.length === 0 ? (
                <Text style={styles.emptyNoticeText}>Nenhum treino aprovado no feed ainda.</Text>
              ) : (
                currentFeedPosts.map((post) => (
                  <View key={post.id} style={styles.postCard}>
                    <TouchableOpacity style={styles.postHeader} onPress={() => handleOpenUserProfile(post.user_id)}>
                      <Image source={{ uri: post.user_avatar }} style={styles.avatarMini} />
                      <View style={{ marginLeft: 8 }}>
                        <Text style={[styles.postAuthor, { textDecorationLine: 'underline' }]}>{post.user_name} ({post.user_nickname})</Text>
                        <Text style={styles.postTime}>{post.created_at} • ✅ Aprovado</Text>
                      </View>
                    </TouchableOpacity>

                    <Image source={{ uri: post.photo_evidence }} style={styles.postImg} />
                    
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
                ))
              )}
            </ScrollView>
          )}

          {currentScreen === 'ranking' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={styles.pageTitle}>🏆 Ranking — {selectedChallenge.title}</Text>
              
              <View style={styles.topWinnersBannerBox}>
                <Text style={styles.topWinnersBannerTitle}>🥇 MAIORES VENCEDORES DO DESAFIO</Text>
                <Text style={styles.topWinnersBannerList}>
                  {top3Winners.length > 0 ? top3Winners.join('; ') : 'Nenhum campeão registrado ainda'}
                </Text>
              </View>

              {activeMembersInChallenge.sort((a,b) => (b.rankingPoints || 0) - (a.rankingPoints || 0)).map((member, index) => (
                <TouchableOpacity key={member.userId} style={styles.rankingRowCard} onPress={() => handleOpenUserProfile(member.userId)}>
                  <Text style={styles.rankingPosNumber}>#{index + 1}</Text>
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
              ))}
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

                <View style={styles.statusBadgeRow}>
                  <Text style={styles.statusActiveTag}>⚡ ATLETA ATIVO</Text>
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

          {currentScreen === 'admin' && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>🎯 Central do Administrador: {selectedChallenge.title}</Text>
                <Text style={styles.adminCardSub}>Gerencie aprovações, inscrições, lançamento manual, membros e configurações avançadas.</Text>
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

              <View style={styles.accordionCard}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedSec2(!expandedSec2)}>
                  <Text style={styles.accordionTitle}>2. CONTROLE DE INSCRIÇÕES</Text>
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

                    <Text style={[styles.inputLabel, { marginTop: 4 }]}>Solicitações para Atleta Ativo ({pendingMembersInChallenge.length}):</Text>
                    {pendingMembersInChallenge.length === 0 ? (
                      <Text style={styles.emptyNoticeText}>Nenhuma solicitação de novos atletas pendente.</Text>
                    ) : (
                      pendingMembersInChallenge.map((m) => (
                        <View key={m.id} style={styles.participantRow}>
                          <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.participantName}>{m.name} ({m.nickname})</Text>
                            <Text style={{ fontSize: 8, color: '#d97706', fontWeight: 'bold' }}>Aguardando Aprovação do Administrador</Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 4 }}>
                            <TouchableOpacity style={styles.approveBtn} onPress={() => handleUpdateMemberRole(m.id, 'active')}>
                              <Text style={styles.btnMiniText}>⚡ ATLETA</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.banBtn} onPress={() => handleUpdateMemberRole(m.id, 'spectator')}>
                              <Text style={styles.btnMiniText}>👀 TORCEDOR</Text>
                            </TouchableOpacity>
                          </View>
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

                    <Text style={styles.inputLabel}>Modalidade Realizada:</Text>
                    <TouchableOpacity 
                      style={styles.dropdownSelectBox} 
                      onPress={() => setIsActivityDropdownOpen(!isActivityDropdownOpen)}
                    >
                      <Text style={styles.dropdownSelectText}>{manualActivity} ▼</Text>
                    </TouchableOpacity>

                    {isActivityDropdownOpen && (
                      <View style={styles.floatingDropdownContainer}>
                        {modalitiesList.map((item) => (
                          <TouchableOpacity
                            key={item.value}
                            style={styles.dropdownOptionRow}
                            onPress={() => {
                              setManualActivity(item.label);
                              setIsActivityDropdownOpen(false);
                            }}
                          >
                            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{item.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

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
                      <View style={[styles.checkboxBox, checkBonusInquebravel && styles.checkboxBoxActive]}>
                        {checkBonusInquebravel && <Text style={styles.checkboxCheckmark}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxLabel}>Bônus "O Inquebrável" ( +5.000 pts )</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.checkboxRow} 
                      onPress={() => setCheckBonusDesperta(!checkBonusDesperta)}
                    >
                      <View style={[styles.checkboxBox, checkBonusDesperta && styles.checkboxBoxActive]}>
                        {checkBonusDesperta && <Text style={styles.checkboxCheckmark}>✓</Text>}
                      </View>
                      <Text style={styles.checkboxLabel}>Bônus "O Desperta" ( +3.000 pts )</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.primaryBtn, { marginTop: 10 }]} onPress={handleManualPointsSubmit}>
                      <Text style={styles.primaryBtnText}>CREDITAR VALORES AO ATLETA</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.accordionCard}>
                <TouchableOpacity style={styles.accordionHeader} onPress={() => setExpandedSec4(!expandedSec4)}>
                  <Text style={styles.accordionTitle}>4. GERENCIAMENTO DE MEMBROS ({currentChallengeMembers.length})</Text>
                  <Text style={styles.accordionArrow}>{expandedSec4 ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {expandedSec4 && (
                  <View style={styles.accordionBody}>
                    {currentChallengeMembers.map((m) => (
                      <View key={m.id} style={styles.participantRow}>
                        <Image source={{ uri: m.avatar }} style={styles.avatarMini} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.participantName}>{m.name} ({m.nickname})</Text>
                          <Text style={m.role === 'active' ? styles.tagActiveText : styles.participantSub}>
                            {m.role === 'active' ? '⚡ ATLETA ATIVO' : '👀 TORCEDOR'}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'column', gap: 4 }}>
                          {m.role === 'active' && (
                            <TouchableOpacity style={styles.demoteBtn} onPress={() => handleUpdateMemberRole(m.id, 'spectator')}>
                              <Text style={styles.btnMiniText}>🔻 REMOVER DO DESAFIO</Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity style={styles.banBtn} onPress={() => handleRemoveMemberFromCommunity(m.id)}>
                            <Text style={styles.btnMiniText}>🗑️ REMOVER DA COMUNIDADE</Text>
                          </TouchableOpacity>
                        </View>
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
                      Configurar limites de classificação, critérios de desempate e regras apresentadas para os atletas.
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

      <Modal visible={isAdvancedRulesModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>⚙️ Configuração Avançada de Pontos</Text>

            <ScrollView style={{ maxHeight: 480 }} keyboardShouldPersistTaps="handled">
              
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

              <View style={styles.warningNoticeBox}>
                <Text style={styles.warningNoticeIcon}>⚠️</Text>
                <Text style={styles.warningNoticeText}>
                  Escolha 1 único modo de pontuação por modalidade habilitada
                </Text>
              </View>

              <Text style={styles.inputLabel}>3 - Selecione a Modalidade para Configurar:</Text>
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

              <TouchableOpacity 
                style={[styles.checkboxRow, { marginTop: 10 }]} 
                onPress={handleToggleCurrentActivityEnabled}
              >
                <View style={[styles.checkboxBox, isCurrentActivityEnabled && styles.checkboxBoxActive]}>
                  {isCurrentActivityEnabled && <Text style={styles.checkboxCheckmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Habilitar esta modalidade no desafio?</Text>
              </TouchableOpacity>

              <View 
                style={[
                  styles.scoringModeBoxContainer,
                  !isCurrentActivityEnabled && styles.disabledScoringModeBox
                ]}
                pointerEvents={isCurrentActivityEnabled ? 'auto' : 'none'}
              >
                <Text style={[styles.inputLabel, !isCurrentActivityEnabled && { color: '#94a3b8' }]}>
                  5 - Selecione o Modo de Pontuação:
                </Text>

                {!isCurrentActivityEnabled ? (
                  <Text style={{ fontSize: 9, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 }}>
                    🔒 Modalidade desabilitada para este desafio.
                  </Text>
                ) : (
                  <>
                    {['💪 Musculação', '🏋️ Crossfit / Treino Funcional', '🥋 Lutas / Esportes Individuais', '⚽ Esportes Coletivos', '🫀 Treino Aeróbico'].includes(selectedConfigActivity) && (
                      <View style={{ marginTop: 6 }}>
                        <TouchableOpacity 
                          style={styles.radioOptionRow}
                          onPress={() => updateCurrentRuleState({ selectedOption: currentRules.selectedOption === 'minTime' ? null : 'minTime' })}
                        >
                          <View style={[styles.checkboxBox, currentRules.selectedOption === 'minTime' && styles.checkboxBoxActive]}>
                            {currentRules.selectedOption === 'minTime' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.radioOptionText}>1ª Opção: Pontuação por Tempo Mínimo</Text>
                        </TouchableOpacity>

                        {currentRules.selectedOption === 'minTime' && (
                          <View style={styles.nestedFieldsBox}>
                            <Text style={styles.inputLabelMini}>Tempo Mínimo (Minutos):</Text>
                            <TextInput
                              style={styles.inputMini}
                              keyboardType="numeric"
                              value={currentRules.minTime}
                              onChangeText={(txt) => updateCurrentRuleState({ minTime: txt })}
                            />
                            <Text style={styles.inputLabelMini}>Pontos Concedidos:</Text>
                            <TextInput
                              style={styles.inputMini}
                              keyboardType="numeric"
                              value={currentRules.minTimePts}
                              onChangeText={(txt) => updateCurrentRuleState({ minTimePts: txt })}
                            />
                          </View>
                        )}

                        <TouchableOpacity 
                          style={[styles.radioOptionRow, { marginTop: 8 }]}
                          onPress={() => updateCurrentRuleState({ selectedOption: currentRules.selectedOption === 'stepsTime' ? null : 'stepsTime' })}
                        >
                          <View style={[styles.checkboxBox, currentRules.selectedOption === 'stepsTime' && styles.checkboxBoxActive]}>
                            {currentRules.selectedOption === 'stepsTime' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.radioOptionText}>2ª Opção: Steps Progressivos de Tempo</Text>
                        </TouchableOpacity>

                        {currentRules.selectedOption === 'stepsTime' && (
                          <View style={styles.nestedFieldsBox}>
                            {(currentRules.stepsTime || []).map((step, idx) => (
                              <View key={idx} style={styles.stepCardRow}>
                                <Text style={styles.stepTitle}>Step {idx + 1}:</Text>
                                
                                <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginVertical: 4 }}>
                                  <select
                                    style={styles.htmlNativeSelectMini}
                                    value={step.condition}
                                    onChange={(e) => {
                                      const newSteps = [...currentRules.stepsTime];
                                      newSteps[idx].condition = e.target.value;
                                      updateCurrentRuleState({ stepsTime: newSteps });
                                    }}
                                  >
                                    <option value="De">De</option>
                                    <option value="Acima">Acima de</option>
                                  </select>

                                  <TextInput
                                    style={[styles.inputMini, { width: 50 }]}
                                    keyboardType="numeric"
                                    value={step.time1}
                                    onChangeText={(txt) => {
                                      const newSteps = [...currentRules.stepsTime];
                                      newSteps[idx].time1 = txt;
                                      updateCurrentRuleState({ stepsTime: newSteps });
                                    }}
                                  />

                                  <Text style={{ fontSize: 9, color: step.condition === 'Acima' ? '#94a3b8' : '#0f172a' }}>Até:</Text>
                                  <TextInput
                                    style={[
                                      styles.inputMini, 
                                      { width: 50 }, 
                                      step.condition === 'Acima' && { backgroundColor: '#e2e8f0', color: '#94a3b8' }
                                    ]}
                                    keyboardType="numeric"
                                    editable={step.condition !== 'Acima'}
                                    value={step.condition === 'Acima' ? '' : step.time2}
                                    onChangeText={(txt) => {
                                      const newSteps = [...currentRules.stepsTime];
                                      newSteps[idx].time2 = txt;
                                      updateCurrentRuleState({ stepsTime: newSteps });
                                    }}
                                  />
                                  <Text style={{ fontSize: 9 }}>min</Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <TextInput
                                    style={[styles.inputMini, { flex: 1, marginRight: 6 }]}
                                    placeholder="Pontos"
                                    keyboardType="numeric"
                                    value={step.points}
                                    onChangeText={(txt) => {
                                      const newSteps = [...currentRules.stepsTime];
                                      newSteps[idx].points = txt;
                                      updateCurrentRuleState({ stepsTime: newSteps });
                                    }}
                                  />
                                  {currentRules.stepsTime.length > 1 && (
                                    <TouchableOpacity 
                                      style={styles.trashBtn}
                                      onPress={() => {
                                        const newSteps = currentRules.stepsTime.filter((_, i) => i !== idx);
                                        updateCurrentRuleState({ stepsTime: newSteps });
                                      }}
                                    >
                                      <Text style={{ fontSize: 12 }}>🗑️</Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>
                            ))}

                            <TouchableOpacity 
                              style={styles.addStepBtn}
                              onPress={() => {
                                const newSteps = [...currentRules.stepsTime, { condition: 'De', time1: '61', time2: '90', points: '10000' }];
                                updateCurrentRuleState({ stepsTime: newSteps });
                              }}
                            >
                              <Text style={styles.addStepBtnText}>+ Adicionar Step</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}

                    {['🏃 Corrida', '🚶 Caminhada', '🚴 Bike'].includes(selectedConfigActivity) && (
                      <View style={{ marginTop: 6 }}>
                        <TouchableOpacity 
                          style={styles.radioOptionRow}
                          onPress={() => updateCurrentRuleState({ selectedOption: currentRules.selectedOption === 'minTime' ? null : 'minTime' })}
                        >
                          <View style={[styles.checkboxBox, currentRules.selectedOption === 'minTime' && styles.checkboxBoxActive]}>
                            {currentRules.selectedOption === 'minTime' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.radioOptionText}>1ª Opção: Pontuação por Tempo Mínimo</Text>
                        </TouchableOpacity>

                        {currentRules.selectedOption === 'minTime' && (
                          <View style={styles.nestedFieldsBox}>
                            <Text style={styles.inputLabelMini}>Tempo Mínimo (Minutos):</Text>
                            <TextInput style={styles.inputMini} keyboardType="numeric" value={currentRules.minTime} onChangeText={(txt) => updateCurrentRuleState({ minTime: txt })} />
                            <Text style={styles.inputLabelMini}>Pontos Concedidos:</Text>
                            <TextInput style={styles.inputMini} keyboardType="numeric" value={currentRules.minTimePts} onChangeText={(txt) => updateCurrentRuleState({ minTimePts: txt })} />
                          </View>
                        )}

                        <TouchableOpacity 
                          style={[styles.radioOptionRow, { marginTop: 6 }]}
                          onPress={() => updateCurrentRuleState({ selectedOption: currentRules.selectedOption === 'minKm' ? null : 'minKm' })}
                        >
                          <View style={[styles.checkboxBox, currentRules.selectedOption === 'minKm' && styles.checkboxBoxActive]}>
                            {currentRules.selectedOption === 'minKm' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.radioOptionText}>2ª Opção: Pontuação Por KM Mínimo</Text>
                        </TouchableOpacity>

                        {currentRules.selectedOption === 'minKm' && (
                          <View style={styles.nestedFieldsBox}>
                            <Text style={styles.inputLabelMini}>Distância Mínima (KM):</Text>
                            <TextInput style={styles.inputMini} keyboardType="numeric" value={currentRules.minKm} onChangeText={(txt) => updateCurrentRuleState({ minKm: txt })} />
                            <Text style={styles.inputLabelMini}>Pontos Concedidos:</Text>
                            <TextInput style={styles.inputMini} keyboardType="numeric" value={currentRules.minKmPts} onChangeText={(txt) => updateCurrentRuleState({ minKmPts: txt })} />
                          </View>
                        )}

                        <TouchableOpacity 
                          style={[styles.radioOptionRow, { marginTop: 6 }]}
                          onPress={() => updateCurrentRuleState({ selectedOption: currentRules.selectedOption === 'stepsTime' ? null : 'stepsTime' })}
                        >
                          <View style={[styles.checkboxBox, currentRules.selectedOption === 'stepsTime' && styles.checkboxBoxActive]}>
                            {currentRules.selectedOption === 'stepsTime' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.radioOptionText}>3ª Opção: Steps Progressivos de Tempo</Text>
                        </TouchableOpacity>

                        {currentRules.selectedOption === 'stepsTime' && (
                          <View style={styles.nestedFieldsBox}>
                            {(currentRules.stepsTime || []).map((step, idx) => (
                              <View key={idx} style={styles.stepCardRow}>
                                <Text style={styles.stepTitle}>Step {idx + 1}:</Text>
                                <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginVertical: 4 }}>
                                  <select
                                    style={styles.htmlNativeSelectMini}
                                    value={step.condition}
                                    onChange={(e) => {
                                      const newSteps = [...currentRules.stepsTime];
                                      newSteps[idx].condition = e.target.value;
                                      updateCurrentRuleState({ stepsTime: newSteps });
                                    }}
                                  >
                                    <option value="De">De</option>
                                    <option value="Acima">Acima de</option>
                                  </select>
                                  <TextInput style={[styles.inputMini, { width: 45 }]} keyboardType="numeric" value={step.time1} onChangeText={(txt) => { const n = [...currentRules.stepsTime]; n[idx].time1 = txt; updateCurrentRuleState({ stepsTime: n }); }} />
                                  <Text style={{ fontSize: 9 }}>Até:</Text>
                                  <TextInput style={[styles.inputMini, { width: 45 }, step.condition === 'Acima' && { backgroundColor: '#e2e8f0' }]} keyboardType="numeric" editable={step.condition !== 'Acima'} value={step.condition === 'Acima' ? '' : step.time2} onChangeText={(txt) => { const n = [...currentRules.stepsTime]; n[idx].time2 = txt; updateCurrentRuleState({ stepsTime: n }); }} />
                                </View>
                                <TextInput style={styles.inputMini} placeholder="Pontos" keyboardType="numeric" value={step.points} onChangeText={(txt) => { const n = [...currentRules.stepsTime]; n[idx].points = txt; updateCurrentRuleState({ stepsTime: n }); }} />
                              </View>
                            ))}
                            <TouchableOpacity style={styles.addStepBtn} onPress={() => updateCurrentRuleState({ stepsTime: [...currentRules.stepsTime, { condition: 'De', time1: '61', time2: '90', points: '10000' }] })}>
                              <Text style={styles.addStepBtnText}>+ Adicionar Step</Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        <TouchableOpacity 
                          style={[styles.radioOptionRow, { marginTop: 6 }]}
                          onPress={() => updateCurrentRuleState({ selectedOption: currentRules.selectedOption === 'stepsKm' ? null : 'stepsKm' })}
                        >
                          <View style={[styles.checkboxBox, currentRules.selectedOption === 'stepsKm' && styles.checkboxBoxActive]}>
                            {currentRules.selectedOption === 'stepsKm' && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.radioOptionText}>4ª Opção: Steps Progressivos de KM</Text>
                        </TouchableOpacity>

                        {currentRules.selectedOption === 'stepsKm' && (
                          <View style={styles.nestedFieldsBox}>
                            {(currentRules.stepsKm || []).map((step, idx) => (
                              <View key={idx} style={styles.stepCardRow}>
                                <Text style={styles.stepTitle}>Step {idx + 1}:</Text>
                                <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', marginVertical: 4 }}>
                                  <select
                                    style={styles.htmlNativeSelectMini}
                                    value={step.condition}
                                    onChange={(e) => {
                                      const newSteps = [...currentRules.stepsKm];
                                      newSteps[idx].condition = e.target.value;
                                      updateCurrentRuleState({ stepsKm: newSteps });
                                    }}
                                  >
                                    <option value="De">De</option>
                                    <option value="Acima">Acima de</option>
                                  </select>
                                  <TextInput style={[styles.inputMini, { width: 45 }]} keyboardType="numeric" value={step.km1} onChangeText={(txt) => { const n = [...currentRules.stepsKm]; n[idx].km1 = txt; updateCurrentRuleState({ stepsKm: n }); }} />
                                  <Text style={{ fontSize: 9 }}>Até:</Text>
                                  <TextInput style={[styles.inputMini, { width: 45 }, step.condition === 'Acima' && { backgroundColor: '#e2e8f0' }]} keyboardType="numeric" editable={step.condition !== 'Acima'} value={step.condition === 'Acima' ? '' : step.km2} onChangeText={(txt) => { const n = [...currentRules.stepsKm]; n[idx].km2 = txt; updateCurrentRuleState({ stepsKm: n }); }} />
                                </View>
                                <TextInput style={styles.inputMini} placeholder="Pontos" keyboardType="numeric" value={step.points} onChangeText={(txt) => { const n = [...currentRules.stepsKm]; n[idx].points = txt; updateCurrentRuleState({ stepsKm: n }); }} />
                              </View>
                            ))}
                            <TouchableOpacity style={styles.addStepBtn} onPress={() => updateCurrentRuleState({ stepsKm: [...currentRules.stepsKm, { condition: 'De', km1: '4.6', km2: '7.5', points: '10000' }] })}>
                              <Text style={styles.addStepBtnText}>+ Adicionar Step</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}

                    {selectedConfigActivity === '🎁 Bônus e Critérios de Desempate' && (
                      <View style={{ marginTop: 6 }}>
                        <View style={styles.bonusBoxCard}>
                          <TouchableOpacity 
                            style={styles.checkboxRow}
                            onPress={() => updateCurrentRuleState({ bonusInquebravel: { ...currentRules.bonusInquebravel, enabled: !currentRules.bonusInquebravel.enabled } })}
                          >
                            <View style={[styles.checkboxBox, currentRules.bonusInquebravel.enabled && styles.checkboxBoxActive]}>
                              {currentRules.bonusInquebravel.enabled && <Text style={styles.checkboxCheckmark}>✓</Text>}
                            </View>
                            <Text style={styles.checkboxLabel}>🪨 Bônus "O Inquebrável"</Text>
                          </TouchableOpacity>
                          <Text style={styles.bonusDescText}>Premia X dias consecutivos de atividade.</Text>
                          
                          {currentRules.bonusInquebravel.enabled && (
                            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                              <TextInput style={[styles.inputMini, { flex: 1 }]} placeholder="Dias (Ex: 7)" keyboardType="numeric" value={currentRules.bonusInquebravel.days} onChangeText={(txt) => updateCurrentRuleState({ bonusInquebravel: { ...currentRules.bonusInquebravel, days: txt } })} />
                              <TextInput style={[styles.inputMini, { flex: 1 }]} placeholder="Pontos" keyboardType="numeric" value={currentRules.bonusInquebravel.points} onChangeText={(txt) => updateCurrentRuleState({ bonusInquebravel: { ...currentRules.bonusInquebravel, points: txt } })} />
                            </View>
                          )}
                        </View>

                        <View style={[styles.bonusBoxCard, { marginTop: 8 }]}>
                          <TouchableOpacity 
                            style={styles.checkboxRow}
                            onPress={() => updateCurrentRuleState({ bonusDesperta: { ...currentRules.bonusDesperta, enabled: !currentRules.bonusDesperta.enabled } })}
                          >
                            <View style={[styles.checkboxBox, currentRules.bonusDesperta.enabled && styles.checkboxBoxActive]}>
                              {currentRules.bonusDesperta.enabled && <Text style={styles.checkboxCheckmark}>✓</Text>}
                            </View>
                            <Text style={styles.checkboxLabel}>⏰ Bônus "O Desperta"</Text>
                          </TouchableOpacity>
                          <Text style={styles.bonusDescText}>Premia comprovante enviado até o horário limite (formato 24h).</Text>
                          
                          {currentRules.bonusDesperta.enabled && (
                            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                              <TextInput style={[styles.inputMini, { flex: 1 }]} placeholder="Horário Limite (Ex: 07:00)" value={currentRules.bonusDesperta.limitTime} onChangeText={(txt) => updateCurrentRuleState({ bonusDesperta: { ...currentRules.bonusDesperta, limitTime: txt } })} />
                              <TextInput style={[styles.inputMini, { flex: 1 }]} placeholder="Pontos" keyboardType="numeric" value={currentRules.bonusDesperta.points} onChangeText={(txt) => updateCurrentRuleState({ bonusDesperta: { ...currentRules.bonusDesperta, points: txt } })} />
                            </View>
                          )}
                        </View>

                        <Text style={[styles.inputLabel, { marginTop: 10 }]}>Critérios de Desempate Habilitados:</Text>
                        
                        <TouchableOpacity style={styles.checkboxRow} onPress={() => updateCurrentRuleState({ tiebreakers: { ...currentRules.tiebreakers, kmTotal: !currentRules.tiebreakers.kmTotal } })}>
                          <View style={[styles.checkboxBox, currentRules.tiebreakers.kmTotal && styles.checkboxBoxActive]}>{currentRules.tiebreakers.kmTotal && <Text style={styles.checkboxCheckmark}>✓</Text>}</View>
                          <Text style={styles.checkboxLabel}>1º Critério: KM Total Percorrido (Corrida, Caminhada e Bike)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.checkboxRow} onPress={() => updateCurrentRuleState({ tiebreakers: { ...currentRules.tiebreakers, bankPoints: !currentRules.tiebreakers.bankPoints } })}>
                          <View style={[styles.checkboxBox, currentRules.tiebreakers.bankPoints && styles.checkboxBoxActive]}>{currentRules.tiebreakers.bankPoints && <Text style={styles.checkboxCheckmark}>✓</Text>}</View>
                          <Text style={styles.checkboxLabel}>2º Critério: Banco de Pontos (Excedente do teto)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.checkboxRow} onPress={() => updateCurrentRuleState({ tiebreakers: { ...currentRules.tiebreakers, dailySteps: !currentRules.tiebreakers.dailySteps } })}>
                          <View style={[styles.checkboxBox, currentRules.tiebreakers.dailySteps && styles.checkboxBoxActive]}>{currentRules.tiebreakers.dailySteps && <Text style={styles.checkboxCheckmark}>✓</Text>}</View>
                          <Text style={styles.checkboxLabel}>3º Critério: Passos Diários Totais</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.checkboxRow} onPress={() => updateCurrentRuleState({ tiebreakers: { ...currentRules.tiebreakers, activeDays: !currentRules.tiebreakers.activeDays } })}>
                          <View style={[styles.checkboxBox, currentRules.tiebreakers.activeDays && styles.checkboxBoxActive]}>{currentRules.tiebreakers.activeDays && <Text style={styles.checkboxCheckmark}>✓</Text>}</View>
                          <Text style={styles.checkboxLabel}>4º Critério: Dias em Atividade</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {selectedConfigActivity === '🚶‍♂️ Passos Diários' && (
                      <View style={{ marginTop: 6 }}>
                        <TouchableOpacity 
                          style={styles.checkboxRow}
                          onPress={() => updateCurrentRuleState({ enableStepsRanking: !currentRules.enableStepsRanking })}
                        >
                          <View style={[styles.checkboxBox, currentRules.enableStepsRanking && styles.checkboxBoxActive]}>
                            {currentRules.enableStepsRanking && <Text style={styles.checkboxCheckmark}>✓</Text>}
                          </View>
                          <Text style={styles.checkboxLabel}>Habilitar Passos Diários para Pontuação do Ranking</Text>
                        </TouchableOpacity>

                        <Text style={{ fontSize: 9, color: '#475569', marginTop: 4 }}>
                          Defina o multiplicador de pontuação para cada passo registrado (entre 0,1 e 1,0):
                        </Text>

                        <View style={{ marginTop: 6 }}>
                          <TextInput 
                            style={[
                              styles.inputMini, 
                              !currentRules.enableStepsRanking && { backgroundColor: '#e2e8f0', color: '#94a3b8' }
                            ]} 
                            keyboardType="numeric" 
                            editable={currentRules.enableStepsRanking}
                            value={currentRules.stepsMultiplier} 
                            onChangeText={(txt) => updateCurrentRuleState({ stepsMultiplier: txt })} 
                            placeholder="Ex: 0.5 (1.000 passos = 500 pts)"
                          />
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>

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

            <Text style={styles.inputLabel}>Apelido (exibido no ranking):</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu apelido"
              value={editNickname}
              onChangeText={setEditNickname}
            />

            <Text style={styles.inputLabel}>Data de Nascimento (DD/MM/AAAA):</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 08/11/1997"
              keyboardType="numeric"
              maxLength={10}
              value={editBirthDate}
              onChangeText={(text) => setEditBirthDate(formatBirthDateMask(text))}
            />

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>SALVAR ALTERAÇÕES</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditProfileOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

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

      <Modal visible={isCreateChallengeOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>🏆 Criar Novo Desafio / Liga</Text>

            <Text style={styles.inputLabel}>Nome do Desafio:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Desafio Verão 2026"
              value={newChallengeTitle}
              onChangeText={setNewChallengeTitle}
            />

            <Text style={styles.inputLabel}>Código de Acesso / Convite:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: MUV2026"
              autoCapitalize="characters"
              value={newChallengeCode}
              onChangeText={setNewChallengeCode}
            />

            <TouchableOpacity 
              style={styles.checkboxRow} 
              onPress={() => setHasCapToggle(!hasCapToggle)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, hasCapToggle && styles.checkboxBoxActive]}>
                {hasCapToggle && <Text style={styles.checkboxCheckmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>Ativar Teto Diário de Pontos?</Text>
            </TouchableOpacity>

            {hasCapToggle && (
              <View style={{ marginTop: 2, marginBottom: 8 }}>
                <Text style={styles.inputLabel}>Limite Diário (Pts):</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 22000"
                  keyboardType="numeric"
                  value={newChallengeCap}
                  onChangeText={setNewChallengeCap}
                />
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
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>📷 Registrar Novo Treino</Text>

            <Text style={styles.inputLabel}>Tipo de Atividade:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Musculação, Corrida, Passos"
              value={selectedActivity}
              onChangeText={setSelectedActivity}
            />

            <Text style={styles.inputLabel}>Duração (minutos):</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 60"
              keyboardType="numeric"
              value={durationInput}
              onChangeText={setDurationInput}
            />

            {['Corrida', 'Caminhada', 'Bike'].includes(selectedActivity) && (
              <>
                <Text style={styles.inputLabel}>Distância (KM):</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 5.5"
                  keyboardType="numeric"
                  value={kmInput}
                  onChangeText={setKmInput}
                />
              </>
            )}

            {selectedActivity === 'Passos Diários' && (
              <>
                <Text style={styles.inputLabel}>Quantidade de Passos:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 10000"
                  keyboardType="numeric"
                  value={stepsInput}
                  onChangeText={setStepsInput}
                />
              </>
            )}

            <Text style={styles.inputLabel}>Legenda / Comentário:</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Treino concluído!"
              value={workoutCaption}
              onChangeText={setWorkoutCaption}
            />

            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: '#16a34a', marginBottom: 10 }]} 
              onPress={() => setPhotoEvidence('https://picsum.photos/seed/' + Math.random() + '/400/300')}
            >
              <Text style={styles.primaryBtnText}>
                {photoEvidence ? '📷 COMPROVANTE ANEXADO' : '📷 ADICIONAR FOTO COMPROVANTE'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitWorkout}>
              <Text style={styles.primaryBtnText}>ENVIAR PARA APROVAÇÃO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsWorkoutModalOpen(false)}>
              <Text style={styles.cancelBtnText}>CANCELAR</Text>
            </TouchableOpacity>
          </ScrollView>
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
  searchResultSub: { fontSize: 8, color: '#16a34a', fontWeight: 'bold' },
  emptySearchText: { fontSize: 9, color: '#94a3b8', fontStyle: 'italic', padding: 6, textAlign: 'center' },

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

  dropdownSelectBox: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 8, marginBottom: 4 },
  dropdownSelectText: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },

  nativeSelectWrapper: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    marginBottom: 6,
    overflow: 'hidden'
  },
  htmlNativeSelect: {
    width: '100%',
    padding: 8,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    cursor: 'pointer'
  },
  htmlNativeSelectMini: {
    padding: 4,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4
  },
  
  floatingDropdownContainer: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#f97316',
    borderRadius: 6,
    zIndex: 9999,
    elevation: 20
  },
  dropdownOptionRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#ffffff' },

  participantRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#fed7aa', marginTop: 6 },
  participantName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  tagActiveText: { fontSize: 9, color: '#16a34a', fontWeight: 'bold' },
  participantSub: { fontSize: 9, color: '#64748b' },

  lockBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4 },
  demoteBtn: { backgroundColor: '#d97706', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  approveBtn: { backgroundColor: '#16a34a', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  banBtn: { backgroundColor: '#dc2626', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4 },
  inviteBtn: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, justifyContent: 'center' },
  deleteChallengeBtn: { backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, justifyContent: 'center' },
  finishChallengeBtn: { backgroundColor: '#d97706', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, justifyContent: 'center' },
  btnMiniText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },

  rankingRowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6 },
  rankingPosNumber: { fontSize: 14, fontWeight: '900', color: '#f97316', width: 30 },
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

  inviteNoticeBox: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#16a34a', marginBottom: 12 },
  inviteNoticeTitle: { fontSize: 11, fontWeight: 'bold', color: '#16a34a', marginBottom: 6 },
  inviteItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#bbf7d0' },
  inviteChallengeName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  inviteSubText: { fontSize: 9, color: '#64748b' },
  acceptInviteBtn: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },

  postCard: { backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 12, overflow: 'hidden' },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#f8fafc' },
  avatarMini: { width: 32, height: 32, borderRadius: 16 },
  postAuthor: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  postTime: { fontSize: 9, color: '#64748b' },
  postImg: { width: '100%', height: 180 },
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

  statusBadgeRow: { marginBottom: 8 },
  statusActiveTag: { backgroundColor: '#f0fdf4', color: '#16a34a', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },

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
  inputMini: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 4, padding: 4, fontSize: 10, marginBottom: 4 },

  warningNoticeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#f59e0b', marginVertical: 8 },
  warningNoticeIcon: { fontSize: 14, marginRight: 6 },
  warningNoticeText: { fontSize: 10, fontWeight: 'bold', color: '#b45309', flex: 1 },

  scoringModeBoxContainer: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', marginTop: 10 },
  disabledScoringModeBox: { backgroundColor: '#e2e8f0', borderColor: '#cbd5e1', opacity: 0.5 },

  radioOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  radioOptionText: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },

  nestedFieldsBox: { backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', marginLeft: 12, marginTop: 4, marginBottom: 6 },
  stepCardRow: { backgroundColor: '#f8fafc', padding: 6, borderRadius: 4, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 6 },
  stepTitle: { fontSize: 9, fontWeight: 'bold', color: '#f97316' },
  addStepBtn: { backgroundColor: '#1e3a8a', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  addStepBtnText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },
  trashBtn: { padding: 4 },

  bonusBoxCard: { backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1' },
  bonusDescText: { fontSize: 8, color: '#64748b', fontStyle: 'italic', marginBottom: 4 },

  chipBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  chipBtnActive: { backgroundColor: '#f97316' },
  chipText: { fontSize: 9, fontWeight: 'bold', color: '#475569' },
  chipTextActive: { color: '#ffffff' },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 8 },
  checkboxBox: { width: 18, height: 18, borderWidth: 2, borderColor: '#1e3a8a', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  checkboxBoxActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  checkboxCheckmark: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },

  cancelBtn: { marginTop: 6, paddingVertical: 4, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' }
});
