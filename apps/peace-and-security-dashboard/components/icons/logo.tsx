import { cn } from "@/lib/utils";

export function EcoLogo({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center select-none group", className)}>
            <div className="flex items-center">
                <span className="text-4xl font-[900] tracking-[-0.08em] text-[#00875a] leading-none pr-0.5">ec</span>
                <div className="relative w-[34px] h-[34px] bg-[#00875a] rounded-full flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                    <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6 text-white"
                    >
                        {/* Larger leaf */}
                        <path d="M16 17.5C16 17.5 13 18.5 10 16.5C7 14.5 5.5 11.5 5.5 11.5C5.5 11.5 8.5 12.5 12.5 11.5C16.5 10.5 18 7.5 18 7.5C18 7.5 19 11.5 16 17.5Z" />
                        {/* Medium leaf */}
                        <path d="M15 12.5C15 12.5 12 14.5 9 14C6 13.5 4 11 4 11C4 11 7 11 9.5 9.5C12 8 12.5 4.5 12.5 4.5C12.5 4.5 13.5 8.5 15 12.5Z" />
                        {/* Small leaf */}
                        <path d="M20 16.5C20 16.5 17 18.5 14 17.5C11 16.5 10 14 10 14C10 14 11.5 15 14 15C16.5 15 19 14 19 14C19 14 20.5 14.5 20 16.5Z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
