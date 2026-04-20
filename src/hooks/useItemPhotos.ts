import { useLiveQuery } from 'dexie-react-hooks';
import { db, type ItemPhoto } from '../db';

export function useItemPhotos(itemId: string | undefined | null): ItemPhoto[] {
  const photos = useLiveQuery(
    () =>
      itemId
        ? db.itemPhotos.where('itemId').equals(itemId).toArray()
        : Promise.resolve([] as ItemPhoto[]),
    [itemId]
  );
  return photos ?? [];
}

const MAX_DIM = 1600;
const JPEG_QUALITY = 0.82;

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

async function resizeImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height / width) * MAX_DIM);
          width = MAX_DIM;
        } else {
          width = Math.round((width / height) * MAX_DIM);
          height = MAX_DIM;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => reject(new Error('Image decode failed'));
    img.src = dataUrl;
  });
}

export async function addItemPhoto(itemId: string, projectId: string, file: File): Promise<ItemPhoto> {
  const raw = await fileToDataUrl(file);
  const resized = await resizeImage(raw);
  const record: ItemPhoto = {
    id: crypto.randomUUID(),
    itemId,
    projectId,
    dataUrl: resized,
    takenAt: new Date().toISOString(),
    createdAt: Date.now(),
  };
  await db.itemPhotos.put(record);
  return record;
}

export async function deleteItemPhoto(id: string): Promise<void> {
  await db.itemPhotos.delete(id);
}
