/**
 * Minimal stand-ins for `@deepseek-ai/dsh-client-ui-primitives`, used only by
 * the recipe-library render regression test. The real package bare-imports
 * katex CSS at module top level, which Vitest (in node transform mode) cannot
 * resolve as an unknown `.css` extension; stubbing keeps the test focused on
 * the component's own render rules without rendering the real modal chrome.
 */
import type { ReactNode } from 'react'

export function Button({ children, onClick, disabled, className }: {
  children?: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <button className={className} disabled={disabled} onClick={(e) => { e.preventDefault(); onClick?.() }}>
      {children}
    </button>
  )
}

export function Input({ value, onChange, placeholder, className }: {
  value?: string
  onChange?: (e: { target: { value: string } }) => void
  placeholder?: string
  className?: string
}) {
  return <input className={className} value={value} onChange={e => onChange?.({ target: { value: e.target.value } })} placeholder={placeholder} />
}

export function Modal({ open, children, footer, onClose, title }: {
  open: boolean
  children?: ReactNode
  footer?: ReactNode
  onClose?: () => void
  title?: string
}) {
  if (!open) return null
  return (
    <div role="dialog">
      <div>{title}</div>
      <div>{children}</div>
      <div>{footer}</div>
      <button aria-label="close" onClick={() => onClose?.()} />
    </div>
  )
}
