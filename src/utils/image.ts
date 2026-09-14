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
