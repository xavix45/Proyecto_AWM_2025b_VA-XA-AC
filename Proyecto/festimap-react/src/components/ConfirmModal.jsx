// src/components/ConfirmModal.jsx
// COMPONENT: ConfirmModal
// Token de búsqueda: COMPONENT:ConfirmModal
// Modal reutilizable para confirmar acciones (por ejemplo en páginas de admin).
// Propiedades (props):
//  - `show`: booleano (muestra u oculta el modal).
//  - `title`, `message`: texto mostrado.
//  - `type`: 'info'|'success'|'warning'|'danger' (controla el estilo visual).
//  - `onConfirm`, `onCancel`: callbacks para las acciones del usuario.
// El modal evita la propagación al hacer clic dentro y se cierra al pulsar el backdrop.
import '../styles/components/confirm-modal.css';

export default function ConfirmModal({ show, title, message, type = 'info', onConfirm, onCancel }) {
    if (!show) return null;

    return (
        <div className="confirm-modal-backdrop" onClick={onCancel}>
            <div 
                className={`confirm-modal confirm-modal--${type}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="confirm-modal__header">
                    <h3 className="confirm-modal__title">{title}</h3>
                </div>
                <div className="confirm-modal__body">
                    <p className="confirm-modal__message">{message}</p>
                </div>
                <div className="confirm-modal__footer">
                    {onCancel && (
                        <button 
                            className="btn btn--ghost"
                            onClick={onCancel}
                        >
                            Cancelar
                        </button>
                    )}
                    <button 
                        className={`btn btn--${type === 'danger' ? 'danger' : type === 'success' ? 'success' : 'primary'}`}
                        onClick={onConfirm}
                    >
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    );
}
