import {useState} from "react";
import type {DogUpdate} from "../../types/DogUpdate";
import IGDBForm, {type FormField} from "../../components/form/IGDBForm";
import {postUpdate} from "../../partials/update";
import {useAuth} from "../../state/hooks/useAuth";
import "./PostUpdateView.scss";
import StatusCard from "../../components/general/StatusCard";

const PostUpdateView = () => {
    const [form, setForm] = useState<Partial<DogUpdate>>({});
    const [message, setMessage] = useState<string|null >(null);
    const [isError, setIsError] = useState<boolean>(false);
    const {user} = useAuth();

    const fields: FormField[] = [
        {name: 'dog_id', label: 'Dog Name', type: 'dog-select', required: true},
        {name: 'update_title', label: 'Post Title', type: 'text', required: true},
        {name: 'update_description', label: 'Post Description', type: 'post-textarea', required: false},
        {name: 'files', label: 'Media', type: 'file-upload', required: false}
    ]

    const handleUpdate = async (update: Partial<DogUpdate>) => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        try {
            update.update_created_by = user?.id;
            await postUpdate(update);
            setMessage(`Your update needs to be approved by an admin before it is posted, you can see your pending updates in red on the home page.`);
            setIsError(false);
            setForm({}); // Clear form on successful submit
        } catch (error) {
            setMessage("Failed to post this update. Please try again later.");
            setIsError(true);
        }
    }

    return (
        <div className="post-update-view">
            <div className="post-update-container">
                <h1>Post an update</h1>
                <StatusCard message={message} isError={isError}/>
                <IGDBForm
                    form={form}
                    setForm={setForm}
                    fields={fields}
                    onSubmit={(update) => handleUpdate(update)}
                />
            </div>
        </div>
    );
};

export default PostUpdateView;