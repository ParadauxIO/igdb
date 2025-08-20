import {useEffect, useState} from "react";
import {supabase} from "../../state/supabaseClient.ts";
import "./TermsAndConditions.scss";

export default function TermsAndConditions() {
    const [terms, setTerms] = useState<string | null>(null);

    useEffect(() => {
        const fetchTerms = async () => {
            const {data, error} = await supabase.from("system_settings")
                .select("setting_value")
                .eq("setting_key", "terms")
                .single();

            if (error) {
                throw new Error("Failed to fetch terms and conditions: " + error.message);
            }

            setTerms(data.setting_value);
        }
        fetchTerms();
    }, []);

    return (
        <div className="terms-and-conditions-container">
            <h1> Terms and Conditions </h1>
            <p>
                {terms}
            </p>
        </div>
    )
}