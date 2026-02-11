#!/usr/bin/env python3
"""
Generate assets-manifest.json by scanning the assets/ directory.

Run once after adding or changing assets:
    python3 generate-asset-manifest.py

Produces assets-manifest.json in the project root, listing every file
in assets/ with its relative path, type, and size.
"""

import json
import os
import sys

ASSETS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets')
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets-manifest.json')

TYPE_MAP = {
    'cube': 'lut',
    'mp4': 'video', 'mov': 'video', 'webm': 'video', 'm4v': 'video',
    'png': 'image', 'jpg': 'image', 'jpeg': 'image', 'webp': 'image', 'gif': 'image',
    'mp3': 'audio', 'wav': 'audio', 'aac': 'audio', 'ogg': 'audio', 'm4a': 'audio',
    'prproj': 'preset', 'aep': 'preset', 'mogrt': 'preset', 'prfpset': 'preset', 'ffx': 'preset',
    'ttf': 'font', 'otf': 'font', 'woff': 'font', 'woff2': 'font',
}


def scan_assets():
    if not os.path.isdir(ASSETS_DIR):
        print(f'Error: assets/ directory not found at {ASSETS_DIR}')
        sys.exit(1)

    files = []
    folders = set()

    for root, dirs, filenames in os.walk(ASSETS_DIR):
        # Skip hidden directories
        dirs[:] = [d for d in dirs if not d.startswith('.')]

        for name in sorted(filenames):
            if name.startswith('.'):
                continue
            ext = name.rsplit('.', 1)[-1].lower() if '.' in name else ''
            file_type = TYPE_MAP.get(ext, 'other')
            if file_type == 'other':
                continue

            full_path = os.path.join(root, name)
            rel_path = os.path.relpath(full_path, ASSETS_DIR)
            parent_path = os.path.dirname(rel_path)
            size = os.path.getsize(full_path)

            files.append({
                'path': rel_path,
                'name': name,
                'type': file_type,
                'ext': ext,
                'size': size,
                'parentPath': parent_path,
            })

            # Track top-level folders
            parts = rel_path.split(os.sep)
            if len(parts) > 1:
                folders.add(parts[0])

    return files, sorted(folders)


def main():
    files, folders = scan_assets()

    manifest = {
        'generated': True,
        'assetRoot': 'assets/',
        'totalFiles': len(files),
        'folders': folders,
        'files': files,
    }

    with open(OUTPUT_FILE, 'w') as f:
        json.dump(manifest, f, indent=2)

    print(f'Generated {OUTPUT_FILE}')
    print(f'  {len(files)} assets in {len(folders)} top-level folders')

    # Summary by type
    by_type = {}
    for item in files:
        by_type.setdefault(item['type'], 0)
        by_type[item['type']] += 1
    for t, count in sorted(by_type.items()):
        print(f'  {t}: {count}')


if __name__ == '__main__':
    main()
