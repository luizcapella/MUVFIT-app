// src/screens/DashboardScreen.js (Parte 1 de 2)
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Image } from 'react-native';
import { supabase } from '../../supabaseClient';
import CustomPicker from '../components/CustomPicker';

export default function DashboardScreen({
  currentUser,
  fetchDataFromSupabase,
  challenges
}) {
  // Controle do modal de edição de perfil
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estados dos campos do Perfil do Atleta
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profileNickname, setProfileNickname] = useState(currentUser?.nickname || '');
  const [profileBirthDate, setProfileBirthDate] = useState(currentUser?.birth_date || '');
  const [profileGender, setProfileGender] = useState(currentUser?.gender || 'Masculino');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Estado da Liga Selecionada no filtro individualizado
  const [selectedLeagueFilter, setSelectedLeagueFilter] = useState('all');

  // Atualiza os campos do formulário sempre que o usuário logado mudar
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfileNickname(currentUser.nickname || '');
      setProfileBirthDate(currentUser.birth_date || '');
      setProfileGender(currentUser.gender || 'Masculino');
      setProfileAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  // FUNÇÃO AUXILIAR: CALCULAR IDADE DINAMICAMENTE
  const calculateComputedAge = (dateString) => {
    if (!dateString) return '--';
    const parts = dateString.split('/');
    if (parts.length !== 3) return '--';
    
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    const today = new Date();
    const birthDate = new Date(year, month, day);
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} anos` : '--';
  };

  // FUNÇÃO: MÁSCARA AUTOMÁTICA PARA DATA (DD/MM/AAAA)
  const handleBirthDateChange = (text) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }
    if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    setProfileBirthDate(formatted);
  };

    // FUNÇÃO EXCLUSIVA: ABRIR A CÂMERA DO CELULAR
  async function handleTakePhoto() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('capture', 'environment');
      
      input.onchange = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];

        Alert.alert('⏳ Enviando', 'Fazendo upload da foto batida pela câmera...');
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser?.id || Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error } = await supabase.storage.from('avatars').upload(filePath, file, { cacheControl: '3600', upsert: true });
        if (error) { Alert.alert('Erro no Upload', error.message); return; }

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        setProfileAvatar(publicUrl);
        Alert.alert('Sucesso!', 'Foto capturada! Clique em GRAVAR PERFIL.');
      };
      input.click();
    } catch (err) { console.log(err); }
  }

  // FUNÇÃO EXCLUSIVA: ABRIR A GALERIA DE FOTOS
  async function handlePickFromGallery() {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        const file = files[0];

        Alert.alert('⏳ Enviando', 'Fazendo upload da imagem selecionada da galeria...');
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser?.id || Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error } = await supabase.storage.from('avatars').upload(filePath, file, { cacheControl: '3600', upsert: true });
        if (error) { Alert.alert('Erro no Upload', error.message); return; }

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        setProfileAvatar(publicUrl);
        Alert.alert('Sucesso!', 'Imagem carregada da galeria! Clique em GRAVAR PERFIL.');
      };
      input.click();
    } catch (err) { console.log(err); }
  }



  // FUNÇÃO: GRAVAR ATUALIZAÇÕES DO PERFIL NO SUPABASE
  async function handleSaveProfile() {
    if (!profileName.trim() || !profileNickname.trim()) {
      Alert.alert('Atenção', 'Nome Completo e Apelido são campos obrigatórios.');
      return;
    }
    setSavingProfile(true);
    try {
      // Converte data BR (DD/MM/AAAA) para formato ISO (AAAA-MM-DD) aceito pelo banco profiles
      let isoBirthDate = null;
      if (profileBirthDate.length === 10) {
        const parts = profileBirthDate.split('/');
        isoBirthDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileName.trim(),
          nickname: profileNickname.trim(),
          birth_date: isoBirthDate,
          gender: profileGender,
          avatar_url: profileAvatar
        })
        .eq('id', currentUser?.id);

      if (error) {
        Alert.alert('Erro ao Salvar', error.message);
        return;
      }

      Alert.alert('Sucesso!', 'Perfil de atleta atualizado com sucesso!');
      setIsEditModalOpen(false);
      if (fetchDataFromSupabase) await fetchDataFromSupabase();
    } catch (err) {
      console.log(err);
    } finally {
      setSavingProfile(false);
    }
  }

  // Gera as opções da janela de seleção de ligas dinamicamente blindada contra erro undefined
  const leagueOptions = [
    { label: '🌐 Todas as Ligas (Somatório Geral)', value: 'all' },
    ...(Array.isArray(challenges) 
      ? challenges.map(c => ({ label: String(c?.title || 'Desafio'), value: String(c?.id || '') })) 
      : [])
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* SEÇÃO CARD PERFIL ATLETA */}
      <View style={styles.profileHeaderCard}>
        <Image 
          source={{ uri: profileAvatar || 'https://picsum.photos' }} 
          style={styles.profileImageAvatar} 
        />
        <View style={styles.profileMetaInfo}>
          <Text style={styles.athleteProfileName}>👋 {profileNickname || profileName || 'Atleta MuvFit'}</Text>
          <Text style={styles.athleteAgeLabel}>📅 Idade: {calculateComputedAge(profileBirthDate)}</Text>
          <Text style={styles.statusBadgeText}>⚙️ Status: <Text style={styles.statusHighlight}>Atleta Ativo</Text></Text>
          
          <TouchableOpacity style={styles.editProfileTriggerBtn} onPress={() => setIsEditModalOpen(true)}>
            <Text style={styles.editProfileTriggerBtnText}>✏️ EDITAR PERFIL</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* JANELA DE SELEÇÃO DE LIGAS (FILTRO INDIVIDUALIZADO) */}
      <View style={styles.leagueFilterSectionBox}>
        <CustomPicker
          label="🔍 Visualizar Desempenho por Liga:"
          selectedValue={selectedLeagueFilter}
          onValueChange={(val) => setSelectedLeagueFilter(val)}
          options={leagueOptions}
        />
      </View>

      {/* QUADRO DE MEDALHAS COMPACTO */}
      <View style={styles.squareMedalDisplayCard}>
        <Text style={styles.blockTitleHeader}>🥇 Quadro Geral de Medalhas</Text>
        <View style={styles.medalsBadgeInlineRow}>
          <View style={styles.medalItemCol}>
            <Text style={styles.medalBigEmoji}>🥇</Text>
            <Text style={styles.medalCounterText}>0 x Ouro</Text>
          </View>
          <View style={styles.medalItemCol}>
            <Text style={styles.medalBigEmoji}>🥈</Text>
            <Text style={styles.medalCounterText}>0 x Prata</Text>
          </View>
          <View style={styles.medalItemCol}>
            <Text style={styles.medalBigEmoji}>🥉</Text>
            <Text style={styles.medalCounterText}>0 x Bronze</Text>
          </View>
        </View>
      </View>

      {/* GRADE DE QUADRADOS INFORMATIVOS (ESTILO INSPEÇÃO REQUISITADA) */}
      <View style={styles.quadGridDataWrapperRow}>
        <View style={styles.infoSquareDataBox}>
          <Text style={styles.squareBigNumberValue}>0</Text>
          <Text style={styles.squareSubLabelLabel}>🏆 PONTOS</Text>
        </View>

        <View style={styles.infoSquareDataBox}>
          <Text style={styles.squareBigNumberValue}>0</Text>
          <Text style={styles.squareSubLabelLabel}>🏦 BANCO</Text>
        </View>

        <View style={styles.infoSquareDataBox}>
          <Text style={styles.squareBigNumberValue}>0</Text>
          <Text style={styles.squareSubLabelLabel}>🚶 PASSOS</Text>
        </View>
      </View>
      {/* MODAL WINDOW: EDITAR PERFIL DO ATLETA */}
      <Modal visible={isEditModalOpen} animationType="slide" transparent={false}>
        <View style={styles.modalFullWrapper}>
          <View style={styles.modalNavbarHeaderTop}>
            <Text style={styles.modalNavbarTitleText}>✏️ Editar Perfil do Atleta</Text>
            <TouchableOpacity style={styles.modalCloseTriggerBtn} onPress={() => setIsEditModalOpen(false)}>
              <Text style={styles.modalCloseTriggerBtnText}>Fechar ✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScrollBodyArea}>
            {/* ENTRADA DE MÍDIA DA FOTO DE PERFIL */}
            <Text style={styles.formSectionFieldLabel}>📸 Foto de Perfil:</Text>
            <View style={styles.avatarMediaRowBox}>
              <Image 
                source={{ uri: profileAvatar || 'https://picsum.photos' }} 
                style={styles.modalPreviewAvatarImage} 
              />
                                      <View style={styles.mediaSourceActionsColumn}>
                <TouchableOpacity style={styles.mediaActionBtn} onPress={handleTakePhoto}>
                  <Text style={styles.mediaActionBtnText}>📷 Tirar Foto / Câmera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.mediaActionBtn, { backgroundColor: '#475569' }]} onPress={handlePickFromGallery}>
                  <Text style={styles.mediaActionBtnText}>🖼️ Abrir da Galeria</Text>
                </TouchableOpacity>
              </View>

            </View>

            {/* FORMULÁRIO DE ENTRADAS DE TEXTO */}
            <Text style={styles.formSectionFieldLabel}>Nome Completo:</Text>
            <TextInput
              style={styles.formTextInputField}
              value={profileName}
              onChangeText={setProfileName}
              placeholder="Digite seu nome completo"
            />

            <Text style={styles.formSectionFieldLabel}>Apelido (Exibido nas listagens/ranking):</Text>
            <TextInput
              style={styles.formTextInputField}
              value={profileNickname}
              onChangeText={setProfileNickname}
              placeholder="Como quer ser chamado no app"
            />

            <Text style={styles.formSectionFieldLabel}>Data de Nascimento:</Text>
            <TextInput
              style={styles.formTextInputField}
              value={profileBirthDate}
              onChangeText={handleBirthDateChange}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
            />

            <Text style={styles.formSectionFieldLabel}>Gênero / Sexo:</Text>
            <View style={styles.genderSelectionFlexRow}>
              <TouchableOpacity
                style={[styles.genderChoiceChip, profileGender === 'Masculino' && styles.genderChoiceChipActive]}
                onPress={() => setProfileGender('Masculino')}
              >
                <Text style={[styles.genderChoiceChipText, profileGender === 'Masculino' && styles.genderChoiceChipTextActive]}>Masculino</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.genderChoiceChip, profileGender === 'Feminino' && styles.genderChoiceChipActive]}
                onPress={() => setProfileGender('Feminino')}
              >
                <Text style={[styles.genderChoiceChipText, profileGender === 'Feminino' && styles.genderChoiceChipTextActive]}>Feminino</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.profileSubmitActionBtn} 
              onPress={handleSaveProfile}
              disabled={savingProfile}
            >
              <Text style={styles.profileSubmitActionBtnText}>
                {savingProfile ? 'A GUARDAR DADOS...' : 'GRAVAR PERFIL'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc', paddingBottom: 100 },
  profileHeaderCard: { flexDirection: 'row', backgroundColor: '#1e3a8a', padding: 16, borderRadius: 12, marginBottom: 16, alignItems: 'center', gap: 14 },
  profileImageAvatar: { width: 75, height: 75, borderRadius: 38, backgroundColor: '#cbd5e1', borderWidth: 2, borderColor: '#f97316' },
  profileMetaInfo: { flex: 1, gap: 3 },
  athleteProfileName: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  athleteAgeLabel: { color: '#e2e8f0', fontSize: 12 },
  statusBadgeText: { color: '#ffffff', fontSize: 12 },
  statusHighlight: { color: '#22c55e', fontWeight: 'bold' },
  editProfileTriggerBtn: { backgroundColor: '#f97316', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
  editProfileTriggerBtnText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  leagueFilterSectionBox: { backgroundColor: '#ffffff', borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', padding: 4, marginBottom: 16 },
  squareMedalDisplayCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16, alignItems: 'center' },
  blockTitleHeader: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 12, alignSelf: 'flex-start' },
  medalsBadgeInlineRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 12 },
  medalItemCol: { alignItems: 'center', gap: 4 },
  medalBigEmoji: { fontSize: 26 },
  medalCounterText: { fontSize: 12, fontWeight: 'bold', color: '#334155' },
  quadGridDataWrapperRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 4, marginBottom: 16 },
  infoSquareDataBox: { flex: 1, backgroundColor: '#ffffff', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  squareBigNumberValue: { fontSize: 22, fontWeight: 'bold', color: '#f97316', marginBottom: 2 },
  squareSubLabelLabel: { fontSize: 10, fontWeight: 'bold', color: '#1e3a8a', textAlign: 'center' },
  sectionCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 8 },
  critText: { fontSize: 12, color: '#475569', marginBottom: 3 },
  rowJustify: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addGoalBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  addGoalText: { color: '#ffffff', fontSize: 11, fontWeight: 'bold' },
  emptyText: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
  goalItem: { fontSize: 12, color: '#334155', marginBottom: 3 },

  // Estilos da Janela Modal de Perfil
  modalFullWrapper: { flex: 1, backgroundColor: '#ffffff' },
  modalNavbarHeaderTop: { padding: 16, backgroundColor: '#1e3a8a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalNavbarTitleText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  modalCloseTriggerBtn: { backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  modalCloseTriggerBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  modalScrollBodyArea: { padding: 16, gap: 12 },
  formSectionFieldLabel: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 2 },
  formTextInputField: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 12, height: 42, fontSize: 14, color: '#0f172a', marginBottom: 4 },
  avatarMediaRowBox: { flexDirection: 'row', gap: 16, alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 4 },
  modalPreviewAvatarImage: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#cbd5e1' },
  mediaSourceActionsColumn: { flex: 1, gap: 8 },
  mediaActionBtn: { backgroundColor: '#f97316', paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  mediaActionBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  genderSelectionFlexRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  genderChoiceChip: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center', backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  genderChoiceChipActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  genderChoiceChipText: { color: '#475569', fontWeight: 'bold', fontSize: 13 },
  genderChoiceChipTextActive: { color: '#ffffff' },
  profileSubmitActionBtn: { backgroundColor: '#16a34a', paddingVertical: 14, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  profileSubmitActionBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 }
});
