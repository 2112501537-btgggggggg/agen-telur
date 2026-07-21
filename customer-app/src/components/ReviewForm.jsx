import { useState } from 'react';
import { submitReview } from '../api/orders.api';

function Star({ filled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-2xl transition ${
        filled ? 'text-egg-yolk' : 'text-neutral-300'
      } hover:scale-110`}
    >
      {filled ? '★' : '☆'}
    </button>
  );
}

export default function ReviewForm({ orderId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [damagedEggCount, setDamagedEggCount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    setError('');

    try {
      await submitReview(orderId, {
        rating,
        comment: comment.trim() || undefined,
        damagedEggCount:
          damagedEggCount !== '' ? Number(damagedEggCount) : undefined,
      });
      onSuccess();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Gagal mengirim review';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 space-y-4">
      <h3 className="font-semibold text-barn-brown" style={{ fontFamily: 'Poppins, sans-serif' }}>
        Ulas Produk
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star rating */}
        <div>
          <p className="text-sm font-medium text-barn-brown mb-2">Rating *</p>
          <div
            className="flex gap-1"
            onMouseLeave={() => setHoveredStar(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                filled={star <= (hoveredStar || rating)}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
              />
            ))}
          </div>
        </div>

        {/* Comment textarea */}
        <div>
          <label
            htmlFor="review-comment"
            className="block text-sm font-medium text-barn-brown mb-1"
          >
            Komentar <span className="text-neutral-400">(opsional)</span>
          </label>
          <textarea
            id="review-comment"
            rows="3"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-egg-yolk focus:border-egg-yolk outline-none transition text-barn-brown resize-none"
            placeholder="Bagaimana kualitas telurnya?"
          />
        </div>

        {/* Damaged egg count */}
        <div>
          <label
            htmlFor="review-damaged"
            className="block text-sm font-medium text-barn-brown mb-1"
          >
            Telur Pecah <span className="text-neutral-400">(opsional)</span>
          </label>
          <input
            id="review-damaged"
            type="number"
            min="0"
            value={damagedEggCount}
            onChange={(e) => setDamagedEggCount(e.target.value)}
            className="w-24 px-3 py-2 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-egg-yolk focus:border-egg-yolk outline-none transition text-barn-brown"
            placeholder="0"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="text-alert-red text-sm bg-alert-red/10 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={rating === 0 || submitting}
          className={`px-6 py-2.5 rounded-lg text-white font-semibold transition ${
            rating > 0 && !submitting
              ? 'bg-egg-yolk hover:bg-warm-amber'
              : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Mengirim...' : 'Kirim Review'}
        </button>
      </form>
    </div>
  );
}
