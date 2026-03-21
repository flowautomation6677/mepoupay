'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

export default function FloatingWhatsappButton() {
    // Numero default alinhado ao planejamento (usável até a injeção em .env)
    const phoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BOT_NUMBER || "5521984646902";
    const message = encodeURIComponent("Olá, Me Poupay! Vim pelo Dashboard e preciso de ajuda.");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    return (
        <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-4 focus:ring-emerald-500/50"
            aria-label="Falar com o Bot"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
            <motion.div
                animate={{ 
                    y: [0, -5, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <MessageCircle className="w-7 h-7" />
            </motion.div>
        </motion.a>
    );
}
