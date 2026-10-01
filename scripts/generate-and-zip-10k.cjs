const fs = require('fs');
const path = require('path');
const archiver = require(path.resolve(__dirname, '../backend/node_modules/archiver'));
const QRCode = require(path.resolve(__dirname, '../backend/node_modules/qrcode'));
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { supabaseAdmin } = require(path.resolve(__dirname, '../backend/src/config/supabase'));
const { QR_CODES_BUCKET } = require(path.resolve(__dirname, '../backend/src/config/constants'));
const { safeFileName } = require(path.resolve(__dirname, '../backend/src/services/generateService'));

const BASE_URL = 'https://tg-verification-v2.vercel.app';
const TARGET_DIR = path.resolve(__dirname, '../src/pages/Qr code zip');
const BATCH_NAME = process.argv[2] || 'Batch 2 10K Codes';
const BATCH_ID = process.argv[3] || 'd3e6af2b-7323-4f87-bfc2-7b00213665b9';
const ZIP_PATH = path.join(TARGET_DIR, `${BATCH_NAME}.zip`);
const SUPABASE_STORAGE_URL = 'https://ghbgqekqvjwsqtdreqlc.supabase.co/storage/v1/object/public/qr-codes';

function buildVerificationUrl(code) {
  return `${BASE_URL}/verify?code=${encodeURIComponent(code)}`;
}

