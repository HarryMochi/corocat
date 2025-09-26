import Image from 'next/image';

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Image 
        src="/cat.png" 
        alt="Corocat Logo" 
        width={40} 
        height={40} 
        className="rounded-md"
      />
      <h1 className="text-xl font-bold font-headline text-foreground">
        Corocat
      </h1>
    </div>
  );
}
