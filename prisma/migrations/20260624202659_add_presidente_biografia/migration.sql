-- AlterTable
ALTER TABLE "Presidente" ADD COLUMN     "biografia" TEXT,
ADD COLUMN     "linkWikipedia" TEXT,
ADD COLUMN     "principaisFeitos" TEXT[] DEFAULT ARRAY[]::TEXT[];
