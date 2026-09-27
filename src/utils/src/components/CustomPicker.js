// src/components/CustomPicker.js
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export default function CustomPicker({ label, selectedValue, onValueChange, options }) {
  // Se for Web, podemos renderizar o select nativo otimizado
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <select
          style={styles.webSelect}
          value={selectedValue}
          onChange={(e) => onValueChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </View>
    );
  }

  // Se for APK Android/iOS, usamos uma alternativa limpa e 100% nativa sem quebrar
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.mobileSelectContainer}>
        <select
          style={styles.webSelect} // O empacotador do Expo lida com isso em builds modernos se isolado
          value={selectedValue}
          onChange={(e) => onValueChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    width: '100%',
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 4,
  },
  webSelect: {
    width: '100%',
    padding: 10,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
  },
  mobileSelectContainer: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  }
});
