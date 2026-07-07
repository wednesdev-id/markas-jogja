import { supabase } from "./supabase";

export const storage = {
  get: async (key: string, parse = false) => {
    if (typeof window === "undefined") return null;
    
    try {
      const { data, error } = await supabase.from("app_data").select("value").eq("key", key).single();
      if (!error && data) {
        const strVal = typeof data.value === "string" ? data.value : JSON.stringify(data.value);
        localStorage.setItem(key, strVal);
        return { value: strVal };
      }
    } catch (e) {
      console.warn("Failed to fetch from Supabase, falling back to localStorage", e);
    }
    
    try {
      const val = localStorage.getItem(key);
      if (val === null) return null;
      return { value: val };
    } catch (e) {
      console.error("Error reading from localStorage", e);
      return null;
    }
  },
  set: async (key: string, value: string, stringify = false) => {
    if (typeof window === "undefined") return;
    
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error("Error writing to localStorage", e);
    }
    
    try {
      let jsonValue = value;
      try { jsonValue = JSON.parse(value); } catch(e) {}
      await supabase.from("app_data").upsert({ key, value: jsonValue, updated_at: new Date().toISOString() });
    } catch (e) {
      console.error("Failed to sync to Supabase", e);
    }
  }
};

