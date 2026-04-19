import { cn } from "@/lib/utils";
import { Crown } from "lucide-react";
import Link from "next/link";

export const ShinyButton = ({
  className,
  children,
  href,
  showIcon,
  icon,
  disabled,
  pricing,
  onClick,
  ...props
}) => (
  <Link
    href={disabled ? "/#pricing" : href}
    onClick={onClick}
    {...(pricing && !disabled && { target: "_blank" })}
    {...(pricing && !disabled && { rel: "noopener noreferrer" })}
    className={cn(
      `${!disabled &&
      "group relative flex transform items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md border border-white bg-[#478BAF] px-8 text-base/7 font-medium text-white transition-all duration-300 hover:ring-2 hover:ring-[#478BAF] hover:ring-offset-2 focus:outline-none focus:ring-2 focus:ring-offset-2"
      }`,
      "group relative flex transform items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-md border border-white bg-[#478BAF] px-8 text-base/7 font-medium text-white transition-all duration-300 z-0",
      className,
      disabled && "opacity-50 cursor-not-allowed",
    )}
    {...props}
  >
    <span className="relative z-10 flex items-center gap-2">
      {showIcon && (
        <Crown
          className={`w-5 transform rotate-0 ${!disabled &&
            "group-hover:-rotate-[6.5deg] group-hover:scale-[1.18] transition-transform duration-200"
            }`}
        />
      )}
      {children}
      {icon}
    </span>

    {!disabled && (
      <div className="ease-[cubic-bezier(0.19,1,0.22,1)] absolute -left-[75px] -top-[50px] -z-10 h-[155px] w-8 rotate-[35deg] bg-white opacity-20 transition-all duration-500 group-hover:left-[120%]" />
    )}
  </Link>
);

