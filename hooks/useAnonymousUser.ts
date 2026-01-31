"use client";

import { useState, useEffect } from "react";
import { getNickname } from "@/app/actions/getNickname";

export function useAnonymousUser() {
    const [nickname, setNickname] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem("user_nickname");
        if (stored) {
            setNickname(stored);
            setLoading(false);
        } else {
            getNickname()
                .then((name) => {
                    localStorage.setItem("user_nickname", name);
                    setNickname(name);
                })
                .catch(() => {
                    // Should ideally not happen due to server fallback, but just in case
                    setNickname("Anon-User-000");
                })
                .finally(() => setLoading(false));
        }
    }, []);

    return { nickname, loading };
}
