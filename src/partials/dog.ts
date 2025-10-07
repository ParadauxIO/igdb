import {supabase} from "../state/supabaseClient.ts";
import type {Dog, DogHandlerName} from "../types/Dog.ts";

export const getDogsPublic = async () => {
    const {data} = await supabase.functions.invoke("views", {body: {view: "dogs"}})
    console.log(data);
    return data;
}

export type DogSearchResult = {
    dog_id: string;
    dog_name: string;
}

export const getUserDogs = async (userId: string): Promise<DogSearchResult[]> => {
    const { data, error } = await supabase
        .from("dogs")
        .select("dog_id, dog_name")
        .contains("dog_current_handlers", [userId]) // check if array contains userId
        .eq("dog_is_archived", false);

    if (error) {
        console.error("Failed to fetch dogs:", error);
        throw new Error("Failed to fetch dogs");
    }

    return data;
};

export const getDogsWithNames = async (): Promise<Dog[] | undefined> => {
    // 1) Fetch dogs + creator/editor names
    const { data, error } = await supabase
        .from('dogs')
        .select(`
      *,
      dog_created_by_user:users!dogs_dog_created_by_fkey ( name ),
      dog_last_edited_by_user:users!dogs_dog_last_edited_by_fkey ( name )
    `)
        .order('dog_created_at', { ascending: false });

    if (error) {
        console.log('Error occurred while fetching dogs:', error);
        return;
    }
    if (!data) return;

    // 2) Collect all handler IDs across all dogs
    const allHandlerIds = new Set<string>();
    for (const d of data) {
        const ids: string[] | null = d.dog_current_handlers ?? null;
        if (ids && ids.length) ids.forEach((id) => allHandlerIds.add(id));
    }

    // 3) Bulk fetch handler names (once)
    let idToName = new Map<string, string>();
    if (allHandlerIds.size > 0) {
        const { data: users, error: usersErr } = await supabase
            .from('users')
            .select('id, name')
            .in('id', Array.from(allHandlerIds));

        if (usersErr) {
            console.log('Failed to fetch handler names:', usersErr);
        } else if (users) {
            idToName = new Map(users.map((u) => [u.id as string, (u.name as string) ?? '']));
        }
    }

    // 4) Flatten + attach derived name fields
    const flattenedData: Dog[] = data.map((dog: any) => {
        const handlerIds: string[] = Array.isArray(dog.dog_current_handlers)
            ? dog.dog_current_handlers
            : [];

        const dog_current_handler_users =
            handlerIds.map((id) => ({ name: idToName.get(id) ?? '' })) as DogHandlerName[];

        const dog_current_handler_names = handlerIds.map((id) => idToName.get(id) ?? '');

        return {
            ...dog,
            dog_created_by_name: dog.dog_created_by_user?.name ?? undefined,
            dog_last_edited_by_name: dog.dog_last_edited_by_user?.name ?? undefined,
            dog_current_handler_users,
            dog_current_handler_names,
        } as Dog;
    });

    return flattenedData;
};

export const createDog = async (form: Partial<Dog>) => {
    // Normalise handlers: default to empty array (not null) unless explicitly provided
    const handlers: string[] =
        Array.isArray(form.dog_current_handlers) && form.dog_current_handlers.length
            ? form.dog_current_handlers
            : [];
    console.log("form", form);
    console.log("handlers", handlers);

    // Build payload explicitly (no undefineds)
    const payload = {
        dog_name: form.dog_name!,
        dog_role: form.dog_role!,
        dog_yob: form.dog_yob!,
        dog_sex: form.dog_sex!,
        dog_picture: form.dog_picture ?? null,
        dog_status: form.dog_status ?? null,
        dog_current_handlers: handlers, // <-- uuid[] column
        dog_general_notes: form.dog_general_notes ?? null,
        dog_is_archived: false,
        dog_created_by: form.dog_created_by!,     // required
        dog_last_edited_by: form.dog_created_by!, // on create, same as creator
    } as const;

    const { data, error } = await supabase
        .from('dogs')
        .insert(payload)
        .select('*')
        .single();

    if (error) {
        console.error('Failed to create dog:', error);
        throw new Error('Failed to create dog');
    }

    return data;
};

export const updateDog = async (form: Partial<Dog>) => {
    const {data, error} = await supabase
        .from('dogs')
        .update({...form, dog_updated_at: new Date()})
        .eq('dog_id', form.dog_id)
        .select()
        .single();

    if (error) {
        console.error("Failed to update dog:", error);
        throw new Error("Failed to update dog");
    }

    return data;
}

export const getDogById = async (dogId: string) => {
    const {data, error} = await supabase
        .from('dogs')
        .select()
        .eq('dog_id', dogId)
        .single();

    if (error) {
        throw new Error("Failed to fetch dog by ID:");
    }

    return data;
}

export const deleteDog = async (dogId: string): Promise<void> => {
    const {error} = await supabase
        .from('dogs')
        .delete()
        .eq('dog_id', dogId);

    if (error) {
        console.error("Failed to delete dog:", error);
        throw new Error("Failed to delete dog");
    }
};

export const archiveDog = async (dogId: string) => {
    const {error} = await supabase
        .from('dogs')
        .update({dog_is_archived: true})
        .eq('dog_id', dogId);

    if (error) {
        console.error("Failed to disable dog:", error);
        return;
    }
}

const filenameFromDisposition = (h: string | null, fallback: string) => {
    if (!h) return fallback;
    // e.g. attachment; filename="Rex-<uuid>.tar.gz"
    const m = /filename\*?=(?:UTF-8''|")?([^\";]+)"?/i.exec(h);
    return m?.[1] ? decodeURIComponent(m[1]) : fallback;
}

/**
 * Calls the edge function and downloads the tar.gz
 */
export const exportDogArchive = async (dogId: string) => {
    const { data: { session } } = await supabase.auth.getSession();

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-dog`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            // Needed by Supabase Functions from the browser:
            "Authorization": session?.access_token ? `Bearer ${session.access_token}` : "",
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
            // Optional: make it clear we want a file back
            "Accept": "application/gzip",
        },
        body: JSON.stringify({ dog_id: dogId }),
    });

    if (!res.ok) {
        // try read error JSON, fall back to text
        let msg = `${res.status} ${res.statusText}`;
        try {
            const j = await res.json();
            msg = j?.error ?? msg;
        } catch {
            msg = await res.text();
        }
        throw new Error(msg || "Export failed");
    }

    const blob = await res.blob(); // streaming under the hood; fine for typical sizes
    const cd = res.headers.get("Content-Disposition");
    const filename = filenameFromDisposition(cd, `dog-${dogId}.tar.gz`);

    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
}