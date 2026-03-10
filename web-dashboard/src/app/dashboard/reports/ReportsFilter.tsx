'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, Layers } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CategoryData } from './actions';
import { cn } from '@/lib/utils';

export function ReportsFilter({ currentMonth, currentCategoryId, categories }: { currentMonth: string, currentCategoryId: string, categories: CategoryData[] }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [openDate, setOpenDate] = React.useState(false);
    const [openCat, setOpenCat] = React.useState(false);
    const isDesktop = useMediaQuery("(min-width: 768px)");

    const handleFilterChange = (type: 'month' | 'category', value: string) => {
        const current = new URLSearchParams(Array.from(searchParams.entries()));
        if (value && value !== 'all') {
            current.set(type, value);
        } else {
            current.delete(type);
        }
        router.push(`/dashboard/reports?${current.toString()}`);
    };

    // Month Math
    const parsedDate = parseISO(`${currentMonth}-01`);
    const dateLabel = format(parsedDate, 'MMMM yyyy', { locale: ptBR });

    // Category Math
    const activeCat = categories.find(c => c.id === currentCategoryId);
    const catLabel = currentCategoryId === 'all' ? 'Todas as Categorias' : (activeCat?.name || 'Categoria Específica');

    // Drawer/Popover Categoria List
    const CategoryList = ({ setOpen }: { setOpen: (open: boolean) => void }) => (
        <div className="flex flex-col gap-1 w-full max-h-[300px] overflow-y-auto p-2">
            <Button
                variant="ghost"
                className={cn("justify-start rounded-sm", currentCategoryId === 'all' && "bg-slate-800 text-emerald-400")}
                onClick={() => { handleFilterChange('category', 'all'); setOpen(false); }}
            >
                Todas as Categorias
            </Button>
            {categories.map((cat) => (
                <Button
                    key={cat.id}
                    variant="ghost"
                    className={cn("justify-start rounded-sm", currentCategoryId === cat.id && "bg-slate-800 text-emerald-400")}
                    onClick={() => { handleFilterChange('category', cat.id); setOpen(false); }}
                >
                    {cat.name}
                </Button>
            ))}
        </div>
    );

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2 text-slate-400">
                <Filter className="w-5 h-5 text-emerald-500" />
                <span className="font-mono text-xs uppercase tracking-widest text-slate-300">Inteligência de Filtragem</span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full sm:w-auto">

                {/* DATE COMPONENT */}
                {isDesktop ? (
                    <Popover open={openDate} onOpenChange={setOpenDate}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-[220px] justify-start text-left font-normal bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-slate-100 rounded-sm">
                                <CalendarIcon className="mr-2 h-4 w-4 text-emerald-500" />
                                <span className="capitalize">{dateLabel}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-slate-950 border-slate-800 rounded-md" align="start">
                            <Calendar
                                mode="single"
                                selected={parsedDate}
                                onSelect={(date) => {
                                    if (date) {
                                        const newMonth = format(date, 'yyyy-MM');
                                        handleFilterChange('month', newMonth);
                                        setOpenDate(false);
                                    }
                                }}
                                defaultMonth={parsedDate}
                                className="bg-slate-950 text-slate-50"
                            />
                        </PopoverContent>
                    </Popover>
                ) : (
                    <Drawer open={openDate} onOpenChange={setOpenDate}>
                        <DrawerTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-slate-100 rounded-none h-12 text-base">
                                <CalendarIcon className="mr-2 h-5 w-5 text-emerald-500" />
                                <span className="capitalize">{dateLabel}</span>
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="bg-slate-950 border-slate-800 text-slate-50">
                            <DrawerTitle className="sr-only">Escolher Mês</DrawerTitle>
                            <div className="p-4 py-8 flex justify-center w-full">
                                <Calendar
                                    mode="single"
                                    selected={parsedDate}
                                    onSelect={(date) => {
                                        if (date) {
                                            const newMonth = format(date, 'yyyy-MM');
                                            handleFilterChange('month', newMonth);
                                            setOpenDate(false);
                                        }
                                    }}
                                    defaultMonth={parsedDate}
                                    className="scale-110" // Make it easier to touch on mobile
                                />
                            </div>
                        </DrawerContent>
                    </Drawer>
                )}

                {/* CATEGORY COMPONENT */}
                {isDesktop ? (
                    <Popover open={openCat} onOpenChange={setOpenCat}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-[220px] justify-start text-left font-normal bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-slate-100 rounded-sm">
                                <Layers className="mr-2 h-4 w-4 text-rose-400" />
                                <span className="truncate">{catLabel}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[220px] p-0 bg-slate-950 border-slate-800 rounded-md" align="start">
                            <CategoryList setOpen={setOpenCat} />
                        </PopoverContent>
                    </Popover>
                ) : (
                    <Drawer open={openCat} onOpenChange={setOpenCat}>
                        <DrawerTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal bg-slate-900 border-slate-700 hover:bg-slate-800 hover:text-slate-100 rounded-none h-12 text-base">
                                <Layers className="mr-2 h-5 w-5 text-rose-400" />
                                <span className="truncate">{catLabel}</span>
                            </Button>
                        </DrawerTrigger>
                        <DrawerContent className="bg-slate-950 border-slate-800 text-slate-50 max-h-[80vh]">
                            <DrawerTitle className="px-6 pt-6 text-lg font-bold text-slate-200">Filtrar Categoria</DrawerTitle>
                            <div className="p-4 pb-10">
                                <CategoryList setOpen={setOpenCat} />
                            </div>
                        </DrawerContent>
                    </Drawer>
                )}
            </div>
        </div>
    );
}
