// src/screens/RankingScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { supabase } from '../../supabaseClient';

export default function RankingScreen({ memberships, currentUser, onNavigateToProfile }) {
    const [profiles, setProfiles] = React.useState([]);
  const [userMembership, setUserMembership] = React.useState(null);
  const [challengeApplication, setChallengeApplication] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [leagueStatus, setLeagueStatus] = React.useState('ABERTO');

  React.useEffect(() => {
    if (currentUser?.id) {
      loadUserStatus();
    }
  }, [currentUser]);

  async function loadUserStatus() {
    try {
      // 1. Busca a inscrição do usuário na liga atual
      const { data: memData } = await supabase
        .from('league_memberships')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();
      
      setUserMembership(memData);

      // 2. Busca solicitações de desafio feitas por este usuário
      const { data: chalData } = await supabase
        .from('challenge_applications')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      setChallengeApplication(chalData);

      // 3. Descobre o status atual de inscrições da liga (ABERTO/FECHADO)
      if (memData?.league_id) {
        const { data: ligData } = await supabase
          .from('challenges_v2')
          .select('status_inscription')
          .eq('id', memData.league_id)
          .maybeSingle();
        
        if (ligData?.status_inscription) {
          setLeagueStatus(ligData.status_inscription);
        }
      }
    } catch (err) {
      console.log('Erro ao carregar status do usuário no ranking:', err);
    }
  }
  // Função para o usuário solicitar entrada na Liga (Telespectador)
  async function handleJoinLeague() {
    if (isSubmitting || !currentUser?.id) return;
    setIsSubmitting(true);
    try {
      // Cria a linha na tabela de membros com o status inicial pendente
      const { error } = await supabase
        .from('league_memberships')
        .insert([{ 
          user_id: currentUser.id, 
          status: 'Aguardando Aprovação do Admin' 
        }]);

      if (error) throw error;
      alert('Solicitação enviada com sucesso! Aguarde a liberação do Administrador. 📩');
      await loadUserStatus();
    } catch (err) {
      alert('Erro ao solicitar entrada na liga: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Função para o membro solicitar tornar-se Atleta no Desafio
  async function handleJoinChallenge() {
    if (isSubmitting || !currentUser?.id || !userMembership?.league_id) return;
    setIsSubmitting(true);
    try {
      // 1. Cria a solicitação pendente na tabela de desafios
      const { error: chalError } = await supabase
        .from('challenge_applications')
        .insert([{
          user_id: currentUser.id,
          league_id: userMembership.league_id,
          status: 'Pendente'
        }]);

      if (chalError) throw chalError;

      // 2. Atualiza imediatamente o status dele na liga para ATLETA PENDENTE
      const { error: memError } = await supabase
        .from('league_memberships')
        .update({ status: 'ATLETA PENDENTE' })
        .eq('user_id', currentUser.id);

      if (memError) throw memError;

      alert('Inscrição no desafio enviada! Seu status mudou para ATLETA PENDENTE. ⚡');
      await loadUserStatus();
    } catch (err) {
      alert('Erro ao se inscrever no desafio: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  React.useEffect(() => {
    async function loadProfiles() {
      try {
        const { data } = await supabase.from('profiles').select('*');
        if (data) setProfiles(data);
      } catch (err) {
        console.log('Erro ao carregar perfis no ranking:', err);
      }
    }
    loadProfiles();
  }, []);

  // Ordena os atletas por pontos no ranking (do maior para o menor)
  const sortedRanking = [...memberships].sort((a, b) => {
    const ptsA = a.ranking_points || 0;
    const ptsB = b.ranking_points || 0;
    return ptsB - ptsA;
  });

  // Define os emojis de pódio para os 3 primeiros colocados
  const podiumEmojis = ['🥇', '🥈', '🥉'];

         return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>🏆 Classificação da Liga</Text>
      <Text style={styles.pageSubtitle}>A pontuação é atualizada assim que os treinos são validados.</Text>
    
          {/* 🚀 BLOCO DE BOTÕES INTELIGENTES DINÂMICOS (5 REGRAS DE OURO) */}
      <View style={styles.actionHeaderContainer}>
        {!userMembership ? (
          /* REGRA 1: Usuário Não Membro da Liga */
          <TouchableOpacity 
            style={[styles.smartBtn, styles.btnJoinLeague]} 
            onPress={handleJoinLeague}
            disabled={isSubmitting}
          >
            <Text style={styles.smartBtnText}>
              {isSubmitting ? 'Enviando...' : '📩 Tornar-se Membro da Liga'}
            </Text>
          </TouchableOpacity>
        ) : userMembership.status === 'Aguardando Aprovação do Admin' ? (
          /* REGRA 1 (Continuação): Aguardando aprovação como Membro */
          <View style={[styles.smartBtn, styles.btnPending]} disabled={true}>
            <Text style={styles.smartBtnText}>⏳ Aguardando Liberação do Administrador</Text>
          </View>
        ) : userMembership.status === 'TELESPECTADOR' ? (
          leagueStatus === 'FECHADO' ? (
            /* REGRA 5: Membro Telespectador, mas inscrições do desafio Encerradas */
            <View style={[styles.smartBtn, styles.btnClosed]} disabled={true}>
              <Text style={styles.smartBtnText}>🔒 Inscrições Encerradas</Text>
            </View>
          ) : (
            /* REGRA 1 e 3: Membro Telespectador com desafio aberto */
            <TouchableOpacity 
              style={[styles.smartBtn, styles.btnJoinChallenge]} 
              onPress={handleJoinChallenge}
              disabled={isSubmitting}
            >
              <Text style={styles.smartBtnText}>
                {isSubmitting ? 'Enviando...' : '⚡ Tornar-se Atleta do Desafio'}
              </Text>
            </TouchableOpacity>
          )
        ) : userMembership.status === 'ATLETA PENDENTE' ? (
          /* REGRA 3 (Continuação): Aguardando aprovação como Atleta */
          <View style={[styles.smartBtn, styles.btnPending]} disabled={true}>
            <Text style={styles.smartBtnText}>⏳ Aguardando Aprovação do Administrador</Text>
          </View>
        ) : userMembership.status === 'ATLETA ATIVO' ? (
          /* REGRA 3 e Otimização futura: Atleta ativo participando do Ranking */
          <View style={[styles.smartBtn, styles.btnActive]} disabled={true}>
            <Text style={styles.smartBtnText}>🔥 Atleta Ativo no Desafio</Text>
          </View>
        ) : null}
      </View>


      {sortedRanking.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum participante pontuou neste desafio ainda.</Text>
      ) : (
        <View style={styles.rankingList}>
          {sortedRanking.map((member, index) => {
                        const isPodium = index < 3;
            const isMe = member.user_id === currentUser?.id;
            
            // Encontra o perfil real deste atleta para puxar foto e apelido atualizados
            const realProf = profiles?.find(p => p.id === member.user_id);

            return (

              <View 
                key={member.id || index} 
                style={[
                  styles.rankCard,
                  isMe && styles.rankCardMe,
                  index === 0 && styles.rankFirst
                ]}
              >
                {/* 1. POSIÇÃO NO RANKING */}
                <View style={styles.positionBox}>
                  <Text style={[styles.positionText, isPodium && styles.podiumText]}>
                    {isPodium ? podiumEmojis[index] : `${index + 1}º`}
                  </Text>
                </View>

                {/* 2. FOTO DO PERFIL */}
                <Image 
                 source={{ uri: realProf?.avatar_url || 'https://placeholder.com' }}
                  style={styles.userAvatar} 
                />

                {/* 3. APELIDO CLICÁVEL + MEDALHAS */}
                <View style={styles.infoBox}>
                  {/* Apelido como Link que envia o ID do atleta para abrir a Central do Atleta */}
                  <TouchableOpacity 
                    onPress={() => onNavigateToProfile && onNavigateToProfile(member.user_id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.userName, isMe && styles.userNameMe]}>
                      {realProf?.nickname || 'Atleta MuvFit'} {isMe && '(Você)'}
                    </Text>
                  </TouchableOpacity>

                  {/* Bloco de Medalhas mantido e associado à liga em questão */}
                  <Text style={styles.userMedals}>
                    🥇 {member.gold_medals || 0}   🥈 {member.silver_medals || 0}   🥉 {member.bronze_medals || 0}
                  </Text>
                </View>

                {/* 4. PONTOS ACUMULADOS NA LIGA */}
                <View style={styles.pointsBox}>
                  <Text style={styles.pointsValue}>{member.ranking_points || 0}</Text>
                  <Text style={styles.pointsLabel}>pts</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc' },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 4 },
  pageSubtitle: { fontSize: 12, color: '#64748b', marginBottom: 16 },
  rankingList: { width: '100%' },
  rankCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  rankCardMe: { backgroundColor: '#fef08a', borderColor: '#facc15' },
  rankFirst: { borderLeftWidth: 5, borderLeftColor: '#facc15' },
  positionBox: { width: 40, alignItems: 'center', justifyContent: 'center' },
  positionText: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  podiumText: { fontSize: 18 },
  userAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#cbd5e1', marginRight: 12 },
  infoBox: { flex: 1, justifyContent: 'center' },
  userName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', marginBottom: 2, textDecorationLine: 'underline' },
  userNameMe: { color: '#b45309' },
  userMedals: { fontSize: 11, color: '#64748b', marginTop: 2 },
  pointsBox: { alignItems: 'center', justifyContent: 'center', paddingLeft: 8 },
  pointsValue: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' },
  pointsLabel: { fontSize: 10, color: '#64748b', fontWeight: 'bold' },
  emptyText: { fontSize: 13, color: '#64748b', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  actionHeaderContainer: { width: '100%', marginBottom: 16 },
  smartBtn: { width: '100%', paddingVertical: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
  smartBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold', letterSpacing: 0.5 },
  btnJoinLeague: { backgroundColor: '#1E3A8A' },
  btnJoinChallenge: { backgroundColor: '#F97316' },
  btnPending: { backgroundColor: '#64748B' },
  btnActive: { backgroundColor: '#22C55E' },
  btnClosed: { backgroundColor: '#94A3B8' }
});

