"use client";


import { getCourseById } from "@/lib/firestore";
import { useParams } from "next/navigation";
import {  useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import ContextWrapper from "./contextWrapper";

import RoomCanvas from "@/components/whiteboard";
import { LiveblocksProvider, RoomProvider } from "@liveblocks/react/suspense";
import { useAuth } from "@/hooks/use-auth";
import { Layer } from "@/lib/types";


  

export default function Home() {
  const params = useParams();
  const courseId = params?.courseId as string | undefined;
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        const data = await getCourseById(courseId);
        setCourse(data);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

 

  if (!courseId || loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (

    <LiveblocksProvider authEndpoint={async(room)=>{
      if(!user) throw new Error("User Not Authenticated")
      
      const header = {
        "Content-Type":"application/json"
      }
      
      const body = JSON.stringify({
         room,
         userId:user.uid,
         displayName:user.displayName,
         photoURL:user.photoURL
      })
      const response = await fetch('/api/liveblocks-auth',{
        method:"POST",
        headers:header,
        body: body
      })
      
      if(!response.ok){
        throw new Error("Failed To Authenticate with Liveblocks")
      }
 
      return await response.json()
    }}>
    <ContextWrapper>
       <RoomProvider
      id={courseId}
      initialPresence={{
        selection: [],
        cursor: null,
        pencilDraft: null,
        penColor: null,
      }}
      initialStorage={{
        layers: new LiveMap<string, LiveObject<Layer>>(),
        layerIds: new LiveList([]),
      }}
    >
    <RoomCanvas courseId={courseId} topic={course.topic}/>

 </RoomProvider>
    </ContextWrapper>
    </LiveblocksProvider>
  );
}
