import FeedCard from './FeedCard'

export default function FeedGrid({ items, refetch }) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 mt-4">
      {items.map(item => (
        <div key={item.id} className="break-inside-avoid mb-4">
          <FeedCard item={item} refetch={refetch} />
        </div>
      ))}
    </div>
  )
}