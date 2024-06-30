import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";
import Sidebar from "../components/Sidebar";

type LayoutProps = {
  children: ReactNode;
};


const Layout = ({ children }: LayoutProps) => {
  return (
    <html lang="en">
      <head>
        <title>CRM client</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <div className="bg-gray-200 min-h-screen">
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="sm:w-1/3 xl:w-1/5 sm:min-h-screen p-5">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
};


export default Layout;