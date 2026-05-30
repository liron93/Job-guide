"use client";

import { useState } from "react";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { CvPdfDocument, CoverLetterPdfDocument } from "./cv-pdf-document";

interface Props {
  type: "cv" | "cover";
  text: string;
  companyName?: string;
  roleName?: string;
}

export function PdfPreviewButton({ type, text, companyName, roleName }: Props) {
  const [showPreview, setShowPreview] = useState(false);

  const filename =
    type === "cv"
      ? `CV_${companyName ?? "משרה"}.pdf`
      : `Cover_Letter_${companyName ?? "משרה"}.pdf`;

  const doc =
    type === "cv" ? (
      <CvPdfDocument text={text} filename={filename} />
    ) : (
      <CoverLetterPdfDocument text={text} companyName={companyName} roleName={roleName} />
    );

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
          תצוגה מקדימה
        </Button>
        <PDFDownloadLink document={doc} fileName={filename}>
          {({ loading }) => (
            <Button size="sm" disabled={loading}>
              {loading ? "מכין PDF..." : "הורד PDF"}
            </Button>
          )}
        </PDFDownloadLink>
      </div>

      {showPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-background rounded-xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
              <PDFDownloadLink document={doc} fileName={filename}>
                {({ loading }) => (
                  <Button size="sm" disabled={loading}>
                    {loading ? "מכין..." : "הורד PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {type === "cv" ? "קורות חיים מותאמים" : "מכתב מוטיבציה"}
                </span>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-muted-foreground hover:text-foreground text-lg leading-none"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <PDFViewer width="100%" height="100%" showToolbar={false}>
                {doc}
              </PDFViewer>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
