'use client'

import { useState, useEffect } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Transaction } from '@/types/dashboard'
import { useMediaQuery } from '@/hooks/use-media-query'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'

import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer'

interface TransactionDetailsPanelProps {
    transaction: Transaction | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (id: string, updates: Record<string, any>) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export function TransactionDetailsPanel({ transaction, isOpen, onOpenChange, onSave, onDelete }: TransactionDetailsPanelProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Form States
    const [editDescription, setEditDescription] = useState('')
    const [editAmount, setEditAmount] = useState('0')
    const [editType, setEditType] = useState<any>('EXPENSE')
    const [editDate, setEditDate] = useState('')

    // Sincroniza estados quando a transação muda
    useEffect(() => {
        if (transaction) {
            setEditDescription(transaction.description || '')
            setEditAmount(transaction.amount.toString() || '0')
            setEditType(transaction.type)
            setEditDate(transaction.date ? transaction.date.split('T')[0] : '')
        }
    }, [transaction])

    if (!transaction) return null

    const handleSave = async () => {
        setIsSaving(true)
        try {
            await onSave(transaction.id, {
                description: editDescription,
                amount: parseFloat(editAmount.replace(',', '.')) || 0,
                type: editType,
                date: editDate ? new Date(editDate).toISOString() : transaction.date,
            })
            onOpenChange(false)
        } catch (error) {
            // Error handling prop passed
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!window.confirm('Excluir esta transação permanentemente?')) return;
        setIsDeleting(true)
        try {
            await onDelete(transaction.id)
            onOpenChange(false)
        } catch (error) {
            // Error handling prop passed
        } finally {
            setIsDeleting(false)
        }
    }

    // ==========================================
    // CONTEÚDO DO FORMULÁRIO (Reusável)
    // ==========================================
    const FormContent = () => (
        <div className="flex flex-col gap-6 py-6 px-4 sm:px-0">
            <div className="grid gap-2">
                <Label htmlFor="desc" className="text-muted-foreground font-mono text-xs uppercase text-opacity-80">
                    Descrição do Gasto
                </Label>
                <Input
                    id="desc"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="bg-secondary border-none h-12 text-lg font-medium"
                    placeholder="Ex: Mercadão..."
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="amount" className="text-muted-foreground font-mono text-xs uppercase text-opacity-80">
                    Valor
                </Label>
                <div className="flex items-center relative">
                    <span className="absolute left-4 text-muted-foreground font-medium">R$</span>
                    <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="pl-11 bg-secondary border-none h-14 text-2xl font-bold"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="date" className="text-muted-foreground font-mono text-xs uppercase text-opacity-80">
                        Data
                    </Label>
                    <Input
                        id="date"
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="bg-secondary border-none h-12"
                    />
                </div>
                <div className="grid gap-2">
                    <Label className="text-muted-foreground font-mono text-xs uppercase text-opacity-80">
                        Tipo
                    </Label>
                    <Select value={editType} onValueChange={(val: any) => setEditType(val)}>
                        <SelectTrigger className="w-full bg-secondary border-none h-12">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-popover">
                            <SelectItem value="EXPENSE" className="text-rose-500 font-medium">Despesa</SelectItem>
                            <SelectItem value="INCOME" className="text-emerald-500 font-medium">Receita</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="pt-4 flex flex-col gap-3 mt-auto">
                <Button
                    size="lg"
                    onClick={handleSave}
                    disabled={isSaving || isDeleting || !editDescription || !editAmount}
                    className="w-full h-12 bg-primary text-primary-foreground font-bold text-base"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Salvar Alterações
                </Button>
                <Button
                    variant="ghost"
                    size="lg"
                    onClick={handleDelete}
                    disabled={isSaving || isDeleting}
                    className="w-full h-12 text-destructive hover:bg-destructive/10 hover:text-destructive font-medium"
                >
                    {isDeleting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Excluir Transação
                </Button>
            </div>
        </div>
    )

    // ==========================================
    // VERSÃO DESKTOP (Side Panel / Sheet)
    // ==========================================
    if (isDesktop) {
        return (
            <Sheet open={isOpen} onOpenChange={onOpenChange}>
                <SheetContent className="bg-background border-l-border sm:max-w-md w-full overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="text-2xl font-bold">Detalhes do Lançamento</SheetTitle>
                        <SheetDescription>
                            Visualizando dados de <span className="font-medium text-foreground capitalize">{transaction.category}</span>
                        </SheetDescription>
                    </SheetHeader>
                    <FormContent />
                </SheetContent>
            </Sheet>
        )
    }

    // ==========================================
    // VERSÃO MOBILE (Bottom Sheet / Drawer)
    // ==========================================
    return (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-background border-t-border max-h-[90vh]">
                <DrawerHeader className="text-left">
                    <DrawerTitle className="text-2xl font-bold">Detalhes do Lançamento</DrawerTitle>
                    <DrawerDescription>
                        Visualizando dados de <span className="font-medium text-foreground capitalize">{transaction.category}</span>
                    </DrawerDescription>
                </DrawerHeader>
                <div className="px-2 overflow-y-auto">
                    <FormContent />
                </div>
                {/* O Drawer Footer é opcional se os botões já estiverem no form, 
                    mas mantém a semântica do drawer para cancelamentos */}
                <DrawerFooter className="pt-2">
                    <DrawerClose asChild>
                        <Button variant="outline" className="border-border h-12">Fechar</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
