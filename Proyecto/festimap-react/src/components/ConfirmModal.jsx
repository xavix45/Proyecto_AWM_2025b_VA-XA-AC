// src/components/ConfirmModal.jsx
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
