import crypto from "crypto"
const hash = crypto.createHash("sha256").update("demo123").digest("hex")
console.log("SHA-256 of demo123:", hash)
