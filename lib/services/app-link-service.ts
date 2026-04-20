import dbConnect from '@/lib/db/connection';
import AppLink from '@/lib/db/models/AppLink';

const GITHUB_REPO = 'ProTechPh/Mod-Panel';

export async function getLatestModPanelRelease() {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      {
        headers: { Accept: 'application/vnd.github+json' },
        next: { revalidate: 300 }, // cache for 5 minutes
      }
    );
    if (!res.ok) return null;

    const release = await res.json();
    const tag: string = release.tag_name ?? '';
    const version = tag.replace(/^v/, '');
    if (!version) return null;

    const apkAsset = (release.assets as { name: string; browser_download_url: string }[])
      .find(a => a.name?.endsWith('.apk'));
    const downloadUrl: string = apkAsset?.browser_download_url ?? release.html_url;

    return {
      _id: 'mod-panel-app',
      appName: `Mod Panel v${version}`,
      downloadUrl,
      version,
    };
  } catch {
    return null;
  }
}

export async function listAppLinks() {
  await dbConnect();
  const links = await AppLink.find({}).lean();
  return links.map(l => ({
    ...l,
    _id: l._id.toString(),
    createdAt: l.createdAt?.toISOString(),
  }));
}

export async function addAppLink(appName: string, downloadUrl: string) {
  await dbConnect();
  const link = await AppLink.create({ appName, downloadUrl });
  return { ...link.toObject(), _id: link._id.toString() };
}

export async function deleteAppLink(id: string) {
  await dbConnect();
  const result = await AppLink.deleteOne({ _id: id });
  return result.deletedCount > 0;
}