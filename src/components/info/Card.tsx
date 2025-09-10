import type {JSX} from "react";
import "./Card.scss";

type CardProps = {
    title: string;
    value: string | number | JSX.Element;
}

export default function Card({title, value}: CardProps) {
    return (
        <div className="card">
            <div className="card-key">{title}</div>
            <div className="card-value">{value}</div>
        </div>
    )
}