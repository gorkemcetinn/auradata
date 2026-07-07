export async function compressData(data: any): Promise<string> {
  try {
    const jsonStr = JSON.stringify(data);
    const stream = new Blob([jsonStr]).stream().pipeThrough(new CompressionStream("gzip"));
    const buffer = await new Response(stream).arrayBuffer();
    // Use a robust base64 encoding for potentially large buffers
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error("Compression failed, returning as string", e);
    return JSON.stringify(data); // Fallback
  }
}

export async function decompressData(base64Str: string): Promise<any> {
  try {
    // Check if it's actually compressed base64 or just fallback JSON string
    if (base64Str.startsWith("[") || base64Str.startsWith("{")) {
      return JSON.parse(base64Str);
    }
    
    const binaryString = atob(base64Str);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    const text = await new Response(stream).text();
    return JSON.parse(text);
  } catch (e) {
    console.error("Decompression failed", e);
    return [];
  }
}
