import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

import { keepPhoto } from '@/services/photos';

import { useLock } from '../security/lockStore';

// Photo réduite (qualité 0,5, sans métadonnées) : un ticket reste lisible et pèse peu sur un petit téléphone.
const OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.5, exif: false, allowsEditing: false };

/** Prise de photo ou choix dans la galerie, copie dans le dossier de l'application. */
export function usePhotoPicker() {
  const setLockBusy = useLock((s) => s.setBusy);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  const run = async (source: 'camera' | 'gallery'): Promise<string | null> => {
    setBusy(true);
    setDenied(false);
    // L'appareil photo passe l'application en arrière-plan : pas de reverrouillage pendant ce temps.
    setLockBusy(true);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setDenied(true);
          return null;
        }
      }
      const result =
        source === 'camera' ? await ImagePicker.launchCameraAsync(OPTIONS) : await ImagePicker.launchImageLibraryAsync(OPTIONS);
      const asset = result.canceled ? undefined : result.assets[0];
      return asset ? await keepPhoto(asset.uri) : null;
    } finally {
      setLockBusy(false);
      setBusy(false);
    }
  };

  return { busy, denied, takePhoto: () => run('camera'), pickPhoto: () => run('gallery') };
}
