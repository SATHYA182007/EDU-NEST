import { supabase } from '../lib/supabaseClient';

/**
 * Fetches all forum questions.
 */
export const getForumQuestions = async () => {
    const { data, error } = await supabase
        .from('forum_questions')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch forum questions: ${error.message}`);
    }
    return data;
};

/**
 * Fetches answers for a specific forum question.
 */
export const getForumAnswers = async (questionId) => {
    const { data, error } = await supabase
        .from('forum_answers')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: true });

    if (error) {
        throw new Error(`Failed to fetch forum answers: ${error.message}`);
    }
    return data;
};

/**
 * Posts a new forum question.
 */
export const askForumQuestion = async ({ user_id, title, description }) => {
    const { data, error } = await supabase
        .from('forum_questions')
        .insert([{ user_id, title, description }])
        .select();

    if (error) {
        throw new Error(`Failed to post forum question: ${error.message}`);
    }
    return data[0];
};

/**
 * Posts an answer to a forum question.
 */
export const answerForumQuestion = async ({ question_id, user_id, answer }) => {
    const { data, error } = await supabase
        .from('forum_answers')
        .insert([{ question_id, user_id, answer }])
        .select();

    if (error) {
        throw new Error(`Failed to post forum answer: ${error.message}`);
    }
    return data[0];
};