async function generatePngBuffer(code) {
  const url = buildVerificationUrl(code);
  return QRCode.toBuffer(url, {
    type: 'png',
    width: 512,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
}

// Worker thread logic
if (!isMainThread) {
  (async () => {
    const { items } = workerData;
    const results = [];
    for (const item of items) {
      try {
        const buffer = await generatePngBuffer(item.code);
        results.push({ id: item.id, code: item.code, buffer });
      } catch (err) {
        results.push({ id: item.id, code: item.code, error: err.message });
      }
    }
    parentPort.postMessage(results);
  })();
  return;
}

// Main thread logic
async function run() {
  console.log(`=== Step 1: Fetching 10,000 codes for batch '${BATCH_NAME}' (${BATCH_ID}) ===`);
  const allCodes = [];
  const PAGE_SIZE = 1000;
  for (let i = 0; i < 10; i++) {
    let query = supabaseAdmin
      .from('qr_codes')
      .select('id, code, product_id, qr_generated, qr_image_path, qr_image_url');

    if (BATCH_ID) {
      query = query.eq('imported_batch_id', BATCH_ID);
    } else {
      query = query.eq('qr_generated', false);
    }

    const { data, error } = await query
      .order('id')
      .range(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to fetch codes range ${i}: ${error.message}`);
    }
    if (data && data.length > 0) {
      allCodes.push(...data);
    }
    console.log(`Fetched page ${i + 1}/10: ${allCodes.length} total codes loaded`);
  }

  if (allCodes.length === 0) {
    throw new Error('No codes found to process!');
  }
  console.log(`Total codes to process: ${allCodes.length}`);

  // Step 2: Ensure target directory exists
  console.log('\n=== Step 2: Preparing output directory ===');
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`Created directory: ${TARGET_DIR}`);
  } else {
    console.log(`Directory exists: ${TARGET_DIR}`);
  }

  if (fs.existsSync(ZIP_PATH)) {
    try { fs.unlinkSync(ZIP_PATH); } catch (e) {}
  }

  // Step 3: Generate QR codes and write to ZIP
  console.log(`\n=== Step 3: Generating QR codes & creating ZIP archive at '${ZIP_PATH}' ===`);
  const outStream = fs.createWriteStream(ZIP_PATH);
  const archive = archiver('zip', { zlib: { level: 6 } });

  const zipPromise = new Promise((resolve, reject) => {
    outStream.on('close', resolve);
    archive.on('error', reject);
    outStream.on('error', reject);
  });

  archive.pipe(outStream);

  const NUM_WORKERS = 8;
  const BATCH_SIZE = 1000;
  let processedCount = 0;

  console.time('QR Generation & Zipping');

  for (let i = 0; i < allCodes.length; i += BATCH_SIZE) {
    const batch = allCodes.slice(i, i + BATCH_SIZE);
    const subChunkSize = Math.ceil(batch.length / NUM_WORKERS);
    const subPromises = [];

    for (let w = 0; w < NUM_WORKERS; w++) {
      const items = batch.slice(w * subChunkSize, (w + 1) * subChunkSize);
      if (items.length === 0) continue;

      subPromises.push(new Promise((resolve, reject) => {
        const worker = new Worker(__filename, { workerData: { items } });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
      }));
    }

    const workerResults = await Promise.all(subPromises);
    for (const resList of workerResults) {
      for (const item of resList) {
        if (item.buffer) {
          const buf = Buffer.isBuffer(item.buffer) ? item.buffer : Buffer.from(item.buffer);
          archive.append(buf, { name: `${safeFileName(item.code)}.png` });
          processedCount++;
        } else {
          console.error(`Error generating QR for code ${item.code}: ${item.error}`);
        }
      }
    }
    console.log(`Progress: ${processedCount}/${allCodes.length} QR codes added to zip`);
  }

  console.log('Finalizing ZIP archive...');
  await archive.finalize();
  await zipPromise;
  console.timeEnd('QR Generation & Zipping');

  const zipStats = fs.statSync(ZIP_PATH);
  console.log(`ZIP created successfully! Size: ${(zipStats.size / (1024 * 1024)).toFixed(2)} MB (${zipStats.size} bytes)`);

  // Step 4: Batch update database
  console.log('\n=== Step 4: Updating database records in Supabase ===');
  console.time('DB Update');
  const now = new Date().toISOString();
  const DB_BATCH = 500;
  let updatedRows = 0;

  for (let i = 0; i < allCodes.length; i += DB_BATCH) {
    const chunk = allCodes.slice(i, i + DB_BATCH);
    const updateRecords = chunk.map((item) => {
      const fileName = `${item.id}-${safeFileName(item.code)}.png`;
      const storagePath = `${item.product_id}/${fileName}`;
      const publicUrl = `${SUPABASE_STORAGE_URL}/${storagePath}`;
      return {
        id: item.id,
        code: item.code,
        code_normalized: item.code.trim().toUpperCase(),
        product_id: item.product_id,
        qr_generated: true,
        qr_generation_state: 'generated',
        qr_image_path: storagePath,
        qr_image_url: publicUrl,
        qr_generated_at: now,
        updated_at: now,
      };
    });

    const { error: upsertError } = await supabaseAdmin
      .from('qr_codes')
      .upsert(updateRecords, { onConflict: 'id' });

    if (upsertError) {
      console.error(`Error upserting DB batch ${i}: ${upsertError.message}`);
    } else {
      updatedRows += chunk.length;
      console.log(`DB updated: ${updatedRows}/${allCodes.length} codes`);
    }
  }
  console.timeEnd('DB Update');

  // Step 5: Upload images to Supabase Storage in pool
  console.log('\n=== Step 5: Uploading images to Supabase Storage (qr-codes bucket) ===');
  console.time('Storage Upload');
  const UPLOAD_CONCURRENCY = 40;
  let uploadIndex = 0;
  let uploadedCount = 0;
  let uploadErrors = 0;

  async function uploadWorker() {
    while (uploadIndex < allCodes.length) {
      const idx = uploadIndex++;
      const item = allCodes[idx];
      const storagePath = `${item.product_id}/${item.id}-${safeFileName(item.code)}.png`;
      try {
        const buffer = await generatePngBuffer(item.code);
        const { error: uploadError } = await supabaseAdmin.storage
          .from(QR_CODES_BUCKET)
          .upload(storagePath, buffer, {
            contentType: 'image/png',
            upsert: true,
          });

        if (uploadError) {
          uploadErrors++;
        } else {
          uploadedCount++;
        }
      } catch (err) {
        uploadErrors++;
      }

      if ((uploadedCount + uploadErrors) % 1000 === 0 || (uploadedCount + uploadErrors) === allCodes.length) {
        console.log(`Storage upload progress: ${uploadedCount} uploaded, ${uploadErrors} errors (${uploadedCount + uploadErrors}/${allCodes.length})`);
      }
    }
  }

  const uploadPool = [];
  for (let c = 0; c < UPLOAD_CONCURRENCY; c++) {
    uploadPool.push(uploadWorker());
  }
  await Promise.all(uploadPool);
  console.timeEnd('Storage Upload');

  console.log('\n=== ALL TASKS COMPLETED SUCCESSFULLY ===');
  console.log(`- Folder: ${TARGET_DIR}`);
  console.log(`- Zip File: ${ZIP_PATH}`);
  console.log(`- Zip Size: ${(zipStats.size / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`- Total QR codes in zip: ${processedCount}`);
  console.log(`- Total DB records updated to generated: ${updatedRows}`);
  console.log(`- Total Storage images uploaded: ${uploadedCount}`);
}

run().catch((err) => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
