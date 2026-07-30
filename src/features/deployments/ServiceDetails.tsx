"use client"

import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
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
import { ArrowLeft, AlertCircle, Container, Pencil, CheckCircle2, Zap } from "lucide-react"
import {
    useGetDeployment,
    useCreateOrUpdateDeployment,
    useGetActiveDeployment,
    useSetActiveDeployment,
} from "@/generated/edge-administration/hooks/useDeployments"
import { ServiceFormDialog } from "./ServiceFormDialog"
import type { components } from "@/generated/edge-administration/types"

type ServiceConfig = components["schemas"]["ServiceConfig"]
type DeploymentDetailResponse = components["schemas"]["DeploymentDetailResponse"]

function extractServices(detail: DeploymentDetailResponse): ServiceConfig[] {
    const request = detail.request as { services?: ServiceConfig[] }
    return request?.services ?? []
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[160px_1fr] gap-4 py-3 border-b last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div className="text-sm">{children}</div>
        </div>
    )
}

export default function ServiceDetails() {
    const { deploymentId, serviceId } = useParams<{ deploymentId: string; serviceId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { data: detailRaw, isLoading, isError } = useGetDeployment(deploymentId ?? "")
    const { data: activeData } = useGetActiveDeployment()
    const saveDeployment = useCreateOrUpdateDeployment()
    const setActiveDeployment = useSetActiveDeployment()

    const activeDeployment = activeData?.active_deployment ?? null

    const [editOpen, setEditOpen] = useState(false)
    const [isDirty, setIsDirty] = useState(false)
    const [redeployConfirmOpen, setRedeployConfirmOpen] = useState(false)
    const [redeploySuccessOpen, setRedeploySuccessOpen] = useState(false)

    const backButton = (
        <Button variant="secondary" size="sm" className="h-7 px-2 text-muted-background" onClick={() => navigate("..")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {deploymentId}
        </Button>
    )

    if (isLoading) {
        return (
            <div className="flex flex-col h-full">
                <div className="px-6 py-4 border-b bg-background space-y-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-7 w-48" />
                </div>
                <div className="px-6 py-4 space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-[160px_1fr] gap-4 py-3 border-b">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (isError || !detailRaw) {
        return (
            <div className="flex flex-col h-full">
                <div className="px-6 py-4 border-b bg-background">{backButton}</div>
                <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 text-destructive opacity-60" />
                    <p className="text-sm">Failed to load service.</p>
                </div>
            </div>
        )
    }

    const detail = detailRaw as DeploymentDetailResponse
    const services = extractServices(detail)
    const svc = services.find((s) => s.name === serviceId)
    const isActive = activeDeployment === detail.name

    if (!svc) {
        return (
            <div className="flex flex-col h-full">
                <div className="px-6 py-4 border-b bg-background">{backButton}</div>
                <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
                    <Container className="h-8 w-8 opacity-30" />
                    <p className="text-sm">Service not found.</p>
                </div>
            </div>
        )
    }

    async function handleEditSave(updated: ServiceConfig) {
        const updatedServices = services.map((s) => (s.name === updated.name ? updated : s))
        await saveDeployment.mutateAsync({
            params: { path: { name: detail.name } },
            body: {
                description: detail.description ?? undefined,
                services: updatedServices,
            },
        })
        queryClient.invalidateQueries({ queryKey: ["/compose-deployments/{name}", { path: { name: detail.name } }] })
        setEditOpen(false)
        setIsDirty(true)
    }

    async function handleRedeploy() {
        await setActiveDeployment.mutateAsync({ params: { path: { name: detail.name } } })
        setIsDirty(false)
        setRedeployConfirmOpen(false)
        setRedeploySuccessOpen(true)
        queryClient.invalidateQueries({ queryKey: ["/active-deployment"] })
    }

    const imageParts = svc.image.split(":")
    const imageVersion = imageParts.length > 1 ? imageParts[imageParts.length - 1] : "latest"
    const imageBase = imageParts.slice(0, -1).join(":") || svc.image

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-vibrant-blue">
                <div className="flex items-center gap-2 mb-3">{backButton}</div>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        {svc.tile_icon ? (
                            <img src={svc.tile_icon} alt="" className="bg-white p-1 h-12 w-12 rounded object-contain shrink-0 mt-0.5" />
                        ) : (
                            <Container className="h-10 w-10 text-white shrink-0 mt-0.5" />
                        )}
                        <div>
                            <h1 className="text-xl font-semibold text-white">{svc.name}</h1>
                            {svc.tile_description && svc.tile_description !== "Empty Description" && (
                                <p className="text-sm text-white mt-0.5">{svc.tile_description}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isDirty && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setRedeployConfirmOpen(true)}
                                className={isActive ? "border-red-400 text-red-500 hover:bg-red-50" : ""}
                            >
                                <Zap className="h-4 w-4 mr-1" />
                                {isActive ? "Redeploy" : "Activate & deploy"}
                            </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                            <Pencil className="h-4 w-4 mr-1" /> Edit
                        </Button>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="flex-1 overflow-auto px-6 py-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-4 mb-1">Container</p>

                <InfoRow label="Image">
                    <span className="font-mono">{imageBase}</span>
                </InfoRow>

                <InfoRow label="Version">
                    <Badge variant="secondary" className="font-mono text-xs">{imageVersion}</Badge>
                </InfoRow>

                <InfoRow label="Serving HTTP port">
                    <span className="font-mono">{svc.serving_http_port ?? 80}</span>
                </InfoRow>

                <InfoRow label="Exposed ports">
                    {svc.exposed_ports && svc.exposed_ports.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {svc.exposed_ports.map((p) => (
                                <Badge key={p} variant="secondary" className="font-mono text-xs">{p}</Badge>
                            ))}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )}
                </InfoRow>

                <InfoRow label="Volumes">
                    {svc.volumes && svc.volumes.length > 0 ? (
                        <div className="space-y-1">
                            {svc.volumes.map((v) => (
                                <div key={v} className="font-mono text-xs text-muted-foreground">{v}</div>
                            ))}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )}
                </InfoRow>

                <InfoRow label="Environment vars">
                    {svc.env && svc.env.length > 0 ? (
                        <div className="space-y-1">
                            {svc.env.map((e) => {
                                const idx = e.indexOf("=")
                                const key = e.slice(0, idx)
                                const val = e.slice(idx + 1)
                                return (
                                    <div key={e} className="flex items-baseline gap-2 font-mono text-xs">
                                        <span className="text-foreground">{key}</span>
                                        <span className="text-muted-foreground">=</span>
                                        <span className="text-muted-foreground break-all">{val}</span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">—</span>
                    )}
                </InfoRow>

                {svc.tile_enabled && (
                    <>
                        <Separator className="my-4" />
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Landing page tile</p>

                        <InfoRow label="Title">
                            {svc.tile_title !== "Unnamed App" ? svc.tile_title : <span className="text-muted-foreground">—</span>}
                        </InfoRow>

                        <InfoRow label="Group">
                            {svc.tile_group && svc.tile_group !== "Undefined" ? (
                                <Badge variant="secondary" className="text-xs">{svc.tile_group}</Badge>
                            ) : (
                                <span className="text-muted-foreground">—</span>
                            )}
                        </InfoRow>

                        <InfoRow label="Description">
                            {svc.tile_description && svc.tile_description !== "Empty Description"
                                ? svc.tile_description
                                : <span className="text-muted-foreground">—</span>
                            }
                        </InfoRow>
                    </>
                )}
            </div>

            <ServiceFormDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                initial={svc}
                onSave={handleEditSave}
                isPending={saveDeployment.isPending}
            />

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
                        <AlertDialogCancel disabled={setActiveDeployment.isPending}>Cancel</AlertDialogCancel>
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
                        <AlertDialogAction onClick={() => setRedeploySuccessOpen(false)}>Done</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
