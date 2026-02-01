import { File, Directory, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export const MEAL_PHOTOS_DIR = 'meal-photos/';

const MAX_DIMENSION = 1024;
const COMPRESSION_QUALITY = 0.7;

function getPhotosDir(): Directory {
  return new Directory(Paths.document, MEAL_PHOTOS_DIR);
}

function validateFilename(filename: string): void {
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    throw new Error('Invalid filename');
  }
}

/** Reconstruct full URI from a stored filename. */
export function getMealPhotoUri(filename: string): string {
  validateFilename(filename);
  return new File(getPhotosDir(), filename).uri;
}

/**
 * Compress, copy image to persistent storage, return the filename only.
 * Store only the filename in the DB (iOS sandbox paths change between launches).
 */
export async function saveMealPhoto(sourceUri: string): Promise<string> {
  const dir = getPhotosDir();
  if (!dir.exists) {
    dir.create();
  }

  // Compress and resize
  const compressed = await manipulateAsync(
    sourceUri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: COMPRESSION_QUALITY, format: SaveFormat.JPEG }
  );

  const filename = `meal-${Crypto.randomUUID()}.jpg`;
  const source = new File(compressed.uri);
  const dest = new File(dir, filename);
  source.copy(dest);

  return filename;
}

/** Delete a meal photo from the filesystem. */
export async function deleteMealPhoto(filename: string): Promise<void> {
  validateFilename(filename);
  const file = new File(getPhotosDir(), filename);
  if (file.exists) {
    file.delete();
  }
}

/** Open the image library picker. Returns the picked URI or null if cancelled. */
export async function pickMealPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: COMPRESSION_QUALITY,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return result.assets[0].uri;
}
