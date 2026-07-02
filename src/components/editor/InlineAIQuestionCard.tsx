import type { EditingCategory } from '../../types/reeditpro'
import { InlineEditingCategoryCard } from './InlineEditingCategoryCard'

type InlineAIQuestionCardProps = {
  selectedCategory: EditingCategory
  onSelect: (value: EditingCategory) => void
}

export function InlineAIQuestionCard({ onSelect, selectedCategory }: InlineAIQuestionCardProps) {
  return <InlineEditingCategoryCard onSelect={onSelect} selectedCategory={selectedCategory} />
}
