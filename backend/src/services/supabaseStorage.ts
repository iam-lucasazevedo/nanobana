import { createClient, SupabaseClient } from '@supabase/supabase-js';
import path from 'path';

/**
 * Supabase Storage Service
 * Handles image uploads to Supabase Storage and returns public URLs
 */

let supabase: SupabaseClient | null = null;
let bucketName: string | null = null;

/**
 * Initialize Supabase client (called once at startup)
 */
function initializeSupabase(): void {
  if (supabase) return; // Already initialized

  const supabaseUrl = process.env.SUPABASE_URL as string;
  const supabaseKey = process.env.SUPABASE_ANON_KEY as string;
  bucketName = process.env.SUPABASE_BUCKET_NAME as string;

  // Validate required environment variables
  if (!supabaseUrl || !supabaseKey || !bucketName) {
    throw new Error(
      'Missing required Supabase environment variables. ' +
      'Please set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_BUCKET_NAME in your .env file'
    );
  }

  // Initialize Supabase client
  supabase = createClient(supabaseUrl, supabaseKey);
}

export interface UploadResult {
  publicUrl: string;
  filename: string;
  path: string;
}

/**
 * Upload a file to Supabase Storage
 * @param file - Express Multer file object
 * @param subfolder - Optional subfolder within the bucket (e.g., 'edits')
 * @returns Upload result with public URL
 */
export async function uploadFileToSupabase(
  file: Express.Multer.File,
  subfolder: string = 'edits'
): Promise<UploadResult> {
  try {
    initializeSupabase();

    // Generate a unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = path.extname(file.originalname);
    const filename = `${timestamp}-${random}${ext}`;
    const filePath = `${subfolder}/${filename}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase!.storage
      .from(bucketName!)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false // Don't overwrite if file exists
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = supabase!.storage
      .from(bucketName!)
      .getPublicUrl(filePath);

    return {
      publicUrl: publicUrlData.publicUrl,
      filename,
      path: filePath
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error during upload';
    throw new Error(`Failed to upload file to Supabase: ${msg}`);
  }
}

/**
 * Upload multiple files to Supabase Storage
 * @param files - Array of Express Multer file objects
 * @param subfolder - Optional subfolder within the bucket
 * @returns Array of upload results with public URLs
 */
export async function uploadMultipleFilesToSupabase(
  files: Express.Multer.File[],
  subfolder: string = 'edits'
): Promise<UploadResult[]> {
  try {
    const uploadPromises = files.map(file => uploadFileToSupabase(file, subfolder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to upload multiple files: ${msg}`);
  }
}

/**
 * Delete a file from Supabase Storage
 * @param filePath - Path of the file to delete (e.g., 'edits/timestamp-random.jpg')
 */
export async function deleteFileFromSupabase(filePath: string): Promise<void> {
  try {
    initializeSupabase();

    const { error } = await supabase!.storage
      .from(bucketName!)
      .remove([filePath]);

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to delete file from Supabase: ${msg}`);
  }
}

export const supabaseStorageService = {
  uploadFileToSupabase,
  uploadMultipleFilesToSupabase,
  deleteFileFromSupabase
};
