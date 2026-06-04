export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('pt-BR').format(d)
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export const LEGISLATURA_ATUAL = 57
export const ANO_ATUAL = new Date().getFullYear()
