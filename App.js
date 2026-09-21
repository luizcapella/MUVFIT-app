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
  const [stories, setStories] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isHeaderSelectOpen, setIsHeaderSelectOpen] = useState(false);
  const [isPerfScopeSelectOpen, setIsPerfScopeSelectOpen] = useState(false);

  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [isAdminContext, setIsAdminContext] = useState(true);

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0] || {};

  const [commentInputs, setCommentInputs] = useState({});
  const [evidences] = useState([
    { id: 'e1', title: 'Força / Perna', date: '17/09/2026', image: 'https://picsum.photos/seed/ev1/200/200' },
    { id: 'e2', title: 'Corrida 8km', date: '15/09/2026', image: 'https://picsum.photos/seed/ev2/200/200' },
  ]);

  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState('musculacao');
  const [durationInput, setDurationInput] = useState('');
  const [workoutCaption, setWorkoutCaption] = useState('');
  const [photoEvidence, setPhotoEvidence] = useState(null);

  // CRIAR DESAFIO
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeCode, setNewChallengeCode] = useState('');
  const [hasCapToggle, setHasCapToggle] = useState(false);
  const [newChallengeCap, setNewChallengeCap] = useState('22000');

  const [bonusInquebravelActive] = useState(true);
  const [bonusInquebravelDays] = useState('7');
  const [bonusInquebravelPoints] = useState('5000');

  const [bonusDespertaActive] = useState(true);
  const [bonusDespertaTime] = useState('07:00');
  const [bonusDespertaPoints] = useState('3000');

  const [tiebreakersConfig] = useState([
    { id: 'tb1', name: 'Passos Diários', enabled: true },
    { id: 'tb2', name: 'Banco de Pontos', enabled: true },
    { id: 'tb3', name: 'KM Total Percorrido', enabled: false },
    { id: 'tb4', name: 'Dias em Atividade', enabled: false }
  ]);

  const [athletePerfScope] = useState('overall');

  const [userGoals, setUserGoals] = useState([
    { id: 'g1', title: 'Perder Peso', completed: true },
    { id: 'g2', title: 'Ganhar Massa Magra', completed: true },
    { id: 'g3', title: 'Correr 10 km', completed: true },
    { id: 'g4', title: 'Participar de Maratona', completed: false },
  ]);

  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [newStoryMedia, setNewStoryMedia] = useState(null);
  const [newStoryType, setNewStoryType] = useState('image');
  
  const [selectedStory, setSelectedStory] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);

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

  // AUTENTICAÇÃO E CADASTRO
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

        // 1. Registro no Supabase Auth
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

        // 2. Se o Supabase já retornar sessão no cadastro, entra direto
        if (authData?.session) {
          setSession(authData.session);
          await fetchUserProfile(authData.session.user.id, authData.session.user.email);
          await fetchDataFromSupabase();
          setAuthSubmitting(false);
          return;
        }

        // 3. Tenta criar a linha na 'profiles' sem travar o código se falhar
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

        // 4. Executa o Login Imediato
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
        // FLUXO DE LOGIN
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
      } else {
        setChallenges([]);
        setActiveChallengeId(null);
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

      const { data: storiesData } = await supabase.from('stories').select('*');
      if (storiesData) setStories(storiesData);

    } catch (err) {
      console.log('Erro ao carregar do Supabase:', err);
    }
  }

  useEffect(() => {
    let timer = null;
    if (selectedStory) {
      setStoryProgress(0);
      const intervalTime = 100;
      const totalDuration = 30000;
      const stepIncrement = (intervalTime / totalDuration) * 100;

      timer = setInterval(() => {
        setStoryProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setSelectedStory(null);
            return 0;
          }
          return prev + stepIncrement;
        });
      }, intervalTime);
    } else {
      setStoryProgress(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [selectedStory]);

  const userMembershipsAll = memberships.filter(m => m.userId === currentUser.id);
  const hasUserAnyCommunity = userMembershipsAll.length > 0;

  const adminChallenges = challenges.filter(c => c.creator_id === currentUser.id);
  const participantChallenges = challenges.filter(c => {
    return memberships.some(m => m.challengeId === c.id && m.userId === currentUser.id) && c.creator_id !== currentUser.id;
  });

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
    setCurrentScreen('feed');
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
      tiebreakers_config: tiebreakersConfig,
      bonuses: {
        inquebravel: { active: bonusInquebravelActive, days: parseInt(bonusInquebravelDays, 10) || 7, points: parseInt(bonusInquebravelPoints, 10) || 5000 },
        desperta: { active: bonusDespertaActive, limitTime: bonusDespertaTime, points: parseInt(bonusDespertaPoints, 10) || 3000 }
      },
      rules: selectedChallenge.rules || {}
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
      role: 'active',
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
    Alert.alert('🎉 Convite Aceito!', `Você entrou no desafio "${ch.title}".`);
  }

  // EXCLUSÃO EM CASCATA COM CONFIRMAÇÃO DO ADMIN
  async function handleDeleteChallenge(challengeId) {
    const challengeToDelete = challenges.find(c => c.id === challengeId);
    if (!challengeToDelete) return;

    const confirmDelete = Platform.OS === 'web'
      ? window.confirm(`Tem certeza de que deseja EXCLUIR definitivamente a liga "${challengeToDelete.title}"? Esta ação removerá todos os membros e treinos desta liga e não pode ser desfeita.`)
      : true;

    if (!confirmDelete) return;

    try {
      // Deleta em cascata dependências para evitar conflito de Chave Estrangeira (Foreign Key)
      await supabase.from('pending_workouts').delete().eq('challenge_id', challengeId);
      await supabase.from('feed_posts').delete().eq('challenge_id', challengeId);
      await supabase.from('memberships').delete().eq('challenge_id', challengeId);

      // Deleta o desafio na tabela principal
      const { error } = await supabase.from('challenges').delete().eq('id', challengeId);

      if (error) {
        Alert.alert('Erro ao Excluir', error.message);
        return;
      }

      await fetchDataFromSupabase();

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
    const updatedStatus = !selectedChallenge.registrations_closed;
    await supabase.from('challenges').update({ registrations_closed: updatedStatus }).eq('id', selectedChallenge.id);
    fetchDataFromSupabase();
    Alert.alert('Status Atualizado', updatedStatus ? 'Inscrições ENCERRADAS.' : 'Inscrições ABERTAS.');
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
    if (!currentMemberRecord || currentMemberRecord.role !== 'active') {
      Alert.alert('Acesso Restrito', 'Apenas Atletas Ativos podem submeter treinos.');
      return;
    }

    if (!photoEvidence) {
      Alert.alert('Comprovante Obrigatório', 'Envie a foto comprovando a atividade.');
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

    const newPendingWorkout = {
      id: `pw_${Date.now()}`,
      challenge_id: activeChallengeId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_nickname: currentUser.nickname,
      user_avatar: currentUser.avatar,
      activity_type: selectedActivity.toUpperCase(),
      caption: workoutCaption || `Atividade de ${selectedActivity}`,
      photo_evidence: photoEvidence,
      points_to_ranking: ptsRanking,
      points_to_bank: ptsBank,
      created_at: 'Agora'
    };

    await supabase.from('pending_workouts').insert([newPendingWorkout]);
    fetchDataFromSupabase();
    setIsWorkoutModalOpen(false);
    setDurationInput('');
    setWorkoutCaption('');
    setPhotoEvidence(null);
    Alert.alert('Sucesso', 'Treino enviado para a nuvem! Aguardando aprovação do Admin.');
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

  const MediaPickerField = ({ label, photoState, setPhotoState, acceptVideo = false, setMediaType = null }) => (
    <View style={styles.mediaFieldBox}>
      <Text style={styles.mediaLabel}>{label}</Text>
      <View style={styles.mediaButtonsRow}>
        <TouchableOpacity 
          style={styles.cameraBtn} 
          onPress={() => {
            const mockUri = 'https://picsum.photos/seed/' + Math.random() + '/400/300';
            setPhotoState(mockUri);
            if (setMediaType) setMediaType('image');
          }}
        >
          <Text style={styles.mediaBtnText}>📷 Foto Exemplo</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.galleryBtn} 
          onPress={() => {
            const mockUri = 'https://picsum.photos/seed/' + Math.random() + '/400/300';
            setPhotoState(mockUri);
            if (setMediaType) setMediaType(acceptVideo ? 'video' : 'image');
          }}
        >
          <Text style={styles.mediaBtnText}>🖼️ Galeria Exemplo</Text>
        </TouchableOpacity>
      </View>

      {photoState ? (
        <View style={styles.previewContainer}>
          {acceptVideo && newStoryType === 'video' ? (
            <Text style={{ fontSize: 14, color: '#16a34a', fontWeight: 'bold' }}>🎥 Vídeo Anexado</Text>
          ) : (
            <Image source={{ uri: photoState }} style={styles.previewImage} />
          )}
          <Text style={styles.previewSuccessText}>✅ Pronto para Enviar</Text>
        </View>
      ) : (
        <Text style={styles.previewPendingText}>Pendente</Text>
      )}
    </View>
  );

  const currentChallengeMembers = memberships.filter(m => m.challengeId === activeChallengeId);
  const activeMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'active');
  const spectatorMembersInChallenge = currentChallengeMembers.filter(m => m.role === 'spectator');
  const top3Ranked = [...activeMembersInChallenge].sort((a,b) => (b.rankingPoints || 0) - (a.rankingPoints || 0)).slice(0, 3);
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

  const currentMemberState = currentChallengeMembers.find(m => m.userId === currentUser.id);
  const userStories = stories.filter(st => st.user_id === viewedUser.id);

  if (loadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e3a8a' }}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={{ color: '#ffffff', marginTop: 12, fontWeight: 'bold' }}>Carregando MuvFit...</Text>
      </View>
    );
  }

  // TELA DE AUTENTICAÇÃO
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

  // TELA PRINCIPAL DO APP
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
                            setCurrentScreen('ranking');
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                        >
                          <Text style={{ fontSize: 16, marginRight: 6 }}>🏆</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.searchResultTitle}>{ch.title}</Text>
                            <Text style={styles.searchResultSub}>Código: {ch.invite_code} | Ver Ranking ➔</Text>
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
            <Text style={[styles.sidebarText, currentScreen === 'dashboard' && styles.sidebarTextActive]}>Dashboard</Text>
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

              {isAdminContext && (
                <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'admin' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('admin')}>
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

                      {/* BOTÃO EXCLUIR EXIBIDO PARA ADMINISTRADORES EM TODOS OS STATUS */}
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

          {currentScreen === 'feed' && hasUserAnyCommunity && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.pageTitle}>Feed — {selectedChallenge.title}</Text>
                <TouchableOpacity style={styles.inviteBtn} onPress={() => handleShareInvite(selectedChallenge)}>
                  <Text style={styles.btnMiniText}>🔗 CONVIDAR</Text>
                </TouchableOpacity>
              </View>

              {currentMemberState?.role === 'active' ? (
                <TouchableOpacity style={styles.actionBtn} onPress={() => setIsWorkoutModalOpen(true)}>
                  <Text style={styles.actionBtnText}>+ REGISTRAR NOVO TREINO / PASSOS</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.restrictedNoticeBox}>
                  <Text style={styles.restrictedNoticeText}>
                    👀 Perfil de Torcedor: Modo de leitura.
                  </Text>
                </View>
              )}

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

          {currentScreen === 'ranking' && hasUserAnyCommunity && selectedChallenge && (
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

          {currentScreen === 'admin' && isAdminContext && hasUserAnyCommunity && selectedChallenge && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>🎯 Gerenciando: {selectedChallenge.title}</Text>
                <Text style={styles.adminCardSub}>Todas as alterações feitas afetam esta liga no Supabase.</Text>
              </View>

              <View style={styles.adminControlCard}>
                <Text style={styles.adminCardTitle}>📋 Aprovação de Treinos Pendentes ({currentPendingWorkouts.length})</Text>
                {currentPendingWorkouts.length === 0 ? (
                  <Text style={styles.emptyNoticeText}>Nenhum treino aguardando aprovação.</Text>
                ) : (
                  currentPendingWorkouts.map((w) => (
                    <View key={w.id} style={styles.participantRow}>
                      <Image source={{ uri: w.photo_evidence }} style={styles.avatarMini} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.participantName}>{w.user_name} ({w.activity_type})</Text>
                        <Text style={styles.participantSub}>{w.caption}</Text>
                        <Text style={styles.tagActiveText}>Recompensa: +{w.points_to_ranking} pts</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproveWorkout(w.id)}>
                          <Text style={styles.btnMiniText}>✅ APROVAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.banBtn} onPress={() => handleRejectWorkout(w.id)}>
                          <Text style={styles.btnMiniText}>❌ REJEITAR</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* MODAL EDITAR PERFIL */}
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

      {/* MODAL SELEÇÃO DE DESAFIO NO HEADER */}
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

      {/* MODAL CRIAR NOVO DESAFIO */}
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

            {/* CAIXA DE SELEÇÃO DO TETO DIÁRIO */}
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

            {/* RETÂNGULO DE ENTRADA DO LIMITE (EXIBIDO APENAS SE HABILITADO) */}
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

  participantRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#fed7aa', marginTop: 6 },
  participantName: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  tagActiveText: { fontSize: 9, color: '#16a34a', fontWeight: 'bold' },
  participantSub: { fontSize: 9, color: '#64748b' },

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

  mediaFieldBox: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 8, marginBottom: 8 },
  mediaLabel: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 6 },
  mediaButtonsRow: { flexDirection: 'row', gap: 8 },
  cameraBtn: { flex: 1, backgroundColor: '#f97316', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  galleryBtn: { flex: 1, backgroundColor: '#1e3a8a', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  mediaBtnText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  previewContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  previewImage: { width: 36, height: 36, borderRadius: 6, borderWidth: 1, borderColor: '#16a34a' },
  previewSuccessText: { color: '#16a34a', fontSize: 9, fontWeight: 'bold' },
  previewPendingText: { color: '#94a3b8', fontSize: 9, fontStyle: 'italic', marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 14 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, maxHeight: '90%' },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 10, textAlign: 'center' },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#475569', marginVertical: 4 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 6, fontSize: 11, marginBottom: 6 },

  chipBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  chipBtnActive: { backgroundColor: '#f97316' },
  chipText: { fontSize: 9, fontWeight: 'bold', color: '#475569' },
  chipTextActive: { color: '#ffffff' },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10, gap: 10 },
  checkboxBox: { width: 22, height: 22, borderWidth: 2, borderColor: '#1e3a8a', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },
  checkboxBoxActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  checkboxCheckmark: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  checkboxLabel: { fontSize: 11, fontWeight: 'bold', color: '#1e3a8a' },

  cancelBtn: { marginTop: 6, paddingVertical: 4, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' }
});
