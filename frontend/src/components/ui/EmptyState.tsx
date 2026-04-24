export default function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-4xl mb-2">📭</p>
      <p className="text-sm">{message}</p>
    </div>
  )
}
