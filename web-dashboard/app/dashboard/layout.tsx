import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden flex-col md:flex-row">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
