import {useEffect, useState} from "react";
import "./TermsAndConditions.scss";
import {fetchTerms} from "../../partials/settings.ts";

export default function TermsAndConditions() {
    const [terms, setTerms] = useState<string | null>(null);

    useEffect(() => {
        fetchTerms().then(data => setTerms(data));
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