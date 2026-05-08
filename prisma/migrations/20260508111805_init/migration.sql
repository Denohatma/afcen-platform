-- CreateEnum
CREATE TYPE "Sector" AS ENUM ('POWER_HYDRO', 'POWER_SOLAR', 'POWER_THERMAL', 'POWER_TRANSMISSION', 'TRANSPORT_ROAD', 'TRANSPORT_RAIL', 'TRANSPORT_BRIDGE', 'TRANSPORT_PORT', 'MIDSTREAM_GAS', 'ICT_DATACENTER');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('STATE_FULL', 'STATE_MAJORITY', 'IPP_PRIVATE', 'IPP_MIXED', 'CONCESSIONED');

-- CreateEnum
CREATE TYPE "SubCategory" AS ENUM ('STRANDED_BROWNFIELD', 'UNDERPERFORMING_BROWNFIELD', 'OPERATIONAL_IPP_REFINANCING', 'OPERATIONAL_PUBLIC_FOR_CONCESSION', 'GREENFIELD_IPT');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('OPERATIONAL', 'OPERATIONAL_BELOW_CAPACITY', 'MOTHBALLED', 'UNDER_REFURB');

-- CreateEnum
CREATE TYPE "Dimension" AS ENUM ('REVENUE_MATURITY', 'DEBT_COMPLEXITY', 'CONCESSION_READINESS', 'DATA_AVAILABILITY', 'REGULATORY_ENVIRONMENT', 'MODERNISATION_RISK');

-- CreateEnum
CREATE TYPE "DocType" AS ENUM ('TECHNICAL_REPORT', 'FINANCIAL_REPORT', 'REGULATORY_FILING', 'PPA', 'CONCESSION_AGREEMENT', 'IC_TEMPLATE', 'OTHER');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "sector" "Sector" NOT NULL,
    "capacityMW" DOUBLE PRECISION,
    "capacityUnit" TEXT,
    "capacityValue" DOUBLE PRECISION,
    "ownershipType" "OwnershipType" NOT NULL,
    "subCategory" "SubCategory" NOT NULL,
    "status" "AssetStatus" NOT NULL,
    "commissionedYear" INTEGER,
    "originalCostUsd" DOUBLE PRECISION,
    "description" TEXT NOT NULL,
    "strategicContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DimensionScore" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "dimension" "Dimension" NOT NULL,
    "score" INTEGER NOT NULL,
    "rationale" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "scoredBy" TEXT NOT NULL,
    "scoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DimensionScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PathToGoAction" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectsDimension" "Dimension" NOT NULL,
    "scoreUplift" INTEGER NOT NULL,
    "estimatedCost" TEXT,
    "estimatedTime" TEXT,

    CONSTRAINT "PathToGoAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "documentType" "DocType" NOT NULL,
    "contentHash" TEXT NOT NULL,
    "extractedText" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ICBrief" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "content" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT NOT NULL,

    CONSTRAINT "ICBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DimensionScore_assetId_dimension_key" ON "DimensionScore"("assetId", "dimension");

-- AddForeignKey
ALTER TABLE "DimensionScore" ADD CONSTRAINT "DimensionScore_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathToGoAction" ADD CONSTRAINT "PathToGoAction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ICBrief" ADD CONSTRAINT "ICBrief_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
