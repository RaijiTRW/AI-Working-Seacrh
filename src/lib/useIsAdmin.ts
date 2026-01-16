"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useAuth } from "./useAuth";

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        console.log("🔍 Checking admin status for user:", user.id);
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.warn("❌ Could not check admin status:", error.message);
          setIsAdmin(false);
        } else {
          console.log("✅ Profile data:", data);
          console.log("👤 Role:", data?.role);
          console.log("🔑 Is admin:", data?.role === "admin");
          setIsAdmin(data?.role === "admin");
        }
      } catch (err) {
        console.warn("❌ Could not check admin status:", err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

  return { isAdmin, loading };
}
