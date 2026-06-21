-- CreateTable
CREATE TABLE "SyncState" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "cursorDeputadoId" INTEGER,
    "deputadosProcessados" INTEGER NOT NULL DEFAULT 0,
    "proposicoesProcessadas" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SyncState_pkey" PRIMARY KEY ("id")
);
