"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Trash2, Pencil, MoreHorizontal, Zap, CheckCircle2, AlertCircle } from "lucide-react"
import {
    useListDeployments,
    useGetActiveDeployment,
    useCreateOrUpdateDeployment,
    useSetActiveDeployment,
    useDeleteActiveDeployment,
    useDeleteDeployment,
} from "@/generated/edge-administration/hooks/useDeployments"

import { formatDistanceToNowStrict } from "date-fns"

function fmtDate(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    if (diff < 60000) return "just now"
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true })
}

export default function Deployments() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { data: deployments, isLoading: deploymentsLoading, isError: deploymentsError } = useListDeployments()
    const { data: activeData } = useGetActiveDeployment()
    const createOrUpdate = useCreateOrUpdateDeployment()
    const activate = useSetActiveDeployment()
    const deleteActiveDeployment = useDeleteActiveDeployment()
    const deleteDeployment = useDeleteDeployment()

    const activeDeployment = activeData?.active_deployment ?? null

    const [createOpen, setCreateOpen] = useState(false)
    const [createName, setCreateName] = useState("")
    const [createDesc, setCreateDesc] = useState("")

    const [renameOpen, setRenameOpen] = useState(false)
    const [renamingName, setRenamingName] = useState("")
    const [renameNewName, setRenameNewName] = useState("")
    const [renameDesc, setRenameDesc] = useState("")

    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)

    function invalidate() {
        queryClient.invalidateQueries({ queryKey: ["/compose-deployments"] })
        queryClient.invalidateQueries({ queryKey: ["/compose-deployments/active-deployment"] })
    }

    async function handleCreate() {
        if (!createName.trim()) return
        await createOrUpdate.mutateAsync({
			params: { path: { name: createName.trim() } },
            body: { description: createDesc.trim() || null, services: [] },
        })
        setCreateName("")
        setCreateDesc("")
        setCreateOpen(false)
        invalidate()
    }

    function openRename(name: string, description: string | null | undefined, e: React.MouseEvent) {
        e.stopPropagation()
        setRenamingName(name)
        setRenameNewName(name)
        setRenameDesc(description ?? "")
        setRenameOpen(true)
    }

    async function handleRename() {
        if (!renameNewName.trim()) return
        await createOrUpdate.mutateAsync({
			params: { path: { name: renameNewName.trim() } },
            body: { description: renameDesc.trim() || null, services: [] },
        })
        setRenameOpen(false)
        invalidate()
    }

    function openDelete(name: string, e: React.MouseEvent) {
        e.stopPropagation()
        setDeleteTarget(name)
        setDeleteOpen(true)
    }

    async function handleDelete() {
        if (!deleteTarget) return

        if (activeDeployment === deleteTarget) {
            await deleteActiveDeployment.mutateAsync({})
        }

        await deleteDeployment.mutateAsync({ params: { path: { name: deleteTarget } } })
        setDeleteOpen(false)
        setDeleteTarget(null)
        invalidate()
    }

    async function handleActivate(name: string, e: React.MouseEvent) {
        e.stopPropagation()
        await activate.mutateAsync({ params: { path: { name } } })
        invalidate()
    }

    return (
        <div className="flex flex-col h-full">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-4 px-3 py-3 border-b bg-vibrant-blue">
                <div className="flex items-center gap-2">
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="secondary">
                                <Plus className="h-4 w-4 mr-1" />
                                New deployment
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create deployment</DialogTitle>
                                <DialogDescription>Add a new compose deployment configuration.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-2">
                                <div className="grid gap-1.5">
                                    <Label htmlFor="create-name">Name</Label>
                                    <Input
                                        id="create-name"
                                        placeholder="my-deployment"
                                        value={createName}
                                        onChange={(e) => setCreateName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label htmlFor="create-desc">
                                        Description <span className="text-muted-foreground font-normal">(optional)</span>
                                    </Label>
                                    <Textarea
                                        id="create-desc"
                                        placeholder="Short description…"
                                        rows={2}
                                        value={createDesc}
                                        onChange={(e) => setCreateDesc(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleCreate}
                                    disabled={!createName.trim() || createOrUpdate.isPending}
                                >
                                    {createOrUpdate.isPending ? "Creating…" : "Create"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Active deployment pill */}
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-white">Active deployment:</span>
                    {activeDeployment ? (
                        <Badge variant="secondary" className="flex items-center gap-1 px-2.5 py-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {activeDeployment}
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-muted-foreground">None</Badge>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto px-3">
                {deploymentsError ? (
                    <div className="flex items-center justify-center h-48 gap-2 text-muted-foreground">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <span className="text-sm">Failed to load deployments.</span>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {deploymentsLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                        <TableCell />
                                    </TableRow>
                                ))
                            ) : deployments?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                        No deployments yet. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                deployments?.map((dep) => {
                                    const isActive = activeDeployment === dep.name
                                    const isActivating = activate.isPending && activate.variables?.params?.path?.name === dep.name
                                    return (
                                        <TableRow
                                            key={dep.name}
                                            className="cursor-pointer"
                                            onClick={() => navigate(dep.name)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {dep.name}
                                                    {isActive && <Badge variant="secondary" className="text-xs">active</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {dep.description ?? <span className="italic text-muted-foreground/60">—</span>}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{fmtDate(dep.updated_at)}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{fmtDate(dep.created_at)}</TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">More actions</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            disabled={isActive || isActivating}
                                                            onClick={(e) => handleActivate(dep.name, e)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Zap className="h-4 w-4 mr-2" />
                                                            {isActivating ? "Activating…" : "Activate"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={(e) => openRename(dep.name, dep.description, e)} className="cursor-pointer">
                                                            <Pencil className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive cursor-pointer"
                                                            onClick={(e) => openDelete(dep.name, e)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Rename dialog */}
            <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit deployment</DialogTitle>
                        <DialogDescription>
                            Rename or update the description for <strong>{renamingName}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-1.5">
                            <Label htmlFor="rename-name">Name</Label>
                            <Input
                                id="rename-name"
                                value={renameNewName}
                                onChange={(e) => setRenameNewName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="rename-desc">
                                Description <span className="text-muted-foreground font-normal">(optional)</span>
                            </Label>
                            <Textarea
                                id="rename-desc"
                                rows={2}
                                value={renameDesc}
                                onChange={(e) => setRenameDesc(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
                        <Button
                            onClick={handleRename}
                            disabled={!renameNewName.trim() || createOrUpdate.isPending}
                        >
                            {createOrUpdate.isPending ? "Saving…" : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete alert */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete deployment?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete <strong>{deleteTarget}</strong>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteDeployment.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteDeployment.isPending ? "Deleting…" : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
