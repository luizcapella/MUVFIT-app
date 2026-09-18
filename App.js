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
  Platform,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // AUTH
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authNickname, setAuthNickname] = useState('');

  // USUÁRIO
  const [currentUser, setCurrentUser] = useState(null);
  const [viewedUser, setViewedUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('athlete_center');

  // LIGAS
  const [challenges, setChallenges] = useState([
    { id: 'c1', title: 'Liga Anti-Inércia 2026', invite_code: 'ANTI2026', creator_id: 'usr_capella' }
  ]);
  const [activeChallengeId, setActiveChallengeId] = useState('c1');
  const [memberships, setMemberships] = useState([
    { challengeId: 'c1', userId: 'usr_capella', name: 'Luiz Capella', nickname: 'Poke', role: 'active', rankingPoints: 22000, bankPoints: 15400, totalSteps: 42350, avatar: 'https://picsum.photos/seed/poke/200/200' }
  ]);

  // OBJETIVOS PESSOAIS (INICIA ZERADO E COM X VERMELHO)
  const [userGoals, setUserGoals] = useState([]);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');

  // PESO EDITÁVEL E HISTÓRICO DE DADOS CLICÁVEIS (ETAPA 6)
  const [currentWeight, setCurrentWeight] = useState('79');
  const [newWeightInput, setNewWeightInput] = useState('');
  const [isEditWeightOpen, setIsEditWeightOpen] = useState(false);
  const [weightHistory, setWeightHistory] = useState([
    { date: '01/09/2026', weight: '82.0 kg' },
    { date: '15/09/2026', weight: '79.0 kg' }
  ]);

  // MODAIS DE HISTÓRICO E GRÁFICOS
  const [selectedMetricModal, setSelectedMetricModal] = useState(null); // 'peso', 'km', 'tempo', 'atividades'

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        await ImagePicker.requestCameraPermissionsAsync();
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
    })();

    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      setSession(activeSession);
      if (activeSession) loadUserProfile(activeSession.user);
      else setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      setSession(activeSession);
      if (activeSession) loadUserProfile(activeSession.user);
      else setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(user) {
    try {
      const userObj = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        nickname: user.user_metadata?.nickname || 'Atleta',
        age: 34,
        gender: 'Masculino',
        avatar: user.user_metadata?.avatar || 'https://picsum.photos/seed/' + user.id + '/200/200'
      };
      setCurrentUser(userObj);
      setViewedUser(userObj);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingSession(false);
    }
  }

  // OBJETIVOS: ADICIONAR E REMOVER COM X VERMELHO
  function handleAddGoal() {
    if (!newGoalTitle.trim()) return;
    setUserGoals([...userGoals, { id: `g_${Date.now()}`, title: newGoalTitle.trim(), completed: false }]);
    setNewGoalTitle('');
    setIsAddGoalOpen(false);
  }

  function handleDeleteGoal(goalId) {
    setUserGoals(userGoals.filter(g => g.id !== goalId));
  }

  // SAIR DO DESAFIO
  function handleLeaveChallenge(challengeId) {
    Alert.alert('Sair do Desafio', 'Deseja realmente remover seu vínculo com este desafio?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair do Desafio',
        style: 'destructive',
        onPress: () => {
          setMemberships(memberships.filter(m => !(m.challengeId === challengeId && m.userId === currentUser.id)));
          Alert.alert('Sucesso', 'Você saiu do desafio.');
        }
      }
    ]);
  }

  // SALVAR NOVO PESO
  function handleSaveWeight() {
    if (!newWeightInput.trim()) return;
    const todayStr = new Date().toLocaleDateString();
    const newEntry = { date: todayStr, weight: `${newWeightInput.trim()} kg` };
    setCurrentWeight(newWeightInput.trim());
    setWeightHistory([newEntry, ...weightHistory]);
    setNewWeightInput('');
    setIsEditWeightOpen(false);
    Alert.alert('Peso Atualizado!', 'Novo registro adicionado ao seu histórico.');
  }

  if (loadingSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Conectando ao MUVFIT...</Text>
      </View>
    );
  }

  if (!session || !currentUser) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <ScrollView contentContainerStyle={styles.authContent}>
          <Text style={styles.authBrandTitle}>MUVFIT</Text>
          <Text style={styles.authBrandSubtitle}>Mizan Soluções Técnicas</Text>
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>🔑 Entrar no Aplicativo</Text>
            <TextInput style={styles.input} placeholder="E-mail" value={authEmail} onChangeText={setAuthEmail} />
            <TextInput style={styles.input} placeholder="Senha" secureTextEntry value={authPassword} onChangeText={setAuthPassword} />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => {}}><Text style={styles.primaryBtnText}>ENTRAR</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>MUVFIT</Text>
          <Text style={styles.brandSubtitle}>Mizan Soluções Técnicas</Text>
        </View>
      </View>

      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* SIDEBAR */}
        <View style={styles.sidebar}>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'dashboard' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('dashboard')}>
            <Text style={styles.sidebarIcon}>🏠</Text>
            <Text style={[styles.sidebarText, currentScreen === 'dashboard' && styles.sidebarTextActive]}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sidebarBtn, currentScreen === 'athlete_center' && styles.sidebarBtnActive]} onPress={() => setCurrentScreen('athlete_center')}>
            <Text style={styles.sidebarIcon}>👤</Text>
            <Text style={[styles.sidebarText, currentScreen === 'athlete_center' && styles.sidebarTextActive]}>Atleta</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
          {/* DASHBOARD COM SAIR DO DESAFIO */}
          {currentScreen === 'dashboard' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <Text style={styles.pageTitle}>Meus Desafios Participando</Text>
              {challenges.map(c => (
                <View key={c.id} style={styles.cardBox}>
                  <Text style={styles.cardBoxTitle}>{c.title}</Text>
                  <TouchableOpacity style={styles.leaveChallengeBtn} onPress={() => handleLeaveChallenge(c.id)}>
                    <Text style={styles.btnMiniText}>🚪 SAIR DO DESAFIO</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* CENTRAL DO ATLETA CLICÁVEL COM GRÁFICOS */}
          {currentScreen === 'athlete_center' && (
            <ScrollView contentContainerStyle={styles.mainContent}>
              <View style={styles.profileHeaderCard}>
                <Image source={{ uri: viewedUser?.avatar }} style={styles.avatarLarge} />
                <Text style={styles.profileName}>{viewedUser?.name}</Text>
                <Text style={styles.profileMeta}>{viewedUser?.age} anos | {viewedUser?.gender}</Text>
              </View>

              <Text style={styles.pageTitle}>Evolução & Estatísticas (Clique para ver gráficos)</Text>
              
              <View style={styles.chartsGrid}>
                {/* CARD PESO */}
                <TouchableOpacity style={styles.chartCard} onPress={() => setSelectedMetricModal('peso')}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.chartTitle}>📊 Evolução de Peso ({currentWeight} kg)</Text>
                    {viewedUser?.id === currentUser?.id && (
                      <TouchableOpacity style={styles.editBtnMini} onPress={() => setIsEditWeightOpen(true)}>
                        <Text style={styles.editBtnMiniText}>✏️ Atualizar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.chartSubText}>Toque para ver a tabela completa e o gráfico ➔</Text>
                </TouchableOpacity>

                {/* CARD ATIVIDADES */}
                <TouchableOpacity style={styles.chartCard} onPress={() => setSelectedMetricModal('atividades')}>
                  <Text style={styles.chartTitle}>📊 Atividades Mais Praticadas</Text>
                  <Text style={styles.chartSubText}>Musculação (45%) | Corrida (35%) | Bike (20%) ➔</Text>
                </TouchableOpacity>

                {/* CARD KM */}
                <TouchableOpacity style={styles.chartCard} onPress={() => setSelectedMetricModal('km')}>
                  <Text style={styles.chartTitle}>🏃 KM Percorrido Acumulado</Text>
                  <Text style={styles.chartSubText}>128,5 km totais acumulados ➔</Text>
                </TouchableOpacity>

                {/* CARD TEMPO */}
                <TouchableOpacity style={styles.chartCard} onPress={() => setSelectedMetricModal('tempo')}>
                  <Text style={styles.chartTitle}>⏱️ Tempo Total em Atividade</Text>
                  <Text style={styles.chartSubText}>42 horas registradas ➔</Text>
                </TouchableOpacity>
              </View>

              {/* OBJETIVOS COM BOTAO X VERMELHO */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <Text style={styles.pageTitle}>Checklist de Objetivos Pessoais</Text>
                <TouchableOpacity style={styles.smallAddBtn} onPress={() => setIsAddGoalOpen(true)}>
                  <Text style={styles.smallAddBtnText}>+ OBJETIVO</Text>
                </TouchableOpacity>
              </View>

              {userGoals.length === 0 ? (
                <Text style={styles.emptyNoticeText}>Nenhum objetivo cadastrado. Clique no botão acima para adicionar.</Text>
              ) : (
                userGoals.map((g) => (
                  <View key={g.id} style={styles.goalItem}>
                    <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }} onPress={() => setUserGoals(userGoals.map(i => i.id === g.id ? { ...i, completed: !i.completed } : i))}>
                      <Text style={{ fontSize: 16 }}>{g.completed ? '✅' : '⬜'}</Text>
                      <Text style={[styles.goalText, g.completed && styles.goalDone]}>{g.title}</Text>
                    </TouchableOpacity>

                    {/* BOTÃO X VERMELHO DE EXCLUSÃO */}
                    <TouchableOpacity style={styles.deleteGoalBtn} onPress={() => handleDeleteGoal(g.id)}>
                      <Text style={styles.deleteGoalBtnText}>✖</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </View>

      {/* MODAL EDITAR PESO */}
      <Modal visible={isEditWeightOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Atualizar Peso Atual (kg)</Text>
            <TextInput style={styles.input} placeholder="Ex: 78.5" keyboardType="numeric" value={newWeightInput} onChangeText={setNewWeightInput} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveWeight}><Text style={styles.primaryBtnText}>SALVAR PESO</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditWeightOpen(false)}><Text style={styles.cancelBtnText}>CANCELAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL ADICIONAR OBJETIVO */}
      <Modal visible={isAddGoalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Objetivo Pessoal</Text>
            <TextInput style={styles.input} placeholder="Ex: Correr 10 km sem parar" value={newGoalTitle} onChangeText={setNewGoalTitle} />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddGoal}><Text style={styles.primaryBtnText}>SALVAR OBJETIVO</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddGoalOpen(false)}><Text style={styles.cancelBtnText}>CANCELAR</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE HISTÓRICO E GRÁFICOS DAS MÉTRICAS (ETAPA 6) */}
      <Modal visible={!!selectedMetricModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.modalTitle}>
                {selectedMetricModal === 'peso' && '📊 Histórico de Peso'}
                {selectedMetricModal === 'atividades' && '📊 Estatísticas de Modalidades'}
                {selectedMetricModal === 'km' && '🏃 Evolução de Quilometragem'}
                {selectedMetricModal === 'tempo' && '⏱️ Horas em Atividade'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedMetricModal(null)}>
                <Text style={{ fontSize: 16, fontWeight: 'bold' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* GRÁFICO VISUAL MOCK NATIVO */}
            <View style={styles.graphContainer}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center', marginBottom: 4 }}>📈 Gráfico de Evolução Acumulada</Text>
              <View style={styles.graphBarRow}>
                <View style={[styles.graphBar, { height: '50%' }]} />
                <View style={[styles.graphBar, { height: '70%' }]} />
                <View style={[styles.graphBar, { height: '100%' }]} />
              </View>
            </View>

            {/* TABELA DE HISTÓRICO */}
            <Text style={styles.inputLabel}>Tabela de Registros:</Text>
            <ScrollView style={{ maxHeight: 150 }}>
              {selectedMetricModal === 'peso' && weightHistory.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={styles.tableCellDate}>{item.date}</Text>
                  <Text style={styles.tableCellValue}>{item.weight}</Text>
                </View>
              ))}
              {selectedMetricModal !== 'peso' && (
                <View style={styles.tableRow}>
                  <Text style={styles.tableCellDate}>Setembro/2026</Text>
                  <Text style={styles.tableCellValue}>Dados gravados com sucesso</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedMetricModal(null)}>
              <Text style={styles.cancelBtnText}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 12, fontWeight: 'bold', color: '#1e3a8a' },

  authContainer: { flex: 1, backgroundColor: '#1e3a8a' },
  authContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  authBrandTitle: { fontSize: 32, fontWeight: '900', color: '#f97316', textAlign: 'center' },
  authBrandSubtitle: { fontSize: 12, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 20 },
  authCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 18 },
  authTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 14, textAlign: 'center' },

  topHeader: { padding: 12, backgroundColor: '#1e3a8a' },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  emptyNoticeText: { fontSize: 9, color: '#94a3b8', fontStyle: 'italic', marginVertical: 4 },

  cardBox: { backgroundColor: '#ffffff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  cardBoxTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  leaveChallengeBtn: { backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start', marginTop: 6 },
  btnMiniText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },

  profileHeaderCard: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10 },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, marginBottom: 6, borderWidth: 2, borderColor: '#f97316' },
  profileName: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  profileMeta: { fontSize: 10, color: '#64748b' },

  chartsGrid: { gap: 6, marginBottom: 10 },
  chartCard: { backgroundColor: '#f8fafc', borderRadius: 6, padding: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  chartTitle: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a' },
  chartSubText: { fontSize: 9, color: '#475569', marginTop: 2 },
  editBtnMini: { backgroundColor: '#eff6ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  editBtnMiniText: { fontSize: 8, color: '#1e3a8a', fontWeight: 'bold' },

  smallAddBtn: { backgroundColor: '#f97316', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  smallAddBtnText: { color: '#ffffff', fontSize: 8, fontWeight: 'bold' },

  goalItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 4 },
  goalText: { fontSize: 10, color: '#0f172a', fontWeight: 'bold' },
  goalDone: { textDecorationLine: 'line-through', color: '#94a3b8' },
  deleteGoalBtn: { backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#fca5a5' },
  deleteGoalBtnText: { color: '#dc2626', fontSize: 10, fontWeight: 'bold' },

  graphContainer: { backgroundColor: '#eff6ff', borderRadius: 6, padding: 10, marginVertical: 8, height: 90 },
  graphBarRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 60 },
  graphBar: { width: 20, backgroundColor: '#f97316', borderRadius: 4 },

  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableCellDate: { fontSize: 9, color: '#64748b' },
  tableCellValue: { fontSize: 9, fontWeight: 'bold', color: '#0f172a' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 14 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14 },
  modalTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a' },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#475569', marginVertical: 4 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 8, fontSize: 11, marginBottom: 8 },

  primaryBtn: { backgroundColor: '#f97316', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  cancelBtn: { marginTop: 6, paddingVertical: 4, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontSize: 10, fontWeight: 'bold' }
});
