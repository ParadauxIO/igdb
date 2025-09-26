import type {JSX, ReactNode} from "react";
import "./Card.scss";

type CardProps = {
    title: string;
    value: string | number | JSX.Element;
    children?: ReactNode; // no need to over-specify, ReactNode covers arrays too
};

export default function Card({ title, value, children }: CardProps) {
    return (
        <div className="card">
            <div className="card-key">{title}</div>
            <div className="card-value">{value}</div>
            {children && <div className="card-children">{children}</div>}
        </div>
    );
}