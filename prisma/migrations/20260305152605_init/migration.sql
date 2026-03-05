-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProfileType" AS ENUM ('PVC', 'ALUMINIU');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('TABLOU', 'OFFER_PDF');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'GENERATE_PDF', 'SYNC_SHEET', 'SEND_OFFER');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('RON', 'EUR');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('mp', 'ml', 'buc', 'set');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AGENT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "system_name" TEXT NOT NULL,
    "profile_type" "ProfileType" NOT NULL,
    "description_template" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_prices" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "price_per_mp_ron" DECIMAL(10,2) NOT NULL,
    "price_per_ml_ron" DECIMAL(10,2) NOT NULL,
    "montaj_price_ron" DECIMAL(10,2) NOT NULL,
    "set_by_user_id" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extra_options" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" "Unit" NOT NULL DEFAULT 'mp',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extra_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extra_option_mappings" (
    "id" TEXT NOT NULL,
    "extra_option_id" TEXT NOT NULL,
    "cell_notation" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extra_option_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "offer_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "client_name" TEXT NOT NULL,
    "client_phone" TEXT,
    "client_email" TEXT,
    "client_address" TEXT,
    "agent_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "mp" DECIMAL(10,2) NOT NULL,
    "ml" DECIMAL(10,2) NOT NULL,
    "price_snapshot_materials_ron" DECIMAL(10,2),
    "price_snapshot_montaj_ron" DECIMAL(10,2),
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'RON',
    "eur_rate" DECIMAL(10,4),
    "google_sheet_url" TEXT,
    "spreadsheet_id" TEXT,
    "sheet_synced_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "pdf_generated_at" TIMESTAMP(3),

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_extras" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "extra_option_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price_ron" DECIMAL(10,2) NOT NULL,
    "total_ron" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "offer_extras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_files" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "file_type" "FileType" NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_data" JSONB,
    "new_data" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "products_name_key" ON "products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "extra_options_name_key" ON "extra_options"("name");

-- CreateIndex
CREATE UNIQUE INDEX "extra_option_mappings_extra_option_id_key" ON "extra_option_mappings"("extra_option_id");

-- CreateIndex
CREATE UNIQUE INDEX "offers_offer_number_key" ON "offers"("offer_number");

-- CreateIndex
CREATE UNIQUE INDEX "offer_extras_offer_id_extra_option_id_key" ON "offer_extras"("offer_id", "extra_option_id");

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_set_by_user_id_fkey" FOREIGN KEY ("set_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extra_option_mappings" ADD CONSTRAINT "extra_option_mappings_extra_option_id_fkey" FOREIGN KEY ("extra_option_id") REFERENCES "extra_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_extras" ADD CONSTRAINT "offer_extras_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_extras" ADD CONSTRAINT "offer_extras_extra_option_id_fkey" FOREIGN KEY ("extra_option_id") REFERENCES "extra_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_files" ADD CONSTRAINT "offer_files_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
