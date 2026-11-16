-- Agent telephone / WhatsApp : personnes a rappeler et commandes de livres
CREATE TYPE "AgentChannel" AS ENUM ('WHATSAPP', 'PHONE');
CREATE TYPE "AgentLeadReason" AS ENUM ('QUESTION', 'ABSENCE', 'PAYMENT');
CREATE TYPE "AgentLeadStatus" AS ENUM ('NEW', 'CALLED', 'DONE');
CREATE TYPE "AgentOrderStatus" AS ENUM ('NEW', 'CONFIRMED', 'DELIVERED', 'CANCELLED');

CREATE TABLE "agent_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "channel" "AgentChannel" NOT NULL,
    "reason" "AgentLeadReason" NOT NULL,
    "question" TEXT NOT NULL,
    "status" "AgentLeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_leads_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_orders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "channel" "AgentChannel" NOT NULL,
    "location" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "status" "AgentOrderStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agent_leads_status_createdAt_idx" ON "agent_leads"("status", "createdAt");
CREATE INDEX "agent_leads_phone_idx" ON "agent_leads"("phone");
CREATE INDEX "agent_orders_status_createdAt_idx" ON "agent_orders"("status", "createdAt");
CREATE INDEX "agent_orders_phone_idx" ON "agent_orders"("phone");
