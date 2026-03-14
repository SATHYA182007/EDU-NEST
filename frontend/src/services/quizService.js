import { supabase } from '../lib/supabaseClient';

/**
 * Fetches all quizzes from the "quizzes" table.
 */
export const getQuizzes = async () => {
    const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch quizzes: ${error.message}`);
    }
    return data;
};

/**
 * Fetches questions for a specific quiz.
 */
export const getQuizQuestions = async (quizId) => {
    const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId);

    if (error) {
        throw new Error(`Failed to fetch quiz questions: ${error.message}`);
    }
    return data;
};

/**
 * Submits quiz result.
 */
export const submitQuizResult = async ({ user_id, quiz_id, score }) => {
    const { data, error } = await supabase
        .from('quiz_results')
        .insert([{ user_id, quiz_id, score }])
        .select();

    if (error) {
        throw new Error(`Failed to submit quiz result: ${error.message}`);
    }
    return data[0];
};

/**
 * Fetches quiz results for a specific user.
 */
export const getUserQuizResults = async (userId) => {
    const { data, error } = await supabase
        .from('quiz_results')
        .select('*, quizzes(title, subject)')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch quiz results: ${error.message}`);
    }
    return data;
};
