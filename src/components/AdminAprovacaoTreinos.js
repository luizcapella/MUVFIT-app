import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';

export default function AdminAprovacaoTreinos({ isOpen, setIsOpen, treinosPendentes = [], onAprovar, onRejeitar }) {
  
  if (!isOpen) return null;

  return (
    <View style={{ marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
      {/* CABEÇALHO DA ABA DA CENTRAL DE MODERAÇÃO */}
      <TouchableOpacity 
        onPress={() => setIsOpen(!isOpen)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E3A8A' }}>
          ⚖️ APROVAÇÃO DE TREINOS ({treinosPendentes.length})
        </Text>
        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: 'bold' }}>
          {isOpen ? '▲ RECOLHER' : '▼ EXPANDIR'}
        </Text>
      </TouchableOpacity>

      <View style={{ padding: 12, backgroundColor: '#F1F5F9' }}>
        <ScrollView style={{ maxHeight: 450 }} nestedScrollEnabled={true}>
          {treinosPendentes.length === 0 ? (
            /* VISUAL REAL ATUAL: ADAPTADO EXATAMENTE CONFORME O SEU PRINT */
            <Text style={{ padding: 14, fontSize: 13, color: '#1E3A8A', textAlign: 'center', fontWeight: '700', backgroundColor: '#EFF6FF', borderRadius: 6, borderWidth: 1, borderColor: '#BFDBFE' }}>
              Não há treinos aguardando validação no momento. Bom descanso!
            </Text>
          ) : (
            /* COMPONENTE PRONTO PARA PRODUÇÃO: EXPANDIRÁ OS DADOS DO SUPABASE */
            treinosPendentes.map((treino) => (
              <View key={treino.id} style={{ backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', padding: 14, marginBottom: 12 }}>
                
                {/* 1. FOTO DE PERFIL + NOME DO ATLETA */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0', paddingBottom: 8 }}>
                  <Image source={{ uri: treino.atletaAvatar || 'https://picsum.photos' }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, backgroundColor: '#CBD5E1' }} />
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#1E3A8A' }}>{treino.atletaNome}</Text>
                </View>

                {/* 2. DADOS DO TREINO EFETUADO */}
                <View style={{ gap: 4, marginBottom: 12 }}>
                  <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600' }}>🔹 Treino efetuado: <Text style={{ fontWeight: 'normal' }}>{treino.modalidade}</Text></Text>
                  <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600' }}>📅 Data de registro do treino: <Text style={{ fontWeight: 'normal' }}>{treino.data}</Text></Text>
                  <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600' }}>⏱️ Tempo de registro do treino: <Text style={{ fontWeight: 'normal' }}>{treino.tempo} minutos</Text></Text>
                  
                  {/* Distância Percorrida Condicional (Só aparece para Caminhada, Corrida ou Bike) */}
                  {treino.distancia && (
                    <Text style={{ fontSize: 13, color: '#334155', fontWeight: '600' }}>📏 Distância Percorrida registrada: <Text style={{ fontWeight: 'normal' }}>{treino.distancia} KM</Text></Text>
                  )}
                  
                  {/* Pontuação calculada com base nas regras */}
                  <Text style={{ fontSize: 13, color: '#1E3A8A', fontWeight: 'bold', marginTop: 4 }}>
                    🏆 Pontuação que o treino vai valer: {treino.pontosEstimados} Pontos
                  </Text>
                </View>

                {/* 3. EXIBIÇÃO DE BÔNUS ACALÇADOS */}
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {treino.hasInquebravel && (
                    <View style={{ backgroundColor: '#FEF3C7', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, borderWidth: 0.5, borderColor: '#FCD34D' }}>
                      <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '700' }}>🪨 Bônus "O Inquebrável" Alcançado</Text>
                    </View>
                  )}
                  {treino.hasDesperta && (
                    <View style={{ backgroundColor: '#DBEAFE', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 4, borderWidth: 0.5, borderColor: '#BFDBFE' }}>
                      <Text style={{ fontSize: 11, color: '#2563EB', fontWeight: '700' }}>⏰ Bônus "O Desperta" Alcançado</Text>
                    </View>
                  )}
                </View>

                {/* 4. FOTOS DE EVIDÊNCIAS REGISTRADAS */}
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>📸 Fotos de Evidências:</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  {treino.foto1 && <Image source={{ uri: treino.foto1 }} style={{ flex: 1, aspectRatio: 1.4, borderRadius: 6, backgroundColor: '#CBD5E1' }} />}
                  {treino.foto2 && <Image source={{ uri: treino.foto2 }} style={{ flex: 1, aspectRatio: 1.4, borderRadius: 6, backgroundColor: '#CBD5E1' }} />}
                  {treino.foto3 && <Image source={{ uri: treino.foto3 }} style={{ flex: 1, aspectRatio: 1.4, borderRadius: 6, backgroundColor: '#CBD5E1' }} />}
                </View>

                {/* 5. OS DOIS BOTÕES DE DECISÃO MAIS BAIXO */}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, borderTopWidth: 0.5, borderTopColor: '#E2E8F0', paddingTop: 10 }}>
                  <TouchableOpacity 
                    onPress={() => onRejeitar && onRejeitar(treino.id)}
                    style={{ backgroundColor: '#FEE2E2', paddingVertical: 7, paddingHorizontal: 16, borderRadius: 6, borderWidth: 1, borderColor: '#FCA5A5' }}
                  >
                    <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>[Botão de Rejeitar]</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => onAprovar && onAprovar(treino.id)}
                    style={{ backgroundColor: '#DCFCE7', paddingVertical: 7, paddingHorizontal: 16, borderRadius: 6, borderWidth: 1, borderColor: '#86EFAC' }}
                  >
                    <Text style={{ color: '#16A34A', fontSize: 12, fontWeight: '700' }}>[Botão de Aprovar]</Text>
                  </TouchableOpacity>
                </View>

              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}
