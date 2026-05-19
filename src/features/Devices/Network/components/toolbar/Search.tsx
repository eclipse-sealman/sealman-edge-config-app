import { Input } from "@/components/ui/input";
import { useEndpointSearchStore } from "../../stores";

export default function Search() {
  const setSearch = useEndpointSearchStore(s => s.setSearch)
  const search = useEndpointSearchStore(s => s.search)

  return (
    <>
      <Input
        placeholder="Search by IP or machine type"
        onChange={e => setSearch(e.target.value)}
        value={search}
      />
    </>
  )
}
