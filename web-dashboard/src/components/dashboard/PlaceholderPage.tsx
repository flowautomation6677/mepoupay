import { Construction } from 'lucide-react';

export default function PlaceholderPage({ title }: { title: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
            <div className="p-4 bg-indigo-500/10 rounded-full">
                <Construction className="w-12 h-12 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-slate-400 max-w-md">
                Estamos construindo algo incrível aqui! Esta funcionalidade estará disponível em breve.
            </p>
        </div>
    );
}
