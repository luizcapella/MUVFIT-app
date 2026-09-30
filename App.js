// src/App.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { supabase } from './supabaseClient';

// Importação das Telas do Sistema
import DashboardScreen from './screens/DashboardScreen';
import RankingScreen from './screens/RankingScreen';
import AdminScreen from './screens/AdminScreen';
import FeedScreen from './screens/FeedScreen';
import ConfigScreen from './screens/ConfigScreen';

// Componentes Customizados Globais
const CustomPicker = ({ label, selectedValue, onValueChange, options }) => (
  <View style={styles.pickerContainer}>
    <Text style={styles.pickerLabel}>{label}</Text>
    <View style={styles.pickerWrapper}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.pickerOption, selectedValue === opt.value && styles.pickerOptionActive]}
          onPress={() => onValueChange(opt.value)}
        >
          <Text style={[styles.pickerOptionText, selectedValue === opt.value && styles.pickerOptionTextActive]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export default function App() {
  // --- ESTADOS DE NAVEGAÇÃO E SESSÃO ---
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // 'dashboard', 'ranking', 'feed', 'admin', 'config', 'atleta'
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- ESTADOS DE DADOS TIPO LIGA / DESAFIOS ---
  const [challenges, setChallenges] = useState([]);
  const [activeChallengeId, setActiveChallengeId] = useState('');
  const [memberships, setMemberships] = useState([]);

  // --- ESTADOS DE INTERAÇÃO FLUTUANTE DA CENTRAL DE BUSCA FIXA ---
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchFilter, setGlobalSearchFilter] = useState('Todos'); // 'Todos', 'Usuários', 'Ligas'
  const [globalSearchActive, setGlobalSearchActive] = useState(false);
  const [globalUsersList, setGlobalUsersList] = useState([]);
  const [globalSearchResults, setGlobalSearchResults] = useState({ users: [], leagues: [] });

  // --- ESTADOS AUXILIARES DE COMPONENTES ---
  const [athletePerfScope, setAthletePerfScope] = useState('global');
  const [isWeightChartModalOpen, setIsWeightChartModalOpen] = useState(false);
  const [newWeightValueInput, setNewWeightValueInput] = useState('');
  const [isModalityRadarModalOpen, setIsModalityRadarModalOpen] = useState(false);
  const [selectedModalityPeriod, setSelectedModalityPeriod] = useState('mes');
  const [isKmChartModalOpen, setIsKmChartModalOpen] = useState(false);
  const [selectedKmFilterActivity, setSelectedKmFilterActivity] = useState('Todos');
  const [selectedKmPeriod, setSelectedKmPeriod] = useState('mes');
  const [isTimeChartModalOpen, setIsTimeChartModalOpen] = useState(false);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('mes');
  // --- CARREGAMENTO DE ATLETAS PARA A CENTRAL DE BUSCA ---
  useEffect(() => {
    async function loadAllUsersForSearch() {
      try {
        const { data } = await supabase.from('profiles').select('id, nickname, avatar_url');
        if (data) setGlobalUsersList(data);
      } catch (err) {
        console.log('Erro ao pré-carregar atletas para pesquisa:', err);
      }
    }
    loadAllUsersForSearch();
  }, []);

  // --- REGRA DE ATUALIZAÇÃO DA PESQUISA DINÂMICA CONFORME FILTRO ---
  useEffect(() => {
    if (globalSearchQuery.trim()) {
      executeGlobalSearch(globalSearchQuery, globalSearchFilter);
    }
  }, [globalSearchFilter]);

  // Lógica principal que processa a digitação e monta as duas listas do overlay
  const executeGlobalSearch = (text, currentFilter) => {
    if (!text.trim()) {
      setGlobalSearchResults({ users: [], leagues: [] });
      setGlobalSearchActive(false);
      return;
    }

    setGlobalSearchActive(true);
    const term = text.toLowerCase();

    // 1. Filtra a lista de atletas cadastrados
    const matchedUsers = globalUsersList.filter(u => 
      u.nickname?.toLowerCase().includes(term)
    );

    // 2. Filtra a lista de ligas/desafios cadastrados
    const matchedLeagues = (challenges || []).filter(l => 
      l.name?.toLowerCase().includes(term) || l.title?.toLowerCase().includes(term)
    );

    setGlobalSearchResults({
      users: currentFilter === 'Ligas' ? [] : matchedUsers,
      leagues: currentFilter === 'Usuários' ? [] : matchedLeagues
    });
  };

  // --- CARREGAMENTO INICIAL DO FLUXO COMPLETO ---
  useEffect(() => {
    checkUserSession();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchDataFromSupabase();
    }
  }, [currentUser, activeChallengeId]);

  async function checkUserSession() {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setCurrentUser(session.user);
      } else {
        // Fallback estável de simulação local caso não haja sessão real iniciada
        setCurrentUser({ id: 'user_master_muvfit', email: 'admin@muvfit.com.br' });
      }
    } catch (err) {
      console.log('Erro de sessão:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchDataFromSupabase() {
    try {
      // Carrega os desafios ordenados por data de criação para blindar o layout
      const { data: chalData } = await supabase
        .from('challenges_v2')
        .select('*')
        .order('created_at', { ascending: true });

      if (chalData && chalData.length > 0) {
        setChallenges(chalData);
        if (!activeChallengeId) {
          setActiveChallengeId(chalData[0].id);
        }
      }

      // Carrega as inscrições e pontos do ranking associados
      const currentLeague = activeChallengeId || (chalData && chalData[0]?.id);
      if (currentLeague) {
        const { data: memData } = await supabase
          .from('league_memberships')
          .select('*')
          .eq('league_id', currentLeague);
        
        if (memData) setMemberships(memData);
      }
    } catch (err) {
      console.log('Erro nas consultas do Supabase:', err);
    }
  }
  // --- RENDERIZAÇÃO DA TELA DE CARREGAMENTO PRINCIPAL ---
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1e3a8a' }}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={{ color: '#FFFFFF', marginTop: 12, fontWeight: 'bold' }}>Carregando MuvFit...</Text>
      </View>
    );
  }

  // Captura o nome da liga ativa para passar filtros para as outras telas de forma mestre
  const selectedLeagueFilter = challenges?.find(c => c.id === activeChallengeId)?.name || '';

  return (
    <View style={styles.mainContainer}>
      
      {/* 🟦 1. FAIXA AZUL FIXA DO TOPO DO APP */}
      <View style={styles.topHeader}>
        <View style={styles.brandContainer}>
          <View>
            <Text style={styles.brandTitle}>MUVFIT</Text>
            <Text style={styles.brandSubtitle}>Mizan Soluções Técnicas</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>🚪 SAIR</Text>
          </TouchableOpacity>
        </View>

        {/* Seletor Dropdown Mestre de Desafios */}
        {challenges.length > 0 ? (
          <CustomPicker
            label="🎯 Desafio:"
            selectedValue={activeChallengeId}
            onValueChange={(val) => {
              setActiveChallengeId(val);
              // Limpa a busca ao trocar de desafio para não confundir o usuário
              setGlobalSearchQuery('');
              setGlobalSearchActive(false);
            }}
            options={challenges.map(c => ({
              label: c.name || c.title || 'Desafio',
              value: c.id
            }))}
          />
        ) : (
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>⏳ Carregando desafios disponíveis...</Text>
          </View>
        )}

        {/* 🔍 BARRA BRANCA DE PESQUISA - 100% FIXA E VISÍVEL SEMPRE */}
        <TextInput
          style={styles.globalSearchInput}
          placeholder="🔍 Pesquisar Atletas ou Ligas..."
          placeholderTextColor="#94a3b8"
          value={globalSearchQuery}
          onChangeText={(text) => {
            setGlobalSearchQuery(text);
            executeGlobalSearch(text, globalSearchFilter);
          }}
        />

        {/* 🟩 WINDOW OVERLAY (SÓ ABRE E FLUTUA POR CIMA DE TUDO SE HOUVER DIGITAÇÃO) */}
        {globalSearchActive && (
          <View style={styles.globalSearchOverlay}>
            <View style={styles.overlayHeader}>
              <Text style={styles.overlayTitle}>Resultados Encontrados</Text>
              <TouchableOpacity 
                style={styles.overlayCloseBtn}
                onPress={() => {
                  setGlobalSearchQuery('');
                  setGlobalSearchActive(false);
                  setGlobalSearchResults({ users: [], leagues: [] });
                }}
              >
                <Text style={styles.overlayCloseBtnText}>Fechar X</Text>
              </TouchableOpacity>
            </View>

            {/* Abas de Filtros de Tags dentro do Painel Flutuante */}
            <View style={styles.overlayTabsRow}>
              {['Todos', 'Usuários', 'Ligas'].map((filterName) => (
                <TouchableOpacity
                  key={filterName}
                  style={[
                    styles.overlayTabItem,
                    globalSearchFilter === filterName && styles.overlayTabItemActive
                  ]}
                  onPress={() => setGlobalSearchFilter(filterName)}
                >
                  <Text style={[
                    styles.overlayTabText,
                    globalSearchFilter === filterName && styles.overlayTabTextActive
                  ]}>
                    {filterName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Lista Rolável de Resultados Reais do Banco de Dados */}
            <ScrollView style={styles.overlayResultsScroll} nestedScrollEnabled={true}>
              
              {/* Resultados de Ligas / Desafios */}
              {globalSearchResults.leagues.map((liga) => (
                <TouchableOpacity 
                  key={liga.id} 
                  style={styles.overlayResultRow}
                  onPress={() => {
                    // 1. Altera a liga ativa no topo
                    setActiveChallengeId(liga.id);
                    // 2. Redireciona o usuário para a tela de Classificação/Ranking
                    setCurrentScreen('ranking');
                    // 3. Fecha o painel flutuante e limpa o texto
                    setGlobalSearchQuery('');
                    setGlobalSearchActive(false);
                  }}
                >
                  <Text style={styles.overlayResultText}>🏆 {liga.name || liga.title}</Text>
                  <Text style={styles.overlayActionLabel}>Ver Ranking →</Text>
                </TouchableOpacity>
              ))}

              {/* Resultados de Atletas / Usuários */}
              {globalSearchResults.users.map((user) => (
                <TouchableOpacity 
                  key={user.id} 
                  style={styles.overlayResultRow}
                  onPress={() => {
                    // 1. Salva o ID do atleta selecionado para travar o modo leitura
                    setSelectedProfileId(user.id);
                    // 2. Navega para a Central do Atleta
                    setCurrentScreen('atleta');
                    // 3. Fecha o painel flutuante e limpa o texto
                    setGlobalSearchQuery('');
                    setGlobalSearchActive(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Image 
                      source={{ uri: user.avatar_url || 'https://placeholder.com' }} 
                      style={styles.overlayUserAvatar} 
                    />
                    <Text style={styles.overlayResultText}>👤 {user.nickname || 'Atleta'}</Text>
                  </View>
                  <Text style={[styles.overlayActionLabel, { color: '#1e3a8a' }]}>Ver Perfil →</Text>
                </TouchableOpacity>
              ))}

              {/* Mensagem de nenhum dado encontrado */}
              {globalSearchResults.users.length === 0 && globalSearchResults.leagues.length === 0 && (
                <Text style={styles.overlayNoResults}>Nenhum registro encontrado para a busca.</Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ⬜ 2. ÁREA BRANCA DE CONTEÚDO DINÂMICO (CORPO DO APP) */}
      <View style={styles.contentBody}>
        {/* ROTA DA CENTRAL DO ATLETA DO PRÓPRIO USUÁRIO (HOME) */}
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            currentUser={currentUser}
            athletePerfScope={athletePerfScope}
            setAthletePerfScope={setAthletePerfScope}
            setIsWeightChartModalOpen={setIsWeightChartModalOpen}
            setNewWeightValueInput={setNewWeightValueInput}
            setIsModalityRadarModalOpen={setIsModalityRadarModalOpen}
            setSelectedModalityPeriod={setSelectedModalityPeriod}
            setIsKmChartModalOpen={setIsKmChartModalOpen}
            setSelectedKmFilterActivity={setSelectedKmFilterActivity}
            setSelectedKmPeriod={setSelectedKmPeriod}
            setIsTimeChartModalOpen={setIsTimeChartModalOpen}
            setSelectedTimePeriod={setSelectedTimePeriod}
            selectedLeagueFilter={selectedLeagueFilter}
            fetchDataFromSupabase={fetchDataFromSupabase}
            selectedProfileId={null} // null garante que abre o perfil do próprio dono logado
          />
        )}

        {/* ROTA DA CENTRAL DO ATLETA EM MODO VISUALIZAÇÃO PÚBLICA (LINK CLICADO) */}
        {currentScreen === 'atleta' && (
          <DashboardScreen
            currentUser={currentUser}
            athletePerfScope={athletePerfScope}
            setAthletePerfScope={setAthletePerfScope}
            setIsWeightChartModalOpen={setIsWeightChartModalOpen}
            setNewWeightValueInput={setNewWeightValueInput}
            setIsModalityRadarModalOpen={setIsModalityRadarModalOpen}
            setSelectedModalityPeriod={setSelectedModalityPeriod}
            setIsKmChartModalOpen={setIsKmChartModalOpen}
            setSelectedKmFilterActivity={setSelectedKmFilterActivity}
            setSelectedKmPeriod={setSelectedKmPeriod}
            setIsTimeChartModalOpen={setIsTimeChartModalOpen}
            setSelectedTimePeriod={setSelectedTimePeriod}
            selectedLeagueFilter={selectedLeagueFilter}
            fetchDataFromSupabase={fetchDataFromSupabase}
            selectedProfileId={selectedProfileId} // Injeta o ID clicado no ranking ou na busca para ocultar as edições
          />
        )}

        {/* ROTA DA TELA DE CLASSIFICAÇÃO / RANKING DA LIGA ATIVA */}
        {currentScreen === 'ranking' && (
          <RankingScreen
            memberships={memberships}
            currentUser={currentUser}
            selectedLeagueFilter={selectedLeagueFilter} // Entrega a liga do dropdown para isolar as pontuações e botões
            onNavigateToProfile={(targetUserId) => {
              setSelectedProfileId(targetUserId);
              setCurrentScreen('atleta');
            }}
          />
        )}

        {/* ROTA DA TELA DO FEED DE FOTOS E POSTAGENS DA LIGA */}
        {currentScreen === 'feed' && (
          <FeedScreen
            currentUser={currentUser}
            selectedLeagueFilter={selectedLeagueFilter} // Garante o isolamento das fotos e comentários da liga ativa
          />
        )}

        {/* ROTA DO PAINEL DO ADMINISTRADOR (GERENCIAMENTO ISOLADO) */}
        {currentScreen === 'admin' && (
          <AdminScreen
            currentUser={currentUser}
            challenges={challenges}
            selectedLeagueFilter={selectedLeagueFilter} // Entrega o dropdown para isolar as abas de membros e convites
            fetchDataFromSupabase={fetchDataFromSupabase}
          />
        )}

        {/* ROTA DA TELA DE CONFIGURAÇÕES DO SISTEMA */}
        {currentScreen === 'config' && (
          <ConfigScreen
            currentUser={currentUser}
          />
        )}

      </View> {/* Fim do contentBody */}

      {/* 🧭 3. BARRA DE NAVEGAÇÃO COMPLETA FIXA NO RODAPÉ */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, currentScreen === 'dashboard' && styles.navItemActive]} 
          onPress={() => setCurrentScreen('dashboard')}
        >
          <Text style={[styles.navIcon, currentScreen === 'dashboard' && styles.navIconActive]}>👤</Text>
          <Text style={[styles.navText, currentScreen === 'dashboard' && styles.navTextActive]}>Atleta</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, currentScreen === 'ranking' && styles.navItemActive]} 
          onPress={() => setCurrentScreen('ranking')}
        >
          <Text style={[styles.navIcon, currentScreen === 'ranking' && styles.navIconActive]}>🏆</Text>
          <Text style={[styles.navText, currentScreen === 'ranking' && styles.navTextActive]}>Ligas</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, currentScreen === 'feed' && styles.navItemActive]} 
          onPress={() => setCurrentScreen('feed')}
        >
          <Text style={[styles.navIcon, currentScreen === 'feed' && styles.navIconActive]}>🔥</Text>
          <Text style={[styles.navText, currentScreen === 'feed' && styles.navTextActive]}>Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, currentScreen === 'admin' && styles.navItemActive]} 
          onPress={() => setCurrentScreen('admin')}
        >
          <Text style={[styles.navIcon, currentScreen === 'admin' && styles.navIconActive]}>🛡️</Text>
          <Text style={[styles.navText, currentScreen === 'admin' && styles.navTextActive]}>Admin</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, currentScreen === 'config' && styles.navItemActive]} 
          onPress={() => setCurrentScreen('config')}
        >
          <Text style={[styles.navIcon, currentScreen === 'config' && styles.navIconActive]}>⚙️</Text>
          <Text style={[styles.navText, currentScreen === 'config' && styles.navTextActive]}>Config</Text>
        </TouchableOpacity>
      </View>

    </View> // Fim do mainContainer principal
  );
} // Fim da função export default function App()
// --- 🎨 DEFINIÇÕES DE ESTILO REAIS DE TODO O ECOSSISTEMA MUVFIT ---
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Fundo cinza claro confortável do app
  },
  
  // Estilos da Faixa Azul Fixa Superior
  topHeader: {
    backgroundColor: '#1E3A8A', // Azul escuro oficial
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 9999, // Mantém a faixa azul mestre sempre empilhada no topo
    elevation: 6,
  },
  brandContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'black',
    letterSpacing: 1,
  },
  brandSubtitle: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: 'medium',
  },
  logoutBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // 🔍 INPUT DA BARRA BRANCA FIXA (IGUAL À FOTO DE REFERÊNCIA)
  globalSearchInput: {
    width: '100%',
    height: 38,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 12,
    fontSize: 13,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },

  // 🟩 WINDOW OVERLAY (PAINEL FLUTUANTE QUE SOBREPOE OS CARDS ABAIXO)
  globalSearchOverlay: {
    position: 'absolute',
    top: 154, // Posiciona cirurgicamente logo abaixo da barra branca fixa
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 10000, // Força a janela a flutuar por cima de qualquer elemento
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 6.68,
    elevation: 12, // Sombra física projetada no Android por cima do conteúdo branco
  },
  overlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 6,
  },
  overlayTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  overlayCloseBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overlayCloseBtnText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: 'bold',
  },
  overlayTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  overlayTabItem: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  overlayTabItemActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  overlayTabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
  },
  overlayTabTextActive: {
    color: '#FFFFFF',
  },
  overlayResultsScroll: {
    maxHeight: 220, // Limita a janela de rolagem para não cobrir a tela inteira
    width: '100%',
  },
  overlayResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  overlayResultText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  overlayActionLabel: {
    fontSize: 11,
    color: '#F97316',
    fontWeight: 'bold',
  },
  overlayUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
  },
  overlayNoResults: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },

  // Área Branca Principal
  contentBody: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    zIndex: 1, // Fica na camada base para sofrer a sobreposição da pesquisa
  },

  // Estilos Globais do Dropdown
  pickerContainer: {
    width: '100%',
    marginTop: 4,
  },
  pickerLabel: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pickerWrapper: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  pickerOptionActive: {
    backgroundColor: '#1E3A8A',
  },
  pickerOptionText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pickerOptionTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    width: '100%',
    padding: 10,
    backgroundColor: '#111827',
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'medium',
  },

  // Estilos da Barra de Navegação Inferior (Rodapé)
  bottomNav: {
    flexDirection: 'row',
    height: 58,
    backgroundColor: '#1E3A8A',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E40AF',
    elevation: 8,
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.65,
  },
  navItemActive: {
    opacity: 1,
  },
  navIcon: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  navIconActive: {
    color: '#FFFFFF',
  },
  navText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginTop: 2,
  },
  navTextActive: {
    color: '#FFFFFF',
  },
});
