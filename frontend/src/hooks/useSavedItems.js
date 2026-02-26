import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

export default function useSavedItems(user) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchItems = async () => {
    if (!user?.id) return   // ✅ prevent crash if user is null

    setLoading(true)

    const { data, error } = await supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching items:', error.message)
    } else {
      setItems(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchItems()
  }, [user])

  return { items, loading, refetch: fetchItems }
}