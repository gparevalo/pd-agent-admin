import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRoute, Link, useLocation } from "wouter"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, Rocket, Edit, BarChart3 } from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { apiRequest } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"

import CompanyOperations from "./components/CompanyOperations"
import CompanyAIAssets from "./components/CompanyAIAssets"
import CompanyBilling from "./components/CompanyBilling"
import CompanyTeam from "./components/CompanyTeam"
import CompanyActivity from "./components/CompanyActivity"
import KickoffDialog from "./components/KickoffDialog"

import { useState } from "react"
import type { Company } from "@shared/schema"
import CompanyOverview from "./CompanyOverview"

export default function CompanyDetail() {

    const [, params] = useRoute("/admin/companies/:id")
    const [location, setLocation] = useLocation()

    const queryParams = new URLSearchParams(window.location.search)
    const defaultTab = queryParams.get("tab") || "overview"

    const companyId = params?.id
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const [kickoffModal, setKickoffModal] = useState({
        open: false,
        token: undefined
    })

    const { data: company, isLoading } = useQuery<Company>({
        queryKey: [`/api/admin/companies/${companyId}`],
        enabled: !!companyId
    })

    const { data: client360 } = useQuery<any>({
        queryKey: [`/api/admin/client-operations/client-360/${companyId}`],
        enabled: !!companyId
    })

    const kickoffMutation = useMutation({

        mutationFn: async () => {
            const res = await apiRequest(
                "POST",
                `/api/admin/companies/${companyId}/kickoff-token`
            )

            return res.json()
        },

        onSuccess: (data) => {

            setKickoffModal({
                open: true,
                token: data.token
            })

        },

        onError: (error: Error) => {

            toast({
                title: "Error al generar enlace",
                description: error.message,
                variant: "destructive"
            })

        }

    })

    const handleTabChange = (value: string) => {

        setLocation(`/admin/companies/${companyId}?tab=${value}`)

    }

    if (isLoading) {

        return (
            <div className="p-6 flex justify-center h-screen items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )

    }

    if (!company) {

        return <div className="p-6 text-center">Empresa no encontrada</div>

    }

    return (

        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 max-w-7xl mx-auto space-y-6"
        >

            {/* HEADER */}

            <div className="flex items-center justify-between">

                <div className="flex items-center gap-4">

                    <Link href="/admin/companies">

                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>

                    </Link>

                    <div>

                        <div className="flex items-center gap-3">

                            <h1 className="text-3xl font-bold tracking-tight">
                                {company.name}
                            </h1>

                            <Badge
                                variant={company.status === "active" ? "default" : "secondary"}
                                className="uppercase"
                            >
                                {company.status}
                            </Badge>

                            {client360?.profile?.client_classification && (

                                <Badge
                                    variant="outline"
                                    className="border-primary/50 text-primary"
                                >

                                    {client360.profile.client_classification.replace("_", " ")}

                                </Badge>

                            )}

                        </div>

                        <p className="text-muted-foreground mt-1">
                            {company.legal_name || "Workspace de Cliente"}
                        </p>

                    </div>

                </div>

                <div className="flex gap-3">

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => kickoffMutation.mutate()}
                        disabled={kickoffMutation.isPending}
                    >

                        {kickoffMutation.isPending
                            ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            : <Rocket className="h-4 w-4 mr-2" />
                        }

                        Editar Kickoff

                    </Button>

                    <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Reporte 360
                    </Button>

                    <Button size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Perfil
                    </Button>

                </div>

            </div>

            {/* TABS */}

            <Tabs
                defaultValue={defaultTab}
                onValueChange={handleTabChange}
                className="space-y-6"
            >

                <TabsList className="bg-muted/50 p-1 w-full justify-start border-b rounded-none">

                    <TabsTrigger value="overview">
                        Resumen
                    </TabsTrigger>

                    <TabsTrigger value="operations">
                        Operaciones
                    </TabsTrigger>

                    <TabsTrigger value="ai-assets">
                        Agentes IA
                    </TabsTrigger>

                    <TabsTrigger value="billing">
                        Facturación
                    </TabsTrigger>

                    <TabsTrigger value="team">
                        Equipo
                    </TabsTrigger>

                    <TabsTrigger value="activity">
                        Actividad
                    </TabsTrigger>

                </TabsList>

                <TabsContent value="overview">

                    <CompanyOverview
                        company={company}
                        client360={client360}
                        kickoffAction={() => kickoffMutation.mutate()}
                    />

                </TabsContent>

                <TabsContent value="operations">
                    <CompanyOperations companyId={companyId} client360={client360} />
                </TabsContent>

                <TabsContent value="ai-assets">
                    <CompanyAIAssets companyId={companyId} />
                </TabsContent>

                <TabsContent value="billing">
                    <CompanyBilling companyId={companyId} />
                </TabsContent>

                <TabsContent value="team">
                    <CompanyTeam companyId={companyId} company={company} />
                </TabsContent>

                <TabsContent value="activity">
                    <CompanyActivity companyId={companyId} />
                </TabsContent>

            </Tabs>

            <KickoffDialog
                kickoffModal={kickoffModal}
                setKickoffModal={setKickoffModal}
            />

        </motion.div>

    )

}