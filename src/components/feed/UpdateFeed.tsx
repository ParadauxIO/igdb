import { useEffect, useState } from 'react';
import { supabase } from '../../state/supabaseClient.ts';
import "./UpdateFeed.scss";

import type {DogUpdate} from "../../types/DogUpdate.ts";
import Update from "./Update.tsx";

export default function UpdateFeed() {
  const [updates, setUpdates] = useState<DogUpdate[]>([]);
  const [loading, setLoading] = useState(true);

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
        <Update update={update}/>
      ))}
    </div>
  );
}