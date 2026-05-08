import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #1a365d",
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#1a365d",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#666",
  },
  section: {
    marginBottom: 12,
  },
  heading: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1a365d",
    marginBottom: 6,
    marginTop: 12,
  },
  subheading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    marginTop: 8,
  },
  body: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#333",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    fontSize: 8,
    color: "#999",
    borderTop: "1 solid #ddd",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

interface ICBriefPDFProps {
  assetName: string;
  content: string;
  version: number;
  generatedAt: string;
}

export function ICBriefPDF({
  assetName,
  content,
  version,
  generatedAt,
}: ICBriefPDFProps) {
  const lines = content.split("\n");

  const elements: React.ReactElement[] = [];
  let buffer = "";

  function flushBuffer() {
    if (buffer.trim()) {
      elements.push(
        <Text key={`body-${elements.length}`} style={styles.body}>
          {buffer.trim()}
        </Text>
      );
      buffer = "";
    }
  }

  for (const line of lines) {
    if (line.startsWith("## ")) {
      flushBuffer();
      elements.push(
        <Text key={`h2-${elements.length}`} style={styles.heading}>
          {line.replace("## ", "")}
        </Text>
      );
    } else if (line.startsWith("### ")) {
      flushBuffer();
      elements.push(
        <Text key={`h3-${elements.length}`} style={styles.subheading}>
          {line.replace("### ", "")}
        </Text>
      );
    } else if (line.startsWith("# ")) {
      flushBuffer();
      elements.push(
        <Text
          key={`h1-${elements.length}`}
          style={[styles.heading, { fontSize: 16 }]}
        >
          {line.replace("# ", "")}
        </Text>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      flushBuffer();
      elements.push(
        <Text key={`li-${elements.length}`} style={styles.body}>
          {"  • " + line.replace(/^[-*] /, "")}
        </Text>
      );
    } else if (line.match(/^\d+\. /)) {
      flushBuffer();
      elements.push(
        <Text key={`ol-${elements.length}`} style={styles.body}>
          {"  " + line}
        </Text>
      );
    } else {
      buffer += line + "\n";
    }
  }
  flushBuffer();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>
            IC Concept-Stage Brief: {assetName}
          </Text>
          <Text style={styles.subtitle}>
            Version {version} | Generated{" "}
            {new Date(generatedAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Text>
          <Text style={[styles.subtitle, { marginTop: 2 }]}>
            AfCEN Asset Recycling Platform | Africa50
          </Text>
        </View>

        {elements.map((el) => (
          <View key={el.key} style={styles.section}>
            {el}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>AfCEN — Africa50 Confidential</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
