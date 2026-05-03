import dbConnect from '@/lib/db/connection';
import AppLink from '@/lib/db/models/AppLink';


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