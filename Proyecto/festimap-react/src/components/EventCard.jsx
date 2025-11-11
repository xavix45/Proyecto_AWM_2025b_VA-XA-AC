export default function EventCard({ evento }) {
    return (
        <article className="card">
            <img className="card__media" src={evento.portada} alt={evento.titulo} />
            <div className="card__body">
                <h3 className="card__title">{evento.titulo}</h3>
                <p className="card__meta">{evento.ciudad} · {evento.fecha}</p>
            </div>
        </article>
    );
}
