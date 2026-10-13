import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';

export default function AdminPontosManuais({ 
  isOpen, 
  setIsOpen,
  states,
  enabledActivities,
  ligasDisponiveis = [], // Receberá as ligas do banco
  atletasAtivos = []     // Receberá os atletas do banco filtrados
}) {

    const [showDatePicker, setShowDatePicker] = useState(false);

  if (!isOpen || !states) return null;

  const modalidadesLista = [
    'Musculação', 'Aeróbico', 'Crossfit', 'Corrida', 
    'Caminhada', 'Bike', 'Lutas', 'Esportes Coletivos', 'Passos Diários'
  ];

  // Nome legível para exibição na interface
  const getModalidadeLabel = (mod) => {
    if (mod === 'Crossfit') return '🏋️ Crossfit / Funcional';
    if (mod === 'Musculação') return '💪 Musculação';
    if (mod === 'Aeróbico') return '🔥 Aeróbico';
    if (mod === 'Corrida') return '🏃 Corrida';
    if (mod === 'Caminhada') return '🚶 Caminhada';
    if (mod === 'Bike') return '🚴 Bike';
    if (mod === 'Lutas') return '🥋 Lutas / Esp. Individuais';
    if (mod === 'Esportes Coletivos') return '⚽ Esportes Coletivos';
    if (mod === 'Passos Diários') return '👣 Passos Diários';
    return mod;
  };

  return (
    <View style={{ marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
      {/* CABEÇALHO DA ABA MESTRE */}
      <TouchableOpacity 
        onPress={() => setIsOpen(!isOpen)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}
      >
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E3A8A' }}>
          ➕ Adicionar Pontos Manualmente
        </Text>
        <Text style={{ fontSize: 12, color: '#64748B', fontWeight: 'bold' }}>
          {isOpen ? '▲ RECOLHER' : '▼ EXPANDIR'}
        </Text>
      </TouchableOpacity>

      <View style={{ padding: 12, backgroundColor: '#F1F5F9' }}>
        
        {/* a. DROPDOWN: SELECIONAR LIGA */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 }}>a. Selecionar Liga *</Text>
        <View style={{ position: 'relative', marginBottom: 12, zIndex: states.openManualDropdown === 'liga' ? 99999 : 10 }}>
          <TouchableOpacity
            onPress={() => states.setOpenManualDropdown(states.openManualDropdown === 'liga' ? null : 'liga')}
            style={{ height: 38, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#FFFFFF' }}
          >
            <Text style={{ fontSize: 13, color: states.manualLigaSelecionada ? '#1E3A8A' : '#94A3B8', fontWeight: states.manualLigaSelecionada ? '700' : '400' }}>
              {states.manualLigaSelecionada ? states.manualLigaSelecionada.nome : 'Selecione uma liga administrada...'}
            </Text>
          </TouchableOpacity>
          {states.openManualDropdown === 'liga' && (
            <View style={{ position: 'absolute', top: 40, left: 0, right: 0, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, maxHeight: 150, elevation: 5, zIndex: 99999 }}>
              <ScrollView nestedScrollEnabled={true}>
                {ligasDisponiveis.length === 0 ? (
                  <Text style={{ padding: 10, fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>Nenhuma liga encontrada</Text>
                ) : ligasDisponiveis.map((liga) => (
                  <TouchableOpacity
                    key={liga.id}
                    onPress={() => { states.setManualLigaSelecionada(liga); states.setManualAtletaSelecionado(null); states.setOpenManualDropdown(null); }}
                    style={{ padding: 10, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0', backgroundColor: states.manualLigaSelecionada?.id === liga.id ? '#F0F5FF' : 'transparent' }}
                  >
                    <Text style={{ fontSize: 13, color: '#334155' }}>{liga.nome}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* b. DROPDOWN: SELECIONAR ATLETA ATIVO */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 }}>b. Selecionar Atleta Ativo *</Text>
        <View style={{ position: 'relative', marginBottom: 12, zIndex: states.openManualDropdown === 'atleta' ? 99998 : 9 }}>
          <TouchableOpacity
            disabled={!states.manualLigaSelecionada}
            onPress={() => states.setOpenManualDropdown(states.openManualDropdown === 'atleta' ? null : 'atleta')}
            style={{ height: 38, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: states.manualLigaSelecionada ? '#FFFFFF' : '#E2E8F0' }}
          >
            <Text style={{ fontSize: 13, color: states.manualAtletaSelecionado ? '#1E3A8A' : '#94A3B8', fontWeight: states.manualAtletaSelecionado ? '700' : '400' }}>
              {!states.manualLigaSelecionada ? '⚠️ Selecione uma liga primeiro...' : (states.manualAtletaSelecionado ? states.manualAtletaSelecionado.nome : 'Selecione um atleta ativo...')}
            </Text>
          </TouchableOpacity>
          {states.openManualDropdown === 'atleta' && states.manualLigaSelecionada && (
            <View style={{ position: 'absolute', top: 40, left: 0, right: 0, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, maxHeight: 150, elevation: 5, zIndex: 99999 }}>
              <ScrollView nestedScrollEnabled={true}>
                {atletasAtivos.length === 0 ? (
                  <Text style={{ padding: 10, fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>Nenhum atleta ativo nesta liga</Text>
                ) : atletasAtivos.map((atleta) => (
                  <TouchableOpacity
                    key={atleta.id}
                    onPress={() => { states.setManualAtletaSelecionado(atleta); states.setOpenManualDropdown(null); }}
                    style={{ padding: 10, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0', backgroundColor: states.manualAtletaSelecionado?.id === atleta.id ? '#F0F5FF' : 'transparent' }}
                  >
                    <Text style={{ fontSize: 13, color: '#334155' }}>{atleta.nome}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* c. DROPDOWN: MODALIDADES DE TREINO (COM TRAVA LARANJA) */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 }}>c. Modalidade de Treino *</Text>
        <View style={{ position: 'relative', marginBottom: 12, zIndex: states.openManualDropdown === 'modalidade' ? 99997 : 8 }}>
          <TouchableOpacity
            onPress={() => states.setOpenManualDropdown(states.openManualDropdown === 'modalidade' ? null : 'modalidade')}
            style={{ height: 38, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#FFFFFF' }}
          >
            <Text style={{ fontSize: 13, color: states.manualModalidade ? '#1E3A8A' : '#94A3B8', fontWeight: states.manualModalidade ? '700' : '400' }}>
              {states.manualModalidade ? getModalidadeLabel(states.manualModalidade) : 'Selecione a atividade realizada...'}
            </Text>
          </TouchableOpacity>
          {states.openManualDropdown === 'modalidade' && (
            <View style={{ position: 'absolute', top: 40, left: 0, right: 0, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, maxHeight: 180, elevation: 5, zIndex: 99999 }}>
              <ScrollView nestedScrollEnabled={true}>
                {modalidadesLista.map((mod) => {
                  const estaHabilitada = enabledActivities && enabledActivities[mod] !== false;
                  return (
                    <TouchableOpacity
                      key={mod}
                      disabled={!estaHabilitada}
                      onPress={() => { states.setManualModalidade(mod); states.setManualDistancia(''); states.setOpenManualDropdown(null); }}
                      style={{ padding: 10, borderBottomWidth: 0.5, borderBottomColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: !estaHabilitada ? '#F1F5F9' : (states.manualModalidade === mod ? '#F0F5FF' : 'transparent') }}
                    >
                      <Text style={{ fontSize: 13, color: !estaHabilitada ? '#94A3B8' : '#334155', textDecorationLine: !estaHabilitada ? 'line-through' : 'none' }}>
                        {getModalidadeLabel(mod)}
                      </Text>
                      {!estaHabilitada && (
                        <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: 'bold', backgroundColor: '#FEE2E2', paddingHorizontal: 4, borderRadius: 3 }}>DESATIVADA</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

                  {/* d. SELETOR DE DATA VISUAL NATIVO (CALENDÁRIO FUNCIONAL) */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 }}>d. Data da Atividade *</Text>
        
        <View style={{ position: 'relative', marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => setShowDatePicker(!showDatePicker)}
            style={{ height: 38, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#FFFFFF' }}
          >
            <Text style={{ fontSize: 13, color: '#1E3A8A', fontWeight: '700' }}>
              📅 {states.manualData ? states.manualData : 'Clique para selecionar o dia...'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <input
              type="date"
              value={states.manualData}
              onChange={(e) => {
                if (e.target.value) {
                  states.setManualData(e.target.value);
                }
                setShowDatePicker(false);
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                opacity: 0,
                width: '100%',
                height: '100%',
                zIndex: 99999
              }}
            />
          )}
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          {/* e. TEMPO DA ATIVIDADE */}
          <View style={{ flex: ['Corrida', 'Caminhada', 'Bike'].includes(states.manualModalidade) ? 0.48 : 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 }}>e. Tempo (Minutos)</Text>
            <TextInput
              value={states.manualTempo}
              onChangeText={states.setManualTempo}
              placeholder="Ex: 45"
              keyboardType="numeric"
              style={{ height: 38, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 12, fontSize: 13, color: '#334155', backgroundColor: '#FFFFFF', textAlign: 'center' }}
            />
          </View>

          {/* f. DISTÂNCIA PERCORRIDA (CONDICIONAL SÓ PARA CORRIDA, CAMINHADA OU BIKE) */}
          {['Corrida', 'Caminhada', 'Bike'].includes(states.manualModalidade) && (
            <View style={{ flex: 0.48 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 }}>f. Distância (KM)</Text>
              <TextInput
                value={states.manualDistancia}
                onChangeText={states.setManualDistancia}
                placeholder="Ex: 5.5"
                keyboardType="numeric"
                style={{ height: 38, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 4, paddingHorizontal: 12, fontSize: 13, color: '#334155', backgroundColor: '#FFFFFF', textAlign: 'center' }}
              />
            </View>
          )}
        </View>

        {/* g. ADIÇÃO DE PONTUAÇÃO OBRIGATÓRIA */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 }}>g. Adição de Pontuação Geral *</Text>
        <TextInput
          value={states.manualPontos}
          onChangeText={states.setManualPontos}
          placeholder="Digite a pontuação a ser computada..."
          keyboardType="numeric"
          style={{ height: 38, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 12, fontSize: 13, color: '#334155', backgroundColor: '#FFFFFF', marginBottom: 16 }}
        />

        {/* h. CHECKBOXES DE ADIÇÃO DE BÔNUS EXTRA */}
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 8 }}>h. Adição de Bônus da Base da Liga (Opcional):</Text>
        
        {/* BÔNUS: O INQUEBRÁVEL */}
        <TouchableOpacity
          onPress={() => states.setManualBonusInquebravel(!states.manualBonusInquebravel)}
          style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: '#FFFFFF', padding: 8, borderRadius: 6, borderWidth: 0.5, borderColor: '#CBD5E1' }}
        >
          <View style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: '#1E3A8A', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: states.manualBonusInquebravel ? '#1E3A8A' : 'transparent', marginRight: 8 }}>
            {states.manualBonusInquebravel && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
          </View>
          <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500' }}>🪨 Aplicar Bônus: O Inquebrável</Text>
        </TouchableOpacity>

        {/* BÔNUS: O DESPERTA */}
        <TouchableOpacity
          onPress={() => states.setManualBonusDesperta(!states.manualBonusDesperta)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 8, borderRadius: 6, borderWidth: 0.5, borderColor: '#CBD5E1', marginBottom: 16 }}
        >
          <View style={{ width: 18, height: 18, borderWidth: 1.5, borderColor: '#1E3A8A', borderRadius: 4, justifyContent: 'center', alignItems: 'center', backgroundColor: states.manualBonusDesperta ? '#1E3A8A' : 'transparent', marginRight: 8 }}>
            {states.manualBonusDesperta && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
          </View>
          <Text style={{ fontSize: 13, color: '#475569', fontWeight: '500' }}>⏰ Aplicar Bônus: O Desperta</Text>
        </TouchableOpacity>

        {/* BOTÃO DISPARADOR DE GRAVAÇÃO */}
        <TouchableOpacity
          onPress={() => {
            if (!states.manualLigaSelecionada || !states.manualAtletaSelecionado || !states.manualModalidade || !states.manualData || !states.manualPontos) {
              alert("⚠️ Erro: Preencha todos os campos obrigatórios (a, b, c, d, g).");
              return;
            }
            alert(`Sucesso! Pontuação de ${states.manualPontos} pts adicionada para o atleta ${states.manualAtletaSelecionado.nome} em stand-by.`);
          }}
          style={{ backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 6, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700', letterSpacing: 0.3 }}>
            SALVAR ADIÇÃO DE PONTOS
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}
