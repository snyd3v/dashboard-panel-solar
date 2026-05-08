"use client"
import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"

export function Navbar() {
  const { setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const pathname = usePathname()

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold bg-linear-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent">
              Panel de Control Solar
            </Link>
            <div className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link href="/" className="transition-colors text-foreground/60">Tiempo Real</Link>
              <Link href="/historico" className="transition-colors text-foreground/60">Histórico</Link>
              <Link href="/all-data" className="transition-colors text-foreground/60">Exportar Datos</Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-xl font-bold bg-linear-to-r from-orange-400 to-yellow-500 bg-clip-text text-transparent"
          >
            Panel de Control Solar
          </Link>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link
              href="/"
              className={`transition-colors hover:text-foreground/80 ${pathname === "/" ? "text-foreground" : "text-foreground/60"}`}
            >
              Tiempo Real
            </Link>
            <Link
              href="/historical-graphs"
              className={`transition-colors hover:text-foreground/80 ${pathname === "/historical-graphs" ? "text-foreground" : "text-foreground/60"}`}
            >
              Histórico Gráficas
            </Link>
            <Link
              href="/all-data"
              className={`transition-colors hover:text-foreground/80 ${pathname === "/all-data" ? "text-foreground" : "text-foreground/60"}`}
            >
              Tabla de Datos
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer h-9 w-9">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setTheme("light")}
              >
                Light
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setTheme("dark")}
              >
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => setTheme("system")}
              >
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
