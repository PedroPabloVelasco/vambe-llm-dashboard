-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Meeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "meetingDate" DATETIME NOT NULL,
    "seller" TEXT NOT NULL,
    "closed" BOOLEAN NOT NULL,
    "transcript" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "classificationError" TEXT,
    CONSTRAINT "Meeting_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Meeting" ("closed", "createdAt", "customerId", "id", "meetingDate", "seller", "transcript") SELECT "closed", "createdAt", "customerId", "id", "meetingDate", "seller", "transcript" FROM "Meeting";
DROP TABLE "Meeting";
ALTER TABLE "new_Meeting" RENAME TO "Meeting";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
