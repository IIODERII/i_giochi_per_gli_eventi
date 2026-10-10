export default function Loader({ testo = 'Caricamento…' }: { testo?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-primario-700">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-primario-200 border-t-primario-700" />
      <span className="text-sm font-medium">{testo}</span>
    </div>
  )
}
