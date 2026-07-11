import { Command, Search } from 'lucide-react'

type SearchInputProps = {
  label?: string
  placeholder: string
}

export function SearchInput({ label = 'Search', placeholder }: SearchInputProps) {
  return (
    <label className="search-input">
      <span className="sr-only">{label}</span>
      <Search aria-hidden="true" size={18} />
      <input placeholder={placeholder} type="search" />
      <span aria-hidden="true">
        <Command aria-hidden="true" size={13} /> K
      </span>
    </label>
  )
}
