"use client";

import { useState, useRef, useEffect } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  UtensilsCrossed, 
  QrCode, 
  Smartphone,
  ExternalLink 
} from "lucide-react";
import { rotateTableQRTokenAction } from "./actions";

interface TableQRDialogProps {
  table: {
    id: string;
    number: string;
    qrToken: string | null;
    isActive: boolean;
    capacity?: number | null;
    description?: string | null;
  } | null;
  restaurantName: string;
  isOpen: boolean;
  onClose: () => void;
  onTokenRotated?: (newQrToken: string) => void;
}

export function TableQRDialog({
  table,
  restaurantName,
  isOpen,
  onClose,
  onTokenRotated,
}: TableQRDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [origin, setOrigin] = useState("");
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const printCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!table) return null;

  const qrUrl = table.qrToken
    ? `${origin}/m/t/${table.qrToken}`
    : `${origin}/m/t/not-configured`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Table QR ordering URL copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please manually copy the URL.",
        variant: "destructive",
      });
    }
  };

  // High-Resolution Branded Table Card Download (PNG)
  const handleDownloadPNG = () => {
    // Grab the 512px canvas from the container
    const qrCanvas = canvasContainerRef.current?.querySelector("canvas");
    if (!qrCanvas) {
      toast({
        title: "Download error",
        description: "Could not generate QR code image.",
        variant: "destructive",
      });
      return;
    }

    try {
      const cardCanvas = document.createElement("canvas");
      const width = 800;
      const height = 1060;
      cardCanvas.width = width;
      cardCanvas.height = height;
      const ctx = cardCanvas.getContext("2d");
      if (!ctx) return;

      // Clean white background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      // Rounded border
      ctx.strokeStyle = "#e4e4e7"; // zinc-200
      ctx.lineWidth = 10;
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // Restaurant Brand
      ctx.fillStyle = "#09090b"; // zinc-950
      ctx.font = "bold 38px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(restaurantName.toUpperCase(), width / 2, 110);

      // Table Pill Badge
      const badgeWidth = 360;
      const badgeHeight = 72;
      const badgeX = (width - badgeWidth) / 2;
      const badgeY = 145;
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 18);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 36px system-ui, -apple-system, sans-serif";
      ctx.fillText(`TABLE ${table.number}`, width / 2, badgeY + 49);

      // Draw QR Code centered (460x460)
      const qrSize = 460;
      const qrX = (width - qrSize) / 2;
      const qrY = 255;

      ctx.strokeStyle = "#f4f4f5";
      ctx.lineWidth = 4;
      ctx.strokeRect(qrX - 12, qrY - 12, qrSize + 24, qrSize + 24);

      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

      // Instruction Text
      ctx.fillStyle = "#09090b";
      ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
      ctx.fillText("SCAN TO VIEW MENU & ORDER", width / 2, 785);

      ctx.fillStyle = "#71717a"; // zinc-500
      ctx.font = "500 22px system-ui, -apple-system, sans-serif";
      ctx.fillText("Point your phone camera at the QR code to browse,", width / 2, 835);
      ctx.fillText("customize dishes, and place orders directly.", width / 2, 870);

      // URL Footer
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "16px monospace";
      ctx.fillText(qrUrl, width / 2, 960);

      const url = cardCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${restaurantName.toLowerCase().replace(/\s+/g, "-")}-table-${table.number}-qr-card.png`;
      link.href = url;
      link.click();

      toast({
        title: "High-Res QR Downloaded",
        description: `Exported printable QR card for Table ${table.number}.`,
      });
    } catch {
      toast({
        title: "Download failed",
        description: "Could not export PNG card.",
        variant: "destructive",
      });
    }
  };

  // Vector SVG Download
  const handleDownloadSVG = () => {
    const svgEl = canvasContainerRef.current?.querySelector("svg");
    if (!svgEl) {
      toast({
        title: "Download error",
        description: "Vector SVG is not ready.",
        variant: "destructive",
      });
      return;
    }

    try {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `${restaurantName.toLowerCase().replace(/\s+/g, "-")}-table-${table.number}-qr.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Vector SVG Downloaded",
        description: `Exported scalable vector SVG for Table ${table.number}.`,
      });
    } catch {
      toast({
        title: "Download failed",
        description: "Could not export SVG file.",
        variant: "destructive",
      });
    }
  };

  // Dedicated Print Action
  const handlePrint = () => {
    window.print();
  };

  // Token Rotation
  const handleRotateToken = async () => {
    if (
      !confirm(
        "Rotating this QR token will immediately invalidate any existing printed QR cards for this table. Are you sure you want to generate a new QR code?"
      )
    ) {
      return;
    }

    setIsRotating(true);
    try {
      const res = await rotateTableQRTokenAction(table.id);
      if (res.error) {
        toast({
          title: "Rotation failed",
          description: res.error,
          variant: "destructive",
        });
      } else if (res.qrToken) {
        toast({
          title: "QR Token Rotated",
          description: "New secure token generated. Old QR codes are now inactive.",
        });
        if (onTokenRotated) onTokenRotated(res.qrToken);
      }
    } catch {
      toast({
        title: "Error",
        description: "Could not rotate QR token.",
        variant: "destructive",
      });
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-[440px] sm:max-w-md md:max-w-lg max-h-[92dvh] overflow-y-auto p-4 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <DialogHeader className="print:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                  Table {table.number} QR Card
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500">
                  Ready-to-print dining room tent card.
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                table.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                  : "bg-red-50 text-red-700 border-red-200 font-bold"
              }
            >
              {table.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </DialogHeader>

        {/* =========================================================================
            PRINTABLE TENT CARD (Centered, Square, Non-overflowing)
            ========================================================================= */}
        <div className="py-2 flex justify-center">
          <div
            id="qr-printable-tent-card"
            ref={printCardRef}
            className="qr-print-card bg-white text-zinc-900 border-2 border-zinc-200 rounded-3xl p-5 sm:p-7 flex flex-col items-center text-center shadow-md relative overflow-hidden w-full max-w-[340px]"
          >
            {/* Top Brand Banner */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <UtensilsCrossed className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-zinc-900 uppercase">
                {restaurantName}
              </span>
            </div>

            {/* Table Badge */}
            <div className="mb-4">
              <span className="inline-block bg-zinc-950 text-white font-extrabold text-xl sm:text-2xl tracking-tight px-5 py-1.5 rounded-xl shadow-xs">
                TABLE {table.number}
              </span>
              {table.capacity && (
                <p className="text-xs font-semibold text-zinc-500 mt-1 print:hidden">
                  Seats {table.capacity} guests
                </p>
              )}
            </div>

            {/* Scalable Vector QR + Hidden 512px Canvas for PNG Download */}
            <div
              ref={canvasContainerRef}
              className="bg-white p-3 sm:p-4 rounded-2xl border-2 border-zinc-100 shadow-inner mb-4 flex items-center justify-center aspect-square max-w-[210px] sm:max-w-[240px] w-full mx-auto"
            >
              <QRCodeSVG
                value={qrUrl}
                size={200}
                level="H"
                includeMargin={true}
                className="w-full h-full max-w-[200px] max-h-[200px] aspect-square"
              />
              {/* Offscreen 512px canvas used exclusively for generating high-res PNG */}
              <div className="hidden" aria-hidden="true">
                <QRCodeCanvas
                  value={qrUrl}
                  size={512}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-1.5 max-w-xs">
              <h4 className="font-extrabold text-sm sm:text-base text-zinc-900 tracking-tight flex items-center justify-center gap-1.5">
                <Smartphone className="w-4 h-4 text-amber-600 print:text-black shrink-0" />
                Scan to View Menu & Order
              </h4>
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Point phone camera at the QR code to open our menu and order from your table.
              </p>
            </div>

            {/* Footer URL for manual entry */}
            <div className="mt-4 pt-3 border-t border-zinc-100 w-full text-[10px] font-mono text-zinc-400 truncate">
              {qrUrl}
            </div>
          </div>
        </div>

        {/* =========================================================================
            QR URL & TEST SCAN CONTROLS
            ========================================================================= */}
        <div className="print:hidden bg-zinc-50 dark:bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
              QR Destination:
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs font-bold px-2 rounded-lg"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
              <a
                href={qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-7 text-xs font-bold inline-flex items-center px-2 rounded-lg text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Test
              </a>
            </div>
          </div>
          <div className="text-[11px] font-mono bg-white dark:bg-zinc-950 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 truncate">
            {qrUrl}
          </div>
        </div>

        {/* =========================================================================
            RESPONSIVE ACTION BUTTONS (Clean 2-Row Layout)
            ========================================================================= */}
        <div className="print:hidden space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {/* Row 1: Primary Export Actions */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold h-10 text-xs shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPNG}
              className="font-bold h-10 text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              PNG
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSVG}
              className="font-bold h-10 text-xs border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              SVG
            </Button>
          </div>

          {/* Row 2: Secondary / Security Actions */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotateToken}
              disabled={isRotating}
              className="text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 h-8 px-2.5 font-bold"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${isRotating ? "animate-spin" : ""}`}
              />
              Rotate Token
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 h-8 px-3 font-semibold"
            >
              Close
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
