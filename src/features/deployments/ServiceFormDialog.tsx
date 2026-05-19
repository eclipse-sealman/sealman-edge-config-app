"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, X } from "lucide-react"
import type { components } from "@/generated/edge-administration/types"

type ServiceConfig = components["schemas"]["routers__compose_deployments__schemas__ServiceConfig"]

interface PortRow { external: string; internal: string; protocol: "tcp" | "udp" }
interface VolumeRow { external: string; internal: string }
interface EnvRow { key: string; value: string }

function emptyPort(): PortRow { return { external: "", internal: "", protocol: "tcp" } }

function parseExposedPorts(ports: string[]): PortRow[] {
    return ports.map((p) => {
        const [mapping, protocol] = p.split("/")
        const [external, internal] = mapping.split(":")
        return { external: external ?? "", internal: internal ?? "", protocol: (protocol as "tcp" | "udp") ?? "tcp" }
    })
}

function parseVolumes(volumes: string[]): VolumeRow[] {
    return volumes.map((v) => {
        const [external, internal] = v.split(":")
        return { external: external ?? "", internal: internal ?? "" }
    })
}

function parseEnvs(envs: string[]): EnvRow[] {
    return envs.map((e) => {
        const idx = e.indexOf("=")
        return { key: e.slice(0, idx), value: e.slice(idx + 1) }
    })
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-5 mb-2">{children}</p>
}

interface PortRowsProps {
    rows: PortRow[]
    onChange: (rows: PortRow[]) => void
}

function PortRows({ rows, onChange }: PortRowsProps) {
    function update(i: number, field: keyof PortRow, value: string) {
        const next = rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r)
        onChange(next)
    }
    function remove(i: number) { onChange(rows.filter((_, idx) => idx !== i)) }
    function add() { onChange([...rows, emptyPort()]) }

    return (
        <div className="space-y-2">
            {rows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <Input
                        placeholder="Host port"
                        value={row.external}
                        onChange={(e) => update(i, "external", e.target.value)}
                        className="w-28"
                    />
                    <span className="text-muted-foreground text-sm">:</span>
                    <Input
                        placeholder="Container port"
                        value={row.internal}
                        onChange={(e) => update(i, "internal", e.target.value)}
                        className="w-32"
                    />
                    <select
                        value={row.protocol}
                        onChange={(e) => update(i, "protocol", e.target.value)}
                        className="h-9 rounded-md border border-input bg-transparent px-3 pr-7 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                        <option value="tcp">tcp</option>
                        <option value="udp">udp</option>
                    </select>
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => remove(i)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={add} className="mt-1">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add port
            </Button>
        </div>
    )
}

interface PairRowsProps {
    rows: { left: string; right: string }[]
    leftPlaceholder: string
    rightPlaceholder: string
    separator?: string
    onChange: (rows: { left: string; right: string }[]) => void
    addLabel: string
}

function PairRows({ rows, leftPlaceholder, rightPlaceholder, separator = ":", onChange, addLabel }: PairRowsProps) {
    function update(i: number, side: "left" | "right", value: string) {
        onChange(rows.map((r, idx) => idx === i ? { ...r, [side]: value } : r))
    }
    function remove(i: number) { onChange(rows.filter((_, idx) => idx !== i)) }
    function add() { onChange([...rows, { left: "", right: "" }]) }

    return (
        <div className="space-y-2">
            {rows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                    <Input
                        placeholder={leftPlaceholder}
                        value={row.left}
                        onChange={(e) => update(i, "left", e.target.value)}
                    />
                    <span className="text-muted-foreground text-sm shrink-0">{separator}</span>
                    <Input
                        placeholder={rightPlaceholder}
                        value={row.right}
                        onChange={(e) => update(i, "right", e.target.value)}
                    />
                    <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => remove(i)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={add} className="mt-1">
                <Plus className="h-3.5 w-3.5 mr-1" /> {addLabel}
            </Button>
        </div>
    )
}

interface ServiceFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initial?: ServiceConfig
    onSave: (service: ServiceConfig) => void
    isPending?: boolean
}

