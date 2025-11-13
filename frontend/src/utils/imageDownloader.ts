/**
 * Utility functions for downloading images
 */

export interface ImageDownloadOptions {
  filename?: string;
  promptSnippet?: string;
}

/**
 * Download an image from a URL or data URI
 * @param imageUrl - The image URL or data URI
 * @param options - Download options including custom filename
 */
export function downloadImage(
  imageUrl: string,
  options: ImageDownloadOptions = {}
): void {
  try {
    const {
      filename,
      promptSnippet = 'image'
    } = options;

    // Generate filename with timestamp if not provided
    const timestamp = new Date().toISOString().slice(0, 10);
    const timeString = new Date().toTimeString().slice(0, 5).replace(':', '');
    const finalFilename = filename || `nano-banana-${promptSnippet}-${timestamp}-${timeString}.png`;

    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = finalFilename;

    // Append to body (required for Firefox)
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Clean up
    document.body.removeChild(link);
  } catch (error) {
    console.error('Failed to download image:', error);
    throw new Error(`Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download an image from a blob
 * @param blob - The image blob
 * @param filename - The filename for the download
 */
export function downloadImageBlob(blob: Blob, filename: string = 'image.png'): void {
  try {
    // Create a blob URL
    const blobUrl = URL.createObjectURL(blob);

    // Create temporary anchor element
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;

    // Append to body (required for Firefox)
    document.body.appendChild(link);

    // Trigger download
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Failed to download image blob:', error);
    throw new Error(`Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert data URI to blob
 * @param dataUri - The data URI string
 * @returns The blob object
 */
export function dataUriToBlob(dataUri: string): Blob {
  try {
    // Extract the mime type and data
    const arr = dataUri.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }

    return new Blob([u8arr], { type: mime });
  } catch (error) {
    console.error('Failed to convert data URI to blob:', error);
    throw new Error(`Failed to convert image data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a safe filename from a prompt
 * @param prompt - The original prompt text
 * @param maxLength - Maximum length of the snippet
 * @returns A safe filename snippet
 */
export function createFilenameFromPrompt(prompt: string, maxLength: number = 30): string {
  return prompt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, maxLength)
    .replace(/-$/, '');
}
