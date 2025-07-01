"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function DriversPage() {
  const router = useRouter();

  // Clicking anywhere navigates back
  const handleClick = () => router.push("/");

  return (
    <div
      className="min-h-screen w-full bg-[#E10800] flex flex-col items-center justify-center cursor-pointer select-none"
      onClick={handleClick}
    >
      <Image
        src="/Punezolanos.png"
        alt="Punezolanos Logo"
        width={340}
        height={180}
        priority
        className="drop-shadow-xl max-w-[90vw] h-auto"
        draggable={false}
      />
    </div>
  );
} 