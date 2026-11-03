import { useState } from 'react'
import { useDebounce } from './utils'

/** Etat standard d'une liste paginee : page, recherche (avec delai), archives. */
export function useListState(pageSize = 20) {
  const [page, setPage] = useState(1)
  const [search, setSearchValue] = useState('')
  const [archived, setArchivedValue] = useState(false)
  const debouncedSearch = useDebounce(search)

  return {
    page,
    setPage,
    search,
    // Toute modification d'un filtre ramene a la premiere page
    setSearch: (value: string) => {
      setSearchValue(value)
      setPage(1)
    },
    archived,
    setArchived: (value: boolean) => {
      setArchivedValue(value)
      setPage(1)
    },
    params: {
      page,
      pageSize,
      search: debouncedSearch || undefined,
      archived: archived || undefined,
    },
  }
}
