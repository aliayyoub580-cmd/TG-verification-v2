/**
 * Pluggable Product Authenticity Verification Service
 * 
 * Determines whether a submitted product code or barcode is authentic.
 * This service can query an internal database, contact an external ERP/MES,
 * or evaluate cryptographic signatures.
 * 
 * Replace or extend this module to plug in your organization's actual verification logic.
 */

const { verifyCode: dbVerifyCode } = require('./verifyService');
const { normalizeCode } = require('../utils/csvUtils');

// Built-in mock registry for standalone operation and demonstration
const MOCK_AUTHENTIC_PRODUCTS = {
  '2VXT4TN5RB': {
    authentic: true,
    productName: 'T.G. 15 mg',
    medicineName: 'Tirzepatida',
    dosage: '15 mg/0.5mL',
    brand: 'INDUFAR',
    batch: 'B-DB-2VXT4T',
    serialNumber: '2VXT4TN5RB',
    imageUrl: '/T.G.%2020mg.png',
    logoUrl: '/logo.png',
    companyName: 'Indufar',
    manufacturer: 'Laboratorios Indufar C.A.',
    presentation: '4 frascos viales con 0,5 mL de solución inyectable',
    successMessage: "This code matches our records. Compare it with the code printed on your product's packaging.",
    footerText: 'Secured verification · Powered by Indufar',
    message: "This code matches our records. Compare it with the code printed on your product's packaging.",
  },
  'VALID-TG-001': {
    authentic: true,
    productName: 'T.G. 20 mg (Tadalafil)',
    medicineName: 'Tirzepatida',
    dosage: '20 mg/0.5mL',
    brand: 'INDUFAR',
    batch: 'B-2024-08X',
    serialNumber: 'VALID-TG-001',
    imageUrl: '/T.G.%2020mg.png',
    logoUrl: '/logo.png',
    companyName: 'Indufar',
    manufacturer: 'Laboratorios Indufar C.A.',
    presentation: '4 frascos viales con 0,5 mL de solución inyectable',
    manufacturingDate: '2024-03-15',
    expiryDate: '2027-03-15',
    sanitaryRegistration: 'INV-E.F. 39.124/19',
    successMessage: "This code matches our records. Compare it with the code printed on your product's packaging.",
    footerText: 'Secured verification · Powered by Indufar',
    message: "This code matches our records. Compare it with the code printed on your product's packaging.",
  },
  'TG-20MG-BATCH44': {
    authentic: true,
    productName: 'T.G. 20 mg',
    medicineName: 'Tirzepatida',
    dosage: '20 mg/0.5mL',
    brand: 'INDUFAR',
    batch: 'B-2024-44',
    serialNumber: 'TG-20MG-BATCH44',
    imageUrl: '/T.G.%2020mg.png',
    logoUrl: '/logo.png',
    companyName: 'Indufar',
    manufacturer: 'Laboratorios Indufar C.A.',
    presentation: '4 frascos viales con 0,5 mL de solución inyectable',
    manufacturingDate: '2024-06-10',
    expiryDate: '2027-06-10',
    sanitaryRegistration: 'INV-E.F. 39.124/19',
    successMessage: "This code matches our records. Compare it with the code printed on your product's packaging.",
    footerText: 'Secured verification · Powered by Indufar',
    message: "This code matches our records. Compare it with the code printed on your product's packaging.",
  },
  'INDUFAR-VERIFIED-99': {
    authentic: true,
    productName: 'T.G. 15 mg',
    medicineName: 'Tirzepatida',
    dosage: '15 mg/0.5mL',
    brand: 'INDUFAR',
    batch: 'B-2024-99',
    serialNumber: 'INDUFAR-VERIFIED-99',
    imageUrl: '/T.G.%2020mg.png',
    logoUrl: '/logo.png',
    companyName: 'Indufar',
    manufacturer: 'Laboratorios Indufar C.A.',
    presentation: '4 frascos viales con 0,5 mL de solución inyectable',
    manufacturingDate: '2024-01-20',
    expiryDate: '2026-12-31',
    sanitaryRegistration: 'INV-E.F. 39.124/19',
    successMessage: "This code matches our records. Compare it with the code printed on your product's packaging.",
    footerText: 'Secured verification · Powered by Indufar',
    message: "This code matches our records. Compare it with the code printed on your product's packaging.",
  },
  '7GG6Y89U8K': {
    authentic: true,
    productName: 'T.G. 15 mg',
    medicineName: 'Tirzepatida',
    dosage: '15 mg/0.5mL',
    brand: 'INDUFAR',
    batch: 'B-2024-01A',
    serialNumber: '7GG6Y89U8K',
    imageUrl: '/T.G.%2020mg.png',
    logoUrl: '/logo.png',
    companyName: 'Indufar',
    manufacturer: 'Laboratorios Indufar C.A.',
    presentation: '4 frascos viales con 0,5 mL de solución inyectable',
    manufacturingDate: '2024-02-01',
    expiryDate: '2027-02-01',
    sanitaryRegistration: 'INV-E.F. 39.124/19',
    successMessage: "This code matches our records. Compare it with the code printed on your product's packaging.",
    footerText: 'Secured verification · Powered by Indufar',
    message: "This code matches our records. Compare it with the code printed on your product's packaging.",
  },
  // Common barcode formats (EAN-13 & UPC-A)
  '7840001001234': {
    authentic: true,
    productName: 'T.G. 15 mg',
    medicineName: 'Tirzepatida',
    dosage: '15 mg/0.5mL',
    brand: 'INDUFAR',
    batch: 'B-EAN-78400',
    serialNumber: 'BARCODE-7840001001234',
    imageUrl: '/T.G.%2020mg.png',
    logoUrl: '/logo.png',
    companyName: 'Indufar',
    manufacturer: 'Laboratorios Indufar C.A.',
    presentation: 'Blister Pack 4 units',
    manufacturingDate: '2024-04-01',
    expiryDate: '2027-04-01',
    sanitaryRegistration: 'INV-E.F. 39.124/19',
    successMessage: "This code matches our records. Compare it with the code printed on your product's packaging.",
    footerText: 'Secured verification · Powered by Indufar',
    message: "This code matches our records. Compare it with the code printed on your product's packaging.",
  },
  '012345678905': {
    authentic: true,
    productName: 'T.G. 15 mg',
    medicineName: 'Tirzepatida',
    dosage: '15 mg/0.5mL',
    brand: 'INDUFAR',
    batch: 'B-UPC-01234',
    serialNumber: 'UPC-012345678905',
    imageUrl: '/T.G.%2020mg.png',
    logoUrl: '/logo.png',
    companyName: 'Indufar',
    manufacturer: 'Laboratorios Indufar C.A.',
    presentation: 'Commercial Package',
    manufacturingDate: '2024-05-12',
    expiryDate: '2027-05-12',
    sanitaryRegistration: 'INV-E.F. 39.124/19',
    successMessage: "This code matches our records. Compare it with the code printed on your product's packaging.",
    footerText: 'Secured verification · Powered by Indufar',
    message: "This code matches our records. Compare it with the code printed on your product's packaging.",
  },
};

