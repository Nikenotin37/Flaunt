import * as ImageManipulator from 'expo-image-manipulator';

export const validateImage = async (uri: string): Promise<boolean> => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    // Check if the size exceeds 5MB
    if (blob.size > 5 * 1024 * 1024) {
      console.warn("Image exceeds 5MB limit.");
      return false;
    }

    return allowedTypes.includes(blob.type);
  } catch (error) {
    console.error("Error validating image magic bytes:", error);
    return false;
  }
};

export const compressImage = async (uri: string): Promise<string | null> => {
  try {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200, height: 1200 } }], // Scales proportionally if we only provide one dimension, but we can set both or use the larger dimension
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulated.uri;
  } catch (error) {
    console.error("Error compressing image:", error);
    return null;
  }
};
