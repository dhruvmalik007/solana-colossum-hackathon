"use client";

import Link from "next/link";
import { Button } from "./button";
import { 
  Menubar, 
  MenubarMenu, 
  MenubarTrigger, 
  MenubarContent, 
  MenubarItem, 
  MenubarSeparator
} from "./menubar";
import { ThemeToggle } from "./theme-toggle";

export function Header({ rightSlot }: { rightSlot?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight text-foreground hover:no-underline">
          Distribution markets
        </Link>
        
        <nav className="flex items-center gap-4">      
          <Menubar>
            <MenubarMenu>
              <Link href="/">
                <MenubarTrigger className="cursor-pointer">Home</MenubarTrigger>
              </Link>
            </MenubarMenu>
            
            
            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">About</MenubarTrigger>
              <MenubarContent>
                  <MenubarItem className="cursor-pointer">Docs</MenubarItem>
                  <MenubarItem className="cursor-pointer">Team</MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <MenubarMenu>
              <MenubarTrigger className="cursor-pointer">Account</MenubarTrigger>
              <MenubarContent>
                  <MenubarItem className="cursor-pointer">Log in</MenubarItem>
                <MenubarSeparator />
                <Link href="/signup">
                  <MenubarItem className="cursor-pointer">
                    <Button size="sm" variant="default" className="w-full">
                      Sign up
                    </Button>
                  </MenubarItem>
                </Link>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          {rightSlot ? <div className="ml-2">{rightSlot}</div> : null}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

