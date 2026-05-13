import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithToken } from '@/lib/services/user-service';
import { resetPasswordSchema } from '@/lib/validators/auth';
import { Logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await resetPasswordWithToken(
      parsed.data.token,
      parsed.data.password
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    Logger.error('Reset password error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
