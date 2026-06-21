-- CreateTable
CREATE TABLE "Deputado" (
    "id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeCivil" TEXT,
    "siglaPartido" TEXT NOT NULL,
    "siglaUf" TEXT NOT NULL,
    "urlFoto" TEXT NOT NULL,
    "email" TEXT,
    "situacao" TEXT,
    "condicaoEleitoral" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deputado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposicao" (
    "id" INTEGER NOT NULL,
    "idDeputadoAutor" INTEGER NOT NULL,
    "siglaTipo" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "ementa" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "dataApresentacao" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestaoLog" (
    "id" SERIAL NOT NULL,
    "executadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "deputadosProcessados" INTEGER NOT NULL DEFAULT 0,
    "proposicoesProcessadas" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,

    CONSTRAINT "IngestaoLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deputado_siglaPartido_idx" ON "Deputado"("siglaPartido");

-- CreateIndex
CREATE INDEX "Deputado_siglaUf_idx" ON "Deputado"("siglaUf");

-- CreateIndex
CREATE INDEX "Proposicao_idDeputadoAutor_idx" ON "Proposicao"("idDeputadoAutor");

-- CreateIndex
CREATE INDEX "Proposicao_areaId_idx" ON "Proposicao"("areaId");

-- AddForeignKey
ALTER TABLE "Proposicao" ADD CONSTRAINT "Proposicao_idDeputadoAutor_fkey" FOREIGN KEY ("idDeputadoAutor") REFERENCES "Deputado"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
