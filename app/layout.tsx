import type {Metadata} from "next";
import "./globals.css";
import RegisterSW from "./register-sw";
export const metadata:Metadata={title:"Musika Studio",description:"Studio musik AI yang hasilnya tetap bisa diedit.",manifest:"/manifest.webmanifest",themeColor:"#8b5cf6"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="id"><body><RegisterSW/>{children}</body></html>}