export function ServiceFormDialog({ open, onOpenChange, initial, onSave, isPending }: ServiceFormDialogProps) {
    const isEdit = !!initial

    const [name, setName] = useState("")
    const [image, setImage] = useState("")
    const [servingPort, setServingPort] = useState("80")
    const [ports, setPorts] = useState<PortRow[]>([])
    const [volumes, setVolumes] = useState<{ left: string; right: string }[]>([])
    const [envs, setEnvs] = useState<{ left: string; right: string }[]>([])
    const [tileEnabled, setTileEnabled] = useState(false)
    const [tileTitle, setTileTitle] = useState("")
    const [tileDescription, setTileDescription] = useState("")
    const [tileGroup, setTileGroup] = useState("")
    const [tileIcon, setTileIcon] = useState("")

    useEffect(() => {
        if (initial) {
            setName(initial.name)
            setImage(initial.image)
            setServingPort(String(initial.serving_http_port ?? 80))
            setPorts(initial.exposed_ports ? parseExposedPorts(initial.exposed_ports) : [])
            setVolumes(initial.volumes ? parseVolumes(initial.volumes).map((v) => ({ left: v.external, right: v.internal })) : [])
            setEnvs(initial.env ? parseEnvs(initial.env).map((e) => ({ left: e.key, right: e.value })) : [])
            setTileEnabled(initial.tile_enabled ?? true)
            setTileTitle(initial.tile_title === "Unnamed App" ? "" : (initial.tile_title ?? ""))
            setTileDescription(initial.tile_description === "Empty Description" ? "" : (initial.tile_description ?? ""))
            setTileGroup(initial.tile_group === "Undefined" ? "" : (initial.tile_group ?? ""))
            setTileIcon(initial.tile_icon ?? "")
        } else {
            setName("")
            setImage("")
            setServingPort("80")
            setPorts([])
            setVolumes([])
            setEnvs([])
            setTileEnabled(false)
            setTileTitle("")
            setTileDescription("")
            setTileGroup("")
            setTileIcon("")
        }
    }, [initial, open])

    async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => setTileIcon(reader.result as string)
        reader.readAsDataURL(file)
    }

    function handleSave() {
        const service: ServiceConfig = {
            name: name.trim(),
            image: image.trim(),
            serving_http_port: parseInt(servingPort) || 80,
            exposed_ports: ports
                .filter((p) => p.external && p.internal)
                .map((p) => `${p.external}:${p.internal}/${p.protocol}`),
            volumes: volumes
                .filter((v) => v.left && v.right)
                .map((v) => `${v.left}:${v.right}`),
            env: envs
                .filter((e) => e.left)
                .map((e) => `${e.left}=${e.right}`),
            tile_enabled: tileEnabled,
            tile_title: tileTitle.trim() || "Unnamed App",
            tile_description: tileDescription.trim() || "Empty Description",
            tile_group: tileGroup.trim() || "Undefined",
            tile_icon: tileIcon,
        }
        onSave(service)
    }

    const canSave = name.trim().length > 0 && image.trim().length > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? `Edit service — ${initial?.name}` : "Add service"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update the configuration for this container service." : "Configure a new container service for this deployment."}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[65vh] pr-4">
                    <div className="space-y-1 p-2">

                        {/* ── Basic ── */}
                        <SectionLabel>Basic</SectionLabel>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="svc-name">Service name <span className="text-destructive">*</span></Label>
                                <Input
                                    id="svc-name"
                                    placeholder="my-service"
                                    value={name}
                                    disabled={isEdit}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="svc-port">Serving HTTP port</Label>
                                <Input
                                    id="svc-port"
                                    type="number"
                                    value={servingPort}
                                    onChange={(e) => setServingPort(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5 mt-3">
                            <Label htmlFor="svc-image">Docker image <span className="text-destructive">*</span></Label>
                            <Input
                                id="svc-image"
                                placeholder="nginx:latest"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                            />
                        </div>

                        <Separator className="my-4" />

                        {/* ── Ports ── */}
                        <SectionLabel>Exposed ports</SectionLabel>
                        <PortRows rows={ports} onChange={setPorts} />

                        <Separator className="my-4" />

                        {/* ── Volumes ── */}
                        <SectionLabel>Volumes</SectionLabel>
                        <PairRows
                            rows={volumes}
                            leftPlaceholder="/host/path"
                            rightPlaceholder="/container/path"
                            onChange={setVolumes}
                            addLabel="Add volume"
                        />

                        <Separator className="my-4" />

                        {/* ── Env ── */}
                        <SectionLabel>Environment variables</SectionLabel>
                        <PairRows
                            rows={envs}
                            leftPlaceholder="ENV_NAME"
                            rightPlaceholder="value"
                            separator="="
                            onChange={setEnvs}
                            addLabel="Add variable"
                        />

                        <Separator className="my-4" />

                        {/* ── Tile ── */}
                        <div className="flex items-center justify-between">
                            <SectionLabel>Landing page</SectionLabel>
                            <div className="flex items-center gap-2 mt-3">
                                <Switch
                                    id="tile-enabled"
                                    checked={tileEnabled}
                                    onCheckedChange={setTileEnabled}
                                />
                                <Label htmlFor="tile-enabled" className="text-sm font-normal cursor-pointer">
                                    {tileEnabled ? "Enabled" : "Disabled"}
                                </Label>
                            </div>
                        </div>

                        {tileEnabled && (
                            <div className="space-y-3 mt-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="tile-title">Title</Label>
                                        <Input
                                            id="tile-title"
                                            placeholder="My Service"
                                            value={tileTitle}
                                            onChange={(e) => setTileTitle(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="tile-group">Group</Label>
                                        <Input
                                            id="tile-group"
                                            placeholder="Core"
                                            value={tileGroup}
                                            onChange={(e) => setTileGroup(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="tile-desc">Description</Label>
                                    <Input
                                        id="tile-desc"
                                        placeholder="Short description of the service"
                                        value={tileDescription}
                                        onChange={(e) => setTileDescription(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="tile-icon">Icon</Label>
                                    {tileIcon && (
                                        <div className="flex items-center gap-3 mb-2">
                                            <img src={tileIcon} alt="icon preview" className="h-10 w-10 rounded border object-contain" />
                                            <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setTileIcon("")}>
                                                <X className="h-3.5 w-3.5 mr-1" /> Remove
                                            </Button>
                                        </div>
                                    )}
                                    <Input
                                        id="tile-icon"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleIconUpload}
                                        className="cursor-pointer"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!canSave || isPending}>
                        {isPending ? "Saving…" : isEdit ? "Save changes" : "Add service"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}