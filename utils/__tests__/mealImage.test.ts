import * as ImagePicker from 'expo-image-picker';

const mockExists = jest.fn(() => true);
const mockCreate = jest.fn();
const mockDelete = jest.fn();
const mockCopy = jest.fn();

jest.mock('expo-file-system', () => {
  const MockFile = jest.fn((...args: any[]) => ({
    uri: args.map((a: any) => (typeof a === 'string' ? a : a?.uri || '')).join('/'),
    exists: mockExists(),
    copy: mockCopy,
    delete: mockDelete,
  }));

  const MockDirectory = jest.fn((...args: any[]) => ({
    uri: args.map((a: any) => (typeof a === 'string' ? a : a?.uri || '')).join('/'),
    exists: mockExists(),
    create: mockCreate,
  }));

  return {
    File: MockFile,
    Directory: MockDirectory,
    Paths: {
      document: { uri: 'file:///mock/documents/' },
    },
  };
});

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn((uri: string) =>
    Promise.resolve({ uri: `compressed-${uri}` })
  ),
  SaveFormat: { JPEG: 'jpeg' },
}));

import {
  saveMealPhoto,
  getMealPhotoUri,
  deleteMealPhoto,
  pickMealPhoto,
  MEAL_PHOTOS_DIR,
} from '@/utils/mealImage';

describe('mealImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExists.mockReturnValue(true);
  });

  describe('MEAL_PHOTOS_DIR', () => {
    it('should be a non-empty string', () => {
      expect(MEAL_PHOTOS_DIR).toBeTruthy();
      expect(typeof MEAL_PHOTOS_DIR).toBe('string');
    });
  });

  describe('getMealPhotoUri', () => {
    it('returns a string URI for the filename', () => {
      const uri = getMealPhotoUri('meal-123.jpg');
      expect(typeof uri).toBe('string');
      expect(uri).toContain('meal-123.jpg');
    });
  });

  describe('saveMealPhoto', () => {
    it('creates the directory if it does not exist', async () => {
      mockExists.mockReturnValue(false);
      await saveMealPhoto('file:///tmp/photo.jpg');
      expect(mockCreate).toHaveBeenCalled();
    });

    it('does not create directory if it already exists', async () => {
      mockExists.mockReturnValue(true);
      await saveMealPhoto('file:///tmp/photo.jpg');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('copies the compressed file to destination', async () => {
      await saveMealPhoto('file:///tmp/photo.jpg');
      expect(mockCopy).toHaveBeenCalled();
    });

    it('returns only the filename (not full path)', async () => {
      const filename = await saveMealPhoto('file:///tmp/photo.jpg');
      expect(filename).toMatch(/^meal-[a-f0-9-]+\.jpg$/);
    });
  });

  describe('deleteMealPhoto', () => {
    it('deletes the file when it exists', async () => {
      mockExists.mockReturnValue(true);
      await deleteMealPhoto('meal-123.jpg');
      expect(mockDelete).toHaveBeenCalled();
    });

    it('does not delete when file does not exist', async () => {
      mockExists.mockReturnValue(false);
      await deleteMealPhoto('meal-123.jpg');
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });

  describe('pickMealPhoto', () => {
    it('returns uri when user picks a photo', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file:///picked/photo.jpg' }],
      });

      const result = await pickMealPhoto();
      expect(result).toBe('file:///picked/photo.jpg');
    });

    it('returns null when user cancels', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      const result = await pickMealPhoto();
      expect(result).toBeNull();
    });

    it('requests image media type with editing allowed', async () => {
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      await pickMealPhoto();
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaTypes: ['images'],
          allowsEditing: true,
        })
      );
    });
  });
});
