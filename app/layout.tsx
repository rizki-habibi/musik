import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title:"Musika Studio", description:"Studio musik AI yang hasilnya tetap bisa diedit." };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>}