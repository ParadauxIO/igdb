import { useEffect, useState } from 'react';
import { supabase } from '../state/supabaseClient.ts';
import "./UpdateFeed.scss";
import ImageCarousel from './ImageCarousel.tsx';
import type {DogUpdate} from "../types/DogUpdate.ts";

export default function UpdateFeed() {
  const [updates, setUpdates] = useState<DogUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpdates = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('dog_updates')
        .select('*')
        .order('update_created_at', { ascending: false });

      if (!error && data) setUpdates(data);
      setLoading(false);
    };
    fetchUpdates();
  }, []);

  if (loading) return <div className="text-center mt-8">Loading feed...</div>;

  return (
    <div className="feed">
      {updates.map(update => (
        <div key={update.update_id} className="feed-item">
          <h2 className="">{update.update_title}</h2>
          <p className="">{update.update_description}</p>
          {update.update_media_urls && update.update_media_urls.length > 0 && (
            <ImageCarousel images={update.update_media_urls} />
          )}
          <div className="time">{new Date(update.update_created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}