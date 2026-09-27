// App.js (Parte 1 - Importações e Configurações Iniciais)
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

// IMPORTAÇÕES DOS SEUS NOVOS MÓDULOS OTIMIZADOS CORRIGIDOS
import { calculateAge, formatDateBR, calculateSeasonDates } from './src/utils/dateHelpers';
import { calculateWorkoutPoints } from './src/services/pointsEngine';
import { handleTriggerPhoto } from './src/components/ImageService';
import CustomPicker from './src/components/CustomPicker';


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
// App.js (Parte 3 - Renderização de Telas e Estilos Compatíveis Cross-Platform)
  async function handleAuthAction() {
    if (!emailInput.trim() || !passwordInput.trim()) {
      Alert.alert('Atenção', 'Preencha E-mail e Senha para continuar.');
      return;
    }
    setAuthSubmitting(true);
    try {
      if (isSignUp) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: emailInput.trim(),
          password: passwordInput.trim(),
        });
        if (authError) {
          Alert.alert('Erro no Cadastro', authError.message);
          return;
        }
        Alert.alert('Sucesso!', 'Conta criada. Faça o login para acessar.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailInput.trim(),
          password: passwordInput.trim(),
        });
        if (error) {
          Alert.alert('Erro no Login', 'E-mail ou senha incorretos.');
        } else if (data.session) {
          setSession(data.session);
          await fetchUserProfile(data.session.user.id, data.session.user.email);
          await fetchDataFromSupabase();
        }
      }
    } catch (err) {
      Alert.alert('Erro Inesperado', 'Ocorreu um erro de conexão.');
    } finally {
      setAuthSubmitting(false);
    }
  }

  if (loadingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>A carregar MuvFit...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.authContainer}>
        <ScrollView contentContainerStyle={styles.authScroll}>
          <Text style={styles.brandTitleCenter}>MUVFIT</Text>
          <Text style={styles.brandSubtitleCenter}>Mizan Soluções Técnicas</Text>

          <View style={styles.authCard}>
            <Text style={styles.authCardTitle}>
              {isSignUp ? 'Criar Nova Conta' : 'Aceder à Plataforma'}
            </Text>

            {isSignUp && (
              <TextInput
                style={styles.input}
                placeholder="Nome Completo"
                value={fullNameInput}
                onChangeText={setFullNameInput}
              />
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
              placeholder="Palavra-passe"
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

            <TouchableOpacity style={styles.toggleAuthBtn} onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.toggleAuthText}>
                {isSignUp ? 'Já tem conta? Faça Login' : 'Não tem conta? Registe-se gratuitamente'}
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
          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
            <Text style={styles.logoutBtnText}>🚪 SAIR</Text>
          </TouchableOpacity>
        </View>

        <CustomPicker
          label="🎯 Selecione o Desafio:"
          selectedValue={activeChallengeId}
          onValueChange={(val) => setActiveChallengeId(val)}
          options={challenges.map(c => ({ label: c.title, value: c.id }))}
        />
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        <Text style={styles.pageTitle}>Painel Geral de Ligas</Text>
        
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={() => handleTriggerPhoto('camera', setPhotoEvidence)}
        >
          <Text style={styles.actionBtnText}>📷 TIRAR FOTO COMPROVATIVA</Text>
        </TouchableOpacity>

        {photoEvidence && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Foto anexada com sucesso!</Text>
            <Image source={{ uri: photoEvidence }} style={styles.photoPreview} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e3a8a' },
  loadingText: { color: '#ffffff', marginTop: 12, fontWeight: 'bold' },
  authContainer: { flex: 1, backgroundColor: '#1e3a8a' },
  authScroll: { padding: 24, justifyContent: 'center', flexGrow: 1 },
  brandTitleCenter: { fontSize: 36, fontWeight: '900', color: '#f97316', textAlign: 'center' },
  brandSubtitleCenter: { fontSize: 12, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 24 },
  authCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  authCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center', marginBottom: 16 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, padding: 10, fontSize: 14, marginBottom: 12, color: '#0f172a' },
  primaryBtn: { backgroundColor: '#f97316', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  toggleAuthBtn: { marginTop: 14, alignItems: 'center' },
  toggleAuthText: { fontSize: 12, fontWeight: 'bold', color: '#1e3a8a' },
  topHeader: { padding: 16, backgroundColor: '#1e3a8a' },
  brandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  brandTitle: { fontSize: 24, fontWeight: '900', color: '#f97316' },
  brandSubtitle: { fontSize: 11, fontWeight: 'bold', color: '#ffffff' },
  logoutBtn: { backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  logoutBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  mainContent: { padding: 16 },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 16 },
  actionBtn: { backgroundColor: '#1e3a8a', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginBottom: 16 },
  actionBtnText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  previewContainer: { alignItems: 'center', marginVertical: 12 },
  previewLabel: { fontSize: 12, color: '#16a34a', fontWeight: 'bold', marginBottom: 6 },
  photoPreview: { width: '100%', height: 200, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1' }
});
