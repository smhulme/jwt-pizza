import React from "react";
import { CloseIcon } from "../icons";
import { HSOverlay } from "preline";

export interface ConfirmModalProps {
  id?: string;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export default function ConfirmModal({
  id = "hs-confirm-modal",
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  function handleCancel() {
    HSOverlay.close(document.getElementById(id)!);
    if (onCancel) {
      onCancel();
    }
  }

  async function handleConfirm() {
    try {
      await onConfirm();
    } finally {
      HSOverlay.close(document.getElementById(id)!);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      id={id}
      className="hs-overlay hidden size-full fixed top-10 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
    >
      <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)]">
        <div className="w-full flex flex-col bg-white border shadow-sm rounded-xl pointer-events-auto">
          <div className="flex justify-between items-center py-3 px-4 border-b bg-slate-200 rounded-t-xl">
            <h3 id={`${id}-title`} className="font-bold text-gray-800">
              {title}
            </h3>
            <button
              type="button"
              className="flex justify-center items-center size-7 text-sm font-semibold rounded-full border border-transparent text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none"
              data-hs-overlay={`#${id}`}
              onClick={handleCancel}
            >
              <CloseIcon className="" />
            </button>
          </div>
          <div className="p-4 overflow-y-auto max-h-52">
            <p className="text-gray-800 text-sm sm:text-base">{message}</p>
          </div>
          <div className="flex justify-end items-center gap-x-2 py-3 px-4 border-t bg-slate-200 rounded-b-xl">
            <button
              type="button"
              className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:pointer-events-none"
              data-hs-overlay={`#${id}`}
              onClick={handleCancel}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className="py-2 px-3 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:opacity-50 disabled:pointer-events-none"
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
