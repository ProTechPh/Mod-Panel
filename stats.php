<?php
// Determine the account root by walking up from __DIR__
// InfinityFree structure: /home/volX_XXXX/htdocs/ or /home/volX_XXXX/domain/htdocs/
// We want to scan from the volX_XXXX level (one above the first htdocs or domain folder)
$startDir = __DIR__;
$accountRoot = null;
$dir = $startDir;
$seen = [];
while ($dir !== dirname($dir) && !in_array($dir, $seen, true)) {
    $seen[] = $dir;
    $basename = basename($dir);
    // If we find htdocs or a folder with a dot (like mod.kesug.com), keep going up
    // The account root is the parent of the first level that isn't special
    $parent = dirname($dir);
    if ($parent === $dir) break;
    // Try to find the account root: it typically has multiple domain subdirs
    $entries = @scandir($parent);
    if ($entries) {
        $subdirCount = 0;
        foreach ($entries as $e) {
            if ($e === '.' || $e === '..') continue;
            if (is_dir($parent . '/' . $e)) $subdirCount++;
        }
        // If parent has many subdirs (> 1 domain folder), it's likely the account root
        if ($subdirCount >= 2 && $basename !== 'htdocs') {
            $accountRoot = $dir;
            break;
        }
    }
    $dir = $parent;
}
// Fallback: scan from __DIR__ if we couldn't find account root
if (!$accountRoot) $accountRoot = $startDir;

$cacheFile = $accountRoot . '/ftp-stats.json';

$totalBytes = 0;
$totalInodes = 0;

function walk($dir, &$bytes, &$inodes, $depth = 0) {
    if ($depth > 6) return;
    $d = @opendir($dir);
    if (!$d) return;
    while (($f = readdir($d)) !== false) {
        if ($f === '.' || $f === '..') continue;
        $full = $dir . '/' . $f;
        $inodes++;
        if (is_file($full)) {
            $bytes += filesize($full);
        } elseif (is_dir($full)) {
            walk($full, $bytes, $inodes, $depth + 1);
        }
    }
    closedir($d);
}

walk($accountRoot, $totalBytes, $totalInodes);

$diskTotal = 5 * 1024 * 1024 * 1024;
function fmtBytes($b) {
    if ($b >= 1073741824) return round($b / 1073741824, 1) . ' GB';
    if ($b >= 1048576) return round($b / 1048576, 1) . ' MB';
    if ($b >= 1024) return round($b / 1024, 1) . ' KB';
    return $b . ' B';
}

$result = [
    'disk' => [
        'used' => $totalBytes,
        'total' => $diskTotal,
        'used_human' => fmtBytes($totalBytes),
        'total_human' => '5 GB',
        'percent' => $diskTotal > 0 ? round(($totalBytes / $diskTotal) * 100, 1) : 0,
    ],
    'inodes' => [
        'used' => $totalInodes,
        'total' => 80000,
        'percent' => round(($totalInodes / 80000) * 100, 1),
    ],
    'bandwidth' => ['used_human' => 'N/A', 'total_human' => 'Unlimited'],
    'hits' => ['used_human' => 'N/A', 'total_human' => '50,000'],
];

file_put_contents($cacheFile, json_encode($result));
header('Content-Type: application/json');
echo json_encode($result);