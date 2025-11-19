import {
  CircleCheck,
  Info,
  Loader2,
  XCircle,
  TriangleAlert,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-[#111827] group-[.toaster]:border-[#E5E7EB] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[#6B7280]",
          actionButton: "group-[.toast]:bg-[#E40046] group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-[#F8F9FA] group-[.toast]:text-[#111827]",
        },
      }}
      icons={{
        success: <CircleCheck className="h-4 w-4 text-[#10B981]" />,
        info: <Info className="h-4 w-4 text-[#6B7280]" />,
        warning: <TriangleAlert className="h-4 w-4 text-[#F59E0B]" />,
        error: <XCircle className="h-4 w-4 text-[#EF4444]" />,
        loading: <Loader2 className="h-4 w-4 animate-spin text-[#6B7280]" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
