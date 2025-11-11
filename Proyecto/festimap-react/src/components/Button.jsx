export default function Button({ as: Tag = "button", className = "", ...props }) {
    return <Tag className={`btn btn--primary ${className}`} {...props} />;
}
