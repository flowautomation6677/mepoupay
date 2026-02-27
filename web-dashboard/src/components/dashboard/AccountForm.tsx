"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { UserProfile } from "@/types/dashboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AccountForm({ profile }: Readonly<{ profile: UserProfile }>) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [formData, setFormData] = useState({
        full_name: profile.full_name || "",
        whatsapp: profile.whatsapp_numbers?.[0] || "",
        financial_goal: profile.financial_goal?.toString() || ""
    })

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        try {
            // Update Profile Table
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    whatsapp_numbers: [formData.whatsapp], // Saving as single array item
                    financial_goal: Number.parseFloat(formData.financial_goal) || 0
                })
                .eq('id', profile.id)

            if (profileError) throw profileError

            // Update Auth Metadata (Sync name)
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: formData.full_name }
            })

            if (authError) throw authError

            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
        } catch (error) {
            console.error(error)
            setMessage({ type: 'error', text: 'Erro ao atualizar perfil. Tente novamente.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card className="border-border bg-card backdrop-blur-md text-card-foreground">
                <CardHeader>
                    <CardTitle className="text-xl text-card-foreground">Seus Dados</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Gerencie suas informações pessoais e de contato.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">

                    {/* Status Message */}
                    {message && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground">Email</Label>
                        <Input
                            id="email"
                            value={profile.email}
                            disabled
                            className="bg-muted/50 border-border text-muted-foreground cursor-not-allowed"
                        />
                        <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-foreground">Nome Completo</Label>
                        <Input
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            placeholder="Seu nome"
                            className="bg-background border-border text-foreground focus:border-primary transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="text-foreground">WhatsApp Principal</Label>
                        <Input
                            id="whatsapp"
                            name="whatsapp"
                            value={formData.whatsapp}
                            onChange={handleChange}
                            placeholder="5521999999999"
                            className="bg-background border-border text-foreground focus:border-primary transition-colors"
                        />
                        <p className="text-xs text-muted-foreground">
                            Usado para o Me Poupay AI entrar em contato. Inclua o código do país (55).
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="financial_goal" className="text-foreground">Meta Financeira (Mensal)</Label>
                        <Input
                            id="financial_goal"
                            name="financial_goal"
                            type="number"
                            value={formData.financial_goal}
                            onChange={handleChange}
                            placeholder="0.00"
                            className="bg-background border-border text-foreground focus:border-primary transition-colors"
                        />
                    </div>

                </CardContent>
                <CardFooter className="border-t border-border pt-6 flex justify-end">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        {loading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
