// src/screens/RankingScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';

export default function RankingScreen({ memberships, currentUser, onNavigateToProfile }) {
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

      {sortedRanking.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum participante pontuou neste desafio ainda.</Text>
      ) : (
        <View style={styles.rankingList}>
          {sortedRanking.map((member, index) => {
            const isPodium = index < 3;
            const isMe = member.user_id === currentUser?.id;

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
                  source={{ uri: member.user_avatar || 'https://placeholder.com' }} 
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
                      {member.user_nickname || member.user_name || 'Atleta MuvFit'} {isMe && '(Você)'}
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
  emptyText: { fontSize: 13, color: '#64748b', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }
});

