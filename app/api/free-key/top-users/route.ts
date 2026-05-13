import { NextRequest, NextResponse } from 'next/server';
import { getTopAdClaimers } from '@/lib/services/free-key-service';
import { Logger } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 10;
    
    const topUsers = await getTopAdClaimers(limit);
    
    return NextResponse.json(topUsers);
  } catch (error) {
    console.error('Top users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
