#!/bin/bash

# Check if zip file and output file are provided as arguments
if [ $# -ne 2 ]; then
    echo "Usage: $0 input_zip_file output_squashfs_file"
    exit 1
fi

# Assign input zip file and output squashfs file
input_zip="$1"
output_squashfs="$2"

# Create temporary directory
temp_dir=$(mktemp -d)

# Extract contents of the zip file to the temporary directory
unzip "$input_zip" -d "$temp_dir"

# Convert extracted contents to squashfs with specified options
mksquashfs "$temp_dir" "$output_squashfs" -force-uid 500 -force-gid 500 -comp zstd -b 32768 -Xcompression-level 22

# Clean up temporary directory
rm -r "$temp_dir"

echo "Conversion complete. Squashfs file saved to $output_squashfs"
