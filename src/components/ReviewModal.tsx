import React, { useState } from 'react';
import { X, Star } from 'lucide-react';

interface ReviewModalProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  productId,
  productName,
  isOpen,
  onClose,
  onReviewSubmitted,
}) => {
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !comment.trim()) {
      setError('Please provide your name and review impressions.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author, rating, comment }),
      });
      if (res.ok) {
        onReviewSubmitted();
        onClose();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to submit review');
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white rounded-xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EDE8DF]">
        <div className="flex items-start justify-between pb-4 border-b border-[#F0ECE1]">
          <div>
            <h3 className="text-xl font-serif font-semibold text-neutral-900">
              Share Your Impressions
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md">{error}</p>}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform focus:outline-none"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? 'text-[#D4AF37] fill-[#D4AF37]'
                        : 'text-neutral-300'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs text-neutral-500 ml-2 font-medium">
                {rating === 5
                  ? 'Exquisite (5/5)'
                  : rating === 4
                  ? 'Very Good (4/5)'
                  : `${rating} / 5`}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Your Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Vivienne D."
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Your Review & Styling Notes
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe the leather texture, hardware finish, everyday capacity, and styling versatility..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-md text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-neutral-900 text-white rounded-full text-xs font-semibold tracking-wide hover:bg-black transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
