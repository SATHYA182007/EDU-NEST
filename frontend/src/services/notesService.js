import { supabase } from '../lib/supabaseClient';

/**
 * Fetches all notes from the "notes" table, with optional search filtering.
 */
export const getNotes = async (searchTerm = '') => {
    let query = supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

    if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,subject.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(`Failed to fetch notes: ${error.message}`);
    }
    return data;
};

/**
 * Increments the download count for a specific note.
 */
export const incrementDownloadCount = async (noteId) => {
    // We use rpc for atomic increment if available, but for now let's use the fetch-then-update logic
    // Or better, just a raw update with increment if it was supported directly, 
    // but in Supabase JS client it's often done via RPC.

    const { data, error } = await supabase.rpc('increment_downloads', { note_id: noteId });

    if (error) {
        // Fallback if RPC doesn't exist
        const { data: note, error: fetchError } = await supabase
            .from('notes')
            .select('downloads')
            .eq('id', noteId)
            .single();

        if (fetchError) throw fetchError;

        const { error: updateError } = await supabase
            .from('notes')
            .update({ downloads: (note.downloads || 0) + 1 })
            .eq('id', noteId);

        if (updateError) throw updateError;
    }

    return true;
};

/**
 * Handles the actual file download logic and updates the counter.
 */
export const handleDownload = async (fileUrl, noteId, fileName) => {
    if (!fileUrl) {
        console.error("Download failed: File URL is missing.");
        return;
    }

    try {
        // Extract the path from the public URL
        // URL format: .../storage/v1/object/public/notes-files/filename.ext
        const urlParts = fileUrl.split('/');
        const filePath = urlParts[urlParts.length - 1];

        const { data, error } = await supabase.storage
            .from('notes-files')
            .download(filePath);

        if (error) {
            throw error;
        }

        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName || filePath);
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        if (noteId) {
            await incrementDownloadCount(noteId);
        }

    } catch (error) {
        console.error("Download error:", error);
        if (window.showToast) window.showToast("Download failed: " + error.message, "error");
        throw error;
    }
};

/**
 * Uploads a note file to storage and returns the public URL.
 */
export const uploadFileToStorage = async (file) => {
    try {
        if (!file) throw new Error("No file selected.");

        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('notes-files')
            .upload(filePath, file);

        if (uploadError) {
            throw new Error(`File upload failed: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
            .from('notes-files')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    } catch (error) {
        throw error;
    }
};

/**
 * Creates note metadata record in the database.
 */
export const createNoteRecord = async ({ title, subject, description, semester, userId, fileUrl }) => {
    try {
        const { data, error: dbError } = await supabase
            .from('notes')
            .insert([
                {
                    title,
                    subject,
                    description,
                    file_url: fileUrl,
                    downloads: 0,
                    rating: 0,
                    semester,
                    user_id: userId
                }
            ])
            .select();

        if (dbError) {
            throw new Error(`Database insert failed: ${dbError.message}`);
        }

        return data[0];
    } catch (error) {
        throw error;
    }
};

/**
 * Uploads a note file to storage and metadata to the database (legacy support).
 */
export const uploadNote = async ({ file, title, subject, description, semester, userId }) => {
    const fileUrl = await uploadFileToStorage(file);
    return await createNoteRecord({ title, subject, description, semester, userId, fileUrl });
};

/**
 * Adds a bookmark for a note.
 */
export const addBookmark = async (userId, noteId) => {
    const { data, error } = await supabase
        .from('bookmarks')
        .insert([{ user_id: userId, note_id: noteId }])
        .select();

    if (error) {
        throw new Error(`Failed to add bookmark: ${error.message}`);
    }
    return data[0];
};

/**
 * Removes a bookmark.
 */
export const removeBookmark = async (userId, noteId) => {
    const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('note_id', noteId);

    if (error) {
        throw new Error(`Failed to remove bookmark: ${error.message}`);
    }
    return true;
};

/**
 * Fetches bookmarked notes for a user.
 */
export const getBookmarkedNotes = async (userId) => {
    const { data, error } = await supabase
        .from('bookmarks')
        .select('*, notes(*)')
        .eq('user_id', userId);

    if (error) {
        throw new Error(`Failed to fetch bookmarked notes: ${error.message}`);
    }
    return data.map(b => b.notes);
};

/**
 * Rates a note.
 */
export const rateNote = async (userId, noteId, ratingValue) => {
    // 1. Insert or update rating
    const { data: existingRating } = await supabase
        .from('ratings')
        .select('id')
        .eq('user_id', userId)
        .eq('note_id', noteId)
        .single();

    let error;
    if (existingRating) {
        const { error: updateError } = await supabase
            .from('ratings')
            .update({ rating_value: ratingValue })
            .eq('id', existingRating.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase
            .from('ratings')
            .insert([{ user_id: userId, note_id: noteId, rating_value: ratingValue }]);
        error = insertError;
    }

    if (error) throw new Error(`Failed to rate note: ${error.message}`);

    // 2. Update average rating in notes table
    const { data: ratingsData } = await supabase
        .from('ratings')
        .select('rating_value')
        .eq('note_id', noteId);

    if (ratingsData && ratingsData.length > 0) {
        const avg = ratingsData.reduce((acc, curr) => acc + curr.rating_value, 0) / ratingsData.length;
        await supabase
            .from('notes')
            .update({ rating: avg })
            .eq('id', noteId);
    }

    return true;
};

/**
 * Updates a note's metadata.
 */
export const updateNote = async (noteId, { title, subject, description, semester }) => {
    const { data, error } = await supabase
        .from('notes')
        .update({
            title,
            subject,
            description,
            semester,
            updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select();

    if (error) {
        throw new Error(`Failed to update note: ${error.message}`);
    }
    return data[0];
};

/**
 * Deletes a note and its associated file from storage.
 */
export const deleteNote = async (noteId, fileUrl) => {
    try {
        // 1. Delete from storage if fileUrl is provided
        if (fileUrl) {
            const urlParts = fileUrl.split('/');
            const filePath = urlParts[urlParts.length - 1];
            
            const { error: storageError } = await supabase.storage
                .from('notes-files')
                .remove([filePath]);
                
            if (storageError) {
                console.error("Storage deletion error:", storageError);
                // We keep going even if storage delete fails, 
                // but usually we want to know.
            }
        }

        // 2. Delete from database
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', noteId);

        if (error) {
            throw new Error(`Failed to delete note: ${error.message}`);
        }
        return true;
    } catch (error) {
        throw error;
    }
};

