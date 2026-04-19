import { NextResponse } from 'next/server';
import { getServerConfig } from '@/lib/services/server-config-service';
import { listGameSettings } from '@/lib/services/game-settings-service';
import Key from '@/lib/db/models/Key';
import dbConnect from '@/lib/db/connection';

export async function GET() {
  try {
    const config = await getServerConfig();

    await dbConnect();
    const [activeKeys, games] = await Promise.all([
      Key.countDocuments({ status: 1 }),
      listGameSettings(),
    ]);

    const enabledGames = games.filter(g => g.isEnabled);

    return NextResponse.json({
      success: true,
      data: {
        status: config.maintenanceStatus === 'off' ? 'active' : 'maintenance',
        maintenance: config.maintenanceStatus,
        maintenanceMessage: config.maintenanceMessage || '',
        activePlayers: activeKeys,
        totalSlots: 500,
        version: enabledGames[0]?.modName || '3.0.0',
        modName: config.modName || '',
      },
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: {
        status: 'active',
        maintenance: 'off',
        maintenanceMessage: '',
        activePlayers: 0,
        totalSlots: 500,
        version: '3.0.0',
        modName: '',
      },
    });
  }
}