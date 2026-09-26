-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('Buy', 'Sell');

-- CreateEnum
CREATE TYPE "Session" AS ENUM ('Asia', 'London', 'NewYork');

-- CreateEnum
CREATE TYPE "Emotion" AS ENUM ('Confident', 'Calm', 'Excited', 'Fearful', 'Greedy', 'Revenge', 'Impatient', 'Relieved', 'Frustrated', 'Neutral', 'FOMO', 'Disciplined');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instrument" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "lotSize" DOUBLE PRECISION NOT NULL,
    "session" "Session",
    "entryDate" TIMESTAMP(3) NOT NULL,
    "exitDate" TIMESTAMP(3),
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "exitPrice" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,
    "netPnl" DOUBLE PRECISION,
    "fees" DOUBLE PRECISION DEFAULT 0,
    "swap" DOUBLE PRECISION DEFAULT 0,
    "riskR" DOUBLE PRECISION,
    "returnR" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeLeg" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "lotSize" DOUBLE PRECISION NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "exitPrice" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,

    CONSTRAINT "TradeLeg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeReflection" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "planFollowed" BOOLEAN NOT NULL DEFAULT false,
    "intendedPlan" TEXT,
    "entryConfluences" TEXT[],
    "tradeManagement" TEXT,
    "mistakes" TEXT[],
    "entryEmotion" "Emotion",
    "exitEmotion" "Emotion",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeCharts" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "htfUrl" TEXT,
    "mtfUrl" TEXT,
    "ltfUrl" TEXT,

    CONSTRAINT "TradeCharts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "TradeLeg_tradeId_idx" ON "TradeLeg"("tradeId");

-- CreateIndex
CREATE UNIQUE INDEX "TradeReflection_tradeId_key" ON "TradeReflection"("tradeId");

-- CreateIndex
CREATE UNIQUE INDEX "TradeCharts_tradeId_key" ON "TradeCharts"("tradeId");

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeLeg" ADD CONSTRAINT "TradeLeg_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeReflection" ADD CONSTRAINT "TradeReflection_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeCharts" ADD CONSTRAINT "TradeCharts_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;
