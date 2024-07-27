import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import React from "react";

const Header = () => {
  return (
    <div className="flex p-4 items-center justify-between bg-secondary shadow-sm h-16">
      <Image src={"/logo.svg"} width={80} height={12} alt="logo" />
      <ul className="flex gap-6">
        <li className="hover:text-primary hover:font-bold transition-all hover:cursor-pointer">
          Dashboard
        </li>
        <li className="hover:text-primary hover:font-bold transition-all hover:cursor-pointer">
          Questions
        </li>
        <li className="hover:text-primary hover:font-bold transition-all hover:cursor-pointer">
          Upgrade
        </li>
        <li className="hover:text-primary hover:font-bold transition-all hover:cursor-pointer">
          How it Works?
        </li>
      </ul>
      <UserButton />
    </div>
  );
};

export default Header;
