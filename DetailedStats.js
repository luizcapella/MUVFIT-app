import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function DetailedStats({ user, onBack }) {
  // Dados de fallback caso o usuário não tenha estatísticas carregadas
  const stats = user?.stats || {
    matchesPlayed: 0,
    goals: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    winRate: '0%',
    rating: '0.0',
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Cabeçalho / Botão Voltar */}
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Voltar para a Central</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.title}>Estatísticas Detalhadas</Text>
      <Text style={styles.subtitle}>Atleta: {user?.name || 'Jogador'}</Text>

      {/* Cards Principais */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{stats.matchesPlayed}</Text>
          <Text style={styles.cardLabel}>Partidas</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{stats.goals}</Text>
          <Text style={styles.cardLabel}>Gols</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{stats.assists}</Text>
          <Text style={styles.cardLabel}>Assistências</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardValue}>{stats.winRate}</Text>
          <Text style={styles.cardLabel}>Vitórias</Text>
        </View>
      </View>

      {/* Detalhes de Desempenho */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Desempenho & Disciplina</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Nota Média:</Text>
          <Text style={styles.rowValue}>{stats.rating} / 10</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Cartões Amarelos:</Text>
          <Text style={styles.rowValue}>{stats.yellowCards}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Cartões Vermelhos:</Text>
          <Text style={styles.rowValue}>{stats.redCards}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#121212',
    flexGrow: 1,
  },
  backButton: {
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#00E676',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: '48%',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00E676',
  },
  cardLabel: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  rowLabel: {
    color: '#DDDDDD',
    fontSize: 14,
  },
  rowValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