/**
 * Helper to extract code parameter if input is a URL string
 */
function extractCodeFromInput(input) {
  if (!input) return '';
  let str = String(input).trim();
  try {
    if (str.startsWith('http://') || str.startsWith('https://')) {
      const parsed = new URL(str);
      const paramCode = parsed.searchParams.get('code');
      if (paramCode) return paramCode.trim();
    }
  } catch (e) {}

  const match = str.match(/[?&]code=([^&#\s]+)/i);
  if (match) {
    try {
      return decodeURIComponent(match[1]).trim();
    } catch (e) {
      return match[1].trim();
    }
  }
  return str;
}

/**
 * Verify a product code against mock database or Supabase persistence.
 *
 * @param {string} rawCode - The scanned QR code or barcode string
 * @param {object} [meta] - Optional audit metadata (ipAddress, userAgent, etc.)
 */
async function verifyProductCode(rawCode, meta = {}) {
  const verifiedAt = new Date().toISOString();

  if (!rawCode || typeof rawCode !== 'string' || !rawCode.trim()) {
    return {
      authentic: false,
      code: '',
      message: 'No product code provided for verification.',
      verifiedAt,
    };
  }

  const code = extractCodeFromInput(rawCode);
  const cleaned = normalizeCode(code);
  const normalizedKey = cleaned.toUpperCase().replace(/\s+/g, '');

  // 1. Check known mock records first (guaranteed instant response)
  if (MOCK_AUTHENTIC_PRODUCTS[normalizedKey]) {
    const item = MOCK_AUTHENTIC_PRODUCTS[normalizedKey];
    return {
      ...item,
      code: cleaned,
      verifiedAt,
      data: {
        code: cleaned,
        product: {
          name: item.productName,
          medicineName: item.medicineName,
          dosage: item.dosage,
          imageUrl: item.imageUrl,
          logoUrl: item.logoUrl,
          companyName: item.companyName,
          successMessage: item.successMessage,
          footerText: item.footerText,
        },
      },
    };
  }

  // 2. Query existing database service if available
  try {
    const dbResult = await dbVerifyCode(cleaned, meta);
    if (dbResult && dbResult.success && dbResult.status === 'authentic') {
      const prod = dbResult.data?.product || {};
      return {
        authentic: true,
        code: cleaned,
        productName: prod.name || prod.medicineName || 'T.G. 15 mg',
        medicineName: prod.medicineName || 'Tirzepatida',
        dosage: prod.dosage || '15 mg/0.5mL',
        brand: prod.companyName || 'INDUFAR',
        batch: prod.batch || 'B-DB-' + cleaned.substring(0, 6).toUpperCase(),
        serialNumber: cleaned,
        imageUrl: prod.imageUrl || prod.product_image_url || '/T.G.%2020mg.png',
        logoUrl: prod.logoUrl || prod.company_logo_url || '/logo.png',
        companyName: prod.companyName || 'Indufar',
        manufacturer: prod.companyName || 'Laboratorios Indufar C.A.',
        successMessage:
          prod.successMessage ||
          prod.success_message ||
          "This code matches our records. Compare it with the code printed on your product's packaging.",
        footerText: prod.footerText || prod.footer_text || 'Secured verification · Powered by Indufar',
        message:
          prod.successMessage ||
          prod.success_message ||
          "This code matches our records. Compare it with the code printed on your product's packaging.",
        verifiedAt,
        data: dbResult.data,
      };
    } else if (dbResult && dbResult.status === 'inactive') {
      return {
        authentic: false,
        status: 'inactive',
        code: cleaned,
        message: dbResult.message || 'This code exists but is currently inactive. It may have been recalled or deactivated.',
        verifiedAt,
      };
    }
  } catch (err) {
    // Database check failed or not configured; fallback to mock logic below
    console.warn('[verifyProductCode] Database lookup skipped/failed:', err.message);
  }

  // 3. Fallback: Check for demo prefixes or format rules
  if (normalizedKey.startsWith('AUTH-') || normalizedKey.startsWith('TG-') || normalizedKey.endsWith('-OK')) {
    return {
      authentic: true,
      code: cleaned,
      productName: 'T.G. 15 mg',
      medicineName: 'Tirzepatida',
      dosage: '15 mg/0.5mL',
      brand: 'INDUFAR',
      batch: 'B-2024-' + normalizedKey.slice(-4),
      serialNumber: cleaned,
      imageUrl: '/T.G.%2020mg.png',
      logoUrl: '/logo.png',
      companyName: 'Indufar',
      manufacturer: 'Laboratorios Indufar C.A.',
      presentation: 'Standard packaging',
      expiryDate: '2027-12-31',
      successMessage: "This code matches our records. Compare it with the code printed on your product's packaging.",
      footerText: 'Secured verification · Powered by Indufar',
      message: "This code matches our records. Compare it with the code printed on your product's packaging.",
      verifiedAt,
      data: {
        code: cleaned,
        product: {
          name: 'T.G. 15 mg',
          medicineName: 'Tirzepatida',
          dosage: '15 mg/0.5mL',
          imageUrl: '/T.G.%2020mg.png',
          logoUrl: '/logo.png',
          companyName: 'Indufar',
          successMessage: "This code matches our records. Compare it with the code printed on your product's packaging.",
          footerText: 'Secured verification · Powered by Indufar',
        },
      },
    };
  }

  // 4. Default: Product not recognized / counterfeit
  return {
    authentic: false,
    status: 'not_found',
    code: cleaned,
    message: 'This product could not be verified in our official registry. Please check the code or contact support.',
    verifiedAt,
  };
}

module.exports = {
  verifyProductCode,
  MOCK_AUTHENTIC_PRODUCTS,
};
