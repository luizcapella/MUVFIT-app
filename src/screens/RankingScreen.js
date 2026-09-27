// src/screens/RankingScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';

export default function RankingScreen({ memberships, currentUser }) {
  // Ordena os atletas por pontos no ranking (do maior para o menor)
  const sortedRanking = [...memberships].sort((a, b) => {
    const ptsA = a.ranking_points || 0;
    const ptsB = b.ranking_points || 0;
    return ptsB - ptsA;
  });

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

            // Define os emojis de pódio para os 3 primeiros colocados
            const podiumEmojis = ['🥇', '🥈', '🥉'];

            return (
              <View 
                key={member.id || index} 
                style={[
                  styles.rankCard, 
                  isMe && styles.rankCardMe,
                  index === 0 && styles.rankFirst
                ]}
              >
                {/* POSIÇÃO */}
                <View style={styles.positionBox}>
                  <Text style={[styles.positionText, isPodium && styles.podiumText]}>
                    {isPodium ? podiumEmojis[index] : `${index + 1}º`}
                  </Text>
                </View>

                {/* AVATAR DO ATLETA */}
                <Image 
                  source={{ uri: member.user_avatar || `https://picsum.photos{index}/100/100` }} 
                  style={styles.avatar} 
                />

                {/* INFO DO USUÁRIO */}
                <View style={styles.infoBox}>
                  <Text style={[styles.userName, isMe && styles.userNameMe]}>
                    {member.user_nickname || member.user_name || 'Atleta MuvFit'} {isMe && '(Você)'}
                  </Text>
                  <Text style={styles.userMedals}>
                    🎖️ {member.gold_medals || 0}   {member.silver_medals || 0}   {member.bronze_medals || 0}
                  </Text>
                </View>

                {/* PONTUAÇÃO */}
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
  emptyText: { fontSize: 13, color: '#64748b', fontStyle: 'italic', textAlign: 'center', marginTop: 24 },
  rankingList: { gap: 10 },
  rankCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  rankCardMe: { borderColor: '#f97316', backgroundColor: '#fff7ed', borderWidth: 1.5 },
  rankFirst: { borderColor: '#eab308', backgroundColor: '#fef9c3', borderWidth: 1.5 },
  positionBox: { width: 40, alignItems: 'center', justifyContent: 'center' },
  positionText: { fontSize: 14, fontWeight: 'bold', color: '#475569' },
  podiumText: { fontSize: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#cbd5e1', marginRight: 12 },
  infoBox: { flex: 1, justifyContent: 'center' },
  userName: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  userNameMe: { color: '#ea580c' },
  userMedals: { fontSize: 11, color: '#64748b', marginTop: 2 },
  pointsBox: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 60 },
  pointsValue: { fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' },
  pointsLabel: { fontSize: 10, color: '#64748b', fontWeight: 'bold', marginTop: -2 }
});
