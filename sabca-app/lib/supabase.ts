import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
if (!supabaseUrl) {
  console.error('EXPO_PUBLIC_SUPABASE_URL is missing. Check your .env file.');
}
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom Storage Adapter to handle environment issues
const ExpoStorage = {
  getItem: (key: string) => {
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,

  },
});

/**
 * Uploads an image to Supabase Storage.
 * @param uri Local file URI from ImagePicker
 * @param bucket Storage bucket name (e.g., 'events')
 * @returns Public URL of the uploaded image
 */
export const uploadImage = async (uri: string, bucket: string) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    const fileName = `${new Date().getTime()}.jpg`;
    const contentType = 'image/jpeg';

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, decode(base64), {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};

/**
 * Deletes a file from Supabase Storage using its public URL.
 * @param url Public URL of the file
 * @param bucket Storage bucket name
 */
export const deleteFileFromUrl = async (url: string, bucket: string) => {
  try {
    if (!url) return;
    
    // Extract the full path after the bucket name to support subdirectories (like user_id/filename.pdf)
    const bucketSegment = `/public/${bucket}/`;
    const bucketIndex = url.indexOf(bucketSegment);
    let filePath = '';
    
    if (bucketIndex !== -1) {
      filePath = url.substring(bucketIndex + bucketSegment.length);
    } else {
      filePath = url.split('/').pop() || '';
    }
    
    if (!filePath) return;

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
    }
  } catch (error) {
    console.error('Delete file failed:', error);
  }
};

/**
 * Uploads a file to Supabase Storage.
 * @param uri Local file URI
 * @param bucket Storage bucket name
 * @param options contentType and fileName
 * @returns Public URL of the uploaded file
 */
export const uploadFile = async (uri: string, bucket: string, options?: { contentType?: string, fileName?: string }) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    });

    const fileName = options?.fileName || `${new Date().getTime()}.pdf`;
    const contentType = options?.contentType || 'application/pdf';

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, decode(base64), {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
};

