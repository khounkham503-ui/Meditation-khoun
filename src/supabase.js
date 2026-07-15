import { createClient } from '@supabase/supabase-js';

// Read keys from Vite environment variables (e.g. from a .env file)
// Or you can hardcode them here if you prefer.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

let supabase = null;
let isConfigured = false;

if (supabaseUrl && supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseAnonKey && supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY') {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    isConfigured = true;
  } catch (err) {
    console.error('Failed to initialize Supabase client', err);
  }
} else {
  console.warn('Supabase is not configured yet. Using local fallback mode. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in a .env file.');
}

export { supabase, isConfigured };

/**
 * Sync local stats to Supabase database (migration upon first login)
 */
export async function syncLocalStatsToCloud(userId, localStats) {
  if (!isConfigured) return;
  
  try {
    // 1. Check if profile already exists in DB
    const { data: existingProfile, error: getError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (getError && getError.code !== 'PGRST116') {
      console.error('Error fetching profile from cloud:', getError);
      return;
    }

    // 2. If it does not exist, insert local stats as initial cloud profile
    if (!existingProfile) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          nickname: localStats.name || 'ผู้ปฏิบัติธรรม',
          avatar: localStats.emoji || '🧘',
          total_minutes: localStats.totalMinutes || 0,
          sessions: localStats.sessions || 0,
          streak: localStats.streak || 0,
          last_date: localStats.lastDate || null,
          unlocked_badges: localStats.unlockedBadges || []
        });

      if (insertError) {
        console.error('Failed to migrate profile to cloud:', insertError);
        return;
      }

      // Also migrate journal entries
      if (localStats.journal && localStats.journal.length > 0) {
        const dbEntries = localStats.journal.map(entry => ({
          user_id: userId,
          date: entry.date,
          minutes: entry.minutes,
          mood: entry.mood,
          note: entry.note
        }));

        const { error: journalError } = await supabase
          .from('journals')
          .insert(dbEntries);

        if (journalError) {
          console.error('Failed to migrate journals to cloud:', journalError);
        }
      }
      console.log('Successfully migrated local stats to cloud account!');
    }
  } catch (err) {
    console.error('Failed to sync stats to cloud', err);
  }
}
