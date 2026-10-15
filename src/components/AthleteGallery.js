import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';

export default function AthleteGallery({ isOpen, setIsOpen }) {
  // Lista simulada de fotos de treinos aprovados que será conectada ao Supabase futuramente
  const fotosTreinos = [];
  
  if (!isOpen) return null;

  return (
    <View style={{ marginBottom: 20, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
      {/* CABEÇALHO DA SANFONA DE FOTOS */}
      <TouchableOpacity 
        onPress={() => setIsOpen(!isOpen)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E3A8A' }}>
          🖼️ Galeria de Fotos do Atleta
        </Text>
        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: 'bold' }}>
          {isOpen ? '▲ RECOLHER' : '▼ EXPANDIR'}
        </Text>
      </TouchableOpacity>

      <View style={{ padding: 12, backgroundColor: '#F1F5F9' }}>
        {/* GRADE DE MINIATURAS (GRID COMPACTO) */}
        <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled={true}>
          {fotosTreinos.length === 0 ? (
            <Text style={{ padding: 12, fontSize: 13, color: '#94A3B8', textAlign: 'center', fontStyle: 'italic' }}>
              Nenhuma foto de treino aprovada ainda. Envie seus comprovantes! 📸
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' }}>
              {fotosTreinos.map((item) => (
                <View 
                  key={item.id} 
                  style={{ width: '22%', backgroundColor: '#FFFFFF', borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', padding: 4, alignItems: 'center', marginBottom: 4 }}
                >
                  <Image 
                    source={{ uri: item.url }} 
                    style={{ width: '100%', aspectRatio: 1, borderRadius: 4, backgroundColor: '#CBD5E1' }} 
                  />
                  {/* LEGENDA DISCRETA DA FOTO */}
                  <View style={{ marginTop: 4, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#334155' }}>{item.modalidade}</Text>
                    <Text style={{ fontSize: 9, color: '#64748B', fontWeight: '600' }}>{item.data}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}
