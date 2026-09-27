// src/components/ImageService.js
import { Platform, Alert } from 'react-native';

export const handleTriggerPhoto = async (mode, setter) => {
  // Se estiver rodando no navegador (Web / Vercel)
  if (Platform.OS === 'web') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    if (mode === 'camera') {
      input.setAttribute('capture', 'environment');
    }

    input.onchange = (e) => {
      const file = e.target.files[0]; // Corrigido para pegar o primeiro arquivo
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          setter(reader.result);
        };
        reader.readAsDataURL(file);
      }
    };

    input.style.display = 'none';
    document.body.appendChild(input);
    input.click();
    setTimeout(() => {
      document.body.removeChild(input);
    }, 1000);
  } else {
    // Se estiver rodando nativo no celular (APK)
    // Mensagem amigável enquanto você não adiciona o expo-image-picker no futuro
    Alert.alert(
      '📷 Câmera / Mídia',
      mode === 'camera' ? 'Abrindo a câmera do celular...' : 'Abrindo a galeria do celular...'
    );
  }
};
