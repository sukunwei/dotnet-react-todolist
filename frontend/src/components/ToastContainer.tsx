import { XMarkIcon } from '@heroicons/react/24/outline'
import type { Toast } from '../types/todo'

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 top-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`rounded-lg border-l-4 bg-white p-4 shadow-lg ${
            toast.type === 'success' ? 'border-emerald-500' : 'border-red-500'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-slate-700">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="關閉通知"
              className="shrink-0 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <XMarkIcon className="h-4 w-4 text-slate-400 hover:text-slate-600" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
