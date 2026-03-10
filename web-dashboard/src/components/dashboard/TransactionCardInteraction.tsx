'use client'

import { useState } from 'react'
import { motion, useAnimation, PanInfo } from 'framer-motion'
import { Pencil, Trash2, Loader2 } from 'lucide-react'
import { Transaction } from '@/types/dashboard'
import { useMediaQuery } from '@/hooks/use-media-query'

interface TransactionCardInteractionProps {
    transaction: Transaction;
    children: React.ReactNode;
    onEdit: (transaction: Transaction) => void;
    onDelete: (transaction: Transaction) => Promise<void>;
}

export function TransactionCardInteraction({ transaction, children, onEdit, onDelete }: TransactionCardInteractionProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [isDeleting, setIsDeleting] = useState(false)
    const controls = useAnimation()

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await onDelete(transaction)
        } catch (error) {
            console.error(error)
            // se der erro, volta a div pra posição original
            controls.start({ x: 0 })
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = -80 // Distância necessária para acionar a exclusão

        if (info.offset.x < threshold) {
            // Anima até o fim (some da tela)
            await controls.start({ x: -500, opacity: 0, transition: { duration: 0.2 } })
            handleDelete() // Chama a prop de exclusão
        } else {
            // Volta para a posição original
            controls.start({ x: 0, transition: { type: 'spring', bounce: 0.4, duration: 0.4 } })
        }
    }

    // HANDLER DE CLIQUE UNIVERSAL (Abre o painel)
    const handleTapOrClick = () => {
        if (isDeleting) return
        onEdit(transaction)
    }

    // ==========================================
    // VERSÃO DESKTOP (Hover States)
    // ==========================================
    if (isDesktop) {
        return (
            <div
                className="group relative flex w-full cursor-pointer items-center justify-between transition-colors hover:bg-secondary/50 rounded-xl overflow-hidden"
                onClick={handleTapOrClick}
            >
                {/* O children entra preenchendo o espaço, mas vamos isolatar ele um pouco */}
                <div className="w-full relative z-10 transition-opacity">
                    {children}
                </div>

                {/* Ações Rápidas (Desktop Hover) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
                    {/* Fundo p/ legibilidade do botão (blur opcional se o fundo for escuro) */}
                    <div className="flex bg-background/80 backdrop-blur-sm p-1 rounded-md border border-border/50 shadow-sm gap-1">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onEdit(transaction) }}
                            className="p-2 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors"
                            title="Editar"
                        >
                            <Pencil size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Tem certeza que deseja excluir esta transação permanentemente?')) {
                                    handleDelete()
                                }
                            }}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                            title="Excluir"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Loader2 size={18} className="animate-spin text-destructive" /> : <Trash2 size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ==========================================
    // VERSÃO MOBILE (Swipe to Delete via Framer Motion)
    // ==========================================
    return (
        <div className="relative w-full overflow-hidden rounded-xl bg-destructive">
            {/* Camada Inferior: Revela o Ícone de Lixeira */}
            <div className="absolute inset-0 flex items-center justify-end px-6">
                {isDeleting ? (
                    <Loader2 size={24} className="text-white animate-spin" />
                ) : (
                    <Trash2 size={24} className="text-white" />
                )}
            </div>

            {/* Camada Superior arrastável */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -100, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                animate={controls}
                className="relative z-10 w-full bg-background rounded-xl will-change-transform touch-pan-y"
            >
                {/* O container interno precisa ter o background original para esconder a lixeira */}
                <div
                    onClick={handleTapOrClick}
                    className="w-full bg-secondary/50 active:bg-secondary transition-colors"
                >
                    {children}
                </div>
            </motion.div>
        </div>
    )
}
