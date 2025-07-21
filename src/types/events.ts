export type ChangeEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
export type ChangeEventValues = {
    name: string;
    value: string;
    type: string;
    checked?: boolean;
}