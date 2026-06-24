-- CreateTable
CREATE TABLE "Presidente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "partido" TEXT,
    "vice" TEXT,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFim" TIMESTAMP(3),
    "condicao" TEXT NOT NULL,
    "observacoes" TEXT,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "Presidente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Presidente_ordem_idx" ON "Presidente"("ordem");
