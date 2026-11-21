import type { TodoCounts, TodoFilter } from '../types/todo'

interface FilterTabsProps {
  counts: TodoCounts
  active: TodoFilter
  onChange: (filter: TodoFilter) => void
}

const TABS: { key: TodoFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '進行中' },
  { key: 'completed', label: '已完成' },
]

export default function FilterTabs({ counts, active, onChange }: FilterTabsProps) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-1" role="group" aria-label="篩選任務">
      {TABS.map((tab) => {
        const selected = tab.key === active
        const count =
          tab.key === 'all'
            ? counts.all
            : tab.key === 'active'
              ? counts.active
              : counts.completed

        return (
          <button
            key={tab.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(tab.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              selected
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
            <span className="ml-1.5">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
