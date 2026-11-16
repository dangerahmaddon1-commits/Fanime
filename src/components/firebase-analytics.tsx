"use client";

import { useEffect } from "react";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirebaseApp } from "@/lib/firebase/client";

export default function FirebaseAnalytics() {
  useEffect(() => {
    let active = true;

    async function initializeAnalytics() {
      try {
        const app = getFirebaseApp();
        if (!app || !(await isSupported()) || !active) return;
        getAnalytics(app);
      } catch {
        // Analytics is optional; it must never prevent the site from rendering.
      }
    }

    void initializeAnalytics();
    return () => {
      active = false;
    };
  }, []);

  return null;
}
