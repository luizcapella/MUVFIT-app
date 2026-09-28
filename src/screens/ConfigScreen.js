// src/screens/ConfigScreen.js (Parte 1 de 2)
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function ConfigScreen({ currentUser, fetchDataFromSupabase }) {
  // Controle de abas expansíveis / colapsáveis
  const [isAccountOpen, setIsAccountOpen] = useState(true);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Estados dos formulários de Configuração
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [password, setPassword] = useState('');
  const [savingAccount, setSavingAccount] = useState(false);

  // Estados de Preferências
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLargeFont, setIsLargeFont] = useState(false);

  // Estados de Suporte
  const [feedbackText, setFeedbackText] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);

  // FUNÇÃO: SALVAR DADOS DA CONTA
  async function handleSaveAccountData() {
    if (!fullName.trim() || !nickname.trim()) {
      Alert.alert('Atenção', 'Nome e Apelido não podem ficar vazios.');
      return;
    }
    setSavingAccount(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          nickname: nickname.trim()
        })
        .eq('id', currentUser?.id);

      if (error) {
        Alert.alert('Erro', 'Não foi possível atualizar os dados.');
        return;
      }

      // Se digitou uma nova senha, atualiza no Auth do Supabase
      if (password.trim()) {
        if (password.length < 6) {
          Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres.');
          setSavingAccount(false);
          return;
        }
        const { error: authError } = await supabase.auth.updateUser({ password: password.trim() });
        if (authError) {
          Alert.alert('Erro', 'Dados salvos, mas não foi possível alterar a senha.');
          return;
        }
        setPassword('');
      }

      Alert.alert('Sucesso!', 'Configurações de conta atualizadas!');
      if (fetchDataFromSupabase) await fetchDataFromSupabase();
    } catch (err) {
      console.log(err);
    } finally {
      setSavingAccount(false);
    }
  }

  // FUNÇÃO: ENVIAR FEEDBACK / AJUDA
  async function handleSendFeedback() {
    if (!feedbackText.trim()) {
      Alert.alert('Atenção', 'Por favor, digite sua mensagem ou sugestão.');
      return;
    }
    setSendingFeedback(true);
    try {
      // Envia uma sugestão/suporte para auditoria técnica do app
      const { error } = await supabase.from('app_feedbacks').insert([
        {
          user_id: currentUser?.id,
          message: feedbackText.trim(),
          created_at: new Date().toISOString()
        }
      ]);

      if (error) {
        Alert.alert('Erro', 'Falha ao enviar mensagem.');
        return;
      }

      Alert.alert('Obrigado!', 'Sua mensagem foi enviada com sucesso para a nossa equipe técnica.');
      setFeedbackText('');
    } catch (err) {
      console.log(err);
    } finally {
      setSendingFeedback(false);
    }
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>⚙️ Configurações Gerais</Text>

      {/* ABA: MINHA CONTA */}
      <TouchableOpacity 
        style={styles.accordionHeader} 
        onPress={() => setIsAccountOpen(!isAccountOpen)}
      >
        <Text style={styles.accordionTitle}>👤 Minha Conta</Text>
        <Text style={styles.accordionArrow}>{isAccountOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isAccountOpen && (
        <View style={styles.accordionContent}>
          <Text style={styles.label}>Nome Completo:</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Seu nome completo"
          />

          <Text style={styles.label}>Apelido (como aparece na liga):</Text>
          <TextInput
            style={styles.input}
            value={nickname}
            onChangeText={setNickname}
            placeholder="Seu apelido"
          />

          <Text style={styles.label}>Alterar Palavra-passe (mínimo 6 dígitos):</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Digite a nova senha se desejar mudar"
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.saveBtn} 
            onPress={handleSaveAccountData}
            disabled={savingAccount}
          >
            <Text style={styles.saveBtnText}>
              {savingAccount ? 'A guardar...' : 'SALVAR ALTERAÇÕES'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ABA: ACESSIBILIDADE E PREFERÊNCIAS */}
      <TouchableOpacity 
        style={styles.accordionHeader} 
        onPress={() => setIsPreferencesOpen(!isPreferencesOpen)}
      >
        <Text style={styles.accordionTitle}>👁️ Acessibilidade & Preferências</Text>
        <Text style={styles.accordionArrow}>{isPreferencesOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isPreferencesOpen && (
        <View style={styles.accordionContent}>
          <View style={styles.switchRow}>
            <View style={styles.switchMeta}>
              <Text style={styles.switchLabel}>Modo de Alto Contraste</Text>
              <Text style={styles.switchSub}>Melhora a leitura para ambientes claros</Text>
            </View>
            <Switch
              value={isHighContrast}
              onValueChange={setIsHighContrast}
              trackColor={{ false: '#cbd5e1', true: '#f97316' }}
              thumbColor={isHighContrast ? '#ffffff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchMeta}>
              <Text style={styles.switchLabel}>Aumentar Tamanho da Fonte</Text>
              <Text style={styles.switchSub}>Aplica textos maiores em todo o aplicativo</Text>
            </View>
            <Switch
              value={isLargeFont}
              onValueChange={setIsLargeFont}
              trackColor={{ false: '#cbd5e1', true: '#f97316' }}
              thumbColor={isLargeFont ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>
      )}

      {/* ABA: SUPORTE E FEEDBACK */}
      <TouchableOpacity 
        style={styles.accordionHeader} 
        onPress={() => setIsSupportOpen(!isSupportOpen)}
      >
        <Text style={styles.accordionTitle}>💬 Suporte & Sugestões</Text>
        <Text style={styles.accordionArrow}>{isSupportOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isSupportOpen && (
        <View style={styles.accordionContent}>
          <Text style={styles.label}>Envie uma sugestão ou reporte um problema técnico:</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={feedbackText}
            onChangeText={setFeedbackText}
            placeholder="Escreva aqui sua mensagem para a nossa equipe técnica..."
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: '#1e3a8a' }]} 
            onPress={handleSendFeedback}
            disabled={sendingFeedback}
          >
            <Text style={styles.saveBtnText}>
              {sendingFeedback ? 'A enviar...' : 'ENVIAR PARA O SUPORTE'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc', paddingBottom: 100 },
  pageTitle: { fontSize: 20, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 16 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e2e8f0', padding: 12, borderRadius: 8, marginTop: 12 },
  accordionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  accordionArrow: { fontSize: 12, color: '#475569' },
  accordionContent: { backgroundColor: '#ffffff', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, padding: 14, borderWidth: 1, borderColor: '#e2e8f0', borderTopWidth: 0, gap: 10 },
  label: { fontSize: 13, fontWeight: 'bold', color: '#475569', marginBottom: 2, marginTop: 4 },
  input: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 10, height: 42, fontSize: 14, color: '#0f172a' },
  textArea: { height: 90, textAlignVertical: 'top', paddingVertical: 8 },
  saveBtn: { backgroundColor: '#f97316', paddingVertical: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  switchMeta: { flex: 1, paddingRight: 10 },
  switchLabel: { fontSize: 13, fontWeight: 'bold', color: '#334155' },
  switchSub: { fontSize: 11, color: '#64748b', marginTop: 2 }
});
