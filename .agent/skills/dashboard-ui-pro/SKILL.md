---
name: dashboard-ui-pro
description: Development of the Next.js web dashboard with Tailwind CSS and Supabase Server Components.
---

# Dashboard UI Pro

## Goal
Build modern, responsive, and performant web interfaces using Next.js 14+ (App Router), Tailwind CSS, and Supabase.

## Instructions
1.  **Server Components**: Default to Server Components. Add `'use client'` at the top of the file ONLY if you need hooks (`useState`, `useEffect`) or event listeners.
2.  **Supabase Integration**:
    *   Use the typed helper `createClient` from `@/utils/supabase/server` for server-side data fetching.
    *   Do NOT create ad-hoc Supabase clients.
3.  **Styling**:
    *   Use Tailwind CSS utility classes.
    *   Leverage CSS variables defined in `globals.css` (e.g., `bg-background`, `text-primary`) for consistency.
    *   Use `glass` or `glass-card` utilities for the premium aesthetic.
4.  **Icons**: Use `lucide-react` for icons.

## Examples

### 1. Server Component with Supabase
```typescript
// web-dashboard/src/app/dashboard/page.tsx
import { createClient } from '@/utils/supabase/server'
import { Card } from '@/components/ui/card'

export default async function DashboardPage() {
    const supabase = await createClient()
    
    const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .limit(5)

    return (
        <div className="p-6 space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2">
                {transactions?.map(tx => (
                    <div key={tx.id} className="glass-card p-4 text-card-foreground">
                        {tx.description}
                    </div>
                ))}
            </div>
        </div>
    )
}
```

### 2. Client Component (Interactivity)
```typescript
'use client'

import { useState } from 'react'

export function UserButton() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <button 
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors"
            onClick={() => setIsOpen(!isOpen)}
        >
            Menu
        </button>
    )
}
```

### 3. Styling Variables
Refer to `web-dashboard/src/app/globals.css` for the theme:
```css
/* Use these variables in Tailwind */
:root {
    --background: 222 47% 11%; /* Use via bg-background */
    --primary: 243 75% 59%;    /* Use via text-primary or bg-primary */
}

/* Glassmorphism */
.glass-card {
    @apply bg-slate-900/50 backdrop-blur-md border border-slate-700/50 shadow-lg rounded-3xl;
}
```
