"use server";

import { supabase } from "@/lib/supabase";

export async function getLeaderboard() {
    const { data, error } = await supabase
        .from('roasts')
        .select('id, nickname, score, roast_text, analysis, verdict, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error("Error fetching leaderboard", error);
        return [];
    }

    return data;
}
