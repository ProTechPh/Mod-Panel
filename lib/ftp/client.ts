import * as ftp from 'basic-ftp';
import { Readable, PassThrough } from 'stream';

const FTP_CONFIG = {
  host: process.env.FTP_HOSTNAME || 'ftpupload.net',
  user: process.env.FTP_USERNAME || '',
  password: process.env.FTP_PASSWORD || '',
  port: parseInt(process.env.FTP_PORT || '21', 10),
};

const REMOTE_PATH = process.env.FTP_REMOTE_PATH || '/htdocs/onlinelibs/';
const BASE_URL = process.env.FTP_BASE_URL || 'https://winterph.unaux.com/onlinelibs';

export async function uploadToFtp(fileName: string, stream: Readable | string): Promise<string> {
  const client = new ftp.Client(15000);
  try {
    await client.access(FTP_CONFIG);
    await client.ensureDir(REMOTE_PATH);
    await client.uploadFrom(stream, `${REMOTE_PATH}${fileName}`);
    return `${BASE_URL}/${fileName}`;
  } finally {
    client.close();
  }
}

export async function deleteFromFtp(fileName: string): Promise<void> {
  const client = new ftp.Client(15000);
  try {
    await client.access(FTP_CONFIG);
    await client.remove(`${REMOTE_PATH}${fileName}`);
  } finally {
    client.close();
  }
}

export function getFtpUrl(fileName: string): string {
  return `${BASE_URL}/${fileName}`;
}

export async function downloadFromFtp(fileName: string): Promise<Readable> {
  const client = new ftp.Client(30000);
  await client.access(FTP_CONFIG);
  const passthrough = new PassThrough();
  client.downloadTo(passthrough, `${REMOTE_PATH}${fileName}`)
    .then(() => passthrough.end())
    .catch(err => passthrough.destroy(err))
    .finally(() => client.close());
  return passthrough;
}
