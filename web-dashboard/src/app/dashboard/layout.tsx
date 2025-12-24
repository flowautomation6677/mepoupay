import Sidebar from '@/components/dashboard/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen bg-slate-950 text-white font-sans overflow-hidden flex-col md:flex-row">
            <Sidebar />
            {/* Added pt-14 for Mobile Header spacing since Sidebar Mobile Header is fixed */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 relative pt-20 md:pt-8 scroll-smooth">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
