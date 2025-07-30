import { useEffect, useState } from 'react';
import { supabase } from '../../state/supabaseClient.ts';
import "./UpdateFeed.scss";

import type {DogUpdate} from "../../types/DogUpdate.ts";
import Update from "./Update.tsx";
import {useAuth} from "../../state/hooks/useAuth.ts";

export default function UpdateFeed() {
  const [updates, setUpdates] = useState<DogUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  let {isAdmin, user} = useAuth();

  const removeUpdate = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to remove this update? This action cannot be undone.");
    if (!confirmed) return;

    const {error} = await supabase.from("dog_updates").delete().eq("update_id", id);

    if (error) {
      console.error("Error removing update:", error);
      return;
    }
  }

  useEffect(() => {
    const fetchUpdates = async () => {
      if (!user) return;
      setLoading(true);

      const { data, error } = await supabase
          .from("dog_updates")
          .select("*")
          .or(`update_date_approved.not.is.null,update_created_by.eq.${user?.id}`)
          .order("update_created_at", { ascending: false });

      if (!error && data) setUpdates(data);
      setLoading(false);
    };
    fetchUpdates();
  }, [user]);

  if (loading) return <div className="text-center mt-8">Loading feed...</div>;

  return (
    <div className="feed">
      {updates.map(update => (
        <Update update={update} isAdmin={isAdmin} removeUpdate={(id) => removeUpdate(id)}/>
      ))}
    </div>
  );
}