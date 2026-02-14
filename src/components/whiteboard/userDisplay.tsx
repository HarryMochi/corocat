import React from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActiveUsers } from "@/hooks/useActiveUsers";
import { useAuth } from "@/hooks/use-auth";

const MAX_VISIBLE_USERS = 3;

const UserDisplay = () => {
  const users = useActiveUsers();
  const { user } = useAuth();

  const visibleUsers = users.slice(0, MAX_VISIBLE_USERS);
  const remainingUsers = users.slice(MAX_VISIBLE_USERS);

  return (
    <div className="flex items-center justify-start px-6 py-2 bg-white w-fit rounded-br-lg rounded-bl-lg shadow-md gap-x-3">
      <TooltipProvider>
        {/* Visible users */}
        {visibleUsers.map((u, index) => {
          const initials = u.displayName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Avatar className="cursor-pointer w-8 h-8">
                  <AvatarImage
                    src={u.photoURL}
                    alt={u.displayName}
                  />
                  <AvatarFallback className="bg-[#F5E6D3] text-black font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {u.displayName === user?.displayName
                    ? "You"
                    : u.displayName}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* +X users */}
        {remainingUsers.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="cursor-pointer w-8 h-8 bg-gray-200">
                <AvatarFallback className="text-sm font-medium text-gray-700">
                  +{remainingUsers.length}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1">
                {remainingUsers.map((u, i) => (
                  <span key={i}>
                    {u.displayName === user?.displayName
                      ? "You"
                      : u.displayName}
                  </span>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};

export default UserDisplay;
