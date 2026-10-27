import React, { useState, useEffect } from 'react';
import { X, Star, Check } from 'lucide-react';
import { LanguageCode } from '../../types';

interface RateUsModalProps {
  language: LanguageCode;
  onClose: () => void;
}

const RATING_STORAGE_KEY = 'btc_user_rating';

export const RateUsModal: React.FC<RateUsModalProps> = ({
  language,
  onClose
}) => {
  // Anotação 06: Inicializar com 0 estrelas preenchidas se ainda não tiver avaliado
  const [savedRating, setSavedRating] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(RATING_STORAGE_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [selectedRating, setSelectedRating] = useState<number>(savedRating);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RATING_STORAGE_KEY);
      if (stored) {
        const val = parseInt(stored, 10);
        setSavedRating(val);
        setSelectedRating(val);
      }
    } catch {
      // ignore
    }
  }, []);

  const effectiveRating = hoverRating > 0 ? hoverRating : selectedRating;

  const handleSubmit = () => {
    if (selectedRating === 0) return;
    try {
      localStorage.setItem(RATING_STORAGE_KEY, selectedRating.toString());
      setSavedRating(selectedRating);
    } catch {
      // ignore
    }
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#181d33] border border-[#2d3656] rounded-3xl w-full max-w-sm flex flex-col items-center text-center p-5 shadow-2xl overflow-hidden text-white select-none">
        <div className="w-full flex justify-end">
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center my-2 shadow-inner">
          <Star className={`w-8 h-8 ${selectedRating > 0 ? 'fill-amber-400 text-amber-400' : 'text-amber-400/60'}`} />
        </div>

        <h3 className="text-base font-bold text-white mt-2">
          {language === 'pt' ? 'Avalie Nosso App' : language === 'es' ? 'Califícanos' : 'Rate Us'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          {language === 'pt'
            ? 'Sua avaliação ajuda a melhorar a experiência de mineração em nuvem.'
            : language === 'es'
            ? 'Tu opinión nos ayuda a mejorar la experiencia de minería.'
            : 'Your feedback helps us improve your cloud mining experience.'}
        </p>

        {/* 5 Stars with hover & dynamic selection */}
        <div className="flex items-center gap-2 my-5" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= effectiveRating;
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onClick={() => setSelectedRating(star)}
                className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    isFilled
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                      : 'text-slate-600 hover:text-slate-500'
                  }`}
                />
              </button>
            );
          })}
        </div>

        {savedRating > 0 && !submitted && (
          <p className="text-[11px] text-emerald-400 mb-3 font-semibold">
            {language === 'pt'
              ? `Avaliação salva: ${savedRating} estrelas`
              : language === 'es'
              ? `Calificación guardada: ${savedRating} estrellas`
              : `Saved rating: ${savedRating} stars`}
          </p>
        )}

        {submitted ? (
          <div className="w-full py-3 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>
              {language === 'pt'
                ? 'Obrigado pela sua avaliação!'
                : language === 'es'
                ? '¡Gracias por su calificación!'
                : 'Thank you for your rating!'}
            </span>
          </div>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={selectedRating === 0}
            className={`w-full py-3 rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.99] cursor-pointer ${
              selectedRating > 0
                ? 'bg-[#6366f1] hover:bg-[#4f46e5] text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {savedRating > 0
              ? (language === 'pt' ? 'Atualizar Avaliação' : language === 'es' ? 'Actualizar Calificación' : 'Update Feedback')
              : (language === 'pt' ? 'Enviar Avaliação' : language === 'es' ? 'Enviar Calificación' : 'Submit Feedback')}
          </button>
        )}
      </div>
    </div>
  );
};
