import { Code2, X, ArrowUpAZ, ArrowDownZA } from "lucide-react"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

interface FilterButtonsProps {
  setLanguageFilter: (value: string) => void
  setOrderSort: (value: string) => void
}

export function FilterButtons({ setLanguageFilter, setOrderSort }: FilterButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3 sm:gap-4 items-center">

      <ToggleGroup variant="outline" type="single" onValueChange={setLanguageFilter} className="flex-wrap">
        <ToggleGroupItem value="html" aria-label="Filtrar por HTML" className="text-xs">
          <Code2 className="size-3.5 mr-1.5" />
          HTML
        </ToggleGroupItem>
        <ToggleGroupItem value="javascript" aria-label="Filtrar por JavaScript" className="text-xs">
          <Code2 className="size-3.5 mr-1.5" />
          JS
        </ToggleGroupItem>
        <ToggleGroupItem value="python" aria-label="Filtrar por Python" className="text-xs">
          <Code2 className="size-3.5 mr-1.5" />
          PY
        </ToggleGroupItem>
        <ToggleGroupItem value="sql" aria-label="Filtrar por SQL" className="text-xs">
          <Code2 className="size-3.5 mr-1.5" />
          SQL
        </ToggleGroupItem>
        <ToggleGroupItem value="react" aria-label="Filtrar por React" className="text-xs">
          <Code2 className="size-3.5 mr-1.5" />
          REACT
        </ToggleGroupItem>
        <ToggleGroupItem value="" aria-label="Limpiar filtro" className="text-xs">
          <X className="size-3.5 mr-1.5" />
          Reset
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup variant="outline" type="single" defaultValue="desc" onValueChange={setOrderSort}>
        <ToggleGroupItem value="asc" aria-label="Ordenar de más antiguo a más reciente">
          <ArrowUpAZ className="size-4 mr-1.5" />
        </ToggleGroupItem>
        <ToggleGroupItem value="desc" aria-label="Ordenar de más reciente a más antiguo">
          <ArrowDownZA className="size-4 mr-1.5" />
        </ToggleGroupItem>
      </ToggleGroup>

    </div>
  )
}
