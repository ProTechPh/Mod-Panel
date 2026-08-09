import { NextResponse } from 'next/server';
import { resetPasswordWithToken } from '@/lib/services/user-service';
import { resetPasswordSchema } from '@/lib/validators/auth';
import { withPublicApi } from '@/lib/api/with-api';

export const POST = withPublicApi(async (request) => {
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
});
