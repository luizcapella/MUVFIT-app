// src/screens/FeedScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';

export default function FeedScreen({ 
  feedPosts, 
  currentUser, 
  commentInputs, 
  setCommentInputs, 
  handleLikePost, 
  handleAddComment 
}) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>🔥 Feed de Atividades</Text>
      
      {feedPosts.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum treino registrado ainda nesta liga. Seja o primeiro!</Text>
      ) : (
        feedPosts.map((post) => {
          const postCommentText = commentInputs[post.id] || '';

          return (
            <View key={post.id} style={styles.postCard}>
              {/* CABEÇALHO DO POST */}
              <View style={styles.userInfoRow}>
                <Image 
                  source={{ uri: post.user_avatar || 'https://picsum.photos' }} 
                  style={styles.userAvatar} 
                />
                <View>
                  <Text style={styles.userName}>{post.user_nickname || post.user_name || 'Atleta MuvFit'}</Text>
                  <Text style={styles.postDate}>{post.workout_date || 'Hoje'}</Text>
                </View>
              </View>

              {/* CONTEÚDO DO POST */}
              <Text style={styles.postActivity}>Realizou: <Text style={styles.activityBadge}>{post.activity}</Text></Text>
              {post.km_distance > 0 && (
                <Text style={styles.postDetail}>🏁 Distância: {post.km_distance} Km</Text>
              )}
              {post.caption ? <Text style={styles.postCaption}>{post.caption}</Text> : null}

              {/* IMAGEM DA EVIDÊNCIA (CRÍTICO PARA A COMPETIÇÃO) */}
              {post.evidence_url ? (
                <Image source={{ uri: post.evidence_url }} style={styles.evidenceImage} resizeMode="cover" />
              ) : (
                <View style={styles.noEvidenceBox}>
                  <Text style={styles.noEvidenceText}>⚠️ Nenhuma evidência de imagem anexada</Text>
                </View>
              )}

              {/* PONTUAÇÃO CONQUISTADA */}
              <View style={styles.pointsBadgeRow}>
                <Text style={styles.pointsText}>🏆 +{post.points_computed || 0} pts computados</Text>
              </View>

              {/* INTERAÇÕES (CURTIDAS) */}
              <View style={styles.interactionRow}>
                <TouchableOpacity style={styles.likeBtn} onPress={() => handleLikePost(post.id)}>
                  <Text style={styles.interactionText}>❤️ Curtir ({post.likes_count || 0})</Text>
                </TouchableOpacity>
              </View>

              {/* SEÇÃO DE COMENTÁRIOS */}
              <View style={styles.commentSection}>
                {post.comments && post.comments.map((comment, cIdx) => (
                  <Text key={cIdx} style={styles.commentItem}>
                    <Text style={styles.commentUser}>{comment.user_name}: </Text>
                    {comment.text}
                  </Text>
                ))}

                {/* CAMPO PARA ENVIAR COMENTÁRIO */}
                <View style={styles.addCommentRow}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Adicione um comentário..."
                    value={postCommentText}
                    onChangeText={(txt) => setCommentInputs({ ...commentInputs, [post.id]: txt })}
                  />
                  <TouchableOpacity 
                    style={styles.sendCommentBtn}
                    onPress={() => {
                      if (!postCommentText.trim()) return;
                      handleAddComment(post.id, postCommentText);
                      setCommentInputs({ ...commentInputs, [post.id]: '' });
                    }}
                  >
                    <Text style={styles.sendCommentBtnText}>Enviar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc' },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 16 },
  emptyText: { fontSize: 13, color: '#64748b', fontStyle: 'italic', textAlign: 'center', marginTop: 24 },
  postCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#cbd5e1' },
  userName: { fontSize: 14, fontWeight: 'bold', color: '#1e3a8a' },
  postDate: { fontSize: 11, color: '#64748b' },
  postActivity: { fontSize: 13, color: '#334155', marginBottom: 4, fontWeight: '500' },
  activityBadge: { color: '#f97316', fontWeight: 'bold' },
  postDetail: { fontSize: 12, color: '#475569', marginBottom: 4 },
  postCaption: { fontSize: 13, color: '#1e293b', marginVertical: 6, lineHeight: 18 },
  evidenceImage: { width: '100%', height: 220, borderRadius: 8, marginTop: 8, backgroundColor: '#e2e8f0' },
  noEvidenceBox: { width: '100%', height: 60, backgroundColor: '#fee2e2', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  noEvidenceText: { color: '#b91c1c', fontSize: 12, fontWeight: 'bold' },
  pointsBadgeRow: { marginTop: 12, backgroundColor: '#eff6ff', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start' },
  pointsText: { color: '#1d4ed8', fontWeight: 'bold', fontSize: 12 },
  interactionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 12, paddingVertical: 8 },
  likeBtn: { paddingVertical: 4 },
  interactionText: { fontSize: 13, fontWeight: 'bold', color: '#475569' },
  commentSection: { backgroundColor: '#f8fafc', borderRadius: 8, padding: 10, marginTop: 4 },
  commentItem: { fontSize: 12, color: '#334155', marginBottom: 4, lineHeight: 16 },
  commentUser: { fontWeight: 'bold', color: '#1e3a8a' },
  addCommentRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  commentInput: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#0f172a' },
  sendCommentBtn: { backgroundColor: '#1e3a8a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  sendCommentBtnText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' }
});
