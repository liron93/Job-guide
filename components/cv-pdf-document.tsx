"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 44,
    paddingHorizontal: 52,
    backgroundColor: "#ffffff",
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: "#2563eb",
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#6b7280",
  },
  body: {
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.65,
    color: "#374151",
  },
  coverPage: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 60,
    backgroundColor: "#ffffff",
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  coverMeta: {
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#6b7280",
    marginBottom: 18,
  },
  coverBody: {
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.9,
    color: "#1f2937",
  },
});

export function CvPdfDocument({ text, filename }: { text: string; filename?: string }) {
  const lines = text.split("\n");
  const firstLine = lines[0] ?? "";
  const secondLine = lines[1] ?? "";
  const rest = lines.slice(2).join("\n");

  return (
    <Document title={filename ?? "CV"}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.name}>{firstLine}</Text>
          {secondLine ? <Text style={s.subtitle}>{secondLine}</Text> : null}
        </View>
        <Text style={s.body}>{rest}</Text>
      </Page>
    </Document>
  );
}

export function CoverLetterPdfDocument({
  text,
  companyName,
  roleName,
}: {
  text: string;
  companyName?: string;
  roleName?: string;
}) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document title={`Cover Letter — ${companyName ?? ""}`}>
      <Page size="A4" style={s.coverPage}>
        <Text style={s.coverMeta}>{today}</Text>
        {companyName && roleName ? (
          <Text style={{ ...s.coverMeta, marginBottom: 22 }}>
            {`Hiring Team — ${companyName} | ${roleName}`}
          </Text>
        ) : null}
        <Text style={s.coverBody}>{text}</Text>
      </Page>
    </Document>
  );
}
