import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

async function compressImageToDataUrl(
  file: File,
  maxDim = 800,
  quality = 0.78,
  preserveTransparency = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ফাইল পড়া যায়নি'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('ছবি লোড করা যায়নি'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('ক্যানভাস পাওয়া যায়নি'));
          return;
        }
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const mime =
          preserveTransparency && (file.type === 'image/png' || file.type === 'image/webp' || file.type === 'image/svg+xml')
            ? 'image/png'
            : 'image/jpeg';

        let dataUrl = canvas.toDataURL(mime, quality);
        // Ensure strictly under Firestore 200KB safety threshold
        if (dataUrl.length > 180000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.65);
        }
        if (dataUrl.length > 180000) {
          reject(new Error('ছবির আকার অনেক বড়। অনুগ্রহ করে ছোট ছবি নির্বাচন করুন।'));
          return;
        }
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Upload timeout')), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export async function uploadImageAsset(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('অনুগ্রহ করে একটি বৈধ ছবি ফাইল নির্বাচন করুন।');
  }

  // Branding logos: fast, crisp local optimization so transparency & instant preview always work reliably
  if (folder === 'branding') {
    if (file.type === 'image/svg+xml' && file.size <= 100000) {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('লোগো পড়া যায়নি'));
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(file);
      });
    }
    return await compressImageToDataUrl(file, 360, 0.85, true);
  }

  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
  try {
    const storageRef = ref(storage, `${folder}/${safeName}`);
    await withTimeout(uploadBytes(storageRef, file), 3500);
    const url = await withTimeout(getDownloadURL(storageRef), 3500);
    return url;
  } catch {
    return await compressImageToDataUrl(file, 800, 0.72, false);
  }
}
