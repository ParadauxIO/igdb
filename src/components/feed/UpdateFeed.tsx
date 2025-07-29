import { useEffect, useState } from 'react';
import { supabase } from '../../state/supabaseClient.ts';
import "./UpdateFeed.scss";

import type {DogUpdate} from "../../types/DogUpdate.ts";
import Update from "./Update.tsx";
import {useAuth} from "../../state/hooks/useAuth.ts";

export default function UpdateFeed() {
  const [updates, setUpdates] = useState<DogUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  let {isAdmin} = useAuth();

  const removeUpdate = async (id: string) => {
    console.log(id);
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
      setLoading(true);

      const {data, error} = await supabase.functions.invoke("feed")

      if (!error && data) setUpdates(data);
      setLoading(false);
    };
    fetchUpdates();
  }, []);

  if (loading) return <div className="text-center mt-8">Loading feed...</div>;
  console.log(updates);
  return (
    <div className="feed">
      {updates.map(update => (
        <Update update={update} isAdmin={isAdmin} removeUpdate={(id) => removeUpdate(id)}/>
      ))}
    </div>
  );
}