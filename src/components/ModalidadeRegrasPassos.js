import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function ModalidadeRegrasPassos({ selectedRuleTab, states }) {
  // Controle local para saber se o dropdown do multiplicador está aberto
  const [openDropdown, setOpenDropdown] = useState(false);

  // Trava de Segurança: Se a aba atual não for Passos Diários, fica invisível
  if (selectedRuleTab !== 'Passos Diários' || !states) {
    return null;
  }

  const multiplicadores = ['0.1', '0.2', '0.3', '0.4', '0.5', '0.6', '0.7', '0.8', '0.9', '1.0'];

  return (
    <View style={{ marginTop: 16, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E3A8A', marginBottom: 12, textTransform: 'uppercase' }}>
        Regras de Pontuação: Passos Diários
      </Text>

      {/* 👣 ITEM A: MULTIPLICADOR DE PASSOS */}
      <View style={{ backgroundColor: '#FFFFFF', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => states.setPassosMultEnabled(!states.passosMultEnabled)}
            style={{ 
              width: 18, 
              height: 18, 
              borderWidth: 1.5, 
              borderColor: '#1E3A8A', 
              borderRadius: 4, 
              justifyContent: 'center', 
              alignItems: 'center', 
              backgroundColor: states.passosMultEnabled ? '#1E3A8A' : 'transparent' 
            }}
          >
            {states.passosMultEnabled && <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }}>✓</Text>}
          </TouchableOpacity>
          <Text style={{ fontSize: 13, color: '#334155', marginLeft: 8, fontWeight: '600' }}>
            a. Por Multiplicador de Passos
          </Text>
        </View>

        {/* Detalhamento do Dropdown Seletor (Só expande se habilitado) */}
        {states.passosMultEnabled && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginTop: 10, 
            paddingTop: 8, 
            borderTopWidth: 0.5, 
            borderTopColor: '#E2E8F0',
            zIndex: 999
          }}>
            <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>
              Selecione o Multiplicador:
            </Text>

            {/* SELETOR DROPDOWN PERSONALIZADO FLUTUANTE */}
            <View style={{ position: 'relative', width: 80 }}>
              <TouchableOpacity
                onPress={() => setOpenDropdown(!openDropdown)}
                style={{ 
                  height: 32, 
                  borderWidth: 1, 
                  borderColor: '#CBD5E1', 
                  borderRadius: 4, 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  backgroundColor: '#F8FAFC' 
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E3A8A' }}>
                  x{states.passosMultValue}
                </Text>
              </TouchableOpacity>

              {openDropdown && (
                <View style={{ 
                  position: 'absolute', 
                  top: 34, 
                  right: 0, 
                  width: 80, 
                  maxHeight: 180,
                  backgroundColor: '#FFFFFF', 
                  borderWidth: 1, 
                  borderColor: '#CBD5E1', 
                  borderRadius: 4, 
                  shadowColor: '#000', 
                  shadowOffset: { width: 0, height: 2 }, 
                  shadowOpacity: 0.2, 
                  shadowRadius: 2, 
                  elevation: 5, 
                  zIndex: 99999,
                  overflow: 'scroll'
                }}>
                  {multiplicadores.map((mult) => (
                    <TouchableOpacity
                      key={mult}
                      onPress={() => {
                        states.setPassosMultValue(mult);
                        setOpenDropdown(false);
                      }}
                      style={{ 
                        paddingVertical: 8, 
                        alignItems: 'center', 
                        backgroundColor: states.passosMultValue === mult ? '#F0F5FF' : 'transparent',
                        borderBottomWidth: mult !== '1.0' ? 0.5 : 0,
                        borderBottomColor: '#E2E8F0'
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: states.passosMultValue === mult ? '700' : '400', color: '#334155' }}>
                        x{mult}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
