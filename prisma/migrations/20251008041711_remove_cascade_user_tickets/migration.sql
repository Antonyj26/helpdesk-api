-- DropForeignKey
ALTER TABLE "public"."tickets" DROP CONSTRAINT "tickets_clientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tickets" DROP CONSTRAINT "tickets_techId_fkey";

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tickets" ADD CONSTRAINT "tickets_techId_fkey" FOREIGN KEY ("techId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
