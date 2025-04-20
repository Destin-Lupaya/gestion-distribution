"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSites = getAllSites;
exports.createSite = createSite;
exports.getAllHouseholds = getAllHouseholds;
exports.getHouseholdsByTokenNumber = getHouseholdsByTokenNumber;
exports.getHouseholdsBySite = getHouseholdsBySite;
exports.createHousehold = createHousehold;
exports.getAllRecipients = getAllRecipients;
exports.getRecipientsByHousehold = getRecipientsByHousehold;
exports.createRecipient = createRecipient;
exports.deleteRecipient = deleteRecipient;
exports.getAllDistributions = getAllDistributions;
exports.createDistribution = createDistribution;
exports.processQRScan = processQRScan;
exports.checkQRStatus = checkQRStatus;
const API_URL = 'http://localhost:3001/api';
// Sites
async function getAllSites() {
    const response = await fetch(`${API_URL}/sites`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}
async function createSite(site) {
    const response = await fetch(`${API_URL}/sites`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(site),
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}
// Households
async function getAllHouseholds() {
    const response = await fetch(`${API_URL}/households`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}
async function getHouseholdsByTokenNumber(token) {
    const response = await fetch(`${API_URL}/households/token/${token}`);
    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}
async function getHouseholdsBySite(siteId) {
    const response = await fetch(`${API_URL}/households/site/${siteId}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}
async function createHousehold(household) {
    const response = await fetch(`${API_URL}/households`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(household),
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}
// Recipients
async function getAllRecipients() {
    const response = await fetch(`${API_URL}/recipients`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}
async function getRecipientsByHousehold(householdId) {
    const response = await fetch(`${API_URL}/recipients/household/${householdId}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}
async function createRecipient(recipient) {
    const response = await fetch(`${API_URL}/recipients`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipient),
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}
async function deleteRecipient(id) {
    const response = await fetch(`${API_URL}/recipients/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}
// Distributions
async function getAllDistributions() {
    const response = await fetch(`${API_URL}/distributions`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}
async function createDistribution(distribution) {
    const response = await fetch(`${API_URL}/distributions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(distribution),
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}
// QR Code Functions
async function processQRScan(qrData) {
    const response = await fetch(`${API_URL}/qr/process`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(qrData),
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}
async function checkQRStatus(householdId) {
    const response = await fetch(`${API_URL}/qr/status/${householdId}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}
//# sourceMappingURL=databaseService.js.map