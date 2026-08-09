import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { withApi } from '@/lib/api/with-api';
import { uploadLib } from '@/lib/services/lib-service';
import dbConnect from '@/lib/db/connection';
import mongoose from 'mongoose';

// Temp chunk schema — stored in MongoDB so it works across serverless invocations
const ChunkSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  chunkIndex: { type: Number, required: true },
  data: { type: mongoose.Schema.Types.Buffer, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // Auto-delete after 10 min
});

ChunkSchema.index({ sessionId: 1, chunkIndex: 1 }, { unique: true });

const TempChunk = mongoose.models.TempChunk || mongoose.model('TempChunk', ChunkSchema);

export const POST = withApi(async (request, user) => {
  await dbConnect();
  const formData = await request.formData();
  const chunk = formData.get('chunk') as File | null;
  const fileName = formData.get('fileName') as string | null;
  const chunkIndex = parseInt(formData.get('chunkIndex') as string, 10);
  const totalChunks = parseInt(formData.get('totalChunks') as string, 10);
  const libType = (formData.get('type') as string) || 'free';

  if (!chunk || !fileName || isNaN(chunkIndex) || isNaN(totalChunks)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  if (!fileName.endsWith('.so')) {
    return NextResponse.json({ error: 'Only .so files are allowed' }, { status: 400 });
  }

  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const sessionId = `${user.username}_${safeFileName}`;

  // Save chunk to MongoDB
  const arrayBuffer = await chunk.arrayBuffer();
  const buffer = Buffer.from(new Uint8Array(arrayBuffer));
  await TempChunk.findOneAndUpdate(
    { sessionId, chunkIndex },
    { sessionId, chunkIndex, data: buffer, createdAt: new Date() },
    { upsert: true }
  );

  // If this is the last chunk, assemble and upload to FTP
  if (chunkIndex === totalChunks - 1) {
    const chunks = await TempChunk.find({ sessionId }).sort({ chunkIndex: 1 }).lean();

    if (chunks.length !== totalChunks) {
      return NextResponse.json(
        { error: `Missing chunks: got ${chunks.length} of ${totalChunks}` },
        { status: 400 }
      );
    }

    const buffers = chunks.map((c) => {
      // .lean() returns a MongoDB Binary for Buffer fields in some mongoose versions
      const raw = c.data as unknown;
      if (raw instanceof Buffer) return raw;
      const binary = raw as { buffer?: Uint8Array };
      if (binary.buffer) return Buffer.from(binary.buffer);
      return Buffer.from(raw as Uint8Array);
    });
    const fullBuffer = Buffer.concat(buffers);
    const sizeMB = (fullBuffer.length / (1024 * 1024)).toFixed(2);
    const stream = Readable.from(fullBuffer);

    try {
      const lib = await uploadLib(fileName, `${sizeMB} MB`, fullBuffer.length, stream, user.username, user.level, libType);
      await TempChunk.deleteMany({ sessionId });
      return NextResponse.json({ ...lib, replaced: true }, { status: 200 });
    } catch (error) {
      if (error instanceof Error && (error as Error & { code?: string }).code === 'FORBIDDEN_REPLACE') {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
      throw error;
    }
  }

  return NextResponse.json({ received: chunkIndex, totalChunks });
});
