/** Foto quase sem traços escuros (folha em branco, verso sem texto). Poucas linhas escritas já bastam para não cair aqui. */
export async function pareceFolhaEmBranco(arquivo: File): Promise<boolean> {
  if (!arquivo.type.startsWith("image/")) return false;
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await carregar(url);
    const lado = 256;
    const canvas = document.createElement("canvas");
    canvas.width = lado;
    canvas.height = lado;
    const ctx = canvas.getContext("2d");
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0, lado, lado);
    const { data } = ctx.getImageData(0, 0, lado, lado);
    const luz: number[] = [];
    for (let i = 0; i < data.length; i += 4) luz.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    const media = luz.reduce((s, v) => s + v, 0) / luz.length;
    const escuros = luz.filter((v) => v < media - 45).length / luz.length;
    return escuros < 0.002;
  } catch {
    return false;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function carregar(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
