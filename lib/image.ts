/** Redimensionne une image côté client (JPEG, côté max `max` px) et renvoie une data-URL. */
export function resizeImage(file: File, max = 1024, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image illisible"));
    };
    img.src = url;
  });
}

/** Petite miniature pour le journal (stockée en local). */
export function thumbnail(dataUrl: string, size = 160): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const k = size / Math.min(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const w = img.width * k, h = img.height * k;
      c.getContext("2d")!.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      resolve(c.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
