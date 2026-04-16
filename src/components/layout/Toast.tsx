import { useUI } from '../../stores/ui';

export function Toast() {
  const toasts = useUI((s) => s.toasts);
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-[toast-in_0.2s_ease-out] ${
            t.type === 'error' ? 'bg-red-600 text-white' :
            t.type === 'success' ? 'bg-green-600 text-white' :
            'bg-g700 text-white'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
