"use client";
import React from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Separator } from "../ui/separator";

const Navbar = ({ topic }: { topic: string }) => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center px-6 py-2 bg-white w-fit rounded-br-lg gap-x-3 shadow-md">
      {/* Logo */}
      <Button variant="link" size="icon" onClick={() => router.push("/learn")}>
        <Image
          src="/cat.png"
          width={200}
          height={200}
          alt="Click on It"
          className="w-8 h-8"
        />
      </Button>

      {/* Separator */}
      <Separator
        orientation="vertical"
        className="h-6 bg-gray-300"
      />

      {/* Topic */}
      <h1 className="text-lg text-black font-light whitespace-nowrap">
        {topic}
      </h1>
    </div>
  );
};

export default Navbar;
