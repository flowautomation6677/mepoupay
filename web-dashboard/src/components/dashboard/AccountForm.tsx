"use client"

import { useState, useRef } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { UserProfile } from "@/types/dashboard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Loader2 } from "lucide-react"

export default function AccountForm({ profile }: Readonly<{ profile: UserProfile }>) {
    const [loading, setLoading] = useState(false)
    const [avatarLoading, setAvatarLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState({
        full_name: profile.full_name || "",
        whatsapp: profile.whatsapp_numbers?.[0] || "",
        financial_goal: profile.financial_goal?.toString() || "",
        avatar_url: profile.avatar_url || ""
    })

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setAvatarLoading(true)
        setMessage(null)

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${profile.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            // Upload the file to the 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Retrieve the public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // Update local state
            setFormData(prev => ({ ...prev, avatar_url: publicUrl }))

            setMessage({ type: 'success', text: 'Foto carregada! Clique em "Salvar Alterações" para aplicar.' })
        } catch (error) {
            console.error(error)
            setMessage({ type: 'error', text: 'Erro ao enviar a foto. Tente novamente.' })
        } finally {
            setAvatarLoading(false)
        }
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
                    financial_goal: Number.parseFloat(formData.financial_goal) || 0,
                    avatar_url: formData.avatar_url
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
                        Gerencie suas informações pessoais e foto de perfil.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Status Message */}
                    {message && (
                        <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Avatar Upload UI */}
                    <div className="flex flex-col items-center gap-4 pb-4">
                        <div
                            className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-secondary bg-muted cursor-pointer group flex items-center justify-center transition-transform hover:scale-105"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {avatarLoading ? (
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            ) : formData.avatar_url ? (
                                <img
                                    src={formData.avatar_url}
                                    alt="Avatar"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <img
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email}`}
                                    alt="Avatar Default"
                                    className="h-full w-full object-cover opacity-80"
                                />
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="text-center">
                            <span className="text-sm font-medium text-primary hover:underline cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                Alterar foto
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WEBP. Máx 5MB.</p>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                        />
                    </div>

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
                        disabled={loading || avatarLoading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                        {loading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
