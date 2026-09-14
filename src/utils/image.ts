import { Platform } from 'react-native';

// On web the photo picker hands back a `blob:` URL, which only lives as long
// as the document — reload the PWA and the saved photo is a dead link. The fix
// is to keep the actual bytes, but on web the whole app store is localStorage,
// about 5 MB for everything including streaks and habits. So the bytes have to
// be small: 512px on the long edge at JPEG 0.6 lands around 30-50 KB, roughly
// 45-70 KB once base64 inflates it. That's deliberately aggressive — this is a
// day-to-day progress snapshot shown in a 330px-wide box, not an album.
const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.6;

export async function downscaleImage(uri: string): Promise<string> {
  // Native file:// URIs already live on disk, survive restarts on their own,
  // and answer to no quota. Nothing to do there.
  if (Platform.OS !== 'web' || typeof document === 'undefined') return uri;

  try {
    const blob = await (await fetch(uri)).blob();
    const source = await decodeImage(blob);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(source.width, source.height));
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return uri;
    ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);
    if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) source.close();

    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } catch {
    // A photo that won't survive a reload still beats no photo at all.
    return uri;
  }
}

async function decodeImage(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  // Phone photos carry an EXIF rotation flag. createImageBitmap is the one
  // decoder that can be told to apply it, so portrait shots don't come back
  // lying on their side; the <img> path is the fallback where it's missing.
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' });
    } catch {
      // fall through to the <img> decoder
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Décodage de l'image impossible"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Turns a local image URI (file://, blob:, or data: — covers native and
// web) into raw base64 + its mime type, for handing to an API that wants
// base64 image data rather than a URI. `fetch` + `Blob` works across all
// three URI schemes in Expo/RN, so no extra native module is needed.
export async function uriToBase64(uri: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const mimeType = blob.type || 'image/jpeg';
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
  return { base64, mimeType };
}
