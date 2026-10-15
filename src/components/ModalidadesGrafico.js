import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export default function ModalidadesGrafico({ isOpen, onClose, dadosSupabase = [] }) {
  const [periodoSelecionado, setPeriodoSelecionado] = useState('atual');

  if (!isOpen) return null;

  // 1. GERAÇÃO DINÂMICA DE FILTROS TEMPORAIS SEM NENHUM DADO FIXO
  const dataAtual = new Date();
  const anoAtual = dataAtual.getFullYear();
  const mesAtual = dataAtual.getMonth();

  const nomesMeses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const opcoesMesesDinamicos = [];
  for (let m = 0; m <= mesAtual; m++) {
    opcoesMesesDinamicos.push({ valor: `${m + 1}-${anoAtual}`, label: `📅 ${nomesMeses[m]} / ${anoAtual}` });
  }

  // Lista mestre com as 8 modalidades oficiais e suas respectivas cores
  const mapaModalidadesOficiais = [
    { nome: '💪 Musculação', cor: '#3B82F6' },
    { nome: '🏋️ Crossfit/Funcional', cor: '#22C55E' },
    { nome: '🔥 Aeróbico', cor: '#EAB308' },
    { nome: '🏃 Corrida', cor: '#EF4444' },
    { nome: '🚶 Caminhada', cor: '#F97316' },
    { nome: '🚴 Bike', cor: '#A855F7' },
    { nome: '🥋 Lutas/Individuais', cor: '#0D9488' },
    { nome: '⚽ Esportes Coletivos', cor: '#78350F' }
  ];

  // Filtragem estrita: retira 'Passos Diários'
  const treinosValidos = dadosSupabase.filter(
    t => t.activity && !t.activity.includes('Passos Diários')
  );

  const totalTreinos = treinosValidos.length;
  const contagemModalidades = {};

  treinosValidos.forEach((t) => {
    const nomeModalidade = t.activity ? t.activity.trim() : '';
    if (nomeModalidade) {
      contagemModalidades[nomeModalidade] = (contagemModalidades[nomeModalidade] || 0) + 1;
    }
  });

  // Garante que todas as 8 modalidades apareçam marcando 0% caso não existam dados
  const distribuicaoPraticas = mapaModalidadesOficiais.map((item) => {
    const qtd = contagemModalidades[item.nome] || 0;
    const porc = totalTreinos > 0 ? Math.round((qtd / totalTreinos) * 100) : 0;
    return {
      nome: item.nome,
      porcentagem: porc,
      cor: item.cor
    };
  });

  let gradientePizza = '#CBD5E1 0% 100%';
  if (totalTreinos > 0) {
    let acumulado = 0;
    gradientePizza = distribuicaoPraticas
      .filter(f => f.porcentagem > 0)
      .map((fatia) => {
        const inicio = acumulado;
        acumulado += fatia.porcentagem;
        return `${fatia.cor} ${inicio}% ${acumulado}%`;
      }).join(', ');
  }

  return (
    /* 🔴 BLINDAGEM WEB MESTRE: IGNORA FILTROS ANTERIORES E SOBREPÕE AS BORDAS AZUIS */
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999999999, // Elevado ao extremo global
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      {/* CORPO DO MODAL */}
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 420, padding: 16, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 15 }}>
        
        {/* CABEÇALHO */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E3A8A', padding: 12, borderRadius: 8, marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>📊 Resumo de Exercícios</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF' }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 1. SELETOR DE PERÍODO TOTALMENTE AUTOMATIZADO E DINÂMICO */}
        <View style={{ borderWidth: 1, borderColor: '#F97316', borderRadius: 8, padding: 4, marginBottom: 20, backgroundColor: '#FFFFFF' }}>
          <Text style={{ position: 'absolute', top: -8, left: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 4, fontSize: 10, color: '#F97316', fontWeight: '700', zIndex: 10 }}>
            Selecione o Período
          </Text>
          <select
            value={periodoSelecionado}
            onChange={(e) => setPeriodoSelecionado(e.target.value)}
            style={{ width: '100%', border: 'none', backgroundColor: 'transparent', padding: '6px', fontSize: '13px', fontWeight: '600', color: '#334155', outline: 'none', cursor: 'pointer' }}
          >
            <optgroup label="🏆 Ligas Disponíveis">
              <option value="atual">📅 Período: Atual da Liga</option>
              <option value="anterior">📅 Período: Liga Anterior</option>
            </optgroup>
            
            <optgroup label="📆 Filtro Mensal Progressivo">
              {opcoesMesesDinamicos.map((opt) => (
                <option key={opt.valor} value={opt.valor}>{opt.label}</option>
              ))}
            </optgroup>
            
            <optgroup label="📊 Consolidado Anual Automático">
              <option value={`geral-${anoAtual}`}>📊 Geral / {anoAtual}</option>
            </optgroup>
          </select>
        </View>

        <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155', textAlign: 'center', marginBottom: 16 }}>
          Distribuição de Práticas
        </Text>

        {/* 2. GRÁFICO PIZZA EM BRANCO/CINZA NEUTRO */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <div style={{
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            backgroundImage: `conic-gradient(${gradientePizza})`,
            boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05), 0 4px 6px -1px rgba(0,0,0,0.1)'
          }} />
        </View>

        {/* 3. LEGENDAS COLORIDAS FIXAS COM AS 8 MODALIDADES EXIBINDO 0% */}
        <ScrollView style={{ maxHeight: 160 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 6 }}>
            {distribuicaoPraticas.map((fatia, index) => (
              <View key={`leg-${index}`} style={{ flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 6 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: fatia.cor, marginRight: 6 }} />
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600' }} numberOfLines={1}>
                  {fatia.nome} ({fatia.porcentagem}%)
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

      </View>
    </div>
  );
}
