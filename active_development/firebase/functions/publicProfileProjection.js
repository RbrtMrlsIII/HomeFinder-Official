const admin = require("firebase-admin");

function publicProfileFromUserData(data = {}) {
  const visibility = data.privacy?.showBasicInfo === false ? false : true;
  const accountType = String(data.canonicalRole || data.accountType || data.role || "").toLowerCase();
  const verificationStatus = String(data.idVerification?.status || "").toLowerCase();
  const licenseStatus = String(data.brokerLicense?.status || "").toLowerCase();
  return {
    firstName: data.firstName || "",
    surname: data.surname || data.lastName || "",
    accountType,
    avatarUrl: data.avatarUrl || "",
    publicEmail: data.privacy?.showEmail === true ? (data.email || "") : "",
    publicPhone: data.privacy?.showPhone === true ? (data.phone || "") : "",
    publicCity: data.city || data.address?.city || "",
    verifiedBadge: verificationStatus === "verified" || verificationStatus === "approved" || data.verified === true,
    licensedBadge: licenseStatus === "verified" || licenseStatus === "approved" || data.prcVerified === true,
    tierIndex: Number(data.tierIndex ?? 0) || 0,
    searchable: visibility,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
}
module.exports = { publicProfileFromUserData };
