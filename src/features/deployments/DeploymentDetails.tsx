"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
import { ArrowLeft, CheckCircle2, Container, AlertCircle, Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react"
import { useGetDeployment, useGetActiveDeployment, useCreateOrUpdateDeployment, useSetActiveDeployment } from "@/generated/edge-administration/hooks/useDeployments"
import { Zap } from "lucide-react"
import { ServiceFormDialog } from "./ServiceFormDialog"
import type { components } from "@/generated/edge-administration/types"

type ServiceConfig = components["schemas"]["ServiceConfig"]
type DeploymentDetailResponse = components["schemas"]["DeploymentDetailResponse"]

function shortImage(image: string) {
    const parts = image.split("/")
    return parts[parts.length - 1]
}

function extractServices(detail: DeploymentDetailResponse): ServiceConfig[] {
    const request = detail.request as { services?: ServiceConfig[] }
    return request?.services ?? []
}

function HeaderSkeleton() {
    return (
        <div className="px-6 py-4 border-b bg-background space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
        </div>
    )
}

function TableSkeleton() {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Ports</TableHead>
                    <TableHead>Tile</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell />
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

export default function DeploymentDetails() {
    const { deploymentId } = useParams<{ deploymentId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { data: detailRaw, isLoading, isError } = useGetDeployment(deploymentId ?? "")
    const { data: activeData } = useGetActiveDeployment()
    const saveDeployment = useCreateOrUpdateDeployment()

    const activeDeployment = activeData?.active_deployment ?? null

    const [formOpen, setFormOpen] = useState(false)
    const [editingService, setEditingService] = useState<ServiceConfig | undefined>(undefined)
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)

    const setActiveDeployment = useSetActiveDeployment()
    const [isDirty, setIsDirty] = useState(false)

    const [redeployConfirmOpen, setRedeployConfirmOpen] = useState(false)
    const [redeploySuccessOpen, setRedeploySuccessOpen] = useState(false)

    const backButton = (
        <Button variant="secondary" size="sm" className="h-7 px-2 text-muted-background" onClick={() => navigate("..")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Deployments
        </Button>
    )

    if (isLoading) {
        return (
            <div className="flex flex-col h-full">
                <HeaderSkeleton />
                <div className="flex-1 overflow-auto"><TableSkeleton /></div>
            </div>
        )
    }

    if (isError || !detailRaw) {
        return (
            <div className="flex flex-col h-full">
                <div className="px-6 py-4 border-b bg-background">{backButton}</div>
                <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 text-destructive opacity-60" />
                    <p className="text-sm">Failed to load deployment.</p>
                </div>
            </div>
        )
    }

    const detail = detailRaw as DeploymentDetailResponse
    const services = extractServices(detail)
    const isActive = activeDeployment === detail.name

    async function saveServices(updatedServices: ServiceConfig[]) {
        await saveDeployment.mutateAsync({
			params: {
				path: { name: detail.name }
			},
            body: {
                description: detail.description ?? undefined,
                services: updatedServices,
            },
        })
        queryClient.invalidateQueries({ queryKey: ["/compose-deployments/{name}", { path: { name: detail.name } }] })
        setIsDirty(true)
    }

    async function handleServiceSave(service: ServiceConfig) {
        const exists = services.find((s) => s.name === service.name)
        const updated = exists
            ? services.map((s) => (s.name === service.name ? service : s))
            : [...services, service]
        await saveServices(updated)
        setFormOpen(false)
        setEditingService(undefined)
    }

    async function handleServiceDelete() {
        if (!deleteTarget) return
        await saveServices(services.filter((s) => s.name !== deleteTarget))
        setDeleteOpen(false)
        setDeleteTarget(null)
    }

    async function handleRedeploy() {
        await setActiveDeployment.mutateAsync({ params: { path: { name: detail.name } } })
        setIsDirty(false)
        setRedeployConfirmOpen(false)
        setRedeploySuccessOpen(true)
        queryClient.invalidateQueries({ queryKey: ["/compose-deployments/active-deployment"] })
    }

    function openAdd() { setEditingService(undefined); setFormOpen(true) }
    function openEdit(svc: ServiceConfig, e: React.MouseEvent) { e.stopPropagation(); setEditingService(svc); setFormOpen(true) }
    function openDelete(name: string, e: React.MouseEvent) { e.stopPropagation(); setDeleteTarget(name); setDeleteOpen(true) }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-3 py-4 border-b bg-vibrant-blue">
                <div className="flex items-center gap-2 mb-3 px-3">{backButton}</div>
                <div className="flex items-start justify-between gap-4 px-3">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-white">{detail.name}</h1>
                            {isActive && (
                                <Badge variant="secondary" className="flex items-center gap-1 text-muted-background">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    active
                                </Badge>
                            )}
                        </div>
                        {detail.description && (
                            <p className="text-sm text-white mt-1">{detail.description}</p>
                        )}
                        <p className="text-xs text-white mt-2">
                            {services.length} service{services.length !== 1 ? "s" : ""}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {(isActive && isDirty) && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setRedeployConfirmOpen(true)}
                                className="border-red-400 text-red-500 hover:bg-red-50"
                            >
                                <Zap className="h-4 w-4 mr-1" />
                                Redeploy
                            </Button>
                        )}
                        {!isActive && isDirty && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setRedeployConfirmOpen(true)}
                            >
                                <Zap className="h-4 w-4 mr-1" />
                                Activate & deploy
                            </Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={openAdd}>
                            <Plus className="h-4 w-4 mr-1" /> Add service
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto px-3">
                {services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
                        <Container className="h-8 w-8 opacity-30" />
                        <p className="text-sm">No services configured.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Service</TableHead>
                                <TableHead>Image</TableHead>
                                <TableHead>Ports</TableHead>
                                <TableHead className="w-48">Landing page</TableHead>
                                <TableHead className="w-12 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map((svc) => (
                                <TableRow
                                    key={svc.name}
                                    className="cursor-pointer"
                                    onClick={() => navigate(`services/${svc.name}`)}
                                >
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            {svc.tile_icon ? (
                                                <img src={svc.tile_icon} alt="" className="h-4 w-4 rounded object-contain shrink-0" />
                                            ) : (
                                                <Container className="h-4 w-4 text-muted-foreground shrink-0" />
                                            )}
                                            {svc.name}
                                        </div>
                                    </TableCell>

                                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[220px]">
                                        <span title={svc.image} className="block truncate">{shortImage(svc.image)}</span>
                                    </TableCell>

                                    <TableCell>
                                        {svc.exposed_ports && svc.exposed_ports.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {svc.exposed_ports.map((p) => (
                                                    <Badge key={p} variant="secondary" className="font-mono text-xs">{p}</Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">—</span>
                                        )}
                                    </TableCell>

                                    <TableCell className="text-left">
                                        <span>
                                            {svc.tile_enabled ? "Enabled" : "Disabled"}
                                        </span>
                                    </TableCell>

                                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">More</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => openEdit(svc, e)} className="cursor-pointer">
                                                    <Pencil className="h-4 w-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive cursor-pointer"
                                                    onClick={(e) => openDelete(svc.name, e)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <ServiceFormDialog
                open={formOpen}
                onOpenChange={(o) => { setFormOpen(o); if (!o) setEditingService(undefined) }}
                initial={editingService}
                onSave={handleServiceSave}
                isPending={saveDeployment.isPending}
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove service?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove <strong>{deleteTarget}</strong> from the deployment. The change takes effect on next activate.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleServiceDelete}
                            disabled={saveDeployment.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {saveDeployment.isPending ? "Removing…" : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            {/* Redeploy confirmation */}
            <AlertDialog open={redeployConfirmOpen} onOpenChange={setRedeployConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {isActive ? "Redeploy deployment?" : "Activate & deploy?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {isActive
                                ? <>This will push the latest configuration of <strong>{detail.name}</strong> to all devices immediately.</>
                                : <>This will activate <strong>{detail.name}</strong> and push it to all devices immediately.</>
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={setActiveDeployment.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRedeploy}
                            disabled={setActiveDeployment.isPending}
                        >
                            {setActiveDeployment.isPending
                                ? (isActive ? "Redeploying…" : "Activating…")
                                : (isActive ? "Redeploy" : "Activate & deploy")
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Redeploy success */}
            <AlertDialog open={redeploySuccessOpen} onOpenChange={setRedeploySuccessOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            Deployment successful
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{detail.name}</strong> has been pushed to all devices successfully.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setRedeploySuccessOpen(false)}>
                            Done
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
