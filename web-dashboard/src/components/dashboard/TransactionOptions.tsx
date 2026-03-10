'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Transaction } from '@/types/dashboard'
import { deleteTransaction, updateTransaction } from '@/actions/transactions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TransactionOptionsProps {
    transaction: Transaction;
    compact?: boolean; // Ajusta visual para feed ou tabela
}

export function TransactionOptions({ transaction, compact = false }: TransactionOptionsProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Dialog States
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)

    // Form States
    const [editDescription, setEditDescription] = useState(transaction.description || '')
    const [editAmount, setEditAmount] = useState(transaction.amount.toString() || '0')
    const [editType, setEditType] = useState(transaction.type)

    // Tratamento de Data para o Input type="date"
    const parsedDate = transaction.date ? transaction.date.split('T')[0] : ''
    const [editDate, setEditDate] = useState(parsedDate)

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteTransaction(transaction.id)
            setShowDeleteDialog(false)
        } catch (error) {
            console.error(error)
            alert('Falha ao excluir a transação.')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleEditSave = async () => {
        setIsEditing(true)
        try {
            await updateTransaction(transaction.id, {
                description: editDescription,
                amount: parseFloat(editAmount.replace(',', '.')) || 0,
                type: editType,
                date: editDate ? new Date(editDate).toISOString() : transaction.date,
            })
            setShowEditDialog(false)
        } catch (error) {
            console.error(error)
            alert('Falha ao atualizar a transação.')
        } finally {
            setIsEditing(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className={compact ? "h-8 w-8 text-muted-foreground hover:bg-secondary" : "h-10 w-10 text-muted-foreground hover:bg-muted"}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Opções</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px] bg-popover border-border">
                    <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => setShowEditDialog(true)}>
                        <Pencil className="h-4 w-4 text-emerald-500" />
                        <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-destructive focus:text-destructive-foreground text-destructive" onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 className="h-4 w-4" />
                        <span>Excluir</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* DELETE ALERT MODAL */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="bg-background border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Lançamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. Isso removerá permanentemente a transação "{transaction.description}" no valor de R$ {transaction.amount.toFixed(2)} do seu extrato e afetará os relatórios do mês.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} className="bg-transparent text-foreground border-border hover:bg-accent">Cancelar</AlertDialogCancel>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Confirmar Exclusão
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* EDIT FORM MODAL */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="bg-background border-border sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar Transação</DialogTitle>
                        <DialogDescription>
                            Atualize os dados e clique em salvar as alterações.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="desc" className="text-right text-muted-foreground font-mono text-xs uppercase text-opacity-80">
                                Nome
                            </Label>
                            <Input
                                id="desc"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="col-span-3 bg-secondary border-input"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right text-muted-foreground font-mono text-xs uppercase text-opacity-80">
                                Data
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="col-span-3 bg-secondary border-input"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right text-muted-foreground font-mono text-xs uppercase text-opacity-80">
                                Valor
                            </Label>
                            <div className="col-span-3 flex items-center relative">
                                <span className="absolute left-3 text-muted-foreground text-sm">R$</span>
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    className="pl-8 bg-secondary border-input"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-muted-foreground font-mono text-xs uppercase text-opacity-80">
                                Tipo
                            </Label>
                            <div className="col-span-3">
                                <Select value={editType} onValueChange={(val: any) => setEditType(val)}>
                                    <SelectTrigger className="w-full bg-secondary border-input">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EXPENSE" className="text-rose-500 font-medium">Despesa</SelectItem>
                                        <SelectItem value="INCOME" className="text-emerald-500 font-medium">Receita</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" className="bg-transparent text-foreground border-border hover:bg-accent" disabled={isEditing} onClick={() => setShowEditDialog(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isEditing || !editDescription || !editAmount} onClick={handleEditSave} className="bg-primary text-primary-foreground">
                            {isEditing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Salvar Alterações
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
