"use client";

/**
 * useProjectFiles
 * CRUD hook for the centralized project_files table.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/authStore";

export interface ProjectFile {
  id: string;
  project_id: string | null;
  module: string;
  category: string;
  subcategory: string | null;
  file_type: string;
  file_url: string;
  thumbnail_url: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  extracted_text: string | null;
  tags: string[];
  ai_classified: boolean;
  ai_module: string | null;
  ai_category: string | null;
  uploaded_by: string | null;
  ref_table: string | null;
  ref_id: string | null;
  version: number;
  status: string;
  created_at: string;
}

export interface InsertProjectFile {
  project_id?: string | null;
  module: string;
  category: string;
  subcategory?: string | null;
  file_type: string;
  file_url: string;
  thumbnail_url?: string | null;
  file_name?: string | null;
  file_size_bytes?: number | null;
  extracted_text?: string | null;
  tags?: string[];
  ref_table?: string | null;
  ref_id?: string | null;
}

export function useProjectFiles(filters?: {
  module?: string;
  project_id?: string;
  ref_table?: string;
  ref_id?: string;
  category?: string;
  limit?: number;
}) {
  const supabase = useMemo(() => createClient(), []);
  const userId = useAuthStore((s) => s.userId);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    let q = supabase
      .from("project_files")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(filters?.limit ?? 50);

    if (filters?.module) q = q.eq("module", filters.module);
    if (filters?.project_id) q = q.eq("project_id", filters.project_id);
    if (filters?.ref_table) q = q.eq("ref_table", filters.ref_table);
    if (filters?.ref_id) q = q.eq("ref_id", filters.ref_id);
    if (filters?.category) q = q.eq("category", filters.category);

    const { data, error: err } = await q;
    if (err) setError(err.message);
    setFiles((data as ProjectFile[]) || []);
    setLoading(false);
  }, [supabase, filters?.module, filters?.project_id, filters?.ref_table, filters?.ref_id, filters?.category, filters?.limit]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const insertFile = useCallback(
    async (payload: InsertProjectFile): Promise<ProjectFile> => {
      const { data, error: err } = await supabase
        .from("project_files")
        .insert({ ...payload, uploaded_by: userId ?? null })
        .select()
        .single();
      if (err) {
        throw new Error(err.message);
      }
      setFiles((prev) => [data as ProjectFile, ...prev]);
      return data as ProjectFile;
    },
    [supabase, userId]
  );

  const softDelete = useCallback(
    async (id: string): Promise<boolean> => {
      const { error: err } = await supabase
        .from("project_files")
        .update({ status: "deleted", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (err) { setError(err.message); return false; }
      setFiles((prev) => prev.filter((f) => f.id !== id));
      return true;
    },
    [supabase]
  );

  return { files, loading, error, loadFiles, insertFile, softDelete };
}
