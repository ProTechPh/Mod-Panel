'use client';

import { useAuth } from '@/components/shared/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DocsPage() {
  const { user } = useAuth();
  if (user?.level !== 1 && user?.level !== 2) {
    return <p className="text-muted-foreground">Access denied</p>;
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">API Documentation</h2>

      {/* Connect API */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">POST /api/connect</CardTitle>
            <Badge variant="outline" className="text-xs">Public</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Validates a license key and returns mod configuration. Used by the mod client to authenticate.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Content-Type</h4>
            <code className="block bg-muted px-3 py-2 rounded text-xs font-mono">
              multipart/form-data
            </code>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Request Fields</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium">Field</th>
                    <th className="text-left py-2 pr-4 font-medium">Type</th>
                    <th className="text-left py-2 pr-4 font-medium">Format</th>
                    <th className="text-left py-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-primary">game</td>
                    <td className="py-2 pr-4">string</td>
                    <td className="py-2 pr-4 text-muted-foreground">[a-zA-Z0-9_-]+</td>
                    <td className="py-2 font-sans text-muted-foreground">Game code (e.g. PUBG, MLBB)</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-primary">user_key</td>
                    <td className="py-2 pr-4">string</td>
                    <td className="py-2 pr-4 text-muted-foreground">[a-zA-Z0-9_-]+</td>
                    <td className="py-2 font-sans text-muted-foreground">License key string</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-primary">serial</td>
                    <td className="py-2 pr-4">string</td>
                    <td className="py-2 pr-4 text-muted-foreground">[a-zA-Z0-9_-]+</td>
                    <td className="py-2 font-sans text-muted-foreground">Device serial identifier</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Example Request</h4>
            <pre className="bg-muted px-3 py-2 rounded text-xs font-mono overflow-x-auto">
{`curl -X POST ${baseUrl}/api/connect \\
  -F "game=PUBG" \\
  -F "user_key=abc123def456" \\
  -F "serial=device_serial_001"`}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Success Response</h4>
            <pre className="bg-muted px-3 py-2 rounded text-xs font-mono overflow-x-auto">
{`{
  "status": true,
  "data": {
    "real": "<game>-<userKey>-<serial>-<STATIC_WORDS>",
    "token": "<md5 hash of real>",
    "modname": "<modName from GameSetting or ServerConfig fallback>",
    "mod_status": "Active",
    "credit": "VIP",
    "ESP": true,
    "Item": false,
    "AIM": true,
    "SilentAim": false,
    "BulletTrack": true,
    "Floating": true,
    "Memory": false,
    "Setting": true,
    "EXP": "2025-06-15 12:30:00",
    "device": 2,
    "MOD_NAME": "<modName from GameSetting or ServerConfig fallback>",
    "MOD_STATUS": "Active",
    "FLOTING_TEST": "VIP",
    "BHATIA_EXP": "2025-06-15T12:30:00.000Z",
    "BHATIA_SLOT": 2,
    "rng": 1718234567
  }
}`}
            </pre>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Error Responses</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium">reason</th>
                    <th className="text-left py-2 font-medium">Condition</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-destructive">Bad Parameter</td>
                    <td className="py-2 font-sans">Missing or invalid fields</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-destructive">Under maintenance.</td>
                    <td className="py-2 font-sans">Server maintenance mode is on</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-destructive">Incorrect Key</td>
                    <td className="py-2 font-sans">Key not found for that game</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-destructive">Suspended Key, Contact: @...</td>
                    <td className="py-2 font-sans">Key status is not active</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-destructive">Expired Key, Contact: @...</td>
                    <td className="py-2 font-sans">Key expiration date has passed</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-destructive">Max Device Reached, Contact: @...</td>
                    <td className="py-2 font-sans">Device limit exceeded</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4 text-destructive">Key invalidated - IP mismatch...</td>
                    <td className="py-2 font-sans">Free key IP mismatch (abuse prevention)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 text-destructive">Server error, try again later.</td>
                    <td className="py-2 font-sans">Unexpected server error</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Notes</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>IP address is extracted from <code className="bg-muted px-1 rounded">x-forwarded-for</code> or <code className="bg-muted px-1 rounded">x-real-ip</code> headers</li>
              <li>Free keys have IP validation &mdash; connecting from a different IP invalidates the key</li>
              <li>Device serial is tracked; connecting from more devices than <code className="bg-muted px-1 rounded">maxDevices</code> is blocked</li>
              <li>Feature flags (ESP, AIM, etc.) come from the game&#39;s settings in the database</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Connect GET */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">GET /api/connect</CardTitle>
            <Badge variant="outline" className="text-xs">Public</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Returns server info and contact details. No authentication required.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Example Request</h4>
            <pre className="bg-muted px-3 py-2 rounded text-xs font-mono overflow-x-auto">
{`curl ${baseUrl}/api/connect`}
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Response</h4>
            <pre className="bg-muted px-3 py-2 rounded text-xs font-mono overflow-x-auto">
{`{
  "web_info": {
    "_client": "Winter Panel",
    "license": "<LICENSE_KEY>",
    "version": "3.0.0"
  },
  "web__dev": {
    "author": "ProTech Dev",
    "Channel": "https://t.me/...",
    "Group": "https://t.me/..."
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Library APIs */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">Library APIs</CardTitle>
            <Badge className="text-xs">Auth Required</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage .so library files. All endpoints require a valid <code className="bg-muted px-1 rounded">wp_access</code> cookie.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* GET /api/libs */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">GET</Badge>
              <span className="font-mono text-sm font-medium">/api/libs</span>
            </div>
            <p className="text-sm text-muted-foreground">List all uploaded .so library files. Non-owners only see their own uploads.</p>
            <div>
              <h4 className="text-sm font-semibold mb-2">Response</h4>
              <pre className="bg-muted px-3 py-2 rounded text-xs font-mono overflow-x-auto">
{`[
  {
    "_id": "objectId",
    "fileName": "libname_abc123.so",
    "displayName": "libname.so",
    "fileSize": "2.45 MB",
    "uploadedBy": "admin_username",
    "uploadedAt": "2025-01-15T12:30:00.000Z"
  }
]`}
              </pre>
            </div>
          </div>

          <hr className="border-border/50" />

          {/* POST /api/libs */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">POST</Badge>
              <span className="font-mono text-sm font-medium">/api/libs</span>
            </div>
            <p className="text-sm text-muted-foreground">Upload a .so library file. Requires authentication.</p>
            <div>
              <h4 className="text-sm font-semibold mb-2">Content-Type</h4>
              <code className="block bg-muted px-3 py-2 rounded text-xs font-mono">multipart/form-data</code>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Request Fields</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium">Field</th>
                      <th className="text-left py-2 pr-4 font-medium">Type</th>
                      <th className="text-left py-2 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 text-primary">file</td>
                      <td className="py-2 pr-4">File (.so)</td>
                      <td className="py-2 font-sans text-muted-foreground">The .so library file to upload</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Example Request</h4>
              <pre className="bg-muted px-3 py-2 rounded text-xs font-mono overflow-x-auto">
{`curl -X POST ${baseUrl}/api/libs \\
  -H "Cookie: wp_access=<token>" \\
  -F "file=@libname.so"`}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Success Response (201)</h4>
              <pre className="bg-muted px-3 py-2 rounded text-xs font-mono overflow-x-auto">
{`{
  "_id": "objectId",
  "fileName": "libname_abc123.so",
  "displayName": "libname.so",
  "fileSize": "2.45 MB",
  "uploadedBy": "username",
  "uploadedAt": "2025-01-15T12:30:00.000Z"
}`}
              </pre>
            </div>
          </div>

          <hr className="border-border/50" />

          {/* DELETE /api/libs */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-red-500/10 text-red-500 border-red-500/20">DELETE</Badge>
              <span className="font-mono text-sm font-medium">/api/libs?id=&lt;id&gt;</span>
            </div>
            <p className="text-sm text-muted-foreground">Delete a library file. Admin/Owner only (level 1-2).</p>
            <div>
              <h4 className="text-sm font-semibold mb-2">Example Request</h4>
              <pre className="bg-muted px-3 py-2 rounded text-xs font-mono overflow-x-auto">
{`curl -X DELETE "${baseUrl}/api/libs?id=<objectId>" \\
  -H "Cookie: wp_access=<token>"`}
              </pre>
            </div>
          </div>

          <hr className="border-border/50" />

          {/* GET /api/libs/serve/[fileName] */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">GET</Badge>
              <span className="font-mono text-sm font-medium">/api/libs/serve/&lt;fileName&gt;</span>
              <Badge variant="outline" className="text-xs">Public</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Download a .so library file by its stored fileName. No authentication required. Returns binary file with <code className="bg-muted px-1 rounded">Content-Disposition: attachment</code>.
            </p>
            <div>
              <h4 className="text-sm font-semibold mb-2">Example Request</h4>
              <pre className="bg-muted px-3 py-2 rounded text-xs font-mono overflow-x-auto">
{`curl -O "${baseUrl}/api/libs/serve/libname_abc123.so"`}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Response Headers</h4>
              <pre className="bg-muted px-3 py-2 rounded text-xs font-mono overflow-x-auto">
{`Content-Type: application/octet-stream
Content-Disposition: attachment; filename="libname_abc123.so"`}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Error Responses</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium">Status</th>
                      <th className="text-left py-2 pr-4 font-medium">Error</th>
                      <th className="text-left py-2 font-medium">Condition</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4">403</td>
                      <td className="py-2 pr-4 text-destructive">Forbidden</td>
                      <td className="py-2 font-sans">File does not end with .so</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">404</td>
                      <td className="py-2 pr-4 text-destructive">File not found</td>
                      <td className="py-2 font-sans">File does not exist on FTP server</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}