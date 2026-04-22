import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { authenticate } from '@/lib/auth/middleware';
import { uploadLib } from '@/lib/services/lib-service';
import dbConnect from '@/lib/db/connection';
import mongoose from 'mongoose';

// Temp chunk schema — stored in MongoDB so it works across serverless invocations
const ChunkSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  chunkIndex: { type: Number, required: true },
  data: { type: Buffer, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // Auto-delete after 10 min
});

ChunkSchema.index({ sessionId: 1, chunkIndex: 1 }, { unique: true });

const TempChunk = mongoose.models.TempChunk || mongoose.model('TempChunk', ChunkSchema);

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const formData = await request.formData();
    const chunk = formData.get('chunk') as File | null;
    const fileName = formData.get('fileName') as string | null;
    const chunkIndex = parseInt(formData.get('chunkIndex') as string, 10);
    const totalChunks = parseInt(formData.get('totalChunks') as string, 10);

    if (!chunk || !fileName || isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!fileName.endsWith('.so')) {
      return NextResponse.json({ error: 'Only .so files are allowed' }, { status: 400 });
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const sessionId = `${user.username}_${safeFileName}`;

    // Save chunk to MongoDB
    const buffer = Buffer.from(await chunk.arrayBuffer());
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

      const fullBuffer = Buffer.concat(chunks.map((c: any) => c.data));
      const sizeMB = (fullBuffer.length / (1024 * 1024)).toFixed(2);
      const stream = Readable.from(fullBuffer);

      const lib = await uploadLib(fileName, `${sizeMB} MB`, stream, user.username);

      // Clean up temp chunks
      await TempChunk.deleteMany({ sessionId });

      return NextResponse.json(lib, { status: 201 });
    }

    return NextResponse.json({ received: chunkIndex, totalChunks });
  } catch (error: any) {
    if (error.code === 'DUPLICATE_FILENAME') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Chunked upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
