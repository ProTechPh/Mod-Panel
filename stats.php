<?php
$path = __DIR__;
$cacheFile = $path . '/ftp-stats.json';

$inodes = 0;
$d = opendir($path);
if ($d) {
    while (($f = readdir($d)) !== false) {
        if ($f !== '.' && $f !== '..') $inodes++;
    }
    closedir($d);
}

$result = [
    'disk' => ['used_human' => 'N/A', 'total_human' => '5 GB', 'percent' => 0],
    'inodes' => ['used' => $inodes, 'total' => 80000, 'percent' => round(($inodes / 80000) * 100, 1)],
    'bandwidth' => ['used_human' => 'N/A', 'total_human' => 'Unlimited'],
    'hits' => ['used_human' => 'N/A', 'total_human' => '50,000'],
];

file_put_contents($cacheFile, json_encode($result));
header('Content-Type: application/json');
echo json_encode($result);
