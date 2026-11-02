import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';

export default function TreinoCalendarioModal({ isOpen, onClose, dadosSupabase = [] }) {
  const dataSistema = new Date();
  const [mesVisivel, setMesVisivel] = useState(dataSistema.getMonth()); // 0 = Jan, 11 = Dez
  const [anoVisivel, setAnoVisivel] = useState(dataSistema.getFullYear());

  if (!isOpen) return null;

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const diasSemanaLabel = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Engenharia Cronológica: Calcula quantos dias tem o mês e em qual dia da semana ele começa
  const primeiroDiaDoMes = new Date(anoVisivel, mesVisivel, 1).getDay(); // 0 = Domingo, 1 = Segunda...
  const totalDiasNoMes = new Date(anoVisivel, mesVisivel + 1, 0).getDate();

  // Controles de navegação retroativa e progressiva dos meses
  const navegarParaMesAnterior = () => {
    if (mesVisivel === 0) {
      setMesVisivel(11);
      setAnoVisivel(anoVisivel - 1);
    } else {
      setMesVisivel(mesVisivel - 1);
    }
  };

  const navegarParaProximoMes = () => {
    if (mesVisivel === 11) {
      setMesVisivel(0);
      setAnoVisivel(anoVisivel + 1);
    } else {
      setMesVisivel(mesVisivel + 1);
    }
  };

  // Montagem da grade matemática: Cria os blocos vazios para alinhar o início do mês na semana correta
  const blocosGradeCalendario = [];
  for (let i = 0; i < primeiroDiaDoMes; i++) {
    blocosGradeCalendario.push({ id: `vazio-${i}`, diaNum: null });
  }
  for (let d = 1; d <= totalDiasNoMes; d++) {
    blocosGradeCalendario.push({ id: `dia-${d}`, diaNum: d });
  }
  // Mapeia e cruza as datas dos treinos que virão do banco de dados futuramente
  // Formato esperado do Supabase no campo 'date': "YYYY-MM-DD"
  const obterStatusDoDia = (diaNum) => {
    if (!diaNum) return null;
    
    // Formata o dia corrente com dois dígitos para bater com o banco de dados
    const diaFormatado = String(diaNum).padStart(2, '0');
    const mesFormatado = String(mesVisivel + 1).padStart(2, '0');
    const dataChaveStr = `${anoVisivel}-${mesFormatado}-${diaFormatado}`;

    // Varre a lista real procurando se o atleta treinou nesse dia específico
    const treinosDesseDia = dadosSupabase.filter(t => t.date === dataChaveStr);

    if (treinosDesseDia.length === 0) return 'nenhum';

    // Se houver algum treino que contenha 'Passos Diários', ganha destaque azul de passos
    const temPassos = treinosDesseDia.some(t => t.activity && t.activity.includes('Passos Diários'));
    if (temPassos && treinosDesseDia.length === 1) return 'passos';

    // Dias normais de treinos de força/cárdio ganham destaque verde de meta batida
    return 'treinado';
  };

  const totalDiasTreinadosNoMes = blocosGradeCalendario.filter(b => b.diaNum && obterStatusDoDia(b.diaNum) === 'treinado').length;
  return (
    <Modal transparent={true} visible={isOpen} onRequestClose={onClose} animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 390, padding: 16, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20 }}>
          
          {/* CABEÇALHO DO CALENDÁRIO */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E3A8A', padding: 12, borderRadius: 8, marginBottom: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>📆 Calendário de Consistência</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* CONTROLE CONTRA-SETA DE NAVEGAÇÃO DE MESES */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 }}>
            <TouchableOpacity onPress={navegarParaMesAnterior} style={{ backgroundColor: '#F1F5F9', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#334155' }}>◀ Voltar</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E3A8A' }}>
              {nomesMeses[mesVisivel]} de {anoVisivel}
            </Text>
            <TouchableOpacity onPress={navegarParaProximoMes} style={{ backgroundColor: '#F1F5F9', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#334155' }}>Avançar ▶</Text>
            </TouchableOpacity>
          </View>

          {/* MATRIZ DE DIAS DA SEMANA (DOM A SÁB) */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
            {diasSemanaLabel.map((lbl) => (
              <View key={`lbl-${lbl}`} style={{ width: '14.28%', alignItems: 'center', paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B' }}>{lbl}</Text>
              </View>
            ))}
          </View>

          {/* MATRIZ DINÂMICA DE DIAS DO MÊS (GRADE GRID FLUIDA VIA FLEXBOX) */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 6, marginBottom: 14 }}>
            {blocosGradeCalendario.map((bloco, idx) => {
              const status = obterStatusDoDia(bloco.diaNum);
              
              // Engenharia Cromática dos Quadradinhos baseada no status real de treinos
              let bgDia = 'transparent';
              let corTexto = '#334155';
              let bordaDia = 'transparent';

              if (bloco.diaNum) {
                if (status === 'treinado') {
                  bgDia = '#DCFCE7'; corTexto = '#15803D'; bordaDia = '#86EFAC';
                } else if (status === 'passos') {
                  bgDia = '#EFF6FF'; corTexto = '#1D4ED8'; bordaDia = '#93C5FD';
                } else {
                  bgDia = '#F8FAFC'; corTexto = '#475569'; bordaDia = '#E2E8F0';
                }
              }

              return (
                <View key={`dia-box-${idx}`} style={{ width: '14.28%', aspectRatio: 1, padding: 3, justifyContent: 'center', alignItems: 'center' }}>
                  {bloco.diaNum ? (
                    <View style={{ width: '100%', height: '100%', backgroundColor: bgDia, borderRadius: 8, borderWidth: 1, borderColor: bordaDia, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: corTexto }}>{bloco.diaNum}</Text>
                    </View>
                  ) : (
                    <View style={{ width: '100%', height: '100%' }} />
                  )}
                </View>
              );
            })}
          </View>

          {/* RESUMO ESTÁTICO DE ACUMULADOS DO MÊS VIGENTE */}
          <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 8, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#64748B' }}>Dias com Treino</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#16A34A' }}>{totalDiasTreinadosNoMes} dias</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#E2E8F0' }} />
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#64748B' }}>Frequência Geral</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E3A8A' }}>
                {totalDiasNoMes > 0 ? Math.round((totalDiasTreinadosNoMes / totalDiasNoMes) * 100) : 0}%
              </Text>
            </View>
          </View>

        </View>
      </View>
    </Modal>
  );
}
