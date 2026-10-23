import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

// Justificatifs photo : copiés dans le dossier de l'application pour survivre au nettoyage du cache.
// Le champ photo d'une ligne contient l'adresse de ce fichier.

const photosDir = () => {
  const dir = new Directory(Paths.document, 'photos');
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
};

/** Copie une photo (appareil ou galerie) dans le dossier de l'application ; renvoie sa nouvelle adresse. */
export async function keepPhoto(sourceUri: string): Promise<string> {
  const target = new File(photosDir(), `${randomUUID()}.jpg`);
  await new File(sourceUri).copy(target);
  return target.uri;
}

/** Supprime une photo de l'application (sans effet sur une photo hors du dossier). */
export function discardPhoto(uri: string | null | undefined): void {
  if (!uri || !uri.startsWith(photosDir().uri)) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}

