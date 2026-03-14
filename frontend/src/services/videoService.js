import { supabase } from '../lib/supabaseClient';

/**
 * Fetches all videos from the "videos" table.
 */
export const getVideos = async () => {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch videos: ${error.message}`);
    }
    return data;
};

/**
 * Uploads video metadata to the database.
 */
export const uploadVideo = async ({ title, subject, description, video_url, user_id }) => {
    const { data, error } = await supabase
        .from('videos')
        .insert([{ title, subject, description, video_url, user_id }])
        .select();

    if (error) {
        throw new Error(`Failed to upload video: ${error.message}`);
    }
    return data[0];
};
