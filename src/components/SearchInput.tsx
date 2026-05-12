import { Command, Search } from 'lucide-react'

type SearchInputProps = {
  placeholder: string
}

export function SearchInput({ placeholder }: SearchInputProps) {
  return (
    <label className="search-input">
      <Search aria-hidden="true" size={18} />
      <input aria-label={placeholder} placeholder={placeholder} type="search" />
      <span>
        <Command size={13} /> K
      </span>
    </label>
  )
}
