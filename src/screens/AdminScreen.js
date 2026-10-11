// src/screens/AdminScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Modal, TextInput } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function AdminScreen({ pendingWorkouts, setPendingWorkouts, fetchDataFromSupabase, challenges, currentUser, profilesData, selectedLeagueFilter }) {
  
  // 1. ESTADOS PARA CONTROLE VISUAL DA SANFONA E REQUISITOS
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [leagueRequests, setLeagueRequests] = useState([]);
  const [challengeRequests, setChallengeRequests] = useState([]);
  const [leagueMembers, setLeagueMembers] = useState([]);
  const [profiles, setProfiles] = useState([]);
    // ⚙️ Estado para controlar a abertura da janela de regras da liga
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    // 📂 Estados de controle para o retângulo expansível de regras
  const [isRulesDropdownOpen, setIsRulesDropdownOpen] = useState(false);
  const [selectedRuleTab, setSelectedRuleTab] = useState('Base da Liga');
  // 📂 MEMÓRIA LOCAL: Configurações da Base da Liga
  const [leagueDuration, setLeagueDuration] = useState('SEMANAL'); // SEMANAL, MENSAL, ANUAL
  const [dailyPointsEnabled, setDailyPointsEnabled] = useState(false);
  const [dailyPointsMax, setDailyPointsMax] = useState('');
  
  // 🪨 BÔNUS: O Inquebrável
  const [bonusInquebravelEnabled, setBonusInquebravelEnabled] = useState(false);
  const [bonusInquebravelDays, setBonusInquebravelDays] = useState('');
  const [bonusInquebravelPoints, setBonusInquebravelPoints] = useState('');
  
  // ⏰ BÔNUS: O Desperta
  const [bonusDespertaEnabled, setBonusDespertaEnabled] = useState(false);
  const [bonusDespertaHour, setBonusDespertaHour] = useState('05');
  const [bonusDespertaMin, setBonusDespertaMin] = useState('00');
  const [bonusDespertaPoints, setBonusDespertaPoints] = useState('');
  
  // 📝 MURAL DE INSTRUÇÕES
  const [muralText, setMuralText] = useState('');

  // 2. FUNÇÃO EFEITO: CARREGA AS SOLICITAÇÕES DA LIGA DO ADMIN EM TEMPO REAL
  useEffect(() => {
    if (currentUser?.is_admin || currentUser?.isAdmin) {
      loadManagementData();
    }
  }, [challenges, currentUser]);

    async function loadManagementData() {
    // ITEM 4: Captura dinamicamente o ID da liga ativa no dropdown do topo
    const currentLeagueId = challenges?.find(c => c.name === selectedLeagueFilter || c.id === selectedLeagueFilter)?.id;
    if (!currentLeagueId) return;

    try {
      const { data: profsData } = await supabase.from('profiles').select('*');
      if (profsData) setProfiles(profsData);

      // ITEM 4: Busca solicitações de entrada filtradas estritamente por esta liga
      const { data: reqData } = await supabase
        .from('league_memberships')
        .select('*')
        .eq('status', 'Aguardando Aprovação do Admin')
        .eq('league_id', currentLeagueId);
      if (reqData) setLeagueRequests(reqData);

      // ITEM 4: Busca solicitações de atletas ativos filtradas estritamente por esta liga
      const { data: chalData } = await supabase
        .from('challenge_applications')
        .select('*')
        .eq('status', 'Pendente')
        .eq('league_id', currentLeagueId);
      if (chalData) setChallengeRequests(chalData);

      // ITEM 4: Busca a lista de membros já aprovados filtrados estritamente por esta liga
      const { data: memData } = await supabase
        .from('league_memberships')
        .select('*')
        .in('status', ['TELESPECTADOR', 'ATLETA PENDENTE', 'ATLETA ATIVO'])
        .eq('league_id', currentLeagueId);
      if (memData) setLeagueMembers(memData);

    } catch (err) {
      console.log('Erro ao carregar dados de gerência por liga:', err);
    }
  }

  // ITEM 3: Função para remover permanentemente um membro da liga com trava de segurança anti auto-remoção
  async function handleRemoveMember(memberUserId, membershipId) {
    if (memberUserId === currentUser?.id) {
      alert("Você não pode remover a si mesmo! ❌");
      return;
    }

    const confirmDelete = window.confirm("Tem certeza que deseja remover este membro permanentemente da Liga?");
    if (!confirmDelete) return;

    try {
      // Remove da tabela de vinculação de membros
      const { error: memError } = await supabase
        .from('league_memberships')
        .delete()
        .eq('id', membershipId);

      if (memError) throw memError;

      // Limpa também qualquer solicitação de desafio pendente vinculada ao usuário
      await supabase
        .from('challenge_applications')
        .delete()
        .eq('user_id', memberUserId);

      alert("Membro removido da liga com sucesso! 👤❌");
      await loadManagementData();
    } catch (err) {
      alert("Erro ao remover membro: " + err.message);
    }
  }

  // 3. DECISÃO: ADMINISTRADOR ACEITA OU REJEITA MEMBRO NA LIGA (Aba A)
  async function handleLeagueDecision(requestId, userId, leagueId, accept) {
    try {
      if (accept) {
        const { error } = await supabase
          .from('league_memberships')
          .update({ status: 'TELESPECTADOR' })
          .eq('id', requestId);

        if (error) throw error;
        alert('Usuário aceito como TELESPECTADOR 👀 com sucesso!');
      } else {
        const { error } = await supabase
          .from('league_memberships')
          .delete()
          .eq('id', requestId);

        if (error) throw error;
        alert('Solicitação de entrada na liga recusada.');
      }
      await loadManagementData();
      if (fetchDataFromSupabase) await fetchDataFromSupabase();
    } catch (err) {
      alert('Erro ao processar decisão da liga: ' + err.message);
    }
  }

  // 4. DECISÃO: ADMINISTRADOR ACEITA OU RECUSA ATLETA NO DESAFIO (Aba B)
  async function handleChallengeDecision(applicationId, userId, leagueId, accept) {
    try {
      if (accept) {
        await supabase.from('challenge_applications').update({ status: 'Aceito' }).eq('id', applicationId);
        await supabase.from('league_memberships').update({ status: 'ATLETA ATIVO' }).eq('league_id', leagueId).eq('user_id', userId);
        alert('Atleta aprovado com sucesso! Agora ele é um ATLETA ATIVO ⚡');
      } else {
        await supabase.from('challenge_applications').update({ status: 'Recusado' }).eq('id', applicationId);
        await supabase.from('league_memberships').update({ status: 'TELESPECTADOR' }).eq('league_id', leagueId).eq('user_id', userId);
        alert('Inscrição no desafio recusada.');
      }
      await loadManagementData();
      if (fetchDataFromSupabase) await fetchDataFromSupabase();
    } catch (err) {
      alert('Erro ao processar decisão do desafio: ' + err.message);
    }
  }

  // 5. FUNÇÃO ORIGINAL MANTIDA: MODERAÇÃO DE TREINOS FISICAIS
  async function handleModerateWorkout(workoutId, newStatus) {
    try {
      const { error } = await supabase
        .from('pending_workouts')
        .update({ status: newStatus })
        .eq('id', workoutId);

      if (error) {
        alert('Erro ao atualizar status do treino.');
        return;
      }

      alert(newStatus === 'approved' ? 'Treino aprovado com sucesso! 🎉' : 'Treino rejeitado.');
      if (setPendingWorkouts) {
        setPendingWorkouts(prev => prev.filter(w => w.id !== workoutId));
      }
      if (fetchDataFromSupabase) await fetchDataFromSupabase();
    } catch (err) {
      console.log(err);
    }
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      
     
      {/* 2º SEÇÃO MANTIDA INTEGRALMENTE: PAINEL DE MODERAÇÃO ADMINISTRATIVA */}
      <Text style={styles.pageTitle}>🛡️ Painel de Moderação Administrativa</Text>
      <Text style={styles.pageSubtitle}>Fiscalize as evidências de imagem para liberar a pontuação oficial.</Text>
      {/* ⚙️ BOTÃO MESTRE: EDITAR/DEFINIR REGRAS DA LIGA/DESAFIO DA LIGA */}
      <TouchableOpacity
        onPress={() => setIsRulesModalOpen(true)}
        style={{
          backgroundColor: '#EBF1FA',
          borderRadius: 8,
          paddingVertical: 14,
          paddingHorizontal: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          borderWidth: 1,
          borderColor: '#D0E0F5'
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, marginRight: 10 }}>⚙️</Text>
          <Text style={{ fontSize: 14, color: '#1E3A8A', fontWeight: '600' }}>
            EDITAR/DEFINIR REGRAS DA LIGA/DESAFIO DA LIGA
          </Text>
        </View>
        <Text style={{ fontSize: 14, color: '#1E3A8A', fontWeight: 'bold' }}>➔</Text>
      </TouchableOpacity>

      {pendingWorkouts.length === 0 ? (
        <Text style={styles.emptyText}>Não há treinos aguardando validação no momento. Bom descanso!</Text>
      ) : (
        pendingWorkouts.map((workout) => {
          const userProfile = profiles?.find(p => p.id === workout.user_id);
          return (
            <View key={workout.id} style={styles.adminCard}>
              <View style={styles.workoutHeader}>
                <Text style={styles.userLabel}>Atleta ID:</Text>
                <Text style={styles.userValue}>
                  {userProfile?.nickname || workout.user_id.substring(0, 8)}...
                </Text>
              </View>

              <Text style={styles.workoutInfo}><Text style={styles.boldText}>Atividade:</Text> {workout.activity}</Text>
              <Text style={styles.workoutInfo}>
                <Text style={styles.boldText}>Distância:</Text> {workout.km_distance} Km / <Text style={styles.boldText}>Tempo:</Text> {workout.time_spent ? `${workout.time_spent} min` : 'N/A'}
              </Text>

              <Text style={styles.labelMandatory}>📸 EVIDÊNCIA DA FOTO OBRIGATÓRIA:</Text>
              {workout.evidence_image_url ? (
                <Image source={{ uri: workout.evidence_image_url }} style={styles.evidenceImage} resizeMode="cover" />
              ) : (
                <Text style={styles.alertText}>⚠️ Treino enviado sem foto de evidência!</Text>
              )}

              <Text style={styles.pointsEarned}><Text style={styles.boldText}>🔥 Pontos:</Text> {workout.points_computed || 0} pts</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.btn, styles.btnRejectOld]} onPress={() => handleModerateWorkout(workout.id, 'rejected')}>
                  <Text style={styles.btnText}>❌ Rejeitar Treino</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, styles.btnApproveOld]} onPress={() => handleModerateWorkout(workout.id, 'approved')}>
                  <Text style={styles.btnText}>✅  Treino</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

   {/* 1º NOVA ABA COLAPSÁVEL: GERENCIAMENTO DA LIGA/DESAFIO DA LIGA */}
      <TouchableOpacity 
        style={styles.accordionHeader} 
        onPress={() => setIsManagementOpen(!isManagementOpen)}
      >
        <Text style={styles.accordionTitle}>⚙️ Gerenciamento da Liga/Desafio da Liga</Text>
        <Text style={styles.accordionArrow}>{isManagementOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isManagementOpen && (
        <View style={styles.accordionContent}>
          
          {/* a. Solicitação de Entradas de Novos Membros na Liga */}
          <Text style={styles.subSectionTitle}>📩 Solicitação de Entradas de Novos Membros na Liga:</Text>
          {leagueRequests.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma solicitação de entrada na liga pendente.</Text>
          ) : (
            leagueRequests.map((req) => {
              const prof = profiles?.find(p => p.id === req.user_id);
              return (
                <View key={req.id} style={styles.requestRow}>
                  <View style={styles.userInfo}>
                    <Image 
                      source={{ uri: prof?.avatar_url || 'https://placeholder.com' }} 
                      style={styles.userAvatar} 
                    />
                    <Text style={styles.userNickname}>{prof?.nickname || 'Atleta Anônimo'}</Text>
                  </View>
                  <View style={styles.btnRow}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.btnAccept]} 
                      onPress={() => handleLeagueDecision(req.id, req.user_id, req.league_id, true)}
                    >
                      <Text style={styles.btnText}>ACEITAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.btnReject]} 
                      onPress={() => handleLeagueDecision(req.id, req.user_id, req.league_id, false)}
                    >
                      <Text style={styles.btnText}>REJEITAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

                   {/* b. Solicitação Para Atletas Ativos */}
          <Text style={[styles.subSectionTitle, { marginTop: 14 }]}>⚡ Solicitação Para Atletas Ativos:</Text>
          {challengeRequests.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma solicitação de inscrição no desafio pendente.</Text>
          ) : (
            challengeRequests.map(function(req) {
              var prof = profiles ? profiles.find(function(p) { return p.id === req.user_id; }) : null;
              return (
                <View key={req.id} style={styles.requestRow}>
                  <View style={styles.userInfo}>
                    <Image 
                      source={{ uri: (prof && prof.avatar_url) ? prof.avatar_url : 'https://placeholder.com' }} 
                      style={styles.userAvatar} 
                    />
                    <Text style={styles.userNickname}>{(prof && prof.nickname) ? prof.nickname : 'Atleta Anônimo'}</Text>
                  </View>

                  <View style={styles.btnRow}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.btnAccept]} 
                      onPress={() => handleChallengeDecision(req.id, req.user_id, req.league_id, true)}
                    >
                      <Text style={styles.btnText}>ACEITAR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.btnReject]} 
                      onPress={() => handleChallengeDecision(req.id, req.user_id, req.league_id, false)}
                    >
                      <Text style={styles.btnText}>RECUSAR</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* c. Membros */}
          <Text style={[styles.subSectionTitle, { marginTop: 14 }]}>👥 Membros:</Text>
          {leagueMembers.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum membro aprovado nesta liga ainda.</Text>
          ) : (
            leagueMembers.map((member) => {
              const userProf = profiles?.find(p => p.id === member.user_id);
              return (
                              <View key={member.id} style={styles.memberRow}>
                <View style={styles.userInfo}>
                  <Image 
                    source={{ uri: userProf?.avatar_url || 'https://placeholder.com' }} 
                    style={styles.userAvatar} 
                  />
                  <Text style={styles.userNickname}>{userProf?.nickname || 'Atleta Anônimo'}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.memberStatusTag}>{member.status}</Text>
                  
                  {/* ITEM 3: Botão Remover Seguro com Trava Anti Auto-Remoção */}
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#EF4444', marginLeft: 8, paddingHorizontal: 10, paddingVertical: 6 }]} 
                    onPress={() => handleRemoveMember(member.user_id, member.id)}
                  >
                    <Text style={[styles.btnText, { fontSize: 11 }]}>REMOVER</Text>
                  </TouchableOpacity>
                </View>
              </View>
              );
            })
          )}

        </View>
      )}

        {/* ⚙️ WINDOW MODAL: DEFINIÇÃO DE REGRAS DA LIGA / BASE DA LIGA */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isRulesModalOpen}
        onRequestClose={() => setIsRulesModalOpen(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <View style={{ backgroundColor: '#FFFFFF', width: '100%', height: '90%', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5 }}>
            
            {/* 🔝 CABEÇALHO DO MODAL */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1E3A8A' }}>
                ⚙️ REGRAS DA LIGA / BASE DA LIGA
              </Text>
              <TouchableOpacity 
                onPress={() => setIsRulesModalOpen(false)}
                style={{ backgroundColor: '#EF4444', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' }}>Fechar</Text>
              </TouchableOpacity>
            </View>

                       {/* 📜 CONTEÚDO ROLÁVEL COM RETÂNGULO EXPANSÍVEL */}
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
              
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Selecione o Item para Configurar:
              </Text>

              {/* 📦 RETÂNGULO MESTRE UNIFICADO */}
              <View style={{ borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
                
                              {/* 🔝 TOPO FIXO DINÂMICO: EXIBE O ITEM SELECIONADO ATUAL */}
                <TouchableOpacity
                  onPress={() => setIsRulesDropdownOpen(!isRulesDropdownOpen)}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#F8FAFC', borderBottomWidth: isRulesDropdownOpen ? 1 : 0, borderColor: '#E2E8F0' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 16, marginRight: 10 }}>
                      {selectedRuleTab === 'Base da Liga' ? '📂' :
                       selectedRuleTab === 'Musculação' ? '💪' :
                       selectedRuleTab === 'Crossfit' ? '🏋️' :
                       selectedRuleTab === 'Aeróbico' ? '🔥' :
                       selectedRuleTab === 'Corrida' ? '🏃' :
                       selectedRuleTab === 'Caminhada' ? '🚶' :
                       selectedRuleTab === 'Bike' ? '🚴' :
                       selectedRuleTab === 'Lutas' ? '🥋' :
                       selectedRuleTab === 'Esportes Coletivos' ? '⚽' : '👣'}
                    </Text>
                    <Text style={{ fontSize: 14, color: '#1E3A8A', fontWeight: '700' }}>
                      {selectedRuleTab === 'Base da Liga' ? 'Base da Liga' :
                       selectedRuleTab === 'Crossfit' ? 'Crossfit / Funcional' :
                       selectedRuleTab === 'Lutas' ? 'Lutas / Esportes Individuais' : selectedRuleTab}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, color: '#64748B', transform: [{ rotate: isRulesDropdownOpen ? '90deg' : '0deg' }] }}>➔</Text>
                </TouchableOpacity>

                {/* 🔽 LISTA EXPANSÍVEL: RENDERIZA AS OUTRAS 9 OPÇÕES QUANDO ABERTO */}
                {isRulesDropdownOpen && (
                  <View style={{ backgroundColor: '#FFFFFF' }}>
                    {[
                      { id: 'Base da Liga', label: '📂 Base da Liga' },
                      { id: 'Musculação', label: '💪 Musculação' },
                      { id: 'Crossfit', label: '🏋️ Crossfit / Funcional' },
                      { id: 'Aeróbico', label: '🔥 Aeróbico' },
                      { id: 'Corrida', label: '🏃 Corrida' },
                      { id: 'Caminhada', label: '🚶 Caminhada' },
                      { id: 'Bike', label: '🚴 Bike' },
                      { id: 'Lutas', label: '🥋 Lutas / Esportes Individuais' },
                      { id: 'Esportes Coletivos', label: '⚽ Esportes Coletivos' },
                      { id: 'Passos Diários', label: '👣 Passos Diários' }
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          setSelectedRuleTab(item.id);
                          setIsRulesDropdownOpen(false); // Fecha o menu ao escolher
                        }}
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: selectedRuleTab === item.id ? '#F0F5FF' : '#FFFFFF' }}
                      >
                        <Text style={{ fontSize: 14, color: '#334155', fontWeight: selectedRuleTab === item.id ? '600' : '400' }}>
                          {item.label}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#94A3B8' }}>➔</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* 🖥️ CONTAINER DE RENDERIZAÇÃO DINÂMICA */}
              <View style={{ marginTop: 20, paddingHorizontal: 4 }}>
                <Text style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', marginTop: 10 }}>
                  Item selecionado atual: {selectedRuleTab === 'Base da Liga' ? '📂 Base da Liga' : selectedRuleTab}
                </Text>
                               {/* 📂 INTERFACE DINÂMICA: CAMPOS DA BASE DA LIGA */}
                {selectedRuleTab === 'Base da Liga' && (
                  <View style={{ marginTop: 16, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    
                    {/* 1. DETERMINAR PERÍODO DE DURAÇÃO */}
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E3A8A', marginBottom: 8, textTransform: 'uppercase' }}>
                      1. Período de Duração do Desafio:
                    </Text>
                    <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1', padding: 4, marginBottom: 12 }}>
                      {['SEMANAL', 'MENSAL', 'ANUAL'].map((periodo) => (
                        <TouchableOpacity
                          key={periodo}
                          onPress={() => setLeagueDuration(periodo)}
                          style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 4, backgroundColor: leagueDuration === periodo ? '#1E3A8A' : 'transparent' }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '700', color: leagueDuration === periodo ? '#FFFFFF' : '#64748B' }}>
                            {periodo}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* TEXTO EXPLICATIVO DO PERÍODO SELECIONADO */}
                    <View style={{ backgroundColor: '#EFF6FF', padding: 10, borderRadius: 6, marginBottom: 20, borderWidth: 0.5, borderColor: '#BFDBFE' }}>
                      <Text style={{ fontSize: 11, color: '#1E40AF', lineHeight: 16 }}>
                        {leagueDuration === 'SEMANAL' && "🔹 REGRA: Termina sempre no próximo sábado às 23:59:00, independente do dia que foi criado. O pódio vai para o Feed e os pontos zeram no domingo às 00:00:00, reabrindo a inscrição para a próxima semana."}
                        {leagueDuration === 'MENSAL' && "🔹 REGRA: Termina sempre no último dia do mês corrente às 23:59:00. O pódio vai para o Feed e os pontos zeram no dia 1º do próximo mês às 00:00:00, reabrindo a inscrição."}
                        {leagueDuration === 'ANUAL' && "🔹 REGRA: Termina sempre no dia 31 de Dezembro às 23:59:00 do ano vigente. O pódio vai para o Feed e os pontos zeram no dia 1º de Janeiro às 00:00:00, reabrindo a inscrição."}
                      </Text>
                    </View>

                    {/* 2. LIMITES E RECOMPENSAS (BASE DA LIGA) */}
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E3A8A', marginBottom: 12, textTransform: 'uppercase' }}>
                      2. Limites e Bônus da Liga:
                    </Text>

                    {/* A. TETO DE PONTOS DIÁRIO */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <TouchableOpacity
                          onPress={() => setDailyPointsEnabled(!dailyPointsEnabled)}
                          style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: '#1E3A8A', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: dailyPointsEnabled ? '#1E3A8A' : 'transparent' }}
                        >
                          {dailyPointsEnabled && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
                        </TouchableOpacity>
                        <Text style={{ fontSize: 13, color: '#334155', marginLeft: 8, fontWeight: '600' }}>Teto de Pontos Diário</Text>
                      </View>
                      {dailyPointsEnabled && (
                        <TextInput
                          value={dailyPointsMax}
                          onChangeText={setDailyPointsMax}
                          placeholder="Ex: 15000"
                          keyboardType="numeric"
                          style={{ width: 90, height: 34, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 8, fontSize: 13, color: '#334155', textAlign: 'center', backgroundColor: '#F8FAFC' }}
                        />
                      )}
                    </View>

                    {/* B. BÔNUS: O INQUEBRÁVEL */}
                    <View style={{ marginBottom: 16, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: bonusInquebravelEnabled ? 10 : 0 }}>
                        <TouchableOpacity
                          onPress={() => setBonusInquebravelEnabled(!bonusInquebravelEnabled)}
                          style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: '#1E3A8A', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: bonusInquebravelEnabled ? '#1E3A8A' : 'transparent' }}
                        >
                          {bonusInquebravelEnabled && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
                        </TouchableOpacity>
                        <Text style={{ fontSize: 13, color: '#334155', marginLeft: 8, fontWeight: '600' }}>🪨 O Inquebrável (Dias Consecutivos)</Text>
                      </View>
                      {bonusInquebravelEnabled && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <TextInput
                            value={bonusInquebravelDays}
                            onChangeText={setBonusInquebravelDays}
                            placeholder="Qtd Dias (X)"
                            keyboardType="numeric"
                            style={{ flex: 0.48, height: 34, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 8, fontSize: 12, color: '#334155', textAlign: 'center' }}
                          />
                          <TextInput
                            value={bonusInquebravelPoints}
                            onChangeText={setBonusInquebravelPoints}
                            placeholder="Pontos (Z)"
                            keyboardType="numeric"
                            style={{ flex: 0.48, height: 34, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 8, fontSize: 12, color: '#334155', textAlign: 'center' }}
                          />
                        </View>
                      )}
                    </View>
                    {/* C. BÔNUS: O DESPERTA */}
                    <View style={{ marginBottom: 16, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: bonusDespertaEnabled ? 12 : 0 }}>
                        <TouchableOpacity
                          onPress={() => setBonusDespertaEnabled(!bonusDespertaEnabled)}
                          style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: '#1E3A8A', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: bonusDespertaEnabled ? '#1E3A8A' : 'transparent' }}
                        >
                          {bonusDespertaEnabled && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
                        </TouchableOpacity>
                        <Text style={{ fontSize: 13, color: '#334155', marginLeft: 8, fontWeight: '600' }}>⏰ O Desperta (Treino Matinal)</Text>
                      </View>
                      {bonusDespertaEnabled && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          
                          {/* SELETOR DE HORÁRIO EM PEQUENOS QUADRADOS COM SETAS */}
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 0.5 }}>
                            {/* Bloco Hora */}
                            <View style={{ alignItems: 'center' }}>
                              <TouchableOpacity onPress={() => setBonusDespertaHour(prev => String(Math.min(23, Number(prev) + 1)).padStart(2, '0'))} style={{ padding: 2 }}><Text style={{ fontSize: 10, color: '#1E3A8A' }}>▲</Text></TouchableOpacity>
                              <View style={{ width: 34, height: 28, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>{bonusDespertaHour}</Text>
                              </View>
                              <TouchableOpacity onPress={() => setBonusDespertaHour(prev => String(Math.max(0, Number(prev) - 1)).padStart(2, '0'))} style={{ padding: 2 }}><Text style={{ fontSize: 10, color: '#1E3A8A' }}>▼</Text></TouchableOpacity>
                            </View>
                            
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#64748B', marginHorizontal: 6 }}>:</Text>
                            
                            {/* Bloco Minuto */}
                            <View style={{ alignItems: 'center' }}>
                              <TouchableOpacity onPress={() => setBonusDespertaMin(prev => String(Math.min(59, Number(prev) + 5)).padStart(2, '0'))} style={{ padding: 2 }}><Text style={{ fontSize: 10, color: '#1E3A8A' }}>▲</Text></TouchableOpacity>
                              <View style={{ width: 34, height: 28, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>{bonusDespertaMin}</Text>
                              </View>
                              <TouchableOpacity onPress={() => setBonusDespertaMin(prev => String(Math.max(0, Number(prev) - 5)).padStart(2, '0'))} style={{ padding: 2 }}><Text style={{ fontSize: 10, color: '#1E3A8A' }}>▼</Text></TouchableOpacity>
                            </View>
                          </View>
                          
                          {/* Caixa de Pontuação do Desperta */}
                          <TextInput
                            value={bonusDespertaPoints}
                            onChangeText={setBonusDespertaPoints}
                            placeholder="Pontos (F)"
                            keyboardType="numeric"
                            style={{ flex: 0.45, height: 34, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 8, fontSize: 12, color: '#334155', textAlign: 'center' }}
                          />
                        </View>
                      )}
                    </View>

                    {/* 3. MURAL DE INSTRUÇÕES DA LIGA (MAX 500 CARACTERES) */}
                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E3A8A', marginTop: 10, marginBottom: 8, textTransform: 'uppercase' }}>
                      3. Mural de Instruções do Desafio:
                    </Text>
                    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1', padding: 4 }}>
                      <TextInput
                        value={muralText}
                        onChangeText={(txt) => { if(txt.length <= 500) muralText && setMuralText(txt); }}
                        placeholder="Digite as regras, valores em dinheiro, diretrizes das fotos comprobatórias, etc..."
                        placeholderTextColor="#94A3B8"
                        multiline={true}
                        numberOfLines={4}
                        style={{ minHeight: 80, paddingHorizontal: 8, paddingVertical: 6, fontSize: 13, color: '#334155', textAlignVertical: 'top' }}
                      />
                      {/* CONTADOR DINÂMICO DE CARACTERES NO RODAPÉ */}
                      <Text style={{ fontSize: 11, textAlign: 'right', color: muralText.length >= 450 ? '#EF4444' : '#94A3B8', fontWeight: '600', paddingRight: 4, paddingBottom: 2 }}>
                        {muralText.length} / 500 caract.
                      </Text>
                    </View>

                  </View>
                )}
              </View>

            </ScrollView>
          </View>
        </View>
      </Modal>  
</ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#FAF9F6', paddingBottom: 60 },
  pageTitle: { fontSize: 16, fontWeight: 'bold', color: '#1E3A8A', marginTop: 14, marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: '#64748B', marginBottom: 16 },
  adminCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 16, borderHorizontalWidth: 1, borderColor: '#E2E8F0' },
  workoutHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  userLabel: { fontSize: 12, fontWeight: 'bold', color: '#475569' },
  userValue: { fontSize: 12, color: '#0F172A', fontWeight: '500' },
  workoutInfo: { fontSize: 13, color: '#334155', marginBottom: 4 },
  boldText: { fontWeight: 'bold', color: '#1E3A8A' },
  labelMandatory: { fontSize: 11, fontWeight: 'bold', color: '#F97316', marginTop: 10, marginBottom: 6 },
  evidenceImage: { width: '100%', height: 180, borderRadius: 8, marginTop: 4, marginBottom: 10 },
  alertText: { fontSize: 12, color: '#EF4444', fontStyle: 'italic', marginVertical: 8 },
  pointsEarned: { fontSize: 14, fontWeight: 'bold', color: '#16A34A', marginTop: 6, marginBottom: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  btnRejectOld: { backgroundColor: '#EF4444' },
  btnApproveOld: { backgroundColor: '#22C55E' },
  btnText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  emptyText: { fontSize: 12, color: '#64748B', fontStyle: 'italic', padding: 6 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#e2e8f0', padding: 12, borderRadius: 8, marginBottom: 14, borderWidth: 1, borderColor: '#cbd5e1' },
  accordionTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e3a8a' },
  accordionArrow: { fontSize: 11, color: '#475569' },
  accordionContent: { backgroundColor: '#ffffff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 14 },
  subSectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginBottom: 8, paddingBottom: 2, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  requestRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#cbd5e1' },
  userNickname: { fontSize: 13, fontWeight: '500', color: '#334155' },
  btnRow: { flexDirection: 'row', gap: 6 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  btnAccept: { backgroundColor: '#22c55e' },
  btnReject: { backgroundColor: '#ef4444' },
  memberStatusTag: { fontSize: 11, fontWeight: 'bold', color: '#f97316', backgroundColor: '#ffedd5', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 }
});
