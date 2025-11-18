import * as React from 'react'
import { cn } from '@/lib/utils/cn'

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-slate-900 focus:outline-none',
        className
      )}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'
