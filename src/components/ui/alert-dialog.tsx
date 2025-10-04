"use client";

import { memo, type FC } from "react";
import Button from "./button";

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  buttonText?: string;
}

const AlertDialog: FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  buttonText = "OK",
}) => {
  if (!isOpen) return null;

  const iconConfig = {
    success: {
      bg: "bg-green-100",
      text: "text-green-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      ),
    },
    error: {
      bg: "bg-red-100",
      text: "text-red-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      ),
    },
    warning: {
      bg: "bg-yellow-100",
      text: "text-yellow-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      ),
    },
    info: {
      bg: "bg-blue-100",
      text: "text-blue-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
  };

  const config = iconConfig[type];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-md bg-white rounded-lg shadow-xl transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="flex items-center justify-center pt-6">
            <div className={`flex items-center justify-center w-12 h-12 ${config.bg} rounded-full`}>
              <svg
                className={`w-6 h-6 ${config.text}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {config.icon}
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6">
            <Button type="button" className="w-full" onClick={onClose}>
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(AlertDialog);
