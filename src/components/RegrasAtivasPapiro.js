import React from 'react';
import { View, Text } from 'react-native';

export default function RegrasAtivasPapiro({ selectedActivity, enabledActivities, baseLigaConfig }) {
  // Configurações padrão (placeholders) que serão substituídas pelas variáveis reais do banco futuramente
  const config = baseLigaConfig || {
    tetoDiario: '50',
    bonusInquebravel: '10',
    bonusInquebravelActive: true,
    bonusDesperta: '5',
    bonusDespertaActive: true,
    travaUmEnvioPorDia: true, // Futuro botão do administrador
    muralTexto: 'Bora time! Foco total nos treinos desta semana. O segredo é a constância! 🔥'
  };

  // Lógica dinâmica para gerar o texto do papiro baseado na atividade escolhida pelo aluno
  const renderRegraDinamica = () => {
    if (!selectedActivity) return '⚠️ Selecione uma atividade abaixo para ver a pontuação.';

    // 🏋️ Musculação, Aeróbico e Crossfit/Funcional
    if (['Musculação', 'Aeróbico', 'Crossfit'].includes(selectedActivity)) {
      return '⏱️ Tempo Mínimo Proporcional Ativo: XX min = XX Pontos\n(Ou 📊 Steps Progressivos se configurado: XX a XX min = XX Pts)';
    }

    // 🏃 Corrida, Caminhada e Bike
    if (['Corrida', 'Caminhada', 'Bike'].includes(selectedActivity)) {
      return '📏 Quilometragem Mínima Ativa: XX KM = XX Pontos\n(Ou ⏱️ baseada em Tempo/Steps conforme escolha do admin)';
    }

    // 👣 Passos Diários
    if (selectedActivity === 'Passos Diários') {
      return '🔢 Multiplicador Ativo: Seus passos diários serão multiplicados por xX.X e convertidos em pontos gerais.';
    }

    return `✨ Regra padrão ativa para: ${selectedActivity}`;
  };

  return (
    <View style={{
      backgroundColor: '#FFF7ED', // Fundo papiro suave
      borderWidth: 1,
      borderColor: '#FFEDD5',
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1
    }}>
      {/* TÍTULO DO PAPIRO */}
      <Text style={{ fontSize: 14, fontWeight: '800', color: '#EA580C', marginBottom: 8 }}>
        📜 Regras Ativas da Modalidade:
      </Text>

      {/* 1. REGRA DA ATIVIDADE SELECIONADA (DINÂMICA) */}
      <View style={{ marginBottom: 6, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: '#FFEDD5' }}>
        <Text style={{ fontSize: 12, color: '#475569', fontWeight: '700', lineHeight: 18 }}>
          {renderRegraDinamica()}
        </Text>
      </View>

      {/* 2. LIMITES E TRAVAS FIXAS DA LIGA */}
      <View style={{ marginBottom: 4 }}>
        <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 3 }}>
          🚫 Limite Diário: Máximo de {config.tetoDiario} pontos por dia.
        </Text>
        
        {config.travaUmEnvioPorDia && (
          <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 3 }}>
            🔒 Envio Diário: Máximo de 1 envio por modalidade por dia.
          </Text>
        )}

        {(config.bonusInquebravelActive || config.bonusDespertaActive) && (
          <Text style={{ fontSize: 11, color: '#EA580C', fontWeight: '600' }}>
            {config.bonusInquebravelActive && `🪨 O Inquebrável (+${config.bonusInquebravel} pts se treinar todos os dias) `}
            {config.bonusDespertaActive && `| ⏰ O Desperta (+${config.bonusDesperta} pts se treinar antes das 06h)`}
          </Text>
        )}
      </View>

      {/* 3. MURAL DO ADMINISTRADOR (TEXTO LIVRE ATÉ 500 CARACTERES) */}
      {config.muralTexto && (
        <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: '#FFEDD5' }}>
          <Text style={{ fontSize: 11, color: '#9A3412', fontStyle: 'italic', lineHeight: 16 }}>
            💬 "{config.muralTexto}"
          </Text>
        </View>
      )}
    </View>
  );
}
