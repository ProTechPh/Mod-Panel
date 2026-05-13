import { NextRequest, NextResponse } from 'next/server';
import { generateResetToken } from '@/lib/services/user-service';
import { forgotPasswordSchema } from '@/lib/validators/auth';
import { verifyTurnstile } from '@/lib/auth/turnstile';
import { Logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-client-ip') || 'unknown';

  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    if (parsed.data.turnstileToken) {
      const isHuman = await verifyTurnstile(parsed.data.turnstileToken, ip);
      if (!isHuman) {
        return NextResponse.json(
          { error: 'Captcha verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    const result = await generateResetToken(parsed.data.identifier);

    if (!result) {
      // Return success even if user not found to prevent enumeration
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a reset link has been generated.',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Reset link generated successfully.',
      token: result.token,
      username: result.username,
    });
  } catch (error) {
    Logger.error('Forgot password error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
