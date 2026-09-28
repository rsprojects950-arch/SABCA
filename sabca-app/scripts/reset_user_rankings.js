const { createClient } = require('@supabase/supabase-js');

// Hardcoded for script simplicity based on .env
const SUPABASE_URL = 'https://dfguascjzwpvrpnjflti.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmZ3Vhc2NqendwdnJwbmpmbHRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4NTg1NjIsImV4cCI6MjA4NTQzNDU2Mn0.54jzJq_8oiWHXnN3ndhQvU3eDImmJhHjtWLh4BYsCQg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function resetRankings() {
    console.log('Resetting all rankings...');

    const { error } = await supabase
        .from('profiles')
        .update({
            division_rank: 0,
            committee_role: 'Division' // Default back to Division
        })
        .gt('division_rank', 0); // Only update rows that have a rank > 0 to optimize

    if (error) {
        console.error('Error resetting rankings:', error);
    } else {
        console.log('Successfully reset all rankings.');
    }
}

resetRankings();
