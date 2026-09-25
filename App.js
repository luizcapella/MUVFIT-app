import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Image, Modal, SafeAreaView, ActivityIndicator, Alert, Platform, Dimensions } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sua-url-aqui.supabase.co';
const SUPABASE_ANON_KEY = 'sua-chave-aqui';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const calculateAge = (b) => { if (!b || b.length !== 10) return ''; const [d, m, y] = b.split('/').map(Number); const bd = new Date(y, m - 1, d), t = new Date(); let a = t.getFullYear() - bd.getFullYear(); const mo = t.getMonth() - bd.getMonth(); if (mo < 0 || (mo === 0 && t.getDate() < bd.getDate())) a--; return isNaN(a) ? '' : `${a} anos`; };
const formatDateBR = (i) => { if (!i) return ''; const d = new Date(i); if (isNaN(d.getTime())) return i; return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; };

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [authData, setAuthData] = useState({ email: '', password: '', isSignUp: false });
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [genderInput, setGenderInput] = useState('Masculino');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [fontSizeScale, setFontSizeScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);

  const [currentUser, setCurrentUser] = useState({ id: '', name: 'Atleta', nickname: 'Atleta', avatar: 'https://via.placeholder.com/150', role: 'member', status: 'pending' });
  const [viewedUser, setViewedUser] = useState(null);
  
  const [challenges, setChallenges] = useState([]);
  const [adminChallenges, setAdminChallenges] = useState([]);
  const [participantChallenges, setParticipantChallenges] = useState([]);
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [feedPosts, setFeedPosts] = useState([]);
  const [athleteFeedPosts, setAthleteFeedPosts] = useState([]);
  const [pendingWorkouts, setPendingWorkouts] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('all');

  const [subAbaConfig, setSubAbaConfig] = useState('conta');
  const [accountNewPassword, setAccountNewPassword] = useState('');
  const [ratingStars, setRatingStars] = useState(5);
  const [feedbackSuggestion, setFeedbackSuggestion] = useState('');
  const [helpMessage, setHelpMessage] = useState('');

  const [athletePerfScope, setAthletePerfScope] = useState('global');
  const [currentUserMembershipInActiveChallenge, setCurrentUserMembershipInActiveChallenge] = useState(null);

  const [expandedSec1, setExpandedSec1] = useState(false);
  const [expandedSec2, setExpandedSec2] = useState(false);
  const [expandedSec3, setExpandedSec3] = useState(false);
  const [expandedSec5, setExpandedSec5] = useState(false);
  const [manualRankingPts, setManualRankingPts] = useState('');

  // Modais
  const [isWeightChartModalOpen, setIsWeightChartModalOpen] = useState(false);
  const [isModalityRadarModalOpen, setIsModalityRadarModalOpen] = useState(false);
  const [isKmChartModalOpen, setIsKmChartModalOpen] = useState(false);
  const [isTimeChartModalOpen, setIsTimeChartModalOpen] = useState(false);
  const [isAllEvidencesModalOpen, setIsAllEvidencesModalOpen] = useState(false);
  const [isAdvancedRulesModalOpen, setIsAdvancedRulesModalOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);

  const [weightHistoryList, setWeightHistoryList] = useState([]);
  const [newWeightValueInput, setNewWeightValueInput] = useState('');
  const [newWeightDateInput, setNewWeightDateInput] = useState(formatDateBR(new Date()));
  const [targetWeightValue, setTargetWeightValue] = useState('');
  const [isDeleteModeActive, setIsDeleteModeActive] = useState(false);

  const [selectedModalityPeriod, setSelectedModalityPeriod] = useState('Todos');
  const availablePeriodsList = ['Todos', '2026', 'Mês Atual'];
  const [selectedKmFilterActivity, setSelectedKmFilterActivity] = useState('Todos');

  const [selectedConfigChallengeId, setSelectedConfigChallengeId] = useState(null);
  const [selectedConfigActivity, setSelectedConfigActivity] = useState('🏛️ Base da Liga');
  const [editFullName, setEditFullName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState('');
  const [newChallengeCode, setNewChallengeCode] = useState('');

  const [selectedActivity, setSelectedActivity] = useState('🚶‍♂️ Passos Diários');
  const [workoutCaption, setWorkoutCaption] = useState('');
  const [workoutForm, setWorkoutForm] = useState({ activity: '🚶‍♂️ Passos Diários', km: '', photoEvidence: null });

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
    { label: '🎁 Bônus e Critérios de Desempate', value: '🎁 Bônus e Critérios de Desempate' },
    { label: '🏛️ Base da Liga', value: '🏛️ Base da Liga' }
  ];

  const selectedChallenge = challenges.find(c => c.id === activeChallengeId) || challenges[0] || {};
  const hasUserAnyCommunity = memberships.length > 0 || challenges.length > 0;

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

  const handleAuthAction = async () => {
    if (!emailInput || !passwordInput) return Alert.alert('Atenção', 'Preencha e-mail e senha.');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email: emailInput, password: passwordInput });
        if (error) throw error;
        Alert.alert('Sucesso', 'Conta criada com sucesso!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password: passwordInput });
        if (error) throw error;
      }
    } catch (error) { Alert.alert('Erro', error.message); }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); setSession(null); };
  const handleChangePassword = async () => { Alert.alert('Sucesso', 'Instruções enviadas.'); };
  const handleDeleteAccountConfirmation = async () => { Alert.alert('Aviso', 'Conta marcada para exclusão.'); };
  const handleSendEmailRequest = (title, msg) => { Alert.alert(title, 'Mensagem enviada com sucesso.'); };
  const handleSaveProfile = async () => { setSavingProfile(false); setIsEditProfileOpen(false); };
  const selectChallengeContext = (ch) => setActiveChallengeId(ch.id);
  const handleShareInvite = () => { Alert.alert('Código', `Código: ${selectedChallenge.code || 'MUV2026'}`); };
  const handleOpenUserProfile = (userId) => { setCurrentScreen('athlete_center'); };
  const handleRequestCommunityEntry = () => { Alert.alert('Sucesso', 'Solicitação enviada!'); };
  const handleRequestAthleteActive = () => { Alert.alert('Sucesso', 'Solicitação enviada!'); };
  const handleCreateChallenge = () => { setIsCreateChallengeOpen(false); Alert.alert('Sucesso', 'Desafio criado!'); };
  const handleDeleteChallenge = () => { Alert.alert('Sucesso', 'Excluído.'); };
  const toggleChallengeRegistrations = () => {};
  const handleUpdateAthleteStatus = () => {};
  const handleRemoveMemberFromCommunity = () => {};
  const handleManualPointsSubmit = () => { Alert.alert('Sucesso', 'Pontos creditados!'); };
  const handleSaveAdvancedRules = () => { setIsAdvancedRulesModalOpen(false); Alert.alert('Sucesso', 'Regras salvas!'); };
  const handleSubmitWorkout = () => { setIsWorkoutModalOpen(false); Alert.alert('Sucesso', 'Treino enviado!'); };
  const handleApproveWorkout = () => {};
  const handleRejectWorkout = () => {};
  const saveWeightDataToSupabase = async () => {};

  const searchResultsAthletes = memberships.filter(m => searchFilter !== 'challenge');
  const searchResultsChallenges = challenges.filter(c => searchFilter !== 'athlete');
  const currentChallengeMembers = memberships.filter(m => m.challengeId === activeChallengeId);
  const currentFeedPosts = feedPosts.filter(p => p.challenge_id === activeChallengeId);
  const currentPendingWorkouts = pendingWorkouts.filter(w => w.challenge_id === activeChallengeId);
  const rankedAthletes = [];
  const top3Winners = [];

  const athleteMembershipsAll = memberships.filter(m => m.userId === viewedUser?.id);
  const displayedPerf = { rankingPoints: 0, totalSteps: 0 };
  const athleteFeedPostsAll = feedPosts.filter(p => p.user_id === viewedUser?.id);

  const allAvailableModalities = [{ label: 'Musculação', color: '#3b82f6' }];
  const modalityPercentagesList = [];
  const totalModalityExecutions = 0;
  const totalHoursAccumulated = 0;
  const totalMinutesAccumulated = 0;

  return (
    <SafeAreaView style={[styles.container, highContrast && { backgroundColor: '#000' }]}>
      <View style={[styles.topHeader, highContrast && { backgroundColor: '#000', borderBottomWidth: 2, borderBottomColor: '#f97316' }]}>
        <View style={styles.brandRow}>
          <View><Text style={styles.brandTitle}>MUVFIT</Text><Text style={styles.brandSubtitle}>Mizan Soluções Técnicas</Text></View>
          <TouchableOpacity style={{ backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }} onPress={handleSignOut}><Text style={{ color: '#fff', fontSize: 9 * fontSizeScale, fontWeight: 'bold' }}>🚪 SAIR</Text></TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={[styles.sidebar, highContrast && { backgroundColor: '#111' }]}>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'dashboard' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('dashboard')}><Text style={styles.sidebarIcon}>🏠</Text><Text style={[styles.sidebarText, { fontSize: 9 * fontSizeScale }]}>Painel</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'configuracao_conta' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('configuracao_conta')}><Text style={styles.sidebarIcon}>☰</Text><Text style={[styles.sidebarText, { fontSize: 9 * fontSizeScale }]}>Config</Text></TouchableOpacity>
        </View>

        <View style={[{ flex: 1, backgroundColor: '#fff' }, highContrast && { backgroundColor: '#000' }]}>
          {currentScreen === 'dashboard' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={[styles.pageTitle, { fontSize: 14 * fontSizeScale }, highContrast && { color: '#fff' }]}>Painel Geral de Ligas</Text>
            </ScrollView>
          )}

          {currentScreen === 'configuracao_conta' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={[styles.pageTitle, { fontSize: 16 * fontSizeScale }]}>⚙️ Configuração de Conta</Text>
            </ScrollView>
          )}
        </View>
      </View>

      {/* MODAL: PESO */}
      <Modal visible={isWeightChartModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 6, marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#c2410c' }}>Gráfico de Peso</Text>
              <TouchableOpacity onPress={() => setIsWeightChartModalOpen(false)}><Text style={{ fontSize: 16, fontWeight: 'bold' }}>✕</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsDeleteModeActive(!isDeleteModeActive)}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#dc2626' }}>Apagar dados de peso</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsWeightChartModalOpen(false)}>
              <Text style={styles.primaryBtnText}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: RADAR */}
      <Modal visible={isModalityRadarModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>Resumo de Exercícios</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsModalityRadarModalOpen(false)}><Text style={styles.primaryBtnText}>FECHAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: KM */}
      <Modal visible={isKmChartModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>Distância Percorrida</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsKmChartModalOpen(false)}><Text style={styles.primaryBtnText}>FECHAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: TEMPO */}
      <Modal visible={isTimeChartModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>Tempo de Atividade</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsTimeChartModalOpen(false)}><Text style={styles.primaryBtnText}>FECHAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: EVIDÊNCIAS */}
      <Modal visible={isAllEvidencesModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>📸 Histórico Completo de Evidências</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsAllEvidencesModalOpen(false)}><Text style={styles.primaryBtnText}>FECHAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: REGRAS AVANÇADAS */}
      <Modal visible={isAdvancedRulesModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <Text style={styles.modalTitle}>⚙️ Configuração Avançada de Pontos</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsAdvancedRulesModalOpen(false)}><Text style={styles.primaryBtnText}>FECHAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL: EDITAR PERFIL */}
      <Modal visible={isEditProfileOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>✏️ Editar Perfil do Atleta</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsEditProfileOpen(false)}><Text style={styles.primaryBtnText}>FECHAR</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL: CRIAR DESAFIO */}
      <Modal visible={isCreateChallengeOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>🏆 Criar Novo Desafio / Liga</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsCreateChallengeOpen(false)}><Text style={styles.primaryBtnText}>FECHAR</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* MODAL: REGISTAR TREINO */}
      <Modal visible={isWorkoutModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setIsWorkoutModalOpen(false)}><Text style={styles.primaryBtnText}>FECHAR</Text></TouchableOpacity>
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
  sidebar: { width: 110, backgroundColor: '#f8fafc', borderRightWidth: 1, borderRightColor: '#cbd5e1', paddingVertical: 10 },
  sidebarBtn: { paddingVertical: 12, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  sidebarBtnActive: { backgroundColor: '#ffffff', borderLeftWidth: 4, borderLeftColor: '#f97316' },
  sidebarIcon: { fontSize: 12 },
  sidebarText: { fontSize: 9, fontWeight: 'bold', color: '#64748b' },
  mainContent: { padding: 12 },
  pageTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginVertical: 8 },
  primaryBtn: { backgroundColor: '#f97316', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 14 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, maxHeight: '90%' },
  modalContentLarge: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, maxHeight: '95%', width: '95%', alignSelf: 'center' },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 10, textAlign: 'center' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 8 }
});
