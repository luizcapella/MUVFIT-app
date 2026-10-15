import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';

export default function AthleteGoals({ isOpen, setIsOpen }) {
  const [novaMetaTexto, setNovaMetaTexto] = useState('');
  const [listaMetas, setListaMetas] = useState([]);

  if (!isOpen) return null;

  // Função para adicionar uma nova meta na lista
  const handleAdicionarMeta = () => {
    if (!novaMetaTexto.trim()) return;
    const novaMeta = {
      id: Date.now().toString(),
      texto: novaMetaTexto,
      concluida: false
    };
    setListaMetas([...listaMetas, novaMeta]);
    setNovaMetaTexto('');
  };

  // Função para alternar o status da checkbox (concluída ou não)
  const handleAlternarConclusao = (id) => {
    setListaMetas(listaMetas.map(meta => 
      meta.id === id ? { ...meta, concluida: !meta.concluida } : meta
    ));
  };

  // Função para excluir uma meta da lista (Item 4)
  const handleExcluirMeta = (id) => {
    setListaMetas(listaMetas.filter(meta => meta.id !== id));
  };

  return (
    <View style={{ marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
      {/* CABEÇALHO DA SANFONA DE METAS */}
      <TouchableOpacity 
        onPress={() => setIsOpen(!isOpen)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E3A8A' }}>
          🎯 Metas Pessoais do Atleta
        </Text>
        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: 'bold' }}>
          {isOpen ? '▲ RECOLHER' : '▼ EXPANDIR'}
        </Text>
      </TouchableOpacity>

      <View style={{ padding: 12, backgroundColor: '#F1F5F9' }}>
        
        {/* 1. CAIXA DE ENTRADA SUPERIOR */}
        <View style={{ flexDirection: 'row', marginBottom: 12, gap: 8 }}>
          <TextInput
            value={novaMetaTexto}
            onChangeText={novaMetaTexto}
            placeholder="Escreva uma meta pessoal... (Ex: Correr 10km)"
            style={{ flex: 1, height: 38, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 12, fontSize: 13, color: '#334155', backgroundColor: '#FFFFFF' }}
          />
          <TouchableOpacity
            onPress={handleAdicionarMeta}
            style={{ backgroundColor: '#1E3A8A', height: 38, paddingHorizontal: 14, borderRadius: 6, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>+ Adicionar</Text>
          </TouchableOpacity>
        </View>

        {/* 2. LISTA DINÂMICA DE METAS EMPILHADAS */}
        <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled={true}>
          {listaMetas.length === 0 ? (
            <Text style={{ padding: 12, fontSize: 13, color: '#94A3B8', textAlign: 'center', fontStyle: 'italic' }}>
              Nenhuma meta cadastrada. Escreva um objetivo acima! 🚀
            </Text>
          ) : (
            listaMetas.map((meta) => (
              <View 
                key={meta.id} 
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 }}
              >
                {/* 3. CHECKBOX DE CONCLUSÃO + TEXTO RISCADO */}
                <TouchableOpacity 
                  onPress={() => handleAlternarConclusao(meta.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', flex: 0.9 }}
                >
                  <View style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: '#1E3A8A', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: meta.concluida ? '#1E3A8A' : 'transparent', marginRight: 10 }}>
                    {meta.concluida && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
                  </View>
                  <Text style={{ 
                    fontSize: 13, 
                    color: meta.concluida ? '#94A3B8' : '#334155', 
                    fontWeight: '500',
                    textDecorationLine: meta.concluida ? 'line-through' : 'none' 
                  }}>
                    {meta.texto}
                  </Text>
                </TouchableOpacity>

                {/* 4. BOTÃO DE EXCLUIR (-) */}
                <TouchableOpacity 
                  onPress={() => handleExcluirMeta(meta.id)}
                  style={{ backgroundColor: '#FEE2E2', width: 26, height: 26, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: '#FCA5A5' }}
                >
                  <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: 'bold', lineHeight: 16 }}>-</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

      </View>
    </View>
  );
}
