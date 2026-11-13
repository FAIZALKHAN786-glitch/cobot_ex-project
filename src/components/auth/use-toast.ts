"use client";

import { toast as sonnerToast, type ToasterProps } from "sonner";

export function useToast() {
  return {
    toast: (props: {
      title?: string;
      description?: string;
      action?: React.ReactNode;
    }) => {
      sonnerToast(props.title || "", {
        description: props.description,
        action: props.action,
      } as unknown as ToasterProps);
    },
  };
}
