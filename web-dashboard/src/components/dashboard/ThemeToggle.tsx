"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle({ isCollapsed = false }: { isCollapsed?: boolean }) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // useEffect only runs on the client, so now we can safely show the UI
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        // Return a placeholder with the exact same dimensions to prevent layout shift
        return (
            <div className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl ${isCollapsed ? "justify-center px-0" : ""}`}>
                <div className="w-5 h-5 opacity-0"></div>
                {!isCollapsed && <span className="opacity-0">Carregando...</span>}
            </div>
        )
    }

    return (
        <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={`flex items-center gap-3 w-full px-3 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors ${isCollapsed ? "justify-center px-0" : ""
                }`}
            title={theme === "light" ? "Mudar para tema escuro" : "Mudar para tema claro"}
        >
            <div className="relative w-5 h-5">
                {theme === "dark" ? (
                    <Moon className="h-5 w-5 absolute inset-0 transition-transform" />
                ) : (
                    <Sun className="h-5 w-5 absolute inset-0 transition-transform" />
                )}
            </div>
            {!isCollapsed && (
                <span>{theme === "light" ? "Tema Escuro" : "Tema Claro"}</span>
            )}
        </button>
    )
}
