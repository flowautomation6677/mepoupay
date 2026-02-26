import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';

interface RoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    userName: string;
    isCurrentlyAdmin: boolean;
    loading?: boolean;
}

export function RoleModal({ isOpen, onClose, onConfirm, userName, isCurrentlyAdmin, loading = false }: RoleModalProps) {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${isCurrentlyAdmin ? 'bg-orange-100' : 'bg-indigo-100'}`}>
                                            {isCurrentlyAdmin ? (
                                                <ShieldAlert className="h-6 w-6 text-orange-600" aria-hidden="true" />
                                            ) : (
                                                <ShieldCheck className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                                            )}
                                        </div>
                                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                            <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-gray-900">
                                                {isCurrentlyAdmin ? 'Remover privilégios de Admin' : 'Conceder Privilégios de Admin'}
                                            </Dialog.Title>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500">
                                                    Você tem certeza que deseja transformar <span className="font-semibold text-gray-900">{userName || 'este usuário'}</span> em <span className="font-semibold text-gray-900">{isCurrentlyAdmin ? 'USER (Comum)' : 'ADMIN (Administrador)'}</span>?
                                                </p>
                                                {!isCurrentlyAdmin && (
                                                    <p className="mt-2 text-sm text-red-500 font-medium">
                                                        Aviso: Esta ação dará ao usuário acesso total ao painel administrativo.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                    <button
                                        type="button"
                                        disabled={loading}
                                        className={`inline-flex w-full justify-center rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto transition-all ${isCurrentlyAdmin
                                            ? 'bg-orange-600 hover:bg-orange-500'
                                            : 'bg-indigo-600 hover:bg-indigo-500'
                                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={onConfirm}
                                    >
                                        {loading ? 'Processando...' : 'Confirmar Alteração'}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={loading}
                                        className="mt-3 inline-flex w-full justify-center rounded-xl bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-all"
                                        onClick={onClose}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
